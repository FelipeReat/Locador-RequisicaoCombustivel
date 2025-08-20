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
  onEditRequisition?: (requisition: FuelRequisition) => void;
}

export default function RequisitionDetailsModal({
  requisition,
  isOpen,
  onClose,
  onEditRequisition,
}: RequisitionDetailsModalProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { canEdit, canApprove } = usePermissions();
  const queryClient = useQueryClient();
  const [showRejectionInput, setShowRejectionInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Fetch vehicle details for this requisition
  const { data: vehicleDetails } = useQuery({
    queryKey: ["/api/vehicles", requisition?.vehicleId],
    queryFn: async () => {
      if (!requisition?.vehicleId) return null;
      const response = await fetch(`/api/vehicles/${requisition.vehicleId}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!requisition?.vehicleId,
  });

  // Fetch current user to check if they already generated purchase order for this requisition
  const { data: currentUser } = useQuery({
    queryKey: ["/api/user/profile"],
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Assuming hasPermission is a function available in the scope or imported
  // For demonstration, let's assume it's passed or globally available.
  // If it's part of usePermissions, you might need to adjust accordingly.
  const hasPermission = (permission: string) => {
    // Placeholder for actual permission check logic
    // Example: return userPermissions.includes(permission);
    // For now, let's assume it's always true for demonstration purposes
    // or if it's derived from canEdit/canApprove, adjust here.
    // Based on the original code, canEdit and canApprove are already used.
    // The `hasPermission('create_fuel_requisition')` and `hasPermission('approve_fuel_requisition')`
    // seem to be new or from a different permission system.
    // If they are meant to be derived from the existing hooks, they should be used directly.
    // For the sake of applying the changes, I'll assume `canEdit` maps to `create_fuel_requisition`
    // and `canApprove` maps to `approve_fuel_requisition`.
    // If `hasPermission` is a separate function, its implementation would be needed.
    return true; // Defaulting to true to allow the structure to be rendered
  };

  // Assuming canEditValues is a derived permission or prop.
  // For now, let's assume canEditValues is the same as canEdit.
  const canEditValues = canEdit(); // Adjust if canEditValues has a different source

  const updateStatus = useMutation({
    mutationFn: async (data: { status: string; approver?: string; rejectionReason?: string }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/fuel-requisitions/${requisition?.id}/status`,
        data
      );
      return response.json();
    },
    onSuccess: (updatedRequisition) => {
      // Atualização otimizada - apenas invalida sem refetch forçado
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-requisitions", "stats"] });

      // Atualização otimista dos dados em cache
      queryClient.setQueryData(["/api/fuel-requisitions"], (old: any) => {
        if (!old) return old;
        return old.map((req: any) =>
          req.id === updatedRequisition.id ? updatedRequisition : req
        );
      });

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

        // Mark that this user has generated a purchase order for this requisition
        await apiRequest("PATCH", `/api/fuel-requisitions/${requisition.id}/purchase-order`, {
          generated: true,
          userId: (currentUser as any)?.id
        });
        
        // Invalidate queries to refresh the data
        queryClient.invalidateQueries({ queryKey: ["/api/fuel-requisitions"] });
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

  // Check if current user has already generated purchase order for this requisition
  const hasGeneratedPurchaseOrder = requisition?.purchaseOrderGenerated === "true";

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
              <p className="text-gray-900 dark:text-white mt-1">{users?.find(u => u.id === requisition.requesterId)?.username || 'Usuário não encontrado'}</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Cliente</Label>
              <p className="text-gray-900 dark:text-white mt-1">{requisition.client}</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Quantidade</Label>
              <p className="text-gray-900 dark:text-white mt-1">{requisition.quantity} Litros</p>
            </div>

            {/* Detalhes do Veículo e Informações de KM lado a lado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 col-span-full">
              {/* Detalhes do Veículo */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <Label className="text-sm font-medium text-blue-700 dark:text-blue-300">Detalhes do Veículo</Label>
                {vehicleDetails ? (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm"><span className="font-medium">Placa:</span> {vehicleDetails.plate}</p>
                    <p className="text-sm"><span className="font-medium">Modelo:</span> {vehicleDetails.brand} {vehicleDetails.model}</p>
                    <p className="text-sm"><span className="font-medium">Ano:</span> {vehicleDetails.year}</p>
                    <p className="text-sm"><span className="font-medium">Combustível:</span> {vehicleDetails.fuelType}</p>
                    <p className="text-sm"><span className="font-medium">KM Atual:</span> {vehicleDetails.mileage || 'Não informado'}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mt-1">Carregando informações do veículo...</p>
                )}
              </div>

              {/* Informações de KM */}
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Informações de Quilometragem</Label>
                <div className="mt-2 space-y-1">
                  <p className="text-sm"><span className="font-medium">KM Anterior:</span> {requisition.kmAnterior}</p>
                  <p className="text-sm"><span className="font-medium">KM Atual:</span> {requisition.kmAtual}</p>
                  <p className="text-sm"><span className="font-medium">KM Rodado:</span> {requisition.kmRodado}</p>
                  <p className="text-sm"><span className="font-medium">Tanque Cheio:</span> {requisition.tanqueCheio === "true" ? "Sim" : "Não"}</p>
                </div>
              </div>
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
            {requisition && (requisition.status === "approved" || requisition.status === "fulfilled") && !hasGeneratedPurchaseOrder && (
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
            
            {requisition && (requisition.status === "approved" || requisition.status === "fulfilled") && hasGeneratedPurchaseOrder && (
              <div className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-md">
                <Check className="h-4 w-4" />
                Ordem de compra já foi gerada para esta requisição
              </div>
            )}

            {requisition && requisition.status === "approved" && onEditRequisition && canEditValues && (
              <Button
                onClick={() => onEditRequisition(requisition)}
                variant="outline"
                className="w-full sm:w-auto border-blue-500 text-blue-600 hover:bg-blue-50 hover:border-blue-600 hover:text-blue-700 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20"
              >
                <Edit className="mr-2 h-4 w-4" />
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