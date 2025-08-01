
import React, { forwardRef } from "react";
import { Input } from "@/components/ui/input";

interface MoneyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: string | number;
  onChange?: (value: string) => void;
}

const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ value, onChange, ...props }, ref) => {
    const formatMoney = (value: string): string => {
      // Remove all non-numeric characters
      const numericValue = value.replace(/[^\d]/g, '');
      
      if (!numericValue) return '';
      
      // Convert to number and divide by 100 to handle cents
      const number = parseInt(numericValue, 10) / 100;
      
      // Format with Brazilian locale
      return number.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const formattedValue = formatMoney(inputValue);
      
      if (onChange) {
        // Return the numeric value as string for form handling
        const numericValue = formattedValue.replace(/[^\d,]/g, '').replace(',', '.');
        onChange(numericValue);
      }
    };

    const displayValue = React.useMemo(() => {
      if (value === undefined || value === null || value === '') return '';
      
      const stringValue = typeof value === 'number' ? value.toString() : value;
      
      // If the value is already formatted, return as is
      if (stringValue.includes(',')) {
        return stringValue;
      }
      
      // Format the numeric value
      const numericValue = parseFloat(stringValue);
      if (isNaN(numericValue)) return '';
      
      return numericValue.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }, [value]);

    return (
      <Input
        {...props}
        ref={ref}
        value={displayValue}
        onChange={handleChange}
        placeholder="0,00"
      />
    );
  }
);

MoneyInput.displayName = "MoneyInput";

export { MoneyInput };
