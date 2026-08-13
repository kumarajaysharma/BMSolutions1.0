/**
 * src/lib/auth.ts
 *
 * BNLV Studio — Zero-Trust Authentication & Session Management (Server-Only)
 */
import { cookies } from "next/headers";
import { encrypt, decrypt, SessionPayload } from "./jwt";

export type { SessionPayload };
export { encrypt, decrypt };

export async function createSessionCookie(payload: SessionPayload) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  const sessionToken = await encrypt(payload);

  const cookieStore = await cookies();
  cookieStore.set("bms_session", sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    expires,
  });
}

export async function deleteSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("bms_session");
}