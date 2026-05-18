"use client";

import { useEffect, useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import { FACTORY_ABI, factoryAddress } from "@/lib/contracts";
import { getLeveragedTokens } from "@/lib/api";

type LtItem = {
  symbol: string;
  name: string;
  address: string;
  usdcAddress: string;
};

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

export function LaunchForm() {
  const [lts, setLts] = useState<LtItem[]>([]);
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    name: "",
    symbol: "",
    ltAddress: "",
    imageUri: "",
    description: ""
  });

  useEffect(() => {
    getLeveragedTokens().then((items) => {
      setLts(items);
      if (items[0]) {
        setForm((current) => ({ ...current, ltAddress: items[0].address }));
      }
    });
  }, []);

  async function handleLaunch() {
    if (!window.ethereum) {
      setStatus("No wallet detected.");
      return;
    }
    if (!factoryAddress) {
      setStatus("NEXT_PUBLIC_FACTORY_ADDRESS is missing.");
      return;
    }
    const selectedLt = lts.find((item) => item.address === form.ltAddress);
    if (!selectedLt?.usdcAddress) {
      setStatus("Selected LT is missing base asset configuration.");
      return;
    }

    setPending(true);
    setStatus("Waiting for wallet...");

    try {
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const factory = new Contract(factoryAddress, FACTORY_ABI, signer);
      const tx = await factory.launch(
        form.name,
        form.symbol,
        form.ltAddress,
        selectedLt.usdcAddress,
        form.imageUri,
        form.description
      );
      setStatus(`Transaction sent: ${tx.hash}`);
      await tx.wait();
      setStatus("Launch complete. Refresh market page in a few seconds.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Launch failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="card card-pad stack">
      <div>
        <div className="label">Token name</div>
        <input className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div>
        <div className="label">Token symbol</div>
        <input className="field" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} />
      </div>
      <div>
        <div className="label">Underlying LT</div>
        <select
          className="select"
          value={form.ltAddress}
          onChange={(e) => setForm({ ...form, ltAddress: e.target.value })}
        >
          {lts.map((item) => (
            <option key={item.address} value={item.address}>
              {item.symbol} · {item.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <div className="label">Image URI</div>
        <input
          className="field"
          value={form.imageUri}
          onChange={(e) => setForm({ ...form, imageUri: e.target.value })}
          placeholder="ipfs://... or https://..."
        />
      </div>
      <div>
        <div className="label">Description</div>
        <textarea
          className="textarea"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>
      <button className="btn" disabled={pending} onClick={handleLaunch}>
        {pending ? "Launching..." : "Launch on HyperEVM"}
      </button>
      <div className="tiny">{status || "Factory launch uses CREATE2 with deterministic salts for token, locker and curve."}</div>
    </div>
  );
}
