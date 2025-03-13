"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useTheme } from 'next-themes'
import { Sun, Moon, User, LogOut } from 'lucide-react'
import { cn } from "@/lib/utils"
import { useState } from "react"
import { motion } from "framer-motion"
import { useFacebookAuth } from "@/hooks/useFacebookAuth"
import { FacebookUser } from "@/lib/facebook"
import Image from "next/image"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUser: FacebookUser | null
}

export function SettingsDialog({ open, onOpenChange, currentUser }: SettingsDialogProps) {
  const { theme, setTheme } = useTheme()
  const { logout } = useFacebookAuth()
  const [isDark, setIsDark] = useState(theme === 'dark')

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    setIsDark(newTheme === 'dark')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "sm:max-w-[425px]",
        isDark ? "bg-gray-900 border-gray-800" : "bg-white"
      )}>
        <DialogHeader>
          <DialogTitle className={cn(
            "text-xl font-bold",
            isDark ? "text-gray-100" : "text-gray-900"
          )}>
            Settings
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* User Profile Section */}
          <div className={cn(
            "p-4 rounded-lg",
            isDark ? "bg-gray-800/50" : "bg-gray-50"
          )}>
            <div className="flex items-center gap-4">
              {currentUser?.picture?.data?.url ? (
                <div className="relative w-12 h-12 rounded-full overflow-hidden">
                  <Image
                    src={currentUser.picture.data.url}
                    alt={currentUser.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center",
                  isDark ? "bg-gray-700" : "bg-gray-200"
                )}>
                  <User className="w-6 h-6" />
                </div>
              )}
              <div>
                <h3 className={cn(
                  "font-medium",
                  isDark ? "text-gray-100" : "text-gray-900"
                )}>
                  {currentUser?.name || 'Unknown User'}
                </h3>
                <p className={cn(
                  "text-sm",
                  isDark ? "text-gray-400" : "text-gray-500"
                )}>
                  {currentUser?.email || 'No email provided'}
                </p>
              </div>
            </div>
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <span className={cn(
              "text-sm font-medium",
              isDark ? "text-gray-100" : "text-gray-900"
            )}>
              Theme
            </span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className={cn(
                "p-2 rounded-lg transition-colors",
                isDark 
                  ? "bg-gray-800 hover:bg-gray-700 text-gray-100" 
                  : "bg-gray-100 hover:bg-gray-200 text-gray-900"
              )}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.button>
          </div>

          {/* Logout Button */}
          <Button
            variant="destructive"
            className="w-full"
            onClick={logout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
