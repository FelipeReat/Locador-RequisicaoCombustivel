import { forwardRef } from "react";
import { Input } from "@/components/ui/input";

interface CNPJInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const CNPJInput = forwardRef<HTMLInputElement, CNPJInputProps>(
  ({ value, onChange, ...props }, ref) => {
    const formatCNPJ = (value: string) => {
      const cleaned = value.replace(/\D/g, "");
      if (cleaned.length <= 2) return cleaned;
      if (cleaned.length <= 5) return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;
      if (cleaned.length <= 8) return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`;
      if (cleaned.length <= 12) return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8)}`;
      return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12, 14)}`;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatCNPJ(e.target.value);
      e.target.value = formatted;
      onChange(e);
    };

    return (
      <Input
        ref={ref}
        {...props}
        value={formatCNPJ(value)}
        onChange={handleChange}
        maxLength={18}
        placeholder="00.000.000/0000-00"
      />
    );
  }
);

CNPJInput.displayName = "CNPJInput";