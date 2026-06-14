export interface CacheInvalidationRequest {
  tags: string[];
}

export interface TagInvalidationResult {
  tag: string;
  success: boolean;
  error?: string;
}

export interface CacheInvalidationResponse {
  success: boolean;
  message: string;
  invalidatedTags?: TagInvalidationResult[];
  error?: string;
}
