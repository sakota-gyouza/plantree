import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/components/auth/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plantree - 旅のタイムツリー",
  description: "旅行やデートのプランを可愛く作れるアプリ",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Plantree",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Plantree - 旅のタイムツリー",
    description: "旅行やデートのプランを可愛く作れるアプリ",
    siteName: "Plantree",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#FF9A8B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__deferredInstallPrompt=e;});`,
          }}
        />
      </head>
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
