import cors from "cors";
import express from "express";
import http from "http";
import { WebSocketServer } from "ws";

import { config } from "./config.js";
import ltRoutes from "./routes/lt.js";
import marketRoutes from "./routes/market.js";
import tokenRoutes from "./routes/tokens.js";
import { startKeeper } from "./services/keeper.js";
import { getTokenList } from "./services/onchain.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/lt-tokens", ltRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/tokens", tokenRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: error.message });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (socket) => {
  socket.subscriptions = new Set();

  socket.on("message", (message) => {
    try {
      const payload = JSON.parse(message.toString());
      if (payload.type === "subscribe" && payload.curve) {
        socket.subscriptions.add(payload.curve.toLowerCase());
      }
    } catch (error) {
      console.error("WS parse error:", error.message);
    }
  });
});

setInterval(async () => {
  try {
    const tokens = await getTokenList();
    wss.clients.forEach((client) => {
      if (client.readyState !== 1) {
        return;
      }
      tokens.forEach((token) => {
        if (client.subscriptions?.has(token.curveAddress.toLowerCase())) {
          client.send(
            JSON.stringify({
              type: "price",
              curve: token.curveAddress,
              tokenPrice: token.tokenPrice,
              ltPrice: token.ltPrice,
              progressBps: token.progressBps,
              graduated: token.graduated,
              timestamp: Date.now()
            })
          );
        }
      });
    });
  } catch (error) {
    console.error("Price loop error:", error.message);
  }
}, 5_000);

server.listen(config.port, () => {
  console.log(`Backend listening on :${config.port}`);
  startKeeper();
});
