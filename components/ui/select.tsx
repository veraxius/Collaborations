import * as React from "react"

import { cn } from "@/lib/utils"

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "flex h-auto w-full rounded-[8px] border border-[var(--border)] bg-white px-[14px] py-[10px] text-[14px] text-[var(--ink)] focus-visible:border-[rgba(13,13,15,0.3)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        {children}
      </select>
    )
  }
)
Select.displayName = "Select"

export { Select }

