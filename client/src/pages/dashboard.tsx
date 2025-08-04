import { useQuery } from "@tanstack/react-query";
import { type FuelRequisition, type Supplier } from "@shared/schema";
import Header from "@/components/layout/header";
import StatusBadge from "@/components/requisition/status-badge";
import RequisitionDetailsModal from "@/components/requisition/requisition-details-modal";
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
  Edit
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/language-context";
import { usePermissions } from "@/hooks/usePermissions";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [selectedRequisition, setSelectedRequisition] = useState<FuelRequisition | null>(null);
  const { t } = useLanguage();
  const { userRole, canApprove } = usePermissions();

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

  if (statsLoading || requisitionsLoading || suppliersLoading) {
    return <LoadingSpinner message={t('loading-dashboard')} />;
  }

  return (
    <>
      <Header 
        title={t('dashboard')} 
        subtitle={t('fuel-requisitions-overview')} 
      />

      <main className="flex-1 p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-3">
                <ClipboardList className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">{t('total-requests')}</p>
                <p className="text-2xl font-semibold text-gray-800 dark:text-white">
                  {stats?.totalRequests || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="bg-yellow-100 dark:bg-yellow-900 rounded-full p-3">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">{t('pending-requests')}</p>
                <p className="text-2xl font-semibold text-gray-800 dark:text-white">
                  {stats?.pendingRequests || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="bg-green-100 dark:bg-green-900 rounded-full p-3">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">{t('approved-requests')}</p>
                <p className="text-2xl font-semibold text-gray-800 dark:text-white">
                  {stats?.approvedRequests || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="bg-red-100 dark:bg-red-900 rounded-full p-3">
                <Fuel className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">{t('consumed-liters')}</p>
                <p className="text-2xl font-semibold text-gray-800 dark:text-white">
                  {stats?.totalLiters?.toLocaleString("pt-BR") || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t('quick-actions')}</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t('recent-requisitions')}</h3>
              <Button
                variant="link"
                onClick={() => setLocation("/requisitions")}
                className="text-primary hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {t('view-all')}
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
                        {userRole !== 'employee' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLocation(`/requisitions/${requisition.id}/edit`)}
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
          setLocation(`/requisitions/${req.id}/edit`);
        }}
      />
    </>
  );
}