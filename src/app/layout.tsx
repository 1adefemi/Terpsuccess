import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TerpSuccess — UMD Course Intelligence",
  description: "Real data from UMD students. Ace your semester.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
