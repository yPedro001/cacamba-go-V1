import * as React from "react"
import { Input, InputProps } from "@/components/ui/input"
import { Eye, EyeOff } from "lucide-react"

export const PasswordInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)

    return (
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          className={className}
          ref={ref}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors focus:outline-none"
          tabIndex={-1} // impede que o tab pare no botão para melhor fluxo de teclado, ou pode ser 0 dependendo da a11y desejada
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
          <span className="sr-only">
            {showPassword ? "Ocultar senha" : "Mostrar senha"}
          </span>
        </button>
      </div>
    )
  }
)
PasswordInput.displayName = "PasswordInput"
