import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

// 텔레그램 알림을 위한 Outbox 모델
const EstimateOutbox = sequelize.define('EstimateOutbox', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  estimateId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '견적 ID'
  },
  payloadJson: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
    comment: '텔레그램 전송할 페이로드 (JSON)'
  },
  state: {
    type: DataTypes.ENUM('PENDING', 'PROCESSING', 'SENT', 'FAILED'),
    allowNull: false,
    defaultValue: 'PENDING',
    comment: '처리 상태'
  },
  attempts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '재시도 횟수'
  },
  nextAttemptAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: '다음 재시도 시간'
  },
  lastError: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '마지막 에러 메시지'
  }
}, {
  tableName: 'estimate_outbox',
  comment: '견적 텔레그램 알림 아웃박스 테이블',
  indexes: [
    {
      fields: ['state']
    },
    {
      fields: ['nextAttemptAt']
    },
    {
      fields: ['estimateId']
    }
  ]
});

export default EstimateOutbox;
