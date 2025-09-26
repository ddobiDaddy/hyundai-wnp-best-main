import express from "express";
import Estimate from "../models/Estimate.js";
import { testConnection } from "../config/database.js";

const router = express.Router();

// DB 연결 테스트
testConnection();

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

// 관리자 페이지 라우트
router.get("/admin", async (req, res) => {
  try {
    // 모든 견적 문의 조회 (최신순)
    const estimates = await Estimate.findAll({
      order: [['createdAt', 'DESC']],
      attributes: [
        'id', 'companyName', 'contactName', 'phone', 'email',
        'serviceType', 'laundryType', 'frequency', 'quantity',
        'location', 'status', 'createdAt', 'updatedAt'
      ]
    });
    
    res.render("admin", { 
      title: "관리자 - 견적 문의 관리",
      estimates: estimates
    });
  } catch (error) {
    console.error('관리자 페이지 오류:', error);
    res.status(500).render("partials/error", { 
      title: "Server Error", 
      code: 500, 
      message: "관리자 페이지를 불러올 수 없습니다." 
    });
  }
});

// 견적 문의 POST 라우트
router.post("/estimate", async (req, res) => {
  try {
    console.log('견적 문의 데이터 수신:', req.body);
    
    // 입력 데이터 검증
    const {
      companyName,
      contactName,
      phone,
      email,
      serviceType,
      laundryType,
      frequency,
      quantity,
      location,
      specialRequirements,
      message
    } = req.body;

    // 필수 필드 검증
    if (!companyName || !contactName || !phone || !email || !serviceType || !laundryType || !frequency || !quantity || !location) {
      return res.status(400).json({
        success: false,
        message: '필수 입력 항목을 모두 입력해주세요.'
      });
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: '올바른 이메일 형식을 입력해주세요.'
      });
    }

    // 전화번호 형식 검증
    const phoneRegex = /^01[0-9]-?[0-9]{4}-?[0-9]{4}$/;
    if (!phoneRegex.test(phone.replace(/-/g, ''))) {
      return res.status(400).json({
        success: false,
        message: '올바른 전화번호 형식을 입력해주세요. (예: 010-1234-5678)'
      });
    }

    // DB에 견적 문의 저장
    const estimate = await Estimate.create({
      companyName: companyName.trim(),
      contactName: contactName.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      serviceType,
      laundryType,
      frequency,
      quantity: parseInt(quantity),
      location: location.trim(),
      specialRequirements: specialRequirements ? specialRequirements.trim() : null,
      message: message ? message.trim() : null,
      status: 'pending'
    });

    console.log('견적 문의 저장 완료:', estimate.id);

    res.json({
      success: true,
      message: '견적 문의가 성공적으로 접수되었습니다. 24시간 이내에 연락드리겠습니다.',
      estimateId: estimate.id
    });

  } catch (error) {
    console.error('견적 문의 저장 오류:', error);
    
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    });
  }
});

// 견적 문의 상태 업데이트 API
router.put("/admin/estimate/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    
    // 상태 검증
    const validStatuses = ['pending', 'processing', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 상태입니다.'
      });
    }
    
    // 견적 문의 업데이트
    const [updatedRows] = await Estimate.update(
      { 
        status,
        adminNotes: adminNotes || null,
        updatedAt: new Date()
      },
      { where: { id } }
    );
    
    if (updatedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '견적 문의를 찾을 수 없습니다.'
      });
    }
    
    res.json({
      success: true,
      message: '상태가 성공적으로 업데이트되었습니다.'
    });
    
  } catch (error) {
    console.error('상태 업데이트 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

// 견적 문의 상세 조회 API
router.get("/admin/estimate/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const estimate = await Estimate.findByPk(id);
    
    if (!estimate) {
      return res.status(404).json({
        success: false,
        message: '견적 문의를 찾을 수 없습니다.'
      });
    }
    
    res.json({
      success: true,
      data: estimate
    });
    
  } catch (error) {
    console.error('견적 문의 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

export default router;
