"use client";

import { useState } from "react";
import { Plus, X, ChevronDown, Pencil } from "lucide-react";

import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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

const CUSTOM_PROMPT_LABEL = "Write your own...";

export function PromptEditor({ prompts, onChange }: PromptEditorProps) {
  const [selectingIndex, setSelectingIndex] = useState<number | null>(null);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [customDraft, setCustomDraft] = useState("");

  const usedQuestions = new Set(prompts.map((p) => p.question));

  const availablePrompts = CONNECT_PROMPTS.filter(
    (q) => !usedQuestions.has(q)
  );

  const isCustomQuestion = (question: string) =>
    !(CONNECT_PROMPTS as readonly string[]).includes(question);

  const addPrompt = (question: string) => {
    if (prompts.length >= CONNECT_LIMITS.MAX_PROMPTS) return;
    onChange([...prompts, { question, answer: "" }]);
    setSelectingIndex(null);
  };

  const startCustomPrompt = () => {
    setCustomDraft("");
    if (selectingIndex === -1) {
      // Adding new — create placeholder entry
      if (prompts.length >= CONNECT_LIMITS.MAX_PROMPTS) return;
      onChange([...prompts, { question: "", answer: "" }]);
      setEditingQuestionIndex(prompts.length);
    } else if (selectingIndex !== null && selectingIndex >= 0) {
      // Changing existing prompt question to custom
      setEditingQuestionIndex(selectingIndex);
    }
    setSelectingIndex(null);
  };

  const confirmCustomQuestion = (index: number) => {
    const trimmed = customDraft.trim();
    if (!trimmed) {
      // If empty, remove the prompt if it has no question
      if (!prompts[index]?.question) {
        onChange(prompts.filter((_, i) => i !== index));
      }
      setEditingQuestionIndex(null);
      setCustomDraft("");
      return;
    }
    const updated = [...prompts];
    updated[index] = { ...updated[index], question: trimmed };
    onChange(updated);
    setEditingQuestionIndex(null);
    setCustomDraft("");
  };

  const updateAnswer = (index: number, answer: string) => {
    const updated = [...prompts];
    updated[index] = { ...updated[index], answer };
    onChange(updated);
  };

  const removePrompt = (index: number) => {
    onChange(prompts.filter((_, i) => i !== index));
    if (editingQuestionIndex === index) {
      setEditingQuestionIndex(null);
      setCustomDraft("");
    }
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
            {editingQuestionIndex === i ? (
              <div className="flex-1 space-y-2">
                <Input
                  value={customDraft}
                  onChange={(e) => {
                    if (e.target.value.length <= CONNECT_LIMITS.CUSTOM_PROMPT_QUESTION_MAX)
                      setCustomDraft(e.target.value);
                  }}
                  placeholder="Write your own question..."
                  maxLength={CONNECT_LIMITS.CUSTOM_PROMPT_QUESTION_MAX}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      confirmCustomQuestion(i);
                    }
                    if (e.key === "Escape") {
                      if (!prompt.question) {
                        removePrompt(i);
                      }
                      setEditingQuestionIndex(null);
                      setCustomDraft("");
                    }
                  }}
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {customDraft.length}/{CONNECT_LIMITS.CUSTOM_PROMPT_QUESTION_MAX}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (!prompt.question) removePrompt(i);
                        setEditingQuestionIndex(null);
                        setCustomDraft("");
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => confirmCustomQuestion(i)}
                      className="text-xs text-primary font-medium hover:underline"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setSelectingIndex(selectingIndex === i ? null : i)}
                className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                {prompt.question || "Select a prompt..."}
                {isCustomQuestion(prompt.question) && (
                  <Pencil className="h-3 w-3 ml-0.5" />
                )}
                <ChevronDown className="h-3 w-3" />
              </button>
            )}
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
              <button
                onClick={startCustomPrompt}
                className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-muted transition-colors text-primary font-medium flex items-center gap-2"
              >
                <Pencil className="h-3.5 w-3.5" />
                {CUSTOM_PROMPT_LABEL}
              </button>
            </div>
          )}

          {editingQuestionIndex !== i && (
            <>
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
            </>
          )}
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
              <button
                onClick={startCustomPrompt}
                className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-muted transition-colors text-primary font-medium flex items-center gap-2"
              >
                <Pencil className="h-3.5 w-3.5" />
                {CUSTOM_PROMPT_LABEL}
              </button>
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
