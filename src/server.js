import path from "path";
import express from "express";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import indexRouter from "./routes/index.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security & performance - HTTP 환경에 최적화된 설정
const cspConfig = {
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "img-src": ["'self'", "data:", "https://images.unsplash.com", "http:", "https:"],
      "icon-src": ["'self'", "data:"],
      "script-src": ["'self'", "'unsafe-inline'"],
      "style-src": ["'self'", "'unsafe-inline'", "http://fonts.googleapis.com", "https://fonts.googleapis.com"],
      "style-src-elem": ["'self'", "'unsafe-inline'", "http://fonts.googleapis.com", "https://fonts.googleapis.com"],
      "style-src-attr": ["'self'", "'unsafe-inline'"],
      "font-src": ["'self'", "http://fonts.gstatic.com", "https://fonts.gstatic.com", "data:"],
      "connect-src": ["'self'"],
      "media-src": ["'self'", "http:", "https:"],
      "object-src": ["'none'"],
      "base-uri": ["'self'"],
      "form-action": ["'self'"],
      "frame-ancestors": ["'none'"]
      // HTTPS 환경에서 사용할 때 아래 주석 해제
      // "upgrade-insecure-requests": []
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: { allow: true },
  frameguard: { action: "deny" },
  hidePoweredBy: true,
  // HTTP 환경: HSTS 비활성화
  hsts: false,
  // HTTPS 환경에서 사용할 때 아래 주석 해제하고 위의 hsts: false 제거
  // hsts: {
  //   maxAge: 31536000,
  //   includeSubDomains: true,
  //   preload: true
  // },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true
};

app.use(helmet(cspConfig));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// HTTP 강제 미들웨어 (HTTPS 리다이렉트 방지)
app.use((req, res, next) => {
  // HTTPS로 리다이렉트하는 헤더들 제거
  res.removeHeader('Strict-Transport-Security');
  res.removeHeader('Content-Security-Policy');
  
  // HTTP 환경임을 명시
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  next();
});

// Body parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static assets - 최적화된 캐싱 전략
app.use(express.static(path.join(__dirname, "../public"), {
  maxAge: process.env.NODE_ENV === "production" ? "7d" : 0,
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    // CSS와 JS 파일은 더 긴 캐시 설정
    if (path.endsWith('.css') || path.endsWith('.js')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    // 이미지는 중간 캐시 설정
    if (path.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=2592000');
    }
    // 폰트 파일은 장기 캐시
    if (path.match(/\.(woff|woff2|eot|ttf)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// View engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Routes
app.use("/", indexRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).render("partials/error", { title: "Not Found", code: 404, message: "페이지를 찾을 수 없습니다." });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render("partials/error", { title: "Server Error", code: 500, message: "서버 오류가 발생했습니다." });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// HTTP 서버 시작
app.listen(PORT, HOST, () => {
  console.log(`✅ Server listening on http://${HOST}:${PORT}`);
  console.log(`🌐 Access your site at: http://${HOST}:${PORT}`);
});

// HTTPS 서버 설정 (SSL 인증서 설정 후 주석 해제)
// import https from 'https';
// import fs from 'fs';
// 
// const httpsOptions = {
//   key: fs.readFileSync(process.env.SSL_KEY_PATH || '/path/to/private-key.pem'),
//   cert: fs.readFileSync(process.env.SSL_CERT_PATH || '/path/to/certificate.pem')
// };
// 
// https.createServer(httpsOptions, app).listen(443, HOST, () => {
//   console.log(`🔒 HTTPS Server listening on https://${HOST}:443`);
//   console.log(`🌐 Secure access at: https://${HOST}:443`);
// });
