import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Set Up Profile",
};

export default function SetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
