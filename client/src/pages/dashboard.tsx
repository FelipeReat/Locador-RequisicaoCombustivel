import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type FuelRequisition, type Supplier } from "@shared/schema";
import Header from "@/components/layout/header";
import StatusBadge from "@/components/requisition/status-badge";
import RequisitionDetailsModal from "@/components/requisition/requisition-details-modal";
import EditApprovedRequisitionModal from "@/components/requisition/edit-approved-requisition-modal";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  Clock,
  CheckCircle,
  Fuel,
  Plus,
  BarChart3,
  Eye,
  Edit,
  Check,
  FileText,
  Truck,
  Building,
  Users,
  BarChart,
  Trash2,
  Undo2
} from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/language-context";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useRealTimeUpdates, useSmartInvalidation } from "@/hooks/useRealTimeUpdates";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [selectedRequisition, setSelectedRequisition] = useState<FuelRequisition | null>(null);
  const [editingRequisition, setEditingRequisition] = useState<FuelRequisition | null>(null);
  const { t } = useLanguage();
  const { userRole, hasPermission, canAccessRequisition, canActOnRequisition } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Hooks para atualizações em tempo real
  const { forceRefresh } = useRealTimeUpdates();
  const { invalidateByOperation } = useSmartInvalidation();

  const { data: stats = { totalRequests: 0, pendingRequests: 0, approvedRequests: 0, rejectedRequests: 0, fulfilledRequests: 0, totalLiters: 0 }, isLoading: statsLoading } = useQuery<any>({
    queryKey: ["/api/fuel-requisitions/stats/overview"],
  });

  const { data: requisitions, isLoading: requisitionsLoading } = useQuery<FuelRequisition[]>({
    queryKey: ["/api/fuel-requisitions"],
  });

  const { data: suppliers, isLoading: suppliersLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  // Filtrar requisições baseado nas permissões do usuário
  const accessibleRequisitions = useMemo(() => {
    if (!requisitions || !user) return [];

    return requisitions.filter(req => canAccessRequisition(req.requesterId));
  }, [requisitions, user, canAccessRequisition]);

  const recentRequisitions = accessibleRequisitions.slice(0, 5);

  // Mutation para deletar requisição
  const deleteRequisition = useMutation({
    mutationFn: async (requisitionId: number) => {
      const response = await apiRequest("DELETE", `/api/fuel-requisitions/${requisitionId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-requisitions/stats/overview"] });
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
    // Atualização otimista
    onMutate: async (requisitionId: number) => {
      // Cancela queries em andamento
      await queryClient.cancelQueries({ queryKey: ["/api/fuel-requisitions"] });

      // Salva estado anterior
      const previousRequisitions = queryClient.getQueryData(["/api/fuel-requisitions"]);
      const previousStats = queryClient.getQueryData(["/api/fuel-requisitions/stats/overview"]);

      // Atualiza otimisticamente a lista
      queryClient.setQueryData(["/api/fuel-requisitions"], (old: FuelRequisition[] | undefined) => {
        if (!old) return old;
        return old.map(req =>
          req.id === requisitionId
            ? { ...req, status: 'fulfilled' as any, fulfilledAt: new Date().toISOString() }
            : req
        );
      });

      // Atualiza otimisticamente as estatísticas
      queryClient.setQueryData(["/api/fuel-requisitions/stats/overview"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          approvedRequests: Math.max(0, (old.approvedRequests || 0) - 1),
          fulfilledRequests: (old.fulfilledRequests || 0) + 1
        };
      });

      return { previousRequisitions, previousStats };
    },
    onSuccess: () => {
      // Invalida e força atualização de todas as queries relacionadas
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
    onError: (error: any, variables, context) => {
      // Rollback em caso de erro
      if (context?.previousRequisitions) {
        queryClient.setQueryData(["/api/fuel-requisitions"], context.previousRequisitions);
      }
      if (context?.previousStats) {
        queryClient.setQueryData(["/api/fuel-requisitions/stats/overview"], context.previousStats);
      }

      toast({
        title: "Erro",
        description: error.message || "Erro ao confirmar requisição",
        variant: "destructive",
      });
    },
    // Sempre revalida para garantir consistência
    onSettled: () => {
      invalidateByOperation('requisition');
    }
  });

  const handleDeleteRequisition = async (requisitionId: number) => {
    const confirmed = window.confirm("Tem certeza que deseja excluir esta requisição? Esta ação não pode ser desfeita.");
    if (confirmed) {
      try {
        await deleteRequisition.mutateAsync(requisitionId);
      } catch (error) {
        console.error('Error deleting requisition:', error);
      }
    }
  };

  const handleUndoRequisition = async (requisitionId: number) => {
    const confirmed = window.confirm("Tem certeza que deseja desfazer esta requisição realizada? Ela voltará para o status 'Aprovada'.");
    if (confirmed) {
      try {
        await undoRequisition.mutateAsync(requisitionId);
      } catch (error) {
        console.error('Error undoing requisition:', error);
      }
    }
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const getSupplierName = (supplierId: number) => {
    const supplier = suppliers?.find(s => s.id === supplierId);
    return supplier?.name || "-";
  };

  const getUserName = (requesterId: number) => {
    const user = users.find((u: any) => u.id === requesterId);
    return user?.fullName || "-";
  };

  const getFuelTypeLabel = (fuelType: string) => {
    const labels = {
      gasolina: t('gasoline'),
      etanol: t('ethanol'),
      diesel: t('diesel'),
      diesel_s10: t('diesel-s10'),
    };
    return labels[fuelType as keyof typeof labels] || fuelType;
  };

  const openRequisitionModal = (requisition: FuelRequisition) => {
    setSelectedRequisition(requisition);
  };

  if (statsLoading || requisitionsLoading || suppliersLoading) {
    return <LoadingSpinner message={t('loading-dashboard')} />;
  }

  return (
    <>
      <Header
        title={t('dashboard')}
        subtitle={t('fuel-requisitions-overview')}
      />

      <main className="flex-1 mobile-content pt-12 sm:pt-4 lg:pt-6">
        <div className="relative">
          <div className="pointer-events-none absolute inset-x-0 -top-10 h-40 bg-gradient-to-r from-zinc-600/10 via-stone-600/10 to-amber-600/10 blur-3xl" />
          <div className="relative space-y-6">
            <div className="overflow-hidden rounded-xl border bg-gradient-to-br from-zinc-700 via-stone-700 to-amber-600 text-white shadow-sm">
              <div className="p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="text-sm text-white/80">{t('fuel-requisitions-overview')}</div>
                  <div className="text-2xl font-semibold tracking-tight">
                    Olá, {user?.fullName || user?.username || "Usuário"}
                  </div>
                  <div className="text-sm text-white/80">
                    Atualizado em {new Date().toLocaleString("pt-BR")}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    className="bg-white/15 text-white hover:bg-white/25 border border-white/20"
                    onClick={() => forceRefresh()}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
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
                  <div className="text-xs text-white/70">{t('total-requests')}</div>
                  <div className="mt-1 text-xl font-semibold">{stats.totalRequests || 0}</div>
                </div>
                <div className="p-4 bg-white/5">
                  <div className="text-xs text-white/70">{t('pending-requests')}</div>
                  <div className="mt-1 text-xl font-semibold">{stats.pendingRequests || 0}</div>
                </div>
                <div className="p-4 bg-white/5">
                  <div className="text-xs text-white/70">{t('approved-requests')}</div>
                  <div className="mt-1 text-xl font-semibold">{stats.approvedRequests || 0}</div>
                </div>
                <div className="p-4 bg-white/5">
                  <div className="text-xs text-white/70">Litros aprovados</div>
                  <div className="mt-1 text-xl font-semibold">
                    {stats.totalLiters ? parseFloat(stats.totalLiters).toLocaleString('pt-BR') : '0'}L
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="relative overflow-hidden border-white/10 bg-gradient-to-br from-zinc-600/10 via-stone-600/10 to-amber-500/10 dark:from-zinc-500/20 dark:via-stone-500/20 dark:to-amber-500/20 backdrop-blur hover:shadow-md transition-shadow">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-foreground/90">{t('total-requests')}</CardTitle>
                  <div className="p-2 rounded-full bg-gradient-to-br from-zinc-600/20 to-amber-500/20 text-zinc-700 dark:text-zinc-200">
                    <ClipboardList className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-3xl font-semibold tracking-tight">{stats.totalRequests || 0}</div>
                  <div className="mt-1 text-xs text-muted-foreground">Visão geral do sistema</div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-white/10 bg-gradient-to-br from-zinc-600/10 via-stone-600/10 to-amber-500/10 dark:from-zinc-500/20 dark:via-stone-500/20 dark:to-amber-500/20 backdrop-blur hover:shadow-md transition-shadow">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-foreground/90">{t('pending-requests')}</CardTitle>
                  <div className="p-2 rounded-full bg-gradient-to-br from-amber-500/25 to-orange-500/20 text-amber-800 dark:text-amber-300">
                    <Clock className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-3xl font-semibold tracking-tight">{stats.pendingRequests || 0}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    Aguardando aprovação
                    {(stats.pendingRequests || 0) > 0 && (
                      <Badge variant="secondary" className="h-5 px-2 text-[10px]">Ação</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-white/10 bg-gradient-to-br from-zinc-600/10 via-stone-600/10 to-amber-500/10 dark:from-zinc-500/20 dark:via-stone-500/20 dark:to-amber-500/20 backdrop-blur hover:shadow-md transition-shadow">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-foreground/90">{t('approved-requests')}</CardTitle>
                  <div className="p-2 rounded-full bg-gradient-to-br from-amber-500/20 to-zinc-600/20 text-amber-800 dark:text-amber-300">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-3xl font-semibold tracking-tight">{stats.approvedRequests || 0}</div>
                  <div className="mt-1 text-xs text-muted-foreground">Prontas para realização</div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-white/10 bg-gradient-to-br from-zinc-600/10 via-stone-600/10 to-amber-500/10 dark:from-zinc-500/20 dark:via-stone-500/20 dark:to-amber-500/20 backdrop-blur hover:shadow-md transition-shadow">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-foreground/90">Realizadas</CardTitle>
                  <div className="p-2 rounded-full bg-gradient-to-br from-stone-600/20 to-amber-500/20 text-stone-700 dark:text-stone-200">
                    <Fuel className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-3xl font-semibold tracking-tight">{stats.fulfilledRequests || 0}</div>
                  <div className="mt-1 text-xs text-muted-foreground">Confirmadas como abastecidas</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-1">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">{t('quick-actions')}</CardTitle>
                  <CardDescription>Atalhos para o dia a dia</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {hasPermission('create_fuel_requisition') && (
                    <Button
                      variant="outline"
                      className="w-full justify-start h-12 px-4 hover:shadow-sm transition-shadow"
                      onClick={() => setLocation("/new-requisition")}
                    >
                        <div className="mr-3 grid place-items-center h-9 w-9 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300">
                        <Plus className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Nova Requisição</div>
                        <div className="text-xs text-muted-foreground">Solicitar combustível</div>
                      </div>
                    </Button>
                  )}

                  {hasPermission('read_fuel_requisition') && (
                    <Button asChild variant="outline" className="w-full justify-start h-12 px-4 hover:shadow-sm transition-shadow">
                      <a href="/requisitions">
                        <div className="mr-3 grid place-items-center h-9 w-9 rounded-lg bg-gray-600/10 text-gray-700 dark:text-gray-300">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Requisições</div>
                          <div className="text-xs text-muted-foreground">Ver e gerenciar</div>
                        </div>
                      </a>
                    </Button>
                  )}

                  {hasPermission('read_vehicle') && (
                    <Button asChild variant="outline" className="w-full justify-start h-12 px-4 hover:shadow-sm transition-shadow">
                      <a href="/fleet-management">
                        <div className="mr-3 grid place-items-center h-9 w-9 rounded-lg bg-zinc-600/10 text-zinc-700 dark:text-zinc-300">
                          <Truck className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Gestão de Frota</div>
                          <div className="text-xs text-muted-foreground">Veículos e status</div>
                        </div>
                      </a>
                    </Button>
                  )}

                  {hasPermission('read_supplier') && (
                    <Button asChild variant="outline" className="w-full justify-start h-12 px-4 hover:shadow-sm transition-shadow">
                      <a href="/suppliers">
                        <div className="mr-3 grid place-items-center h-9 w-9 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300">
                          <Building className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Fornecedores</div>
                          <div className="text-xs text-muted-foreground">Cadastro e edição</div>
                        </div>
                      </a>
                    </Button>
                  )}

                  {hasPermission('read_company') && (
                    <Button asChild variant="outline" className="w-full justify-start h-12 px-4 hover:shadow-sm transition-shadow">
                      <a href="/companies">
                        <div className="mr-3 grid place-items-center h-9 w-9 rounded-lg bg-zinc-600/10 text-zinc-700 dark:text-zinc-300">
                          <Users className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Empresas</div>
                          <div className="text-xs text-muted-foreground">Gerenciar cadastros</div>
                        </div>
                      </a>
                    </Button>
                  )}

                  {hasPermission('view_reports') && (
                    <Button asChild variant="outline" className="w-full justify-start h-12 px-4 hover:shadow-sm transition-shadow">
                      <a href="/reports">
                        <div className="mr-3 grid place-items-center h-9 w-9 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300">
                          <BarChart className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Relatórios</div>
                          <div className="text-xs text-muted-foreground">Análises e exportação</div>
                        </div>
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">{t('recent-requisitions')}</CardTitle>
                      <CardDescription>As últimas 5 requisições visíveis para você</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setLocation("/requisitions")}
                      className="shrink-0"
                    >
                      {t('view-all')}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="lg:hidden">
                    {recentRequisitions.length === 0 ? (
                      <div className="px-6 py-8 text-center text-muted-foreground">
                        {t('no-results')}
                      </div>
                    ) : (
                      <div className="divide-y">
                        {recentRequisitions.map((requisition) => (
                          <div key={requisition.id} className="px-6 py-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <div className="font-medium text-sm">
                                  #REQ{String(requisition.id).padStart(3, "0")}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatDate(requisition.createdAt)}
                                </div>
                              </div>
                              <StatusBadge status={requisition.status as any} />
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Responsável:</span>
                                <span>{getUserName(requisition.requesterId)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Fornecedor:</span>
                                <span>{getSupplierName(requisition.supplierId)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Combustível:</span>
                                <span>{getFuelTypeLabel(requisition.fuelType)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Quantidade:</span>
                                <span>{requisition.tanqueCheio === "true" ? "Tanque Cheio" : `${requisition.quantity || '0'} L`}</span>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t">
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openRequisitionModal(requisition)}
                                  className="flex-1 text-xs"
                                >
                                  <Eye className="mr-1 h-3 w-3" />
                                  Ver
                                </Button>
                                {userRole === 'employee' && requisition.status === 'approved' && canActOnRequisition(requisition.requesterId) && user?.id === requisition.requesterId && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setEditingRequisition(requisition)}
                                      className="flex-1 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                                      title="Editar valores após aprovação"
                                    >
                                      <Edit className="mr-1 h-3 w-3" />
                                      Editar
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        if (!requisition.pricePerLiter || parseFloat(requisition.pricePerLiter) <= 0) {
                                          toast({
                                            title: "Ação não permitida",
                                            description: "Antes de confirmar a realização, você deve editar a requisição e informar o preço por litro e outros valores reais do abastecimento.",
                                            variant: "destructive",
                                          });
                                          return;
                                        }
                                        confirmRequisition.mutate(requisition.id);
                                      }}
                                      disabled={confirmRequisition.isPending}
                                      className="flex-1 text-xs bg-green-600 hover:bg-green-700 text-white"
                                      title="Confirmar realização"
                                    >
                                      <Check className="mr-1 h-3 w-3" />
                                      Confirmar
                                    </Button>
                                  </>
                                )}
                                {(userRole === 'manager' || userRole === 'admin') && requisition.status === 'approved' && canActOnRequisition(requisition.requesterId) && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setEditingRequisition(requisition)}
                                      className="flex-1 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                                      title="Editar valores após aprovação"
                                    >
                                      <Edit className="mr-1 h-3 w-3" />
                                      Editar
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        if (!requisition.pricePerLiter || parseFloat(requisition.pricePerLiter) <= 0) {
                                          toast({
                                            title: "Ação não permitida",
                                            description: "Antes de confirmar a realização, você deve editar a requisição e informar o preço por litro e outros valores reais do abastecimento.",
                                            variant: "destructive",
                                          });
                                          return;
                                        }
                                        confirmRequisition.mutate(requisition.id);
                                      }}
                                      disabled={confirmRequisition.isPending}
                                      className="flex-1 text-xs bg-green-600 hover:bg-green-700 text-white"
                                      title="Confirmar realização"
                                    >
                                      <Check className="mr-1 h-3 w-3" />
                                      Confirmar
                                    </Button>
                                  </>
                                )}
                                {(userRole === 'manager' || userRole === 'admin') && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteRequisition(requisition.id)}
                                    disabled={(requisition.status === "fulfilled" && userRole !== 'admin') || deleteRequisition.isPending}
                                    className="flex-1 text-xs bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    title={
                                      requisition.status === "fulfilled" && userRole !== 'admin'
                                        ? "Apenas administradores podem excluir requisições realizadas"
                                        : "Excluir requisição"
                                    }
                                  >
                                    {deleteRequisition.isPending ? (
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                    ) : (
                                      <Trash2 className="mr-1 h-3 w-3" />
                                    )}
                                    Excluir
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="hidden lg:block">
                    <div className="mobile-table-container">
                      <table className="w-full">
                        <thead className="bg-muted/40">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              RESPONSÁVEL
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              FORNECEDOR
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              TIPO DE COMBUSTÍVEL
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              QUANTIDADE
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              STATUS
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              DATA
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              AÇÕES
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {recentRequisitions.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="px-6 py-10 text-center text-muted-foreground">
                                {t('no-results')}
                              </td>
                            </tr>
                          ) : (
                            recentRequisitions.map((requisition) => (
                              <tr key={requisition.id} className="hover:bg-muted/30">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  #REQ{String(requisition.id).padStart(3, "0")}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  {getUserName(requisition.requesterId)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  {getSupplierName(requisition.supplierId)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  {getFuelTypeLabel(requisition.fuelType)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  {requisition.tanqueCheio === "true" ? "Tanque Cheio" : `${requisition.quantity || "0"}L`}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <StatusBadge status={requisition.status as any} />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  {formatDate(requisition.createdAt)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedRequisition(requisition)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {userRole === 'employee' && requisition.status === 'approved' && canActOnRequisition(requisition.requesterId) && user?.id === requisition.requesterId && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEditingRequisition(requisition)}
                                        title="Editar valores após aprovação"
                                        className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700 text-white"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          if (!requisition.pricePerLiter || parseFloat(requisition.pricePerLiter) <= 0) {
                                            toast({
                                              title: "Ação não permitida",
                                              description: "Antes de confirmar a realização, você deve editar a requisição e informar o preço por litro e outros valores reais do abastecimento.",
                                              variant: "destructive",
                                            });
                                            return;
                                          }
                                          confirmRequisition.mutate(requisition.id);
                                        }}
                                        disabled={confirmRequisition.isPending}
                                        title="Confirmar como realizada"
                                        className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700 text-white"
                                      >
                                        {confirmRequisition.isPending ? (
                                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        ) : (
                                          <Check className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </>
                                  )}
                                  {(userRole === 'manager' || userRole === 'admin') && requisition.status === 'approved' && canActOnRequisition(requisition.requesterId) && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEditingRequisition(requisition)}
                                        title="Editar valores reais"
                                        className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700 text-white"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          if (!requisition.pricePerLiter || parseFloat(requisition.pricePerLiter) <= 0) {
                                            toast({
                                              title: "Ação não permitida",
                                              description: "Antes de confirmar a realização, você deve editar a requisição e informar o preço por litro e outros valores reais do abastecimento.",
                                              variant: "destructive",
                                            });
                                            return;
                                          }
                                          confirmRequisition.mutate(requisition.id);
                                        }}
                                        disabled={confirmRequisition.isPending}
                                        title="Confirmar como realizada"
                                        className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700 text-white"
                                      >
                                        {confirmRequisition.isPending ? (
                                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        ) : (
                                          <Check className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </>
                                  )}
                                  {(userRole === 'manager' || userRole === 'admin') && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteRequisition(requisition.id)}
                                      disabled={(requisition.status === "fulfilled" && userRole !== 'admin') || deleteRequisition.isPending}
                                      className="h-8 w-8 p-0 bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
                                      title={
                                        requisition.status === "fulfilled" && userRole !== 'admin'
                                          ? "Apenas administradores podem excluir requisições realizadas"
                                          : "Excluir requisição"
                                      }
                                    >
                                      {deleteRequisition.isPending ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                      ) : (
                                        <Trash2 className="h-4 w-4" />
                                      )}
                                    </Button>
                                  )}
                                  {userRole === 'admin' && requisition.status === 'fulfilled' && canActOnRequisition(requisition.requesterId) && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleUndoRequisition(requisition.id)}
                                      disabled={undoRequisition.isPending}
                                      className="h-8 w-8 p-0 bg-yellow-500 hover:bg-yellow-600 text-white"
                                      title="Desfazer Requisição Realizada"
                                    >
                                      {undoRequisition.isPending ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                      ) : (
                                        <Undo2 className="h-4 w-4" />
                                      )}
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <RequisitionDetailsModal
        requisition={selectedRequisition}
        isOpen={!!selectedRequisition}
        onClose={() => setSelectedRequisition(null)}
        onEditRequisition={(req) => {
          setSelectedRequisition(null);
          setEditingRequisition(req);
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
