import { createHmac, timingSafeEqual } from "node:crypto";
import { Buffer } from "node:buffer";
import process from "node:process";
import { sendJson } from "./api-utils.js";

const COOKIE_NAME = "even8_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 12;

function sessionSecret() {
  return process.env.AUTH_SESSION_SECRET || "";
}

function signature(payload) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function parseCookies(header = "") {
  return Object.fromEntries(header.split(";").map((part) => {
    const separator = part.indexOf("=");
    if (separator < 0) return ["", ""];
    return [part.slice(0, separator).trim(), part.slice(separator + 1).trim()];
  }).filter(([key]) => key));
}

export function isAuthConfigured() {
  return Boolean(process.env.APP_LOGIN_EMAIL && process.env.APP_LOGIN_PASSWORD && sessionSecret());
}

export function getSession(req) {
  if (!isAuthConfigured()) return null;
  const token = parseCookies(req.headers?.cookie)[COOKIE_NAME];
  if (!token) return null;
  const separator = token.lastIndexOf(".");
  if (separator < 0) return null;
  const payload = token.slice(0, separator);
  const suppliedSignature = token.slice(separator + 1);
  if (!safeEqual(signature(payload), suppliedSignature)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (session.expiresAt <= Date.now() || session.email !== process.env.APP_LOGIN_EMAIL) return null;
    return session;
  } catch {
    return null;
  }
}

export function requireAuth(req, res) {
  const session = getSession(req);
  if (!session) {
    sendJson(res, 401, { error: "Sign in as the owner to use this feature." });
    return null;
  }
  return session;
}

export function isSameOrigin(req) {
  const origin = req.headers?.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers?.host;
  } catch {
    return false;
  }
}

export function createSessionCookie(email) {
  const expiresAt = Date.now() + SESSION_DURATION_SECONDS * 1000;
  const payload = Buffer.from(JSON.stringify({ email, expiresAt })).toString("base64url");
  const token = `${payload}.${signature(payload)}`;
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_DURATION_SECONDS}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}
