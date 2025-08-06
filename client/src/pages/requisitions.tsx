import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type FuelRequisition, type Supplier } from "@shared/schema";
import Header from "@/components/layout/header";
import StatusBadge from "@/components/requisition/status-badge";
import RequisitionDetailsModal from "@/components/requisition/requisition-details-modal";
import EditApprovedRequisitionModal from "@/components/requisition/edit-approved-requisition-modal";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Edit, Search, Filter, Check } from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/language-context";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { useRealTimeUpdates, useSmartInvalidation } from "@/hooks/useRealTimeUpdates";

export default function Requisitions() {
  const [, setLocation] = useLocation();
  const [selectedRequisition, setSelectedRequisition] = useState<FuelRequisition | null>(null);
  const [editingRequisition, setEditingRequisition] = useState<FuelRequisition | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const { t } = useLanguage();
  const { userRole } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Hooks para atualizações em tempo real
  const { forceRefresh } = useRealTimeUpdates();
  const { invalidateByOperation } = useSmartInvalidation();

  const { data: requisitions, isLoading } = useQuery<FuelRequisition[]>({
    queryKey: ["/api/fuel-requisitions"],
  });

  const { data: suppliers, isLoading: suppliersLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

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
    // Atualização otimística
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

  const filteredRequisitions = requisitions?.filter((req) => {
    const user = users.find((u: any) => u.id === req.requesterId);
    const matchesSearch = 
      (user?.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.client || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.fuelType || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || statusFilter === "all" || req.status === statusFilter;
    // Note: Department filtering disabled for now since we don't have department field in new schema
    const matchesDepartment = departmentFilter === "all";
    
    return matchesSearch && matchesStatus && matchesDepartment;
  }) || [];

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

  if (isLoading || suppliersLoading) {
    return <LoadingSpinner message={t('loading-data')} />;
  }

  return (
    <>
      <Header 
        title={t('requisitions')} 
        subtitle={t('manage-all-fuel-requisitions')} 
      />
      
      <main className="flex-1 p-6">
        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
              <Filter className="mr-2 h-5 w-5" />
              {t('filters')}
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t('search-requisitions')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t('filter-by-status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all-statuses')}</SelectItem>
                  <SelectItem value="pending">{t('pending')}</SelectItem>
                  <SelectItem value="approved">{t('approved')}</SelectItem>
                  <SelectItem value="rejected">{t('rejected')}</SelectItem>
                  <SelectItem value="fulfilled">{t('fulfilled')}</SelectItem>
                </SelectContent>
              </Select>
              

              
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
              >
                {t('clear-filters')}
              </Button>
            </div>
          </div>
        </div>

        {/* Requisitions Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                {t('requisitions')} ({filteredRequisitions.length})
              </h3>
              <Button onClick={() => setLocation("/new-requisition")}>
                {t('new-requisition')}
              </Button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
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
                {filteredRequisitions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      {searchTerm || statusFilter !== "all" || departmentFilter !== "all"
                        ? t('no-results-with-filters')
                        : t('no-results')}
                    </td>
                  </tr>
                ) : (
                  filteredRequisitions.map((requisition) => (
                    <tr key={requisition.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        #REQ{String(requisition.id).padStart(3, "0")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {getUserName(requisition.requesterId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {getSupplierName(requisition.supplierId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {getFuelTypeLabel(requisition.fuelType || "")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {requisition.tanqueCheio === "true" ? "Tanque Cheio" : `${requisition.quantity || "0"}L`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={requisition.status as any} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
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
                        {requisition.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedRequisition(requisition)}
                            title="Editar requisição"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {userRole !== 'employee' && requisition.status === "approved" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingRequisition(requisition)}
                              title="Editar valores reais"
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
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
          setLocation("/new-requisition");
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
