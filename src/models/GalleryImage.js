import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const GalleryImage = sequelize.define('GalleryImage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '이미지 제목',
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '이미지 설명',
    validate: {
      len: [0, 1000]
    }
  },
  filename: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '저장된 파일명'
  },
  originalName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '원본 파일명'
  },
  filePath: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: '파일 경로'
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '파일 크기 (bytes)'
  },
  mimeType: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'MIME 타입'
  },
  width: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '이미지 너비'
  },
  height: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '이미지 높이'
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'facility',
    comment: '이미지 카테고리'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: '활성화 상태'
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '정렬 순서'
  }
}, {
  tableName: 'gallery_images',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  indexes: [
    {
      fields: ['category', 'is_active', 'sort_order']
    },
    {
      fields: ['is_active']
    }
  ]
});

export default GalleryImage;
