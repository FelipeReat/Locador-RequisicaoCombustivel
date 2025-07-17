import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export default function LoadingSpinner({ message = "Carregando...", size = "md" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-96 space-y-4">
      <Loader2 className={`animate-spin ${sizeClasses[size]}`} />
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  );
}