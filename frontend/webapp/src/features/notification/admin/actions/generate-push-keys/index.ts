"use server";

import webpush from "web-push";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import type { LocaleHeaderTypes } from "@/types/common";
import { getChannelConfig, saveChannelConfig } from "@/features/notification/server/channel.repository";

import { GeneratePushKeysSchema } from "./schema";
import type { InputType, ReturnType } from "./types";

/**
 * Creates the web push (VAPID) key pair on the server and stores it on the push channel.
 * The private key never leaves the server; only the public key is returned. Existing keys
 * are kept unless `replace` is set, because new keys invalidate every device subscription.
 */
const handler = async (input: InputType, _token: string, userId: string, _locale: LocaleHeaderTypes): Promise<ReturnType> => {
  try {
    const current = await getChannelConfig("push", true);
    if (!current) throw new Error("The push channel does not exist.");
    if (current.settings.vapidPrivateKey && current.settings.vapidPublicKey && !input.replace) {
      return { data: undefined, error: { title: "Push keys already exist", status: 409, detail: "Keys are already configured. Replacing them signs every device out of push." }, payload: input };
    }
    const keys = webpush.generateVAPIDKeys();
    await saveChannelConfig({
      code: "push",
      isEnabled: current.isEnabled,
      settings: { ...current.settings, vapidPublicKey: keys.publicKey, vapidPrivateKey: keys.privateKey, vapidSubject: current.settings.vapidSubject || "mailto:admin@lsevin.com" },
      updatedBy: userId,
    });
    return { data: { publicKey: keys.publicKey }, error: undefined, payload: input };
  } catch (error) {
    return { data: undefined, error: { title: "Unable to create push keys", status: 500, detail: error instanceof Error ? error.message : "Please try again." }, payload: input };
  }
};

export const generatePushKeysAction = createAuthenticatedSafeAction(GeneratePushKeysSchema, handler, { adminRequired: true });
