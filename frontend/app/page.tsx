import Link from "next/link";
import { getMarketOverview, getTokens } from "@/lib/api";
import { TokenCard } from "@/components/TokenCard";

export default async function HomePage() {
  const [overview, tokens] = await Promise.all([getMarketOverview(), getTokens()]);

  return (
    <>
      <section className="hero">
        <div className="hero-panel">
          <div className="pill">HyperEVM Testnet MVP</div>
          <h1>Launch meme momentum with perp-backed reserves.</h1>
          <p>
            This implementation follows the alt.fun idea closely: every launch starts on a bonding curve where the
            reserve asset is a leveraged token, not spot cash. Price evolves with both trading activity and the LT
            exchange rate.
          </p>
          <div className="actions" style={{ marginTop: 20 }}>
            <Link href="/launch" className="btn">
              Launch a token
            </Link>
            <Link href="/graduated" className="btn secondary">
              View graduated coins
            </Link>
          </div>
        </div>

        <div className="hero-panel">
          <div className="stats">
            <div className="stat">
              <div className="stat-label">Total launches</div>
              <div className="stat-value">{overview.totalTokens}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Live curves</div>
              <div className="stat-value">{overview.liveTokens}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Graduated</div>
              <div className="stat-value">{overview.graduatedTokens}</div>
            </div>
          </div>
        </div>
      </section>

      <div className="section-title">
        <h2>Live market</h2>
      </div>
      <section className="grid">
        {tokens.length === 0 ? <div className="card card-pad">No launches yet. Head to the launch page.</div> : null}
        {tokens.map((token) => (
          <TokenCard key={token.curveAddress} token={token} />
        ))}
      </section>
    </>
  );
}

