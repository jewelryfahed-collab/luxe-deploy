// Password hashing (PBKDF2 via WebCrypto — workerd-safe) and signed session cookies.

import { getRequestHeader, setResponseHeader } from "@tanstack/react-start/server";
import { createUser, findUserByEmail, type UserRow } from "./db.server";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "./seed";
import type { SessionUser } from "./types";

const COOKIE = "fahed_session";
const encoder = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function fromHex(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

async function pbkdf2(password: string, saltHex: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: fromHex(saltHex), iterations: 100_000 },
    key,
    256,
  );
  return toHex(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)).buffer);
  return `${salt}:${await pbkdf2(password, salt)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  return (await pbkdf2(password, salt)) === hash;
}

async function hmac(data: string): Promise<string> {
  const secret = process.env["SESSION_SECRET"] ?? "dev-only-secret";
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(await crypto.subtle.sign("HMAC", key, encoder.encode(data)));
}

function b64url(s: string): string {
  return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function unb64url(s: string): string {
  const b = s.replace(/-/g, "+").replace(/_/g, "/");
  return decodeURIComponent(escape(atob(b)));
}

export async function createSessionCookie(user: SessionUser): Promise<string> {
  const payload = b64url(JSON.stringify({ ...user, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 }));
  return `${payload}.${await hmac(payload)}`;
}

export async function readSession(): Promise<SessionUser | null> {
  const header = getRequestHeader("cookie") ?? "";
  const raw = header.split(";").map((c) => c.trim()).find((c) => c.startsWith(`${COOKIE}=`));
  if (!raw) return null;
  const value = decodeURIComponent(raw.slice(COOKIE.length + 1));
  const [payload, sig] = value.split(".");
  if (!payload || !sig || (await hmac(payload)) !== sig) return null;
  try {
    const data = JSON.parse(unb64url(payload)) as SessionUser & { exp: number };
    if (data.exp < Date.now()) return null;
    return { id: data.id, email: data.email, name: data.name, role: data.role };
  } catch {
    return null;
  }
}

export async function setSession(user: SessionUser): Promise<void> {
  const cookie = await createSessionCookie(user);
  setResponseHeader("set-cookie", `${COOKIE}=${encodeURIComponent(cookie)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`);
}

export function clearSession(): void {
  setResponseHeader("set-cookie", `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await readSession();
  if (!user || user.role !== "admin") throw new Error("Forbidden");
  return user;
}

// Ensures the seeded admin account exists (first run).
export async function ensureAdmin(): Promise<void> {
  const existing = await findUserByEmail(ADMIN_EMAIL);
  if (existing) return;
  const u: UserRow = {
    id: crypto.randomUUID(),
    email: ADMIN_EMAIL,
    name: "Fahed",
    password_hash: await hashPassword(ADMIN_PASSWORD),
    role: "admin",
    created_at: new Date().toISOString(),
  };
  await createUser(u);
}
