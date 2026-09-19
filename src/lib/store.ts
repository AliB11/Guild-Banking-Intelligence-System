"use client";

import { create } from "zustand";
import type { RiskStatus } from "@/db/schema";

/* ---------- Guild comparison state (کاوشگر ماتریس اصناف) ------------- */

interface CompareState {
  aId: string | null;
  bId: string | null;
  setA: (id: string) => void;
  setB: (id: string) => void;
  init: (a: string, b: string) => void;
}

export const useCompareStore = create<CompareState>((set) => ({
  aId: null,
  bId: null,
  setA: (aId) => set({ aId }),
  setB: (bId) => set({ bId }),
  init: (aId, bId) =>
    set((s) => ({
      aId: s.aId ?? aId,
      bId: s.bId ?? bId,
    })),
}));

/* ---------- Profitability calculator state (ماشین‌حساب) --------------- */

export interface CalculatorInputs {
  dailyTxCount: number;
  avgBasketRials: number;
  retentionDays: number;
  posUnits: number;
  cccDays: number;
  isTaxCompliant: boolean;
  riskStatus: RiskStatus;
}

interface CalculatorState extends CalculatorInputs {
  set: (patch: Partial<CalculatorInputs>) => void;
  applyGuildPreset: (ccc: number, basket: number, dailyTx: number) => void;
}

export const useCalculatorStore = create<CalculatorState>((set) => ({
  dailyTxCount: 220,
  avgBasketRials: 3_500_000,
  retentionDays: 3,
  posUnits: 2,
  cccDays: 10,
  isTaxCompliant: true,
  riskStatus: "LOW",
  set: (patch) => set(patch),
  applyGuildPreset: (cccDays, avgBasketRials, dailyTxCount) =>
    set({ cccDays, avgBasketRials, dailyTxCount }),
}));
