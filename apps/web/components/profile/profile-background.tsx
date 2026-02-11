"use client";

interface PageBackground {
  type: "solid" | "gradient" | "image";
  value: string;
}

interface ProfileBackgroundProps {
  background: PageBackground | null;
  children: React.ReactNode;
}

export function ProfileBackground({
  background,
  children,
}: ProfileBackgroundProps) {
  if (!background) {
    return <>{children}</>;
  }

  let bgStyle: React.CSSProperties = {};

  switch (background.type) {
    case "solid":
      bgStyle = { backgroundColor: background.value };
      break;
    case "gradient":
      bgStyle = { backgroundImage: background.value };
      break;
    case "image":
      bgStyle = {
        backgroundImage: `url(${background.value})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      };
      break;
  }

  return (
    <div className="relative min-h-screen" style={bgStyle}>
      <div className="absolute inset-0 bg-background/40 dark:bg-background/50 backdrop-blur-sm" />
      <div className="relative">{children}</div>
    </div>
  );
}
