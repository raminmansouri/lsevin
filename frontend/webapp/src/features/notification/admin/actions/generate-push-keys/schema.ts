import * as z from "zod/v4";

export const GeneratePushKeysSchema = z.object({
  /** Replacing working keys signs every existing device out of push; it must be asked for. */
  replace: z.boolean().default(false),
});
