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
  Check
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/language-context";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { useRealTimeUpdates, useSmartInvalidation } from "@/hooks/useRealTimeUpdates";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [selectedRequisition, setSelectedRequisition] = useState<FuelRequisition | null>(null);
  const [editingRequisition, setEditingRequisition] = useState<FuelRequisition | null>(null);
  const { t } = useLanguage();
  const { userRole, canApprove } = usePermissions();
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
      toast({
        title: "Sucesso",
        description: "Requisição confirmada como realizada",
      });
      // Usa invalidação inteligente
      invalidateByOperation('requisition');
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

      <main className="flex-1 mobile-container py-4 lg:py-6">
        {/* Stats Cards */}
        <div className="mobile-stats-grid mb-6 lg:mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow mobile-card border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-2 lg:p-3">
                <ClipboardList className="h-4 w-4 lg:h-6 lg:w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3 lg:ml-4 min-w-0">
                <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-300 truncate">{t('total-requests')}</p>
                <p className="text-lg lg:text-2xl font-semibold text-gray-800 dark:text-white">
                  {stats?.totalRequests || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow mobile-card border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="bg-yellow-100 dark:bg-yellow-900 rounded-full p-2 lg:p-3">
                <Clock className="h-4 w-4 lg:h-6 lg:w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-3 lg:ml-4 min-w-0">
                <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-300 truncate">{t('pending-requests')}</p>
                <p className="text-lg lg:text-2xl font-semibold text-gray-800 dark:text-white">
                  {stats?.pendingRequests || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow mobile-card border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center min-w-0">
                <div className="bg-green-100 dark:bg-green-900 rounded-full p-2 lg:p-3">
                  <CheckCircle className="h-4 w-4 lg:h-6 lg:w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-3 lg:ml-4 min-w-0">
                  <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-300 truncate">{t('approved-requests')}</p>
                  <p className="text-lg lg:text-2xl font-semibold text-gray-800 dark:text-white">
                    {stats?.approvedRequests || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow mobile-card border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="bg-red-100 dark:bg-red-900 rounded-full p-2 lg:p-3">
                <Fuel className="h-4 w-4 lg:h-6 lg:w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-3 lg:ml-4 min-w-0">
                <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-300 truncate">{t('consumed-liters')}</p>
                <p className="text-lg lg:text-2xl font-semibold text-gray-800 dark:text-white">
                  {stats?.totalLiters?.toLocaleString("pt-BR") || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 lg:mb-8">
          <div className="mobile-card border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-base lg:text-lg font-semibold text-gray-800 dark:text-white">{t('quick-actions')}</h3>
          </div>
          <div className="mobile-card">
            <div className="mobile-button-group">
              <Button
                onClick={() => setLocation("/new-requisition")}
                className="flex items-center justify-center p-4 bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800 border-none"
                variant="outline"
              >
                <Plus className="mr-3 h-5 w-5" />
                {t('new-requisition')}
              </Button>

              {canApprove() && (
                <Button
                  onClick={() => setLocation("/requisitions?filter=pending")}
                  className="flex items-center justify-center p-4 bg-yellow-50 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-800 border-none"
                  variant="outline"
                >
                  <Clock className="mr-3 h-5 w-5" />
                  {t('approve-pending')}
                </Button>
              )}

              {userRole !== 'employee' && (
                <Button
                  onClick={() => setLocation("/reports")}
                  className="flex items-center justify-center p-4 bg-green-50 dark:bg-green-900 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-800 border-none"
                  variant="outline"
                >
                  <BarChart3 className="mr-3 h-5 w-5" />
                  {t('generate-report')}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Recent Requisitions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="mobile-card border-b border-gray-200 dark:border-gray-700">
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
              <div className="mobile-card text-center text-gray-500 dark:text-gray-400">
                {t('no-results')}
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentRequisitions.map((requisition) => (
                  <div key={requisition.id} className="mobile-card">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                          #REQ{String(requisition.id).padStart(3, "0")}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(requisition.createdAt)}
                        </div>
                      </div>
                      <StatusBadge status={requisition.status} />
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
                        <span className="text-gray-900 dark:text-white">{requisition.quantity || 'Tanque cheio'} L</span>
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
                    {t('fuel-type')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('quantity')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('date')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('actions')}
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
                        {userRole !== 'employee' && requisition.status === 'approved' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingRequisition(requisition)}
                              title="Editar valores reais"
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
                        {userRole !== 'employee' && requisition.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLocation("/requisitions")}
                            title="Ir para requisições"
                          >
                            <Edit className="h-4 w-4" />
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