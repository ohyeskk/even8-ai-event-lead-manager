import process from "node:process";
import { parseBody, sendJson } from "../lib/api-utils.js";
import { clearSessionCookie, createSessionCookie, getSession, isAuthConfigured, isSameOrigin, safeEqual } from "../lib/auth.js";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const session = getSession(req);
    return sendJson(res, 200, { authenticated: Boolean(session), email: session?.email || null, configured: isAuthConfigured() });
  }

  if (!["POST", "DELETE"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST, DELETE");
    return sendJson(res, 405, { error: "Method not allowed." });
  }
  if (!isSameOrigin(req)) return sendJson(res, 403, { error: "Request origin could not be verified." });

  if (req.method === "DELETE") {
    res.setHeader("Set-Cookie", clearSessionCookie());
    return sendJson(res, 200, { authenticated: false });
  }

  if (!isAuthConfigured()) return sendJson(res, 503, { error: "Owner sign-in is not configured yet." });
  let input;
  try { input = parseBody(req); } catch { return sendJson(res, 400, { error: "Request body must be valid JSON." }); }
  const email = typeof input?.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input?.password === "string" ? input.password : "";
  const expectedEmail = process.env.APP_LOGIN_EMAIL.trim().toLowerCase();
  if (email !== expectedEmail || !safeEqual(password, process.env.APP_LOGIN_PASSWORD)) {
    return sendJson(res, 401, { error: "Email or password is incorrect." });
  }
  res.setHeader("Set-Cookie", createSessionCookie(process.env.APP_LOGIN_EMAIL));
  return sendJson(res, 200, { authenticated: true, email: process.env.APP_LOGIN_EMAIL });
}

