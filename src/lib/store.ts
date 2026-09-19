"use client";

import { create } from "zustand";

export interface CalculatorInputs {
  dailyTxCount: number;
  avgBasketRials: number;
  posUnits: number;
  feeExempt: boolean;
}

interface CalculatorState extends CalculatorInputs {
  set: (patch: Partial<CalculatorInputs>) => void;
  applyPreset: (patch: Partial<CalculatorInputs>) => void;
}

export const useCalculatorStore = create<CalculatorState>((set) => ({
  dailyTxCount: 80,
  avgBasketRials: 6_940_000,
  posUnits: 1,
  feeExempt: false,
  set: (patch) => set(patch),
  applyPreset: (patch) => set(patch),
}));
