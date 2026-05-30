import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/providers/theme-provider"
import { AuthProvider } from "@/providers/auth-provider"
import { QueryProvider } from "@/providers/query-provider"
import { AppProvider } from "@/providers/app-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "NCRTC Bus Management System",
  description: "Enterprise Bus Management System for National Capital Region Transport Corporation",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "NCRTC BMS", statusBarStyle: "black-translucent" },
}

export const viewport: Viewport = {
  themeColor: "#22c55e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <QueryProvider>
              <AppProvider>
                {children}
              </AppProvider>
            </QueryProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
