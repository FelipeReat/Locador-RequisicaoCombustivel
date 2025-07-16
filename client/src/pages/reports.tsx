import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Download, FileText, TrendingUp } from "lucide-react";

export default function Reports() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/fuel-requisitions/stats/overview"],
  });

  const { data: departmentStats, isLoading: departmentLoading } = useQuery({
    queryKey: ["/api/fuel-requisitions/stats/department"],
  });

  const { data: fuelTypeStats, isLoading: fuelTypeLoading } = useQuery({
    queryKey: ["/api/fuel-requisitions/stats/fuel-type"],
  });

  const handleExportReport = () => {
    // In a real application, this would generate and download a PDF or Excel file
    const reportData = {
      generatedAt: new Date().toISOString(),
      stats,
      departmentStats,
      fuelTypeStats,
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fuel-report-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

  if (statsLoading || departmentLoading || fuelTypeLoading) {
    return <LoadingSpinner message="Carregando relatórios..." />;
  }

  return (
    <>
      <Header 
        title="Relatórios" 
        subtitle="Análise e estatísticas de consumo de combustível" 
      />
      
      <main className="flex-1 p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total de Requisições
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats?.totalRequests || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Taxa de Aprovação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats?.totalRequests 
                  ? Math.round((stats.approvedRequests / stats.totalRequests) * 100)
                  : 0}%
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Consumido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats?.totalLiters?.toLocaleString("pt-BR") || 0}L
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats?.pendingRequests || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export Actions */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Exportar Relatórios
            </h3>
          </div>
          <div className="p-6">
            <div className="flex space-x-4">
              <Button onClick={handleExportReport} className="flex items-center">
                <Download className="mr-2 h-4 w-4" />
                Exportar Dados (JSON)
              </Button>
              <Button variant="outline" className="flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                Relatório PDF
              </Button>
              <Button variant="outline" className="flex items-center">
                <TrendingUp className="mr-2 h-4 w-4" />
                Análise Mensal
              </Button>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Department Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Consumo por Departamento</CardTitle>
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
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Tipo de Combustível</CardTitle>
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
              <CardTitle>Detalhes por Departamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Departamento</th>
                      <th className="text-right py-2">Requisições</th>
                      <th className="text-right py-2">Litros</th>
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
              <CardTitle>Detalhes por Tipo de Combustível</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Combustível</th>
                      <th className="text-right py-2">Requisições</th>
                      <th className="text-right py-2">Litros</th>
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
