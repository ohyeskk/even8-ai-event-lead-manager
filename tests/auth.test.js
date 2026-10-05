import assert from "node:assert/strict";
import process from "node:process";
import test from "node:test";
import handler from "../api/auth.js";
import { requireAuth } from "../lib/auth.js";

process.env.APP_LOGIN_EMAIL = "owner@example.com";
process.env.APP_LOGIN_PASSWORD = "test-owner-password";
process.env.AUTH_SESSION_SECRET = "test-session-secret-that-is-long-enough";

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: "",
    setHeader(name, value) { this.headers[name] = value; },
    end(body) { this.body = body || ""; },
  };
}

test("owner login issues an HttpOnly signed session without returning credentials", async () => {
  const req = {
    method: "POST",
    headers: { origin: "http://localhost:3000", host: "localhost:3000" },
    body: { email: "owner@example.com", password: "test-owner-password" },
  };
  const res = createResponse();
  await handler(req, res);
  assert.equal(res.statusCode, 200);
  assert.match(res.headers["Set-Cookie"], /HttpOnly/);
  assert.match(res.headers["Set-Cookie"], /SameSite=Strict/);
  assert.equal(res.body.includes("test-owner-password"), false);
  assert.equal(res.body.includes("test-session-secret"), false);
  assert.deepEqual(JSON.parse(res.body), { authenticated: true, email: "owner@example.com" });
});

test("wrong owner credentials do not issue a session", async () => {
  const req = {
    method: "POST",
    headers: { origin: "http://localhost:3000", host: "localhost:3000" },
    body: { email: "owner@example.com", password: "wrong-password" },
  };
  const res = createResponse();
  await handler(req, res);
  assert.equal(res.statusCode, 401);
  assert.equal(res.headers["Set-Cookie"], undefined);
});

test("lead write guards reject requests without a valid owner session", () => {
  const res = createResponse();
  const session = requireAuth({ headers: {} }, res);
  assert.equal(session, null);
  assert.equal(res.statusCode, 401);
});

test("login rejects a mismatched request origin", async () => {
  const req = {
    method: "POST",
    headers: { origin: "https://attacker.example", host: "localhost:3000" },
    body: { email: "owner@example.com", password: "test-owner-password" },
  };
  const res = createResponse();
  await handler(req, res);
  assert.equal(res.statusCode, 403);
  assert.equal(res.headers["Set-Cookie"], undefined);
});

