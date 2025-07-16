import { useQuery } from "@tanstack/react-query";
import { type FuelRequisition } from "@shared/schema";
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

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [selectedRequisition, setSelectedRequisition] = useState<FuelRequisition | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/fuel-requisitions/stats/overview"],
  });

  const { data: requisitions, isLoading: requisitionsLoading } = useQuery<FuelRequisition[]>({
    queryKey: ["/api/fuel-requisitions"],
  });

  const recentRequisitions = requisitions?.slice(0, 5) || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
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

  if (statsLoading || requisitionsLoading) {
    return <LoadingSpinner message="Carregando dashboard..." />;
  }

  return (
    <>
      <Header 
        title="Dashboard" 
        subtitle="Visão geral das requisições de combustível" 
      />
      
      <main className="flex-1 p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="stats-card">
            <div className="flex items-center">
              <div className="stats-icon primary">
                <ClipboardList />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Requisições</p>
                <p className="text-2xl font-semibold text-gray-800">
                  {stats?.totalRequests || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="stats-card">
            <div className="flex items-center">
              <div className="stats-icon warning">
                <Clock />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Pendentes</p>
                <p className="text-2xl font-semibold text-gray-800">
                  {stats?.pendingRequests || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="stats-card">
            <div className="flex items-center">
              <div className="stats-icon success">
                <CheckCircle />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Aprovadas</p>
                <p className="text-2xl font-semibold text-gray-800">
                  {stats?.approvedRequests || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="stats-card">
            <div className="flex items-center">
              <div className="stats-icon error">
                <Fuel />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Litros Consumidos</p>
                <p className="text-2xl font-semibold text-gray-800">
                  {stats?.totalLiters?.toLocaleString("pt-BR") || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Ações Rápidas</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => setLocation("/new-requisition")}
                className="flex items-center justify-center p-4 bg-blue-50 text-blue-600 hover:bg-blue-100 border-none"
                variant="outline"
              >
                <Plus className="mr-3 h-5 w-5" />
                Nova Requisição
              </Button>
              
              <Button
                onClick={() => setLocation("/requisitions?filter=pending")}
                className="flex items-center justify-center p-4 bg-yellow-50 text-yellow-600 hover:bg-yellow-100 border-none"
                variant="outline"
              >
                <Clock className="mr-3 h-5 w-5" />
                Aprovar Pendentes
              </Button>
              
              <Button
                onClick={() => setLocation("/reports")}
                className="flex items-center justify-center p-4 bg-green-50 text-green-600 hover:bg-green-100 border-none"
                variant="outline"
              >
                <BarChart3 className="mr-3 h-5 w-5" />
                Gerar Relatório
              </Button>
            </div>
          </div>
        </div>

        {/* Recent Requisitions */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Requisições Recentes</h3>
              <Button
                variant="link"
                onClick={() => setLocation("/requisitions")}
                className="text-primary hover:text-blue-700"
              >
                Ver todas
              </Button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Solicitante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Departamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Combustível
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentRequisitions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      Nenhuma requisição encontrada
                    </td>
                  </tr>
                ) : (
                  recentRequisitions.map((requisition) => (
                    <tr key={requisition.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #REQ{String(requisition.id).padStart(3, "0")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {requisition.requester}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getDepartmentLabel(requisition.department)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getFuelTypeLabel(requisition.fuelType)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {requisition.quantity}L
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={requisition.status as any} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocation(`/requisitions/${requisition.id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
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
