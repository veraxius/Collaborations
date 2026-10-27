import jwt from "jsonwebtoken";
import crypto from "crypto";

/**
 * Single-purpose signed tokens for links sent by email (password reset,
 * invitation, email verification). The signing key mixes JWT_SECRET, the
 * purpose and a piece of server state (`state`), so a token stops working as
 * soon as that state changes, for example once the password has been set.
 */
function key(purpose, state) {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not set");
  return `${process.env.JWT_SECRET}:${purpose}:${state}`;
}

export function signPurposeToken(purpose, subjectId, state, expiresIn) {
  return jwt.sign({ sub: subjectId, purpose }, key(purpose, state), { expiresIn });
}

/** True when the token is valid for this purpose, subject and state. Never throws. */
export function verifyPurposeToken(token, purpose, subjectId, state) {
  try {
    const payload = jwt.verify(String(token ?? ""), key(purpose, state));
    return payload.purpose === purpose && payload.sub === subjectId;
  } catch {
    return false;
  }
}

/** Short fingerprint of a password hash, stored in session tokens so a password change signs everyone out. */
export function fingerprint(value) {
  return crypto.createHash("sha256").update(String(value ?? "")).digest("hex").slice(0, 16);
}
