"use client";

import { useEffect, useMemo, useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import { CURVE_ABI, ERC20_ABI } from "@/lib/contracts";
import { getWsBaseUrl, TokenSummary } from "@/lib/api";
import { formatUsd6 } from "@/lib/format";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

export function TradePanel({ token }: { token: TokenSummary }) {
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("100");
  const [status, setStatus] = useState("");
  const [price, setPrice] = useState(token.tokenPrice);

  useEffect(() => {
    const ws = new WebSocket(getWsBaseUrl());
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "subscribe", curve: token.curveAddress }));
    };
    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data as string);
      if (payload.type === "price" && payload.curve?.toLowerCase() === token.curveAddress.toLowerCase()) {
        setPrice(payload.tokenPrice);
      }
    };
    return () => ws.close();
  }, [token.curveAddress]);

  const amountLabel = useMemo(() => (mode === "buy" ? "USDC amount" : "Token amount"), [mode]);

  async function faucet() {
    if (!window.ethereum) {
      setStatus("No wallet detected.");
      return;
    }
    try {
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const usdc = new Contract(token.usdcAddress, ERC20_ABI, signer);
      const tx = await usdc.faucet(await signer.getAddress(), 10_000n * 10n ** 6n);
      setStatus(`Faucet tx: ${tx.hash}`);
      await tx.wait();
      setStatus("Minted 10,000 mock USDC.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Faucet failed");
    }
  }

  async function submitTrade() {
    if (!window.ethereum) {
      setStatus("No wallet detected.");
      return;
    }
    try {
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const curve = new Contract(token.curveAddress, CURVE_ABI, signer);

      if (mode === "buy") {
        const usdcAmount = BigInt(Math.floor(Number(amount) * 1e6));
        const usdc = new Contract(token.usdcAddress, ERC20_ABI, signer);
        const approveTx = await usdc.approve(token.curveAddress, usdcAmount);
        await approveTx.wait();
        const tx = await curve.buy(usdcAmount, 0);
        setStatus(`Buy tx: ${tx.hash}`);
        await tx.wait();
        setStatus("Buy complete.");
      } else {
        const tokenAmount = BigInt(Math.floor(Number(amount) * 1e18));
        const erc20 = new Contract(token.tokenAddress, ERC20_ABI, signer);
        const approveTx = await erc20.approve(token.curveAddress, tokenAmount);
        await approveTx.wait();
        const tx = await curve.sell(tokenAmount, 0);
        setStatus(`Sell tx: ${tx.hash}`);
        await tx.wait();
        setStatus("Sell complete.");
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Trade failed");
    }
  }

  return (
    <div className="card card-pad stack">
      <div className="trade-grid">
        <button className={`btn ${mode === "buy" ? "" : "secondary"}`} onClick={() => setMode("buy")}>
          Buy
        </button>
        <button className={`btn ${mode === "sell" ? "" : "secondary"}`} onClick={() => setMode("sell")}>
          Sell
        </button>
      </div>

      <div>
        <div className="label">{amountLabel}</div>
        <input className="field" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>

      <div className="metric-row">
        <span>Live token price</span>
        <strong>{formatUsd6(price)}</strong>
      </div>

      <div className="actions">
        <button className="btn" onClick={submitTrade} disabled={token.graduated}>
          {token.graduated ? "Curve Closed" : mode === "buy" ? "Buy from curve" : "Sell to curve"}
        </button>
        <button className="btn secondary" onClick={faucet}>
          Get mock USDC
        </button>
      </div>

      <div className="tiny">{status || "For MVP, the default deployment uses mock USDC and mock LT so testnet flows can be exercised end-to-end."}</div>
    </div>
  );
}

