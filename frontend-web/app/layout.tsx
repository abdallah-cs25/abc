import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "My World - منصة التجارة الإلكترونية",
  description: "منصة My World للتجارة الإلكترونية في الجزائر - متاجر متعددة، توصيل سريع",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${outfit.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
