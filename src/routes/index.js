import 'dotenv/config';
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcrypt";
//import dotenv from "dotenv";
import { Estimate, EstimateOutbox, GalleryImage } from "../models/index.js";
import { sequelize, testConnection } from "../config/database.js";
import logger from "../utils/logger.js";

// dotenv 설정 (이 파일이 먼저 로드될 수 있으므로)
// dotenv.config();

const router = express.Router();

// DB 연결 테스트
testConnection();

// 관리자 인증 미들웨어
const requireAuth = (req, res, next) => {
  if (req.session && req.session.isAuthenticated) {
    return next();
  }
  // 로그인 페이지로 리다이렉트
  return res.redirect('/admin/login');
};

// 관리자 자격증명 (환경변수에서 해시된 값만 읽어옴)
const ADMIN_USERNAME_HASH = process.env.ADMIN_USERNAME_HASH;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

// 환경변수 검증 및 디버깅
if (!ADMIN_USERNAME_HASH || !ADMIN_PASSWORD_HASH) {
  logger.warn('⚠️  경고: ADMIN_USERNAME_HASH 또는 ADMIN_PASSWORD_HASH가 설정되지 않았습니다.');
  logger.warn('⚠️  .env 파일에 관리자 계정 정보를 설정해주세요.');
  logger.warn('디버깅 - ADMIN_USERNAME_HASH:', ADMIN_USERNAME_HASH ? '설정됨' : '없음');
  logger.warn('디버깅 - ADMIN_PASSWORD_HASH:', ADMIN_PASSWORD_HASH ? '설정됨' : '없음');
} else {
  logger.info('✅ 관리자 계정 환경변수가 정상적으로 로드되었습니다.');
}

// 업로드 디렉토리 생성
const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'gallery');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `gallery-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10 // 최대 10개 파일
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('지원하지 않는 파일 형식입니다.'), false);
    }
  }
});

router.get("/", (req, res) => {
  res.render("home", { title: "현대W&P - 세탁전문기업" });
});

router.get("/about", (req, res) => {
  res.render("about", { title: "회사소개 - 현대W&P" });
});

router.get("/service", (req, res) => {
  res.render("service", { title: "서비스 안내 - 현대W&P" });
});

router.get("/facility", async (req, res) => {
  try {
    // 활성화된 갤러리 이미지 조회
    const galleryImages = await GalleryImage.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']]
    });
    
    res.render("facility", { 
      title: "시설현황 - 현대W&P",
      galleryImages: galleryImages
    });
  } catch (error) {
    console.error('시설현황 페이지 오류:', error);
    res.render("facility", { 
      title: "시설현황 - 현대W&P",
      galleryImages: []
    });
  }
});

router.get("/estimate", (req, res) => {
  res.render("estimate", { title: "세탁견적 - 현대W&P" });
});

router.get("/contact", (req, res) => {
  res.render("contact", { title: "고객센터 - 현대W&P" });
});

// 로그인 페이지
router.get("/admin/login", (req, res) => {
  // 이미 로그인된 경우 관리자 페이지로 리다이렉트
  if (req.session && req.session.isAuthenticated) {
    return res.redirect('/admin');
  }
  res.render("admin-login", { 
    title: "관리자 로그인 - 현대W&P",
    error: req.query.error || null
  });
});

// 로그인 처리
router.post("/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.redirect('/admin/login?error=아이디와 비밀번호를 입력해주세요.');
    }

    // 환경변수 검증
    if (!ADMIN_USERNAME_HASH || !ADMIN_PASSWORD_HASH) {
      console.error('관리자 계정이 설정되지 않았습니다.');
      return res.redirect('/admin/login?error=서버 설정 오류가 발생했습니다.');
    }

    // 아이디 확인 (해시 비교)
    const isUsernameValid = await bcrypt.compare(username, ADMIN_USERNAME_HASH);
    if (!isUsernameValid) {
      return res.redirect('/admin/login?error=아이디 또는 비밀번호가 올바르지 않습니다.');
    }

    // 비밀번호 확인 (해시 비교)
    const isPasswordValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    if (!isPasswordValid) {
      return res.redirect('/admin/login?error=아이디 또는 비밀번호가 올바르지 않습니다.');
    }

    // 세션에 인증 정보 저장
    req.session.isAuthenticated = true;
    req.session.username = username;
    req.session.loginTime = new Date();

    // 관리자 페이지로 리다이렉트
    res.redirect('/admin');
  } catch (error) {
    console.error('로그인 오류:', error);
    res.redirect('/admin/login?error=로그인 중 오류가 발생했습니다.');
  }
});

// 로그아웃
router.post("/admin/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('세션 삭제 오류:', err);
    }
    res.redirect('/admin/login');
  });
});

// 갤러리 관리 페이지 (HTML 렌더링)
router.get("/admin/gallery", requireAuth, (req, res) => {
  res.render("gallery-admin", { title: "갤러리 관리 - 현대W&P" });
});

// 관리자 페이지 라우트
router.get("/admin", requireAuth, async (req, res) => {
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

    // 텔레그램 알림 상태 통계
    const notificationStats = await EstimateOutbox.findAll({
      attributes: [
        'state',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['state'],
      raw: true
    });

    // 알림 상태별 개수 매핑
    const stats = {
      pending: 0,
      processing: 0,
      sent: 0,
      failed: 0
    };
    
    notificationStats.forEach(stat => {
      stats[stat.state.toLowerCase()] = parseInt(stat.count);
    });
    
    res.render("admin", { 
      title: "관리자 - 견적 문의 관리",
      estimates: estimates,
      notificationStats: stats
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

    // 트랜잭션으로 견적 저장 + 텔레그램 알림 큐 추가
    const t = await sequelize.transaction();
    
    try {
      // 1) 견적 문의 저장
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
      }, { transaction: t });

      // 2) 텔레그램 알림 큐에 추가
      const payload = {
        companyName: estimate.companyName,
        contactName: estimate.contactName,
        phone: estimate.phone,
        email: estimate.email,
        serviceType: estimate.serviceType,
        laundryType: estimate.laundryType,
        frequency: estimate.frequency,
        quantity: estimate.quantity,
        location: estimate.location,
        specialRequirements: estimate.specialRequirements || '-',
        message: estimate.message || '-',
        createdAt: estimate.createdAt.toISOString()
      };

      await EstimateOutbox.create({
        estimateId: estimate.id,
        payloadJson: JSON.stringify(payload),
        state: 'PENDING'
      }, { transaction: t });

      // 트랜잭션 커밋
      await t.commit();
      
      console.log('견적 문의 저장 및 텔레그램 알림 큐 추가 완료:', estimate.id);

      res.json({
        success: true,
        message: '견적 문의가 성공적으로 접수되었습니다. 24시간 이내에 연락드리겠습니다.',
        estimateId: estimate.id
      });

    } catch (transactionError) {
      // 트랜잭션 롤백
      await t.rollback();
      throw transactionError;
    }

  } catch (error) {
    console.error('견적 문의 저장 오류:', error);
    
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    });
  }
});

// 견적 문의 상태 업데이트 API
router.put("/admin/estimate/:id/status", requireAuth, async (req, res) => {
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
router.get("/admin/estimate/:id", requireAuth, async (req, res) => {
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

// 텔레그램 알림 재시도 API
router.post("/admin/notifications/retry", requireAuth, async (req, res) => {
  try {
    const { runOutboxOnce, retryFailedNotifications } = await import('../workers/outboxWorker.js');
    
    // 실패한 알림들을 재처리 대기열로 이동
    await retryFailedNotifications();
    
    // 즉시 한 번 처리 실행
    await runOutboxOnce();
    
    res.json({
      success: true,
      message: '텔레그램 알림 재시도가 완료되었습니다.'
    });
    
  } catch (error) {
    console.error('알림 재시도 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

// 갤러리 이미지 업로드 API
router.post("/admin/gallery/upload", requireAuth, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '업로드할 이미지가 없습니다.'
      });
    }

    const uploadedImages = [];
    
    for (const file of req.files) {
      // 한글 파일명 안전하게 처리
      const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
      const title = path.parse(originalName).name;
      
      // 이미지 정보 추출 (한글 안전 처리)
      const imageData = {
        title: title || '이미지', // 한글이 깨지면 기본값 사용
        description: '',
        filename: file.filename,
        originalName: originalName, // 한글 파일명 안전하게 저장
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        width: null, // 필요시 sharp 라이브러리로 추출
        height: null,
        category: 'facility',
        isActive: true,
        sortOrder: 0
      };

      const savedImage = await GalleryImage.create(imageData);
      uploadedImages.push(savedImage);
    }

    res.json({
      success: true,
      message: `${uploadedImages.length}개의 이미지가 업로드되었습니다.`,
      data: uploadedImages
    });

  } catch (error) {
    console.error('이미지 업로드 오류:', error);
    
    // 업로드된 파일들 정리
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    res.status(500).json({
      success: false,
      message: '이미지 업로드 중 오류가 발생했습니다.'
    });
  }
});

// 갤러리 이미지 목록 조회 API
router.get("/api/admin/gallery", requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 12, category = '', search = '' } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = {};
    if (category) whereClause.category = category;
    if (search) {
      whereClause[sequelize.Op.or] = [
        { title: { [sequelize.Op.like]: `%${search}%` } },
        { description: { [sequelize.Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: images } = await GalleryImage.findAndCountAll({
      where: whereClause,
      order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        images,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('갤러리 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '갤러리 조회 중 오류가 발생했습니다.'
    });
  }
});

// 갤러리 이미지 상세 조회 API
router.get("/api/admin/gallery/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const image = await GalleryImage.findByPk(id);
    
    if (!image) {
      return res.status(404).json({
        success: false,
        message: '이미지를 찾을 수 없습니다.'
      });
    }
    
    res.json({
      success: true,
      data: image
    });
    
  } catch (error) {
    console.error('이미지 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '이미지 조회 중 오류가 발생했습니다.'
    });
  }
});

// 갤러리 이미지 수정 API
router.put("/api/admin/gallery/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, sortOrder, isActive } = req.body;
    
    const image = await GalleryImage.findByPk(id);
    
    if (!image) {
      return res.status(404).json({
        success: false,
        message: '이미지를 찾을 수 없습니다.'
      });
    }
    
    await image.update({
      title: title.trim(),
      description: description ? description.trim() : null,
      category,
      sortOrder: parseInt(sortOrder) || 0,
      isActive: Boolean(isActive)
    });
    
    res.json({
      success: true,
      message: '이미지 정보가 업데이트되었습니다.'
    });
    
  } catch (error) {
    console.error('이미지 수정 오류:', error);
    res.status(500).json({
      success: false,
      message: '이미지 수정 중 오류가 발생했습니다.'
    });
  }
});

// 갤러리 이미지 삭제 API
router.delete("/api/admin/gallery/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const image = await GalleryImage.findByPk(id);
    
    if (!image) {
      return res.status(404).json({
        success: false,
        message: '이미지를 찾을 수 없습니다.'
      });
    }
    
    // 파일 삭제
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'gallery', image.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // DB에서 삭제
    await image.destroy();
    
    res.json({
      success: true,
      message: '이미지가 삭제되었습니다.'
    });
    
  } catch (error) {
    console.error('이미지 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '이미지 삭제 중 오류가 발생했습니다.'
    });
  }
});

export default router;
