import { Sequelize } from 'sequelize';

// DB 연결 설정
const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  timezone: '+09:00', // 한국 시간대 설정 (KST, UTC+9)
  dialectOptions: {
    timezone: 'local' // MySQL 서버의 로컬 시간대 사용
  },
  logging: false, // SQL 로그 비활성화 (프로덕션에서)
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true, // createdAt, updatedAt 자동 생성
    underscored: true, // snake_case 사용
    freezeTableName: true // 테이블명 복수형 방지
  }
});

// DB 연결 테스트 및 테이블 동기화
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결이 성공적으로 설정되었습니다.');
    
    // MySQL 시간대를 한국 시간으로 설정
    await sequelize.query("SET time_zone = '+09:00'");
    console.log('✅ 데이터베이스 시간대가 한국 시간(UTC+9)으로 설정되었습니다.');
    
    // 테이블 자동 생성/동기화
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ 데이터베이스 테이블이 동기화되었습니다.');
  } catch (error) {
    console.error('❌ 데이터베이스 연결에 실패했습니다:', error.message);
  }
};

export { sequelize, testConnection };
