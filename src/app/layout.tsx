import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "สัญญาผ่อน Asus ROG Zephyrus G15",
  description: "ระบบสร้างสัญญาผ่อนชำระโน้ตบุ๊ค Asus ROG Zephyrus G15 แบบไม่มีดอกเบี้ย",
  keywords: "สัญญาผ่อน, โน้ตบุ๊ค, Asus ROG, Zephyrus G15, ผ่อนชำระ",
  authors: [{ name: "Laptop Contract System" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className={`${geist.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
