import "server-only";

import { jwtDecode } from "jwt-decode";
import type { JWT } from "next-auth/jwt";

import { env } from "@/config/env/client";
import { IDENTITY_MODULE_BASE_PATH } from "@/features/shared/types/constants";

// Cache for ongoing refresh operations to prevent race conditions
const refreshPromises = new Map<string, Promise<JWT>>();

// Track refresh attempts to implement backoff
const refreshAttempts = new Map<string, number>();

/**
 * Check if running in Vercel/serverless environment
 */
const isServerless = () => {
  return (
    process.env.VERCEL === "1" ||
    process.env.VERCEL_ENV !== undefined ||
    process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined
  );
};

/**
 * Generate a unique key for deduplication based on user ID and refresh token
 */
const getRefreshKey = (token: JWT): string => {
  if (!token.user?.id || !token.user?.refreshToken) {
    throw new Error("Invalid token structure for refresh key generation");
  }

  // Use user ID and last 10 characters of refresh token for uniqueness
  // This avoids storing the full refresh token in the key
  const refreshTokenSuffix = token.user.refreshToken.slice(-10);
  return `${token.user.id}:${refreshTokenSuffix}`;
};

/**
 * Cleanup completed refresh operations from cache
 */
const cleanupRefreshPromise = (key: string) => {
  refreshPromises.delete(key);
};

/**
 * Add jitter to prevent thundering herd problem
 */
const addJitter = (delay: number, factor = 0.2): number => {
  const jitter = Math.random() * delay * factor;
  return delay + jitter;
};

/**
 * Actual token refresh implementation - makes HTTP request to backend
 * Each call gets its own isolated response to prevent "body already read" errors
 */
const performTokenRefresh = async (
  token: JWT,
  attemptNumber = 0
): Promise<JWT> => {
  // Create a unique request ID for debugging
  const requestId = `${token.user?.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    // In serverless, add small random delay to reduce concurrent attempts
    if (isServerless() && attemptNumber === 0) {
      const initialDelay = addJitter(100, 0.5); // 100-150ms random delay
      await new Promise((resolve) => setTimeout(resolve, initialDelay));
    }

    console.log(
      `🔄 [${requestId}] Starting token refresh for user: ${token.user?.id} (attempt ${attemptNumber + 1})`
    );

    // Create request body once to avoid any serialization issues
    const requestBody = JSON.stringify({
      accessToken: token.user.accessToken,
      refreshToken: token.user.refreshToken,
    });

    const response = await fetch(
      `${env.NEXT_PUBLIC_API_URL}/${IDENTITY_MODULE_BASE_PATH}/identity/refresh`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-Id": requestId, // Add request ID for tracing
        },
        body: requestBody,
        cache: "no-store",
      }
    );

    // Handle rate limiting WITHOUT reading the body
    if (response.status === 429) {
      if (attemptNumber < 3) {
        const retryAfter = response.headers.get("Retry-After");
        const delay = retryAfter
          ? parseInt(retryAfter) * 1000
          : addJitter(1000 * Math.pow(2, attemptNumber));

        console.log(
          `⏰ [${requestId}] Rate limited, retrying after ${delay}ms`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));

        return performTokenRefresh(token, attemptNumber + 1);
      }
      throw new Error(`Rate limited after ${attemptNumber} attempts`);
    }

    // Check status before trying to read body
    if (!response.ok) {
      console.error(
        `❌ [${requestId}] Token refresh failed with status: ${response.status}`
      );
      throw new Error(`Failed to refresh token: ${response.status}`);
    }

    // Read body exactly once
    let data;
    try {
      const responseText = await response.text(); // Read as text first
      data = JSON.parse(responseText); // Then parse
    } catch (error) {
      console.error(
        `❌ [${requestId}] Failed to parse refresh response:`,
        error
      );
      throw new Error("Failed to parse refresh response");
    }

    // Validate response data
    if (!data || typeof data !== "object") {
      console.error(`❌ [${requestId}] Invalid response data`);
      throw new Error("Invalid response format");
    }

    if (!data.accessToken) {
      console.error(`❌ [${requestId}] No access token in response`);
      throw new Error("No access token returned");
    }

    // Decode the new access token to get its expiry
    let decodedToken;
    try {
      decodedToken = jwtDecode(data.accessToken);
    } catch (error) {
      console.error(`❌ [${requestId}] Failed to decode access token:`, error);
      throw new Error("Invalid access token format");
    }

    console.log(
      `✅ [${requestId}] Token refresh successful for user: ${token.user?.id}`
    );

    // Return new token data
    return {
      ...token,
      user: {
        ...token.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken || token.user.refreshToken, // Fallback to old refresh token if not provided
        accessTokenExpires: (decodedToken.exp || 0) * 1000,
      },
    };
  } catch (error) {
    console.error(`❌ [${requestId}] Error refreshing access token:`, error);

    // Retry on network errors in serverless
    if (isServerless() && attemptNumber < 2) {
      const retryDelay = addJitter(500 * Math.pow(2, attemptNumber));
      console.log(`🔄 [${requestId}] Retrying after error (${retryDelay}ms)`);
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      return performTokenRefresh(token, attemptNumber + 1);
    }

    throw error; // Re-throw to be handled by the calling code
  }
};

/**
 * Deduplicated token refresh function
 * Ensures only one refresh operation per user/token combination
 * Handles both local and serverless environments
 */
export const refreshAccessTokenWithDeduplication = async (
  token: JWT
): Promise<JWT> => {
  const refreshKey = getRefreshKey(token);

  try {
    // Check if there's already a refresh in progress for this key
    const existingPromise = refreshPromises.get(refreshKey);
    if (existingPromise) {
      console.log(
        `⏳ Token refresh already in progress (same instance) for user: ${token.user?.id}, waiting...`
      );
      // Return a new Promise that resolves to the result to avoid sharing the same object
      return await Promise.resolve(existingPromise);
    }

    // Track attempt count for this key
    const attemptCount = refreshAttempts.get(refreshKey) || 0;

    // In serverless, if we've seen multiple attempts quickly, add backoff
    if (isServerless() && attemptCount > 0) {
      const backoffDelay = addJitter(
        Math.min(1000 * Math.pow(2, attemptCount), 5000)
      );
      console.log(
        `⏱️ Backing off ${backoffDelay}ms due to ${attemptCount} recent attempts`
      );
      await new Promise((resolve) => setTimeout(resolve, backoffDelay));
    }

    refreshAttempts.set(refreshKey, attemptCount + 1);

    // Clean up attempt counter after 10 seconds
    setTimeout(() => refreshAttempts.delete(refreshKey), 10000);

    console.log(
      `🚀 Initiating new token refresh for user: ${token.user?.id} (env: ${isServerless() ? "serverless" : "local"})`
    );

    // Create new refresh promise with cleanup
    // Wrap in a new Promise to ensure isolation
    const refreshPromise = new Promise<JWT>((resolve, reject) => {
      performTokenRefresh(token)
        .then((result) => {
          // Create a deep copy of the result to prevent sharing mutable objects
          const resultCopy = JSON.parse(JSON.stringify(result));
          resolve(resultCopy);
        })
        .catch((error) => {
          reject(error);
        })
        .finally(() => {
          // Always clean up the cache when done
          cleanupRefreshPromise(refreshKey);
        });
    });

    // Store the promise in cache
    refreshPromises.set(refreshKey, refreshPromise);

    return await refreshPromise;
  } catch (error) {
    console.error(
      `❌ Token refresh with deduplication failed for ${refreshKey}:`,
      error
    );

    // Clean up on error
    cleanupRefreshPromise(refreshKey);

    // Return token with error state for NextAuth to handle
    return {
      ...token,
      error: "RefreshTokenError",
    };
  }
};

/**
 * Get current cache stats for debugging
 */
export const getRefreshCacheStats = () => {
  return {
    activeRefreshOperations: refreshPromises.size,
    refreshKeys: Array.from(refreshPromises.keys()),
  };
};

/**
 * Clear all cached refresh operations (mainly for testing)
 */
export const clearRefreshCache = () => {
  refreshPromises.clear();
};
