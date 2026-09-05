/**
 * Email journeys: ordered steps with timings, run against each subscriber's
 * `subscribedAt` (and, for recurring steps, their last-sent time). Pure logic,
 * no I/O — NewsletterService owns persistence and actually sending.
 */

export interface JourneyStep {
  id: string;
  templateId: string;
  /** Days after subscribing (or after the previous send, if recurring) before this step is due. */
  delayDays: number;
  /** Repeats every `delayDays` indefinitely (e.g. a monthly newsletter) instead of firing once. */
  recurring?: boolean;
}

export const ONBOARDING_JOURNEY: JourneyStep[] = [
  { id: "welcome", templateId: "welcome", delayDays: 0 },
  { id: "getting-started-tips", templateId: "getting-started-tips", delayDays: 3 },
  { id: "first-month-recap", templateId: "first-month-recap", delayDays: 14 },
  { id: "monthly-newsletter", templateId: "monthly-newsletter", delayDays: 30, recurring: true },
];

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Returns the journey steps due right now for a subscriber, given when they
 * joined and a map of step id -> last-sent Date for steps already sent.
 */
export function computeDueSteps(
  subscribedAt: Date,
  sentSteps: Record<string, Date>,
  now: Date = new Date()
): JourneyStep[] {
  const daysSince = (from: Date) => (now.getTime() - from.getTime()) / MS_PER_DAY;
  const due: JourneyStep[] = [];
  for (const step of ONBOARDING_JOURNEY) {
    const lastSent = sentSteps[step.id];
    if (!lastSent) {
      if (daysSince(subscribedAt) >= step.delayDays) due.push(step);
    } else if (step.recurring && daysSince(lastSent) >= step.delayDays) {
      due.push(step);
    }
    // Non-recurring steps that already have a send record are never due again.
  }
  return due;
}
