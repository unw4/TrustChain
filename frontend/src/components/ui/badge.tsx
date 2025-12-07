import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md",
        critical: "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md shadow-red-500/50 animate-pulse",
        warning: "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/50",
        success: "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md",
        active: "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md",
        secondary: "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-900 border border-slate-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
