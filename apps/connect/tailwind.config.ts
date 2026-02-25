import type { Config } from "tailwindcss";
import sharedConfig from "@ekko/tailwind-config";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  presets: [sharedConfig],
};

export default config;
