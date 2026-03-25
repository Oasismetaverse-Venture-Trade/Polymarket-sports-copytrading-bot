import { getAppEnv } from "./environment";
import { POLYMARKET_URLS } from "./polymarketEndpoints";

function num(v: string | undefined, d: number): number {
  if (v === undefined || v === "") return d;
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function bool(v: string | undefined, d: boolean): boolean {
  if (v === undefined || v === "") return d;
  return String(v).toLowerCase() === "true";
}

export type LeaderFeedMode = "rest" | "clob_user_ws";
export type GeoblockMode = "enforce" | "warn" | "off";

function geoblockMode(v: string | undefined): GeoblockMode {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "off" || s === "false" || s === "0" || s === "disabled") return "off";
  if (s === "warn" || s === "ignore" || s === "log") return "warn";
  return "enforce";
}

export const tradeConfig = {
  copyRatio: num(process.env.COPY_RATIO, 0.1),
  maxTradeUsdc: num(process.env.MAX_TRADE_USDC, 50),
  minTradeUsdc: num(process.env.MIN_TRADE_USDC, 1),
  maxDailyUsdc: num(process.env.MAX_DAILY_USDC, 500),
  pollIntervalMs: num(process.env.POLL_INTERVAL_MS, 1000),
  maxPriceSlippageBps: num(process.env.MAX_PRICE_SLIPPAGE_BPS, 800),
  signatureType: num(process.env.SIGNATURE_TYPE, 2),
  chainId: num(process.env.CHAIN_ID, 137),
  clobHost: process.env.CLOB_HOST || POLYMARKET_URLS.clobHost,
  dataApiHost: process.env.DATA_API_HOST || POLYMARKET_URLS.dataApi,
  gammaApiHost: process.env.GAMMA_API_HOST || POLYMARKET_URLS.gammaApi,
  sportsOnly: bool(process.env.SPORTS_ONLY, true),
  geoblockEnabled: bool(process.env.GEOBLOCK_ENABLED, true),
  geoblockMode: geoblockMode(process.env.GEOBLOCK_MODE),
  leaderFeed: ((): LeaderFeedMode => {
    const v = (process.env.LEADER_FEED || "rest").toLowerCase();
    return v === "clob_user_ws" || v === "wss" || v === "user_ws" ? "clob_user_ws" : "rest";
  })(),
  leaderWsWarmupMs: num(process.env.LEADER_WS_WARMUP_MS, 5000),
  env: getAppEnv()
};
