import Link from "next/link";
import { TokenSummary } from "@/lib/api";
import { formatToken18, formatUsd6, shortAddress } from "@/lib/format";
import { GraduationBar } from "./GraduationBar";

export function TokenCard({ token }: { token: TokenSummary }) {
  return (
    <Link href={`/token/${token.curveAddress}`} className="card token-card">
      <div className="token-head">
        <div>
          <div className="token-symbol">{token.symbol}</div>
          <div className="token-name">{token.name}</div>
        </div>
        <div className="pill">{token.graduated ? "Graduated" : "Live"}</div>
      </div>

      <div className="token-description">{token.description || "No description provided."}</div>

      <div className="metric-row">
        <span>Price</span>
        <strong>{formatUsd6(token.tokenPrice)}</strong>
      </div>
      <div className="metric-row">
        <span>LT</span>
        <strong>{shortAddress(token.ltAddress)}</strong>
      </div>
      <div className="metric-row">
        <span>Sold</span>
        <strong>{formatToken18(token.sold)}</strong>
      </div>

      <GraduationBar progressBps={token.progressBps} ltUsdValue={token.ltUsdValue} />
    </Link>
  );
}

