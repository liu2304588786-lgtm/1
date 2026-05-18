import { BondingCurveChart } from "@/components/BondingCurveChart";
import { GraduationBar } from "@/components/GraduationBar";
import { TradePanel } from "@/components/TradePanel";
import { getToken, getTrades } from "@/lib/api";
import { formatToken18, formatUsd6, shortAddress } from "@/lib/format";

export default async function TokenPage({ params }: { params: Promise<{ curve: string }> }) {
  const { curve } = await params;
  const [token, trades] = await Promise.all([getToken(curve), getTrades(curve)]);

  return (
    <div className="layout-2">
      <div className="stack">
        <div className="card card-pad">
          <div className="pill">{token.graduated ? "Graduated" : "Live Bonding Curve"}</div>
          <h1 style={{ marginBottom: 10 }}>
            {token.name} <span style={{ color: "var(--muted)" }}>/{token.symbol}</span>
          </h1>
          <p className="tiny" style={{ fontSize: 16 }}>{token.description}</p>

          <div className="metric-row" style={{ marginTop: 18 }}>
            <span>Current price</span>
            <strong>{formatUsd6(token.tokenPrice)}</strong>
          </div>
          <div className="metric-row">
            <span>Underlying LT</span>
            <strong>{shortAddress(token.ltAddress)}</strong>
          </div>
          <div className="metric-row">
            <span>Curve address</span>
            <strong className="mono">{shortAddress(token.curveAddress)}</strong>
          </div>
          <div className="metric-row">
            <span>Sold from curve</span>
            <strong>{formatToken18(token.sold)}</strong>
          </div>

          <div style={{ marginTop: 18 }}>
            <GraduationBar progressBps={token.progressBps} ltUsdValue={token.ltUsdValue} />
          </div>
        </div>

        <div className="card card-pad">
          <div className="section-title" style={{ marginTop: 0 }}>
            <h2>Curve shape</h2>
          </div>
          <BondingCurveChart progressBps={token.progressBps} />
        </div>

        <div className="card card-pad">
          <div className="section-title" style={{ marginTop: 0 }}>
            <h2>Recent trades</h2>
          </div>
          <div className="stack">
            {trades.length === 0 ? <div className="tiny">No trades yet.</div> : null}
            {trades.slice(0, 10).map((trade) => (
              <div key={trade.txHash} className="metric-row">
                <span>
                  {trade.type.toUpperCase()} · {shortAddress(trade.account)}
                </span>
                <strong>{trade.type === "buy" ? formatUsd6(trade.usdcIn) : formatUsd6(trade.usdcOut)}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <TradePanel token={token} />
    </div>
  );
}
