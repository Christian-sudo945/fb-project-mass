import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Inter } from 'next/font/google'
import './globals.css'
import { FacebookSDK } from '@/components/FacebookSDK';
import { cn } from "@/lib/utils"
import { ThemeProvider } from "@/components/theme-provider"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "Kicker - Mass Message Sender for Facebook Pages",
  description: "Send targeted inbox messages to your Facebook page followers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className={cn(
          "min-h-screen font-sans antialiased transition-colors duration-300",
          inter.className,
          geistSans.variable,
          geistMono.variable
        )}
      >
        <ThemeProvider>
          <div className="relative flex min-h-screen flex-col transition-colors duration-300">
            <FacebookSDK />
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
