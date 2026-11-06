import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MOTIVE",
  description: "Private plans, shared with intention. Synthetic prototype.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "MOTIVE",
    statusBarStyle: "black-translucent",
  },
  icons: { icon: "/icons/motive-192.png", apple: "/icons/motive-apple.png" },
};
export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#111113",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
