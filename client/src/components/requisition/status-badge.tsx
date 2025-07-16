import { Clock, CheckCircle, XCircle, Package } from "lucide-react";

interface StatusBadgeProps {
  status: "pending" | "approved" | "rejected" | "fulfilled";
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "pending":
        return {
          label: "Pendente",
          icon: Clock,
          className: "status-badge status-pending",
        };
      case "approved":
        return {
          label: "Aprovada",
          icon: CheckCircle,
          className: "status-badge status-approved",
        };
      case "rejected":
        return {
          label: "Rejeitada",
          icon: XCircle,
          className: "status-badge status-rejected",
        };
      case "fulfilled":
        return {
          label: "Cumprida",
          icon: Package,
          className: "status-badge status-fulfilled",
        };
      default:
        return {
          label: "Desconhecido",
          icon: Clock,
          className: "status-badge",
        };
    }
  };

  const { label, icon: Icon, className } = getStatusConfig();

  return (
    <span className={className}>
      <Icon className="mr-1 h-3 w-3 inline" />
      {label}
    </span>
  );
}
