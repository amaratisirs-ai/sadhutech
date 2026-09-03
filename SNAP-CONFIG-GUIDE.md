# Snap ID Configuration Guide

## How It Works

The snap installation uses an **environment variable** to switch between testing and production modes:

- **Testing (Default):** Direct bundle URL - works immediately for testing
- **Production:** npm registry snap - official MetaMask registry approval required

## Environment Variable

```bash
NEXT_PUBLIC_USE_REGISTRY_SNAP=true|false
```

**Type:** Boolean string (case-sensitive)
- `"true"` → Uses `npm:genesis-snap` from MetaMask registry
- `"false"` or unset → Uses direct bundle at `sadhutech-site.vercel.app/snap-bundle.js`

## Switching Modes

### Current Setup (Development Testing)
No action needed. Defaults to direct bundle URL testing.

```bash
# Environment variable NOT set (default)
# Snap ID: https://sadhutech-site.vercel.app/snap-bundle.js
```

### For sadhutech.com Launch (After Registry Approval)
Set environment variable before deployment:

```bash
# .env.local (for local testing)
NEXT_PUBLIC_USE_REGISTRY_SNAP=true

# Or for production on Vercel:
# Go to Vercel Dashboard → Settings → Environment Variables
# Add: NEXT_PUBLIC_USE_REGISTRY_SNAP=true
```

Then deploy:
```bash
git add .env.local  # If committing locally
git commit -m "chore: enable registry snap for production"
git push origin main  # Vercel auto-deploys
```

## Banner Changes Automatically

The snap-install page shows different banners based on mode:

**Testing Mode:**
```
🧪 Testing Mode: Direct bundle testing. Switch to NEXT_PUBLIC_USE_REGISTRY_SNAP=true when registry approved.
```

**Production Mode:**
```
✅ Production Mode: Using official MetaMask registry snap.
```

## Deployment Timeline

1. **Now (Dev Testing):** Keep default (direct bundle)
2. **Registry Submitted:** Submit to https://snaps.metamask.io/submit with sadhutech.com URL
3. **Registry Approved (24-48 hours):** Set `NEXT_PUBLIC_USE_REGISTRY_SNAP=true` on Vercel
4. **After Domain Launch:** Update to sadhutech.com and redeploy

## Implementation Details

**Config File:** `packages/site/config/snap-config.ts`

```typescript
export const SNAP_CONFIG = {
  useRegistrySnap: process.env.NEXT_PUBLIC_USE_REGISTRY_SNAP === "true",
  bundleUrl: (origin?: string) => `${origin}/snap-bundle.js`,
  registrySnapId: "npm:genesis-snap",
  getSnapId: (origin?: string): string => { /* ... */ },
  getSnapMode: (): "testing" | "production" => { /* ... */ },
};
```

**Usage in Page:** `packages/site/app/snap-install/page.tsx`

```typescript
import { SNAP_CONFIG } from "@/config/snap-config";

// Get appropriate snap ID
const snapId = SNAP_CONFIG.getSnapId(window.location.origin);

// Get current mode for UI
const mode = SNAP_CONFIG.getSnapMode();  // "testing" or "production"
```

## Zero Code Changes Needed

No code changes required when switching modes. Just set the environment variable and redeploy. The configuration handles the rest.
