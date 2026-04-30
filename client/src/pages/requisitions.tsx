import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type FuelRequisition, type Supplier } from "@shared/schema";
import Header from "@/components/layout/header";
import StatusBadge from "@/components/requisition/status-badge";
import RequisitionDetailsModal from "@/components/requisition/requisition-details-modal";
import EditApprovedRequisitionModal from "@/components/requisition/edit-approved-requisition-modal";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Check, Edit, Eye, Plus, Trash2, Undo2, X } from "lucide-react";
import { useLocation } from "wouter";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const ITEMS_PER_PAGE = 15;

export default function Requisitions() {
  const [, setLocation] = useLocation();
  const [selectedRequisition, setSelectedRequisition] = useState<FuelRequisition | null>(null);
  const [editingRequisition, setEditingRequisition] = useState<FuelRequisition | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const { userRole, hasPermission, canActOnRequisition } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Hooks for real-time updates
  const { forceRefresh } = useRealTimeUpdates();

  const { data: requisitions = [], isLoading, isFetching } = useQuery<FuelRequisition[]>({
    queryKey: ["/api/fuel-requisitions"],
  });

  const { data: suppliers, isLoading: suppliersLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  // Placeholder for vehicles data if needed for the table
  const { data: vehicles = [] } = useQuery<any[]>({
    queryKey: ["/api/vehicles"],
  });

  // Mutation to delete requisition
  const deleteRequisition = useMutation({
    mutationFn: async (requisitionId: number) => {
      const response = await apiRequest("DELETE", `/api/fuel-requisitions/${requisitionId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-requisitions/stats/overview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-requisitions/stats"] });

      toast({
        title: "Sucesso",
        description: "Requisição excluída com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir requisição",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-requisitions/stats/overview"] });
    }
  });

  // Mutation to undo a fulfilled requisition (admin only)
  const undoRequisition = useMutation({
    mutationFn: async (requisitionId: number) => {
      const response = await apiRequest("PATCH", `/api/fuel-requisitions/${requisitionId}/undo`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-requisitions/stats/overview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-requisitions/stats"] });

      queryClient.refetchQueries({ queryKey: ["/api/fuel-requisitions"] });
      queryClient.refetchQueries({ queryKey: ["/api/fuel-requisitions/stats/overview"] });

      toast({
        title: "Sucesso",
        description: "Requisição desfeita com sucesso. Status alterado para aprovada.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao desfazer requisição",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-requisitions/stats/overview"] });
    }
  });

  // Mutation to confirm requisition (change from approved to fulfilled)
  const confirmRequisition = useMutation({
    mutationFn: async (requisitionId: number) => {
      const response = await apiRequest("PATCH", `/api/fuel-requisitions/${requisitionId}/status`, {
        status: "fulfilled"
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-requisitions/stats/overview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-requisitions/stats"] });

      queryClient.refetchQueries({ queryKey: ["/api/fuel-requisitions"] });
      queryClient.refetchQueries({ queryKey: ["/api/fuel-requisitions/stats/overview"] });

      toast({
        title: "Sucesso",
        description: "Requisição confirmada como realizada",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao confirmar requisição",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-requisitions/stats/overview"] });
    }
  });

  const filteredRequisitions = useMemo(() => {
    return requisitions.filter((req) => {
      const matchesStatus = !statusFilter || statusFilter === "all" || req.status === statusFilter;
      return matchesStatus;
    });
  }, [requisitions, statusFilter]);

  const sortedRequisitions = useMemo(() =>
    [...filteredRequisitions].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
  [filteredRequisitions]);

  const filteredCounts = useMemo(() => {
    const base = {
      total: filteredRequisitions.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      fulfilled: 0,
    };

    for (const requisition of filteredRequisitions) {
      if (requisition.status === "pending") base.pending += 1;
      if (requisition.status === "approved") base.approved += 1;
      if (requisition.status === "rejected") base.rejected += 1;
      if (requisition.status === "fulfilled") base.fulfilled += 1;
    }

    return base;
  }, [filteredRequisitions]);

  const currentResultsCount = sortedRequisitions.length;
  const totalPages = Math.max(1, Math.ceil(currentResultsCount / ITEMS_PER_PAGE));
  const activePage = Math.min(currentPage, totalPages);
  const displayedRequisitions = useMemo(() => {
    const start = (activePage - 1) * ITEMS_PER_PAGE;
    return sortedRequisitions.slice(start, start + ITEMS_PER_PAGE);
  }, [activePage, sortedRequisitions]);
  const paginationStart = currentResultsCount === 0 ? 0 : (activePage - 1) * ITEMS_PER_PAGE + 1;
  const paginationEnd = currentResultsCount === 0 ? 0 : Math.min(paginationStart + displayedRequisitions.length - 1, currentResultsCount);

  const statusQuickFilters = useMemo(() => ([
    { value: "all", label: "Todos", count: filteredCounts.total },
    { value: "pending", label: "Pendentes", count: filteredCounts.pending },
    { value: "approved", label: "Aprovadas", count: filteredCounts.approved },
    { value: "rejected", label: "Rejeitadas", count: filteredCounts.rejected },
    { value: "fulfilled", label: "Realizadas", count: filteredCounts.fulfilled },
  ]), [filteredCounts]);

  const hasActiveFilters = statusFilter !== "all";

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const getSupplierName = (supplierId: number) => {
    const supplier = suppliers?.find(s => s.id === supplierId);
    return supplier?.fantasia || "-"; // Changed to fantasia as per common practice
  };

  const getUserName = (requesterId: number) => {
    const user = users.find((u: any) => u.id === requesterId);
    return user?.fullName || user?.username || "-";
  };

  const getFuelTypeLabel = (fuelType: string) => {
    const labels = {
      gasolina: 'Gasolina',
      etanol: 'Etanol',
      diesel: 'Diesel',
      diesel_s10: 'Diesel S10',
    };
    return labels[fuelType as keyof typeof labels] || fuelType;
  };

  const handleView = (requisition: FuelRequisition) => {
    setSelectedRequisition(requisition);
  };

  const handleConfirmRequisition = async (requisitionId: number) => {
    // Verificar se a requisição tem os valores obrigatórios preenchidos
    const requisition = displayedRequisitions.find(req => req.id === requisitionId);
    if (!requisition) return;

    // Verificar se pricePerLiter foi preenchido (obrigatório para confirmar)
    if (!requisition.pricePerLiter || parseFloat(requisition.pricePerLiter) <= 0) {
      toast({
        title: "Ação não permitida",
        description: "Antes de confirmar a realização, você deve editar a requisição e informar o preço por litro e outros valores reais do abastecimento.",
        variant: "destructive",
      });
      return;
    }

    try {
      await confirmRequisition.mutateAsync(requisitionId);
    } catch (error) {
      // Error is handled by the mutation's onError callback
      console.error('Error confirming requisition:', error);
    }
  };

  const handleUndoRequisition = async (requisitionId: number) => {
    const confirmed = window.confirm("Tem certeza que deseja desfazer esta requisição realizada? Ela voltará para o status 'Aprovada'.");
    if (confirmed) {
      try {
        await undoRequisition.mutateAsync(requisitionId);
      } catch (error) {
        // Error is handled by the mutation's onError callback
        console.error('Error undoing requisition:', error);
      }
    }
  };

  const handleDeleteRequisition = async (requisitionId: number) => {
    const confirmed = window.confirm("Tem certeza que deseja excluir esta requisição? Esta ação não pode ser desfeita.");
    if (confirmed) {
      try {
        await deleteRequisition.mutateAsync(requisitionId);
      } catch (error) {
        // Error is handled by the mutation's onError callback
        console.error('Error deleting requisition:', error);
      }
    }
  };

  const generatePDF = (requisition: FuelRequisition) => {
    try {
      // Import PDF generator (assuming it exists in the project)
      import('@/lib/pdf-generator').then(({ PDFGenerator }) => {
        const pdfGenerator = new PDFGenerator('portrait');

        // Get additional data for the PDF
        const user = users.find((u: any) => u.id === requisition.requesterId);
        const supplier = suppliers?.find(s => s.id === requisition.supplierId);
        const vehicle = vehicles?.find(v => v.id === requisition.vehicleId);

        const pdfData = {
          ...requisition,
          requesterName: user?.fullName || user?.username || 'N/A',
          supplierName: supplier?.name || 'N/A',
          vehiclePlate: vehicle?.plate || 'N/A',
          vehicleModel: vehicle?.model || 'N/A'
        };

        pdfGenerator.generateRequisitionsReport([pdfData], {
          title: `Requisição ${requisition.id}`,
          subtitle: `Data: ${new Date(requisition.createdAt).toLocaleDateString('pt-BR')}`,
          company: 'Sistema de Controle de Abastecimento'
        });

        pdfGenerator.save(`requisicao-${requisition.id}-${new Date().toISOString().split('T')[0]}.pdf`);

        toast({
          title: "PDF Gerado",
          description: `PDF da requisição ${requisition.id} baixado com sucesso!`,
        });
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (isLoading && !requisitions.length) {
    return <LoadingSpinner message="Carregando dados..." />;
  }

  return (
    <>
      <Header 
        title="Requisições" 
        subtitle="Gerenciar todas as requisições de combustível" 
      />

      <main className="flex-1 mobile-content pt-12 sm:pt-4 lg:pt-6">
        <div className="relative">
          <div className="pointer-events-none absolute inset-x-0 -top-10 h-40 bg-gradient-to-r from-zinc-600/10 via-stone-600/10 to-amber-600/10 blur-3xl" />
          <div className="relative space-y-6">
            <div className="overflow-hidden rounded-xl border bg-gradient-to-br from-zinc-700 via-stone-700 to-amber-600 text-white shadow-sm">
              <div className="p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="text-sm text-white/80">Gerenciamento</div>
                  <div className="text-2xl font-semibold tracking-tight">Requisições de Combustível</div>
                  <div className="text-sm text-white/80">
                    {currentResultsCount} resultado(s) • {filteredCounts.pending} pendente(s) • {filteredCounts.approved} aprovado(s)
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    className="bg-white/15 text-white hover:bg-white/25 border border-white/20"
                    onClick={() => forceRefresh()}
                  >
                    Atualizar
                  </Button>
                  {hasPermission('create_fuel_requisition') && (
                    <Button
                      className="bg-white text-amber-700 hover:bg-white/90"
                      onClick={() => setLocation("/new-requisition")}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Requisição
                    </Button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/10">
                <div className="p-4 bg-white/5">
                  <div className="text-xs text-white/70">Total</div>
                  <div className="mt-1 text-xl font-semibold">{filteredCounts.total}</div>
                </div>
                <div className="p-4 bg-white/5">
                  <div className="text-xs text-white/70">Pendentes</div>
                  <div className="mt-1 text-xl font-semibold">{filteredCounts.pending}</div>
                </div>
                <div className="p-4 bg-white/5">
                  <div className="text-xs text-white/70">Aprovadas</div>
                  <div className="mt-1 text-xl font-semibold">{filteredCounts.approved}</div>
                </div>
                <div className="p-4 bg-white/5">
                  <div className="text-xs text-white/70">Realizadas</div>
                  <div className="mt-1 text-xl font-semibold">{filteredCounts.fulfilled}</div>
                </div>
              </div>
            </div>

            <Card className="border mt-6">
        <CardHeader className="mobile-card pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="mobile-text-lg text-gray-800 dark:text-gray-100">
                📋 Requisições
              </CardTitle>
              <CardDescription className="mobile-text-sm text-gray-600 dark:text-gray-300">
                Gerenciar requisições de combustível • Organizadas por data e carregadas em lotes de 15
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">
                {currentResultsCount} requisições encontradas
              </div>
              {hasActiveFilters ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => {
                    setStatusFilter("all");
                    setCurrentPage(1);
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {statusQuickFilters.map((s) => {
              const active = statusFilter === s.value;
              return (
                <Button
                  key={s.value}
                  type="button"
                  variant={active ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => {
                    setStatusFilter(s.value);
                    setCurrentPage(1);
                  }}
                  className={cn(
                    "h-9 gap-2 whitespace-nowrap",
                    active
                      ? "bg-gradient-to-r from-zinc-600/15 via-stone-600/15 to-amber-500/15 border-amber-600/25"
                      : ""
                  )}
                >
                  <span className="text-sm">{s.label}</span>
                  <Badge variant="secondary" className={cn("h-6 px-2", active ? "bg-white/40 text-foreground" : "")}>
                    {s.count}
                  </Badge>
                </Button>
              );
            })}
          </div>
        </CardHeader>
        <CardContent className="mobile-card pt-0">
          <div className="mobile-table-container">
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 bg-gray-50 dark:bg-gray-800/50">
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                    ID <span className="text-xs text-muted-foreground">(#)</span>
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                    Status
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                    Solicitante
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                    Fornecedor
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                    Veículo
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                    Combustível
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                    Quantidade
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                    Data de Criação <span className="text-xs text-muted-foreground">(↓ Recente)</span>
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300 text-center">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedRequisitions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-12">
                      <div className="flex flex-col items-center space-y-2">
                        <div className="text-4xl">📋</div>
                        <p className="text-lg font-medium">Nenhuma requisição encontrada</p>
                        <p className="text-sm">Ajuste os filtros ou crie uma nova requisição</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedRequisitions.map((requisition, index) => (
                    <TableRow 
                      key={requisition.id} 
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                        index % 2 === 0 ? 'bg-gray-25 dark:bg-gray-900/20' : ''
                      }`}
                    >
                      <TableCell className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
                        #{requisition.id}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={requisition.status as any} />
                      </TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">
                        {getUserName(requisition.requesterId)}
                      </TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300 font-medium">
                        {getSupplierName(requisition.supplierId)}
                      </TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300 font-mono text-sm">
                        {vehicles?.find(vehicle => vehicle.id === requisition.vehicleId)?.plate || 
                         <span className="text-muted-foreground italic">Desconhecido</span>}
                      </TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">
                        {getFuelTypeLabel(requisition.fuelType || "")}
                      </TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300 font-medium">
                        {requisition.tanqueCheio === "true" ? "Tanque Cheio" : `${requisition.quantity || "0"}L`}
                      </TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300 text-sm">
                        {formatDate(requisition.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(requisition)}
                            className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                            title="Visualizar detalhes"
                            data-testid={`button-view-${requisition.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {/* Botões de editar e confirmar - para funcionários apenas quando aprovada e é sua própria requisição */}
                          {requisition.status === "approved" && userRole === 'employee' && canActOnRequisition(requisition.requesterId) && user?.id === requisition.requesterId && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingRequisition(requisition)}
                                className="h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600 text-white"
                                title="Editar valores após aprovação"
                                data-testid={`button-edit-values-${requisition.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleConfirmRequisition(requisition.id)}
                                className={`h-8 w-8 p-0 text-white ${
                                  requisition.pricePerLiter && parseFloat(requisition.pricePerLiter) > 0
                                    ? "bg-green-500 hover:bg-green-600"
                                    : "bg-gray-400 hover:bg-gray-500"
                                }`}
                                title={
                                  requisition.pricePerLiter && parseFloat(requisition.pricePerLiter) > 0
                                    ? "Confirmar realização"
                                    : "Edite os valores antes de confirmar"
                                }
                                data-testid={`button-confirm-${requisition.id}`}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {/* Botões de editar e confirmar - para gerentes/admins quando aprovada */}
                          {requisition.status === "approved" && (userRole === 'manager' || userRole === 'admin') && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingRequisition(requisition)}
                                className="h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600 text-white"
                                title="Editar valores após aprovação"
                                data-testid={`button-edit-values-${requisition.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleConfirmRequisition(requisition.id)}
                                className={`h-8 w-8 p-0 text-white ${
                                  requisition.pricePerLiter && parseFloat(requisition.pricePerLiter) > 0
                                    ? "bg-green-500 hover:bg-green-600"
                                    : "bg-gray-400 hover:bg-gray-500"
                                }`}
                                title={
                                  requisition.pricePerLiter && parseFloat(requisition.pricePerLiter) > 0
                                    ? "Confirmar realização"
                                    : "Edite os valores antes de confirmar"
                                }
                                data-testid={`button-confirm-${requisition.id}`}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {/* Botão de desfazer para administradores - apenas requisições realizadas */}
                          {userRole === 'admin' && requisition.status === "fulfilled" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUndoRequisition(requisition.id)}
                              disabled={undoRequisition.isPending}
                              className="h-8 w-8 p-0 bg-orange-500 hover:bg-orange-600 text-white"
                              title="Desfazer requisição realizada (volta para aprovada)"
                              data-testid={`button-undo-${requisition.id}`}
                            >
                              {undoRequisition.isPending ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <Undo2 className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          {/* Botão de exclusão para gerentes/admins - realizadas só admin pode excluir */}
                          {(userRole === 'manager' || userRole === 'admin') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRequisition(requisition.id)}
                              disabled={(requisition.status === "fulfilled" && userRole !== 'admin') || deleteRequisition.isPending}
                              className="h-8 w-8 p-0 bg-red-500 hover:bg-red-600 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
                              title={
                                requisition.status === "fulfilled" && userRole !== 'admin' 
                                  ? "Apenas administradores podem excluir requisições realizadas" 
                                  : "Excluir requisição"
                              }
                              data-testid={`button-delete-${requisition.id}`}
                            >
                              {deleteRequisition.isPending ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {currentResultsCount > 0 && (
            <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-4 py-4 dark:border-gray-700 dark:bg-gray-800/30 sm:flex-row sm:items-center sm:justify-between rounded-b-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Exibindo <span className="font-medium">{paginationStart}</span> a{" "}
                <span className="font-medium">{paginationEnd}</span> de{" "}
                <span className="font-medium">{currentResultsCount}</span> requisições
                {isFetching ? " • Atualizando..." : ""}
              </div>
              <div className="flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={activePage <= 1 || isFetching}
                >
                  <ChevronsLeft className="mr-2 h-4 w-4" />
                  Primeira
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={activePage <= 1 || isFetching}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Anterior
                </Button>
                <div className="min-w-[110px] text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                  Página {activePage} de {totalPages}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={activePage >= totalPages || isFetching}
                >
                  Próxima
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={activePage >= totalPages || isFetching}
                >
                  Última
                  <ChevronsRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          {currentResultsCount === 0 && !isFetching && (
            <div className="flex items-center justify-center px-4 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 rounded-b-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Nenhuma requisição disponível para os filtros atuais
              </div>
            </div>
          )}
        </CardContent>
      </Card>
          </div>
        </div>
      </main>

      <RequisitionDetailsModal
        requisition={selectedRequisition}
        isOpen={!!selectedRequisition}
        onClose={() => setSelectedRequisition(null)}
        onEditRequisition={(req) => {
          setSelectedRequisition(null);
          setEditingRequisition(req); // Open the modal to edit approved requisitions
        }}
      />

      <EditApprovedRequisitionModal
        requisition={editingRequisition}
        isOpen={!!editingRequisition}
        onClose={() => setEditingRequisition(null)}
      />
    </>
  );
}
