
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/language-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Plus, Search, Filter, Download } from 'lucide-react';

interface FuelRecord {
  id: number;
  vehicleId: number;
  vehiclePlate: string;
  fuelType: string;
  quantity: number;
  pricePerLiter: number;
  totalCost: number;
  odometer: number;
  date: string;
  location: string;
  operator: string;
}

export default function FuelTracking() {
  const { t } = useLanguage();
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVehicle, setFilterVehicle] = useState('all');
  const [filterFuelType, setFilterFuelType] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isNewFuelModalOpen, setIsNewFuelModalOpen] = useState(false);

  // New fuel record form states
  const [newFuelRecord, setNewFuelRecord] = useState({
    vehiclePlate: '',
    fuelType: '',
    quantity: '',
    pricePerLiter: '',
    odometer: '',
    location: '',
    operator: ''
  });

  useEffect(() => {
    // Simular carregamento de dados
    setTimeout(() => {
      setFuelRecords([
        {
          id: 1,
          vehicleId: 1,
          vehiclePlate: 'ABC-1234',
          fuelType: 'Gasolina',
          quantity: 45.5,
          pricePerLiter: 5.89,
          totalCost: 268.00,
          odometer: 15430,
          date: '2024-01-15',
          location: 'Posto Shell - Centro',
          operator: 'João Silva'
        },
        {
          id: 2,
          vehicleId: 2,
          vehiclePlate: 'DEF-5678',
          fuelType: 'Diesel',
          quantity: 78.2,
          pricePerLiter: 4.95,
          totalCost: 387.09,
          odometer: 28750,
          date: '2024-01-14',
          location: 'Posto BR - Zona Sul',
          operator: 'Maria Santos'
        }
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);

  const filteredRecords = fuelRecords.filter(record => {
    const matchesSearch = record.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.operator.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesVehicle = filterVehicle === 'all' || record.vehiclePlate === filterVehicle;
    const matchesFuelType = filterFuelType === 'all' || record.fuelType === filterFuelType;
    
    return matchesSearch && matchesVehicle && matchesFuelType;
  });

  const uniqueVehicles = Array.from(new Set(fuelRecords.map(record => record.vehiclePlate)));
  const uniqueFuelTypes = Array.from(new Set(fuelRecords.map(record => record.fuelType)));

  const handleNewFuelRecord = () => {
    if (!newFuelRecord.vehiclePlate || !newFuelRecord.fuelType || !newFuelRecord.quantity || 
        !newFuelRecord.pricePerLiter || !newFuelRecord.odometer || !newFuelRecord.location || !newFuelRecord.operator) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const quantity = parseFloat(newFuelRecord.quantity);
    const pricePerLiter = parseFloat(newFuelRecord.pricePerLiter);
    const totalCost = quantity * pricePerLiter;

    const newRecord: FuelRecord = {
      id: Math.max(...fuelRecords.map(r => r.id), 0) + 1,
      vehicleId: Math.random(), // In real app, this would come from vehicle selection
      vehiclePlate: newFuelRecord.vehiclePlate,
      fuelType: newFuelRecord.fuelType,
      quantity: quantity,
      pricePerLiter: pricePerLiter,
      totalCost: totalCost,
      odometer: parseInt(newFuelRecord.odometer),
      date: new Date().toISOString().split('T')[0],
      location: newFuelRecord.location,
      operator: newFuelRecord.operator
    };

    setFuelRecords([...fuelRecords, newRecord]);
    setNewFuelRecord({
      vehiclePlate: '',
      fuelType: '',
      quantity: '',
      pricePerLiter: '',
      odometer: '',
      location: '',
      operator: ''
    });
    setIsNewFuelModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>{t('loading-data')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-content space-y-4 lg:space-y-6">
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0 ml-12 sm:ml-0">
          <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white truncate">{t('fuel-tracking')}</h1>
          <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-300 mt-1 hidden sm:block">
            Controle e monitoramento de abastecimentos
          </p>
        </div>
        <Dialog open={isNewFuelModalOpen} onOpenChange={setIsNewFuelModalOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0 h-8 sm:h-10">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Novo Abastecimento</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl mobile-container">
            <DialogHeader>
              <DialogTitle>Novo Registro de Abastecimento</DialogTitle>
              <DialogDescription>
                Registre um novo abastecimento de combustível
              </DialogDescription>
            </DialogHeader>
            
            <div className="mobile-form-grid py-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle-plate">Placa do Veículo *</Label>
                <Input
                  id="vehicle-plate"
                  placeholder="Ex: ABC-1234"
                  value={newFuelRecord.vehiclePlate}
                  onChange={(e) => setNewFuelRecord({...newFuelRecord, vehiclePlate: e.target.value.toUpperCase()})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fuel-type">Tipo de Combustível *</Label>
                <Select value={newFuelRecord.fuelType} onValueChange={(value) => setNewFuelRecord({...newFuelRecord, fuelType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o combustível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Gasolina">Gasolina</SelectItem>
                    <SelectItem value="Diesel">Diesel</SelectItem>
                    <SelectItem value="Etanol">Etanol</SelectItem>
                    <SelectItem value="Diesel S10">Diesel S10</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade (Litros) *</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.1"
                  placeholder="Ex: 45.5"
                  value={newFuelRecord.quantity}
                  onChange={(e) => setNewFuelRecord({...newFuelRecord, quantity: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price-per-liter">Preço por Litro (R$) *</Label>
                <Input
                  id="price-per-liter"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 5.89"
                  value={newFuelRecord.pricePerLiter}
                  onChange={(e) => setNewFuelRecord({...newFuelRecord, pricePerLiter: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="odometer">Odômetro (KM) *</Label>
                <Input
                  id="odometer"
                  type="number"
                  placeholder="Ex: 15430"
                  value={newFuelRecord.odometer}
                  onChange={(e) => setNewFuelRecord({...newFuelRecord, odometer: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="operator">Operador *</Label>
                <Input
                  id="operator"
                  placeholder="Ex: João Silva"
                  value={newFuelRecord.operator}
                  onChange={(e) => setNewFuelRecord({...newFuelRecord, operator: e.target.value})}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="location">Local do Abastecimento *</Label>
                <Input
                  id="location"
                  placeholder="Ex: Posto Shell - Centro"
                  value={newFuelRecord.location}
                  onChange={(e) => setNewFuelRecord({...newFuelRecord, location: e.target.value})}
                />
              </div>
            </div>

            <div className="mobile-button-group pt-4">
              <Button variant="outline" onClick={() => setIsNewFuelModalOpen(false)} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button onClick={handleNewFuelRecord} className="w-full sm:w-auto">
                Salvar Abastecimento
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardHeader className="mobile-card">
          <CardTitle className="mobile-text-lg flex items-center">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            {t('filters')}
          </CardTitle>
        </CardHeader>
        <CardContent className="mobile-card pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="search">{t('search')}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Buscar por placa, local..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="vehicle-filter">Veículo</Label>
              <Select value={filterVehicle} onValueChange={setFilterVehicle}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os veículos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os veículos</SelectItem>
                  {uniqueVehicles.filter(plate => plate && plate.trim() !== '').map(plate => (
                    <SelectItem key={plate} value={plate || 'unknown'}>{plate}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="fuel-filter">Tipo de Combustível</Label>
              <Select value={filterFuelType} onValueChange={setFilterFuelType}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {uniqueFuelTypes.filter(fuelType => fuelType && fuelType.trim() !== '').map(fuelType => (
                    <SelectItem key={fuelType} value={fuelType || 'unknown'}>{fuelType}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 p-2 lg:p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <div className="w-4 h-4 lg:w-6 lg:h-6 bg-blue-600 rounded"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                  Total de Abastecimentos
                </p>
                <p className="text-lg lg:text-2xl font-bold text-gray-800 dark:text-white">
                  {fuelRecords.length}
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
                <p className="text-lg lg:text-2xl font-bold text-gray-800 dark:text-white">
                  {fuelRecords.reduce((acc, record) => acc + record.quantity, 0).toFixed(1)}L
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
                <p className="text-lg lg:text-2xl font-bold text-gray-800 dark:text-white">
                  R$ {fuelRecords.reduce((acc, record) => acc + record.totalCost, 0).toFixed(2)}
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
                <p className="text-lg lg:text-2xl font-bold text-gray-800 dark:text-white">
                  R$ {fuelRecords.length > 0 
                    ? (fuelRecords.reduce((acc, record) => acc + record.pricePerLiter, 0) / fuelRecords.length).toFixed(2)
                    : '0.00'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Registros */}
      <Card>
        <CardHeader className="mobile-card">
          <CardTitle className="mobile-text-lg">Histórico de Abastecimentos</CardTitle>
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
                  <TableHead className="mobile-text-sm">Quantidade</TableHead>
                  <TableHead className="mobile-text-sm">Preço/L</TableHead>
                  <TableHead className="mobile-text-sm">Total</TableHead>
                  <TableHead className="mobile-text-sm">Odômetro</TableHead>
                  <TableHead className="mobile-text-sm">Local</TableHead>
                  <TableHead className="mobile-text-sm">Operador</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="mobile-text-sm">
                      {new Date(record.date).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="mobile-text-sm">{record.vehiclePlate}</Badge>
                    </TableCell>
                    <TableCell className="mobile-text-sm">{record.fuelType}</TableCell>
                    <TableCell className="mobile-text-sm">{record.quantity.toFixed(1)}L</TableCell>
                    <TableCell className="mobile-text-sm">R$ {record.pricePerLiter.toFixed(2)}</TableCell>
                    <TableCell className="font-medium mobile-text-sm">
                      R$ {record.totalCost.toFixed(2)}
                    </TableCell>
                    <TableCell className="mobile-text-sm">{record.odometer.toLocaleString()} km</TableCell>
                    <TableCell className="mobile-text-sm">{record.location}</TableCell>
                    <TableCell className="mobile-text-sm">{record.operator}</TableCell>
                  </TableRow>
                ))}
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
    </div>
  );
}
