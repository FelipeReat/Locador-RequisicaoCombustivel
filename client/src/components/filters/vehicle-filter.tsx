import { useState, useEffect, useMemo } from "react";
import { Search, ChevronDown, ChevronUp, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import type { Vehicle } from "@shared/schema";

interface VehicleFilterProps {
  vehicles: Vehicle[];
  selectedVehicleIds: number[];
  onSelectionChange: (selectedIds: number[]) => void;
  multiSelect?: boolean;
  title?: string;
  placeholder?: string;
  className?: string;
  storageKey?: string; // Para persistência no localStorage
}

export default function VehicleFilter({
  vehicles,
  selectedVehicleIds,
  onSelectionChange,
  multiSelect = true,
  title = "Filtrar por Veículos",
  placeholder = "Buscar por placa ou modelo...",
  className = "",
  storageKey
}: VehicleFilterProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false); // Mudando para true para abrir por padrão

  // Carregar seleção do localStorage na inicialização
  useEffect(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const savedIds = JSON.parse(saved);
          if (Array.isArray(savedIds)) {
            onSelectionChange(savedIds);
          }
        } catch (error) {
          console.error("Erro ao carregar seleção do localStorage:", error);
        }
      }
    }
  }, [storageKey, onSelectionChange]);

  // Salvar seleção no localStorage quando mudar
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(selectedVehicleIds));
    }
  }, [selectedVehicleIds, storageKey]);

  // Filtrar veículos baseado na busca
  const filteredVehicles = useMemo(() => {
    if (!searchTerm) return vehicles;
    
    const term = searchTerm.toLowerCase();
    return vehicles.filter(vehicle => 
      vehicle.plate.toLowerCase().includes(term) ||
      vehicle.model.toLowerCase().includes(term) ||
      vehicle.brand.toLowerCase().includes(term)
    );
  }, [vehicles, searchTerm]);

  // Verificar se todos os veículos filtrados estão selecionados
  const allFilteredSelected = useMemo(() => {
    if (filteredVehicles.length === 0) return false;
    return filteredVehicles.every(vehicle => selectedVehicleIds.includes(vehicle.id));
  }, [filteredVehicles, selectedVehicleIds]);

  // Verificar se alguns veículos filtrados estão selecionados
  const someFilteredSelected = useMemo(() => {
    return filteredVehicles.some(vehicle => selectedVehicleIds.includes(vehicle.id));
  }, [filteredVehicles, selectedVehicleIds]);

  const handleVehicleToggle = (vehicleId: number) => {
    if (multiSelect) {
      const newSelection = selectedVehicleIds.includes(vehicleId)
        ? selectedVehicleIds.filter(id => id !== vehicleId)
        : [...selectedVehicleIds, vehicleId];
      onSelectionChange(newSelection);
    } else {
      // Seleção única
      const newSelection = selectedVehicleIds.includes(vehicleId) ? [] : [vehicleId];
      onSelectionChange(newSelection);
    }
  };

  const handleSelectAll = () => {
    const filteredIds = filteredVehicles.map(vehicle => vehicle.id);
    if (allFilteredSelected) {
      // Desmarcar todos os filtrados
      const newSelection = selectedVehicleIds.filter(id => !filteredIds.includes(id));
      onSelectionChange(newSelection);
    } else {
      // Selecionar todos os filtrados
      const newSelection = selectedVehicleIds
        .concat(filteredIds)
        .filter((id, idx, arr) => arr.indexOf(id) === idx);
      onSelectionChange(newSelection);
    }
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const selectedCount = selectedVehicleIds.length;
  const totalCount = vehicles.length;

  return (
    <Card className={`w-full ${className}`}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg text-gray-900 dark:text-gray-100">{title}</CardTitle>
                {selectedCount > 0 && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    {selectedCount} de {totalCount}
                  </Badge>
                )}
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {/* Barra de busca */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
              <Input
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Botões de ação */}
            {multiSelect && (
              <div className="flex gap-2 mb-4 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={filteredVehicles.length === 0}
                  className="flex items-center gap-1"
                >
                  <Check className="h-3 w-3" />
                  {allFilteredSelected ? "Desmarcar Filtrados" : "Selecionar Filtrados"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  disabled={selectedCount === 0}
                  className="flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  Limpar Seleção
                </Button>
              </div>
            )}

            {/* Lista de veículos */}
            <div className="max-h-64 overflow-y-auto space-y-2">
              {filteredVehicles.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                  {searchTerm ? "Nenhum veículo encontrado" : "Nenhum veículo disponível"}
                </div>
              ) : (
                filteredVehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Checkbox
                      id={`vehicle-${vehicle.id}`}
                      checked={selectedVehicleIds.includes(vehicle.id)}
                      onCheckedChange={() => handleVehicleToggle(vehicle.id)}
                    />
                    <label
                      htmlFor={`vehicle-${vehicle.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {vehicle.plate}
                          </span>
                          <Badge
                            variant={vehicle.status === "active" ? "default" : "secondary"}
                            className={`text-xs ${
                              vehicle.status === "active"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                            }`}
                          >
                            {vehicle.status === "active" ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {vehicle.brand} {vehicle.model} ({vehicle.year})
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {vehicle.fuelType} • {vehicle.mileage ? Number(vehicle.mileage).toLocaleString() : '0'} km
                      </div>
                    </label>
                  </div>
                ))
              )}
            </div>

            {/* Resumo da seleção */}
            {selectedCount > 0 && (
              <div className="mt-4 pt-4 border-t dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  <strong>{selectedCount}</strong> veículo{selectedCount !== 1 ? 's' : ''} selecionado{selectedCount !== 1 ? 's' : ''}
                  {searchTerm && filteredVehicles.length < totalCount && (
                    <span className="ml-2 text-gray-500 dark:text-gray-400">
                      ({filteredVehicles.filter(v => selectedVehicleIds.includes(v.id)).length} nos resultados filtrados)
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
