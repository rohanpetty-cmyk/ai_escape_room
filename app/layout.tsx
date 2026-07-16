import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Escape Room",
  description:
    "A playable AI-assisted escape room with deterministic game-state validation.",
  openGraph: {
    title: "AI Escape Room",
    description:
      "Generate a short, fair escape room and solve it with natural-language actions.",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
