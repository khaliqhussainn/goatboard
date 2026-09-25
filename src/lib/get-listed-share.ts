import "server-only";
import crypto from "node:crypto";

const TOKEN_BYTES = 32;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{40,80}$/;

export function createReportShareToken(): string {
  return crypto.randomBytes(TOKEN_BYTES).toString("base64url");
}

export function isReportShareToken(value: string): boolean {
  return TOKEN_PATTERN.test(value);
}

export function hashReportShareToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
