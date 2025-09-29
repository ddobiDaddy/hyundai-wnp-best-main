import axios from 'axios';
import { Op } from 'sequelize';
import { EstimateOutbox } from '../models/index.js';
import 'dotenv/config';

const TG_TOKEN = process.env.TG_TOKEN;
const TG_CHAT_ID = process.env.TG_CHAT_ID;

// 텔레그램 알림 전송 함수
async function notifyTelegram(payload) {
  if (!TG_TOKEN || !TG_CHAT_ID) {
    throw new Error('텔레그램 설정이 누락되었습니다. TG_TOKEN과 TG_CHAT_ID를 확인하세요.');
  }

  const url = `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`;
  
  // 서비스 타입 한글 변환
  const serviceTypeMap = {
    'health': '헬스장',
    'sauna': '사우나',
    'corporate': '기업체',
    'school': '학교',
    'other': '기타'
  };

  // 세탁물 타입 한글 변환
  const laundryTypeMap = {
    'workout': '운동복',
    'towel': '수건',
    'sauna': '사우나복',
    'uniform': '제복',
    'bedding': '침구류',
    'mixed': '혼합'
  };

  // 빈도 한글 변환
  const frequencyMap = {
    'daily': '매일',
    'weekly': '주 1회',
    'biweekly': '2주 1회',
    'monthly': '월 1회',
    'one-time': '1회성'
  };

  const text = [
    '🧺 <b>새 견적 도착</b>',
    '',
    `• <b>업체명:</b> ${payload.companyName}`,
    `• <b>담당자:</b> ${payload.contactName}`,
    `• <b>연락처:</b> ${payload.phone}`,
    `• <b>이메일:</b> ${payload.email}`,
    `• <b>서비스:</b> ${serviceTypeMap[payload.serviceType] || payload.serviceType}`,
    `• <b>세탁물:</b> ${laundryTypeMap[payload.laundryType] || payload.laundryType}`,
    `• <b>빈도:</b> ${frequencyMap[payload.frequency] || payload.frequency}`,
    `• <b>수량:</b> ${payload.quantity}개`,
    `• <b>위치:</b> ${payload.location}`,
    `• <b>특이사항:</b> ${payload.specialRequirements || '-'}`,
    `• <b>메모:</b> ${payload.message || '-'}`,
    '',
    `📅 <b>접수시간:</b> ${new Date(payload.createdAt).toLocaleString('ko-KR')}`
  ].join('\n');

  await axios.post(url, {
    chat_id: TG_CHAT_ID,
    text,
    parse_mode: 'HTML'
  }, { 
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

// 백오프 시간 계산 (지수 백오프)
function calcBackoffSeconds(attempts) {
  // 1m, 5m, 15m, 1h, 3h, 6h, 12h
  const backoffTable = [60, 300, 900, 3600, 10800, 21600, 43200];
  return backoffTable[Math.min(attempts, backoffTable.length - 1)];
}

// Outbox 처리 함수
export async function runOutboxOnce(limit = 20) {
  try {
    // 1) 보낼 대상 가져오기
    const pendings = await EstimateOutbox.findAll({
      where: {
        state: 'PENDING',
        nextAttemptAt: { [Op.lte]: new Date() }
      },
      order: [['id', 'ASC']],
      limit
    });

    console.log(`[OutboxWorker] 처리할 알림 ${pendings.length}개 발견`);

    // 2) 각 알림 처리
    for (const row of pendings) {
      const t = await EstimateOutbox.sequelize.transaction();
      
      try {
        // PROCESSING 상태로 변경
        await row.update({ state: 'PROCESSING' }, { transaction: t });

        const payload = JSON.parse(row.payloadJson);
        await notifyTelegram(payload);

        // 성공 시 SENT 상태로 변경
        await row.update({ state: 'SENT' }, { transaction: t });
        await t.commit();
        
        console.log(`[OutboxWorker] 알림 전송 성공 - ID: ${row.id}`);
        
      } catch (err) {
        await t.rollback();
        
        const attempts = row.attempts + 1;
        const nextAttemptAt = new Date(Date.now() + calcBackoffSeconds(attempts) * 1000);
        const errorMessage = err?.response?.data?.description || err.message;

        // 재시도 또는 실패 처리
        const newState = attempts >= 5 ? 'FAILED' : 'PENDING';
        
        await row.update({
          state: newState,
          attempts,
          nextAttemptAt,
          lastError: errorMessage
        });

        console.error(`[OutboxWorker] 알림 전송 실패 - ID: ${row.id}, 시도: ${attempts}, 에러: ${errorMessage}`);
      }
    }

  } catch (err) {
    console.error('[OutboxWorker] 전체 처리 중 에러:', err.message);
  }
}

// 실패한 알림 재처리 함수
export async function retryFailedNotifications() {
  try {
    const failed = await EstimateOutbox.findAll({
      where: {
        state: 'FAILED',
        attempts: { [Op.lt]: 5 }
      },
      order: [['id', 'ASC']],
      limit: 10
    });

    for (const row of failed) {
      await row.update({
        state: 'PENDING',
        nextAttemptAt: new Date()
      });
    }

    console.log(`[OutboxWorker] 실패한 알림 ${failed.length}개 재처리 대기열로 이동`);
  } catch (err) {
    console.error('[OutboxWorker] 실패 알림 재처리 중 에러:', err.message);
  }
}
