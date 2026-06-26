#!/usr/bin/env node
/**
 * End-to-end smoke test for the Bank App REST layer (Phases 1, 2, 4, 5).
 * Drives everything through the gateway. Registers a fresh throwaway user per run.
 *
 *   node scripts/e2e-smoke.mjs
 *   BASE_URL=http://localhost:8080 node scripts/e2e-smoke.mjs
 *
 * Exit code is non-zero if any check fails.
 */

const BASE = process.env.BASE_URL || 'http://localhost:8080';
const results = [];
let token = null;

const uuid = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
const stamp = Date.now();
const EMAIL = `e2e_${stamp}@bankapp.com`;
const PASSWORD = 'Test@1234';

async function api(method, path, { body, auth = true, idem } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  if (idem) headers['X-Idempotency-Key'] = idem;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let json = null;
  const text = await res.text();
  try { json = text ? JSON.parse(text) : null; } catch { /* non-json */ }
  return { status: res.status, json, text };
}

function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  const tag = ok ? '  PASS' : '✗ FAIL';
  console.log(`${tag}  ${name}${detail ? `  — ${detail}` : ''}`);
}

/** assert a predicate; record pass/fail */
function check(name, cond, detail = '') {
  record(name, !!cond, detail);
  return !!cond;
}

const data = (r) => r.json?.data;
const errCode = (r) => r.json?.error;

async function poll(fn, predicate, { tries = 12, delayMs = 1000 } = {}) {
  for (let i = 0; i < tries; i++) {
    const r = await fn();
    if (predicate(r)) return r;
    await new Promise((res) => setTimeout(res, delayMs));
  }
  return fn();
}

async function main() {
  console.log(`\n=== Bank App E2E smoke test ===\nGateway: ${BASE}\nUser:    ${EMAIL}\n`);

  // ─────────────────────────── Phase 1 — Auth ───────────────────────────
  console.log('\n── Phase 1: Auth ──');
  let r = await api('POST', '/api/v1/auth/register',
    { auth: false, body: { email: EMAIL, password: PASSWORD, phone: '+84901234567' } });
  check('register new user', [200, 201].includes(r.status), `HTTP ${r.status}`);

  r = await api('POST', '/api/v1/auth/register',
    { auth: false, body: { email: EMAIL, password: PASSWORD, phone: '+84901234567' } });
  check('duplicate register rejected (409)', r.status === 409, `HTTP ${r.status}`);

  r = await api('POST', '/api/v1/auth/register',
    { auth: false, body: { email: `weak_${stamp}@bankapp.com`, password: 'weak', phone: '+84900000000' } });
  check('weak password rejected (400)', r.status === 400, `HTTP ${r.status}`);

  r = await api('POST', '/api/v1/auth/login',
    { auth: false, body: { email: EMAIL, password: PASSWORD } });
  token = data(r)?.accessToken;
  check('login returns accessToken', r.status === 200 && !!token, `HTTP ${r.status}`);

  r = await api('POST', '/api/v1/auth/login',
    { auth: false, body: { email: EMAIL, password: 'wrong-password' } });
  check('login wrong password rejected (401)', r.status === 401, `HTTP ${r.status}`);

  // A fresh auth user has no user-service profile yet — create it
  r = await api('POST', '/api/v1/users/me',
    { body: { firstName: 'E2E', lastName: 'Tester', dateOfBirth: '1990-01-01', address: '1 Test St', countryCode: 'VN' } });
  check('create user profile (201)', [200, 201].includes(r.status), `HTTP ${r.status}`);

  r = await api('GET', '/api/v1/users/me');
  check('protected /users/me with token (200)', r.status === 200, `HTTP ${r.status}`);

  r = await api('GET', '/api/v1/users/me', { auth: false });
  check('protected /users/me without token (401)', r.status === 401, `HTTP ${r.status}`);

  // ─────────────────────────── Phase 2 — Core Banking ───────────────────
  console.log('\n── Phase 2: Core Banking ──');
  r = await api('POST', '/api/v1/accounts', { body: { accountType: 'CHECKING', currency: 'USD' } });
  const accountA = data(r)?.id;
  check('create account A (201)', r.status === 201 && !!accountA, `HTTP ${r.status}`);

  r = await api('POST', '/api/v1/accounts', { body: { accountType: 'SAVINGS', currency: 'USD' } });
  const accountB = data(r)?.id;
  check('create account B (201)', r.status === 201 && !!accountB, `HTTP ${r.status}`);

  r = await api('POST', `/api/v1/accounts/${accountA}/top-up`, { body: { amount: '1000.00' } });
  check('top-up account A (200)', r.status === 200, `HTTP ${r.status}`);

  const idemTransfer = uuid();
  r = await api('POST', '/api/v1/transactions/transfer', {
    idem: idemTransfer,
    body: { fromAccountId: accountA, toAccountId: accountB, amount: '150.00', currency: 'USD', description: 'E2E transfer' },
  });
  const txId = data(r)?.transactionId;
  check('transfer A→B accepted (202)', r.status === 202 && !!txId, `HTTP ${r.status}`);

  if (txId) {
    const done = await poll(
      () => api('GET', `/api/v1/transactions/${txId}`),
      (rr) => data(rr)?.status === 'COMPLETED' || data(rr)?.status === 'FAILED',
    );
    check('transfer settles to COMPLETED', data(done)?.status === 'COMPLETED', `status=${data(done)?.status}`);
  }

  r = await api('POST', '/api/v1/transactions/transfer', {
    idem: idemTransfer, // same key
    body: { fromAccountId: accountA, toAccountId: accountB, amount: '150.00', currency: 'USD', description: 'E2E transfer' },
  });
  check('idempotent transfer returns same txId (no double-spend)', !!txId && data(r)?.transactionId === txId, `txId match=${!!txId && data(r)?.transactionId === txId}`);

  r = await api('POST', '/api/v1/transactions/transfer', {
    idem: uuid(),
    body: { fromAccountId: accountA, toAccountId: accountA, amount: '10.00', currency: 'USD' },
  });
  check('self-transfer rejected (400)', r.status === 400, `HTTP ${r.status}`);

  r = await api('POST', '/api/v1/transactions/transfer', {
    idem: uuid(),
    body: { fromAccountId: accountA, toAccountId: accountB, amount: '20000.00', currency: 'USD' },
  });
  check('fraud blocks >$10k without KYC (403)', r.status === 403 && errCode(r) === 'FRAUD_BLOCKED', `HTTP ${r.status} ${errCode(r) || ''}`);

  // ─────────────────────────── Phase 4 — Supporting Services ────────────
  console.log('\n── Phase 4: Supporting Services ──');
  r = await api('POST', '/api/v1/cards/virtual', { body: { accountId: accountA } });
  const cardId = data(r)?.id;
  check('create virtual card (201)', r.status === 201 && !!cardId, `HTTP ${r.status}`);

  r = await api('PUT', `/api/v1/cards/${cardId}/freeze`, { body: { freeze: true } });
  check('freeze card → FROZEN', r.status === 200 && data(r)?.status === 'FROZEN', `status=${data(r)?.status}`);

  r = await api('PUT', `/api/v1/cards/${cardId}/freeze`, { body: { freeze: false } });
  check('unfreeze card → ACTIVE', r.status === 200 && data(r)?.status === 'ACTIVE', `status=${data(r)?.status}`);

  r = await api('PUT', `/api/v1/cards/${cardId}/limits`, { body: { dailyLimit: '500.00' } });
  check('set spending limit (200)', r.status === 200, `HTTP ${r.status}`);

  r = await api('GET', '/api/v1/wallets/me');
  check('get/create wallet (200)', r.status === 200, `HTTP ${r.status}`);

  r = await api('POST', '/api/v1/wallets/top-up', { body: { amount: '100.00', paymentMethodToken: 'mock-card-token' } });
  check('wallet top-up (200)', r.status === 200, `HTTP ${r.status}`);

  const beforeWithdraw = data(await api('GET', `/api/v1/accounts/${accountB}`))?.availableBalance;
  r = await api('POST', '/api/v1/wallets/withdraw', { body: { amount: '30.00', toAccountId: accountB } });
  check('wallet withdraw (200)', r.status === 200, `HTTP ${r.status}`);
  const afterWithdraw = data(await api('GET', `/api/v1/accounts/${accountB}`))?.availableBalance;
  check('withdraw credited the bank account (+30)',
    Number(afterWithdraw) - Number(beforeWithdraw) === 30, `${beforeWithdraw} → ${afterWithdraw}`);

  r = await api('GET', '/api/v1/wallets/transactions?page=0&size=20');
  check('wallet transaction history (paginated)', r.status === 200 && Array.isArray(data(r)?.content), `HTTP ${r.status}`);

  // notifications + analytics need the events to have propagated — poll a bit
  const nc = await poll(
    () => api('GET', '/api/v1/notifications/unread-count'),
    (rr) => Number(data(rr)?.unreadCount) >= 1,
  );
  check('notifications unread-count ≥ 1 after events', Number(data(nc)?.unreadCount) >= 1, `count=${data(nc)?.unreadCount}`);

  r = await api('GET', '/api/v1/notifications?page=0&size=20');
  check('notifications list (paginated)', r.status === 200 && Array.isArray(data(r)?.content), `HTTP ${r.status}`);

  r = await api('GET', '/api/v1/analytics/spend/current-month');
  check('analytics current-month summary (200)', r.status === 200 && data(r)?.period, `HTTP ${r.status}`);

  r = await api('GET', '/api/v1/analytics/audit-logs?page=0&size=10');
  check('analytics audit-logs forbidden for USER (403)', r.status === 403, `HTTP ${r.status}`);

  // ─────────────────────────── Phase 5 — Card Payments ──────────────────
  console.log('\n── Phase 5: Card Payments ──');
  r = await api('POST', `/api/v1/cards/${cardId}/pay`, {
    idem: uuid(),
    body: { merchant: 'Coffee Shop', amount: '12.50', currency: 'USD' },
  });
  check('card payment success (201 COMPLETED)', r.status === 201 && data(r)?.status === 'COMPLETED', `HTTP ${r.status} ${data(r)?.status || ''}`);

  const idemPay = uuid();
  const first = await api('POST', `/api/v1/cards/${cardId}/pay`, {
    idem: idemPay, body: { merchant: 'Bookstore', amount: '7.00', currency: 'USD' },
  });
  const replay = await api('POST', `/api/v1/cards/${cardId}/pay`, {
    idem: idemPay, body: { merchant: 'Bookstore', amount: '7.00', currency: 'USD' },
  });
  check('card payment idempotent (same tx, no double-charge)',
    data(first)?.id && data(first)?.id === data(replay)?.id, `id match=${data(first)?.id === data(replay)?.id}`);

  // Raise the limit high so the amount clears the daily-limit check and reaches the debit step
  await api('PUT', `/api/v1/cards/${cardId}/limits`, { body: { dailyLimit: '99999999.00' } });
  r = await api('POST', `/api/v1/cards/${cardId}/pay`, {
    idem: uuid(), body: { merchant: 'Megastore', amount: '999999.00', currency: 'USD' },
  });
  check('card payment insufficient funds (422)', r.status === 422 && errCode(r) === 'INSUFFICIENT_FUNDS', `HTTP ${r.status} ${errCode(r) || ''}`);

  await api('PUT', `/api/v1/cards/${cardId}/limits`, { body: { dailyLimit: '100.00' } });
  r = await api('POST', `/api/v1/cards/${cardId}/pay`, {
    idem: uuid(), body: { merchant: 'Electronics', amount: '150.00', currency: 'USD' },
  });
  check('card payment over daily limit (422 LIMIT_EXCEEDED)', r.status === 422 && errCode(r) === 'LIMIT_EXCEEDED', `HTTP ${r.status} ${errCode(r) || ''}`);

  await api('PUT', `/api/v1/cards/${cardId}/freeze`, { body: { freeze: true } });
  r = await api('POST', `/api/v1/cards/${cardId}/pay`, {
    idem: uuid(), body: { merchant: 'Cafe', amount: '5.00', currency: 'USD' },
  });
  check('frozen card payment declined (403 CARD_FROZEN)', r.status === 403 && errCode(r) === 'CARD_FROZEN', `HTTP ${r.status} ${errCode(r) || ''}`);
  await api('PUT', `/api/v1/cards/${cardId}/freeze`, { body: { freeze: false } }); // cleanup

  r = await api('GET', `/api/v1/cards/${cardId}/transactions?page=0&size=20`);
  const hasCompleted = (data(r)?.content || []).some((t) => t.status === 'COMPLETED');
  const hasDeclined = (data(r)?.content || []).some((t) => t.status === 'DECLINED');
  check('per-card transaction history has completed + declined', r.status === 200 && hasCompleted && hasDeclined, `completed=${hasCompleted} declined=${hasDeclined}`);

  // ─────────────────────────── Summary ──────────────────────────────────
  const passed = results.filter((x) => x.ok).length;
  const failed = results.length - passed;
  console.log(`\n=== Summary: ${passed}/${results.length} passed, ${failed} failed ===`);
  if (failed > 0) {
    console.log('\nFailures:');
    results.filter((x) => !x.ok).forEach((x) => console.log(`  ✗ ${x.name}  (${x.detail})`));
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('\nRunner crashed:', e);
  process.exit(2);
});
