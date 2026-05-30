"use client"

import { cn } from "@/lib/utils"
import { Search, SlidersHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface FilterBarProps {
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  children?: React.ReactNode
  className?: string
}

export function FilterBar({
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  children,
  className,
}: FilterBarProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4", className)}>
      <div className="relative flex-1 w-full sm:max-w-sm">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="pl-8"
        />
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        {children}
        <Button variant="outline" size="sm">
          <SlidersHorizontal className="size-4 mr-2" />
          Filters
        </Button>
      </div>
    </div>
  )
}
