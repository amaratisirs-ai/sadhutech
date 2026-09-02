/**
 * GENESIS SDK Client
 *
 * Centralized client for interacting with GENESIS Gate APIs with security features:
 * - Automatic request signing
 * - Retry logic with exponential backoff
 * - Local caching of threat data
 * - Nonce-based replay prevention
 * - Error handling and telemetry
 */

import {
  DEFAULT_CLIENT_SDK_CONFIG,
  GENESIS_GATE_APIS,
  API_ERROR_CODES,
  signRequest,
  type ClientSDKConfig,
  type AnalyzeRequest,
  type ReportRequest,
  type RiskAssessment,
  type ThreatEntry,
} from "@genesis/shared";

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class GenesisSDKClient {
  private readonly config: ClientSDKConfig;
  private readonly threatCache = new Map<string, CacheEntry<ThreatEntry>>();
  private readonly requestCache = new Map<string, CacheEntry<unknown>>();

  constructor(config: Partial<ClientSDKConfig> = {}) {
    this.config = { ...DEFAULT_CLIENT_SDK_CONFIG, ...config };
  }

  /**
   * Analyze a transaction before signing
   */
  async analyzeTransaction(
    request: AnalyzeRequest,
    options?: { bypassCache?: boolean }
  ): Promise<RiskAssessment> {
    const cacheKey = this.getCacheKey("analyze", request);
    const cached = this.requestCache.get(cacheKey);

    if (!options?.bypassCache && cached && this.isCacheValid(cached)) {
      return cached.data as RiskAssessment;
    }

    try {
      const response = await this.request(
        GENESIS_GATE_APIS.ANALYZE,
        request,
        { requiresSignature: false }
      );

      const result = response as RiskAssessment;

      if (this.config.cacheThreatsLocally) {
        this.requestCache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
        });
      }

      return result;
    } catch (error) {
      throw this.handleError(error, "Transaction analysis failed");
    }
  }

  /**
   * Report a malicious address to the community
   */
  async reportThreat(request: ReportRequest): Promise<ThreatEntry> {
    try {
      return await this.request(
        GENESIS_GATE_APIS.REPORT,
        request,
        { requiresSignature: true }
      ) as ThreatEntry;
    } catch (error) {
      throw this.handleError(error, "Threat report submission failed");
    }
  }

  /**
   * Batch check multiple addresses
   */
  async checkThreats(addresses: string[]): Promise<ThreatEntry[]> {
    const cacheKey = this.getCacheKey("batch-threats", { addresses });
    const cached = this.requestCache.get(cacheKey);

    if (cached && this.isCacheValid(cached)) {
      return cached.data as ThreatEntry[];
    }

    try {
      const payload = { addresses };
      const response = await this.request(
        GENESIS_GATE_APIS.THREATS_BATCH,
        payload,
        { requiresSignature: false }
      );

      const results = response as ThreatEntry[];

      // Cache individual entries
      for (const entry of results) {
        this.threatCache.set(entry.address.toLowerCase(), {
          data: entry,
          timestamp: Date.now(),
        });
      }

      return results;
    } catch (error) {
      throw this.handleError(error, "Batch threat check failed");
    }
  }

  /**
   * Check service health
   */
  async getHealth(): Promise<{ status: string; service: string }> {
    try {
      return await this.request(GENESIS_GATE_APIS.HEALTH, {}) as any;
    } catch (error) {
      throw this.handleError(error, "Health check failed");
    }
  }

  /**
   * Core request handler with retry logic and security features
   */
  private async request(
    apiConfig: any,
    payload: unknown,
    options?: { requiresSignature?: boolean; retryCount?: number }
  ): Promise<unknown> {
    const maxRetries = this.config.maxRetries;
    let attempt = 0;
    let lastError: any;

    while (attempt < maxRetries) {
      try {
        const url = `${this.config.gateUrl}${apiConfig.path}`;
        const headers: Record<string, string> = {
          "content-type": "application/json",
        };

        // Add security headers
        const nonce = Math.random().toString(36).substring(7);
        headers["x-nonce"] = nonce;

        // Add request signature if required
        if (options?.requiresSignature && this.config.signRequests) {
          const sigHeader = signRequest(payload, nonce);
          headers["x-signature"] = sigHeader.signature;
          headers["x-timestamp"] = sigHeader.timestamp;
        }

        const response = await fetch(url, {
          method: apiConfig.method,
          headers,
          body: apiConfig.method !== "GET" ? JSON.stringify(payload) : undefined,
          signal: AbortSignal.timeout(this.config.gateTimeoutMs),
        });

        // Handle errors
        if (!response.ok) {
          const errorData = (await response.json().catch(() => ({}))) as Record<string, unknown>;
          const errorCode = errorData.code as string || `HTTP_${response.status}`;

          if (response.status === 429) {
            // Rate limited, retry with exponential backoff
            attempt++;
            await this.sleep(this.config.retryBackoffMs * Math.pow(2, attempt - 1));
            continue;
          }

          if (response.status >= 500) {
            // Server error, retry
            attempt++;
            await this.sleep(this.config.retryBackoffMs * Math.pow(2, attempt - 1));
            continue;
          }

          const errorMsg = (errorData.error as string) || response.statusText;
          throw new Error(`${errorCode}: ${errorMsg}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error;
        attempt++;

        if (attempt < maxRetries && this.isRetryable(error)) {
          await this.sleep(this.config.retryBackoffMs * Math.pow(2, attempt - 1));
          continue;
        }

        break;
      }
    }

    throw lastError || new Error("Request failed after all retries");
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryable(error: unknown): boolean {
    if (error instanceof TypeError && error.message.includes("abort")) {
      return true; // Timeout, retry
    }
    if (error instanceof Error && error.message.includes("ECONNREFUSED")) {
      return true; // Connection refused, retry
    }
    return false;
  }

  /**
   * Cache utilities
   */
  private isCacheValid(entry: CacheEntry<unknown>): boolean {
    const ageMinutes = (Date.now() - entry.timestamp) / 1000 / 60;
    return ageMinutes < this.config.cacheTTLMinutes;
  }

  private getCacheKey(operation: string, payload: unknown): string {
    return `${operation}:${JSON.stringify(payload)}`;
  }

  /**
   * Error handling with user-friendly messages
   */
  private handleError(error: unknown, context: string): Error {
    if (error instanceof Error) {
      return new Error(`${context}: ${error.message}`);
    }
    return new Error(`${context}: ${String(error)}`);
  }

  /**
   * Utility: sleep for specified ms
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Clear caches
   */
  clearCache(): void {
    this.threatCache.clear();
    this.requestCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { threatCount: number; requestCount: number } {
    return {
      threatCount: this.threatCache.size,
      requestCount: this.requestCache.size,
    };
  }
}

/**
 * Factory function for creating a preconfigured client
 */
export function createGenesisClient(config?: Partial<ClientSDKConfig>): GenesisSDKClient {
  return new GenesisSDKClient(config);
}

/**
 * Example usage:
 * 
 * const client = createGenesisClient({
 *   gateUrl: "http://localhost:8787",
 *   autonomy: "enforce",
 * });
 *
 * const analysis = await client.analyzeTransaction({
 *   tx: {
 *     chainId: 1,
 *     from: "0x...",
 *     to: "0x...",
 *     data: "0x...",
 *   },
 * });
 *
 * if (analysis.verdict === "block") {
 *   console.warn("Blocked:", analysis.plainEnglish);
 * }
 */
