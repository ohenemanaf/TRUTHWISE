import type { Metadata } from "next";
import { JetBrains_Mono, Noto_Sans_Math, Schibsted_Grotesk } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProgressHydrator } from "@/components/progress-hydrator";
import "./globals.css";

const sans = Schibsted_Grotesk({ variable: "--font-schibsted", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin", "greek"] });
// Fallback for logic symbols the mono face lacks (⊕ ⊙ ↑ ↓ ⊤ ⊥ …).
const math = Noto_Sans_Math({ variable: "--font-noto-math", weight: "400" });

export const metadata: Metadata = {
  title: { default: "Truthwise: one truth table, every course", template: "%s · Truthwise" },
  description:
    "Interactive truth tables that show the same logic in Digital Electronics (1/0, gates), Discrete Maths (T/F), Critical Thinking (arguments) and code (&&, ||, !).",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${math.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col">
        <ProgressHydrator />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
