"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Palette, Check } from "lucide-react"
import type { DesignTheme } from "../app/page"

interface DesignSelectorProps {
  currentTheme: DesignTheme
  onThemeChange: (theme: DesignTheme) => void
}

export function DesignSelector({ currentTheme, onThemeChange }: DesignSelectorProps) {
  const themes: { value: DesignTheme; label: string; description: string }[] = [
    { value: "default", label: "Default", description: "Clean and professional" },
    { value: "modern", label: "Modern", description: "Gradients and glass effects" },
    { value: "minimal", label: "Minimal", description: "Simple and focused" },
    { value: "corporate", label: "Corporate", description: "Business-oriented design" },
    { value: "dark", label: "Dark", description: "Dark mode interface" },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Palette className="h-4 w-4 mr-2" />
          Theme: {themes.find((t) => t.value === currentTheme)?.label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {themes.map((theme) => (
          <DropdownMenuItem
            key={theme.value}
            onClick={() => onThemeChange(theme.value)}
            className="flex items-center justify-between"
          >
            <div>
              <div className="font-medium">{theme.label}</div>
              <div className="text-xs text-muted-foreground">{theme.description}</div>
            </div>
            {currentTheme === theme.value && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
