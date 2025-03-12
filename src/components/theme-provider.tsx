"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const setMounted = React.useState(false)[1]

  React.useEffect(() => {
    // Add no-transitions class to prevent initial animations
    document.documentElement.classList.add('no-transitions')
    setMounted(true)
    
    // Remove the class after a small delay
    const timeout = setTimeout(() => {
      document.documentElement.classList.remove('no-transitions')
    }, 100)

    return () => clearTimeout(timeout)
  }, [setMounted])

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
      storageKey="kicker-theme"
    >
      {children}
    </NextThemesProvider>
  )
}
