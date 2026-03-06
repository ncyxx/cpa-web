import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive:
          'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
        success:
          'border-emerald-200/50 bg-emerald-50/50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100 [&>svg]:text-emerald-600',
        warning:
          'border-amber-200/50 bg-amber-50/50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100 [&>svg]:text-amber-600',
        info:
          'border-blue-200/50 bg-blue-50/50 text-blue-900 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-100 [&>svg]:text-blue-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export type AlertVariants = VariantProps<typeof alertVariants>

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    AlertVariants {}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
)
Alert.displayName = 'Alert'

export { Alert, alertVariants }
