import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "TravelPropose",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-PT" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
