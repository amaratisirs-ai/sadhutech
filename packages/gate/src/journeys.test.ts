import { describe, it, expect } from "vitest";
import { computeDueSteps, ONBOARDING_JOURNEY } from "./journeys.js";

const DAY = 1000 * 60 * 60 * 24;

describe("computeDueSteps", () => {
  it("fires the welcome step immediately for a brand-new subscriber", () => {
    const now = new Date("2026-09-01T00:00:00Z");
    const due = computeDueSteps(now, {}, now);
    expect(due.map((s) => s.id)).toEqual(["welcome"]);
  });

  it("does not re-fire a non-recurring step that was already sent", () => {
    const subscribedAt = new Date("2026-09-01T00:00:00Z");
    const now = new Date("2026-09-01T00:00:00Z");
    const due = computeDueSteps(subscribedAt, { welcome: subscribedAt }, now);
    expect(due.map((s) => s.id)).toEqual([]);
  });

  it("fires the 3-day tips step once 3 days have passed", () => {
    const subscribedAt = new Date("2026-09-01T00:00:00Z");
    const now = new Date(subscribedAt.getTime() + 3 * DAY);
    const due = computeDueSteps(subscribedAt, { welcome: subscribedAt }, now);
    expect(due.map((s) => s.id)).toEqual(["getting-started-tips"]);
  });

  it("does not fire the 3-day tips step early", () => {
    const subscribedAt = new Date("2026-09-01T00:00:00Z");
    const now = new Date(subscribedAt.getTime() + 2 * DAY);
    const due = computeDueSteps(subscribedAt, { welcome: subscribedAt }, now);
    expect(due.map((s) => s.id)).toEqual([]);
  });

  it("re-fires a recurring step once its interval has elapsed again", () => {
    const subscribedAt = new Date("2026-01-01T00:00:00Z");
    const lastNewsletter = new Date("2026-08-01T00:00:00Z");
    const now = new Date(lastNewsletter.getTime() + 30 * DAY);
    const sent = {
      welcome: subscribedAt,
      "getting-started-tips": subscribedAt,
      "first-month-recap": subscribedAt,
      "monthly-newsletter": lastNewsletter,
    };
    const due = computeDueSteps(subscribedAt, sent, now);
    expect(due.map((s) => s.id)).toEqual(["monthly-newsletter"]);
  });

  it("does not re-fire a recurring step before its interval elapses", () => {
    const subscribedAt = new Date("2026-01-01T00:00:00Z");
    const lastNewsletter = new Date("2026-08-01T00:00:00Z");
    const now = new Date(lastNewsletter.getTime() + 10 * DAY);
    const sent = {
      welcome: subscribedAt,
      "getting-started-tips": subscribedAt,
      "first-month-recap": subscribedAt,
      "monthly-newsletter": lastNewsletter,
    };
    const due = computeDueSteps(subscribedAt, sent, now);
    expect(due).toEqual([]);
  });

  it("can fire multiple due steps in one pass for a long-dormant subscriber", () => {
    const subscribedAt = new Date("2026-01-01T00:00:00Z");
    const now = new Date(subscribedAt.getTime() + 20 * DAY);
    const due = computeDueSteps(subscribedAt, {}, now);
    expect(due.map((s) => s.id)).toEqual(["welcome", "getting-started-tips", "first-month-recap"]);
  });

  it("journey is ordered and has the expected step ids", () => {
    expect(ONBOARDING_JOURNEY.map((s) => s.id)).toEqual([
      "welcome",
      "getting-started-tips",
      "first-month-recap",
      "monthly-newsletter",
    ]);
  });
});
