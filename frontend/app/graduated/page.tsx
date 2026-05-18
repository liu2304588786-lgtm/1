import { getTokens } from "@/lib/api";
import { TokenCard } from "@/components/TokenCard";

export default async function GraduatedPage() {
  const tokens = await getTokens("graduated");

  return (
    <>
      <div className="section-title">
        <h2>Graduated coins</h2>
      </div>
      <section className="grid">
        {tokens.length === 0 ? <div className="card card-pad">No graduated tokens yet.</div> : null}
        {tokens.map((token) => (
          <TokenCard key={token.curveAddress} token={token} />
        ))}
      </section>
    </>
  );
}

