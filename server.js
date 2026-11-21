require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.ESSL_PORT || process.env.PORT || 5002;

// Database connection (commented out / bypassed)
// require("./conn/conn");

const { forwardEsslRequest } = require("./utils/forwarder");
const esslRouter = require("./essl");

app.use(cors({ origin: true, credentials: true }));

// ----------------------------------------------------
// Raw-body middleware for ESSL device endpoints
// Must be registered BEFORE json/urlencoded parsers
// ----------------------------------------------------
const esslDevicePaths = [
  "/iclock/cdata",
  "/iclock/cdata.aspx",
  "/iclock/getrequest.aspx",
  "/iclock/devicecmd",
  "/essl/iclock/cdata",
  "/essl/iclock/cdata.aspx",
  "/essl/iclock/getrequest.aspx",
  "/essl/iclock/devicecmd"
];

app.use(esslDevicePaths, (req, res, next) => {
  let raw = "";
  req.on("data", (chunk) => {
    raw += chunk.toString();
  });
  req.on("end", () => {
    req.bodyRaw = raw;
    next();
  });
});

// Standard body parsers for JSON and URL-encoded payloads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ----------------------------------------------------
// Comprehensive Request Logger & Forwarder Middleware
// ----------------------------------------------------
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  console.log(`\n================== [INCOMING REQUEST] ==================`);
  console.log(`⏱️  Timestamp : ${timestamp}`);
  console.log(`📡 Client IP : ${clientIp}`);
  console.log(`➡️  Method    : ${req.method} ${req.originalUrl || req.url}`);

  if (req.query && Object.keys(req.query).length > 0) {
    console.log(`🔍 Query     :`, JSON.stringify(req.query, null, 2));
  }

  if (req.bodyRaw) {
    console.log(`📦 Raw Body  :\n${req.bodyRaw}`);
  } else if (req.body && Object.keys(req.body).length > 0) {
    console.log(`📦 Body JSON :`, JSON.stringify(req.body, null, 2));
  }

  // Response completion logger
  const startTime = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    console.log(`⬅️  Response  : ${req.method} ${req.originalUrl || req.url} -> Status ${res.statusCode} (${duration}ms)`);
    console.log(`========================================================\n`);
  });

  // Forward raw request to remote ESSL server using axios
  // Non-blocking so local biometric device processing is never delayed
  forwardEsslRequest(req).catch(err => {
    console.error("Forwarding execution error:", err.message);
  });

  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "GoodNature ESSL Device Relay Server",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Mount ESSL router
app.use("/", esslRouter);

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 GoodNature ESSL Relay Server is running on port ${PORT}`);
  console.log(`📡 Listening for ESSL device requests at http://0.0.0.0:${PORT}`);
  console.log(`⏩ Auto-forwarding via Axios to: ${process.env.FORWARD_ESSL_URL || "http://goodfeelsd.com/essl"}`);
});
