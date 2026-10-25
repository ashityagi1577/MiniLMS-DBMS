'use strict';
/**
 * ratelimit.js - in-memory login rate limiting.
 *
 * Only FAILED password checks are counted (malformed requests and successful
 * logins are not). Two sliding windows are kept:
 *   - per (client IP + e-mail): stops guessing one account's password;
 *   - per client IP: bounds scripted e-mail cycling.
 *
 * LIMITATION: the counters live in this Node process only. Restarting the
 * server resets them, and several server instances would each keep their own
 * counters. For a real deployment use a shared store (e.g. Redis) or a
 * maintained middleware backed by one. Nothing here logs request bodies,
 * passwords or tokens.
 */

function positiveInt(raw, fallback) {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

const WINDOW_MS = positiveInt(process.env.LOGIN_RATE_WINDOW_MS, 15 * 60 * 1000);
const MAX_PER_ACCOUNT = positiveInt(process.env.LOGIN_RATE_MAX_PER_ACCOUNT, 5);
const MAX_PER_IP = positiveInt(process.env.LOGIN_RATE_MAX_PER_IP, 100);

const accountHits = new Map(); // 'ip|email' -> [failure timestamps, oldest first]
const ipHits = new Map();      // 'ip'        -> [failure timestamps, oldest first]

function accountKey(ip, email) {
  return `${ip}|${email}`;
}

function prune(list, now) {
  let i = 0;
  while (i < list.length && now - list[i] >= WINDOW_MS) i += 1;
  if (i) list.splice(0, i);
  return list;
}

function retryAfterMs(list, now) {
  return list.length ? Math.max(0, list[0] + WINDOW_MS - now) : 0;
}

/** Would the next attempt from this IP/e-mail be blocked right now? */
function check(ip, email) {
  const now = Date.now();
  const account = prune(accountHits.get(accountKey(ip, email)) || [], now);
  const byIp = prune(ipHits.get(ip) || [], now);
  if (account.length < MAX_PER_ACCOUNT && byIp.length < MAX_PER_IP) {
    return { blocked: false, retryAfterSeconds: 0 };
  }
  const waitMs = Math.max(retryAfterMs(account, now), retryAfterMs(byIp, now), 1000);
  return { blocked: true, retryAfterSeconds: Math.ceil(waitMs / 1000) };
}

/** Record one failed password check. */
function recordFailure(ip, email) {
  const now = Date.now();
  const aKey = accountKey(ip, email);
  const account = prune(accountHits.get(aKey) || [], now);
  account.push(now);
  accountHits.set(aKey, account);
  const byIp = prune(ipHits.get(ip) || [], now);
  byIp.push(now);
  ipHits.set(ip, byIp);
  if (accountHits.size > 5000 || ipHits.size > 5000) sweep(now);
}

/** A successful sign-in clears the per-account window (not the IP guard). */
function recordSuccess(ip, email) {
  accountHits.delete(accountKey(ip, email));
}

/** Drop empty/expired buckets so a long-running process does not grow forever. */
function sweep(now = Date.now()) {
  for (const [key, list] of accountHits) {
    prune(list, now);
    if (!list.length) accountHits.delete(key);
  }
  for (const [key, list] of ipHits) {
    prune(list, now);
    if (!list.length) ipHits.delete(key);
  }
}

module.exports = {
  check,
  recordFailure,
  recordSuccess,
  sweep,
  WINDOW_MS,
  MAX_PER_ACCOUNT,
  MAX_PER_IP,
};
