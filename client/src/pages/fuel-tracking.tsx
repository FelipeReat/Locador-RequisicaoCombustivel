import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/header';
import { Calculator, Plus, Trash2, Car, Fuel, Search } from 'lucide-react';
import type { Vehicle } from '@shared/schema';

interface FuelEntry {
  id: string;
  date: string;
  kmAnterior: string;
  kmAtual: string;
  litros: string;
  preco: string;
  observacoes: string;
}

export default function FuelTracking() {
  const { toast } = useToast();
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [entries, setEntries] = useState<FuelEntry[]>([]);

  // Fetch vehicles
  const { data: vehicles, isLoading: vehiclesLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  // Initialize with one empty entry when vehicle is selected
  useEffect(() => {
    if (selectedVehicleId && entries.length === 0) {
      addNewEntry();
    }
  }, [selectedVehicleId]);

  const addNewEntry = () => {
    const newEntry: FuelEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      kmAnterior: '',
      kmAtual: '',
      litros: '',
      preco: '',
      observacoes: ''
    };
    setEntries(prev => [...prev, newEntry]);
  };

  const removeEntry = (id: string) => {
    if (entries.length > 1) {
      setEntries(prev => prev.filter(entry => entry.id !== id));
    } else {
      toast({
        title: "Aviso",
        description: "É necessário manter pelo menos uma entrada.",
        variant: "destructive"
      });
    }
  };

  const updateEntry = (id: string, field: keyof FuelEntry, value: string) => {
    setEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  const calculateKmRodado = (kmAnterior: string, kmAtual: string): number => {
    const anterior = parseFloat(kmAnterior) || 0;
    const atual = parseFloat(kmAtual) || 0;
    return atual > anterior ? atual - anterior : 0;
  };

  const calculateMonthlyTotals = () => {
    const validEntries = entries.filter(entry => 
      entry.kmAnterior && entry.kmAtual && entry.litros
    );

    const totalKmRodado = validEntries.reduce((sum, entry) => {
      return sum + calculateKmRodado(entry.kmAnterior, entry.kmAtual);
    }, 0);

    const totalLitros = validEntries.reduce((sum, entry) => {
      return sum + (parseFloat(entry.litros) || 0);
    }, 0);

    const mediaKmPorLitro = totalLitros > 0 ? totalKmRodado / totalLitros : 0;

    return {
      totalKmRodado,
      totalLitros,
      mediaKmPorLitro
    };
  };

  const resetForm = () => {
    setEntries([]);
    if (selectedVehicleId) {
      addNewEntry();
    }
    toast({
      title: "Formulário limpo",
      description: "Todas as entradas foram removidas e o formulário foi resetado."
    });
  };

  const handleVehicleChange = (vehicleId: string) => {
    const id = parseInt(vehicleId);
    setSelectedVehicleId(id);
    setEntries([]);
  };

  const getSelectedVehicle = () => {
    return vehicles?.find(v => v.id === selectedVehicleId);
  };

  const saveData = () => {
    const validEntries = entries.filter(entry => 
      entry.kmAnterior && entry.kmAtual && entry.litros
    );

    if (validEntries.length === 0) {
      toast({
        title: "Erro",
        description: "É necessário preencher pelo menos uma entrada completa.",
        variant: "destructive"
      });
      return;
    }

    const totals = calculateMonthlyTotals();
    
    toast({
      title: "Dados salvos",
      description: `${validEntries.length} entradas salvas com sucesso. Total: ${totals.totalKmRodado.toFixed(0)}km, ${totals.totalLitros.toFixed(2)}L`
    });
    
    console.log('Dados para salvar:', {
      vehicleId: selectedVehicleId,
      vehicle: getSelectedVehicle(),
      month: selectedMonth,
      year: selectedYear,
      entries: validEntries,
      totals
    });
  };

  const getMonthName = (month: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month];
  };

  const totals = calculateMonthlyTotals();

  return (
    <>
      <Header 
        title="Controle de Combustível" 
        subtitle="Adicione dados de quilometragem e abastecimento" 
      />
      
      <main className="flex-1 p-6 space-y-6">
        {/* Vehicle Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="w-5 h-5" />
              Seleção do Veículo
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Selecione o veículo para iniciar o controle de combustível
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="vehicle">Veículo</Label>
                <Select value={selectedVehicleId?.toString() || ""} onValueChange={handleVehicleChange}>
                  <SelectTrigger data-testid="select-vehicle">
                    <SelectValue placeholder="Selecione um veículo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {vehiclesLoading ? (
                      <SelectItem value="" disabled>
                        Carregando veículos...
                      </SelectItem>
                    ) : vehicles && vehicles.length > 0 ? (
                      vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                          {vehicle.plate} - {vehicle.model} ({vehicle.year})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>
                        Nenhum veículo encontrado
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedVehicleId && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Car className="w-4 h-4 text-blue-600" />
                    <h4 className="font-medium text-blue-800 dark:text-blue-200">
                      Veículo Selecionado
                    </h4>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    <p><strong>Placa:</strong> {getSelectedVehicle()?.plate}</p>
                    <p><strong>Modelo:</strong> {getSelectedVehicle()?.model}</p>
                    <p><strong>Ano:</strong> {getSelectedVehicle()?.year}</p>
                    <p><strong>Marca:</strong> {getSelectedVehicle()?.brand}</p>
                    <p><strong>Combustível:</strong> {getSelectedVehicle()?.fuelType}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedVehicleId && (
          <>
            {/* Month/Year Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Período de Controle
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="month">Mês</Label>
                    <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                      <SelectTrigger data-testid="select-month">
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
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="year">Ano</Label>
                    <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                      <SelectTrigger data-testid="select-year">
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
              </CardContent>
            </Card>

            {/* Fuel Entries */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Fuel className="w-5 h-5" />
                    Registros de Abastecimento
                  </CardTitle>
                  <Button onClick={addNewEntry} size="sm" data-testid="button-add-entry">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Registro
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {entries.map((entry, index) => (
                  <div key={entry.id} className="p-4 border rounded-lg space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Registro #{index + 1}</h4>
                      {entries.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeEntry(entry.id)}
                          data-testid={`button-remove-entry-${index}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor={`date-${entry.id}`}>Data</Label>
                        <Input
                          id={`date-${entry.id}`}
                          type="date"
                          value={entry.date}
                          onChange={(e) => updateEntry(entry.id, 'date', e.target.value)}
                          data-testid={`input-date-${index}`}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`km-anterior-${entry.id}`}>Km Anterior</Label>
                        <Input
                          id={`km-anterior-${entry.id}`}
                          type="number"
                          placeholder="0"
                          value={entry.kmAnterior}
                          onChange={(e) => updateEntry(entry.id, 'kmAnterior', e.target.value)}
                          data-testid={`input-km-anterior-${index}`}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`km-atual-${entry.id}`}>Km Atual</Label>
                        <Input
                          id={`km-atual-${entry.id}`}
                          type="number"
                          placeholder="0"
                          value={entry.kmAtual}
                          onChange={(e) => updateEntry(entry.id, 'kmAtual', e.target.value)}
                          data-testid={`input-km-atual-${index}`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor={`km-rodado-${entry.id}`}>Km Rodado</Label>
                        <Input
                          id={`km-rodado-${entry.id}`}
                          type="text"
                          value={calculateKmRodado(entry.kmAnterior, entry.kmAtual).toFixed(0)}
                          disabled
                          className="bg-gray-100 dark:bg-gray-700"
                          data-testid={`display-km-rodado-${index}`}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`litros-${entry.id}`}>Litros Abastecidos</Label>
                        <Input
                          id={`litros-${entry.id}`}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={entry.litros}
                          onChange={(e) => updateEntry(entry.id, 'litros', e.target.value)}
                          data-testid={`input-litros-${index}`}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`preco-${entry.id}`}>Preço por Litro (R$)</Label>
                        <Input
                          id={`preco-${entry.id}`}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={entry.preco}
                          onChange={(e) => updateEntry(entry.id, 'preco', e.target.value)}
                          data-testid={`input-preco-${index}`}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor={`observacoes-${entry.id}`}>Observações</Label>
                      <Textarea
                        id={`observacoes-${entry.id}`}
                        placeholder="Informações adicionais sobre o abastecimento..."
                        value={entry.observacoes}
                        onChange={(e) => updateEntry(entry.id, 'observacoes', e.target.value)}
                        data-testid={`input-observacoes-${index}`}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Monthly Calculations */}
            <Card className="bg-blue-50 dark:bg-blue-900/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                  <Calculator className="w-5 h-5" />
                  Cálculos do Mês ({getMonthName(selectedMonth)} {selectedYear}) - {getSelectedVehicle()?.plate}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="display-total-km">
                      {totals.totalKmRodado.toFixed(0)} km
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Total KM rodados no Mês
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="display-total-litros">
                      {totals.totalLitros.toFixed(2)} L
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Total Litros abastecidos no Mês
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400" data-testid="display-media-km-litro">
                      {totals.mediaKmPorLitro.toFixed(2)} km/L
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Média KM / Litro
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end">
              <Button
                variant="outline"
                onClick={resetForm}
                data-testid="button-reset"
              >
                Limpar Formulário
              </Button>
              <Button
                onClick={saveData}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-save"
              >
                Salvar Dados
              </Button>
            </div>
          </>
        )}

        {!selectedVehicleId && (
          <Card className="border-dashed border-2 border-gray-300 dark:border-gray-600">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Car className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Selecione um Veículo
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
                Para começar o controle de combustível, você precisa primeiro selecionar um veículo da frota disponível.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
}