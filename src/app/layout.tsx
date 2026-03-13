import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plantree - 旅のタイムツリー",
  description: "旅行やデートのプランを可愛く作れるアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased min-h-screen bg-cream">
        <AuthProvider>
          <div className="max-w-[430px] mx-auto bg-white min-h-screen shadow-sm">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
