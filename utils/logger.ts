import { createLogger, transports, format } from "winston";

const logger = createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "logs/combined.log" })
  ]
});

export const requestLogger = (message: string, meta?: object) => 
  logger.info(message, { ...meta, service: "user-service" });

export const errorLogger = (error: Error, context?: object) => 
  logger.error(error.message, { ...context, stack: error.stack });