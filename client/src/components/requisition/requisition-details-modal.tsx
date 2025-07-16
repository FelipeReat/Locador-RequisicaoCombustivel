import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type FuelRequisition } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import StatusBadge from "./status-badge";
import { X, Edit, Check, Loader2 } from "lucide-react";
import { useState } from "react";

interface RequisitionDetailsModalProps {
  requisition: FuelRequisition | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (requisition: FuelRequisition) => void;
}

export default function RequisitionDetailsModal({
  requisition,
  isOpen,
  onClose,
  onEdit,
}: RequisitionDetailsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionInput, setShowRejectionInput] = useState(false);

  const updateStatus = useMutation({
    mutationFn: async (data: { status: string; approver?: string; rejectionReason?: string }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/fuel-requisitions/${requisition?.id}/status`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-requisitions/stats/overview"] });
      toast({
        title: "Sucesso",
        description: "Status da requisição atualizado com sucesso!",
      });
      onClose();
      setRejectionReason("");
      setShowRejectionInput(false);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar status",
        variant: "destructive",
      });
    },
  });

  const handleApprove = () => {
    updateStatus.mutate({
      status: "approved",
      approver: "João Silva", // In a real app, this would be the current user
    });
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, informe o motivo da rejeição",
        variant: "destructive",
      });
      return;
    }

    updateStatus.mutate({
      status: "rejected",
      approver: "João Silva",
      rejectionReason: rejectionReason,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR");
  };

  const getDepartmentLabel = (department: string) => {
    const labels = {
      logistica: "Logística",
      manutencao: "Manutenção",
      transporte: "Transporte",
      operacoes: "Operações",
    };
    return labels[department as keyof typeof labels] || department;
  };

  const getFuelTypeLabel = (fuelType: string) => {
    const labels = {
      gasolina: "Gasolina",
      etanol: "Etanol",
      diesel: "Diesel",
      diesel_s10: "Diesel S10",
    };
    return labels[fuelType as keyof typeof labels] || fuelType;
  };

  const getPriorityLabel = (priority: string) => {
    const labels = {
      baixa: "Baixa",
      media: "Média",
      alta: "Alta",
      urgente: "Urgente",
    };
    return labels[priority as keyof typeof labels] || priority;
  };

  if (!requisition) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Detalhes da Requisição #REQ{String(requisition.id).padStart(3, "0")}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">Status</Label>
              <div className="mt-1">
                <StatusBadge status={requisition.status as any} />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-500">Solicitante</Label>
              <p className="text-gray-900 mt-1">{requisition.requester}</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-500">Departamento</Label>
              <p className="text-gray-900 mt-1">{getDepartmentLabel(requisition.department)}</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-500">Tipo de Combustível</Label>
              <p className="text-gray-900 mt-1">{getFuelTypeLabel(requisition.fuelType)}</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-500">Quantidade</Label>
              <p className="text-gray-900 mt-1">{requisition.quantity} Litros</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">Data de Solicitação</Label>
              <p className="text-gray-900 mt-1">{formatDateTime(requisition.createdAt)}</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-500">Data Necessária</Label>
              <p className="text-gray-900 mt-1">{formatDate(requisition.requiredDate)}</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-500">Prioridade</Label>
              <p className="text-gray-900 mt-1">{getPriorityLabel(requisition.priority)}</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-500">Aprovador</Label>
              <p className="text-gray-900 mt-1">{requisition.approver || "-"}</p>
            </div>

            {requisition.approvedDate && (
              <div>
                <Label className="text-sm font-medium text-gray-500">Data de Aprovação</Label>
                <p className="text-gray-900 mt-1">{formatDateTime(requisition.approvedDate)}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <Label className="text-sm font-medium text-gray-500">Justificativa</Label>
          <p className="text-gray-900 bg-gray-50 p-3 rounded-lg mt-2">
            {requisition.justification}
          </p>
        </div>

        {requisition.rejectionReason && (
          <div className="mt-4">
            <Label className="text-sm font-medium text-gray-500">Motivo da Rejeição</Label>
            <p className="text-gray-900 bg-red-50 p-3 rounded-lg mt-2">
              {requisition.rejectionReason}
            </p>
          </div>
        )}

        {showRejectionInput && (
          <div className="mt-4">
            <Label className="text-sm font-medium text-gray-500">Motivo da Rejeição</Label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Informe o motivo da rejeição..."
              className="mt-2"
            />
          </div>
        )}

        <DialogFooter className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex space-x-3">
            {requisition.status === "pending" && onEdit && (
              <Button
                variant="outline"
                onClick={() => onEdit(requisition)}
                className="flex items-center"
              >
                <Edit className="mr-1 h-4 w-4" />
                Editar
              </Button>
            )}

            {requisition.status === "pending" && (
              <>
                {!showRejectionInput ? (
                  <Button
                    variant="destructive"
                    onClick={() => setShowRejectionInput(true)}
                    className="flex items-center"
                  >
                    <X className="mr-1 h-4 w-4" />
                    Rejeitar
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={updateStatus.isPending}
                    className="flex items-center"
                  >
                    {updateStatus.isPending && (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    )}
                    Confirmar Rejeição
                  </Button>
                )}

                <Button
                  onClick={handleApprove}
                  disabled={updateStatus.isPending}
                  className="flex items-center bg-green-600 hover:bg-green-700"
                >
                  {updateStatus.isPending && (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  )}
                  <Check className="mr-1 h-4 w-4" />
                  Aprovar
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
