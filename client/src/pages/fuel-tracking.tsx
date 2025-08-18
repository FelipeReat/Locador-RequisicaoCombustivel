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
import { Plus, Search, Filter, Download, Clock, AlertTriangle, BarChart3, Calendar } from 'lucide-react';
import { insertFuelRecordSchema, type InsertFuelRecord, type FuelRecord, type Vehicle, type User } from '@shared/schema';
import { useToast } from '../hooks/use-toast';

// Helper function to check if current user can register on weekends
const canRegisterOnWeekends = (userRole: string) => {
  return userRole === 'admin' || userRole === 'manager';
};

// Helper function to check if it's a weekday
const isWeekday = () => {
  const day = new Date().getDay();
  return day >= 1 && day <= 5; // Monday to Friday
};

// Helper function to check if user can register today
const canRegisterToday = (userRole: string) => {
  return isWeekday() || canRegisterOnWeekends(userRole);
};

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
  const [filterVehicle, setFilterVehicle] = useState('all');
  const [filterFuelType, setFilterFuelType] = useState('all');
  const [isNewRecordModalOpen, setIsNewRecordModalOpen] = useState(false);
  const [isMonthlyReportModalOpen, setIsMonthlyReportModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
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

  // Fetch vehicles
  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ['/api/vehicles'],
  });

  // Fetch users
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
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
      setIsNewRecordModalOpen(false);
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

  // Form setup with proper default values
  const form = useForm<InsertFuelRecord>({
    resolver: zodResolver(insertFuelRecordSchema),
    defaultValues: {
      vehicleId: vehicles.length > 0 ? vehicles[0].id : 59,
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

  // Reset form defaults when data loads
  React.useEffect(() => {
    if (vehicles.length > 0 && currentUser?.id) {
      form.reset({
        vehicleId: vehicles[0].id,
        currentMileage: '',
        previousMileage: '',
        distanceTraveled: '',
        fuelType: 'gasolina' as const,
        litersRefueled: '',
        pricePerLiter: '',
        operatorId: currentUser.id,
        fuelStation: '',
        notes: '',
        recordDate: new Date().toISOString().split('T')[0],
      });
    }
  }, [vehicles, currentUser, form]);

  // Watch form values for automatic calculations
  const watchedValues = form.watch(['currentMileage', 'previousMileage']);

  useEffect(() => {
    const [currentMileage, previousMileage] = watchedValues;
    if (currentMileage && previousMileage) {
      const current = parseFloat(currentMileage);
      const previous = parseFloat(previousMileage);
      if (current > previous) {
        const distance = current - previous;
        form.setValue('distanceTraveled', distance.toString());
      }
    }
  }, [watchedValues, form]);

  // Filter records
  const filteredRecords = fuelRecords.filter(record => {
    const vehicle = vehicles.find(v => v.id === record.vehicleId);
    const vehiclePlate = vehicle?.plate || '';
    const user = users.find(u => u.id === record.operatorId);
    const operatorName = user?.fullName || user?.username || '';

    const matchesSearch = 
      vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.fuelStation || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      operatorName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesVehicle = filterVehicle === 'all' || vehiclePlate === filterVehicle;
    const matchesFuelType = filterFuelType === 'all' || record.fuelType === filterFuelType;

    return matchesSearch && matchesVehicle && matchesFuelType;
  });

  // Unique values for filters
  const uniqueVehicles = Array.from(new Set(
    fuelRecords.map(record => {
      const vehicle = vehicles.find(v => v.id === record.vehicleId);
      return vehicle?.plate;
    }).filter(Boolean)
  ));
  const uniqueFuelTypes = Array.from(new Set(fuelRecords.map(record => record.fuelType)));

  // Statistics
  const totalRecords = fuelRecords.length;
  const totalLiters = fuelRecords.reduce((acc, record) => acc + parseFloat(record.litersRefueled), 0);
  const totalCost = fuelRecords.reduce((acc, record) => acc + parseFloat(record.totalCost), 0);
  const averagePrice = totalLiters > 0 ? totalCost / totalLiters : 0;

  const onSubmit = (data: InsertFuelRecord) => {
    console.log('Form submitted with data:', data);
    createFuelRecordMutation.mutate(data);
  };

  const handleExport = () => {
    if (filteredRecords.length === 0) {
      toast({
        title: "Aviso",
        description: "Não há dados para exportar.",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      'Data', 'Placa', 'Combustível', 'KM Atual', 'KM Anterior', 'KM Rodado',
      'Litros', 'Preço/L (R$)', 'Total (R$)', 'Posto', 'Operador'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredRecords.map(record => {
        const vehicle = vehicles.find(v => v.id === record.vehicleId);
        const user = users.find(u => u.id === record.operatorId);

        return [
          new Date(record.recordDate).toLocaleDateString('pt-BR'),
          vehicle?.plate || '',
          record.fuelType,
          record.currentMileage,
          record.previousMileage,
          record.distanceTraveled,
          parseFloat(record.litersRefueled).toFixed(1),
          parseFloat(record.pricePerLiter).toFixed(2),
          parseFloat(record.totalCost).toFixed(2),
          `"${record.fuelStation || ''}"`,
          `"${user?.fullName || user?.username || ''}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `registros-combustivel-${new Date().toISOString().split('T')[0]}.csv`);
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

  const userCanRegister = !!currentUser;

  return (
    <div className="mobile-content space-y-4 lg:space-y-6">
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0 ml-12 sm:ml-0">
          <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white truncate">
            Controle de Combustível
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-300 mt-1 hidden sm:block">
            Sistema de bater ponto de abastecimento de veículos
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

          <Dialog open={isNewRecordModalOpen} onOpenChange={setIsNewRecordModalOpen}>
            <DialogTrigger asChild>
              <Button 
                className="shrink-0 h-8 sm:h-10"
                disabled={!userCanRegister}
                data-testid="button-new-record"
              >
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Registrar Abastecimento</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl mobile-container">
              <DialogHeader>
                <DialogTitle>Registrar Abastecimento de Veículo</DialogTitle>
                <DialogDescription>
                  Registre as informações de abastecimento do veículo
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="vehicleId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Veículo *</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-vehicle">
                                <SelectValue placeholder="Selecione o veículo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {vehicles.map((vehicle) => (
                                <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                                  {vehicle.plate} - {vehicle.model}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fuelType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Combustível *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-fuel-type">
                                <SelectValue placeholder="Selecione o combustível" />
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
                      name="previousMileage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quilometragem Anterior (KM) *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              step="0.1"
                              placeholder="Ex: 15000" 
                              data-testid="input-previous-mileage"
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
                          <FormLabel>Quilometragem Atual (KM) *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              step="0.1"
                              placeholder="Ex: 15100" 
                              data-testid="input-current-mileage"
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
                          <FormLabel>Distância Rodada (KM) *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              step="0.1"
                              readOnly
                              placeholder="Calculado automaticamente" 
                              className="bg-gray-100 dark:bg-gray-800"
                              data-testid="input-distance-traveled"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="litersRefueled"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Litros Abastecidos *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              step="0.01"
                              placeholder="Ex: 45.50" 
                              data-testid="input-liters-refueled"
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
                          <FormLabel>Preço por Litro (R$) *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              step="0.01"
                              placeholder="Ex: 5.89" 
                              data-testid="input-price-per-liter"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="recordDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data do Registro *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="date" 
                              data-testid="input-record-date"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fuelStation"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Posto de Combustível</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              value={field.value || ''}
                              placeholder="Ex: Posto Shell - Centro" 
                              data-testid="input-fuel-station"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Observações</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              value={field.value || ''}
                              placeholder="Observações sobre o abastecimento" 
                              data-testid="input-notes"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="mobile-button-group pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsNewRecordModalOpen(false)} 
                      className="w-full sm:w-auto"
                      type="button"
                      data-testid="button-cancel"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      className="w-full sm:w-auto"
                      disabled={createFuelRecordMutation.isPending}
                      data-testid="button-save"
                      onClick={async (e) => {
                        console.log('Save button clicked');
                        console.log('Form errors:', form.formState.errors);
                        console.log('Form values:', form.getValues());
                        console.log('Form is valid:', form.formState.isValid);
                        console.log('Form state:', form.formState);

                        // Trigger validation manually
                        const isValid = await form.trigger();
                        console.log('Manual validation result:', isValid);

                        if (!isValid) {
                          console.log('Form validation failed, errors:', form.formState.errors);
                          e.preventDefault();
                          return;
                        }
                      }}
                    >
                      {createFuelRecordMutation.isPending ? 'Salvando...' : 'Salvar Registro'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>



      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 p-2 lg:p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <div className="w-4 h-4 lg:w-6 lg:h-6 bg-blue-600 rounded"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                  Total de Registros
                </p>
                <p className="text-lg lg:text-2xl font-bold text-gray-800 dark:text-white" data-testid="stat-total-records">
                  {totalRecords}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 p-2 lg:p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <div className="w-4 h-4 lg:w-6 lg:h-6 bg-green-600 rounded"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                  Total em Litros
                </p>
                <p className="text-lg lg:text-2xl font-bold text-gray-800 dark:text-white" data-testid="stat-total-liters">
                  {totalLiters.toFixed(1)}L
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 p-2 lg:p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <div className="w-4 h-4 lg:w-6 lg:h-6 bg-yellow-600 rounded"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                  Custo Total
                </p>
                <p className="text-lg lg:text-2xl font-bold text-gray-800 dark:text-white" data-testid="stat-total-cost">
                  R$ {totalCost.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 p-2 lg:p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <div className="w-4 h-4 lg:w-6 lg:h-6 bg-purple-600 rounded"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                  Preço Médio/L
                </p>
                <p className="text-lg lg:text-2xl font-bold text-gray-800 dark:text-white" data-testid="stat-average-price">
                  R$ {averagePrice.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="mobile-card">
          <CardTitle className="mobile-text-lg flex items-center">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="mobile-card pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Buscar por placa, posto..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="vehicle-filter">Veículo</Label>
              <Select value={filterVehicle} onValueChange={setFilterVehicle}>
                <SelectTrigger data-testid="select-filter-vehicle">
                  <SelectValue placeholder="Todos os veículos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os veículos</SelectItem>
                  {uniqueVehicles.map(plate => (
                    <SelectItem key={plate} value={plate || 'unknown'}>{plate}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="fuel-filter">Tipo de Combustível</Label>
              <Select value={filterFuelType} onValueChange={setFilterFuelType}>
                <SelectTrigger data-testid="select-filter-fuel-type">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {uniqueFuelTypes.map(fuelType => (
                    <SelectItem key={fuelType} value={fuelType}>{fuelType}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={handleExport} 
                className="w-full bg-blue-600 hover:bg-blue-700"
                data-testid="button-export"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card>
        <CardHeader className="mobile-card">
          <CardTitle className="mobile-text-lg">Registros de Abastecimento</CardTitle>
          <CardDescription className="mobile-text-sm">
            {filteredRecords.length} registro{filteredRecords.length !== 1 ? 's' : ''} encontrado{filteredRecords.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="mobile-card pt-0">
          <div className="mobile-table-container">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="mobile-text-sm">Data</TableHead>
                  <TableHead className="mobile-text-sm">Veículo</TableHead>
                  <TableHead className="mobile-text-sm">Combustível</TableHead>
                  <TableHead className="mobile-text-sm">KM Rodado</TableHead>
                  <TableHead className="mobile-text-sm">Litros</TableHead>
                  <TableHead className="mobile-text-sm">Preço/L</TableHead>
                  <TableHead className="mobile-text-sm">Total</TableHead>
                  <TableHead className="mobile-text-sm">Eficiência</TableHead>
                  <TableHead className="mobile-text-sm">Operador</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => {
                  const vehicle = vehicles.find(v => v.id === record.vehicleId);
                  const user = users.find(u => u.id === record.operatorId);
                  const efficiency = parseFloat(record.distanceTraveled) / parseFloat(record.litersRefueled);

                  return (
                    <TableRow key={record.id} data-testid={`row-record-${record.id}`}>
                      <TableCell className="mobile-text-sm">
                        {new Date(record.recordDate).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="mobile-text-sm">
                          {vehicle?.plate}
                        </Badge>
                      </TableCell>
                      <TableCell className="mobile-text-sm">{record.fuelType}</TableCell>
                      <TableCell className="mobile-text-sm">{parseFloat(record.distanceTraveled).toFixed(1)} km</TableCell>
                      <TableCell className="mobile-text-sm">{parseFloat(record.litersRefueled).toFixed(1)}L</TableCell>
                      <TableCell className="mobile-text-sm">R$ {parseFloat(record.pricePerLiter).toFixed(2)}</TableCell>
                      <TableCell className="font-medium mobile-text-sm">
                        R$ {parseFloat(record.totalCost).toFixed(2)}
                      </TableCell>
                      <TableCell className="mobile-text-sm">
                        <Badge 
                          variant={efficiency >= 10 ? "default" : efficiency >= 7 ? "secondary" : "destructive"}
                          className="mobile-text-sm"
                        >
                          {efficiency.toFixed(1)} km/L
                        </Badge>
                      </TableCell>
                      <TableCell className="mobile-text-sm">
                        {user?.fullName || user?.username}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredRecords.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 mobile-text-sm">Nenhum registro encontrado com os filtros aplicados.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Report Modal */}
      <Dialog open={isMonthlyReportModalOpen} onOpenChange={setIsMonthlyReportModalOpen}>
        <DialogContent className="max-w-6xl mobile-container">
          <DialogHeader>
            <DialogTitle>Relatório Mensal de Combustível</DialogTitle>
            <DialogDescription>
              Análise completa de eficiência e consumo por veículo
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
                  <SelectTrigger data-testid="select-report-month">
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
                  <SelectTrigger data-testid="select-report-year">
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
                      <TableHead>Total KM</TableHead>
                      <TableHead>Total Litros</TableHead>
                      <TableHead>Média km/L</TableHead>
                      <TableHead>Custo Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyReport.map((report) => (
                      <TableRow key={report.vehicleId} data-testid={`row-monthly-${report.vehicleId}`}>
                        <TableCell className="font-medium">
                          <Badge variant="outline">{report.vehiclePlate}</Badge>
                        </TableCell>
                        <TableCell>{report.vehicleModel}</TableCell>
                        <TableCell>{report.totalKm.toFixed(1)} km</TableCell>
                        <TableCell>{report.totalLiters.toFixed(1)}L</TableCell>
                        <TableCell>
                          <Badge 
                            variant={report.averageKmPerLiter >= 10 ? "default" : 
                                   report.averageKmPerLiter >= 7 ? "secondary" : "destructive"}
                          >
                            {report.averageKmPerLiter.toFixed(1)} km/L
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold">R$ {report.totalCost.toFixed(2)}</TableCell>
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