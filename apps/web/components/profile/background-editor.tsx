"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ColorPicker } from "@/components/ui/color-picker";
import { ImageUpload } from "@/components/ui/image-upload";

interface PageBackground {
  type: "solid" | "gradient" | "image";
  value: string;
}

interface BackgroundEditorProps {
  value: PageBackground | null;
  onChange: (value: PageBackground | null) => void;
  userId: string;
}

type BgType = "none" | "solid" | "gradient" | "image";

const TYPE_OPTIONS: { id: BgType; label: string }[] = [
  { id: "none", label: "None" },
  { id: "solid", label: "Solid" },
  { id: "gradient", label: "Gradient" },
  { id: "image", label: "Image" },
];

export function BackgroundEditor({
  value,
  onChange,
  userId,
}: BackgroundEditorProps) {
  const currentType: BgType = value?.type || "none";

  const [solidColor, setSolidColor] = useState(
    value?.type === "solid" ? value.value : "#1a1a2e"
  );
  const [gradColor1, setGradColor1] = useState("#1a1a2e");
  const [gradColor2, setGradColor2] = useState("#16213e");
  const [gradAngle, setGradAngle] = useState(135);

  // Parse existing gradient
  const parseGradient = (val: string) => {
    const match = val.match(
      /linear-gradient\((\d+)deg,\s*(#[0-9A-Fa-f]{6}),\s*(#[0-9A-Fa-f]{6})\)/
    );
    if (match) {
      return {
        angle: parseInt(match[1]),
        color1: match[2],
        color2: match[3],
      };
    }
    return null;
  };

  // Initialize gradient state from existing value
  useState(() => {
    if (value?.type === "gradient") {
      const parsed = parseGradient(value.value);
      if (parsed) {
        setGradColor1(parsed.color1);
        setGradColor2(parsed.color2);
        setGradAngle(parsed.angle);
      }
    }
  });

  const buildGradient = (c1: string, c2: string, angle: number) =>
    `linear-gradient(${angle}deg, ${c1}, ${c2})`;

  const handleTypeChange = (type: BgType) => {
    if (type === "none") {
      onChange(null);
    } else if (type === "solid") {
      onChange({ type: "solid", value: solidColor });
    } else if (type === "gradient") {
      onChange({
        type: "gradient",
        value: buildGradient(gradColor1, gradColor2, gradAngle),
      });
    } else if (type === "image") {
      onChange({ type: "image", value: value?.type === "image" ? value.value : "" });
    }
  };

  return (
    <div className="space-y-3">
      {/* Type selector */}
      <div className="flex gap-1.5">
        {TYPE_OPTIONS.map((opt) => (
          <Button
            key={opt.id}
            type="button"
            variant={currentType === opt.id || (opt.id === "none" && !value) ? "default" : "outline"}
            size="sm"
            className="flex-1 text-xs"
            onClick={() => handleTypeChange(opt.id)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* Solid editor */}
      {currentType === "solid" && value && (
        <div className="space-y-2">
          <Label className="text-xs">Color</Label>
          <ColorPicker
            color={solidColor}
            onChange={(c) => {
              setSolidColor(c);
              onChange({ type: "solid", value: c });
            }}
          />
          {/* Preview */}
          <div
            className="h-12 rounded-md border"
            style={{ backgroundColor: solidColor }}
          />
        </div>
      )}

      {/* Gradient editor */}
      {currentType === "gradient" && value && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Color 1</Label>
              <ColorPicker
                color={gradColor1}
                onChange={(c) => {
                  setGradColor1(c);
                  onChange({
                    type: "gradient",
                    value: buildGradient(c, gradColor2, gradAngle),
                  });
                }}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Color 2</Label>
              <ColorPicker
                color={gradColor2}
                onChange={(c) => {
                  setGradColor2(c);
                  onChange({
                    type: "gradient",
                    value: buildGradient(gradColor1, c, gradAngle),
                  });
                }}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Angle: {gradAngle}°</Label>
            <Slider
              value={[gradAngle]}
              onValueChange={([a]) => {
                setGradAngle(a);
                onChange({
                  type: "gradient",
                  value: buildGradient(gradColor1, gradColor2, a),
                });
              }}
              min={0}
              max={360}
              step={5}
            />
          </div>
          {/* Preview */}
          <div
            className="h-12 rounded-md border"
            style={{
              backgroundImage: buildGradient(gradColor1, gradColor2, gradAngle),
            }}
          />
        </div>
      )}

      {/* Image editor */}
      {value?.type === "image" && (
        <div className="space-y-2">
          <Label className="text-xs">Background Image</Label>
          <p className="text-xs text-muted-foreground">
            Recommended: 1920 × 1080 px or larger (full page cover)
          </p>
          <ImageUpload
            value={value?.type === "image" ? value.value : undefined}
            onChange={(url) => onChange({ type: "image", value: url })}
            onRemove={() => onChange(null)}
            userId={userId}
            aspectRatio="video"
          />
        </div>
      )}
    </div>
  );
}
