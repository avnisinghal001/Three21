import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ModelInfoWrapper from "./components/ModelInfoWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Three21 - 3D Model Analysis & Reverse Engineering",
  description: "AI-powered 3D model disassembly and reverse engineering platform",
  themeColor: "#0f0f13",
  colorScheme: "dark",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased dark-theme`}
      >
        <ModelInfoWrapper>
          {children}
        </ModelInfoWrapper>
      </body>
    </html>
  );
}
