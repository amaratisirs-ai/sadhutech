/**
 * Snap configuration - controls which snap ID to use
 *
 * MetaMask's wallet_requestSnaps only accepts "npm:<package>" (or "local:<url>"
 * for local Flask dev serving) as a snap ID - an arbitrary https:// bundle URL
 * is NOT a valid snap ID and always fails with "Installation Failed". The old
 * bundleUrl mode below is kept only for reference/rollback; npm is the only
 * scheme that actually works with wallet_requestSnaps.
 */

export const SNAP_CONFIG = {
  // Set NEXT_PUBLIC_USE_REGISTRY_SNAP=false to force the (non-functional)
  // legacy bundle-URL id for debugging; defaults to the real npm snap ID.
  useRegistrySnap: process.env.NEXT_PUBLIC_USE_REGISTRY_SNAP !== "false",

  // Legacy direct bundle URL - NOT a valid wallet_requestSnaps id, do not use.
  bundleUrl: (origin?: string) =>
    `${origin || "https://sadhutech.com"}/snap-bundle.js`,

  // npm registry snap ID (published; still pending MetaMask Snaps Directory
  // allowlisting for endowment:network-access, so install currently only
  // succeeds on MetaMask Flask)
  registrySnapId: "npm:genesis-snap",

  // Get the appropriate snap ID based on configuration
  getSnapId: (origin?: string): string => {
    if (SNAP_CONFIG.useRegistrySnap) {
      return SNAP_CONFIG.registrySnapId;
    }
    return SNAP_CONFIG.bundleUrl(origin);
  },

  // Get display name for UI
  getSnapMode: (): "testing" | "production" => {
    return SNAP_CONFIG.useRegistrySnap ? "production" : "testing";
  },
};
