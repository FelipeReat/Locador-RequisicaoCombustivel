import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import Header from "@/components/layout/header";
import LoadingSpinner from "@/components/ui/loading-spinner";
import VehicleFilter from "@/components/filters/vehicle-filter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PDFGenerator } from "@/lib/pdf-generator";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Label
} from "recharts";
import { LabelList } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { 
  Download, 
  BarChart3, 
  CheckCircle, 
  Clock, 
  XCircle,
  Fuel, 
  AlertCircle
} from "lucide-react";
import type { FuelRequisition, Vehicle, User, Company } from "@shared/schema";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const COLORS = {
  approved: '#D4A017',
  pending: '#F0B43A', 
  rejected: '#EF4444',
  fulfilled: '#6B7280'
};

export default function Reports() {
  const { toast } = useToast();
  
  // Filtros
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<number[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [showAllVehicles, setShowAllVehicles] = useState(false);
  const [efficiencyShowKmPerLiter, setEfficiencyShowKmPerLiter] = useState(true);
  const [efficiencyMode, setEfficiencyMode] = useState<"consumo" | "custo">("consumo");
  const [efficiencyOrder, setEfficiencyOrder] = useState<"desc" | "asc">("desc");
  const [efficiencySearch, setEfficiencySearch] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [hideNewVehicles, setHideNewVehicles] = useState(false);

  // Buscar dados com tipos corretos
  const { data: requisitions = [], isLoading: requisitionsLoading } = useQuery<FuelRequisition[]>({
    queryKey: ["/api/fuel-requisitions"],
  });

  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });
  const { data: companies = [], isLoading: companiesLoading } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  // Filtrar requisições pelo mês selecionado e veículos selecionados
  const filteredRequisitions = useMemo(() => {
    return requisitions.filter(req => {
      const reqDate = new Date(req.createdAt);
      const matchesDate = reqDate.getMonth() + 1 === selectedMonth && reqDate.getFullYear() === selectedYear;
      const vehicle = vehicles.find(v => v.id === req.vehicleId);
      const matchesCompany = selectedCompanyId === null ? true : (vehicle?.companyId === selectedCompanyId);
      const created = vehicle?.createdAt ? new Date(vehicle.createdAt) : null;
      const isNewInMonth = !!created && (created.getMonth() + 1 === selectedMonth) && (created.getFullYear() === selectedYear);
      const allowByNew = hideNewVehicles ? !isNewInMonth : true;
      const matchesVehicleSelection = selectedVehicleIds.length === 0 ? true : selectedVehicleIds.includes(req.vehicleId);
      return matchesDate && matchesCompany && allowByNew && matchesVehicleSelection;
    });
  }, [requisitions, vehicles, selectedMonth, selectedYear, selectedCompanyId, hideNewVehicles, selectedVehicleIds]);

  // Estatísticas do mês
  const monthlyStats = useMemo(() => {
    const approved = filteredRequisitions.filter(req => req.status === 'approved');
    const pending = filteredRequisitions.filter(req => req.status === 'pending');
    const rejected = filteredRequisitions.filter(req => req.status === 'rejected');
    const fulfilled = filteredRequisitions.filter(req => req.status === 'fulfilled');
    
    const totalLiters = [...approved, ...fulfilled].reduce((sum, req) => sum + parseFloat(req.quantity || "0"), 0);
    const totalCost = [...approved, ...fulfilled].reduce((sum, req) => sum + (parseFloat(req.quantity || "0") * parseFloat(req.pricePerLiter || "0")), 0);
    
    return {
      total: filteredRequisitions.length,
      approved: approved.length,
      pending: pending.length,
      rejected: rejected.length,
      fulfilled: fulfilled.length,
      totalLiters: totalLiters,
      totalCost: totalCost
    };
  }, [filteredRequisitions]);

  // Dados para gráfico de barras por status
  const statusBarData = [
    { name: 'Aprovadas', value: monthlyStats.approved, color: COLORS.approved },
    { name: 'Pendentes', value: monthlyStats.pending, color: COLORS.pending },
    { name: 'Rejeitadas', value: monthlyStats.rejected, color: COLORS.rejected },
    { name: 'Realizadas', value: monthlyStats.fulfilled, color: COLORS.fulfilled }
  ];

  // Dados para gráfico de pizza
  const statusPieData = statusBarData.filter(item => item.value > 0);

  // Dados acumulados por veículo (Litros e R$)
  const vehicleBarData = useMemo(() => {
    const map = new Map<number, { vehicleId: number; vehicleLabel: string; fullLabel: string; liters: number; cost: number }>();

    filteredRequisitions.forEach((req) => {
      const vehicle = vehicles.find((v) => v.id === req.vehicleId);
      const label = vehicle?.plate || `Veículo ${req.vehicleId}`;
      const fullLabel = vehicle ? `${vehicle.brand || ''} ${vehicle.model || ''}`.trim() : label;
      const quantity = parseFloat(req.quantity || "0");
      const pricePerLiter = parseFloat(req.pricePerLiter || "0");
      const isValidPrice = !isNaN(pricePerLiter) && isFinite(pricePerLiter);

      if (!map.has(req.vehicleId)) {
        map.set(req.vehicleId, { vehicleId: req.vehicleId, vehicleLabel: label, fullLabel, liters: 0, cost: 0 });
      }

      const acc = map.get(req.vehicleId)!;
      acc.liters += isNaN(quantity) ? 0 : quantity;
      acc.cost += (isNaN(quantity) || !isValidPrice) ? 0 : quantity * pricePerLiter;
    });

    return Array.from(map.values())
      .sort((a, b) => b.cost - a.cost);
  }, [filteredRequisitions, vehicles]);

  const visibleVehicleBarData = useMemo(() => {
    return showAllVehicles ? vehicleBarData : vehicleBarData.slice(0, 12);
  }, [vehicleBarData, showAllVehicles]);

  // Média de litros por km por veículo
  const vehicleEfficiencyData = useMemo(() => {
    const accMap = new Map<number, { vehicleId: number; plate: string; name: string; totalKm: number; totalLiters: number; totalCost: number; litersPerKm: number; kmPerLiter: number; costPerKm: number; costPerLiter: number; newInMonth: boolean }>();
    const considered = filteredRequisitions;
    considered.forEach((req) => {
      const v = vehicles.find((vv) => vv.id === req.vehicleId);
      const plate = v?.plate || `Veículo ${req.vehicleId}`;
      const name = v ? `${v.brand || ''} ${v.model || ''}`.trim() : '';
      const created = v?.createdAt ? new Date(v.createdAt) : null;
      const isNewInMonth = !!created && (created.getMonth() + 1 === selectedMonth) && (created.getFullYear() === selectedYear);
      const kmAtual = parseFloat((req as any).kmAtual || "0");
      const kmAnterior = parseFloat((req as any).kmAnterior || "0");
      const kmRodado = (req as any).kmRodado ? parseFloat((req as any).kmRodado) : (isFinite(kmAtual) && isFinite(kmAnterior) ? Math.max(kmAtual - kmAnterior, 0) : 0);
      const liters = parseFloat(req.quantity || "0");
      const pricePerLiter = parseFloat(req.pricePerLiter || "0");
      const isValidPrice = !isNaN(pricePerLiter) && isFinite(pricePerLiter) && pricePerLiter > 0;
      const validKm = isFinite(kmRodado) && kmRodado > 0 ? kmRodado : 0;
      const validLiters = isFinite(liters) && liters > 0 ? liters : 0;
      const cost = (isNaN(liters) || !isValidPrice) ? 0 : liters * pricePerLiter;
      if (!accMap.has(req.vehicleId)) {
        accMap.set(req.vehicleId, { vehicleId: req.vehicleId, plate, name, totalKm: 0, totalLiters: 0, totalCost: 0, litersPerKm: 0, kmPerLiter: 0, costPerKm: 0, costPerLiter: 0, newInMonth: isNewInMonth });
      }
      const acc = accMap.get(req.vehicleId)!;
      acc.newInMonth = acc.newInMonth || isNewInMonth;
      acc.totalKm += acc.newInMonth ? 0 : validKm;
      acc.totalLiters += validLiters;
      acc.totalCost += isNaN(cost) ? 0 : cost;
    });
    accMap.forEach((val) => {
      val.litersPerKm = val.totalKm > 0 ? (val.totalLiters / val.totalKm) : 0;
      val.kmPerLiter = val.totalLiters > 0 ? (val.totalKm / val.totalLiters) : 0;
      val.costPerKm = val.totalKm > 0 ? (val.totalCost / val.totalKm) : 0;
      val.costPerLiter = val.totalLiters > 0 ? (val.totalCost / val.totalLiters) : 0;
    });
    return Array.from(accMap.values());
  }, [filteredRequisitions, vehicles, selectedMonth, selectedYear]);

  const vehicleEfficiencyRows = useMemo(() => {
    const term = efficiencySearch.trim().toLowerCase();
    const filtered = term
      ? vehicleEfficiencyData.filter(r => r.plate.toLowerCase().includes(term) || (r.name || '').toLowerCase().includes(term))
      : vehicleEfficiencyData;
    const sorted = [...filtered].sort((a, b) => {
      const av = efficiencyMode === "consumo"
        ? (efficiencyShowKmPerLiter ? a.kmPerLiter : a.litersPerKm)
        : (efficiencyShowKmPerLiter ? a.costPerKm : a.costPerLiter);
      const bv = efficiencyMode === "consumo"
        ? (efficiencyShowKmPerLiter ? b.kmPerLiter : b.litersPerKm)
        : (efficiencyShowKmPerLiter ? b.costPerKm : b.costPerLiter);
      return efficiencyOrder === "desc" ? (bv - av) : (av - bv);
    });
    return sorted;
  }, [vehicleEfficiencyData, efficiencySearch, efficiencyShowKmPerLiter, efficiencyOrder, efficiencyMode]);

  const efficiencyValueClass = (row: { kmPerLiter: number; litersPerKm: number; costPerKm: number; costPerLiter: number }) => {
    const v = efficiencyMode === "consumo"
      ? (efficiencyShowKmPerLiter ? row.kmPerLiter : row.litersPerKm)
      : (efficiencyShowKmPerLiter ? row.costPerKm : row.costPerLiter);
    if (!isFinite(v) || v <= 0) return "text-muted-foreground";
    if (efficiencyMode === "consumo") {
      if (efficiencyShowKmPerLiter) {
        if (v >= 8) return "text-green-600";
        if (v >= 5) return "text-yellow-600";
        return "text-red-600";
      } else {
        if (v <= 0.12) return "text-green-600";
        if (v <= 0.20) return "text-yellow-600";
        return "text-red-600";
      }
    }
    if (efficiencyShowKmPerLiter) {
      if (v <= 0.80) return "text-green-600";
      if (v <= 1.20) return "text-yellow-600";
      return "text-red-600";
    }
    if (v <= 6.00) return "text-green-600";
    if (v <= 7.20) return "text-yellow-600";
    return "text-red-600";
  };

  // Função para exportar relatório em PDF
  const handleExportReport = async () => {
    try {
      setIsExporting(true);

      // Verificar se há dados para exportar
      if (filteredRequisitions.length === 0) {
        toast({
          title: "Nenhum dado encontrado",
          description: "Não há requisições para o período selecionado.",
          variant: "destructive",
        });
        return;
      }

      const pdfGenerator = new PDFGenerator();
      
      const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleDateString('pt-BR', { 
        month: 'long', 
        year: 'numeric' 
      });
      
      pdfGenerator.generateMonthlyFuelReport(
        filteredRequisitions,
        monthlyStats,
        selectedMonth,
        selectedYear,
        vehicles,
        users
      );
      
      const filename = `relatorio-combustivel-${selectedMonth.toString().padStart(2, '0')}-${selectedYear}.pdf`;
      pdfGenerator.save(filename);
      
      toast({
        title: "Relatório exportado!",
        description: `Relatório de ${monthName} foi baixado com sucesso.`,
      });
    } catch (error) {
      console.error('Erro detalhado ao gerar PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error('Stack trace:', errorStack);
      toast({
        title: "Erro ao exportar",
        description: `Erro: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const isLoading = requisitionsLoading || vehiclesLoading || usersLoading || companiesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header title="Relatórios de Combustível" />
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleDateString('pt-BR', { 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header title="Relatórios de Combustível" />
      
      <div className="container mx-auto space-y-6 px-4 py-8">
        <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-zinc-700 via-stone-700 to-amber-600 text-white shadow-sm">
          <div className="p-6 space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <div className="text-sm text-white/80">Análise operacional</div>
                <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
                  <BarChart3 className="h-8 w-8 text-white" />
                  Relatórios de Combustível
                </h1>
                <p className="text-sm text-white/80">
                  Relatório mensal de requisições de {monthName}
                  {selectedVehicleIds.length > 0 && (
                    <span className="ml-2 font-medium text-amber-100">
                      • {selectedVehicleIds.length} veículo{selectedVehicleIds.length !== 1 ? 's' : ''} selecionado{selectedVehicleIds.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex gap-2">
                  <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                    <SelectTrigger className="w-36 border-white/20 bg-white/10 text-white">
                      <SelectValue placeholder="Mês" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {new Date(2024, i).toLocaleDateString('pt-BR', { month: 'long' })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                    <SelectTrigger className="w-24 border-white/20 bg-white/10 text-white">
                      <SelectValue placeholder="Ano" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 5 }, (_, i) => {
                        const year = new Date().getFullYear() - 2 + i;
                        return (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleExportReport}
                  disabled={isExporting || filteredRequisitions.length === 0}
                  className="bg-white text-amber-700 hover:bg-white/90"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isExporting ? 'Exportando...' : 'Exportar PDF'}
                </Button>
              </div>
            </div>

            <div className="grid gap-px overflow-hidden rounded-xl bg-white/10 sm:grid-cols-2 xl:grid-cols-4">
              <div className="bg-white/5 p-4">
                <div className="text-xs text-white/70">Requisições no período</div>
                <div className="mt-1 text-2xl font-semibold">{monthlyStats.total}</div>
              </div>
              <div className="bg-white/5 p-4">
                <div className="text-xs text-white/70">Aprovadas + realizadas</div>
                <div className="mt-1 text-2xl font-semibold">{monthlyStats.approved + monthlyStats.fulfilled}</div>
              </div>
              <div className="bg-white/5 p-4">
                <div className="text-xs text-white/70">Volume abastecido</div>
                <div className="mt-1 text-2xl font-semibold">{monthlyStats.totalLiters.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}L</div>
              </div>
              <div className="bg-white/5 p-4">
                <div className="text-xs text-white/70">Custo no período</div>
                <div className="mt-1 text-2xl font-semibold">R$ {monthlyStats.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            </div>
          </div>
        </div>

        <Card className="border-muted/60">
          <CardHeader className="border-b bg-gradient-to-r from-zinc-50 via-background to-amber-50 dark:from-zinc-900/40 dark:via-background dark:to-amber-950/20">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Filtros do Relatório</CardTitle>
                <CardDescription>Refine a análise por veículos e acompanhe rapidamente o escopo atual.</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{monthName}</Badge>
                <Badge variant="outline">{selectedVehicleIds.length > 0 ? `${selectedVehicleIds.length} veículo(s)` : "Todos os veículos"}</Badge>
                <Badge variant="outline">{selectedCompanyId === null ? "Todas as empresas" : companies.find(c => c.id === selectedCompanyId)?.name || "Empresa"}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <VehicleFilter
              vehicles={vehicles}
              selectedVehicleIds={selectedVehicleIds}
              onSelectionChange={setSelectedVehicleIds}
              multiSelect={true}
              title="Filtrar por Veículos"
              placeholder="Buscar por placa, modelo ou marca..."
              storageKey="reports-vehicle-filter"
            />
          </CardContent>
        </Card>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-muted/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Requisições</CardTitle>
              <Fuel className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{monthlyStats.total}</div>
              <p className="text-xs text-muted-foreground">
                no período selecionado
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-muted/60 bg-gradient-to-br from-amber-50/70 via-background to-zinc-50/70 dark:from-amber-950/10 dark:via-background dark:to-zinc-900/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{monthlyStats.approved}</div>
              <p className="text-xs text-muted-foreground">
                {monthlyStats.total > 0 ? Math.round((monthlyStats.approved / monthlyStats.total) * 100) : 0}% do total
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-muted/60 bg-gradient-to-br from-amber-50/70 via-background to-stone-50/70 dark:from-amber-950/10 dark:via-background dark:to-stone-900/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{monthlyStats.pending}</div>
              <p className="text-xs text-muted-foreground">
                aguardando aprovação
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-muted/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total em Litros</CardTitle>
              <Fuel className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
                {monthlyStats.totalLiters.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}L
              </div>
              <p className="text-xs text-muted-foreground">
                R$ {monthlyStats.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Gráfico de barras */}
          <Card className="border-muted/60">
            <CardHeader className="border-b bg-gradient-to-r from-zinc-50 via-background to-amber-50 dark:from-zinc-900/40 dark:via-background dark:to-amber-950/20">
              <CardTitle>Requisições por Status</CardTitle>
              <CardDescription>Comparativo mensal entre aprovadas, pendentes, rejeitadas e realizadas.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusBarData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8">
                    {statusBarData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de pizza */}
          <Card className="border-muted/60">
            <CardHeader className="border-b bg-gradient-to-r from-zinc-50 via-background to-amber-50 dark:from-zinc-900/40 dark:via-background dark:to-amber-950/20">
              <CardTitle>Distribuição por Status</CardTitle>
              <CardDescription>Leitura percentual do volume de requisições no período.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="border-muted/60">
          <CardHeader className="flex flex-col gap-3 border-b bg-gradient-to-r from-zinc-50 via-background to-amber-50 dark:from-zinc-900/40 dark:via-background dark:to-amber-950/20 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Consumo por Veículo: Litros vs R$</CardTitle>
              <CardDescription>Compare volume abastecido e valor acumulado por veículo no período.</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowAllVehicles(v => !v)}>
              {showAllVehicles ? 'Mostrar Top 12' : 'Ver todos'}
            </Button>
          </CardHeader>
          <CardContent role="img" aria-label="Gráfico de colunas comparando litros e valores em reais por veículo">
            <ChartContainer
              config={{
                liters: { label: "Litros", color: "#6B7280" },
                cost: { label: "Valor (R$)", color: "#D4A017" }
              }}
              className="dark:[&_.recharts-cartesian-axis-tick_text]:fill-white dark:[&_text]:fill-white"
            >
            <ResponsiveContainer width="100%" height={520}>
              <BarChart
                data={visibleVehicleBarData}
                margin={{ top: 32, right: 32, left: 24, bottom: 120 }}
                barCategoryGap={"30%"}
                barGap={10}
                maxBarSize={60}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="vehicleLabel"
                  tick={{ fontSize: 14 }}
                  angle={-20}
                  height={80}
                  tickMargin={16}
                  minTickGap={10}
                  interval={0}
                >
                  <Label value="Veículos" position="bottom" offset={12} />
                </XAxis>
                <YAxis
                  yAxisId="left"
                  allowDecimals={false}
                  tick={{ fontSize: 13 }}
                  tickFormatter={(v) => `${Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
                >
                  <Label value="Litros" angle={-90} position="insideLeft" />
                </YAxis>
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  allowDecimals={false}
                  tick={{ fontSize: 13 }}
                  tickFormatter={(v) => {
                    const n = Number(v);
                    if (n >= 1000) {
                      return `R$ ${(n / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`;
                    }
                    return `R$ ${n.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
                  }}
                >
                </YAxis>
                <Tooltip
                  formatter={(value: number, name: string, item: any) => {
                    const isLiters = name === 'Litros' || item?.dataKey === 'liters';
                    if (isLiters) {
                      return [
                        `${Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} L`,
                        'Litros'
                      ];
                    }
                    return [
                      `${Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 })}`,
                      'Valor (R$)'
                    ];
                  }}
                  labelFormatter={(label) => `Veículo: ${label}`}
                />
                <Legend verticalAlign="top" wrapperStyle={{ marginBottom: 12, fontSize: 14 }} />
                <Bar yAxisId="left" dataKey="liters" name="Litros" fill="#6B7280" radius={[8,8,0,0]}>
                  <LabelList content={(props: any) => {
                    const { x, y, width, value } = props;
                    const v = Number(value);
                    if (!isFinite(v)) return null;
                    const t = `${v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} L`;
                    return (
                      <text x={x + width / 2} y={y - 8} textAnchor="middle" fontSize={14}>{t}</text>
                    );
                  }} />
                </Bar>
                <Bar yAxisId="right" dataKey="cost" name="Valor (R$)" fill="#D4A017" radius={[8,8,0,0]}>
                  <LabelList content={(props: any) => {
                    const { x, y, width, height, value } = props;
                    const n = Number(value);
                    if (!isFinite(n)) return null;
                    const t = n >= 1000
                      ? `R$ ${(n / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`
                      : `R$ ${n.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
                    return (
                      <text x={x + width / 2} y={y + Math.min(20, Math.max(16, height * 0.3))} textAnchor="middle" fontSize={13}>{t}</text>
                    );
                  }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            </ChartContainer>
            <div className="mt-2">
              <div className="text-center text-sm text-muted-foreground mb-1">Veículos exibidos</div>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
                {visibleVehicleBarData.map((item) => {
                  const v = vehicles.find((veh) => (veh.plate || '') === item.vehicleLabel || veh.id === (item as any).vehicleId);
                  const plate = v?.plate || item.vehicleLabel;
                  const name = v ? `${v.brand || ''} ${v.model || ''}`.trim() : '';
                  const label = name ? `${name} — ${plate}` : plate;
                  return (
                    <span key={plate} className="text-xs text-foreground">{label}</span>
                  );
                })}
              </div>
            </div>
            <p className="sr-only">Cada veículo possui duas colunas agrupadas representando o volume abastecido em litros e o valor total em reais.</p>
          </CardContent>
        </Card>

        <Card className="border-muted/60">
            <CardHeader className="border-b bg-gradient-to-r from-zinc-50 via-background to-amber-50 dark:from-zinc-900/40 dark:via-background dark:to-amber-950/20">
              <CardTitle className="flex flex-col gap-4">
                <div>
                  <span>Média de Consumo por Veículo</span>
                  <CardDescription className="mt-1">Analise eficiência por consumo ou custo com filtros rápidos.</CardDescription>
                </div>
                <div className="grid gap-3 xl:grid-cols-[auto_auto_220px_auto_180px_220px] xl:items-center">
                  <ToggleGroup type="single" value={efficiencyMode} onValueChange={(v) => v && setEfficiencyMode(v as "consumo" | "custo")} className="gap-2">
                    <ToggleGroupItem value="consumo">Consumo</ToggleGroupItem>
                    <ToggleGroupItem value="custo">Custo</ToggleGroupItem>
                  </ToggleGroup>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {efficiencyMode === "consumo" ? "Exibir em KM/L" : "Exibir em R$/km"}
                    </span>
                    <Switch checked={efficiencyShowKmPerLiter} onCheckedChange={(v) => setEfficiencyShowKmPerLiter(Boolean(v))} />
                  </div>
                  <div className="w-48">
                    <Select value={selectedCompanyId === null ? 'all' : String(selectedCompanyId)} onValueChange={(val) => setSelectedCompanyId(val === 'all' ? null : parseInt(val))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as empresas</SelectItem>
                        {companies.map(c => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.fullName || c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Ocultar veículos novos no mês</span>
                    <Switch checked={hideNewVehicles} onCheckedChange={(v) => setHideNewVehicles(Boolean(v))} />
                  </div>
                  <Select value={efficiencyOrder} onValueChange={(v) => setEfficiencyOrder(v as "desc" | "asc")}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Ordenar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">
                        {efficiencyMode === "consumo"
                          ? (efficiencyShowKmPerLiter ? "Mais eficientes (KM/L)" : "Menor consumo (L/KM)")
                          : (efficiencyShowKmPerLiter ? "Menor custo (R$/km)" : "Menor custo (R$/L)")}
                      </SelectItem>
                      <SelectItem value="asc">
                        {efficiencyMode === "consumo"
                          ? (efficiencyShowKmPerLiter ? "Menos eficientes (KM/L)" : "Maior consumo (L/KM)")
                          : (efficiencyShowKmPerLiter ? "Maior custo (R$/km)" : "Maior custo (R$/L)")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="w-48">
                    <Input value={efficiencySearch} onChange={(e) => setEfficiencySearch(e.target.value)} placeholder="Filtrar por placa/marca" />
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2">
                <Badge variant="outline">{vehicleEfficiencyRows.length} veículo(s) analisado(s)</Badge>
                <Badge variant="outline">{selectedCompanyId === null ? "Todas as empresas" : companies.find(c => c.id === selectedCompanyId)?.name || "Empresa"}</Badge>
                {hideNewVehicles ? <Badge variant="secondary">Sem veículos novos no mês</Badge> : null}
              </div>
              {vehicleEfficiencyRows.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  Não há dados suficientes (KM &gt; 0 e litros &gt; 0) nas requisições aprovadas/realizadas para calcular L/KM.
                </div>
              ) : (
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-100 dark:bg-zinc-800">
                    <tr>
                      <th className="text-left p-3 text-gray-900 dark:text-gray-100">Veículo</th>
                      <th className="text-left p-3 text-gray-900 dark:text-gray-100">KM Rodado no Mês</th>
                      <th className="text-left p-3 text-gray-900 dark:text-gray-100">Litros Total</th>
                      <th className="text-left p-3 text-gray-900 dark:text-gray-100">
                        {efficiencyMode === "consumo"
                          ? (efficiencyShowKmPerLiter ? "Média (KM/L)" : "Média (L/KM)")
                          : (efficiencyShowKmPerLiter ? "Custo (R$/km)" : "Custo (R$/L)")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-zinc-200 dark:divide-zinc-800">
                    {vehicleEfficiencyRows.map((row, index) => (
                      <tr key={row.vehicleId} className={cn("border-b border-zinc-200 dark:border-zinc-800", index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-zinc-50/60 dark:bg-zinc-900/60")}>
                        <td className="p-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900 dark:text-gray-100">{row.plate}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{row.name}</span>
                            {row.newInMonth && (
                              <span className="text-[11px] text-amber-600 dark:text-amber-400">Novo no mês — KM suprimido</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-gray-900 dark:text-gray-100">
                          {Number.isFinite(row.totalKm) ? `${row.totalKm.toFixed(0)} km` : 'N/A'}
                        </td>
                        <td className="p-3 text-gray-900 dark:text-gray-100">
                          {Number.isFinite(row.totalLiters) ? `${row.totalLiters.toFixed(1)} L` : 'N/A'}
                        </td>
                        <td className="p-3 text-gray-900 dark:text-gray-100">
                          {row.totalKm > 0 && row.totalLiters > 0 ? (
                            <span className={cn("font-semibold", efficiencyValueClass(row))}>
                              {efficiencyMode === "consumo"
                                ? (efficiencyShowKmPerLiter
                                  ? row.kmPerLiter.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                  : row.litersPerKm.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }))
                                : (efficiencyShowKmPerLiter
                                  ? row.costPerKm.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                  : row.costPerLiter.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }))
                                }
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-amber-200 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/10">
                    <tr>
                      <td className="p-3 font-bold text-gray-900 dark:text-gray-100">TOTAL</td>
                      <td className="p-3 font-bold text-gray-900 dark:text-gray-100">
                        {vehicleEfficiencyRows.reduce((s, r) => s + (Number.isFinite(r.totalKm) ? r.totalKm : 0), 0).toFixed(0)} km
                      </td>
                      <td className="p-3 font-bold text-gray-900 dark:text-gray-100">
                        {vehicleEfficiencyRows.reduce((s, r) => s + (Number.isFinite(r.totalLiters) ? r.totalLiters : 0), 0).toFixed(1)} L
                      </td>
                      <td className="p-3 text-gray-900 dark:text-gray-100">
                        {(() => {
                          const totalKm = vehicleEfficiencyRows.reduce((s, r) => s + (Number.isFinite(r.totalKm) ? r.totalKm : 0), 0);
                          const totalLiters = vehicleEfficiencyRows.reduce((s, r) => s + (Number.isFinite(r.totalLiters) ? r.totalLiters : 0), 0);
                          const totalCost = vehicleEfficiencyRows.reduce((s, r) => s + (Number.isFinite(r.totalCost) ? r.totalCost : 0), 0);
                          if (!(totalKm > 0 && totalLiters > 0)) return '—';
                          if (efficiencyMode === "consumo") {
                            return efficiencyShowKmPerLiter
                              ? (totalKm / totalLiters).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                              : (totalLiters / totalKm).toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
                          }
                          return efficiencyShowKmPerLiter
                            ? (totalCost / totalKm).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : (totalCost / totalLiters).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        })()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabela de requisições */}
        <Card className="border-muted/60">
          <CardHeader className="border-b bg-gradient-to-r from-zinc-50 via-background to-amber-50 dark:from-zinc-900/40 dark:via-background dark:to-amber-950/20">
            <CardTitle>Detalhes das Requisições - {monthName}</CardTitle>
            <CardDescription>Lista completa das requisições consideradas neste relatório.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap gap-2">
              <Badge variant="outline">{filteredRequisitions.length} requisição(ões)</Badge>
              <Badge variant="outline">{selectedVehicleIds.length > 0 ? "Filtro por veículos ativo" : "Sem filtro por veículo"}</Badge>
            </div>
            {filteredRequisitions.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Nenhuma requisição encontrada
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {selectedVehicleIds.length > 0 
                    ? "Não há requisições de combustível para os veículos e período selecionados."
                    : "Não há requisições de combustível para o período selecionado."
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-100 dark:bg-zinc-800">
                    <tr>
                      <th className="text-left p-3 text-gray-900 dark:text-gray-100">Data</th>
                      <th className="text-left p-3 text-gray-900 dark:text-gray-100">Veículo</th>
                      <th className="text-left p-3 text-gray-900 dark:text-gray-100">Cliente</th>
                      <th className="text-left p-3 text-gray-900 dark:text-gray-100">Combustível</th>
                      <th className="text-left p-3 text-gray-900 dark:text-gray-100">KM Rodado</th>
                      <th className="text-left p-3 text-gray-900 dark:text-gray-100">Quantidade</th>
                      <th className="text-left p-3 text-gray-900 dark:text-gray-100">Preço/L</th>
                      <th className="text-left p-3 text-gray-900 dark:text-gray-100">Total</th>
                      <th className="text-left p-3 text-gray-900 dark:text-gray-100">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-zinc-200 dark:divide-zinc-800">
                    {filteredRequisitions.map((req, index) => {
                      const vehicle = vehicles.find((v) => v.id === req.vehicleId);
                      const quantity = parseFloat(req.quantity || "0");
                      const pricePerLiter = parseFloat(req.pricePerLiter || "0");
                      const isValidPrice = !isNaN(pricePerLiter) && isFinite(pricePerLiter);
                      const total = quantity * (isValidPrice ? pricePerLiter : 0);
                      const kmAtual = parseFloat((req as any).kmAtual || "0");
                      const kmAnterior = parseFloat((req as any).kmAnterior || "0");
                      const kmRodadoValue = (req as any).kmRodado ? parseFloat((req as any).kmRodado) : (isFinite(kmAtual) && isFinite(kmAnterior) ? Math.max(kmAtual - kmAnterior, 0) : 0);

                      return (
                        <tr key={req.id} className={cn("border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/70", index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-zinc-50/60 dark:bg-zinc-900/60")}>
                          <td className="p-3 text-gray-900 dark:text-gray-100">
                            {new Date(req.createdAt).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900 dark:text-gray-100">{vehicle?.plate || 'N/A'}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {vehicle?.model} {vehicle?.brand}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-gray-900 dark:text-gray-100">{req.client}</td>
                          <td className="p-3 capitalize text-gray-900 dark:text-gray-100">{req.fuelType}</td>
                          <td className="p-3 text-gray-900 dark:text-gray-100">{Number.isFinite(kmRodadoValue) ? `${kmRodadoValue.toFixed(0)} km` : 'N/A'}</td>
                          <td className="p-3 text-gray-900 dark:text-gray-100">{quantity.toFixed(1)}L</td>
                          <td className="p-3 text-gray-900 dark:text-gray-100">R$ {isValidPrice ? pricePerLiter.toFixed(2) : '0.00'}</td>
                          <td className="p-3 text-gray-900 dark:text-gray-100">R$ {total.toFixed(2)}</td>
                          <td className="p-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              req.status === 'approved' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                              req.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              req.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                              req.status === 'fulfilled' ? 'bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300' :
                              'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300'
                            }`}>
                              {req.status === 'approved' ? 'Aprovada' :
                               req.status === 'pending' ? 'Pendente' :
                               req.status === 'rejected' ? 'Rejeitada' :
                               req.status === 'fulfilled' ? 'Realizada' :
                               req.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="border-t-2 border-amber-200 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/10">
                    <tr>
                      <td className="p-3 font-bold text-gray-900 dark:text-gray-100" colSpan={5}>TOTAL</td>
                      <td className="p-3 font-bold text-gray-900 dark:text-gray-100">
                        {filteredRequisitions.reduce((sum, req) => {
                          const quantity = parseFloat(req.quantity || "0");
                          return sum + quantity;
                        }, 0).toFixed(1)}L
                      </td>
                      <td className="p-3"></td>
                      <td className="p-3 font-bold text-gray-900 dark:text-gray-100">
                        R$ {filteredRequisitions.reduce((sum, req) => {
                          const quantity = parseFloat(req.quantity || "0");
                          const pricePerLiter = parseFloat(req.pricePerLiter || "0");
                          const isValidPrice = !isNaN(pricePerLiter) && isFinite(pricePerLiter);
                          const total = quantity * (isValidPrice ? pricePerLiter : 0);
                          return sum + total;
                        }, 0).toFixed(2)}
                      </td>
                      <td className="p-3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
