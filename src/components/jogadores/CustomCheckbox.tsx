import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CustomCheckboxProps {
  checked: boolean
  onChange: () => void
  id: string
  label: string
}

export function CustomCheckbox({ 
  checked, 
  onChange, 
  id, 
  label 
}: CustomCheckboxProps) {
  return (
    <div className="flex items-center space-x-3 cursor-pointer" onClick={onChange}>
      <div className={cn(
        "w-5 h-5 border-2 rounded-md flex items-center justify-center transition-all duration-200",
        checked 
          ? "bg-white border-white" 
          : "bg-transparent border-white"
      )}>
        {checked && (
          <Check className="w-3 h-3 text-black font-bold" />
        )}
      </div>
      <label
        htmlFor={id}
        className="text-sm font-medium leading-none cursor-pointer flex-1"
      >
        {label}
      </label>
    </div>
  )
}