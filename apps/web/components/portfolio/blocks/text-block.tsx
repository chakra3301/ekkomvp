"use client";

interface TextBlockProps {
  content: {
    text?: string;
    heading?: string;
    headingLevel?: "h2" | "h3" | "h4";
  };
}

export function TextBlock({ content }: TextBlockProps) {
  const HeadingTag = content.headingLevel || "h3";

  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none">
      {content.heading && (
        <HeadingTag className="font-bold mb-3">
          {content.heading}
        </HeadingTag>
      )}
      {content.text && (
        <p className="whitespace-pre-line leading-relaxed">
          {content.text}
        </p>
      )}
    </div>
  );
}
