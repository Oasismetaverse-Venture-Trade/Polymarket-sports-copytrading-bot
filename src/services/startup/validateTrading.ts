import { SignatureType } from "@polymarket/clob-client";
import { appSecrets } from "../../config";
import { isDryRun } from "../../config/environment";
import { tradeConfig } from "../../config/tradeConfig";
import { fetchGeoblockStatus } from "../api/geoblock";
import { logger } from "../../utils/logger";

async function assertPolygonRpcReachable(rpcUrl: string): Promise<void> {
  if (process.env.NODE_ENV === "test") return;
  const body = JSON.stringify({
    jsonrpc: "2.0",
    method: "eth_chainId",
    params: [],
    id: 1
  });
  let res: Response;
  try {
    res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body
    });
  } catch (e) {
    throw new Error(
      `POLYGON_RPC_URL failed to connect (${rpcUrl}): ${String(e)}. Set POLYGON_RPC_URL to a working Polygon HTTPS endpoint.`
    );
  }
  const text = await res.text();
  if (!res.ok) {
    throw new Error(
      `POLYGON_RPC_URL returned HTTP ${res.status} (${rpcUrl}). Body: ${text.slice(0, 300)}. Try https://polygon-bor.publicnode.com or an Alchemy/Infura Polygon URL.`
    );
  }
  let j: { error?: { message?: string }; result?: string };
  try {
    j = JSON.parse(text) as { error?: { message?: string }; result?: string };
  } catch {
    throw new Error(`POLYGON_RPC_URL returned non-JSON (${rpcUrl}): ${text.slice(0, 200)}`);
  }
  if (j.error) {
    throw new Error(
      `POLYGON_RPC_URL JSON-RPC error (${rpcUrl}): ${j.error.message ?? JSON.stringify(j.error)}. Use a valid Polygon RPC URL.`
    );
  }
  const id = j.result ? parseInt(j.result, 16) : NaN;
  if (id !== tradeConfig.chainId) {
    throw new Error(
      `POLYGON_RPC_URL chainId mismatch: RPC reports ${id}, CHAIN_ID is ${tradeConfig.chainId}`
    );
  }
  logger.info({ rpcUrl }, "polygon rpc ok");
}

export async function validateTradingPrerequisites(): Promise<void> {
  if (isDryRun()) {
    logger.info("dry run: skipping geoblock and funder gates");
    return;
  }
  await assertPolygonRpcReachable(appSecrets.polygonRpc);
  const runGeo = tradeConfig.geoblockEnabled && process.env.NODE_ENV !== "test";
  if (runGeo) {
    const g = await fetchGeoblockStatus();
    logger.info({ blocked: g.blocked, country: g.country, region: g.region }, "geoblock");
    if (g.blocked) {
      const msg = `order placement blocked for region ${g.country} ${g.region}`;
      if (tradeConfig.geoblockMode === "warn") {
        logger.warn({ blocked: g.blocked, country: g.country, region: g.region }, msg);
      } else {
        throw new Error(msg);
      }
    }
  }
  const st = tradeConfig.signatureType;
  const needsFunder = st === SignatureType.POLY_PROXY || st === SignatureType.POLY_GNOSIS_SAFE;
  if (needsFunder && !appSecrets.funderAddress) {
    throw new Error(
      "FUNDER_ADDRESS required when SIGNATURE_TYPE is 1 (POLY_PROXY) or 2 (GNOSIS_SAFE / proxy wallet)"
    );
  }
}
