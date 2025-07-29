import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type FuelRequisition } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
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
import { PDFGenerator } from "@/lib/pdf-generator";
import { X, Edit, Check, Loader2, FileText } from "lucide-react";
import { useState } from "react";

interface RequisitionDetailsModalProps {
  requisition: FuelRequisition | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (requisition: FuelRequisition) => void;
  onEditRequisition?: (requisition: FuelRequisition) => void;
}

export default function RequisitionDetailsModal({
  requisition,
  isOpen,
  onClose,
  onEdit,
  onEditRequisition,
}: RequisitionDetailsModalProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [showRejectionInput, setShowRejectionInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

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
        title: t("success"),
        description: t("status-updated-success"),
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
        title: t("error"),
        description: t("rejection-reason-required"),
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

  const generatePurchasePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      // Buscar dados do fornecedor e veículo
      const supplierResponse = await fetch(`/api/suppliers/${requisition.supplierId}`);
      const vehicleResponse = await fetch(`/api/vehicles/${requisition.vehicleId}`);

      const supplier = supplierResponse.ok ? await supplierResponse.json() : null;
      const vehicle = vehicleResponse.ok ? await vehicleResponse.json() : null;

      const pdfGenerator = new PDFGenerator();
      pdfGenerator.generatePurchaseOrderPDF(requisition, supplier, vehicle);
      pdfGenerator.save(`ordem-compra-${String(requisition.id).padStart(4, '0')}.pdf`);

      toast({
        title: t("pdf-generated-success"),
        description: t("purchase-order-generated"),
      });
    } catch (error) {
      toast({
        title: t("error"),
        description: t("pdf-generation-error"),
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
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
              <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</Label>
              <div className="mt-1">
                <StatusBadge status={requisition.status as any} />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Responsável</Label>
              <p className="text-gray-900 dark:text-white mt-1">{requisition.responsavel}</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Cliente</Label>
              <p className="text-gray-900 dark:text-white mt-1">{requisition.client}</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Tipo de Combustível</Label>
              <p className="text-gray-900 dark:text-white mt-1">{getFuelTypeLabel(requisition.fuelType)}</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Quantidade</Label>
              <p className="text-gray-900 dark:text-white mt-1">{requisition.quantity} Litros</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Data de Solicitação</Label>
              <p className="text-gray-900 dark:text-white mt-1">{formatDateTime(requisition.createdAt)}</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Data Necessária</Label>
              <p className="text-gray-900 dark:text-white mt-1">{formatDate(requisition.requiredDate)}</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Prioridade</Label>
              <p className="text-gray-900 dark:text-white mt-1">{getPriorityLabel(requisition.priority)}</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Aprovador</Label>
              <p className="text-gray-900 dark:text-white mt-1">{requisition.approver || "-"}</p>
            </div>

            {requisition.approvedDate && (
              <div>
                <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Data de Aprovação</Label>
                <p className="text-gray-900 dark:text-white mt-1">{formatDateTime(requisition.approvedDate)}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Justificativa</Label>
          <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg mt-2">
            {requisition.justification}
          </p>
        </div>

        {requisition.rejectionReason && (
          <div className="mt-4">
            <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Motivo da Rejeição</Label>
            <p className="text-gray-900 dark:text-white bg-red-50 dark:bg-red-900/20 p-3 rounded-lg mt-2">
              {requisition.rejectionReason}
            </p>
          </div>
        )}

        {showRejectionInput && (
          <div className="mt-4">
            <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Motivo da Rejeição</Label>
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
            {(requisition.status === "approved" || requisition.status === "fulfilled") && (
              <Button
                variant="outline"
                onClick={generatePurchasePDF}
                className="flex items-center bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                disabled={isGeneratingPDF}
              >
                {isGeneratingPDF && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <FileText className="mr-1 h-4 w-4" />
                Gerar Ordem de Compra
              </Button>
            )}

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

            {requisition.status === "approved" && onEditRequisition && (
              <Button
                variant="outline"
                onClick={() => onEditRequisition(requisition)}
                className="flex items-center"
              >
                <Edit className="mr-1 h-4 w-4" />
                Editar Valores
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