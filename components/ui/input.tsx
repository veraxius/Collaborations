import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-auto w-full rounded-[8px] border border-[var(--border)] bg-white px-[14px] py-[10px] text-[14px] text-[var(--ink)] placeholder:text-[rgba(13,13,15,0.35)] focus-visible:border-[rgba(13,13,15,0.3)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
