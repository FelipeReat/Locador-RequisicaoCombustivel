
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/language-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
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

  const uniqueVehicles = [...new Set(fuelRecords.map(record => record.vehiclePlate))];
  const uniqueFuelTypes = [...new Set(fuelRecords.map(record => record.fuelType))];

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('fuel-tracking')}</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Controle e monitoramento de abastecimentos
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Abastecimento
        </Button>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            {t('filters')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  {uniqueVehicles.map(plate => (
                    <SelectItem key={plate} value={plate}>{plate}</SelectItem>
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
                  {uniqueFuelTypes.map(fuelType => (
                    <SelectItem key={fuelType} value={fuelType}>{fuelType}</SelectItem>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <div className="w-6 h-6 bg-blue-600 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Abastecimentos</p>
                <p className="text-2xl font-bold">{fuelRecords.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <div className="w-6 h-6 bg-green-600 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total em Litros</p>
                <p className="text-2xl font-bold">
                  {fuelRecords.reduce((acc, record) => acc + record.quantity, 0).toFixed(1)}L
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <div className="w-6 h-6 bg-yellow-600 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Custo Total</p>
                <p className="text-2xl font-bold">
                  R$ {fuelRecords.reduce((acc, record) => acc + record.totalCost, 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <div className="w-6 h-6 bg-purple-600 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Preço Médio/L</p>
                <p className="text-2xl font-bold">
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
        <CardHeader>
          <CardTitle>Histórico de Abastecimentos</CardTitle>
          <CardDescription>
            {filteredRecords.length} registro{filteredRecords.length !== 1 ? 's' : ''} encontrado{filteredRecords.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Combustível</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Preço/L</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Odômetro</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Operador</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      {new Date(record.date).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{record.vehiclePlate}</Badge>
                    </TableCell>
                    <TableCell>{record.fuelType}</TableCell>
                    <TableCell>{record.quantity.toFixed(1)}L</TableCell>
                    <TableCell>R$ {record.pricePerLiter.toFixed(2)}</TableCell>
                    <TableCell className="font-medium">
                      R$ {record.totalCost.toFixed(2)}
                    </TableCell>
                    <TableCell>{record.odometer.toLocaleString()} km</TableCell>
                    <TableCell>{record.location}</TableCell>
                    <TableCell>{record.operator}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredRecords.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum registro encontrado com os filtros aplicados.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
