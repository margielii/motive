import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MOTIVE", description: "Private plans, shared with intention.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "MOTIVE", statusBarStyle: "default" },
  icons: { icon: "/icons/motive-192.png", apple: "/icons/motive-apple.png" },
};
export const viewport = { width: "device-width", initialScale: 1, themeColor: "#294b3b", viewportFit: "cover" };

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
