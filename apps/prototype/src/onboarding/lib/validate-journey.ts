import type { Journey } from "./types";

export type FixField = "deepLink" | "tier" | "bookingEmbedUrl";

export interface Check {
  id: string;
  label: string;
  pass: boolean;
  fixStepId?: string;
  fixField?: FixField;
}

export function validateJourney(journey: Journey): Check[] {
  const steps = journey.steps;
  const firstMissingDeepLink = steps.find(
    (s) =>
      s.type !== "custom_manual" &&
      s.type !== "kickoff_call" &&
      !(s.deepLink && s.deepLink.trim())
  );
  const tierAFirstThree = steps.slice(0, 3).some((s) => s.tier === "A");
  const kickoff = steps.find((s) => s.type === "kickoff_call");
  const kickoffLink = (kickoff?.bookingEmbedUrl ?? kickoff?.deepLink ?? "").trim();
  const kickoffOk = !!(kickoff && kickoffLink);

  return [
    {
      id: "deep_links",
      label: "Every step has a deep link or is manual",
      pass: !firstMissingDeepLink,
      fixStepId: firstMissingDeepLink?.id,
      fixField: firstMissingDeepLink ? "deepLink" : undefined,
    },
    {
      id: "tier_a_first_three",
      label: "At least one instantly-verifiable (Tier A) step in the first three",
      pass: tierAFirstThree,
      fixStepId: tierAFirstThree ? undefined : steps[0]?.id,
      fixField: tierAFirstThree ? undefined : "tier",
    },
    {
      id: "kickoff_booking_link",
      label: "Kickoff call step has a booking link",
      pass: kickoffOk,
      fixStepId: kickoffOk ? undefined : kickoff?.id,
      fixField: kickoffOk ? undefined : "bookingEmbedUrl",
    },
  ];
}


