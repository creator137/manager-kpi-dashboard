import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["cyrillic", "latin"],
});

export const metadata: Metadata = {
  title: "Virtual Land · KPI Dashboard",
  description: "Управленческий дашборд блока центральных продаж Virtual Land",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ru"
      className={`${manrope.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col"><TooltipProvider>{children}</TooltipProvider></body>
    </html>
  );
}
