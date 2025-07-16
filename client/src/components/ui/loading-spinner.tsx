import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

export default function LoadingSpinner({ 
  message = "Carregando...", 
  className = "" 
}: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div className="flex items-center space-x-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-gray-600">{message}</span>
      </div>
    </div>
  );
}
