# MetaMask Snap Store Registration Guide

This document outlines the steps to publish the GENESIS Firewall Snap to npm and register it on the MetaMask Snap Directory.

## Prerequisites

- ✅ Snap package.json configured (DONE)
- ✅ README.md created (DONE)
- ✅ snap.manifest.json with correct metadata (DONE)
- ✅ Snap builds cleanly (DONE)
- ✅ All tests passing (DONE)
- 📋 npm account with @genesis organization access
- 📋 MetaMask Snaps Directory account

## Step 1: npm Login (Manual)

```bash
npm login
# You'll be prompted to enter:
# - username
# - password
# - email
# - OTP (if 2FA enabled)
```

**Current Status:** ⚠️ Not logged in. You must complete this manually.

## Step 2: Publish to npm

Once authenticated, run:

```bash
cd /Users/sitaram/Documents/sadhutech
pnpm --filter @genesis/snap publish
```

This will:
1. Increment version in package.json
2. Tag the release on GitHub
3. Publish @genesis/snap@0.0.1 to npm registry
4. Create GitHub release

**Expected output:**
```
> @genesis/snap publish
npm notice Publishing @genesis/snap@0.0.1
npm notice
+ @genesis/snap@0.0.1
```

## Step 3: Register on MetaMask Snap Directory

### 3a. Create Snap Directory Account
1. Go to https://snaps.metamask.io
2. Click "Submit Snap"
3. Sign in with GitHub (recommended)

### 3b. Register the Snap
1. Package name: `@genesis/snap`
2. npm registry: `https://registry.npmjs.org/`
3. Snap version: `0.0.1`
4. Icon: Upload `packages/snap/images/icon.svg`
5. Website: `https://sadhutech-site.vercel.app`
6. Source code: `https://github.com/amaratisirs-ai/sadhutech`

### 3c. Complete Registration
1. MetaMask will verify the snap can be installed
2. Wait for approval (usually 24-48 hours)
3. Once approved, snap appears in directory

**Directory listing URL (after approval):**
```
https://snaps.metamask.io/snap/@genesis/snap
```

## Step 4: Update /snap-install Page

After registration, update the installation button to link to MetaMask Directory:

```typescript
// packages/site/app/snap-install/page.tsx
const handleInstallSnap = async () => {
  try {
    const response = await window.ethereum?.request({
      method: 'wallet_requestSnaps',
      params: {
        '@genesis/snap': {
          version: '0.0.1', // Or use 'latest'
        },
      },
    });
    // Handle response
  } catch (error) {
    console.error('Snap installation failed:', error);
  }
};
```

Or use MetaMask's official installation button:

```html
<a href="https://snaps.metamask.io/snap/@genesis/snap" target="_blank">
  Install GENESIS Firewall Snap
</a>
```

## Publishing Checklist

- [ ] npm login completed
- [ ] pnpm publish successful
- [ ] @genesis/snap@0.0.1 on npm registry
- [ ] MetaMask Directory account created
- [ ] Snap registered on Directory
- [ ] Snap approved by MetaMask
- [ ] /snap-install page updated
- [ ] Test installation from MetaMask Directory
- [ ] Update website to reference Directory link

## Versioning Strategy

When publishing updates:

```bash
# Patch (bug fixes): 0.0.2
pnpm version patch
pnpm publish

# Minor (new features): 0.1.0
pnpm version minor
pnpm publish

# Major (breaking changes): 1.0.0
pnpm version major
pnpm publish
```

## Troubleshooting

### "npm error code E403 Forbidden"
- Check that @genesis/snap is scoped to your organization
- Verify you have publish permissions
- Ensure 2FA is not blocking the publish

### "snap.manifest.json shasum mismatch"
- Run `pnpm build` to regenerate the bundle
- The manifest shasum will auto-update

### "MetaMask cannot verify the snap"
- Ensure snap builds cleanly: `pnpm build`
- Verify permissions in snap.manifest.json
- Check that bundle is correctly formatted

## Support

- 📖 MetaMask Snaps Docs: https://docs.metamask.io/snaps/
- 🔗 npm Publishing Docs: https://docs.npmjs.com/
- 🐛 GENESIS Issues: https://github.com/amaratisirs-ai/sadhutech/issues

---

**Next Steps:**
1. Run `npm login` to authenticate with npm
2. Run `pnpm --filter @genesis/snap publish` to publish
3. Register on MetaMask Snap Directory
4. Return to this doc to complete remaining steps
