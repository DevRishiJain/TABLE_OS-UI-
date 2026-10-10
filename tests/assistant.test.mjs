import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import ts from "typescript";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "../src/lib/assistant.ts"), "utf8");

const { outputText } = ts.transpileModule(src, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
});
const mod = await import(`data:text/javascript;charset=utf-8,${encodeURIComponent(outputText)}`);

const { getAssistantContext, assistantHistory, askAssistant } = mod;

test("context: login-family routes resolve to login", () => {
  for (const p of [
    "/login",
    "/staff/login",
    "/staff/forgot-password",
    "/staff/reset-password",
    "/forgot-password",
    "/reset-password",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/spadmin/login",
    "/r/some-slug/staff/login",
  ]) {
    assert.equal(getAssistantContext(p).page, "login", p);
  }
});

test("context: boundary-safe prefixes don't leak", () => {
  assert.equal(getAssistantContext("/spadministrator").page, "general");
  assert.equal(getAssistantContext("/signup-unrelated").page, "general");
  assert.equal(getAssistantContext("/kitchenette").page, "general");
  assert.equal(getAssistantContext("/admin").page, "platform");
  assert.equal(getAssistantContext("/admin/restaurants").page, "platform");
  assert.equal(getAssistantContext("/spadmin").page, "platform");
  assert.equal(getAssistantContext("/spadmin/restaurants/abc").page, "platform");
});

test("context: onboarding", () => {
  assert.equal(getAssistantContext("/signup").page, "onboarding");
  assert.equal(getAssistantContext("/restaurant/onboarding").page, "onboarding");
});

test("context: customer dining flows", () => {
  assert.equal(getAssistantContext("/dine/some-session/menu").page, "menu");
  assert.equal(getAssistantContext("/dine/some-session/checkout").page, "ordering");
  assert.equal(getAssistantContext("/dine/some-session/bill").page, "billing");
  assert.equal(getAssistantContext("/dine/some-session/orders").page, "ordering");
  assert.equal(getAssistantContext("/dine/some-session").page, "ordering");
  assert.equal(getAssistantContext("/t/TBL-ABC123").page, "ordering");
});

test("context: staff + ops routes", () => {
  assert.equal(getAssistantContext("/staff/orders").page, "staff");
  assert.equal(getAssistantContext("/staff/tables").page, "tables");
  assert.equal(getAssistantContext("/staff/payments").page, "payments");
  assert.equal(getAssistantContext("/kitchen/queue").page, "kitchen");
  assert.equal(getAssistantContext("/guard/scan").page, "staff");
});

test("context: tenant admin sections", () => {
  assert.equal(getAssistantContext("/restaurant/subscription").page, "subscription");
  assert.equal(getAssistantContext("/restaurant/franchise").page, "franchise");
  assert.equal(getAssistantContext("/restaurant/inventory").page, "inventory");
  assert.equal(getAssistantContext("/restaurant/expenses").page, "inventory");
  assert.equal(getAssistantContext("/restaurant/analytics").page, "inventory");
  assert.equal(getAssistantContext("/restaurant/settlements").page, "inventory");
  assert.equal(getAssistantContext("/restaurant/tables").page, "tables");
  assert.equal(getAssistantContext("/restaurant/menu").page, "menu");
  assert.equal(getAssistantContext("/restaurant/staff").page, "staff");
  assert.equal(getAssistantContext("/restaurant/settings").page, "settings");
  assert.equal(getAssistantContext("/restaurant/dashboard").page, "dashboard");
  assert.equal(getAssistantContext("/restaurant/anything-new").page, "dashboard");
  assert.equal(getAssistantContext("/brand/dashboard").page, "dashboard");
});

test("context: home, /r slug, unknown", () => {
  assert.equal(getAssistantContext("/").page, "home");
  assert.equal(getAssistantContext("/r/some-slug").page, "home");
  assert.equal(getAssistantContext("/totally/unknown/route").page, "general");
});

test("context: never leaks path IDs or queries", () => {
  for (const p of [
    "/dine/SECRET-SESSION-123/menu?token=abc",
    "/spadmin/restaurants/9f8e7d6c-id",
    "/restaurant/subscription?debug=1",
    "/t/TBL-XX-987",
    "/r/some-slug/staff/login?redirect=/x",
  ]) {
    const ctx = getAssistantContext(p);
    const blob = JSON.stringify(ctx);
    assert.ok(!blob.includes("SECRET-SESSION-123"), p);
    assert.ok(!blob.includes("9f8e7d6c-id"), p);
    assert.ok(!blob.includes("TBL-XX-987"), p);
    assert.ok(!blob.includes("some-slug"), p);
    assert.ok(!blob.includes("token=abc"), p);
    assert.ok(!blob.includes("debug"), p);
    assert.equal(ctx.suggestions.length, 3);
  }
});

test("history: keeps last 3 complete pairs, drops trailing pending user", () => {
  const msgs = [];
  for (let i = 0; i < 5; i++) {
    msgs.push({ role: "user", text: `q${i}` });
    msgs.push({ role: "assistant", text: `a${i}` });
  }
  msgs.push({ role: "user", text: "pending" });
  const h = assistantHistory(msgs);
  assert.equal(h.length, 6);
  assert.equal(h[0].text, "q2");
  assert.equal(h[5].text, "a4");
});

test("history: strict alternation enforced, empty/garbage dropped", () => {
  assert.deepEqual(assistantHistory([{ role: "user", text: "  " }]), []);
  assert.deepEqual(assistantHistory(null), []);
  assert.deepEqual(
    assistantHistory([
      { role: "assistant", text: "a" },
      { role: "user", text: "b" },
    ]),
    []
  );
  const long = assistantHistory([{ role: "user", text: "x".repeat(1500) }, { role: "assistant", text: "ok" }]);
  assert.equal(long[0].text.length, 1000);
});

function mockFetch(status, body, capture) {
  const calls = [];
  globalThis.fetch = async (url, opts) => {
    calls.push({ url, opts });
    if (capture) capture(url, opts);
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    };
  };
  return calls;
}

const okReply = { answer: "Use the subscription page.", source: "guide" };

test("askAssistant: correct URL, method, headers, body; credentials omitted", async () => {
  let seen;
  mockFetch(200, okReply, (u, o) => (seen = { u, o }));
  const out = await askAssistant("How do I renew?", "subscription", [], new AbortController().signal);
  assert.equal(out.answer, "Use the subscription page.");
  assert.equal(seen.u, "/api/v1/public/assistant/chat");
  assert.equal(seen.o.method, "POST");
  assert.equal(seen.o.credentials, "omit");
  assert.equal(seen.o.cache, "no-store");
  assert.equal(seen.o.headers["Content-Type"], "application/json");
  const body = JSON.parse(seen.o.body);
  assert.equal(body.message, "How do I renew?");
  assert.equal(body.page, "subscription");
  assert.deepEqual(body.history, []);
  for (const k of Object.keys(seen.o.headers)) {
    assert.ok(!/auth|token|cookie|session/i.test(k), k);
  }
});

test("askAssistant: 429 gives friendly wait error", async () => {
  mockFetch(429, {});
  await assert.rejects(
    () => askAssistant("hi", "general", [], new AbortController().signal),
    (e) => e.status === 429 && /wait/i.test(e.message)
  );
});

test("askAssistant: non-ok and malformed payload rejected", async () => {
  mockFetch(500, { error: "upstream secret detail" });
  await assert.rejects(
    () => askAssistant("hi", "general", [], new AbortController().signal),
    (e) => e.status === 500 && !/upstream secret/.test(e.message)
  );
  mockFetch(200, { answer: 42 });
  await assert.rejects(() => askAssistant("hi", "general", [], new AbortController().signal));
  mockFetch(200, { answer: "hi", source: "something-else" });
  await assert.rejects(() => askAssistant("hi", "general", [], new AbortController().signal));
  mockFetch(200, { answer: "   ", source: "guide" });
  await assert.rejects(() => askAssistant("hi", "general", [], new AbortController().signal));
});

test("askAssistant: overlong answer rejected not truncated", async () => {
  mockFetch(200, { answer: "y".repeat(4100), source: "gemini" });
  await assert.rejects(() => askAssistant("hi", "general", [], new AbortController().signal));
});
