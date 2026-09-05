import { describe, it, expect } from "vitest";
import { EMAIL_TEMPLATES } from "./email-templates.js";

const RESERVED = ["FIRST_NAME", "LAST_NAME", "EMAIL", "UNSUBSCRIBE_URL", "RESEND_UNSUBSCRIBE_URL", "contact", "this"];

describe("EMAIL_TEMPLATES", () => {
  it("has a unique alias per template", () => {
    const aliases = Object.values(EMAIL_TEMPLATES).map((t) => t.alias);
    expect(new Set(aliases).size).toBe(aliases.length);
  });

  it("never uses a Resend-reserved variable name", () => {
    for (const template of Object.values(EMAIL_TEMPLATES)) {
      for (const v of template.variables) {
        expect(RESERVED).not.toContain(v.key);
      }
    }
  });

  it("references every declared variable in its html", () => {
    for (const template of Object.values(EMAIL_TEMPLATES)) {
      for (const v of template.variables) {
        expect(template.html).toContain(`{{{${v.key}}}}`);
      }
    }
  });

  it("has a non-empty subject and name for every template", () => {
    for (const template of Object.values(EMAIL_TEMPLATES)) {
      expect(template.subject.length).toBeGreaterThan(0);
      expect(template.name.length).toBeGreaterThan(0);
    }
  });
});
