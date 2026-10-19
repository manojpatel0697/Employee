/**
 * Unit tests — isAdminAuthorized helper used across all admin API routes.
 * Tests the header-based x-admin-key verification logic.
 */

// Mirror the helper from the routes
function isAdminAuthorized(
  headers: Record<string, string | null>,
  envKey: string | undefined
): boolean {
  if (!envKey) return false;
  return headers["x-admin-key"] === envKey;
}

describe("isAdminAuthorized", () => {
  const SECRET = "super-secret-key";

  it("returns true when x-admin-key matches env key", () => {
    expect(isAdminAuthorized({ "x-admin-key": SECRET }, SECRET)).toBe(true);
  });

  it("returns false when x-admin-key is wrong", () => {
    expect(isAdminAuthorized({ "x-admin-key": "wrong" }, SECRET)).toBe(false);
  });

  it("returns false when x-admin-key header is missing (null)", () => {
    expect(isAdminAuthorized({ "x-admin-key": null }, SECRET)).toBe(false);
  });

  it("returns false when ADMIN_SECRET_KEY env is not set (undefined)", () => {
    expect(isAdminAuthorized({ "x-admin-key": SECRET }, undefined)).toBe(false);
  });

  it("returns false when ADMIN_SECRET_KEY is empty string", () => {
    expect(isAdminAuthorized({ "x-admin-key": "" }, "")).toBe(false);
  });

  it("is case-sensitive — 'Secret' != 'secret'", () => {
    expect(isAdminAuthorized({ "x-admin-key": "Secret" }, "secret")).toBe(false);
  });

  it("returns false when both header and env key are empty strings", () => {
    // empty ADMIN_SECRET_KEY → always unauthorized (prevents lockout)
    expect(isAdminAuthorized({ "x-admin-key": "" }, "")).toBe(false);
  });
});
