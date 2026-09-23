import type { Metadata } from "next";
import { Italiana, Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const italiana = Italiana({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-italiana",
});

const outfit = Outfit({
  weight: ["300", "400", "600"],
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Forge — Strength Studio",
  description: "Iron and time. A strength-training studio for the relentless.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cn("dark h-full antialiased", italiana.variable, outfit.variable)}>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">{children}</body>
    </html>
  );
}
