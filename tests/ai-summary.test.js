import assert from "node:assert/strict";
import process from "node:process";
import test from "node:test";
import handler from "../api/ai-summary.js";

function postRequest(body) {
  return { method: "POST", headers: {}, body };
}

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: "",
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end(body) {
      this.body = body || "";
    },
  };
}

test("empty notes return a friendly validation message without calling Gemini", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.GEMINI_API_KEY;
  let fetchCalls = 0;
  process.env.GEMINI_API_KEY = "test-gemini-key";
  globalThis.fetch = async () => {
    fetchCalls += 1;
    throw new Error("Gemini should not be called for empty notes.");
  };

  try {
    const res = createResponse();
    await handler(postRequest({ notes: "  \n " }), res);
    assert.equal(res.statusCode, 400);
    assert.match(JSON.parse(res.body).error, /add conversation notes/i);
    assert.equal(fetchCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
  }
});

const rahulNotes = "Met Rahul at the event. He is interested in our analytics platform and asked about enterprise pricing and integration options. He said he would like more information and suggested following up next week.";

test("the current Rahul notes produce a complete summary with all text parts returned", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.GEMINI_API_KEY;
  const originalModel = process.env.GEMINI_MODEL;
  process.env.GEMINI_API_KEY = "test-gemini-key";
  delete process.env.GEMINI_MODEL;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent");
    assert.equal(options.headers["x-goog-api-key"], "test-gemini-key");
    const requestBody = JSON.parse(options.body);
    assert.equal(requestBody.contents[0].parts[0].text, rahulNotes);
    assert.equal(requestBody.generationConfig.maxOutputTokens, 256);
    assert.match(requestBody.systemInstruction.parts[0].text, /complete.*sentences/i);
    assert.match(requestBody.systemInstruction.parts[0].text, /ONLY the summary text/i);
    return new Response(JSON.stringify({
      candidates: [{
        finishReason: "STOP",
        content: { parts: [
          { text: "Rahul is interested in the analytics platform and asked about enterprise pricing and integration options. " },
          { text: "He wants more information, with a follow-up next week." },
        ] },
      }],
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  };

  try {
    const res = createResponse();
    await handler(postRequest({ notes: rahulNotes }), res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(JSON.parse(res.body), {
      summary: "Rahul is interested in the analytics platform and asked about enterprise pricing and integration options. He wants more information, with a follow-up next week.",
    });
    assert.equal(res.body.includes("test-gemini-key"), false);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
    if (originalModel === undefined) delete process.env.GEMINI_MODEL;
    else process.env.GEMINI_MODEL = originalModel;
  }
});

test("a temporary 503 is retried once and can recover", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.GEMINI_API_KEY;
  const originalModel = process.env.GEMINI_MODEL;
  process.env.GEMINI_API_KEY = "test-gemini-key";
  delete process.env.GEMINI_MODEL;
  let fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    if (fetchCalls === 1) {
      return new Response(JSON.stringify({ error: { code: 503, status: "UNAVAILABLE" } }), { status: 503 });
    }
    return new Response(JSON.stringify({
      candidates: [{
        finishReason: "STOP",
        content: { parts: [{ text: "Rahul is interested in the analytics platform and asked about pricing and integration. He wants more information, with a follow-up next week." }] },
      }],
    }), { status: 200 });
  };

  try {
    const res = createResponse();
    await handler(postRequest({ notes: rahulNotes }), res);
    assert.equal(fetchCalls, 2);
    assert.equal(res.statusCode, 200);
    assert.match(JSON.parse(res.body).summary, /follow-up next week/);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
    if (originalModel === undefined) delete process.env.GEMINI_MODEL;
    else process.env.GEMINI_MODEL = originalModel;
  }
});

test("a persistent Gemini 503 returns a clear temporary-unavailability error", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.GEMINI_API_KEY;
  const originalModel = process.env.GEMINI_MODEL;
  process.env.GEMINI_API_KEY = "test-gemini-key";
  delete process.env.GEMINI_MODEL;
  let fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    return new Response(JSON.stringify({
      error: { code: 503, status: "UNAVAILABLE", message: "This model is currently experiencing high demand." },
    }), { status: 503 });
  };

  try {
    const res = createResponse();
    await handler(postRequest({ notes: rahulNotes }), res);
    assert.equal(fetchCalls, 2);
    assert.equal(res.statusCode, 503);
    assert.match(JSON.parse(res.body).error, /temporarily busy/i);
    assert.equal(res.body.includes("test-gemini-key"), false);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
    if (originalModel === undefined) delete process.env.GEMINI_MODEL;
    else process.env.GEMINI_MODEL = originalModel;
  }
});

test("an incomplete Gemini response is rejected instead of shown", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = "test-gemini-key";
  globalThis.fetch = async () => new Response(JSON.stringify({
    candidates: [{ finishReason: "STOP", content: { parts: [{ text: "Rahul is interested in" }] } }],
  }), { status: 200, headers: { "Content-Type": "application/json" } });

  try {
    const res = createResponse();
    await handler(postRequest({ notes: rahulNotes }), res);
    assert.equal(res.statusCode, 502);
    assert.match(JSON.parse(res.body).error, /incomplete summary/i);
    assert.equal(JSON.parse(res.body).summary, undefined);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
  }
});

test("a token-limited Gemini response is rejected even if it ends with punctuation", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = "test-gemini-key";
  globalThis.fetch = async () => new Response(JSON.stringify({
    candidates: [{ finishReason: "MAX_TOKENS", content: { parts: [{ text: "Rahul is interested in the analytics platform." }] } }],
  }), { status: 200, headers: { "Content-Type": "application/json" } });

  try {
    const res = createResponse();
    await handler(postRequest({ notes: rahulNotes }), res);
    assert.equal(res.statusCode, 502);
    assert.match(JSON.parse(res.body).error, /incomplete summary/i);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
  }
});

