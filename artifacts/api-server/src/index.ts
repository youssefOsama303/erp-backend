import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL ?? "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    time: new Date().toISOString(),
    version: "0.1.0",
  });
});

const port = Number.parseInt(process.env.PORT ?? "5000", 10);
app.listen(port, "0.0.0.0", () => {
  // eslint-disable-next-line no-console
  console.log(`API Server running on http://localhost:${port}`);
});

