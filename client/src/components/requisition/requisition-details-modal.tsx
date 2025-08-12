import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type FuelRequisition } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import { usePermissions } from "@/hooks/usePermissions";
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
  const { canEdit, canApprove } = usePermissions();
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
      // Invalida todas as queries relacionadas às requisições
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-requisitions/stats/overview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-requisitions/stats"] });
      
      // Força atualização imediata
      queryClient.refetchQueries({ queryKey: ["/api/fuel-requisitions"] });
      queryClient.refetchQueries({ queryKey: ["/api/fuel-requisitions/stats/overview"] });
      
      toast({
        title: "Sucesso",
        description: "Status atualizado com sucesso",
      });
      onClose();
      setRejectionReason("");
      setShowRejectionInput(false);
    },
    onError: (error: any) => {
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
      const supplierResponse = await fetch(`/api/suppliers/${requisition?.supplierId}`);
      const vehicleResponse = await fetch(`/api/vehicles/${requisition?.vehicleId}`);

      const supplier = supplierResponse.ok ? await supplierResponse.json() : null;
      const vehicle = vehicleResponse.ok ? await vehicleResponse.json() : null;

      const pdfGenerator = new PDFGenerator();
      if (requisition) {
        pdfGenerator.generatePurchaseOrderPDF(requisition, supplier, vehicle);
        pdfGenerator.save(`ordem-compra-${String(requisition.id).padStart(4, '0')}.pdf`);
      }

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

  const handleDownloadPDF = () => {
    if (!requisition) return;

    try {
      const pdfGenerator = new PDFGenerator('landscape');

      // Buscar dados do fornecedor
      const supplier = suppliers?.find(s => s.id === requisition.supplierId);

      // Buscar dados do veículo
      const vehicle = vehicles?.find(v => v.id === requisition.vehicleId);

      // Buscar dados do usuário que criou a requisição
      const requesterUser = users?.find(u => u.id === requisition.requesterId);

      pdfGenerator.generatePurchaseOrderPDF(requisition, supplier, vehicle, requesterUser);
      pdfGenerator.save(`requisicao-${String(requisition.id).padStart(3, '0')}.pdf`);

      toast({
        title: "PDF Gerado",
        description: "O arquivo foi baixado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar o PDF. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Fetch suppliers
  const { data: suppliers } = useQuery<any[]>({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const response = await fetch("/api/suppliers");
      if (!response.ok) throw new Error("Failed to fetch suppliers");
      return response.json();
    },
  });

  // Fetch vehicles
  const { data: vehicles } = useQuery<any[]>({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const response = await fetch("/api/vehicles");
      if (!response.ok) throw new Error("Failed to fetch vehicles");
      return response.json();
    },
  });

  // Fetch users
  const { data: users } = useQuery<any[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });

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
              <p className="text-gray-900 dark:text-white mt-1">{getUserName(requisition.requesterId)}</p>
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

            {requisition.pricePerLiter && (
              <div>
                <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Valor Total do Combustível</Label>
                <p className="text-gray-900 dark:text-white mt-1 font-semibold text-lg">
                  R$ {((parseFloat(requisition.quantity || "0") * parseFloat(requisition.pricePerLiter)) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            )}

            {requisition.fiscalCoupon && (
              <div>
                <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Cupom Fiscal</Label>
                <p className="text-gray-900 dark:text-white mt-1">{requisition.fiscalCoupon}</p>
              </div>
            )}

            {requisition.approvedDate && (
              <div>
                <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Data de Aprovação</Label>
                <p className="text-gray-900 dark:text-white mt-1">{formatDateTime(requisition.approvedDate)}</p>
              </div>
            )}
          </div>
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
            {requisition && (requisition.status === "approved" || requisition.status === "fulfilled") && (
              <Button
                variant="outline"
                onClick={handleDownloadPDF}
                className="flex items-center bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                disabled={isGeneratingPDF}
              >
                {isGeneratingPDF && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <FileText className="mr-1 h-4 w-4" />
                Gerar Ordem de Compra
              </Button>
            )}

            {requisition && requisition.status === "pending" && onEdit && canEdit() && (
              <Button
                variant="outline"
                onClick={() => onEdit(requisition)}
                className="flex items-center"
                data-testid="button-edit-requisition"
              >
                <Edit className="mr-1 h-4 w-4" />
                Editar
              </Button>
            )}

            {requisition && requisition.status === "approved" && onEditRequisition && canEdit() && (
              <Button
                variant="outline"
                onClick={() => onEditRequisition(requisition)}
                className="flex items-center"
                data-testid="button-edit-values"
              >
                <Edit className="mr-1 h-4 w-4" />
                Editar Valores
              </Button>
            )}

            {requisition && requisition.status === "pending" && canApprove() && (
              <>
                {!showRejectionInput ? (
                  <Button
                    variant="destructive"
                    onClick={() => setShowRejectionInput(true)}
                    className="flex items-center"
                    data-testid="button-reject-requisition"
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
                    data-testid="button-confirm-rejection"
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
                  data-testid="button-approve-requisition"
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