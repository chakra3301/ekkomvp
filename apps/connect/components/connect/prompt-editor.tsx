"use client";

import { useState } from "react";
import { Plus, X, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CONNECT_PROMPTS, CONNECT_LIMITS } from "@ekko/config";

export interface PromptEntry {
  question: string;
  answer: string;
}

interface PromptEditorProps {
  prompts: PromptEntry[];
  onChange: (prompts: PromptEntry[]) => void;
}

export function PromptEditor({ prompts, onChange }: PromptEditorProps) {
  const [selectingIndex, setSelectingIndex] = useState<number | null>(null);

  const usedQuestions = new Set(prompts.map((p) => p.question));

  const availablePrompts = CONNECT_PROMPTS.filter(
    (q) => !usedQuestions.has(q)
  );

  const addPrompt = (question: string) => {
    if (prompts.length >= CONNECT_LIMITS.MAX_PROMPTS) return;
    onChange([...prompts, { question, answer: "" }]);
    setSelectingIndex(null);
  };

  const updateAnswer = (index: number, answer: string) => {
    const updated = [...prompts];
    updated[index] = { ...updated[index], answer };
    onChange(updated);
  };

  const removePrompt = (index: number) => {
    onChange(prompts.filter((_, i) => i !== index));
  };

  const changeQuestion = (index: number, question: string) => {
    const updated = [...prompts];
    updated[index] = { ...updated[index], question };
    onChange(updated);
    setSelectingIndex(null);
  };

  return (
    <div className="space-y-4">
      {prompts.map((prompt, i) => (
        <div key={i} className="glass-card p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <button
              onClick={() => setSelectingIndex(selectingIndex === i ? null : i)}
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              {prompt.question}
              <ChevronDown className="h-3 w-3" />
            </button>
            <button
              onClick={() => removePrompt(i)}
              className="p-1 rounded-full hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {selectingIndex === i && (
            <div className="max-h-40 overflow-y-auto space-y-1 p-2 rounded-lg bg-muted/50">
              {availablePrompts.map((q) => (
                <button
                  key={q}
                  onClick={() => changeQuestion(i, q)}
                  className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <Textarea
            value={prompt.answer}
            onChange={(e) => updateAnswer(i, e.target.value)}
            placeholder="Your answer..."
            maxLength={CONNECT_LIMITS.PROMPT_ANSWER_MAX}
            className="min-h-[80px] resize-none"
          />
          <p className="text-xs text-muted-foreground text-right">
            {prompt.answer.length}/{CONNECT_LIMITS.PROMPT_ANSWER_MAX}
          </p>
        </div>
      ))}

      {prompts.length < CONNECT_LIMITS.MAX_PROMPTS && (
        <div>
          {selectingIndex === -1 ? (
            <div className="glass-card p-3 max-h-48 overflow-y-auto space-y-1">
              {availablePrompts.map((q) => (
                <button
                  key={q}
                  onClick={() => addPrompt(q)}
                  className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setSelectingIndex(-1)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Prompt ({prompts.length}/{CONNECT_LIMITS.MAX_PROMPTS})
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
