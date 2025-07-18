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

  const { data: departmentStats, isLoading: departmentLoading } = useQuery({
    queryKey: ["/api/fuel-requisitions/stats/department"],
  });

  const { data: fuelTypeStats, isLoading: fuelTypeLoading } = useQuery({
    queryKey: ["/api/fuel-requisitions/stats/fuel-type"],
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
        company: 'FuelControl System'
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
        company: 'FuelControl System'
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

  const getDepartmentLabel = (department: string) => {
    const labels = {
      logistica: t('logistics'),
      manutencao: t('maintenance'),
      transporte: t('transport'),
      operacoes: t('operations'),
      administracao: t('administration'),
    };
    return labels[department as keyof typeof labels] || department;
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

  const chartData = departmentStats?.map((stat) => ({
    name: getDepartmentLabel(stat.department),
    requisitions: stat.count,
    liters: stat.totalLiters,
  })) || [];

  const pieData = fuelTypeStats?.map((stat, index) => ({
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
        monthlyData[month].liters += parseInt(req.quantity) || 0;
      }
    });

    return monthlyData;
  };

  const monthlyTrendData = generateMonthlyTrend();

  if (statsLoading || departmentLoading || fuelTypeLoading || requisitionsLoading) {
    return <LoadingSpinner message={t('loading-reports')} />;
  }

  return (
    <>
      <Header 
        title={t('reports')} 
        subtitle={t('fuel-consumption-analysis')} 
      />
      
      <main className="flex-1 p-6">
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
                {stats?.totalRequests || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {t('approval-rate')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats?.totalRequests 
                  ? Math.round((stats.approvedRequests / stats.totalRequests) * 100)
                  : 0}%
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
                {stats?.totalLiters?.toLocaleString("pt-BR") || 0}L
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
                {stats?.pendingRequests || 0}
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
            <div className="flex flex-wrap gap-4">
              <Button onClick={handleExportReport} className="flex items-center">
                <Download className="mr-2 h-4 w-4" />
                {t('export-complete-report')}
              </Button>
              
              <div className="flex items-center space-x-2">
                <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                  <SelectTrigger className="w-32">
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
                  <SelectTrigger className="w-24">
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
                
                <Button onClick={handleMonthlyAnalysis} className="flex items-center">
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

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Department Chart */}
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-800 dark:text-white">{t('consumption-by-department')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="requisitions" fill="#1976D2" name="Requisições" />
                  <Bar dataKey="liters" fill="#FF9800" name="Litros" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Fuel Type Chart */}
          <Card className="bg-white dark:bg-gray-800">
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
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Department Table */}
          <Card>
            <CardHeader>
              <CardTitle>{t('department-details')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">{t('department')}</th>
                      <th className="text-right py-2">{t('requisitions-count')}</th>
                      <th className="text-right py-2">{t('liters-count')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departmentStats?.map((stat) => (
                      <tr key={stat.department} className="border-b">
                        <td className="py-2">{getDepartmentLabel(stat.department)}</td>
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

          {/* Fuel Type Table */}
          <Card>
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
                    {fuelTypeStats?.map((stat) => (
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
        </div>
      </main>
    </>
  );
}
