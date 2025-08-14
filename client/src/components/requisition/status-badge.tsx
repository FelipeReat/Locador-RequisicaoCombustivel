import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/language-context";

type Status = "pending" | "approved" | "rejected" | "fulfilled";

interface StatusBadgeProps {
  status: Status;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useLanguage();

  const getStatusConfig = (status: Status) => {
    switch (status) {
      case "pending":
        return {
          label: "Pendente",
          variant: "secondary" as const,
          className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        };
      case "approved":
        return {
          label: "Aprovado",
          variant: "secondary" as const,
          className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        };
      case "rejected":
        return {
          label: "Rejeitado",
          variant: "destructive" as const,
          className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        };
      case "fulfilled":
        return {
          label: "Realizado",
          variant: "secondary" as const,
          className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        };
      default:
        return {
          label: status,
          variant: "secondary" as const,
          className: "",
        };
    }
  };
  const { label, variant, className } = getStatusConfig(status);

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}