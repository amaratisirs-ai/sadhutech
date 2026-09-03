/**
 * Snap configuration - controls which snap ID to use
 * 
 * Development/Testing: Uses direct bundle URL (no registry approval needed)
 * Production (after registry approval): Uses npm:genesis-snap from MetaMask registry
 */

export const SNAP_CONFIG = {
  // Toggle between testing (direct bundle) and production (npm registry)
  // Set to true to use npm:genesis-snap (after MetaMask registry approval)
  // Set to false to use direct bundle URL (for testing)
  useRegistrySnap: process.env.NEXT_PUBLIC_USE_REGISTRY_SNAP === "true",

  // Direct bundle URL (testing mode)
  bundleUrl: (origin?: string) =>
    `${origin || "https://sadhutech-site.vercel.app"}/snap-bundle.js`,

  // npm registry snap ID (production mode - after approval)
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
