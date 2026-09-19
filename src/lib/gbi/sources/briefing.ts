import type { Corpus } from "../compute";
import { buildPublishedBriefing } from "../market-view";
import type { MonthlyBriefing } from "./types";

export function buildMonthlyBriefing(
  _corpus: Corpus,
  previous: MonthlyBriefing | null = null,
): MonthlyBriefing {
  return buildPublishedBriefing(previous);
}
