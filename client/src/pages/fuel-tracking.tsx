import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Alert, AlertDescription } from '../components/ui/alert';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/form';
import { Plus, Search, Filter, Download, Clock, AlertTriangle, BarChart3, Calendar, Car, Fuel, Calculator } from 'lucide-react';
import { insertFuelRecordSchema, type InsertFuelRecord, type FuelRecord, type Vehicle, type User, type Company } from '@shared/schema';
import { useToast } from '../hooks/use-toast';

interface VehicleCheckIn {
  vehicleId: number;
  kmInicial: string;
  kmFinal: string;
  kmPercorrido: string;
  quantidadeLitros: string;
  precoPorLitro: string;
  totalReais: string;
  ultimoAbastecimento: string;
  kmAbastecimento: string;
  kmRodado: string;
  eficiencia: string;
  operatorId: number;
  data: string;
}

interface MonthlyReport {
  vehicleId: number;
  vehiclePlate: string;
  vehicleModel: string;
  totalKm: number;
  totalLiters: number;
  averageKmPerLiter: number;
  totalCost: number;
}

export default function FuelTracking() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isMonthlyReportModalOpen, setIsMonthlyReportModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [expandedVehicles, setExpandedVehicles] = useState<Record<number, boolean>>({});
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current user
  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/auth/me'],
    retry: false,
  });

  // Fetch fuel records
  const { data: fuelRecords = [], isLoading } = useQuery<FuelRecord[]>({
    queryKey: ['/api/fuel-records'],
  });

  // Fetch vehicles (ordenados alfabeticamente)
  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ['/api/vehicles'],
    select: (data) => [...data].sort((a, b) => a.plate.localeCompare(b.plate)),
  });

  // Fetch users
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Fetch companies
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ['/api/companies'],
    select: (data) => [...data].sort((a, b) => a.name.localeCompare(b.name)),
  });

  // Fetch monthly report
  const { data: monthlyReport = [], refetch: refetchMonthlyReport } = useQuery<MonthlyReport[]>({
    queryKey: ['/api/fuel-records/reports/monthly', selectedYear, selectedMonth],
    queryFn: () => 
      fetch(`/api/fuel-records/reports/monthly?year=${selectedYear}&month=${selectedMonth}`)
        .then(res => res.json()),
    enabled: false,
  });

  // Create fuel record mutation
  const createFuelRecordMutation = useMutation({
    mutationFn: async (data: InsertFuelRecord) => {
      const response = await fetch('/api/fuel-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create fuel record');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fuel-records'] });
      toast({
        title: "Sucesso",
        description: "Registro de abastecimento criado com sucesso!",
      });
      setIsCheckInModalOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar registro de abastecimento",
        variant: "destructive",
      });
    },
  });

  // Form setup
  const form = useForm<InsertFuelRecord>({
    resolver: zodResolver(insertFuelRecordSchema),
    defaultValues: {
      vehicleId: 0,
      currentMileage: '',
      previousMileage: '',
      distanceTraveled: '',
      fuelType: 'gasolina' as const,
      litersRefueled: '',
      pricePerLiter: '',
      operatorId: currentUser?.id || 14,
      fuelStation: '',
      notes: '',
      recordDate: new Date().toISOString().split('T')[0],
    },
  });

  // Watch form values for automatic calculations
  const watchedValues = form.watch(['currentMileage', 'previousMileage', 'litersRefueled', 'pricePerLiter']);

  useEffect(() => {
    const [currentMileage, previousMileage, litersRefueled, pricePerLiter] = watchedValues;

    // Calculate distance traveled
    if (currentMileage && previousMileage) {
      const current = parseFloat(currentMileage);
      const previous = parseFloat(previousMileage);
      if (current > previous) {
        const distance = current - previous;
        form.setValue('distanceTraveled', distance.toString());
      }
    }
  }, [watchedValues, form]);

  // Only show vehicles linked to any company, optionally filter by selected company, then apply search filter
  const linkedVehicles = vehicles.filter(v => v.companyId !== null);
  const companyFilteredVehicles = selectedCompanyId === null 
    ? linkedVehicles 
    : linkedVehicles.filter(v => v.companyId === selectedCompanyId);
  const filteredVehicles = companyFilteredVehicles.filter(vehicle => 
    vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get latest record for a vehicle
  const getLatestRecord = (vehicleId: number) => {
    return fuelRecords
      .filter(record => record.vehicleId === vehicleId)
      .sort((a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime())[0];
  };

  // Get vehicle records for today
  const getTodayRecords = (vehicleId: number) => {
    const today = new Date().toISOString().split('T')[0];
    return fuelRecords.filter(record => 
      record.vehicleId === vehicleId && 
      record.recordDate === today
    );
  };

  // Get records for a vehicle in selected month/year
  const getMonthRecordsForVehicle = (vehicleId: number) => {
    return fuelRecords
      .filter(r => r.vehicleId === vehicleId)
      .filter(r => {
        const d = new Date(r.recordDate);
        return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
      })
      .sort((a, b) => new Date(a.recordDate).getTime() - new Date(b.recordDate).getTime());
  };

  // Compute monthly stats per vehicle
  const getMonthStatsForVehicle = (vehicleId: number) => {
    const records = getMonthRecordsForVehicle(vehicleId);
    const totalKm = records.reduce((s, r) => s + parseFloat(r.distanceTraveled || '0'), 0);
    const totalLiters = records.reduce((s, r) => s + parseFloat(r.litersRefueled || '0'), 0);
    const totalCost = records.reduce((s, r) => s + parseFloat(r.totalCost || '0'), 0);
    const averageKmPerLiter = totalLiters > 0 ? totalKm / totalLiters : 0;
    const costPerKm = totalKm > 0 ? totalCost / totalKm : 0;
    return { records, totalKm, totalLiters, totalCost, averageKmPerLiter, costPerKm };
  };

  const handleVehicleCheckIn = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    const latestRecord = getLatestRecord(vehicle.id);

    form.reset({
      vehicleId: vehicle.id,
      currentMileage: '',
      previousMileage: latestRecord?.currentMileage || '0',
      distanceTraveled: '',
      fuelType: 'gasolina' as const,
      litersRefueled: '',
      pricePerLiter: '',
      operatorId: currentUser?.id || 14,
      fuelStation: '',
      notes: '',
      recordDate: new Date().toISOString().split('T')[0],
    });

    setIsCheckInModalOpen(true);
  };

  const onSubmit = (data: InsertFuelRecord) => {
    createFuelRecordMutation.mutate(data);
  };

  const handleExport = () => {
    if (fuelRecords.length === 0) {
      toast({
        title: "Aviso",
        description: "Não há dados para exportar.",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      'Data', 'Placa', 'Combustível', 'KM Inicial', 'KM Final', 'KM Percorrido',
      'Litros', 'Preço/L (R$)', 'Total (R$)', 'Posto', 'Operador', 'Eficiência (km/L)'
    ];

    const csvContent = [
      headers.join(','),
      ...fuelRecords.map(record => {
        const vehicle = vehicles.find(v => v.id === record.vehicleId);
        const user = users.find(u => u.id === record.operatorId);
        const efficiency = parseFloat(record.distanceTraveled) / parseFloat(record.litersRefueled);

        return [
          new Date(record.recordDate).toLocaleDateString('pt-BR'),
          vehicle?.plate || '',
          record.fuelType,
          record.previousMileage,
          record.currentMileage,
          record.distanceTraveled,
          parseFloat(record.litersRefueled).toFixed(1),
          record.pricePerLiter ? parseFloat(record.pricePerLiter).toFixed(2) : '0.00',
          parseFloat(record.totalCost).toFixed(2),
          `"${record.fuelStation || ''}"`,
          `"${user?.fullName || user?.username || ''}"`,
          efficiency.toFixed(2)
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `controle-combustivel-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Sucesso",
      description: "Relatório exportado com sucesso!",
    });
  };

  const handleMonthlyReport = () => {
    refetchMonthlyReport();
    setIsMonthlyReportModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-content space-y-4 lg:space-y-6">
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0 ml-12 sm:ml-0">
          <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white truncate">
            Controle de Combustível - Check-in Veículos
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-300 mt-1 hidden sm:block">
            Sistema de controle diário de quilometragem e abastecimento
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleMonthlyReport}
            variant="outline" 
            className="shrink-0 h-8 sm:h-10"
          >
            <BarChart3 className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Relatório Mensal</span>
          </Button>

          <Button 
            onClick={handleExport}
            variant="outline" 
            className="shrink-0 h-8 sm:h-10"
          >
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
        </div>
      </div>

      {/* Search Filter */}
      <Card>
        <CardHeader className="mobile-card">
          <CardTitle className="mobile-text-lg flex items-center">
            <Search className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Buscar Veículo
          </CardTitle>
        </CardHeader>
        <CardContent className="mobile-card pt-0 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por placa ou modelo..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-1 block">Empresa</Label>
            <Select value={selectedCompanyId?.toString() ?? 'all'} onValueChange={(value) => setSelectedCompanyId(value === 'all' ? null : parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as empresas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as empresas</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVehicles.map((vehicle) => {
          const latestRecord = getLatestRecord(vehicle.id);
          const todayRecords = getTodayRecords(vehicle.id);
          const hasRecordToday = todayRecords.length > 0;

          return (
            <Card key={vehicle.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Car className="h-5 w-5 text-blue-600" />
                    <div>
                      <CardTitle className="text-lg">{vehicle.plate}</CardTitle>
                      <CardDescription className="text-sm">{vehicle.model}</CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant={hasRecordToday ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {hasRecordToday ? "Registrado hoje" : "Pendente"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Combustível:</span>
                    <p className="font-medium">{vehicle.fuelType}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">KM Atual:</span>
                    <p className="font-medium font-mono">
                      {latestRecord?.currentMileage || vehicle.mileage || "0"}
                    </p>
                  </div>
                </div>

                {latestRecord && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                    <h4 className="text-sm font-medium mb-2 flex items-center">
                      <Fuel className="h-4 w-4 mr-1 text-green-600" />
                      Último Registro
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Data:</span>
                        <p>{new Date(latestRecord.recordDate).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">KM Rodado:</span>
                        <p className="font-mono">{latestRecord.distanceTraveled}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Litros:</span>
                        <p className="font-mono">{parseFloat(latestRecord.litersRefueled).toFixed(1)}L</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Eficiência:</span>
                        <p className="font-mono">
                          {(parseFloat(latestRecord.distanceTraveled) / parseFloat(latestRecord.litersRefueled)).toFixed(1)} km/L
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={() => handleVehicleCheckIn(vehicle)}
                  className="w-full"
                  variant={hasRecordToday ? "outline" : "default"}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {hasRecordToday ? "Novo Registro" : "Registrar Abastecimento"}
                </Button>

                {/* Ficha técnica do mês */}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      <span className="text-sm font-medium">Ficha técnica do mês</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setExpandedVehicles(prev => ({ ...prev, [vehicle.id]: !prev[vehicle.id] }))}
                    >
                      {expandedVehicles[vehicle.id] ? 'Ocultar' : 'Exibir'}
                    </Button>
                  </div>

                  {expandedVehicles[vehicle.id] && (() => {
                    const stats = getMonthStatsForVehicle(vehicle.id);
                    return (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                          <div className="bg-gray-50 dark:bg-gray-800/50 p-2 rounded">
                            <div className="text-gray-500">Registros</div>
                            <div className="font-bold">{stats.records.length}</div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800/50 p-2 rounded">
                            <div className="text-gray-500">KM Rodados</div>
                            <div className="font-bold font-mono">{stats.totalKm.toFixed(1)} km</div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800/50 p-2 rounded">
                            <div className="text-gray-500">Litros</div>
                            <div className="font-bold font-mono">{stats.totalLiters.toFixed(1)} L</div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800/50 p-2 rounded">
                            <div className="text-gray-500">Média km/L</div>
                            <div className="font-bold">
                              {stats.averageKmPerLiter.toFixed(1)} km/L
                            </div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800/50 p-2 rounded">
                            <div className="text-gray-500">Custo Total</div>
                            <div className="font-bold text-green-600">R$ {stats.totalCost.toFixed(2)}</div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800/50 p-2 rounded">
                            <div className="text-gray-500">Custo por km</div>
                            <div className="font-bold">R$ {stats.costPerKm.toFixed(2)}/km</div>
                          </div>
                        </div>

                        <div className="mobile-table-container">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>KM Inicial</TableHead>
                                <TableHead>KM Final</TableHead>
                                <TableHead>KM</TableHead>
                                <TableHead>Litros</TableHead>
                                <TableHead>Preço/L</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>km/L</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {stats.records.map(r => {
                                const liters = parseFloat(r.litersRefueled || '0');
                                const km = parseFloat(r.distanceTraveled || '0');
                                const price = parseFloat(r.pricePerLiter || '0');
                                const total = parseFloat(r.totalCost || (liters * price).toString());
                                const eff = liters > 0 ? km / liters : 0;
                                return (
                                  <TableRow key={`${r.vehicleId}-${r.recordDate}`}>
                                    <TableCell>{new Date(r.recordDate).toLocaleDateString('pt-BR')}</TableCell>
                                    <TableCell className="font-mono">{r.previousMileage}</TableCell>
                                    <TableCell className="font-mono">{r.currentMileage}</TableCell>
                                    <TableCell className="font-mono">{km.toFixed(1)}</TableCell>
                                    <TableCell className="font-mono">{liters.toFixed(1)}L</TableCell>
                                    <TableCell className="font-mono">R$ {price.toFixed(2)}</TableCell>
                                    <TableCell className="font-mono">R$ {total.toFixed(2)}</TableCell>
                                    <TableCell>
                                      <Badge 
                                        variant={eff >= 10 ? "default" : eff >= 7 ? "secondary" : "destructive"}
                                      >
                                        {eff.toFixed(1)} km/L
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredVehicles.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">
              Nenhum veículo vinculado a empresas encontrado.
              Ajuste o vínculo do veículo ou os filtros de busca.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Check-in Modal */}
      <Dialog open={isCheckInModalOpen} onOpenChange={setIsCheckInModalOpen}>
        <DialogContent className="max-w-4xl mobile-container">
          <DialogHeader>
            <DialogTitle>
              Registrar Abastecimento - {selectedVehicle?.plate} ({selectedVehicle?.model})
            </DialogTitle>
            <DialogDescription>
              Complete as informações de quilometragem e abastecimento
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Quilometragem Section */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Calculator className="h-5 w-5 mr-2 text-blue-600" />
                  Controle de Quilometragem
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="previousMileage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>KM Inicial (início do dia)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            step="0.1"
                            placeholder="Ex: 15000" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currentMileage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>KM Final (fim do dia)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            step="0.1"
                            placeholder="Ex: 15100" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="distanceTraveled"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>KM Percorrido</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            step="0.1"
                            readOnly
                            placeholder="Calculado automaticamente" 
                            className="bg-gray-100 dark:bg-gray-800"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Fuel Section */}
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Fuel className="h-5 w-5 mr-2 text-green-600" />
                  Informações de Abastecimento
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="fuelType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Combustível</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="gasolina">Gasolina</SelectItem>
                            <SelectItem value="etanol">Etanol</SelectItem>
                            <SelectItem value="diesel">Diesel</SelectItem>
                            <SelectItem value="diesel_s10">Diesel S10</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="litersRefueled"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade (Litros)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            step="0.01"
                            placeholder="Ex: 45.50" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pricePerLiter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço por Litro (R$)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            step="0.01"
                            placeholder="Ex: 5.89" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                    <FormLabel className="text-sm">Total em R$</FormLabel>
                    <p className="text-lg font-bold text-green-600">
                      R$ {(() => {
                        const liters = parseFloat(form.watch('litersRefueled') || '0');
                        const price = parseFloat(form.watch('pricePerLiter') || '0');
                        return (liters * price).toFixed(2);
                      })()}
                    </p>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                    <FormLabel className="text-sm">Eficiência estimada</FormLabel>
                    <p className="text-lg font-bold">
                      {(() => {
                        const km = parseFloat(form.watch('distanceTraveled') || '0');
                        const liters = parseFloat(form.watch('litersRefueled') || '0');
                        const eff = liters > 0 ? km / liters : 0;
                        return `${eff.toFixed(2)} km/L`;
                      })()}
                    </p>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                    <FormLabel className="text-sm">Custo por km</FormLabel>
                    <p className="text-lg font-bold">
                      {(() => {
                        const km = parseFloat(form.watch('distanceTraveled') || '0');
                        const liters = parseFloat(form.watch('litersRefueled') || '0');
                        const price = parseFloat(form.watch('pricePerLiter') || '0');
                        const total = liters * price;
                        const cpkm = km > 0 ? total / km : 0;
                        return `R$ ${cpkm.toFixed(2)}/km`;
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="recordDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data do Registro</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fuelStation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Posto de Combustível</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={field.value || ''}
                          placeholder="Ex: Posto Shell - Centro" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={field.value || ''}
                        placeholder="Observações sobre o abastecimento" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="mobile-button-group pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCheckInModalOpen(false)} 
                  className="w-full sm:w-auto"
                  type="button"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="w-full sm:w-auto"
                  disabled={createFuelRecordMutation.isPending}
                >
                  {createFuelRecordMutation.isPending ? 'Salvando...' : 'Salvar Registro'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Monthly Report Modal */}
      <Dialog open={isMonthlyReportModalOpen} onOpenChange={setIsMonthlyReportModalOpen}>
        <DialogContent className="max-w-6xl mobile-container">
          <DialogHeader>
            <DialogTitle>Relatório Mensal de Combustível</DialogTitle>
            <DialogDescription>
              Análise completa por veículo - KM rodados, litros consumidos e eficiência
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="report-month">Mês</Label>
                <Select 
                  value={selectedMonth.toString()} 
                  onValueChange={(value) => setSelectedMonth(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {new Date(2024, i).toLocaleDateString('pt-BR', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="report-year">Ano</Label>
                <Select 
                  value={selectedYear.toString()} 
                  onValueChange={(value) => setSelectedYear(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
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
            </div>

            <Button onClick={() => refetchMonthlyReport()} className="w-full sm:w-auto">
              <Calendar className="h-4 w-4 mr-2" />
              Gerar Relatório
            </Button>

            {monthlyReport.length > 0 && (
              <div className="mobile-table-container">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Total KM Rodados</TableHead>
                      <TableHead>Total Litros</TableHead>
                      <TableHead>Média km/L</TableHead>
                      <TableHead>Custo Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyReport.map((report) => (
                      <TableRow key={report.vehicleId}>
                        <TableCell className="font-medium">
                          <Badge variant="outline">{report.vehiclePlate}</Badge>
                        </TableCell>
                        <TableCell>{report.vehicleModel}</TableCell>
                        <TableCell className="font-mono">{report.totalKm.toFixed(1)} km</TableCell>
                        <TableCell className="font-mono">{report.totalLiters.toFixed(1)}L</TableCell>
                        <TableCell>
                          <Badge 
                            variant={report.averageKmPerLiter >= 10 ? "default" : 
                                   report.averageKmPerLiter >= 7 ? "secondary" : "destructive"}
                          >
                            {report.averageKmPerLiter.toFixed(1)} km/L
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold text-green-600">
                          R$ {report.totalCost.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {monthlyReport.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhum registro encontrado para o período selecionado.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}