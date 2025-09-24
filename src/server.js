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

// Security & performance
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "img-src": ["'self'", "data:", "https:"],
      "script-src-attr": ["'unsafe-inline'"],
      "script-src": ["'self'"],
      "style-src": ["'self'", "'unsafe-inline'"]
    }
  }
}));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Body parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static assets
app.use(express.static(path.join(__dirname, "../public"), {
  maxAge: process.env.NODE_ENV === "production" ? "7d" : 0,
  etag: true
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
app.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});
