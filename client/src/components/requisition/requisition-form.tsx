import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandDialog } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InsertFuelRequisition, Supplier, Vehicle, User, Company } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

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
  const { user: authUser } = useAuth(); // Get user from auth context

  const [formData, setFormData] = useState<Partial<InsertFuelRequisition>>({
    requesterId: undefined,
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

  const [isTanqueCheio, setIsTanqueCheio] = useState(initialData?.tanqueCheio === "true");
  const [openVehicleCombobox, setOpenVehicleCombobox] = useState(false);
  const [openVehicleDialog, setOpenVehicleDialog] = useState(false);
  

  // Get current user from auth context or use default
  const { data: currentUser } = useQuery({
    queryKey: ["/api/user/profile"],
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Get all users to find current user by name
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Set current user as default requester for new requisitions
  useEffect(() => {
    if (!isEditing && !formData.requesterId) {
      // Try to use the API user first
      if (currentUser && typeof currentUser === 'object' && 'id' in currentUser) {
        setFormData(prev => ({ 
          ...prev, 
          requesterId: (currentUser as any).id 
        }));
      } 
      // Use auth context user as fallback when API fails (session lost)
      else if (authUser && users.length > 0) {
        // Find the authenticated user in the users list by username
        const matchingUser = users.find(user => user.username === authUser.username);
        if (matchingUser) {
          setFormData(prev => ({ 
            ...prev, 
            requesterId: matchingUser.id 
          }));
        }
      } 
      // Last fallback: use the first admin user or any user
      else if (users.length > 0) {
        const adminUser = users.find(user => user.role === 'admin') || users[0];
        if (adminUser) {
          setFormData(prev => ({ 
            ...prev, 
            requesterId: adminUser.id 
          }));
        }
      }
    }
  }, [currentUser, authUser, users, isEditing, formData.requesterId]);

  // Update form data when initialData changes (for editing)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      console.log('RequisitionForm - Updating form data with initialData:', initialData);
      console.log('RequisitionForm - isEditing:', isEditing);

      const updatedFormData = {
        requesterId: initialData.requesterId,
        supplierId: initialData.supplierId,
        client: initialData.client || "BBM Serviços",
        vehicleId: initialData.vehicleId,
        kmAtual: initialData.kmAtual || "",
        kmAnterior: initialData.kmAnterior || "",
        kmRodado: initialData.kmRodado || "",
        tanqueCheio: initialData.tanqueCheio || "false",
        quantity: initialData.quantity || "",
        fuelType: initialData.fuelType || "diesel",
      };

      console.log('RequisitionForm - Setting form data to:', updatedFormData);
      setFormData(updatedFormData);
      setIsTanqueCheio(initialData.tanqueCheio === "true");
    } else if (!isEditing && currentUser && typeof currentUser === 'object' && 'id' in currentUser) {
      // Para novas requisições, define o usuário logado como padrão
      setFormData(prev => ({
        ...prev,
        requesterId: (currentUser as any).id
      }));
    }
  }, [initialData, isEditing, currentUser]);

  // Fetch suppliers
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  // Fetch companies for client selection
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  // Fetch vehicles
  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  // Filter vehicles based on selected client/company
  const filteredVehicles = vehicles.filter(vehicle => {
    if (!formData.client) return true;

    // Find the selected company
    const selectedCompany = companies.find(company => company.name === formData.client);
    if (!selectedCompany) return true;

    // Return vehicles that belong to the selected company
    return vehicle.companyId === selectedCompany.id;
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



  const createMutation = useMutation({
    mutationFn: async (data: InsertFuelRequisition) => {
      if (isEditing && editingId) {
        // Update existing requisition
        const response = await apiRequest("PUT", `/api/fuel-requisitions/${editingId}`, data);
        if (!response.ok) throw new Error("Failed to update requisition");
        return response.json();
      } else {
        // Create new requisition
        const response = await apiRequest("POST", "/api/fuel-requisitions", data);
        if (!response.ok) throw new Error("Failed to create requisition");

        // Update vehicle mileage after creating requisition
        if (data.vehicleId && data.kmAtual) {
          await apiRequest("PUT", `/api/vehicles/${data.vehicleId}`, { mileage: data.kmAtual });
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
        // Reset form with current user as requester
        const resetRequesterId = currentUser && typeof currentUser === 'object' && 'id' in currentUser 
          ? (currentUser as any).id 
          : (users.find(user => user.role === 'admin')?.id || users[0]?.id || 1);

        setFormData({
          requesterId: resetRequesterId,
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

    const fallbackRequesterId = currentUser && typeof currentUser === 'object' && 'id' in currentUser 
      ? (currentUser as any).id 
      : (users.find(user => user.role === 'admin')?.id || users[0]?.id || 1);

    const submissionData = {
      ...formData,
      requesterId: formData.requesterId || fallbackRequesterId,
      tanqueCheio: isTanqueCheio ? "true" : "false",
      quantity: isTanqueCheio ? undefined : formData.quantity,
    };

    createMutation.mutate(submissionData as InsertFuelRequisition);
  };

  const handleInputChange = (field: keyof InsertFuelRequisition, value: string | number) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      // If client changes, reset vehicle selection since available vehicles change
      if (field === 'client' && prev.client !== value) {
        newData.vehicleId = undefined;
        newData.kmAnterior = "";
      }

      return newData;
    });
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
            value={formData.client || "placeholder"} 
            onValueChange={(value) => {
              if (value !== "placeholder") {
                setFormData(prev => ({ 
                  ...prev, 
                  client: value,
                  vehicleId: 0 // Reset vehicle when client changes
                }));
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="placeholder">Selecione um cliente</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.name}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Responsável - Limitado ao usuário logado */}
        <div className="space-y-2">
          <Label htmlFor="requesterId">Responsável *</Label>
          {!isEditing ? (
            // Para novas requisições: mostra apenas o usuário atual em um campo visualmente similar mas informativo
            <div className="flex flex-col space-y-2">
              <div className="flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium">
                {(() => {
                  // Try to get user name from authenticated user
                  if (currentUser && typeof currentUser === 'object' && 'id' in currentUser) {
                    return (currentUser as any)?.fullName || (currentUser as any)?.username || 'Usuário atual';
                  }
                  // Fallback: get user name from users list based on selected requesterId
                  if (formData.requesterId && users.length > 0) {
                    const selectedUser = users.find(user => user.id === formData.requesterId);
                    return selectedUser?.fullName || selectedUser?.username || 'Usuário selecionado';
                  }
                  // Final fallback
                  return 'Administrador do Sistema';
                })()}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Você será o responsável por esta requisição
              </p>
            </div>
          ) : (
            // Para edição: permite escolher qualquer usuário (modo admin)
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
                    {user.fullName || user.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Veículo com busca */}
        <div className="space-y-2">
          <Label htmlFor="vehicleId">Veículo *</Label>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={openVehicleDialog}
            className="w-full justify-between"
            onClick={() => setOpenVehicleDialog(true)}
          >
            {formData.vehicleId
              ? filteredVehicles.find((vehicle) => vehicle.id === formData.vehicleId)?.plate + 
                " - " + 
                filteredVehicles.find((vehicle) => vehicle.id === formData.vehicleId)?.brand + 
                " " + 
                filteredVehicles.find((vehicle) => vehicle.id === formData.vehicleId)?.model
              : "Buscar veículo..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
          <CommandDialog open={openVehicleDialog} onOpenChange={setOpenVehicleDialog}>
            <Command>
              <CommandInput placeholder="Digite placa, modelo ou marca..." />
              <CommandEmpty>
                {formData.client 
                  ? "Nenhum veículo encontrado para esta empresa."
                  : "Selecione primeiro um cliente para ver os veículos disponíveis."
                }
              </CommandEmpty>
              <CommandList>
                <CommandGroup heading="Veículos">
                  {filteredVehicles.map((vehicle) => (
                    <CommandItem
                      key={vehicle.id}
                      value={`${vehicle.plate} ${vehicle.brand} ${vehicle.model} ${vehicle.year}`}
                      onSelect={() => {
                        handleInputChange("vehicleId", vehicle.id);
                        setOpenVehicleDialog(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          formData.vehicleId === vehicle.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{vehicle.plate}</span>
                        <span className="text-sm text-gray-500">
                          {vehicle.brand} {vehicle.model} ({vehicle.year})
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </CommandDialog>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Digite para buscar por placa, modelo ou marca
          </p>
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
              <SelectItem value="flex">Flex</SelectItem>
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
