import pino, { type TransportSingleOptions } from "pino";

function makeTransport(): TransportSingleOptions | undefined {
  if (process.env.NODE_ENV === "development") {
    return {
      target: "pino-pretty",
      options: { colorize: true },
    };
  }
  return undefined;
}

const transport = makeTransport();

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  ...(transport ? { transport } : {}), // nur setzen, wenn vorhanden
});
