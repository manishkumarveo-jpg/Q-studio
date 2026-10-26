import { cva, type VariantProps } from "class-variance-authority";
import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/cn";

const buttonVariants = cva("button", {
  variants: {
    variant: {
      primary: "button--primary",
      secondary: "button--secondary",
      ghost: "button--ghost",
      danger: "button--danger",
    },
    size: { sm: "button--sm", md: "", lg: "button--lg" },
  },
  defaultVariants: { variant: "primary", size: "md" },
});

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, type = "button", ...props },
  ref,
) {
  return <button ref={ref} type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});
