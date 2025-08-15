
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
import type { InsertFuelRequisition, Supplier, Vehicle, User } from "@shared/schema";

interface RequisitionFormProps {
  onSuccess?: () => void;
  initialData?: Partial<InsertFuelRequisition>;
  isEditing?: boolean;
  editingId?: number | null;
}

export default function RequisitionForm({ onSuccess, initialData, isEditing = false, editingId }: RequisitionFormProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<Partial<InsertFuelRequisition>>({
    requesterId: 1, // Default to first user
    supplierId: undefined,
    client: "BBM Serviços",
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
    queryKey: ["/api/suppliers"],
  });

  // Fetch vehicles
  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  // Update kmAnterior when vehicle is selected
  useEffect(() => {
    if (formData.vehicleId && vehicles.length > 0) {
      const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId);
      if (selectedVehicle) {
        setFormData(prev => ({ 
          ...prev, 
          kmAnterior: selectedVehicle.mileage || "0" 
        }));
      }
    }
  }, [formData.vehicleId, vehicles]);

  // Fetch users
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertFuelRequisition) => {
      if (isEditing && editingId) {
        // Update existing requisition
        const response = await fetch(`/api/fuel-requisitions/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error("Failed to update requisition");
        return response.json();
      } else {
        // Create new requisition
        const response = await fetch("/api/fuel-requisitions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error("Failed to create requisition");
        
        // Update vehicle mileage after creating requisition
        if (data.vehicleId && data.kmAtual) {
          await fetch(`/api/vehicles/${data.vehicleId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mileage: data.kmAtual }),
          });
        }
        
        return response.json();
      }
    },
    // Atualização otimística para mostrar a requisição imediatamente
    onMutate: async (newRequisition) => {
      // Cancelar qualquer query em andamento
      await queryClient.cancelQueries({ queryKey: ["/api/fuel-requisitions"] });
      await queryClient.cancelQueries({ queryKey: ["/api/fuel-requisitions/stats/overview"] });
      
      // Obter dados atuais
      const previousRequisitions = queryClient.getQueryData<any[]>(["/api/fuel-requisitions"]);
      const previousStats = queryClient.getQueryData<any>(["/api/fuel-requisitions/stats/overview"]);
      
      // Adicionar nova requisição otimisticamente
      if (previousRequisitions) {
        const optimisticRequisition = {
          ...newRequisition,
          id: Date.now(), // ID temporário
          status: "pending",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          approverId: null,
          approvedDate: null,
          rejectionReason: null
        };
        
        queryClient.setQueryData(["/api/fuel-requisitions"], [optimisticRequisition, ...previousRequisitions]);
      }
      
      // Atualizar estatísticas otimisticamente
      if (previousStats) {
        queryClient.setQueryData(["/api/fuel-requisitions/stats/overview"], {
          ...previousStats,
          totalRequests: (parseInt(previousStats.totalRequests) + 1).toString(),
          pendingRequests: (parseInt(previousStats.pendingRequests) + 1).toString()
        });
      }
      
      return { previousRequisitions, previousStats };
    },
    onSuccess: (data) => {
      // Invalidar e recarregar para obter dados reais do servidor
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-requisitions/stats/overview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      
      if (!isEditing) {
        // Reset form only for new requisitions
        setFormData({
          requesterId: 1,
          supplierId: undefined,
          client: "BBM Serviços",
          vehicleId: undefined,
          kmAtual: "",
          kmAnterior: "",
          kmRodado: "",
          tanqueCheio: "false",
          quantity: "",
          fuelType: "diesel",
        });
        setIsTanqueCheio(false);
      }
      
      toast({
        title: isEditing ? "Requisição Atualizada" : "Requisição Criada",
        description: isEditing ? "A requisição foi atualizada com sucesso." : "A requisição foi criada com sucesso.",
      });
      onSuccess?.();
    },
    onError: (error, newRequisition, context) => {
      // Reverter mudanças otimísticas em caso de erro
      if (context?.previousRequisitions) {
        queryClient.setQueryData(["/api/fuel-requisitions"], context.previousRequisitions);
      }
      if (context?.previousStats) {
        queryClient.setQueryData(["/api/fuel-requisitions/stats/overview"], context.previousStats);
      }
      
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
      requesterId: formData.requesterId || 1,
      tanqueCheio: isTanqueCheio ? "true" : "false",
      quantity: isTanqueCheio ? undefined : formData.quantity,
    };

    createMutation.mutate(submissionData as InsertFuelRequisition);
  };

  const handleInputChange = (field: keyof InsertFuelRequisition, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="mobile-spacing">
      <div className="mobile-form-grid">
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
                  <div className="flex flex-col">
                    <span className="font-medium">{supplier.fantasia}</span>
                    <span className="text-xs text-gray-500">{supplier.cnpj}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Cliente */}
        <div className="space-y-2">
          <Label htmlFor="client">Cliente *</Label>
          <Select 
            value={formData.client} 
            onValueChange={(value) => handleInputChange("client", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BBM Serviços">BBM Serviços</SelectItem>
              <SelectItem value="J.B Andaimes">J.B Andaimes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Responsável */}
        <div className="space-y-2">
          <Label htmlFor="requesterId">Responsável *</Label>
          <Select 
            value={formData.requesterId?.toString()} 
            onValueChange={(value) => handleInputChange("requesterId", parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o responsável" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  {user.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            disabled
            placeholder="Carregado automaticamente do veículo"
            className="bg-gray-100 dark:bg-gray-700"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Quilometragem atual do veículo selecionado
          </p>
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

      {/* Quantidade de Litros */}
      <div className="space-y-2">
        <Label htmlFor="quantity">Quantidade (L) *</Label>
        {isTanqueCheio ? (
          <Input
            id="quantity"
            value="Tanque Cheio"
            disabled
            className="bg-muted"
          />
        ) : (
          <Input
            id="quantity"
            type="number"
            value={formData.quantity || ""}
            onChange={(e) => handleInputChange("quantity", e.target.value)}
            placeholder="Ex: 500"
            required={!isTanqueCheio}
          />
        )}
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? 
          (isEditing ? "Atualizando..." : "Criando...") : 
          (isEditing ? "Atualizar Requisição" : "Criar Requisição")
        }
      </Button>
    </form>
  );
}
