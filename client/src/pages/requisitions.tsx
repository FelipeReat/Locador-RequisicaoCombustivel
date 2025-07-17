import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type FuelRequisition } from "@shared/schema";
import Header from "@/components/layout/header";
import StatusBadge from "@/components/requisition/status-badge";
import RequisitionDetailsModal from "@/components/requisition/requisition-details-modal";
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
import { Eye, Edit, Search, Filter } from "lucide-react";
import { useLocation } from "wouter";

export default function Requisitions() {
  const [, setLocation] = useLocation();
  const [selectedRequisition, setSelectedRequisition] = useState<FuelRequisition | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");

  const { data: requisitions, isLoading } = useQuery<FuelRequisition[]>({
    queryKey: ["/api/fuel-requisitions"],
  });

  const filteredRequisitions = requisitions?.filter((req) => {
    const matchesSearch = 
      req.requester.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.fuelType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || statusFilter === "all" || req.status === statusFilter;
    const matchesDepartment = !departmentFilter || departmentFilter === "all" || req.department === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  }) || [];

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

  if (isLoading) {
    return <LoadingSpinner message="Carregando requisições..." />;
  }

  return (
    <>
      <Header 
        title="Requisições" 
        subtitle="Gerenciar todas as requisições de combustível" 
      />
      
      <main className="flex-1 p-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <Filter className="mr-2 h-5 w-5" />
              Filtros
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar requisições..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="approved">Aprovada</SelectItem>
                  <SelectItem value="rejected">Rejeitada</SelectItem>
                  <SelectItem value="fulfilled">Cumprida</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os departamentos</SelectItem>
                  <SelectItem value="logistica">Logística</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="transporte">Transporte</SelectItem>
                  <SelectItem value="operacoes">Operações</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setDepartmentFilter("all");
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </div>

        {/* Requisitions Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                Requisições ({filteredRequisitions.length})
              </h3>
              <Button onClick={() => setLocation("/new-requisition")}>
                Nova Requisição
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
                {filteredRequisitions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      {searchTerm || statusFilter || departmentFilter
                        ? "Nenhuma requisição encontrada com os filtros aplicados"
                        : "Nenhuma requisição encontrada"}
                    </td>
                  </tr>
                ) : (
                  filteredRequisitions.map((requisition) => (
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
                        {requisition.status === "pending" && (
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
