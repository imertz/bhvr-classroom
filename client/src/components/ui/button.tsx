import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Buttons in this system are ruled blocks, not pills: square corners,
 * mono micro-label type, and a hard 120ms state change with no easing drama.
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0",
    "font-mono uppercase font-medium tracking-[0.14em]",
    "transition-[background-color,color,border-color] duration-120 ease-linear",
    "disabled:pointer-events-none disabled:opacity-40",
    "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
    "aria-invalid:border-destructive",
  ].join(" "),
  {
    variants: {
      variant: {
        // Ink block that flips to signal on hover — the primary commitment.
        default:
          "bg-primary text-primary-foreground hover:bg-signal hover:text-signal-foreground",
        destructive:
          "bg-destructive text-white hover:bg-foreground",
        // Hairline outline that inverts to solid ink on hover.
        outline:
          "border border-rule bg-transparent text-foreground hover:bg-foreground hover:text-background hover:border-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-foreground hover:text-background",
        ghost:
          "text-muted-foreground hover:bg-muted hover:text-foreground",
        link:
          "text-signal underline underline-offset-4 decoration-1 hover:decoration-2 tracking-[0.08em]",
      },
      size: {
        default: "h-10 px-5 text-[0.6875rem]",
        sm: "h-8 px-3 text-[0.625rem] tracking-[0.12em] gap-1.5",
        lg: "h-12 px-7 text-xs",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button }
