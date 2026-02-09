import React from "react";
import { Slider } from "@/components/ui/slider";
import { FuelLevel } from "@/lib/checklist-constants";
import { cn } from "@/lib/utils";
import { Gauge } from "lucide-react";

interface FuelLevelSliderProps {
  value: FuelLevel | undefined | null;
  onChange: (value: FuelLevel) => void;
  className?: string;
  disabled?: boolean;
}

const LEVEL_MAP: Record<number, FuelLevel> = {
  0: "empty",
  1: "one_eighth",
  2: "quarter",
  3: "three_eighths",
  4: "half",
  5: "five_eighths",
  6: "three_quarters",
  7: "seven_eighths",
  8: "full",
};

const REVERSE_MAP: Record<string, number> = {
  empty: 0,
  reserve: 1, // Legacy mapping to 1/8 approx
  low: 2,     // Legacy mapping to 1/4 approx
  one_eighth: 1,
  quarter: 2,
  three_eighths: 3,
  half: 4,
  five_eighths: 5,
  three_quarters: 6,
  seven_eighths: 7,
  full: 8,
};

const LABELS = [
  { val: 0, label: "Vazio" },
  { val: 2, label: "1/4" },
  { val: 4, label: "1/2" },
  { val: 6, label: "3/4" },
  { val: 8, label: "Cheio" },
];

export function FuelLevelSlider({ value, onChange, className, disabled }: FuelLevelSliderProps) {
  // If value is undefined/null, default to 0 (empty) or maybe existing logic handled undefined.
  // The slider needs a value.
  const numericValue = value ? (REVERSE_MAP[value] ?? 0) : 0;
  
  const handleChange = (vals: number[]) => {
    const val = vals[0];
    const fuelLevel = LEVEL_MAP[val];
    if (fuelLevel) {
      onChange(fuelLevel);
    }
  };

  const getLabel = (val: number) => {
    if (val === 0) return "Vazio (0/8)";
    if (val === 8) return "Cheio (8/8)";
    return `${val}/8 (${Math.round((val/8)*100)}%)`;
  };

  // Determine color based on level
  const getColorClass = (val: number) => {
    if (val <= 1) return "text-red-500";
    if (val <= 3) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <div className={cn("w-full py-4 space-y-4 border rounded-lg p-4 bg-card", className)}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
            <Gauge className={cn("h-5 w-5", getColorClass(numericValue))} />
            <span className="text-sm font-medium">Nível de Combustível</span>
        </div>
        <span className={cn("text-lg font-bold font-mono", getColorClass(numericValue))}>
            {getLabel(numericValue)}
        </span>
      </div>
      
      <div className="px-3 pb-2">
        <Slider
          defaultValue={[0]}
          value={[numericValue]}
          min={0}
          max={8}
          step={1}
          onValueChange={handleChange}
          disabled={disabled}
          className="cursor-pointer py-4"
        />
        
        {/* Ticks/Labels */}
        <div className="relative h-6 mt-1 w-full">
            {LABELS.map((item) => {
                // Calculate left position percentage
                const left = (item.val / 8) * 100;
                return (
                    <div 
                        key={item.val} 
                        className="absolute transform -translate-x-1/2 flex flex-col items-center"
                        style={{ left: `${left}%` }}
                    >
                        <div className="h-1.5 w-0.5 bg-muted-foreground/30 mb-1" />
                        <span className="text-[10px] text-muted-foreground font-medium uppercase">{item.label}</span>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
}
