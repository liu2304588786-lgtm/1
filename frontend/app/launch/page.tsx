import { LaunchForm } from "@/components/LaunchForm";

export default function LaunchPage() {
  return (
    <section className="layout-2">
      <div className="card card-pad">
        <div className="pill">Create</div>
        <h1 style={{ marginTop: 14 }}>Launch a perp-backed alt coin.</h1>
        <p className="tiny" style={{ fontSize: 16 }}>
          Pick a leveraged token, choose a meme wrapper, and deploy a bonding curve to HyperEVM. This MVP keeps the
          product path tight: launch, trade, graduate.
        </p>
      </div>
      <LaunchForm />
    </section>
  );
}

