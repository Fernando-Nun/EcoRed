import {
  hashPassword,
  signJwtToken,
  verifyJwtToken,
  verifyPassword,
} from "./security";
import { createHmac } from "node:crypto";
import { describe, expect, it } from "@jest/globals";

const secret = "unit-test-secret-that-is-long-enough-32";

function signRawJwt(
  header: Record<string, unknown>,
  payload: Record<string, unknown>,
): string {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const unsigned = `${encode(header)}.${encode(payload)}`;
  const signature = createHmac("sha256", secret)
    .update(unsigned)
    .digest("base64url");
  return `${unsigned}.${signature}`;
}

describe("password protection", () => {
  it("hashes passwords using a unique salt and verifies the correct value", async () => {
    const firstHash = await hashPassword("circular-economy-pass");
    const secondHash = await hashPassword("circular-economy-pass");
    expect(firstHash).not.toBe(secondHash);
    await expect(verifyPassword("circular-economy-pass", firstHash)).resolves.toBe(
      true,
    );
    await expect(verifyPassword("incorrect-password", firstHash)).resolves.toBe(
      false,
    );
  });

  it("rejects malformed password hashes and out-of-range new passwords", async () => {
    await expect(verifyPassword("whatever-password", "plain-text")).resolves.toBe(
      false,
    );
    await expect(verifyPassword("whatever-password", "argon2$abc$def")).resolves.toBe(
      false,
    );
    await expect(
      verifyPassword("whatever-password", "scrypt$missing"),
    ).resolves.toBe(false);
    await expect(
      verifyPassword("whatever-password", `scrypt$${"a".repeat(32)}$${"b".repeat(127)}`),
    ).resolves.toBe(false);
    await expect(
      verifyPassword(
        "whatever-password",
        `scrypt$${"a".repeat(32)}$${"b".repeat(128)}$extra`,
      ),
    ).resolves.toBe(false);
    await expect(hashPassword("short")).rejects.toThrow(/length/i);
    await expect(hashPassword("x".repeat(129))).rejects.toThrow(/length/i);
    await expect(hashPassword("x".repeat(10))).resolves.toMatch(/^scrypt\$/);
    await expect(hashPassword("x".repeat(128))).resolves.toMatch(/^scrypt\$/);
  });
});

describe("JWT signing and verification", () => {
  it("verifies signed claims and expires tokens after one hour", () => {
    const token = signJwtToken(
      "b4b3b4b3-b4b3-44b3-84b3-b4b3b4b3b4b3",
      "admin",
      1_800_000_000,
      secret,
    );
    expect(verifyJwtToken(token, 1_800_000_001, secret)).toMatchObject({
      sub: "b4b3b4b3-b4b3-44b3-84b3-b4b3b4b3b4b3",
      role: "admin",
      iat: 1_800_000_000,
      exp: 1_800_003_600,
    });
    expect(verifyJwtToken(token, 1_800_003_600, secret)).toBeNull();
  });

  it("rejects malformed, modified, future-dated, and incorrectly signed tokens", () => {
    const token = signJwtToken(
      "donor-id",
      "donor",
      1_800_000_000,
      secret,
    );
    expect(verifyJwtToken("not-a-jwt", 1_800_000_001, secret)).toBeNull();
    expect(
      verifyJwtToken(`${token.slice(0, -1)}x`, 1_800_000_001, secret),
    ).toBeNull();
    expect(verifyJwtToken(token, 1_800_000_001, "another-long-test-secret")).toBeNull();
    expect(verifyJwtToken(token, 1_800_000_000, secret)).toMatchObject({
      sub: "donor-id",
    });
    expect(verifyJwtToken(token, 1_800_000_000, "short")).toBeNull();
  });

  it("validates the JWT header and required claim types", () => {
    const validPayload = {
      sub: "donor-id",
      role: "donor",
      iat: 1_800_000_000,
      exp: 1_800_003_600,
    };
    expect(
      verifyJwtToken(
        signRawJwt({ alg: "none", typ: "JWT" }, validPayload),
        1_800_000_001,
        secret,
      ),
    ).toBeNull();
    expect(
      verifyJwtToken(
        signRawJwt({ alg: "HS256", typ: "not-jwt" }, validPayload),
        1_800_000_001,
        secret,
      ),
    ).toBeNull();
    expect(
      verifyJwtToken(
        signRawJwt(
          { alg: "HS256", typ: "JWT" },
          { ...validPayload, sub: "", role: "donor" },
        ),
        1_800_000_001,
        secret,
      ),
    ).toBeNull();
    expect(
      verifyJwtToken(
        signRawJwt(
          { alg: "HS256", typ: "JWT" },
          { ...validPayload, role: "superuser" },
        ),
        1_800_000_001,
        secret,
      ),
    ).toBeNull();
    expect(
      verifyJwtToken(
        signRawJwt(
          { alg: "HS256", typ: "JWT" },
          { ...validPayload, iat: 1.5 },
        ),
        1_800_000_001,
        secret,
      ),
    ).toBeNull();
    expect(
      verifyJwtToken(
        signRawJwt(
          { alg: "HS256", typ: "JWT" },
          { ...validPayload, exp: "never" },
        ),
        1_800_000_001,
        secret,
      ),
    ).toBeNull();
    expect(
      verifyJwtToken(
        signRawJwt(
          { alg: "HS256", typ: "JWT" },
          { ...validPayload, iat: 1_800_000_100 },
        ),
        1_800_000_001,
        secret,
      ),
    ).toBeNull();
  });

  it("requires a sufficiently long signing secret", () => {
    expect(() =>
      signJwtToken("donor-id", "donor", 1_800_000_000, "short"),
    ).toThrow(/SESSION_SECRET/);
    const priorSecret = process.env.SESSION_SECRET;
    delete process.env.SESSION_SECRET;
    expect(() =>
      signJwtToken("donor-id", "donor", 1_800_000_000, undefined),
    ).toThrow(/SESSION_SECRET/);
    if (priorSecret !== undefined) {
      process.env.SESSION_SECRET = priorSecret;
    }
  });
});