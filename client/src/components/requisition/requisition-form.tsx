
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import { Checkbox } from "@/components/ui/checkbox";
import type { InsertFuelRequisition, Supplier, Vehicle } from "@shared/schema";

interface RequisitionFormProps {
  onSuccess?: () => void;
  initialData?: Partial<InsertFuelRequisition>;
}

export default function RequisitionForm({ onSuccess, initialData }: RequisitionFormProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<Partial<InsertFuelRequisition>>({
    supplierId: undefined,
    client: "BBM Serviços",
    responsavel: "",
    vehicleId: undefined,
    kmAtual: "",
    kmAnterior: "",
    kmRodado: "",
    tanqueCheio: "false",
    quantity: "",
    fuelType: "diesel",
    ...initialData,
  });

  const [isTanqueCheio, setIsTanqueCheio] = useState(false);

  // Fetch suppliers
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const response = await fetch("/api/suppliers");
      if (!response.ok) throw new Error("Failed to fetch suppliers");
      return response.json();
    },
  });

  // Fetch vehicles
  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const response = await fetch("/api/vehicles");
      if (!response.ok) throw new Error("Failed to fetch vehicles");
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertFuelRequisition) => {
      const response = await fetch("/api/fuel-requisitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create requisition");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fuel-requisitions"] });
      toast({
        title: t('requisition-created-success'),
        description: "A requisição foi criada com sucesso.",
      });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: t('operation-error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calculate km rodado when km atual or km anterior changes
  useEffect(() => {
    if (formData.kmAtual && formData.kmAnterior) {
      const atual = parseFloat(formData.kmAtual);
      const anterior = parseFloat(formData.kmAnterior);
      const rodado = atual - anterior;
      setFormData(prev => ({ ...prev, kmRodado: rodado.toString() }));
    }
  }, [formData.kmAtual, formData.kmAnterior]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submissionData = {
      ...formData,
      tanqueCheio: isTanqueCheio ? "true" : "false",
      quantity: isTanqueCheio ? undefined : formData.quantity,
    };

    createMutation.mutate(submissionData as InsertFuelRequisition);
  };

  const handleInputChange = (field: keyof InsertFuelRequisition, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fornecedor */}
        <div className="space-y-2">
          <Label htmlFor="supplierId">Fornecedor *</Label>
          <Select 
            value={formData.supplierId?.toString()} 
            onValueChange={(value) => handleInputChange("supplierId", parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um fornecedor" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id.toString()}>
                  {supplier.name} - {supplier.cnpj} ({supplier.responsavel})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Cliente */}
        <div className="space-y-2">
          <Label htmlFor="client">Cliente *</Label>
          <Input
            id="client"
            value={formData.client}
            onChange={(e) => handleInputChange("client", e.target.value)}
            placeholder="Nome do cliente"
          />
        </div>

        {/* Responsável */}
        <div className="space-y-2">
          <Label htmlFor="responsavel">Responsável *</Label>
          <Input
            id="responsavel"
            value={formData.responsavel}
            onChange={(e) => handleInputChange("responsavel", e.target.value)}
            placeholder="Nome do responsável"
          />
        </div>

        {/* Veículo */}
        <div className="space-y-2">
          <Label htmlFor="vehicleId">Veículo *</Label>
          <Select 
            value={formData.vehicleId?.toString()} 
            onValueChange={(value) => handleInputChange("vehicleId", parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um veículo" />
            </SelectTrigger>
            <SelectContent>
              {vehicles.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                  {vehicle.plate} - {vehicle.brand} {vehicle.model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* KM Atual */}
        <div className="space-y-2">
          <Label htmlFor="kmAtual">KM Atual *</Label>
          <Input
            id="kmAtual"
            type="number"
            value={formData.kmAtual}
            onChange={(e) => handleInputChange("kmAtual", e.target.value)}
            placeholder="Ex: 15500"
          />
        </div>

        {/* KM Anterior */}
        <div className="space-y-2">
          <Label htmlFor="kmAnterior">KM Anterior *</Label>
          <Input
            id="kmAnterior"
            type="number"
            value={formData.kmAnterior}
            onChange={(e) => handleInputChange("kmAnterior", e.target.value)}
            placeholder="Ex: 15000"
          />
        </div>

        {/* KM Rodado (calculado automaticamente) */}
        <div className="space-y-2">
          <Label htmlFor="kmRodado">KM Rodado</Label>
          <Input
            id="kmRodado"
            value={formData.kmRodado}
            disabled
            placeholder="Calculado automaticamente"
          />
        </div>

        {/* Tipo de Combustível */}
        <div className="space-y-2">
          <Label htmlFor="fuelType">Tipo de Combustível *</Label>
          <Select 
            value={formData.fuelType} 
            onValueChange={(value) => handleInputChange("fuelType", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gasolina">Gasolina</SelectItem>
              <SelectItem value="etanol">Etanol</SelectItem>
              <SelectItem value="diesel">Diesel</SelectItem>
              <SelectItem value="diesel_s10">Diesel S10</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tanque Cheio */}
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="tanqueCheio"
          checked={isTanqueCheio}
          onCheckedChange={(checked) => setIsTanqueCheio(!!checked)}
        />
        <Label htmlFor="tanqueCheio">Tanque Cheio?</Label>
      </div>

      {/* Quantidade (só aparece se não for tanque cheio) */}
      {!isTanqueCheio && (
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantidade (Litros) *</Label>
          <Input
            id="quantity"
            type="number"
            step="0.01"
            value={formData.quantity}
            onChange={(e) => handleInputChange("quantity", e.target.value)}
            placeholder="Ex: 150.5"
          />
        </div>
      )}

      <Button 
        type="submit" 
        className="w-full" 
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? "Criando..." : "Criar Requisição"}
      </Button>
    </form>
  );
}
