import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ToastProvider } from "@/components/Toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DeepEye – Face Recognition & Image Description",
  description: "AI-powered face recognition and image description system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-950 text-gray-100 min-h-screen`}>
        <ToastProvider>
          <Navbar />
          <main className="container mx-auto px-4 py-8 md:py-12">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
