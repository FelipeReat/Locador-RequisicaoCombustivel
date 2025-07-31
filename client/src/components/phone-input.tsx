import { forwardRef } from "react";
import { Input } from "@/components/ui/input";

interface PhoneInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, ...props }, ref) => {
    const formatPhone = (value: string) => {
      const cleaned = value.replace(/\D/g, "");
      if (cleaned.length <= 2) return cleaned;
      if (cleaned.length <= 6) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
      if (cleaned.length <= 10) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPhone(e.target.value);
      e.target.value = formatted;
      onChange(e);
    };

    return (
      <Input
        ref={ref}
        {...props}
        value={formatPhone(value)}
        onChange={handleChange}
        maxLength={15}
      />
    );
  }
);

PhoneInput.displayName = "PhoneInput";