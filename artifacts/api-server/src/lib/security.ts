import {
  createHmac,
  randomBytes,
  scrypt,
  timingSafeEqual,
} from "node:crypto";

const PASSWORD_KEY_LENGTH = 64;
const TOKEN_TTL_SECONDS = 60 * 60;

export type JwtRole = "donor" | "organization" | "admin";

export interface JwtClaims {
  sub: string;
  role: JwtRole;
  iat: number;
  exp: number;
}

function derivePasswordKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, PASSWORD_KEY_LENGTH, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(derivedKey);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  if (password.length < 10 || password.length > 128) {
    throw new Error("Password length is outside the supported range");
  }
  const salt = randomBytes(16);
  const key = await derivePasswordKey(password, salt);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  encodedHash: string,
): Promise<boolean> {
  const [algorithm, saltHex, keyHex, extra] = encodedHash.split("$");
  if (
    algorithm !== "scrypt" ||
    !saltHex ||
    !keyHex ||
    extra !== undefined ||
    !/^[0-9a-f]{32}$/i.test(saltHex) ||
    !/^[0-9a-f]{128}$/i.test(keyHex)
  ) {
    return false;
  }

  try {
    const salt = Buffer.from(saltHex, "hex");
    const expectedKey = Buffer.from(keyHex, "hex");
    const actualKey = await derivePasswordKey(password, salt);
    return timingSafeEqual(actualKey, expectedKey);
  } catch {
    return false;
  }
}

function getSigningSecret(secret: string | undefined): string {
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be configured with at least 32 characters");
  }
  return secret;
}

function encodeJson(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function sign(unsignedToken: string, secret: string): string {
  return createHmac("sha256", getSigningSecret(secret))
    .update(unsignedToken)
    .digest("base64url");
}

export function signJwtToken(
  subject: string,
  role: JwtRole,
  nowSeconds = Math.floor(Date.now() / 1000),
  secret = process.env.SESSION_SECRET,
): string {
  const header = encodeJson({ alg: "HS256", typ: "JWT" });
  const payload = encodeJson({
    sub: subject,
    role,
    iat: nowSeconds,
    exp: nowSeconds + TOKEN_TTL_SECONDS,
  });
  const unsignedToken = `${header}.${payload}`;
  return `${unsignedToken}.${sign(unsignedToken, secret ?? "")}`;
}

export function verifyJwtToken(
  token: string,
  nowSeconds = Math.floor(Date.now() / 1000),
  secret = process.env.SESSION_SECRET,
): JwtClaims | null {
  const segments = token.split(".");
  if (segments.length !== 3 || segments.some((segment) => segment.length === 0)) {
    return null;
  }

  try {
    const [headerSegment, payloadSegment, signature] = segments as [
      string,
      string,
      string,
    ];
    const unsignedToken = `${headerSegment}.${payloadSegment}`;
    const expectedSignature = sign(unsignedToken, secret ?? "");
    const receivedBytes = Buffer.from(signature);
    const expectedBytes = Buffer.from(expectedSignature);
    if (
      receivedBytes.length !== expectedBytes.length ||
      !timingSafeEqual(receivedBytes, expectedBytes)
    ) {
      return null;
    }

    const header = JSON.parse(
      Buffer.from(headerSegment, "base64url").toString("utf8"),
    ) as Record<string, unknown>;
    const payload = JSON.parse(
      Buffer.from(payloadSegment, "base64url").toString("utf8"),
    ) as Partial<JwtClaims>;
    if (
      header.alg !== "HS256" ||
      header.typ !== "JWT" ||
      typeof payload.sub !== "string" ||
      !payload.sub ||
      !["donor", "organization", "admin"].includes(payload.role ?? "") ||
      !Number.isInteger(payload.iat) ||
      !Number.isInteger(payload.exp) ||
      (payload.exp ?? 0) <= nowSeconds ||
      (payload.iat ?? Number.MAX_SAFE_INTEGER) > nowSeconds + 60
    ) {
      return null;
    }

    return payload as JwtClaims;
  } catch {
    return null;
  }
}