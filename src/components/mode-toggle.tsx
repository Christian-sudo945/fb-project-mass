"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ModeToggle() {
  const { setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="default" 
          size="icon" 
          className="relative w-10 h-10 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm hover:bg-gray-100 dark:hover:bg-gray-800 border-0"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-transform duration-200 text-yellow-500 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-transform duration-200 text-blue-400 dark:rotate-0 dark:scale-100" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-36 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border dark:border-gray-800 shadow-lg"
      >
        <DropdownMenuItem 
          onClick={() => setTheme("light")}
          className="cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
        >
          <Sun className="mr-2 h-4 w-4 text-yellow-500" />
          <span className="text-sm font-medium">Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")}
          className="cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
        >
          <Moon className="mr-2 h-4 w-4 text-blue-400" />
          <span className="text-sm font-medium">Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("system")}
          className="cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
        >
          <span className="mr-2">💻</span>
          <span className="text-sm font-medium">System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
