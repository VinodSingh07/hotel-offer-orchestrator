import express from "express";
import path from "path";
import hotelRoutes from "./routes/hotel.routes";
import { checkRedisHealth } from "./services/redis.service";
import { checkTemporalHealth } from "./temporal-client";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Enable CORS for all routes
app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  next();
});

// Serve static frontend landing page
app.use(express.static(path.join(__dirname, "../public")));

// Comprehensive Health check endpoint
app.get("/health", async (_req, res) => {
  const supplierBaseUrl =
    process.env.SUPPLIER_BASE_URL || "http://localhost:4000";

  const checkSupplier = async (pathUrl: string) => {
    try {
      const response = await fetch(`${supplierBaseUrl}${pathUrl}?city=delhi`);
      return response.ok;
    } catch {
      return false;
    }
  };

  const [supplierA, supplierB, redisOk, temporalOk] = await Promise.all([
    checkSupplier("/supplierA/hotels"),
    checkSupplier("/supplierB/hotels"),
    checkRedisHealth(),
    checkTemporalHealth()
  ]);

  const healthy = supplierA && supplierB;
  const systemStatus = healthy ? (redisOk && temporalOk ? "healthy" : "degraded") : "degraded";

  return res.status(healthy ? 200 : 503).json({
    status: systemStatus,
    timestamp: new Date().toISOString(),
    suppliers: {
      supplierA: supplierA ? "up" : "down",
      supplierB: supplierB ? "up" : "down"
    },
    infrastructure: {
      redis: redisOk ? "connected" : "disconnected",
      temporal: temporalOk ? "connected" : "disconnected"
    }
  });
});

app.use("/api", hotelRoutes);

// Fallback route to serve index.html for UI SPA routing if needed
app.get("/{*path}", (req, res, next) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/supplier") || req.path === "/health") {
    return next();
  }
  return res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.listen(PORT, () => {
  console.log(`Main API & Orchestrator server running on http://localhost:${PORT}`);
});

export default app;