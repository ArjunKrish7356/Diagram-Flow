import React from "react";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

// Utility function (if not importing from utils, can directly add here too)
const cn = (...inputs) => twMerge(clsx(inputs));

const alertVariants = (variant = "default") =>
  cn(
    "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
    variant === "destructive"
      ? "border-red-500/50 text-red-500 dark:border-red-500 [&>svg]:text-red-500"
      : "bg-background text-foreground"
  );

export const Alert = React.forwardRef(({ className, variant, children, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants(variant), className)} {...props}>
    {children}
  </div>
));
Alert.displayName = "Alert";

export const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5 ref={ref} className={cn("mb-1 font-medium leading-none tracking-tight", className)} {...props} />
));
AlertTitle.displayName = "AlertTitle";

export const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />
));
AlertDescription.displayName = "AlertDescription";
