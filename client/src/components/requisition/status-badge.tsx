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
          label: t('pending'),
          variant: "secondary" as const,
          className: "bg-yellow-100 text-yellow-800",
        };
      case "approved":
        return {
          label: t('approved'),
          variant: "secondary" as const,
          className: "bg-green-100 text-green-800",
        };
      case "rejected":
        return {
          label: t('rejected'),
          variant: "destructive" as const,
          className: "bg-red-100 text-red-800",
        };
      case "fulfilled":
        return {
          label: t('fulfilled'),
          variant: "secondary" as const,
          className: "bg-blue-100 text-blue-800",
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