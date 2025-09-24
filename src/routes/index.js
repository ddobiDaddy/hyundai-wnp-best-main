import express from "express";
const router = express.Router();

router.get("/", (req, res) => {
  res.render("home", { title: "현대W&P - 세탁전문기업" });
});

router.get("/about", (req, res) => {
  res.render("about", { title: "회사소개 - 현대W&P" });
});

router.get("/service", (req, res) => {
  res.render("service", { title: "서비스 안내 - 현대W&P" });
});

router.get("/facility", (req, res) => {
  res.render("facility", { title: "시설현황 - 현대W&P" });
});

router.get("/estimate", (req, res) => {
  res.render("estimate", { title: "세탁견적 - 현대W&P" });
});

router.get("/contact", (req, res) => {
  res.render("contact", { title: "고객센터 - 현대W&P" });
});

export default router;
