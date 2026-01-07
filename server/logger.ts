type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  requestId?: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatLog(entry: LogEntry): string {
  const base = {
    timestamp: entry.timestamp,
    level: entry.level.toUpperCase(),
    message: entry.message,
    ...(entry.requestId && { requestId: entry.requestId }),
    ...(entry.context && { ...entry.context }),
  };
  
  if (process.env.NODE_ENV === 'production') {
    return JSON.stringify(base);
  }
  
  const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
  const reqIdStr = entry.requestId ? ` [${entry.requestId}]` : '';
  return `[${entry.timestamp}] ${entry.level.toUpperCase()}${reqIdStr}: ${entry.message}${contextStr}`;
}

function log(level: LogLevel, message: string, context?: Record<string, any>, requestId?: string): void {
  if (!shouldLog(level)) return;
  
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
    requestId,
  };
  
  const formatted = formatLog(entry);
  
  switch (level) {
    case 'error':
      console.error(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    default:
      console.log(formatted);
  }
}

export const logger = {
  debug: (message: string, context?: Record<string, any>, requestId?: string) => 
    log('debug', message, context, requestId),
  info: (message: string, context?: Record<string, any>, requestId?: string) => 
    log('info', message, context, requestId),
  warn: (message: string, context?: Record<string, any>, requestId?: string) => 
    log('warn', message, context, requestId),
  error: (message: string, context?: Record<string, any>, requestId?: string) => 
    log('error', message, context, requestId),
};

export function requestLogger() {
  return (req: any, res: any, next: any) => {
    const requestId = `req-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
    req.requestId = requestId;
    
    const start = Date.now();
    const path = req.path;
    const method = req.method;
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const status = res.statusCode;
      
      const level: LogLevel = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
      
      logger[level](`${method} ${path}`, {
        status,
        duration: `${duration}ms`,
        ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
      }, requestId);
    });
    
    next();
  };
}

export function logSecurityEvent(event: string, context: Record<string, any>): void {
  logger.warn(`SECURITY: ${event}`, {
    ...context,
    securityEvent: true,
  });
}

export function logDatabaseError(operation: string, error: any, context?: Record<string, any>): void {
  logger.error(`Database error in ${operation}`, {
    error: error.message || String(error),
    code: error.code,
    ...context,
  });
}
