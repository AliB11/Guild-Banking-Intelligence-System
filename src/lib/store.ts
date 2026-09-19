"use client";

import { create } from "zustand";
import type { RiskStatus } from "@/db/schema";

/* ---------- Guild comparison state (کاوشگر ماتریس اصناف) ------------- */

interface CompareState {
  aId: string | null;
  bId: string | null;
  setA: (id: string) => void;
  setB: (id: string) => void;
}

export const useCompareStore = create<CompareState>((set) => ({
  aId: null,
  bId: null,
  setA: (aId) => set({ aId }),
  setB: (bId) => set({ bId }),
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
  dailyTxCount: 80,
  // Default basket = published POS average for Mordad 1405 (694 thousand toman).
  avgBasketRials: 6_940_000,
  retentionDays: 1,
  posUnits: 1,
  cccDays: 0,
  isTaxCompliant: true,
  riskStatus: "LOW",
  set: (patch) => set(patch),
  applyGuildPreset: (cccDays, avgBasketRials, dailyTxCount) =>
    set({ cccDays, avgBasketRials, dailyTxCount }),
}));
