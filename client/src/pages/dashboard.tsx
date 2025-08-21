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
  BarChart
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/language-context";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { useRealTimeUpdates, useSmartInvalidation } from "@/hooks/useRealTimeUpdates";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [selectedRequisition, setSelectedRequisition] = useState<FuelRequisition | null>(null);
  const [editingRequisition, setEditingRequisition] = useState<FuelRequisition | null>(null);
  const { t } = useLanguage();
  const { userRole, canApprove, hasPermission } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Hooks para atualizações em tempo real
  const { forceRefresh } = useRealTimeUpdates();
  const { invalidateByOperation } = useSmartInvalidation();

  const { data: stats, isLoading: statsLoading } = useQuery<any>({
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

  const recentRequisitions = requisitions?.slice(0, 5) || [];

  // Mutation para confirmar requisição (mudar de approved para fulfilled)
  const confirmRequisition = useMutation({
    mutationFn: async (requisitionId: number) => {
      const response = await fetch(`/api/fuel-requisitions/${requisitionId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "fulfilled"
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao confirmar requisição");
      }

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
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('total-requests')}
              </CardTitle>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {stats.totalRequests || 0}
              </div>
              <p className="text-xs text-muted-foreground">Todo o período • Sistema completo</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-yellow-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('pending-requests')}
              </CardTitle>
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                {stats.pendingRequests || 0}
              </div>
              <p className="text-xs text-muted-foreground">Aguardando aprovação • Ação necessária</p>
              {(stats.pendingRequests || 0) > 0 && (
                <div className="mt-2">
                  <Badge variant="secondary" className="text-xs">
                    Requer atenção
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('approved-requests')}
              </CardTitle>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                {stats.approvedRequests || 0}
              </div>
              <p className="text-xs text-muted-foreground">Este mês • Processadas com sucesso</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-purple-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('total-liters')}
              </CardTitle>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <Fuel className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                {stats.totalLiters ? parseFloat(stats.totalLiters).toLocaleString('pt-BR') : '0'}L
              </div>
              <p className="text-xs text-muted-foreground">Total aprovado • Consumo autorizado</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-l-4 border-l-indigo-500/30 mt-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-gray-800 dark:text-gray-100">
              ⚡ {t('quick-actions')}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Atalhos para tarefas comuns • Acesso rápido às principais funcionalidades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hasPermission('create_fuel_requisition') && (
                <Button
                  variant="outline"
                  className="h-auto p-4 justify-start hover:shadow-md transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => setLocation("/new-requisition")}
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full">
                      <Plus className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-base text-gray-900 dark:text-gray-100">Nova Requisição</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Solicitar combustível</div>
                    </div>
                  </div>
                </Button>
              )}

              {hasPermission('read_fuel_requisition') && (
                <Button asChild variant="outline" className="h-auto p-4 justify-start hover:shadow-md transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <a href="/requisitions" className="flex items-center space-x-4">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                      <FileText className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-base text-gray-900 dark:text-gray-100">Ver Requisições</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Gerenciar solicitações</div>
                    </div>
                  </a>
                </Button>
              )}

              {hasPermission('read_vehicle') && (
                <Button asChild variant="outline" className="h-auto p-4 justify-start hover:shadow-md transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <a href="/fleet-management" className="flex items-center space-x-4">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                      <Truck className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-base text-gray-900 dark:text-gray-100">Gestão de Frota</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Gerenciar veículos</div>
                    </div>
                  </a>
                </Button>
              )}

              {hasPermission('read_supplier') && (
                <Button asChild variant="outline" className="h-auto p-4 justify-start hover:shadow-md transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <a href="/suppliers" className="flex items-center space-x-4">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                      <Building className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-base text-gray-900 dark:text-gray-100">Fornecedores</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Gerenciar fornecedores</div>
                    </div>
                  </a>
                </Button>
              )}

              {hasPermission('read_company') && (
                <Button asChild variant="outline" className="h-auto p-4 justify-start hover:shadow-md transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <a href="/companies" className="flex items-center space-x-4">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                      <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-base text-gray-900 dark:text-gray-100">Empresas</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Gerenciar empresas</div>
                    </div>
                  </a>
                </Button>
              )}

              {hasPermission('view_reports') && (
                <Button asChild variant="outline" className="h-auto p-4 justify-start hover:shadow-md transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <a href="/reports" className="flex items-center space-x-4">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                      <BarChart className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-base text-gray-900 dark:text-gray-100">Relatórios</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Ver análises</div>
                    </div>
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Requisitions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mt-6">
          <div className="mobile-card border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base lg:text-lg font-semibold text-gray-800 dark:text-white">{t('recent-requisitions')}</h3>
              <Button
                variant="link"
                onClick={() => setLocation("/requisitions")}
                className="text-primary hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
              >
                {t('view-all')}
              </Button>
            </div>
          </div>

          {/* Mobile Cards View */}
          <div className="lg:hidden">
            {recentRequisitions.length === 0 ? (
              <div className="mobile-card px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                {t('no-results')}
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentRequisitions.map((requisition) => (
                  <div key={requisition.id} className="mobile-card px-6 py-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                          #REQ{String(requisition.id).padStart(3, "0")}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(requisition.createdAt)}
                        </div>
                      </div>
                      <StatusBadge status={requisition.status as any} />
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Responsável:</span>
                        <span className="text-gray-900 dark:text-white">{getUserName(requisition.requesterId)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Fornecedor:</span>
                        <span className="text-gray-900 dark:text-white">{getSupplierName(requisition.supplierId)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Combustível:</span>
                        <span className="text-gray-900 dark:text-white">{getFuelTypeLabel(requisition.fuelType)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Quantidade:</span>
                        <span className="text-gray-900 dark:text-white">{requisition.tanqueCheio === "true" ? "Tanque Cheio" : `${requisition.quantity || '0'} L`}</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
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
                        {/* Botões para funcionários quando a requisição está aprovada */}
                        {userRole === 'employee' && requisition.status === 'approved' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingRequisition(requisition)}
                              className="flex-1 text-xs bg-blue-500 hover:bg-blue-600 text-white"
                              title="Editar valores após aprovação"
                            >
                              <Edit className="mr-1 h-3 w-3" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => confirmRequisition.mutate(requisition.id)}
                              disabled={confirmRequisition.isPending}
                              className="flex-1 text-xs bg-green-500 hover:bg-green-600 text-white"
                              title="Confirmar realização"
                            >
                              <Check className="mr-1 h-3 w-3" />
                              Confirmar
                            </Button>
                          </>
                        )}
                        {/* Botões para não-funcionários quando a requisição está aprovada */}
                        {userRole !== 'employee' && requisition.status === 'approved' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => confirmRequisition.mutate(requisition.id)}
                            disabled={confirmRequisition.isPending}
                            className="flex-1 text-xs"
                          >
                            <Check className="mr-1 h-3 w-3" />
                            Confirmar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="mobile-table-container hidden lg:block">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    RESPONSÁVEL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    FORNECEDOR
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    TIPO DE COMBUSTÍVEL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    QUANTIDADE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    STATUS
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    DATA
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    AÇÕES
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {recentRequisitions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      {t('no-results')}
                    </td>
                  </tr>
                ) : (
                  recentRequisitions.map((requisition) => (
                    <tr key={requisition.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        #REQ{String(requisition.id).padStart(3, "0")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {getUserName(requisition.requesterId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {getSupplierName(requisition.supplierId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {getFuelTypeLabel(requisition.fuelType)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {requisition.tanqueCheio === "true" ? "Tanque Cheio" : `${requisition.quantity || "0"}L`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={requisition.status as any} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
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
                        {/* Botões para funcionários quando a requisição está aprovada */}
                        {userRole === 'employee' && requisition.status === 'approved' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingRequisition(requisition)}
                              title="Editar valores após aprovação"
                              className="h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600 text-white"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => confirmRequisition.mutate(requisition.id)}
                              disabled={confirmRequisition.isPending}
                              title="Confirmar realização"
                              className="h-8 w-8 p-0 bg-green-500 hover:bg-green-600 text-white"
                            >
                              {confirmRequisition.isPending ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                          </>
                        )}
                        {/* Botões para não-funcionários quando a requisição está aprovada */}
                        {userRole !== 'employee' && requisition.status === 'approved' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingRequisition(requisition)}
                              title="Editar valores reais"
                              className="h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600 text-white"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => confirmRequisition.mutate(requisition.id)}
                              disabled={confirmRequisition.isPending}
                              title="Confirmar como realizada"
                              className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                            >
                              {confirmRequisition.isPending ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                          </>
                        )}
                        
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <RequisitionDetailsModal
        requisition={selectedRequisition}
        isOpen={!!selectedRequisition}
        onClose={() => setSelectedRequisition(null)}
        onEdit={(req) => {
          setSelectedRequisition(null);
          setLocation("/requisitions");
        }}
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