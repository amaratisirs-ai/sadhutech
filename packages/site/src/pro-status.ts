const PAYMENT_ADDRESS = (process.env.NEXT_PUBLIC_PAYMENT_ADDRESS || "").toLowerCase();
const PAYMENT_CONFIGURED = PAYMENT_ADDRESS.length === 42;

// NEXT_PUBLIC_DEEP_CHECK_ENABLED: "true" forces the deep-check/Pro flow on (still requires
// a valid payment address), "false" forces "coming soon" regardless of configuration.
// Unset: falls back to whether a payment address is configured.
const FLAG = process.env.NEXT_PUBLIC_DEEP_CHECK_ENABLED;

export const DEEP_CHECK_ENABLED = FLAG === "false" ? false : PAYMENT_CONFIGURED;
