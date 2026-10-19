/**
 * Unit tests — /api/admin/assign input validation logic.
 */

interface AssignBody {
  leadId?: string;
  employeeId?: string;
}

function validateAssignBody(body: AssignBody): { valid: true } | { valid: false; error: string } {
  if (!body.leadId || !body.employeeId) {
    return { valid: false, error: "leadId and employeeId are required" };
  }
  if (typeof body.leadId !== "string" || typeof body.employeeId !== "string") {
    return { valid: false, error: "leadId and employeeId must be strings" };
  }
  return { valid: true };
}

describe("validateAssignBody", () => {
  it("accepts valid leadId and employeeId", () => {
    const result = validateAssignBody({ leadId: "uuid-1", employeeId: "uuid-2" });
    expect(result.valid).toBe(true);
  });

  it("rejects missing leadId", () => {
    const result = validateAssignBody({ employeeId: "uuid-2" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toContain("leadId");
  });

  it("rejects missing employeeId", () => {
    const result = validateAssignBody({ leadId: "uuid-1" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toContain("employeeId");
  });

  it("rejects empty body", () => {
    const result = validateAssignBody({});
    expect(result.valid).toBe(false);
  });

  it("rejects empty string leadId", () => {
    const result = validateAssignBody({ leadId: "", employeeId: "uuid-2" });
    expect(result.valid).toBe(false);
  });
});
