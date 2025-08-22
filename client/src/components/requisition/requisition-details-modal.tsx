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
import { X, Edit, Check, Loader2, FileText, Trash2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";

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
  const { userRole, hasPermission, canAccessRequisition, canActOnRequisition, canEdit } = usePermissions();
  const canApprove = () => userRole === 'manager' || userRole === 'admin';
  const { user } = useAuth();
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

  // Use canEdit from usePermissions hook for editing values
  const canEditValues = canEdit();

  const deleteRequisition = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "DELETE",
        `/api/fuel-requisitions/${requisition?.id}`
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-requisitions", "stats"] });
      toast({
        title: "Sucesso",
        description: "Requisição excluída com sucesso",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir requisição",
        variant: "destructive",
      });
    },
  });

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

  const handleDeleteRequisition = () => {
    const confirmed = window.confirm("Tem certeza que deseja excluir esta requisição? Esta ação não pode ser desfeita.");
    if (confirmed) {
      deleteRequisition.mutate();
    }
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
      // Invalida cache para garantir dados mais atuais antes de gerar o PDF
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      
      // Aguarda um breve momento para o cache ser invalidado
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Buscar dados do fornecedor, veículo e usuário responsável com dados atualizados
      const supplierResponse = await fetch(`/api/suppliers/${requisition?.supplierId}`, {
        cache: 'no-cache', // Força busca sem cache
        headers: { 'Cache-Control': 'no-cache' }
      });
      const vehicleResponse = await fetch(`/api/vehicles/${requisition?.vehicleId}`, {
        cache: 'no-cache',
        headers: { 'Cache-Control': 'no-cache' }
      });
      const userResponse = await fetch(`/api/users/${requisition?.requesterId}`, {
        cache: 'no-cache',
        headers: { 'Cache-Control': 'no-cache' }
      });

      const supplier = supplierResponse.ok ? await supplierResponse.json() : null;
      const vehicle = vehicleResponse.ok ? await vehicleResponse.json() : null;
      const requesterUser = userResponse.ok ? await userResponse.json() : null;

      console.log('Dados para o PDF:', { requisition, supplier, vehicle, requesterUser });

      const pdfGenerator = new PDFGenerator();
      if (requisition) {
        pdfGenerator.generatePurchaseOrderPDF(requisition, supplier, vehicle, requesterUser);
        pdfGenerator.save(`ordem-compra-${String(requisition.id).padStart(4, '0')}.pdf`);

        // Atualização otimista - atualiza o cache imediatamente
        queryClient.setQueryData(["/api/fuel-requisitions"], (old: any) => {
          if (!old) return old;
          return old.map((req: any) =>
            req.id === requisition.id
              ? { ...req, purchaseOrderGenerated: "true" }
              : req
          );
        });

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
      // Reverter a mudança otimista em caso de erro
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-requisitions"] });

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
  // Busca os dados mais atualizados do cache
  const currentRequisitionData = queryClient.getQueryData(["/api/fuel-requisitions"]) as any[];
  const currentRequisition = currentRequisitionData?.find((req: any) => req.id === requisition?.id);
  const hasGeneratedPurchaseOrder = (currentRequisition?.purchaseOrderGenerated || requisition?.purchaseOrderGenerated) === "true";

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

  // Impedir que funcionários vejam detalhes de requisições que não são suas
  if (!requisition) return null;
  
  if (userRole === 'employee' && user?.id !== requisition.requesterId) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Acesso Negado</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-gray-600 dark:text-gray-400">
              Você só pode visualizar os detalhes de suas próprias requisições.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={onClose} variant="outline">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

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
            {/* Apenas usuários com permissão podem agir na requisição */}
            {requisition && canActOnRequisition(requisition.requesterId) && (userRole !== 'employee' || user?.id === requisition.requesterId) && (
              <>
                {(requisition.status === "approved" || requisition.status === "fulfilled") && !hasGeneratedPurchaseOrder && (userRole === 'manager' || userRole === 'admin' || (userRole === 'employee' && user?.id === requisition.requesterId)) && (
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

                {(requisition.status === "approved" || requisition.status === "fulfilled") && hasGeneratedPurchaseOrder && (userRole === 'manager' || userRole === 'admin' || (userRole === 'employee' && user?.id === requisition.requesterId)) && (
                  <div className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-md">
                    <Check className="h-4 w-4" />
                    Ordem de compra já foi gerada para esta requisição
                  </div>
                )}

                {requisition.status === "approved" && onEditRequisition && canEditValues && (
                  <Button
                    onClick={() => onEditRequisition(requisition)}
                    variant="outline"
                    className="w-full sm:w-auto border-blue-500 text-blue-600 hover:bg-blue-50 hover:border-blue-600 hover:text-blue-700 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Editar Valores
                  </Button>
                )}

                {requisition.status === "pending" && canApprove() && (
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

                {/* Botão de exclusão para gerentes/admins - realizadas só admin pode excluir */}
                {(userRole === 'manager' || userRole === 'admin') && (requisition.status !== "fulfilled" || userRole === 'admin') && (
                  <Button
                    variant="destructive"
                    onClick={handleDeleteRequisition}
                    disabled={deleteRequisition.isPending}
                    className="flex items-center"
                    title={
                      requisition.status === "fulfilled" && userRole !== 'admin' 
                        ? "Apenas administradores podem excluir requisições realizadas" 
                        : "Excluir requisição"
                    }
                  >
                    {deleteRequisition.isPending && (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    )}
                    <Trash2 className="mr-1 h-4 w-4" />
                    Excluir Requisição
                  </Button>
                )}
              </>
            )}

            {/* Mensagem quando o usuário não pode agir na requisição */}
            {requisition && (!canActOnRequisition(requisition.requesterId) || (userRole === 'employee' && user?.id !== requisition.requesterId)) && (
              <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                {userRole === 'employee' && user?.id !== requisition.requesterId 
                  ? "Visualização apenas - Você só pode agir em suas próprias requisições"
                  : "Visualização apenas - Esta requisição pertence a outro usuário"
                }
              </div>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}