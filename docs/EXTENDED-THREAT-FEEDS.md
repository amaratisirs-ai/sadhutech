/**
 * Extended Threat Feed Integrations
 * 
 * This file documents ADDITIONAL sources beyond the core 6 feeds.
 * These represent community, news, and ecosystem-specific data that can
 * enhance the Hive quorum and provide earlier warnings.
 */

import type { ThreatFeedConfig } from "./api-config.js";

/* ─────────────────────────────────────────────────────────────────────────
   TIER 1: ENTERPRISE SECURITY VENDORS (High Trust, Paid)
   ───────────────────────────────────────────────────────────────────────── */

export const TIER1_ENTERPRISE_FEEDS: Record<string, ThreatFeedConfig> = {
  CERTIK_ALERTS: {
    name: "CertiK Alert System",
    description: "Real-time alerts on smart contract exploits and vulnerability disclosures",
    baseUrl: "https://api.certik.io",
    endpoint: "/v1/alerts",
    method: "GET",
    authType: "api-key",
    apiKeyEnv: "CERTIK_API_KEY",
    rateLimitPerMin: 60,
    queryParams: {
      type: "exploit,vulnerability",
      severity: "medium,high,critical",
    },
    responseFormat: "json",
    addressField: "contractAddress",
    categoryField: "alertType",
    syncIntervalHours: 1,
    trustScore: 92,
    enabled: false, // Requires paid API key
  },

  PECKSHIELD: {
    name: "PeckShield Real-time Threat Intel",
    description: "Blockchain security monitoring and real-time attack detection",
    baseUrl: "https://api.peckshield.com",
    endpoint: "/v1/threats",
    method: "GET",
    authType: "api-key",
    apiKeyEnv: "PECKSHIELD_API_KEY",
    rateLimitPerMin: 30,
    queryParams: {
      category: "exploit,drainer,attack",
    },
    responseFormat: "json",
    addressField: "targetAddress",
    categoryField: "threatType",
    syncIntervalHours: 1,
    trustScore: 88,
    enabled: false, // Premium service
  },

  SLOWMIST: {
    name: "SlowMist Security Alerts",
    description: "Blockchain security incidents and vulnerability tracking",
    baseUrl: "https://api.slowmist.com",
    endpoint: "/v1/incidents",
    method: "GET",
    authType: "api-key",
    apiKeyEnv: "SLOWMIST_API_KEY",
    rateLimitPerMin: 40,
    queryParams: {
      status: "active,confirmed",
    },
    responseFormat: "json",
    addressField: "address",
    categoryField: "incidentType",
    syncIntervalHours: 2,
    trustScore: 85,
    enabled: false,
  },
};

/* ─────────────────────────────────────────────────────────────────────────
   TIER 2: PROTOCOL & DEX-SPECIFIC FEEDS (Free/Open)
   ───────────────────────────────────────────────────────────────────────── */

export const TIER2_PROTOCOL_FEEDS: Record<string, ThreatFeedConfig> = {
  DEFI_LLAMA_HACKS: {
    name: "DefiLlama Hacks Database",
    description: "Comprehensive DeFi hack and exploit database with amounts",
    baseUrl: "https://defillama.com",
    endpoint: "/api/hacks",
    method: "GET",
    authType: "none",
    rateLimitPerMin: 30,
    queryParams: {
      include: "addresses,protocols",
    },
    responseFormat: "json",
    addressField: "exploiterAddress",
    categoryField: "type",
    syncIntervalHours: 6,
    trustScore: 82,
    enabled: true,
  },

  REVOKE_CASH_HISTORY: {
    name: "Revoke.cash Approval History",
    description: "Token approval and revocation history; identifies risky approvals",
    baseUrl: "https://api.revoke.cash",
    endpoint: "/v1/approvals",
    method: "GET",
    authType: "none",
    rateLimitPerMin: 100,
    queryParams: {
      status: "revoked_due_to_exploit",
    },
    responseFormat: "json",
    addressField: "approvedAddress",
    categoryField: "revokeReason",
    syncIntervalHours: 4,
    trustScore: 75,
    enabled: true,
  },

  UNISWAP_GOVERNANCE_ALERTS: {
    name: "Uniswap Governance & Risk Alerts",
    description: "Uniswap Labs' official list of risky tokens and governance issues",
    baseUrl: "https://api.uniswap.org",
    endpoint: "/v1/risk-alerts",
    method: "GET",
    authType: "none",
    rateLimitPerMin: 50,
    queryParams: {},
    responseFormat: "json",
    addressField: "tokenAddress",
    categoryField: "riskType",
    syncIntervalHours: 3,
    trustScore: 80,
    enabled: true,
  },

  OPENSEA_MALICIOUS_COLLECTIONS: {
    name: "OpenSea Malicious Collections",
    description: "OpenSea-reported phishing and honeypot NFT collections",
    baseUrl: "https://api.opensea.io",
    endpoint: "/v2/collections/spam",
    method: "GET",
    authType: "api-key",
    apiKeyEnv: "OPENSEA_API_KEY",
    rateLimitPerMin: 60,
    queryParams: {},
    responseFormat: "json",
    addressField: "contractAddress",
    categoryField: "type",
    syncIntervalHours: 12,
    trustScore: 78,
    enabled: false, // Requires OpenSea API key
  },
};

/* ─────────────────────────────────────────────────────────────────────────
   TIER 3: COMMUNITY-DRIVEN FEEDS (Variable Quality)
   ───────────────────────────────────────────────────────────────────────── */

export const TIER3_COMMUNITY_FEEDS: Record<string, ThreatFeedConfig> = {
  CRYPTOSCAMDB: {
    name: "CryptoScamDB",
    description: "Community-submitted scam and phishing database",
    baseUrl: "https://api.cryptoscamdb.org",
    endpoint: "/v1/scams",
    method: "GET",
    authType: "none",
    rateLimitPerMin: 20,
    queryParams: {
      status: "confirmed",
    },
    responseFormat: "json",
    addressField: "address",
    categoryField: "type",
    syncIntervalHours: 6,
    trustScore: 65, // Lower trust: community-driven, variable quality
    enabled: true,
  },

  REDDIT_R_CRYPTOCURRENCY: {
    name: "r/cryptocurrency Scam Feed",
    description: "Real-time Reddit alerts aggregated from community posts",
    baseUrl: "https://reddit.com",
    endpoint: "/r/cryptocurrency/.json",
    method: "GET",
    authType: "none",
    rateLimitPerMin: 10,
    queryParams: {
      limit: "100",
      t: "day",
    },
    responseFormat: "json",
    addressField: "scamAddress",
    categoryField: "scamType",
    syncIntervalHours: 4,
    trustScore: 40, // Very low: unmoderated, requires filtering
    enabled: false, // Disabled by default: too noisy
  },

  DISCORD_SCAM_ALERTS: {
    name: "Discord Community Alerts",
    description: "Aggregated alerts from major crypto Discord communities",
    baseUrl: "https://discord.com",
    endpoint: "/api/webhooks",
    method: "POST",
    authType: "none",
    rateLimitPerMin: 30,
    queryParams: {},
    responseFormat: "json",
    addressField: "reportedAddress",
    categoryField: "alertType",
    syncIntervalHours: 2,
    trustScore: 35, // Very low: unverified community reports
    enabled: false,
  },

  TWITTER_X_API_ALERTS: {
    name: "Twitter/X Security Alerts",
    description: "Real-time alerts from verified crypto security accounts",
    baseUrl: "https://api.twitter.com",
    endpoint: "/2/tweets/search/recent",
    method: "GET",
    authType: "api-key",
    apiKeyEnv: "TWITTER_BEARER_TOKEN",
    rateLimitPerMin: 300,
    queryParams: {
      query: "from:@CertikAlert OR from:@PeckShield (#scam OR #exploit OR #drainer)",
      max_results: "100",
    },
    responseFormat: "json",
    addressField: "extractedAddress",
    categoryField: "keyword",
    syncIntervalHours: 1,
    trustScore: 50, // Medium: only trusted accounts, but requires NLP extraction
    enabled: false, // Requires Twitter API v2 setup
  },
};

/* ─────────────────────────────────────────────────────────────────────────
   TIER 4: PHISHING & MALWARE FEEDS (General Web Security)
   ───────────────────────────────────────────────────────────────────────── */

export const TIER4_PHISHING_FEEDS: Record<string, ThreatFeedConfig> = {
  PHISHTANK: {
    name: "PhishTank",
    description: "Community-verified phishing URLs and domains",
    baseUrl: "https://phishtank.com",
    endpoint: "/api_verify.php",
    method: "GET",
    authType: "none",
    rateLimitPerMin: 15,
    queryParams: {
      format: "json",
      valid: "y",
    },
    responseFormat: "json",
    addressField: "url",
    categoryField: "phishing_target",
    syncIntervalHours: 12,
    trustScore: 70,
    enabled: false, // Detects phishing URLs, not on-chain addresses
  },

  OPENPHISH: {
    name: "OpenPhish",
    description: "Automated phishing detection and reporting",
    baseUrl: "https://openphish.com",
    endpoint: "/feed.txt",
    method: "GET",
    authType: "none",
    rateLimitPerMin: 20,
    queryParams: {},
    responseFormat: "ndjson",
    addressField: "url",
    categoryField: "phishing",
    syncIntervalHours: 4,
    trustScore: 72,
    enabled: false,
  },

  URLHAUS: {
    name: "URLhaus Malware Database",
    description: "Malware hosting URLs and distribution sites",
    baseUrl: "https://api.abuse.ch",
    endpoint: "/v1/urlhaus/urls/download/malware_urls",
    method: "GET",
    authType: "none",
    rateLimitPerMin: 10,
    queryParams: {
      limit: "10000",
    },
    responseFormat: "csv",
    addressField: "url",
    categoryField: "malware_family",
    syncIntervalHours: 24,
    trustScore: 75,
    enabled: false,
  },

  METAMASK_PHISHING_LIST: {
    name: "MetaMask Approved Phishing List",
    description: "MetaMask's built-in phishing detection list",
    baseUrl: "https://phishing-filter-server.metaswap.org",
    endpoint: "/v1/phishingfilter",
    method: "GET",
    authType: "none",
    rateLimitPerMin: 60,
    queryParams: {},
    responseFormat: "json",
    addressField: "address",
    categoryField: "type",
    syncIntervalHours: 6,
    trustScore: 85,
    enabled: true,
  },
};

/* ─────────────────────────────────────────────────────────────────────────
   TIER 5: BLOCKCHAIN FORENSICS (Premium/Enterprise)
   ───────────────────────────────────────────────────────────────────────── */

export const TIER5_FORENSICS_FEEDS: Record<string, ThreatFeedConfig> = {
  BLOCKCHAIN_COM_ALERTS: {
    name: "Blockchain.com Forensics",
    description: "Enterprise blockchain forensics and transaction tracking",
    baseUrl: "https://api.blockchain.com",
    endpoint: "/v3/alerts/threats",
    method: "GET",
    authType: "api-key",
    apiKeyEnv: "BLOCKCHAIN_COM_API_KEY",
    rateLimitPerMin: 60,
    queryParams: {
      type: "exploit,fraud,theft",
    },
    responseFormat: "json",
    addressField: "address",
    categoryField: "threatType",
    syncIntervalHours: 2,
    trustScore: 89,
    enabled: false,
  },

  TRMLABS_TRANSACTION_INTEL: {
    name: "TRM Labs Transaction Intel",
    description: "Real-time transaction risk scoring and compliance data",
    baseUrl: "https://api.trmlabs.com",
    endpoint: "/v1/transaction/risk",
    method: "POST",
    authType: "api-key",
    apiKeyEnv: "TRM_API_KEY",
    rateLimitPerMin: 1000,
    queryParams: {},
    responseFormat: "json",
    addressField: "address",
    categoryField: "riskCategory",
    syncIntervalHours: 1,
    trustScore: 90,
    enabled: false,
  },

  ELLIPTIC_COMPLIANCE: {
    name: "Elliptic Compliance & Investigation",
    description: "Premium compliance and AML data for blockchain",
    baseUrl: "https://api.elliptic.co",
    endpoint: "/v1/assets/check",
    method: "POST",
    authType: "api-key",
    apiKeyEnv: "ELLIPTIC_API_KEY",
    rateLimitPerMin: 100,
    queryParams: {},
    responseFormat: "json",
    addressField: "address",
    categoryField: "risk",
    syncIntervalHours: 12,
    trustScore: 94,
    enabled: false,
  },
};

/* ─────────────────────────────────────────────────────────────────────────
   STRATEGY: How to safely integrate community feeds
   ───────────────────────────────────────────────────────────────────────── */

export const FEED_INTEGRATION_STRATEGY = {
  /**
   * Trust Scoring System:
   * - 90+: Use immediately, high weight in quorum
   * - 80-89: Use, medium weight in quorum
   * - 70-79: Use cautiously, lower weight, require 2x reporters
   * - 60-69: Use only if 3+ independent community sources agree
   * - <60: Disabled by default, enable only for high-sensitivity customers
   */
  trustTiers: {
    enterprise: { min: 85, weight: 20, enabled: true },
    protocol: { min: 75, weight: 10, enabled: true },
    community: { min: 60, weight: 5, enabled: false },
    phishing: { min: 70, weight: 8, enabled: true },
    forensics: { min: 85, weight: 15, enabled: false },
  },

  /**
   * Data Quality Filters:
   * Apply before adding to threat intel
   */
  dataQualityChecks: {
    /** Must be valid Ethereum address format */
    validateAddressFormat: true,
    /** Remove if report is older than X days */
    maxAgeHours: 7 * 24, // 1 week
    /** Deduplicate across feeds */
    deduplicateByAddress: true,
    /** Cross-check with whitelisted projects */
    skipKnownVerified: true,
    /** Require minimum of N independent sources for low-trust feeds */
    communityQuorumThreshold: 3,
  },

  /**
   * Signal-to-Noise Management:
   * Balance false positives against detection coverage
   */
  noiseReduction: {
    /** Only use top N trending alerts from Reddit/Twitter */
    socialMediaTopN: 50,
    /** Filter by verified account badges only */
    twitterVerifiedOnly: true,
    /** Cluster similar reports to avoid spam */
    clusterSimilarReports: true,
    /** Require geographic diversity in community reports */
    geographicDiversity: true,
  },

  /**
   * Real-time vs Batch Processing
   */
  processingStrategy: {
    /** Enterprise feeds: real-time (webhook/streaming) */
    enterprisePull: "realtime",
    /** Protocol feeds: hourly sync */
    protocolPull: "hourly",
    /** Community feeds: 6-hourly (reduce noise) */
    communityPull: "6hourly",
    /** Phishing feeds: 4-hourly */
    phishingPull: "4hourly",
  },
};

/* ─────────────────────────────────────────────────────────────────────────
   IMPLEMENTATION: Multi-Source Quorum Voting
   ───────────────────────────────────────────────────────────────────────── */

/**
 * An address is confirmed as a threat when ONE of:
 * 
 * 1. Enterprise source reports it (instant confirm)
 *    - CertiK, PeckShield, SlowMist, Chainalysis
 * 
 * 2. Three protocol sources report it
 *    - DefiLlama + Uniswap + Revoke.cash
 * 
 * 3. Five community sources report it
 *    - CryptoScamDB + Twitter + Discord + Reddit + (1 more)
 * 
 * 4. One enterprise + one protocol + one community
 *    - Consensus across tiers
 * 
 * This prevents:
 * ✅ False positives from noisy community feeds
 * ✅ Gaming the system (would need 5+ fake accounts)
 * ✅ Over-reliance on single source
 * ✅ Excessive WARN verdicts from low-trust sources
 */

export const QUORUM_VOTING_RULES = {
  enterprise: {
    trustScore: 85,
    weight: 20,
    autoConfirm: true, // Single enterprise source = confirmed
  },
  protocol: {
    trustScore: 75,
    weight: 10,
    requiredCount: 3, // Need 3 protocol sources
  },
  community: {
    trustScore: 60,
    weight: 5,
    requiredCount: 5, // Need 5 community sources
  },
  mixed: {
    description: "1 enterprise + 1 protocol + 1 community = confirmed",
    weights: [20, 10, 5],
    minTotal: 35,
  },
};

/* ─────────────────────────────────────────────────────────────────────────
   EXAMPLE: Processing a Community Report with Multi-Source Verification
   ───────────────────────────────────────────────────────────────────────── */

/**
 * User/bot reports: "0x7f367cc4... is a drainer"
 * 
 * GENESIS checks:
 * 1. Does Chainalysis have it? → YES (auto confirm)
 * 2. Does Rekt Database have it? → YES
 * 3. Does CertiK have it? → YES
 * 4. Does DefiLlama have it? → YES
 * 5. Do 3+ community sources have it? → YES
 * 
 * Result:
 * ✅ CONFIRMED: Drainer (multiple independent sources agree)
 * ⚠️ WARN → BLOCK transition (based on user's autonomy level)
 */

export const EXAMPLE_MULTI_SOURCE_CONFIRMATION = {
  address: "0x7f367cc41522ce07afd9291ff41ee04aaf1dbd14",
  reports: {
    enterprise: {
      chainalysis: { confirmed: true, weight: 20 },
      certik: { confirmed: true, weight: 20 },
    },
    protocol: {
      defiLlama: { confirmed: true, weight: 10 },
      revokeCash: { confirmed: true, weight: 10 },
      uniswap: { confirmed: true, weight: 10 },
    },
    community: {
      cryptoScamDB: { confirmed: true, weight: 5 },
      twitterSecurityAccounts: { confirmed: true, weight: 5 },
      redditAlerts: { confirmed: true, weight: 5 },
      discordCommunity: { confirmed: true, weight: 5 },
      amberlAlerts: { confirmed: true, weight: 5 },
    },
  },
  totalWeight: 115,
  minimumRequired: 35,
  confidence: 99,
  verdict: "BLOCK",
  reason: "Confirmed drainer with 7+ independent sources across tiers",
};
