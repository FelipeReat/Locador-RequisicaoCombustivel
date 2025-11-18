import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import Header from "@/components/layout/header";
import LoadingSpinner from "@/components/ui/loading-spinner";
import VehicleFilter from "@/components/filters/vehicle-filter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { 
  Download, 
  BarChart3, 
  CheckCircle, 
  Clock, 
  XCircle,
  Fuel, 
  AlertCircle
} from "lucide-react";
import type { FuelRequisition, Vehicle, User } from "@shared/schema";

const COLORS = {
  approved: '#10B981',
  pending: '#F59E0B', 
  rejected: '#EF4444',
  fulfilled: '#3B82F6'
};

export default function Reports() {
  const { toast } = useToast();
  
  // Filtros
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<number[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [showAllVehicles, setShowAllVehicles] = useState(false);

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

  // Filtrar requisições pelo mês selecionado e veículos selecionados
  const filteredRequisitions = useMemo(() => {
    return requisitions.filter(req => {
      const reqDate = new Date(req.createdAt);
      const matchesDate = reqDate.getMonth() + 1 === selectedMonth && reqDate.getFullYear() === selectedYear;
      
      // Se nenhum veículo selecionado, mostrar todos
      if (selectedVehicleIds.length === 0) {
        return matchesDate;
      }
      
      // Filtrar por veículos selecionados
      const matchesVehicle = selectedVehicleIds.includes(req.vehicleId);
      return matchesDate && matchesVehicle;
    });
  }, [requisitions, selectedMonth, selectedYear, selectedVehicleIds]);

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

  // Função para exportar relatório em PDF
  const handleExportReport = async () => {
    console.log('=== INÍCIO DA EXPORTAÇÃO ===');
    alert('Função handleExportReport chamada!');
    
    try {
      setIsExporting(true);
      console.log('Estado isExporting definido como true');

      // Verificar se há dados para exportar
      if (filteredRequisitions.length === 0) {
        console.log('Nenhuma requisição encontrada para o período selecionado');
        toast({
          title: "Nenhum dado encontrado",
          description: "Não há requisições para o período selecionado.",
          variant: "destructive",
        });
        return;
      }

      console.log('Dados para exportar:', {
        requisitions: filteredRequisitions.length,
        monthlyStats,
        vehicles: vehicles.length,
        users: users.length
      });

      // Usar import estático
      console.log('Criando instância PDFGenerator...');
      const pdfGenerator = new PDFGenerator();
      console.log('Instância PDFGenerator criada com sucesso');
      
      const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleDateString('pt-BR', { 
        month: 'long', 
        year: 'numeric' 
      });
      
      // Gerar o PDF com os dados filtrados
      console.log('Chamando generateMonthlyFuelReport...');
      console.log('Parâmetros:', {
        requisitions: filteredRequisitions.length,
        monthlyStats,
        selectedMonth,
        selectedYear,
        vehicles: vehicles.length,
        users: users.length
      });
      
      pdfGenerator.generateMonthlyFuelReport(
        filteredRequisitions,
        monthlyStats,
        selectedMonth,
        selectedYear,
        vehicles,
        users
      );
      console.log('PDF gerado com sucesso');
      
      // Salvar o arquivo PDF
      const filename = `relatorio-combustivel-${selectedMonth.toString().padStart(2, '0')}-${selectedYear}.pdf`;
      console.log('Salvando PDF com nome:', filename);
      pdfGenerator.save(filename);
      console.log('PDF salvo com sucesso');
      
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
      console.log('Exportação finalizada');
    }
  };

  const isLoading = requisitionsLoading || vehiclesLoading || usersLoading;

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
      
      <div className="container mx-auto px-4 py-8">
        {/* Cabeçalho */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <BarChart3 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                Relatórios de Combustível
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Relatório mensal de requisições - {monthName}
                {selectedVehicleIds.length > 0 && (
                  <span className="ml-2 text-blue-600 dark:text-blue-400 font-medium">
                    • {selectedVehicleIds.length} veículo{selectedVehicleIds.length !== 1 ? 's' : ''} selecionado{selectedVehicleIds.length !== 1 ? 's' : ''}
                  </span>
                )}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Filtros de período */}
              <div className="flex gap-2">
                <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                  <SelectTrigger className="w-32">
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
                  <SelectTrigger className="w-24">
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
              
              {/* Botões de ação */}
              <div className="flex gap-2">
                <Button 
                  onClick={handleExportReport}
                  disabled={isExporting || filteredRequisitions.length === 0}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {isExporting ? 'Exportando...' : 'Exportar PDF'}
                </Button>
              </div>
            </div>
          </div>
          
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Relatório de {monthName} • {filteredRequisitions.length} requisições
          </p>
        </div>

        {/* Filtro de Veículos */}
        <div className="mb-6">
          <VehicleFilter
            vehicles={vehicles}
            selectedVehicleIds={selectedVehicleIds}
            onSelectionChange={setSelectedVehicleIds}
            multiSelect={true}
            title="Filtrar por Veículos"
            placeholder="Buscar por placa, modelo ou marca..."
            storageKey="reports-vehicle-filter"
          />
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Requisições</CardTitle>
              <Fuel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{monthlyStats.total}</div>
              <p className="text-xs text-muted-foreground">
                no período selecionado
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{monthlyStats.approved}</div>
              <p className="text-xs text-muted-foreground">
                {monthlyStats.total > 0 ? Math.round((monthlyStats.approved / monthlyStats.total) * 100) : 0}% do total
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{monthlyStats.pending}</div>
              <p className="text-xs text-muted-foreground">
                aguardando aprovação
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total em Litros</CardTitle>
              <Fuel className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {monthlyStats.totalLiters.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}L
              </div>
              <p className="text-xs text-muted-foreground">
                R$ {monthlyStats.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfico de barras */}
          <Card>
            <CardHeader>
              <CardTitle>Requisições por Status</CardTitle>
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
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Status</CardTitle>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Consumo por Veículo: Litros vs R$</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowAllVehicles(v => !v)}>
              {showAllVehicles ? 'Mostrar Top 12' : 'Ver todos'}
            </Button>
          </CardHeader>
          <CardContent role="img" aria-label="Gráfico de colunas comparando litros e valores em reais por veículo">
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
                <Bar yAxisId="left" dataKey="liters" name="Litros" fill="#3B82F6" radius={[8,8,0,0]}>
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
                <Bar yAxisId="right" dataKey="cost" name="Valor (R$)" fill="#10B981" radius={[8,8,0,0]}>
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

        {/* Tabela de requisições */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes das Requisições - {monthName}</CardTitle>
          </CardHeader>
          <CardContent>
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
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="text-left p-2 text-gray-900 dark:text-gray-100">Data</th>
                      <th className="text-left p-2 text-gray-900 dark:text-gray-100">Veículo</th>
                      <th className="text-left p-2 text-gray-900 dark:text-gray-100">Cliente</th>
                      <th className="text-left p-2 text-gray-900 dark:text-gray-100">Combustível</th>
                      <th className="text-left p-2 text-gray-900 dark:text-gray-100">Quantidade</th>
                      <th className="text-left p-2 text-gray-900 dark:text-gray-100">Preço/L</th>
                      <th className="text-left p-2 text-gray-900 dark:text-gray-100">Total</th>
                      <th className="text-left p-2 text-gray-900 dark:text-gray-100">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredRequisitions.map((req) => {
                      const vehicle = vehicles.find((v) => v.id === req.vehicleId);
                      const quantity = parseFloat(req.quantity || "0");
                      const pricePerLiter = parseFloat(req.pricePerLiter || "0");
                      const isValidPrice = !isNaN(pricePerLiter) && isFinite(pricePerLiter);
                      const total = quantity * (isValidPrice ? pricePerLiter : 0);
                      
                      return (
                        <tr key={req.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="p-2 text-gray-900 dark:text-gray-100">
                            {new Date(req.createdAt).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="p-2">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900 dark:text-gray-100">{vehicle?.plate || 'N/A'}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {vehicle?.model} {vehicle?.brand}
                              </span>
                            </div>
                          </td>
                          <td className="p-2 text-gray-900 dark:text-gray-100">{req.client}</td>
                          <td className="p-2 capitalize text-gray-900 dark:text-gray-100">{req.fuelType}</td>
                          <td className="p-2 text-gray-900 dark:text-gray-100">{quantity.toFixed(1)}L</td>
                          <td className="p-2 text-gray-900 dark:text-gray-100">R$ {isValidPrice ? pricePerLiter.toFixed(2) : '0.00'}</td>
                          <td className="p-2 text-gray-900 dark:text-gray-100">R$ {total.toFixed(2)}</td>
                          <td className="p-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              req.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                              req.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              req.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                              req.status === 'fulfilled' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
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
                  <tfoot className="bg-gray-100 dark:bg-gray-700 border-t-2 border-gray-300 dark:border-gray-600">
                    <tr>
                      <td className="p-2 font-bold text-gray-900 dark:text-gray-100" colSpan={4}>TOTAL</td>
                      <td className="p-2 font-bold text-gray-900 dark:text-gray-100">
                        {filteredRequisitions.reduce((sum, req) => {
                          const quantity = parseFloat(req.quantity || "0");
                          return sum + quantity;
                        }, 0).toFixed(1)}L
                      </td>
                      <td className="p-2"></td>
                      <td className="p-2 font-bold text-gray-900 dark:text-gray-100">
                        R$ {filteredRequisitions.reduce((sum, req) => {
                          const quantity = parseFloat(req.quantity || "0");
                          const pricePerLiter = parseFloat(req.pricePerLiter || "0");
                          const isValidPrice = !isNaN(pricePerLiter) && isFinite(pricePerLiter);
                          const total = quantity * (isValidPrice ? pricePerLiter : 0);
                          return sum + total;
                        }, 0).toFixed(2)}
                      </td>
                      <td className="p-2"></td>
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
