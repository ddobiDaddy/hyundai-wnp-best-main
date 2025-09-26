import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

// 견적 문의 모델 정의
const Estimate = sequelize.define('Estimate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  companyName: {
    type: DataTypes.STRING(2000),
    allowNull: false,
    validate: {
      len: [1, 2000]
    },
    comment: '업체명 또는 성함'
  },
  contactName: {
    type: DataTypes.STRING(2000),
    allowNull: false,
    validate: {
      len: [1, 2000]
    },
    comment: '담당자명'
  },
  phone: {
    type: DataTypes.STRING(2000),
    allowNull: false,
    validate: {
      len: [1, 2000]
    },
    comment: '연락처'
  },
  email: {
    type: DataTypes.STRING(2000),
    allowNull: false,
    validate: {
      isEmail: true,
      len: [1, 2000]
    },
    comment: '이메일'
  },
  serviceType: {
    type: DataTypes.ENUM('health', 'sauna', 'corporate', 'school', 'other'),
    allowNull: false,
    comment: '서비스 유형'
  },
  laundryType: {
    type: DataTypes.ENUM('workout', 'towel', 'sauna', 'uniform', 'bedding', 'mixed'),
    allowNull: false,
    comment: '세탁물 유형'
  },
  frequency: {
    type: DataTypes.ENUM('daily', 'weekly', 'biweekly', 'monthly', 'one-time'),
    allowNull: false,
    comment: '세탁 빈도'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    },
    comment: '수량'
  },
  location: {
    type: DataTypes.STRING(2000),
    allowNull: false,
    validate: {
      len: [1, 2000]
    },
    comment: '위치'
  },
  specialRequirements: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 2000]
    },
    comment: '특별 요구사항'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 2000]
    },
    comment: '기타 문의사항'
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'cancelled'),
    defaultValue: 'pending',
    comment: '처리 상태'
  },
  adminNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 2000]
    },
    comment: '관리자 메모'
  }
}, {
  tableName: 'estimates',
  comment: '견적 문의 테이블',
  indexes: [
    {
      fields: ['status']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['email']
    }
  ]
});

export default Estimate;
