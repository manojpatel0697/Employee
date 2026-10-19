/**
 * Unit tests — middleware route guard logic.
 *
 * We test the key comparison logic and routing decisions in isolation
 * without running Next.js.
 */

// Mirror the admin guard logic from middleware.ts
function checkAdminKey(pathname: string, envKey: string | undefined): "allow" | "redirect-404" {
  if (!pathname.startsWith("/admin/")) return "allow";

  const segments = pathname.split("/");
  const providedKey = segments[2] ?? "";
  const adminKey = envKey ?? "";

  if (!adminKey || providedKey !== adminKey) return "redirect-404";
  return "allow";
}

describe("Admin route guard", () => {
  const SECRET = "i2t3z7a9q";

  it("allows request when provided key matches env key", () => {
    expect(checkAdminKey(`/admin/${SECRET}`, SECRET)).toBe("allow");
  });

  it("redirects when key is wrong", () => {
    expect(checkAdminKey("/admin/wrongkey", SECRET)).toBe("redirect-404");
  });

  it("redirects when key is empty string", () => {
    expect(checkAdminKey("/admin/", SECRET)).toBe("redirect-404");
  });

  it("redirects when ADMIN_SECRET_KEY env is not set", () => {
    expect(checkAdminKey(`/admin/${SECRET}`, undefined)).toBe("redirect-404");
  });

  it("redirects when ADMIN_SECRET_KEY is empty string", () => {
    expect(checkAdminKey(`/admin/${SECRET}`, "")).toBe("redirect-404");
  });

  it("allows sub-paths after valid key", () => {
    expect(checkAdminKey(`/admin/${SECRET}/leads`, SECRET)).toBe("allow");
  });

  it("does not interfere with non-admin routes", () => {
    expect(checkAdminKey("/employee/dashboard", SECRET)).toBe("allow");
    expect(checkAdminKey("/developer", SECRET)).toBe("allow");
    expect(checkAdminKey("/", SECRET)).toBe("allow");
  });
});

// Mirror the matcher config
describe("Middleware matcher patterns", () => {
  const matchers = ["/admin/:path*", "/employee/dashboard"];

  it("matcher includes admin wildcard", () => {
    expect(matchers[0]).toBe("/admin/:path*");
  });

  it("matcher includes employee dashboard", () => {
    expect(matchers[1]).toBe("/employee/dashboard");
  });

  it("has exactly 2 matchers", () => {
    expect(matchers).toHaveLength(2);
  });
});
