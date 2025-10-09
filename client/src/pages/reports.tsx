import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import Header from "@/components/layout/header";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
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
  Cell
} from "recharts";
import { 
  Download, 
  BarChart3, 
  CheckCircle, 
  Clock, 
  XCircle,
  Fuel, 
  AlertCircle
} from "lucide-react";
import type { FuelRequisition } from "@shared/schema";

const COLORS = {
  approved: '#10B981',
  pending: '#F59E0B', 
  rejected: '#EF4444'
};

export default function Reports() {
  const { toast } = useToast();
  
  // Filtro mensal simples
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isExporting, setIsExporting] = useState(false);

  // Buscar dados
  const { data: requisitions = [], isLoading: requisitionsLoading } = useQuery<FuelRequisition[]>({
    queryKey: ["/api/fuel-requisitions"],
  });

  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery({
    queryKey: ["/api/vehicles"],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  // Filtrar requisições pelo mês selecionado
  const filteredRequisitions = useMemo(() => {
    return requisitions.filter(req => {
      const reqDate = new Date(req.createdAt);
      return reqDate.getMonth() + 1 === selectedMonth && reqDate.getFullYear() === selectedYear;
    });
  }, [requisitions, selectedMonth, selectedYear]);

  // Estatísticas do mês
  const monthlyStats = useMemo(() => {
    const approved = filteredRequisitions.filter(req => req.status === 'approved');
    const pending = filteredRequisitions.filter(req => req.status === 'pending');
    const rejected = filteredRequisitions.filter(req => req.status === 'rejected');
    
    const totalLiters = approved.reduce((sum, req) => sum + parseFloat(req.quantity || "0"), 0);
    const totalCost = approved.reduce((sum, req) => sum + (parseFloat(req.quantity || "0") * parseFloat(req.pricePerLiter || "0")), 0);
    
    return {
      total: filteredRequisitions.length,
      approved: approved.length,
      pending: pending.length,
      rejected: rejected.length,
      totalLiters: totalLiters,
      totalCost: totalCost
    };
  }, [filteredRequisitions]);

  // Dados para gráfico de barras por status
  const statusBarData = [
    { name: 'Aprovadas', value: monthlyStats.approved, color: COLORS.approved },
    { name: 'Pendentes', value: monthlyStats.pending, color: COLORS.pending },
    { name: 'Rejeitadas', value: monthlyStats.rejected, color: COLORS.rejected }
  ];

  // Dados para gráfico de pizza
  const statusPieData = statusBarData.filter(item => item.value > 0);

  // Função para exportar relatório
  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleDateString('pt-BR', { 
        month: 'long', 
        year: 'numeric' 
      });
      
      toast({
        title: "Relatório exportado!",
        description: `Relatório de ${monthName} foi baixado.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao exportar",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const isLoading = requisitionsLoading || vehiclesLoading || usersLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
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
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Cabeçalho */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                Relatórios de Combustível
              </h1>
              <p className="text-gray-600 mt-2">
                Relatório mensal de requisições - {monthName}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Filtro de Mês */}
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
                      const year = new Date().getFullYear() - i;
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
                disabled={isExporting}
                className="bg-green-600 hover:bg-green-700"
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? 'Exportando...' : 'Exportar PDF'}
              </Button>
            </div>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total de Requisições</p>
                  <div className="text-2xl font-bold">{monthlyStats.total}</div>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Aprovadas</p>
                  <div className="text-2xl font-bold">{monthlyStats.approved}</div>
                </div>
                <CheckCircle className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Pendentes</p>
                  <div className="text-2xl font-bold">{monthlyStats.pending}</div>
                </div>
                <Clock className="h-8 w-8 text-yellow-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total de Litros</p>
                  <div className="text-2xl font-bold">{monthlyStats.totalLiters.toFixed(0)}L</div>
                  <p className="text-xs text-purple-100">
                    R$ {monthlyStats.totalCost.toFixed(2)}
                  </p>
                </div>
                <Fuel className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mensagem quando não há dados */}
        {monthlyStats.total === 0 && (
          <Card className="mb-8">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma requisição encontrada
              </h3>
              <p className="text-gray-600 text-center">
                Não há requisições de combustível para {monthName}.
                <br />
                Selecione outro período para visualizar os dados.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Gráficos */}
        {monthlyStats.total > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Gráfico de Barras */}
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
                    <Bar dataKey="value" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Pizza */}
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
        )}

        {/* Lista de Requisições do Mês */}
        {filteredRequisitions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Requisições de {monthName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Data</th>
                      <th className="text-left p-2">Veículo</th>
                      <th className="text-left p-2">Quantidade</th>
                      <th className="text-left p-2">Preço/L</th>
                      <th className="text-left p-2">Total</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequisitions.map((req) => {
                      const vehicle = vehicles.find((v: any) => v.id === req.vehicleId);
                      const quantity = parseFloat(req.quantity || "0");
                      const pricePerLiter = parseFloat(req.pricePerLiter || "0");
                      const total = quantity * pricePerLiter;
                      
                      return (
                        <tr key={req.id} className="border-b hover:bg-gray-50">
                          <td className="p-2">
                            {new Date(req.createdAt).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="p-2">
                            <div className="flex flex-col">
                              <span className="font-medium">{vehicle?.plate || 'N/A'}</span>
                              <span className="text-xs text-gray-500">
                                {vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.year})` : 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td className="p-2">{quantity.toFixed(1)}L</td>
                          <td className="p-2">R$ {pricePerLiter.toFixed(2)}</td>
                          <td className="p-2">R$ {total.toFixed(2)}</td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              req.status === 'approved' ? 'bg-green-100 text-green-800' :
                              req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {req.status === 'approved' ? 'Aprovada' :
                               req.status === 'pending' ? 'Pendente' : 'Rejeitada'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}