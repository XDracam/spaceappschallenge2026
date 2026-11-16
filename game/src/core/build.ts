// Vite injects a deterministic source/content hash for production deployments.
// Protocol changes deliberately invalidate older open tabs before state adoption.
declare const __MC_BUILD_ID__: string;
export const COMPATIBILITY_ID = `2:${__MC_BUILD_ID__}`;
