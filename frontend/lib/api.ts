const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

export type TokenSummary = {
  creator: string;
  tokenAddress: string;
  curveAddress: string;
  lockerAddress: string;
  ltAddress: string;
  usdcAddress: string;
  poolAddress: string;
  name: string;
  symbol: string;
  imageUri: string;
  description: string;
  createdAt: number;
  graduated: boolean;
  shouldGraduate: boolean;
  tokenPrice: string;
  ltPrice: string;
  realReserveX: string;
  realReserveY: string;
  virtualReserveX: string;
  virtualReserveY: string;
  sold: string;
  ltUsdValue: string;
  progressBps: number;
  graduationLiquidityToken: string;
  graduationLiquidityLt: string;
};

export async function apiFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  const payload = await response.json();
  return payload.data;
}

export async function getTokens(status?: "live" | "graduated") {
  const search = status ? `?status=${status}` : "";
  return apiFetch<TokenSummary[]>(`/api/tokens${search}`);
}

export async function getToken(curve: string) {
  return apiFetch<TokenSummary>(`/api/tokens/${curve}`);
}

export async function getTrades(curve: string) {
  return apiFetch<
    Array<{
      txHash: string;
      type: "buy" | "sell";
      account: string;
      usdcIn: string;
      usdcOut: string;
      ltAmount: string;
      tokenAmount: string;
      tokenPrice: string;
      blockNumber: number;
    }>
  >(`/api/tokens/${curve}/trades`);
}

export async function getMarketOverview() {
  return apiFetch<{ totalTokens: number; liveTokens: number; graduatedTokens: number }>("/api/market/overview");
}

export async function getLeveragedTokens() {
  return apiFetch<Array<{ symbol: string; name: string; address: string; exchangeRate?: string; usdcAddress: string }>>(
    "/api/lt-tokens"
  );
}

export function getWsBaseUrl() {
  const httpUrl = new URL(API_BASE);
  httpUrl.protocol = httpUrl.protocol === "https:" ? "wss:" : "ws:";
  httpUrl.pathname = "/ws";
  return httpUrl.toString();
}
