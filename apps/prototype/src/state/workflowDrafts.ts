// Workflow-setup drafts — persist an in-progress workflow build so a user who leaves
// (e.g. after step 1) returns with their criteria prefilled, straight to the workflow
// step. localStorage-backed, keyed by the recipe/problem id. Cleared once it goes live.

import type { Criterion, Node } from "@/fixtures/criteriaMatch";

export type DraftStep = "criteria" | "workflow" | "review";

export interface WorkflowDraft {
  recipeId: string;
  match: "all" | "any";
  /** Flat mirror (back-compat). */
  criteria: Criterion[];
  /** Advanced structure (groups + bare criteria); optional for older drafts. */
  nodes?: Node[];
  step: DraftStep;
  workflowReady: boolean;
  savedAt: number;
}

const KEY = "gocsm.workflow.drafts.v1";

function readAll(): Record<string, WorkflowDraft> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}
function writeAll(all: Record<string, WorkflowDraft>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* ignore quota / unavailable storage */
  }
}

export function saveDraft(d: WorkflowDraft) {
  const all = readAll();
  all[d.recipeId] = d;
  writeAll(all);
}

export function loadDraft(recipeId: string): WorkflowDraft | undefined {
  return readAll()[recipeId];
}

export function clearDraft(recipeId: string) {
  const all = readAll();
  if (all[recipeId]) {
    delete all[recipeId];
    writeAll(all);
  }
}

export function hasDraft(recipeId: string): boolean {
  return !!readAll()[recipeId];
}
