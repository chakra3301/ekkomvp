"use client";

import { useState } from "react";
import { HexColorPicker } from "react-colorful";

import { cn } from "@/lib/utils";
import { isValidHex } from "@/lib/color-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const PRESET_COLORS = [
  "#EF4444", // red
  "#F97316", // orange
  "#EAB308", // yellow
  "#22C55E", // green
  "#06B6D4", // cyan
  "#3B82F6", // blue
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#6366F1", // indigo
];

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  className?: string;
}

export function ColorPicker({ color, onChange, className }: ColorPickerProps) {
  const [hexInput, setHexInput] = useState(color);

  const handleHexInput = (value: string) => {
    setHexInput(value);
    if (isValidHex(value)) {
      onChange(value);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-full justify-start gap-2", className)}
        >
          <div
            className="h-5 w-5 rounded-full border border-border"
            style={{ backgroundColor: color }}
          />
          <span className="font-mono text-sm">{color}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-3" align="start">
        <div className="space-y-3">
          <HexColorPicker
            color={color}
            onChange={(c) => {
              onChange(c);
              setHexInput(c);
            }}
            style={{ width: "100%" }}
          />

          {/* Hex input */}
          <Input
            value={hexInput}
            onChange={(e) => handleHexInput(e.target.value)}
            placeholder="#000000"
            className="font-mono text-sm h-8"
          />

          {/* Presets */}
          <div className="grid grid-cols-9 gap-1.5">
            {PRESET_COLORS.map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  onChange(preset);
                  setHexInput(preset);
                }}
                className={cn(
                  "h-6 w-6 rounded-full border-2 transition-transform hover:scale-110",
                  color.toLowerCase() === preset.toLowerCase()
                    ? "border-foreground scale-110"
                    : "border-transparent"
                )}
                style={{ backgroundColor: preset }}
              />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
