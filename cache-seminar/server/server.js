const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
app.use(cors({ origin: "http://localhost:5173" })); // Vite dev server 허용
app.use(express.json());

const DATA_PATH = path.join(__dirname, "data.json");

let serverVersion = 1;
const lastModifiedMap = new Map(); // resourceKey -> ms

function nowMs() {
  return Date.now();
}
function toHttpDate(ms) {
  return new Date(ms).toUTCString();
}
function parseHttpDate(str) {
  const t = Date.parse(str);
  return Number.isFinite(t) ? t : null;
}

function readData() {
  return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
}
function writeData(nextData) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(nextData, null, 2), "utf-8");
  serverVersion++;
}

function toETag(obj) {
  const raw = JSON.stringify(obj);
  const hash = crypto.createHash("sha1").update(raw).digest("hex");
  return `"${hash}"`;
}

function sendWithHttpCaching(req, res, payload, opts) {
  const { resourceKey, cacheControl, varyHeader } = opts;

  if (!lastModifiedMap.has(resourceKey)) {
    lastModifiedMap.set(resourceKey, nowMs());
  }
  const lastModifiedMs = lastModifiedMap.get(resourceKey);
  const lastModified = toHttpDate(lastModifiedMs);

  const etag = toETag(payload);

  // conditional: ETag
  const inm = req.headers["if-none-match"];
  if (inm && inm === etag) {
    res.status(304);
    res.setHeader("ETag", etag);
    res.setHeader("Last-Modified", lastModified);
    res.setHeader("Cache-Control", cacheControl);
    if (varyHeader) res.setHeader("Vary", varyHeader);
    res.setHeader("X-Server-Version", String(serverVersion));
    return res.end();
  }

  // conditional: Last-Modified
  const ims = req.headers["if-modified-since"];
  if (ims) {
    const imsMs = parseHttpDate(ims);
    if (imsMs != null && lastModifiedMs <= imsMs) {
      res.status(304);
      res.setHeader("ETag", etag);
      res.setHeader("Last-Modified", lastModified);
      res.setHeader("Cache-Control", cacheControl);
      if (varyHeader) res.setHeader("Vary", varyHeader);
      res.setHeader("X-Server-Version", String(serverVersion));
      return res.end();
    }
  }

  // 200
  res.status(200);
  res.setHeader("Content-Type", "application/json");
  res.setHeader("ETag", etag);
  res.setHeader("Last-Modified", lastModified);
  res.setHeader("Cache-Control", cacheControl);
  if (varyHeader) res.setHeader("Vary", varyHeader);
  res.setHeader("X-Server-Version", String(serverVersion));
  return res.send(payload);
}

// 서버 요청 로그
app.use((req, _res, next) => {
  console.log(
    "[Server]",
    req.method,
    req.url,
    "If-None-Match=",
    req.headers["if-none-match"],
    "If-Modified-Since=",
    req.headers["if-modified-since"],
    "Accept-Language=",
    req.headers["accept-language"],
  );
  next();
});

app.get("/api/products", (req, res) => {
  const data = readData();
  const lang = String(req.headers["accept-language"] || "en").toLowerCase();

  const title = lang.startsWith("ko") ? "상품 목록" : "Products";
  const payload = {
    type: "products",
    title,
    items: data.products,
    serverVersion,
    now: nowMs(),
  };

  return sendWithHttpCaching(req, res, payload, {
    resourceKey: "products",
    cacheControl: "public, max-age=3, stale-while-revalidate=5",
    varyHeader: "Accept-Language",
  });
});

app.get("/api/user", (req, res) => {
  const data = readData();
  const payload = {
    type: "user",
    user: data.user,
    serverVersion,
    now: nowMs(),
  };

  return sendWithHttpCaching(req, res, payload, {
    resourceKey: "user",
    cacheControl: "private, max-age=2, must-revalidate",
    varyHeader: "Accept-Language",
  });
});

app.put("/api/user", (req, res) => {
  const data = readData();
  data.user = { ...data.user, ...req.body };
  writeData(data);
  lastModifiedMap.set("user", nowMs());

  return res.status(200).send({
    ok: true,
    user: data.user,
    serverVersion,
    now: nowMs(),
  });
});

app.listen(3001, () => console.log("Server running on http://localhost:3001"));
