"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  className?: string;
}

export function Slider({ value, onChange, min, max, step = 1, disabled, className }: SliderProps) {
  return (
    <SliderPrimitive.Root
      dir="rtl"
      className={cn(
        "relative flex h-6 w-full touch-none select-none items-center",
        disabled && "opacity-50",
        className,
      )}
      value={[value]}
      onValueChange={([v]) => onChange(v)}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-night-700">
        <SliderPrimitive.Range className="absolute h-full bg-gradient-to-l from-gold-400 to-gold-600 shadow-[0_0_10px_rgba(245,200,96,0.5)]" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        aria-label="مقدار"
        className="block h-4.5 w-4.5 h-[18px] w-[18px] cursor-grab rounded-full border-2 border-gold-400 bg-night-900 shadow-[0_0_0_4px_rgba(245,200,96,0.15),0_4px_12px_rgba(0,0,0,0.5)] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/60 active:cursor-grabbing active:scale-110"
      />
    </SliderPrimitive.Root>
  );
}
