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
import { Eye, Edit, Search, Filter, Check, Download, Plus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/language-context";
import { usePermissions } from "@/hooks/usePermissions";
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
  const [priorityFilter, setPriorityFilter] = useState<string>("all"); // Added priority filter state
  const [supplierFilter, setSupplierFilter] = useState<string>("all"); // Added supplier filter state
  const { t } = useLanguage();
  const { userRole, hasPermission } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const filteredRequisitions = requisitions?.filter((req) => {
    const user = users.find((u: any) => u.id === req.requesterId);
    const matchesSearch = 
      (user?.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.client || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.fuelType || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !statusFilter || statusFilter === "all" || req.status === statusFilter;
    const matchesPriority = !priorityFilter || priorityFilter === "all" || req.priority === priorityFilter;
    const matchesSupplier = !supplierFilter || supplierFilter === "all" || req.supplierId.toString() === supplierFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesSupplier;
  }) || [];

  // Sort by created date descending (most recent first)
  const sortedRequisitions = [...filteredRequisitions].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

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
      gasolina: t('gasoline'),
      etanol: t('ethanol'),
      diesel: t('diesel'),
      diesel_s10: t('diesel-s10'),
    };
    return labels[fuelType as keyof typeof labels] || fuelType;
  };

  const handleView = (requisition: FuelRequisition) => {
    setSelectedRequisition(requisition);
  };

  const generatePDF = (requisition: FuelRequisition) => {
    // Placeholder for PDF generation logic
    toast({
      title: "Download PDF",
      description: `Gerando PDF para requisição ${requisition.id}`,
    });
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

      <main className="flex-1 mobile-content pt-12 sm:pt-4 lg:pt-6">
        {/* Filters */}
      <Card className="border-l-4 border-l-blue-500/30">
        <CardHeader className="mobile-card pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="mobile-text-lg text-gray-800 dark:text-gray-100">
                🔍 {t('filters')}
              </CardTitle>
              <CardDescription className="mobile-text-sm text-gray-600 dark:text-gray-300">
                {t('filter-requisitions')} • {filteredRequisitions.length} resultados
              </CardDescription>
            </div>
            {(statusFilter !== 'all' || priorityFilter !== 'all' || supplierFilter !== 'all' || searchTerm) && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setStatusFilter('all');
                  setPriorityFilter('all');
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="status-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('status')}
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter" className="bg-white dark:bg-gray-800">
                  <SelectValue placeholder={t('all-status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">📋 {t('all-status')}</SelectItem>
                  <SelectItem value="pending">⏳ {t('pending')}</SelectItem>
                  <SelectItem value="approved">✅ {t('approved')}</SelectItem>
                  <SelectItem value="rejected">❌ {t('rejected')}</SelectItem>
                  <SelectItem value="fulfilled">🏁 {t('fulfilled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('priority')}
              </Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger id="priority-filter" className="bg-white dark:bg-gray-800">
                  <SelectValue placeholder={t('all-priorities')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">📊 {t('all-priorities')}</SelectItem>
                  <SelectItem value="urgent">🔴 {t('urgent')}</SelectItem>
                  <SelectItem value="high">🟠 {t('high')}</SelectItem>
                  <SelectItem value="medium">🟡 {t('medium')}</SelectItem>
                  <SelectItem value="low">🟢 {t('low')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('supplier')}
              </Label>
              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger id="supplier-filter" className="bg-white dark:bg-gray-800">
                  <SelectValue placeholder={t('all-suppliers')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">🏪 {t('all-suppliers')}</SelectItem>
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
                {t('search')}
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder={t('search-requisitions')}
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
                📋 {t('requisitions')}
              </CardTitle>
              <CardDescription className="mobile-text-sm text-gray-600 dark:text-gray-300">
                {t('manage-fuel-requisitions')} • Organizadas por data (mais recentes primeiro)
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
                    {t('priority')}
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                    {t('status')}
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                    {t('requester')}
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                    {t('supplier')}
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                    {t('vehicle')}
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                    {t('fuel')}
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                    {t('quantity')}
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                    {t('created-date')} <span className="text-xs text-muted-foreground">(↓ Recente)</span>
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300 text-center">
                    {t('actions')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRequisitions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-12">
                      <div className="flex flex-col items-center space-y-2">
                        <div className="text-4xl">📋</div>
                        <p className="text-lg font-medium">{t('no-requisitions-found')}</p>
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
                        <StatusBadge type="priority" value={requisition.priority} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge type="status" value={requisition.status} />
                      </TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">
                        {getUserName(requisition.requesterId)}
                      </TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300 font-medium">
                        {getSupplierName(requisition.supplierId)}
                      </TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300 font-mono text-sm">
                        {vehicles?.find(vehicle => vehicle.id === requisition.vehicleId)?.plate || 
                         <span className="text-muted-foreground italic">{t('unknown')}</span>}
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
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {hasPermission('create_fuel_requisition') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => generatePDF(requisition)}
                              className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600"
                              title="Download PDF"
                            >
                              <Download className="h-4 w-4" />
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
        onEdit={(req) => {
          setSelectedRequisition(null);
          setLocation("/new-requisition"); // Assuming this navigates to a new requisition form
        }}
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