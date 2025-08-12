import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Header from "@/components/layout/header";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PDFGenerator } from "@/lib/pdf-generator";
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
  Cell,
  LineChart,
  Line
} from "recharts";
import { Download, FileText, TrendingUp, Calendar, BarChart3 } from "lucide-react";
import type { FuelRequisition } from "@shared/schema";

import { useLanguage } from "@/contexts/language-context";

export default function Reports() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showMonthlyAnalysis, setShowMonthlyAnalysis] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/fuel-requisitions/stats/overview"],
  });



  const { data: fuelTypeStats, isLoading: fuelTypeLoading } = useQuery<{fuelType: string; count: number; totalLiters: number}[]>({
    queryKey: ["/api/fuel-requisitions/stats/fuel-type"],
  });

  const { data: fuelEfficiencyStats, isLoading: efficiencyLoading } = useQuery<{vehiclePlate: string; vehicleModel: string; totalKmRodado: number; totalLiters: number; kmPerLiter: number}[]>({
    queryKey: ["/api/fuel-requisitions/stats/fuel-efficiency"],
  });

  const { data: allRequisitions, isLoading: requisitionsLoading } = useQuery<FuelRequisition[]>({
    queryKey: ["/api/fuel-requisitions"],
  });

  const handleExportReport = () => {
    if (!allRequisitions || allRequisitions.length === 0) {
      toast({
        title: t("error"),
        description: t("no-data-to-export"),
        variant: "destructive",
      });
      return;
    }

    try {
      const pdfGenerator = new PDFGenerator('landscape');
      pdfGenerator.generateRequisitionsReport(allRequisitions, {
        title: 'Relatório Completo de Requisições',
        subtitle: `Período: ${new Date().toLocaleDateString('pt-BR')}`,
        company: 'Sistema de Controle de Abastecimento'
      });
      pdfGenerator.save(`relatorio-completo-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: t("report-generated-success"),
        description: t("complete-report-exported"),
      });
    } catch (error) {
      toast({
        title: t("error"),
        description: t("report-generation-error"),
        variant: "destructive",
      });
    }
  };

  const handleMonthlyAnalysis = () => {
    if (!allRequisitions || allRequisitions.length === 0) {
      toast({
        title: t("error"),
        description: t("no-data-for-analysis"),
        variant: "destructive",
      });
      return;
    }

    const monthlyData = filterRequisitionsByMonth(allRequisitions, selectedMonth, selectedYear);
    
    if (monthlyData.length === 0) {
      toast({
        title: t("error"),
        description: t("no-requisitions-for-period"),
        variant: "destructive",
      });
      return;
    }

    try {
      const pdfGenerator = new PDFGenerator('landscape');
      pdfGenerator.generateRequisitionsReport(monthlyData, {
        title: 'Análise Mensal de Requisições',
        subtitle: `Período: ${getMonthName(selectedMonth)} de ${selectedYear}`,
        company: 'Sistema de Controle de Abastecimento'
      });
      pdfGenerator.save(`analise-mensal-${selectedMonth + 1}-${selectedYear}.pdf`);
      
      toast({
        title: t("report-generated-success"),
        description: t("monthly-analysis-generated"),
      });
    } catch (error) {
      toast({
        title: t("error"),
        description: t("report-generation-error"),
        variant: "destructive",
      });
    }
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



  const pieData = fuelTypeStats?.map((stat: any, index: number) => ({
    name: getFuelTypeLabel(stat.fuelType),
    value: stat.totalLiters,
    color: ["#1976D2", "#FF9800", "#4CAF50", "#F44336"][index % 4],
  })) || [];

  const filterRequisitionsByMonth = (requisitions: FuelRequisition[], month: number, year: number) => {
    return requisitions.filter(req => {
      const reqDate = new Date(req.createdAt);
      return reqDate.getMonth() === month && reqDate.getFullYear() === year;
    });
  };

  const getMonthName = (month: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month];
  };

  const generateMonthlyTrend = () => {
    if (!allRequisitions) return [];
    
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: getMonthName(i),
      requisitions: 0,
      liters: 0
    }));

    allRequisitions.forEach(req => {
      const reqDate = new Date(req.createdAt);
      if (reqDate.getFullYear() === selectedYear) {
        const month = reqDate.getMonth();
        monthlyData[month].requisitions += 1;
        monthlyData[month].liters += parseInt(req.quantity || "0") || 0;
      }
    });

    return monthlyData;
  };

  const monthlyTrendData = generateMonthlyTrend();

  if (statsLoading || fuelTypeLoading || requisitionsLoading || efficiencyLoading) {
    return <LoadingSpinner message={t('loading-reports')} />;
  }

  return (
    <>
      <Header 
        title={t('reports')} 
        subtitle={t('fuel-consumption-analysis')} 
      />
      
      <main className="flex-1 mobile-content py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {t('total-requisitions')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {(stats as any)?.totalRequests || 0}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {(stats as any)?.approvedRequests || 0} aprovadas | {(stats as any)?.rejectedRequests || 0} rejeitadas
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Taxa de Realização
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {(() => {
                  const total = (stats as any)?.totalRequests || 0;
                  const fulfilled = (stats as any)?.fulfilledRequests || 0;
                  
                  if (total === 0) return '0%';
                  
                  const rate = Math.round((fulfilled / total) * 100);
                  return `${rate}%`;
                })()}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {(stats as any)?.fulfilledRequests || 0} de {(stats as any)?.totalRequests || 0} requisições
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {t('total-consumed')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {((stats as any)?.totalLiters || 0).toLocaleString("pt-BR")}L
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {t('pending-label')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {(stats as any)?.pendingRequests || 0}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Aguardando aprovação
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              {t('export-reports')}
            </h3>
          </div>
          <div className="p-6">
            <div className="flex flex-col space-y-4">
              <Button onClick={handleExportReport} className="flex items-center w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                {t('export-complete-report')}
              </Button>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {getMonthName(i)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                    <SelectTrigger className="w-full sm:w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 3 }, (_, i) => {
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
                
                <Button onClick={handleMonthlyAnalysis} className="flex items-center w-full sm:w-auto">
                  <Calendar className="mr-2 h-4 w-4" />
                  {t('monthly-analysis')}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Trend Chart */}
        <Card className="bg-white dark:bg-gray-800 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-800 dark:text-white flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              {t('monthly-trend')} ({selectedYear})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="requisitions" 
                  stroke="#1976D2" 
                  strokeWidth={2}
                  name="Requisições"
                />
                <Line 
                  type="monotone" 
                  dataKey="liters" 
                  stroke="#FF9800" 
                  strokeWidth={2}
                  name="Litros"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fuel Type Chart */}
        <Card className="bg-white dark:bg-gray-800 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-800 dark:text-white">{t('distribution-by-fuel-type')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fuel Type Details Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('fuel-type-details')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">{t('fuel-label')}</th>
                    <th className="text-right py-2">{t('requisitions-count')}</th>
                    <th className="text-right py-2">{t('liters-count')}</th>
                  </tr>
                </thead>
                <tbody>
                  {fuelTypeStats?.map((stat: any) => (
                    <tr key={stat.fuelType} className="border-b">
                      <td className="py-2">{getFuelTypeLabel(stat.fuelType)}</td>
                      <td className="text-right py-2">{stat.count}</td>
                      <td className="text-right py-2">
                        {stat.totalLiters.toLocaleString("pt-BR")}L
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Fuel Efficiency Report */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Relatório de Eficiência de Combustível (Km/Litro)
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Média de quilômetros por litro de cada veículo com base nas requisições aprovadas
            </p>
          </CardHeader>
          <CardContent>
            {fuelEfficiencyStats && fuelEfficiencyStats.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2">Placa</th>
                      <th className="text-left py-3 px-2">Modelo</th>
                      <th className="text-right py-3 px-2">Km Total</th>
                      <th className="text-right py-3 px-2">Litros Total</th>
                      <th className="text-right py-3 px-2">Km/Litro</th>
                      <th className="text-right py-3 px-2">Eficiência</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fuelEfficiencyStats.map((stat, index) => (
                      <tr key={stat.vehiclePlate} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="py-3 px-2 font-medium">{stat.vehiclePlate}</td>
                        <td className="py-3 px-2">{stat.vehicleModel}</td>
                        <td className="text-right py-3 px-2">
                          {stat.totalKmRodado.toLocaleString("pt-BR")} km
                        </td>
                        <td className="text-right py-3 px-2">
                          {stat.totalLiters.toLocaleString("pt-BR")} L
                        </td>
                        <td className="text-right py-3 px-2 font-semibold">
                          {stat.kmPerLiter.toFixed(2)} km/L
                        </td>
                        <td className="text-right py-3 px-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            stat.kmPerLiter >= 15 ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' :
                            stat.kmPerLiter >= 10 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' :
                            'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                          }`}>
                            {stat.kmPerLiter >= 15 ? 'Excelente' :
                             stat.kmPerLiter >= 10 ? 'Boa' : 'Baixa'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  Não há dados suficientes para calcular a eficiência de combustível.
                  <br />
                  É necessário ter requisições aprovadas com dados de quilometragem e quantidade de combustível.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fuel Efficiency Chart */}
        {fuelEfficiencyStats && fuelEfficiencyStats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Gráfico de Eficiência por Veículo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={fuelEfficiencyStats} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="vehiclePlate" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                  />
                  <YAxis 
                    label={{ value: 'Km/Litro', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [`${value.toFixed(2)} km/L`, 'Eficiência']}
                    labelFormatter={(label: string) => `Veículo: ${label}`}
                  />
                  <Bar 
                    dataKey="kmPerLiter" 
                    fill="#1976D2"
                    name="Km/Litro"
                  >
                    {fuelEfficiencyStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={
                        entry.kmPerLiter >= 15 ? '#4CAF50' :
                        entry.kmPerLiter >= 10 ? '#FF9800' : '#F44336'
                      } />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
}
