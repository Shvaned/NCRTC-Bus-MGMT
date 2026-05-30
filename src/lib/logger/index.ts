const LOG_LEVELS = ["debug", "info", "warn", "error"] as const
type LogLevel = (typeof LOG_LEVELS)[number]

const levelPriority: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

function getLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL as LogLevel | undefined
  if (envLevel && envLevel in levelPriority) return envLevel
  return process.env.NODE_ENV === "production" ? "info" : "debug"
}

function shouldLog(level: LogLevel): boolean {
  return levelPriority[level] >= levelPriority[getLevel()]
}

function formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  if (!shouldLog(level)) return

  const ts = new Date().toISOString()
  const prefix = `[${ts}] [${level.toUpperCase()}]`

  const consoleMethod = level === "debug" ? "log" : level === "warn" ? "warn" : level === "error" ? "error" : "info"

  if (meta && Object.keys(meta).length > 0) {
    console[consoleMethod](`${prefix} ${message}`, meta)
  } else {
    console[consoleMethod](`${prefix} ${message}`)
  }
}

export const logger = {
  debug(message: string, meta?: Record<string, unknown>) {
    formatMessage("debug", message, meta)
  },
  info(message: string, meta?: Record<string, unknown>) {
    formatMessage("info", message, meta)
  },
  warn(message: string, meta?: Record<string, unknown>) {
    formatMessage("warn", message, meta)
  },
  error(message: string, meta?: Record<string, unknown>) {
    formatMessage("error", message, meta)
  },
}
