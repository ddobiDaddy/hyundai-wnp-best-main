import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 로그 디렉토리 생성
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 한국 시간(KST, UTC+9) 가져오기
const getKoreaTime = () => {
  const now = new Date();
  const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
  return koreaTime;
};

// 한국 시간으로 날짜 문자열 반환 (YYYY-MM-DD)
const getKoreaDateString = () => {
  const koreaTime = getKoreaTime();
  const year = koreaTime.getUTCFullYear();
  const month = String(koreaTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(koreaTime.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 한국 시간으로 타임스탬프 문자열 반환 (ISO 형식)
const getKoreaTimestamp = () => {
  const koreaTime = getKoreaTime();
  const year = koreaTime.getUTCFullYear();
  const month = String(koreaTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(koreaTime.getUTCDate()).padStart(2, '0');
  const hours = String(koreaTime.getUTCHours()).padStart(2, '0');
  const minutes = String(koreaTime.getUTCMinutes()).padStart(2, '0');
  const seconds = String(koreaTime.getUTCSeconds()).padStart(2, '0');
  const milliseconds = String(koreaTime.getUTCMilliseconds()).padStart(3, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}+09:00`;
};

// 로그 파일 경로 (날짜별 단일 파일)
const getLogFileName = () => {
  const date = getKoreaDateString(); // 한국 시간 기준 날짜
  return path.join(logDir, `app-${date}.log`);
};

// 로그 스트림 생성 (단일 파일)
const appLogStream = (() => {
  const logFile = getLogFileName();
  return fs.createWriteStream(logFile, { flags: 'a' });
})();

// 로그 포맷 함수
const formatLog = (level, message, ...args) => {
  const timestamp = getKoreaTimestamp(); // 한국 시간 기준 타임스탬프
  const formattedArgs = args.length > 0 ? ' ' + args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join(' ') : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${formattedArgs}\n`;
};

// 로그 함수들 (모든 로그를 단일 파일에 저장)
export const logger = {
  info: (message, ...args) => {
    const log = formatLog('info', message, ...args);
    process.stdout.write(log);
    appLogStream.write(log);
  },
  
  warn: (message, ...args) => {
    const log = formatLog('warn', message, ...args);
    process.stdout.write(log);
    appLogStream.write(log);
  },
  
  error: (message, ...args) => {
    const log = formatLog('error', message, ...args);
    process.stderr.write(log);
    appLogStream.write(log);
  },
  
  log: (message, ...args) => {
    const log = formatLog('log', message, ...args);
    process.stdout.write(log);
    appLogStream.write(log);
  }
};

// console 오버라이드 (선택적)
export const overrideConsole = () => {
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info
  };
  
  console.log = (...args) => {
    originalConsole.log(...args);
    const message = args.length > 0 ? String(args[0]) : '';
    const restArgs = args.slice(1);
    logger.log(message, ...restArgs);
  };
  
  console.info = (...args) => {
    originalConsole.info(...args);
    const message = args.length > 0 ? String(args[0]) : '';
    const restArgs = args.slice(1);
    logger.info(message, ...restArgs);
  };
  
  console.warn = (...args) => {
    originalConsole.warn(...args);
    const message = args.length > 0 ? String(args[0]) : '';
    const restArgs = args.slice(1);
    logger.warn(message, ...restArgs);
  };
  
  console.error = (...args) => {
    originalConsole.error(...args);
    const message = args.length > 0 ? String(args[0]) : '';
    const restArgs = args.slice(1);
    logger.error(message, ...restArgs);
  };
};

export default logger;

