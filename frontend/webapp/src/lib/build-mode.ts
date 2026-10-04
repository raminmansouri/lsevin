export type BuildMode = "production" | "fast";

export function getBuildMode(value = process.env.BUILD_MODE): BuildMode {
  const mode = value?.trim().toLowerCase() || "production";
  if (mode === "production" || mode === "fast") return mode;
  throw new Error(`Unsupported BUILD_MODE "${value}". Expected "production" or "fast".`);
}

export function isFastBuild(value = process.env.BUILD_MODE) {
  return getBuildMode(value) === "fast";
}
