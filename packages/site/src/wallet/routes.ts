export function requiresWalletRuntime(pathname: string): boolean {
  return /^\/(check|pro|admin|extension-connect)(\/|$)/.test(pathname);
}