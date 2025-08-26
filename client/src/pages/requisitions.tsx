import { useState, useMemo } from "react";
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
import { Eye, Edit, Search, Filter, Check, Download, Plus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Trash2, Undo2 } from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/language-context";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useRealTimeUpdates, useSmartInvalidation } from "@/hooks/useRealTimeUpdates";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils"; // Assuming cn utility for classNames

export default function Requisitions() {
  const [, setLocation] = useLocation();
  const [selectedRequisition, setSelectedRequisition] = useState<FuelRequisition | null>(null);
  const [editingRequisition, setEditingRequisition] = useState<FuelRequisition | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [supplierFilter, setSupplierFilter] = useState<string>("all"); // Added supplier filter state
  const { t } = useLanguage();
  const { userRole, hasPermission, canAccessRequisition, canActOnRequisition } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Number of items per page

  // Hooks for real-time updates
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

  // Placeholder for vehicles data if needed for the table
  const { data: vehicles = [] } = useQuery<any[]>({
    queryKey: ["/api/vehicles"],
  });

  // Mutation to delete requisition
  const deleteRequisition = useMutation({
    mutationFn: async (requisitionId: number) => {
      const response = await fetch(`/api/fuel-requisitions/${requisitionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao excluir requisição");
      }

      return await response.json();
    },
    // Optimistic update
    onMutate: async (requisitionId: number) => {
      await queryClient.cancelQueries({ queryKey: ["/api/fuel-requisitions"] });
      const previousRequisitions = queryClient.getQueryData(["/api/fuel-requisitions"]);

      queryClient.setQueryData(["/api/fuel-requisitions"], (old: FuelRequisition[] | undefined) => {
        if (!old) return old;
        return old.filter(req => req.id !== requisitionId);
      });

      return { previousRequisitions };
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
    onError: (error: any, variables, context) => {
      if (context?.previousRequisitions) {
        queryClient.setQueryData(["/api/fuel-requisitions"], context.previousRequisitions);
      }

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
      const response = await fetch(`/api/fuel-requisitions/${requisitionId}/undo`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao desfazer requisição");
      }

      return await response.json();
    },
    // Optimistic update
    onMutate: async (requisitionId: number) => {
      await queryClient.cancelQueries({ queryKey: ["/api/fuel-requisitions"] });
      const previousRequisitions = queryClient.getQueryData(["/api/fuel-requisitions"]);
      const previousStats = queryClient.getQueryData(["/api/fuel-requisitions/stats/overview"]);

      queryClient.setQueryData(["/api/fuel-requisitions"], (old: FuelRequisition[] | undefined) => {
        if (!old) return old;
        return old.map(req => 
          req.id === requisitionId 
            ? { ...req, status: 'approved' as any, fulfilledAt: null }
            : req
        );
      });

      queryClient.setQueryData(["/api/fuel-requisitions/stats/overview"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          approvedRequests: (old.approvedRequests || 0) + 1,
          fulfilledRequests: Math.max(0, (old.fulfilledRequests || 0) - 1)
        };
      });

      return { previousRequisitions, previousStats };
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
    onError: (error: any, variables, context) => {
      if (context?.previousRequisitions) {
        queryClient.setQueryData(["/api/fuel-requisitions"], context.previousRequisitions);
      }
      if (context?.previousStats) {
        queryClient.setQueryData(["/api/fuel-requisitions/stats/overview"], context.previousStats);
      }

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
    // Optimistic update
    onMutate: async (requisitionId: number) => {
      await queryClient.cancelQueries({ queryKey: ["/api/fuel-requisitions"] });
      const previousRequisitions = queryClient.getQueryData(["/api/fuel-requisitions"]);
      const previousStats = queryClient.getQueryData(["/api/fuel-requisitions/stats/overview"]);

      queryClient.setQueryData(["/api/fuel-requisitions"], (old: FuelRequisition[] | undefined) => {
        if (!old) return old;
        return old.map(req => 
          req.id === requisitionId 
            ? { ...req, status: 'fulfilled' as any, fulfilledAt: new Date().toISOString() }
            : req
        );
      });

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
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-requisitions/stats/overview"] });
    }
  });

  const filteredRequisitions = useMemo(() => {
    if (!requisitions) return [];

    return requisitions.filter(req => {
      // Todos podem ver todas as requisições
      // A restrição de ações é feita nos botões individuais
      const reqUser = users.find((u: any) => u.id === req.requesterId);
      const matchesSearch = 
        (reqUser?.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (req.client || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (req.fuelType || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = !statusFilter || statusFilter === "all" || req.status === statusFilter;
      const matchesSupplier = !supplierFilter || supplierFilter === "all" || req.supplierId.toString() === supplierFilter;

      return matchesSearch && matchesStatus && matchesSupplier;
    });
  }, [requisitions, searchTerm, statusFilter, supplierFilter, users]);


  // Sort by created date descending (most recent first)
  const sortedRequisitions = useMemo(() => 
    [...filteredRequisitions].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ), 
  [filteredRequisitions]);

  // Pagination logic
  const totalPages = Math.ceil(sortedRequisitions.length / itemsPerPage);
  const paginatedRequisitions = sortedRequisitions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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

  if (isLoading || suppliersLoading) {
    return <LoadingSpinner message="Carregando dados..." />;
  }

  return (
    <>
      <Header 
        title="Requisições" 
        subtitle="Gerenciar todas as requisições de combustível" 
      />

      <main className="flex-1 mobile-content pt-12 sm:pt-4 lg:pt-6">
        {/* Filters */}
      <Card className="border-l-4 border-l-blue-500/30">
        <CardHeader className="mobile-card pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="mobile-text-lg text-gray-800 dark:text-gray-100">
                🔍 Filtros
              </CardTitle>
              <CardDescription className="mobile-text-sm text-gray-600 dark:text-gray-300">
                Filtrar requisições • {filteredRequisitions.length} resultados
              </CardDescription>
            </div>
            {(statusFilter !== 'all' || supplierFilter !== 'all' || searchTerm) && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setStatusFilter('all');
                  setSupplierFilter('all');
                  setSearchTerm('');
                }}
                className="text-xs"
              >
                Limpar filtros
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="mobile-card pt-0">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="status-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter" className="bg-white dark:bg-gray-800">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">📋 Todos os status</SelectItem>
                  <SelectItem value="pending">⏳ Pendente</SelectItem>
                  <SelectItem value="approved">✅ Aprovado</SelectItem>
                  <SelectItem value="rejected">❌ Rejeitado</SelectItem>
                  <SelectItem value="fulfilled">🏁 Realizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Fornecedor
              </Label>
              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger id="supplier-filter" className="bg-white dark:bg-gray-800">
                  <SelectValue placeholder="Todos os fornecedores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">🏪 Todos os fornecedores</SelectItem>
                  {suppliers?.sort((a, b) => a.fantasia.localeCompare(b.fantasia, 'pt-BR')).map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.fantasia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Pesquisar
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Pesquisar requisições..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white dark:bg-gray-800"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

        {/* Requisitions Table */}
      <Card className="border-l-4 border-l-primary/30 mt-6">
        <CardHeader className="mobile-card pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="mobile-text-lg text-gray-800 dark:text-gray-100">
                📋 Requisições
              </CardTitle>
              <CardDescription className="mobile-text-sm text-gray-600 dark:text-gray-300">
                Gerenciar requisições de combustível • Organizadas por data (mais recentes primeiro)
              </CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredRequisitions.length} requisições encontradas
            </div>
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
                {paginatedRequisitions.length === 0 ? (
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
                  paginatedRequisitions.map((requisition, index) => (
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
                                className="h-8 w-8 p-0 bg-green-500 hover:bg-green-600 text-white"
                                title="Confirmar realização"
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
                                className="h-8 w-8 p-0 bg-green-500 hover:bg-green-600 text-white"
                                title="Confirmar realização"
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

          {sortedRequisitions.length > itemsPerPage && (
            <div className="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 rounded-b-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Mostrando <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> a{' '}
                <span className="font-medium">{Math.min(currentPage * itemsPerPage, sortedRequisitions.length)}</span> de{' '}
                <span className="font-medium">{sortedRequisitions.length}</span> requisições
              </div>
              <div className="flex items-center space-x-6 lg:space-x-8">
                <div className="flex w-[100px] items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-300">
                  Página {currentPage} de {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    title="Primeira página"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    title="Página anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    title="Próxima página"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    title="Última página"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
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