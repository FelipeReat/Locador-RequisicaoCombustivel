import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandDialog } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import { Building2, Car, Check, ChevronsUpDown, Fuel, Gauge, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InsertFuelRequisition, Supplier, Vehicle, User as UserType, Company } from "@shared/schema";
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
  const [openVehicleDialog, setOpenVehicleDialog] = useState(false);
  

  // Get current user from auth context or use default
  const { data: currentUser } = useQuery({
    queryKey: ["/api/user/profile"],
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Get all users to find current user by name
  const { data: users = [] } = useQuery<UserType[]>({
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
    if (!formData.kmAtual || !formData.kmAnterior) {
      setFormData(prev => (prev.kmRodado ? { ...prev, kmRodado: "" } : prev));
      return;
    }

    const atual = parseFloat(formData.kmAtual);
    const anterior = parseFloat(formData.kmAnterior);
    const rodado = atual - anterior;

    if (!Number.isFinite(rodado) || rodado < 0) {
      setFormData(prev => (prev.kmRodado ? { ...prev, kmRodado: "" } : prev));
      return;
    }

    setFormData(prev => (prev.kmRodado === rodado.toString() ? prev : { ...prev, kmRodado: rodado.toString() }));
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

    const missing: string[] = [];
    if (!submissionData.supplierId) missing.push("Fornecedor");
    if (!submissionData.client) missing.push("Cliente");
    if (!submissionData.vehicleId) missing.push("Veículo");
    if (!submissionData.kmAtual) missing.push("KM Atual");
    if (!submissionData.kmAnterior) missing.push("KM Anterior");
    if (!submissionData.kmRodado) missing.push("KM Rodado");
    if (!submissionData.fuelType) missing.push("Tipo de Combustível");

    const kmAtualNum = submissionData.kmAtual ? parseFloat(submissionData.kmAtual) : NaN;
    const kmAnteriorNum = submissionData.kmAnterior ? parseFloat(submissionData.kmAnterior) : NaN;
    if (Number.isFinite(kmAtualNum) && Number.isFinite(kmAnteriorNum) && kmAtualNum < kmAnteriorNum) {
      missing.push("KM Atual deve ser maior/igual ao KM Anterior");
    }

    if (!isTanqueCheio) {
      const qty = submissionData.quantity ? parseFloat(submissionData.quantity) : NaN;
      if (!submissionData.quantity || !Number.isFinite(qty) || qty <= 0) {
        missing.push("Quantidade (L)");
      }
    }

    if (missing.length > 0) {
      toast({
        title: "Verifique os campos",
        description: missing.join(", "),
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate(submissionData as InsertFuelRequisition);
  };

  const handleInputChange = (field: keyof InsertFuelRequisition, value: string | number) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      // If client changes, reset vehicle selection since available vehicles change
      if (field === 'client' && prev.client !== value) {
        newData.vehicleId = undefined;
        newData.kmAnterior = "";
        newData.kmRodado = "";
      }

      return newData;
    });
  };

  const selectedSupplier = formData.supplierId ? suppliers.find(s => s.id === formData.supplierId) : undefined;
  const selectedCompany = formData.client ? companies.find(c => c.name === formData.client) : undefined;
  const selectedVehicle = formData.vehicleId ? vehicles.find(v => v.id === formData.vehicleId) : undefined;

  const kmAtualNum = formData.kmAtual ? parseFloat(formData.kmAtual) : NaN;
  const kmAnteriorNum = formData.kmAnterior ? parseFloat(formData.kmAnterior) : NaN;
  const kmRodadoNum = Number.isFinite(kmAtualNum) && Number.isFinite(kmAnteriorNum) ? kmAtualNum - kmAnteriorNum : NaN;
  const kmError = Number.isFinite(kmRodadoNum) && kmRodadoNum < 0;

  const qtyNum = formData.quantity ? parseFloat(formData.quantity) : NaN;
  const isReadyToSubmit =
    !!formData.supplierId &&
    !!formData.client &&
    !!formData.vehicleId &&
    !!formData.kmAtual &&
    !!formData.kmAnterior &&
    !!formData.kmRodado &&
    !!formData.fuelType &&
    !kmError &&
    (isTanqueCheio || (formData.quantity && Number.isFinite(qtyNum) && qtyNum > 0));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card className="overflow-hidden border-muted/60">
            <CardHeader className="bg-gradient-to-br from-zinc-50 via-background to-amber-50 dark:from-zinc-900/40 dark:via-background dark:to-amber-950/20">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                Dados da Requisição
              </CardTitle>
              <CardDescription>Selecione fornecedor, cliente e veículo.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-4 sm:grid-cols-2">
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
                            <span className="text-xs text-muted-foreground">{supplier.cnpj}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client">Cliente *</Label>
                  <Select
                    value={formData.client || "placeholder"}
                    onValueChange={(value) => {
                      if (value !== "placeholder") handleInputChange("client", value);
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

                <div className="space-y-2">
                  <Label htmlFor="requesterId">Responsável *</Label>
                  {!isEditing ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {(() => {
                            if (currentUser && typeof currentUser === "object" && "id" in currentUser) {
                              return (currentUser as any)?.fullName || (currentUser as any)?.username || "Usuário atual";
                            }
                            if (formData.requesterId && users.length > 0) {
                              const selectedUser = users.find(u => u.id === formData.requesterId);
                              return selectedUser?.fullName || selectedUser?.username || "Usuário selecionado";
                            }
                            return "Administrador do Sistema";
                          })()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">Você será o responsável por esta requisição.</p>
                    </div>
                  ) : (
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

                <div className="space-y-2">
                  <Label htmlFor="vehicleId">Veículo *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={openVehicleDialog}
                    className="w-full justify-between"
                    disabled={!selectedCompany}
                    onClick={() => setOpenVehicleDialog(true)}
                  >
                    {selectedVehicle
                      ? `${selectedVehicle.plate} • ${selectedVehicle.brand} ${selectedVehicle.model}`
                      : selectedCompany
                        ? "Buscar veículo..."
                        : "Selecione um cliente primeiro"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                  <CommandDialog open={openVehicleDialog} onOpenChange={setOpenVehicleDialog}>
                    <Command>
                      <CommandInput placeholder="Digite placa, modelo ou marca..." />
                      <CommandEmpty>
                        {selectedCompany
                          ? "Nenhum veículo encontrado para esta empresa."
                          : "Selecione primeiro um cliente para ver os veículos disponíveis."}
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
                                <span className="text-sm text-muted-foreground">
                                  {vehicle.brand} {vehicle.model} ({vehicle.year})
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </CommandDialog>
                  <p className="text-xs text-muted-foreground">Digite para buscar por placa, modelo ou marca.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Gauge className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
                Quilometragem
              </CardTitle>
              <CardDescription>O KM anterior vem do veículo e o KM rodado é calculado automaticamente.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="kmAtual">KM Atual *</Label>
                  <Input
                    id="kmAtual"
                    type="number"
                    value={formData.kmAtual}
                    onChange={(e) => handleInputChange("kmAtual", e.target.value)}
                    placeholder="Ex: 15500"
                  />
                  {kmError ? (
                    <p className="text-xs text-destructive">KM atual não pode ser menor que o KM anterior.</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kmAnterior">KM Anterior *</Label>
                  <Input
                    id="kmAnterior"
                    type="number"
                    value={formData.kmAnterior}
                    disabled
                    placeholder="Carregado automaticamente do veículo"
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Quilometragem atual do veículo selecionado.</p>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="kmRodado">KM Rodado *</Label>
                  <Input id="kmRodado" value={formData.kmRodado} disabled placeholder="Calculado automaticamente" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Fuel className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                Abastecimento
              </CardTitle>
              <CardDescription>Defina o tipo e a quantidade (ou marque tanque cheio).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fuelType">Tipo de Combustível *</Label>
                  <Select value={formData.fuelType} onValueChange={(value) => handleInputChange("fuelType", value)}>
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

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade (L) *</Label>
                  {isTanqueCheio ? (
                    <Input id="quantity" value="Tanque Cheio" disabled className="bg-muted" />
                  ) : (
                    <Input
                      id="quantity"
                      type="number"
                      value={formData.quantity || ""}
                      onChange={(e) => handleInputChange("quantity", e.target.value)}
                      placeholder="Ex: 50"
                    />
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-4 rounded-md border bg-muted/30 px-3 py-2">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Tanque cheio</p>
                  <p className="text-xs text-muted-foreground">Quando ativado, a quantidade em litros não é necessária.</p>
                </div>
                <Switch
                  checked={isTanqueCheio}
                  onCheckedChange={(checked) => {
                    setIsTanqueCheio(checked);
                    if (checked) handleInputChange("quantity", "");
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="h-fit lg:sticky lg:top-24">
          <Card className="border-muted/60">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3 text-base">
                <span className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  Resumo
                </span>
                <Badge variant={isReadyToSubmit ? "secondary" : "warning"} className={isReadyToSubmit ? "" : "text-white"}>
                  {isReadyToSubmit ? "Pronto" : "Incompleto"}
                </Badge>
              </CardTitle>
              <CardDescription>Revise antes de enviar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 rounded-md border bg-muted/20 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Fornecedor</p>
                    <p className="text-sm font-medium">{selectedSupplier?.fantasia || "—"}</p>
                  </div>
                  {selectedSupplier ? <Badge variant="secondary">OK</Badge> : <Badge variant="warning" className="text-white">Pendente</Badge>}
                </div>

                <Separator />

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Cliente</p>
                  <p className="text-sm font-medium">{formData.client || "—"}</p>
                </div>

                <Separator />

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Veículo</p>
                  <p className="text-sm font-medium">
                    {selectedVehicle ? `${selectedVehicle.plate} • ${selectedVehicle.brand} ${selectedVehicle.model}` : "—"}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 rounded-md border bg-muted/20 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">KM (Anterior / Atual)</p>
                  <p className="text-sm font-medium">
                    {(formData.kmAnterior || "—") + " / " + (formData.kmAtual || "—")}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">KM Rodado</p>
                  <p className={cn("text-sm font-medium", kmError ? "text-destructive" : "")}>
                    {formData.kmRodado || "—"}
                  </p>
                </div>
                {kmError ? (
                  <p className="text-xs text-destructive">Ajuste o KM atual para ser maior/igual ao KM anterior.</p>
                ) : null}
              </div>

              <div className="grid gap-3 rounded-md border bg-muted/20 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">Combustível</p>
                  <p className="text-sm font-medium">{formData.fuelType || "—"}</p>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">Quantidade</p>
                  <p className="text-sm font-medium">{isTanqueCheio ? "Tanque cheio" : (formData.quantity || "—")}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-3">
              <Button type="submit" className="w-full" disabled={createMutation.isPending || !isReadyToSubmit}>
                {createMutation.isPending
                  ? (isEditing ? "Atualizando..." : "Criando...")
                  : (isEditing ? "Atualizar Requisição" : "Criar Requisição")}
              </Button>
              <p className="text-xs text-muted-foreground">
                Ao salvar, a quilometragem do veículo é atualizada automaticamente.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </form>
  );
}
