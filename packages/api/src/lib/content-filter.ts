// Basic profanity/objectionable content filter for App Store compliance.
// Checks user-generated text against a blocklist of slurs and severe terms.
// This is intentionally conservative — it catches the worst offenders without
// over-censoring casual language.

const BLOCKED_PATTERNS: RegExp[] = [
  // Slurs and hate speech
  /\bn[i1]gg[ae3]r?\b/i,
  /\bf[a@]gg?[o0]t\b/i,
  /\bk[i1]ke\b/i,
  /\bsp[i1]c\b/i,
  /\bch[i1]nk\b/i,
  /\bw[e3]tb[a@]ck\b/i,
  /\btr[a@]nn(?:y|ie)\b/i,
  /\br[e3]t[a@]rd\b/i,

  // Violence / threats
  /\bk[i1]ll\s+(?:you|your|her|him|them)\b/i,
  /\brape\s+(?:you|her|him|them)\b/i,
  /\bi(?:'ll|'m going to|will)\s+(?:murder|shoot|stab|kill)\b/i,

  // Sexual exploitation
  /\bchild\s*p[o0]rn\b/i,
  /\bc\s*p\s*content\b/i,
];

/**
 * Returns true if the text contains objectionable content that should be blocked.
 */
export function containsBlockedContent(text: string): boolean {
  if (!text) return false;
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Validates text content and throws a TRPCError if objectionable content is found.
 * Use in tRPC mutation input validation.
 */
export function assertCleanContent(text: string | undefined | null) {
  if (text && containsBlockedContent(text)) {
    const { TRPCError } = require("@trpc/server");
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Your message contains content that violates our community guidelines.",
    });
  }
}
