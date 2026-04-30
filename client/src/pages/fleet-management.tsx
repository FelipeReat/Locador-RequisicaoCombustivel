import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { insertVehicleSchema, type Vehicle, type InsertVehicle, type Company, type VehicleType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import { useRealTimeUpdates, useSmartInvalidation } from "@/hooks/useRealTimeUpdates";
import Header from "@/components/layout/header";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  Car, 
  Plus, 
  Edit, 
  Search,
  Fuel,
  Calendar,
  Gauge,
  RotateCcw,
  Trash2,
  List,
  LayoutGrid,
  Filter,
  ChevronDown,
  ChevronRight,
  Layers
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { MileageResetDialog } from "@/components/mileage-reset-dialog";
import { Redirect, useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { useSystemSettings } from "@/contexts/system-settings-context";

function FleetManagement() {
  const { user: currentUser } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { settings: systemSettings } = useSystemSettings();
  
  // Vehicle Type Filter state
  const [selectedVehicleTypes, setSelectedVehicleTypes] = useState<number[]>([]);
  const [isGroupedByType, setIsGroupedByType] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({});

  const toggleGroup = (typeId: number) => {
    setExpandedGroups(prev => ({
      ...prev,
      [typeId]: !prev[typeId]
    }));
  };

  // View mode state
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    return (localStorage.getItem("fleet-view-mode") as "grid" | "list") || "grid";
  });

  // Update localStorage when viewMode changes
  useEffect(() => {
    localStorage.setItem("fleet-view-mode", viewMode);
  }, [viewMode]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = systemSettings.itemsPerPage;

  // Check if current user is admin or manager
  const isAdminOrManager = currentUser?.role === "admin" || currentUser?.role === "manager";

  // If not admin or manager, redirect or show access denied
  useEffect(() => {
    if (currentUser && !isAdminOrManager) {
      navigate("/dashboard");
    }
  }, [currentUser, isAdminOrManager, navigate]);

  if (!currentUser) {
    return <LoadingSpinner message={t("loading-fleet")} />; // Show loading state while fetching user
  }

  if (!isAdminOrManager) {
    return <Redirect to="/dashboard" />;
  }


  // Hooks para atualizações em tempo real
  const { forceRefresh } = useRealTimeUpdates();
  const { invalidateByOperation } = useSmartInvalidation();

  const { data: vehicles, isLoading: vehiclesLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  // Fetch companies for vehicle association
  const { data: companies } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  // Fetch vehicle types
  const { data: vehicleTypes } = useQuery<VehicleType[]>({
    queryKey: ["/api/vehicle-types"],
  });

  // Initialize all groups as expanded when grouping is enabled
  useEffect(() => {
    if (isGroupedByType && vehicleTypes) {
      const allGroups: Record<number, boolean> = {};
      vehicleTypes.forEach(t => {
        allGroups[t.id] = true;
      });
      allGroups[0] = true; // For vehicles without type
      setExpandedGroups(allGroups);
    }
  }, [isGroupedByType, vehicleTypes]);

  const form = useForm<InsertVehicle>({
    resolver: zodResolver(insertVehicleSchema),
    defaultValues: {
      plate: "",
      model: "",
      brand: "",
      year: new Date().getFullYear(),
      fuelType: "gasolina",
      mileage: "0",
      companyId: null,
    },
  });

  const createVehicle = useMutation({
    mutationFn: async (data: InsertVehicle) => {
      const response = await apiRequest("POST", "/api/vehicles", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      // Invalida cache das requisições para atualizar dados do veículo nos PDFs
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: t("success"),
        description: t("vehicle-created-success"),
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: t("error"),
        description: error.message || t("error-creating-vehicle"),
        variant: "destructive",
      });
    },
  });

  const updateVehicle = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertVehicle> }) => {
      const response = await apiRequest("PUT", `/api/vehicles/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      // Invalida cache das requisições para atualizar dados do veículo nos PDFs
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: t("success"),
        description: t("vehicle-updated-success"),
      });
      setIsDialogOpen(false);
      setEditingVehicle(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: t("error"),
        description: error.message || t("error-updating-vehicle"),
        variant: "destructive",
      });
    },
  });

  const toggleVehicleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/vehicles/${id}/status`, { status });
      const result = await response.json();
      return result;
    },
    onSuccess: (data, { id, status }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      queryClient.refetchQueries({ queryKey: ["/api/vehicles"] });

      queryClient.setQueryData<Vehicle[]>(["/api/vehicles"], (old) => {
        if (!old) return old;
        return old.map(vehicle => 
          vehicle.id === id ? data : vehicle
        );
      });

      toast({
        title: t("success"),
        description: t("vehicle-status-changed"),
      });
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });

      toast({
        title: t("error"),
        description: error.message || t("error-changing-status"),
        variant: "destructive",
      });
    },
  });

  const deleteVehicle = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/vehicles/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({
        title: t("success"),
        description: t("vehicle-deleted-success"),
      });
    },
    onError: (error) => {
      toast({
        title: t("error"),
        description: error.message || t("error-deleting-vehicle"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertVehicle) => {
    if (editingVehicle) {
      updateVehicle.mutate({ id: editingVehicle.id, data });
    } else {
      createVehicle.mutate(data);
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    form.reset({
      plate: vehicle.plate,
      model: vehicle.model,
      brand: vehicle.brand,
      year: vehicle.year,
      fuelType: vehicle.fuelType as "gasolina" | "etanol" | "diesel" | "diesel_s10" | "flex",
      mileage: vehicle.mileage || "0",
      companyId: vehicle.companyId ?? null, // Use null if companyId is undefined or null
      vehicleTypeId: vehicle.vehicleTypeId ?? null,
    });
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setEditingVehicle(null);
    // Reset form with explicit default values to prevent pre-filling
    form.reset({
      plate: "",
      model: "",
      brand: "",
      year: new Date().getFullYear(),
      fuelType: "gasolina",
      mileage: "0",
      companyId: null,
      vehicleTypeId: null,
    });
    setIsDialogOpen(true);
  };

  const getFuelTypeLabel = (fuelType: string) => {
    const labels = {
      gasolina: t("gasoline"),
      etanol: t("ethanol"),
      diesel: t("diesel"),
      diesel_s10: t("diesel-s10"),
      flex: t("flex"),
    };
    return labels[fuelType as keyof typeof labels] || fuelType;
  };

  const getStatusBadgeVariant = (status: string) => {
    const variants = {
      active: "default",
      maintenance: "warning" as any,
      inactive: "destructive",
    };
    return variants[status as keyof typeof variants] || "secondary";
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      active: t("active"),
      maintenance: t("maintenance"),
      inactive: t("inactive"),
    };
    return labels[status as keyof typeof labels] || status;
  };

  // Sort vehicles alphabetically by model
  const sortedVehicles = vehicles ? [...vehicles].sort((a, b) => {
    return a.model.localeCompare(b.model, 'pt-BR');
  }) : [];

  // Group vehicles by status for better organization
  const groupedVehicles = sortedVehicles.reduce((acc, vehicle) => {
    if (!acc[vehicle.status]) {
      acc[vehicle.status] = [];
    }
    acc[vehicle.status].push(vehicle);
    return acc;
  }, {} as Record<string, typeof sortedVehicles>);

  const getVehicleTypeName = (id: number | null | undefined) => {
    if (!id) return "Sem Tipo";
    const type = vehicleTypes?.find(t => t.id === id);
    return type ? type.name : "Desconhecido";
  };

  const filteredVehicles = sortedVehicles.filter(vehicle => {
    const matchesSearch = vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || vehicle.status === statusFilter;

    const matchesType = selectedVehicleTypes.length === 0 || 
      (vehicle.vehicleTypeId !== null && vehicle.vehicleTypeId !== undefined && selectedVehicleTypes.includes(vehicle.vehicleTypeId)) ||
      (selectedVehicleTypes.includes(0) && !vehicle.vehicleTypeId); // 0 for 'Sem Tipo'

    return matchesSearch && matchesStatus && matchesType;
  });

  // Group vehicles by type for the grouped view
  const vehiclesGroupedByType = filteredVehicles.reduce((acc, vehicle) => {
    const typeId = vehicle.vehicleTypeId || 0; // 0 for 'Sem Tipo'
    if (!acc[typeId]) {
      acc[typeId] = [];
    }
    acc[typeId].push(vehicle);
    return acc;
  }, {} as Record<number, Vehicle[]>);

  // Pagination logic
  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
  const paginatedVehicles = filteredVehicles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const maintenanceCount = groupedVehicles.maintenance?.length || 0;
  const inactiveCount = groupedVehicles.inactive?.length || 0;
  const totalCount = vehicles?.length || 0;
  const groupedCount = Object.keys(vehiclesGroupedByType).length;

  if (vehiclesLoading) {
    return <LoadingSpinner message={t("loading-fleet")} />;
  }

  return (
    <>
      <Header 
        title={t('fleet-management')} 
        subtitle={t('manage-company-vehicles')} 
      />

      <main className="flex-1 mobile-content py-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-zinc-700 via-stone-700 to-amber-600 text-white shadow-sm">
            <div className="p-6 space-y-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="space-y-2">
                  <div className="text-sm text-white/75">Gestão da frota</div>
                  <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
                    <Car className="h-8 w-8 text-white" />
                    {t('fleet-management')}
                  </h1>
                  <p className="max-w-2xl text-sm text-white/80">
                    Organize veículos, acompanhe status operacionais e filtre a frota com mais clareza.
                  </p>
                </div>

                <div className="flex flex-col gap-3 lg:flex-row xl:w-auto">
                  {isAdminOrManager && (
                    <Button 
                      variant="outline" 
                      onClick={() => navigate("/vehicle-types")}
                      className="border-white/20 bg-white/10 text-white hover:bg-white/15"
                    >
                      <Car className="mr-2 h-4 w-4" />
                      Tipos de Veículos
                    </Button>
                  )}

                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={handleNew} className="bg-white text-amber-700 hover:bg-white/90">
                        <Plus className="mr-2 h-4 w-4" />
                        {t('new-vehicle')}
                      </Button>
                    </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingVehicle ? t('edit-vehicle') : t('new-vehicle')}
                      </DialogTitle>
                      <DialogDescription>
                        {editingVehicle ? t('update-vehicle-info') : t('add-new-vehicle')}
                      </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="plate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('plate')} *</FormLabel>
                                <FormControl>
                                  <Input placeholder="ABC-1234" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="year"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('year')} *</FormLabel>
                                <FormControl>
                                  <Input type="number" min="1900" max={new Date().getFullYear() + 1} {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          <FormField
                            control={form.control}
                            name="vehicleTypeId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tipo de Veículo</FormLabel>
                                <Select 
                                  onValueChange={(value) => field.onChange(value === "null" ? null : Number(value))} 
                                  value={field.value === null || field.value === undefined ? "null" : field.value.toString()}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione um tipo" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="null">Selecione um tipo</SelectItem>
                                    {vehicleTypes?.filter(t => t.active).map((type) => (
                                      <SelectItem key={type.id} value={type.id.toString()}>
                                        {type.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="brand"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('brand')} *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Toyota, Volkswagen, etc." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="model"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('model')} *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Corolla, Gol, etc." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="fuelType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('fuel')} *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder={t('select-option')} />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="gasolina">{t('gasoline')}</SelectItem>
                                    <SelectItem value="etanol">{t('ethanol')}</SelectItem>
                                    <SelectItem value="diesel">{t('diesel')}</SelectItem>
                                    <SelectItem value="diesel_s10">{t('diesel-s10')}</SelectItem>
                                    <SelectItem value="flex">{t('flex')}</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="companyId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Empresa</FormLabel>
                                <Select 
                                  onValueChange={(value) => field.onChange(value === "null" ? null : Number(value))} 
                                  value={field.value === null || field.value === undefined ? "null" : field.value.toString()}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecionar empresa" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="null">Sem empresa</SelectItem>
                                    {companies?.map((company) => (
                                      <SelectItem key={company.id} value={company.id.toString()}>
                                        {company.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          <FormField
                            control={form.control}
                            name="mileage"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('mileage')}</FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="0" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                            {t('cancel')}
                          </Button>
                          <Button type="submit" disabled={createVehicle.isPending || updateVehicle.isPending} className="bg-amber-600 hover:bg-amber-700 text-white">
                            {editingVehicle ? t('update') : t('create')}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
                <div className="space-y-3">
                  <div className="relative w-full xl:max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-4 w-4" />
                    <Input
                      placeholder={t('search-vehicles')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="border-white/15 bg-white/10 pl-10 text-white placeholder:text-white/55"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-10 border-white/20 bg-white/10 text-white hover:bg-white/15">
                          <Filter className="mr-2 h-4 w-4" />
                          Tipo
                          {selectedVehicleTypes.length > 0 && (
                            <Badge variant="secondary" className="ml-2 rounded-sm px-1 font-normal text-zinc-900">
                              {selectedVehicleTypes.length}
                            </Badge>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-[220px]">
                        <DropdownMenuLabel>Filtrar por Tipo</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem
                          checked={selectedVehicleTypes.length === 0}
                          onCheckedChange={() => setSelectedVehicleTypes([])}
                        >
                          Todos
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem
                          checked={selectedVehicleTypes.includes(0)}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedVehicleTypes([...selectedVehicleTypes, 0]);
                            else setSelectedVehicleTypes(selectedVehicleTypes.filter(id => id !== 0));
                          }}
                        >
                          Sem Tipo
                        </DropdownMenuCheckboxItem>
                        {vehicleTypes?.filter(t => t.active).map((type) => (
                          <DropdownMenuCheckboxItem
                            key={type.id}
                            checked={selectedVehicleTypes.includes(type.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedVehicleTypes([...selectedVehicleTypes, type.id]);
                              } else {
                                setSelectedVehicleTypes(selectedVehicleTypes.filter(id => id !== type.id));
                              }
                            }}
                          >
                            {type.name}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                      variant={isGroupedByType ? "secondary" : "outline"}
                      size="sm"
                      className={isGroupedByType ? "h-10 bg-white text-amber-700 hover:bg-white/90" : "h-10 border-white/20 bg-white/10 text-white hover:bg-white/15"}
                      onClick={() => setIsGroupedByType(!isGroupedByType)}
                      title={isGroupedByType ? "Desagrupar" : "Agrupar por Tipo"}
                    >
                      <Layers className="mr-2 h-4 w-4" />
                      Agrupar
                    </Button>

                    <div className="flex items-center rounded-md border border-white/15 bg-white/10 p-1">
                      <Button
                        variant={viewMode === "grid" ? "secondary" : "ghost"}
                        size="sm"
                        className={viewMode === "grid" ? "h-8 w-8 p-0 bg-white text-amber-700 hover:bg-white/90" : "h-8 w-8 p-0 text-white hover:bg-white/10"}
                        onClick={() => setViewMode("grid")}
                        title="Visualização em Grade"
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === "list" ? "secondary" : "ghost"}
                        size="sm"
                        className={viewMode === "list" ? "h-8 w-8 p-0 bg-white text-amber-700 hover:bg-white/90" : "h-8 w-8 p-0 text-white hover:bg-white/10"}
                        onClick={() => setViewMode("list")}
                        title="Visualização em Lista"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-px overflow-hidden rounded-xl bg-white/10 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="bg-white/5 p-4">
                    <div className="text-xs text-white/70">{t('active')}</div>
                    <div className="mt-1 text-2xl font-semibold">{groupedVehicles.active?.length || 0}</div>
                  </div>
                  <div className="bg-white/5 p-4">
                    <div className="text-xs text-white/70">{t('maintenance')}</div>
                    <div className="mt-1 text-2xl font-semibold">{maintenanceCount}</div>
                  </div>
                  <div className="bg-white/5 p-4">
                    <div className="text-xs text-white/70">{t('inactive')}</div>
                    <div className="mt-1 text-2xl font-semibold">{inactiveCount}</div>
                  </div>
                  <div className="bg-white/5 p-4">
                    <div className="text-xs text-white/70">Tipos visuais</div>
                    <div className="mt-1 text-2xl font-semibold">{groupedCount}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicles Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card 
              className={`cursor-pointer border-muted/60 p-4 transition-all hover:shadow-md ${
                statusFilter === "active" ? "ring-2 ring-amber-500 bg-amber-50/80 dark:bg-amber-950/20" : ""
              }`}
              onClick={() => setStatusFilter(statusFilter === "active" ? "all" : "active")}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                  {groupedVehicles.active?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">{t('active')}</div>
              </div>
            </Card>
            <Card 
              className={`cursor-pointer border-muted/60 p-4 transition-all hover:shadow-md ${
                statusFilter === "maintenance" ? "ring-2 ring-amber-500 bg-amber-50/80 dark:bg-amber-950/20" : ""
              }`}
              onClick={() => setStatusFilter(statusFilter === "maintenance" ? "all" : "maintenance")}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                  {maintenanceCount}
                </div>
                <div className="text-sm text-muted-foreground">{t('maintenance')}</div>
              </div>
            </Card>
            <Card 
              className={`cursor-pointer border-muted/60 p-4 transition-all hover:shadow-md ${
                statusFilter === "inactive" ? "ring-2 ring-red-500 bg-red-50 dark:bg-red-900/20" : ""
              }`}
              onClick={() => setStatusFilter(statusFilter === "inactive" ? "all" : "inactive")}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {groupedVehicles.inactive?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">{t('inactive')}</div>
              </div>
            </Card>
            <Card 
              className={`cursor-pointer border-muted/60 p-4 transition-all hover:shadow-md ${
                statusFilter === "all" ? "ring-2 ring-zinc-400 bg-zinc-100 dark:bg-zinc-800/70" : ""
              }`}
              onClick={() => setStatusFilter("all")}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-zinc-700 dark:text-zinc-200">
                  {totalCount}
                </div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </Card>
          </div>

          {/* Vehicles List */}
          <Card className="border-muted/60">
            <CardHeader className="border-b bg-gradient-to-r from-zinc-50 via-background to-amber-50 dark:from-zinc-900/40 dark:via-background dark:to-amber-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Veículos por Modelo (A-Z)
                </h3>
                {statusFilter !== "all" && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Filtrando por:</span>
                    <Badge variant="outline" className="capitalize">
                      {statusFilter === "active" && "✓ Ativo"}
                      {statusFilter === "maintenance" && "⚠️ Manutenção"}
                      {statusFilter === "inactive" && "✗ Inativo"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStatusFilter("all")}
                      className="h-6 px-2 text-xs"
                    >
                      Limpar
                    </Button>
                  </div>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {filteredVehicles.length} veículos encontrados
              </div>
            </div>
            </CardHeader>
          </Card>

          {viewMode === "grid" ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {paginatedVehicles.map((vehicle) => (
                <Card key={vehicle.id} className="overflow-hidden border-muted/60 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                  <CardHeader className="border-b bg-gradient-to-r from-zinc-50 via-background to-amber-50/70 dark:from-zinc-900/40 dark:via-background dark:to-amber-950/10 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-zinc-200 via-stone-200 to-amber-200 dark:from-zinc-800 dark:via-stone-800 dark:to-amber-950/40 flex items-center justify-center ring-2 ring-amber-100 dark:ring-amber-950/20">
                        <Car className="h-6 w-6 text-amber-700 dark:text-amber-300" />
                      </div>
                      <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
                        <Select
                          value={vehicle.status}
                          onValueChange={(status) => toggleVehicleStatus.mutate({ id: vehicle.id, status })}
                        >
                          <SelectTrigger className="w-full sm:w-32 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">✓ {t('active')}</SelectItem>
                            <SelectItem value="maintenance">⚠️ {t('maintenance')}</SelectItem>
                            <SelectItem value="inactive">✗ {t('inactive')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(vehicle)}
                            className="h-8 w-8 p-0 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
                            title="Editar veículo"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteVehicle.mutate(vehicle.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                            title="Excluir veículo"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                      {vehicle.plate}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                      {vehicle.brand} {vehicle.model} ({vehicle.year})
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between rounded-lg border bg-zinc-50/80 dark:bg-zinc-900/40 p-2">
                        <div className="flex items-center space-x-2">
                          <Fuel className="h-4 w-4 text-zinc-500" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('fuel')}:
                          </span>
                        </div>
                        <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                          {getFuelTypeLabel(vehicle.fuelType)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-lg border bg-zinc-50/80 dark:bg-zinc-900/40 p-2">
                        <div className="flex items-center space-x-2">
                          <Gauge className="h-4 w-4 text-zinc-500" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            KM:
                          </span>
                        </div>
                        <span className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                          {vehicle.mileage ? parseFloat(vehicle.mileage).toLocaleString("pt-BR") : "0"}
                        </span>
                      </div>

                      {vehicle.lastMaintenance && (
                        <div className="flex items-center justify-between rounded-lg border bg-zinc-50/80 dark:bg-zinc-900/40 p-2">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-zinc-500" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Última manutenção:
                            </span>
                          </div>
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {new Date(vehicle.lastMaintenance).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-center pt-3 border-t border-gray-200 dark:border-gray-700">
                      <Badge 
                        variant={getStatusBadgeVariant(vehicle.status)}
                        className="px-3 py-1 text-xs font-medium"
                      >
                        {vehicle.status === 'active' && '✓'} 
                        {vehicle.status === 'maintenance' && '⚠️'} 
                        {vehicle.status === 'inactive' && '✗'} 
                        {' '}{getStatusLabel(vehicle.status)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border bg-white dark:bg-gray-900">
              <Table>
                <TableHeader className="bg-zinc-100 dark:bg-zinc-800">
                  <TableRow>
                    <TableHead>{t('plate')}</TableHead>
                    <TableHead>{t('model')}</TableHead>
                    <TableHead>{t('brand')}</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>KM</TableHead>
                    <TableHead>{t('fuel')}</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isGroupedByType ? (
                    Object.entries(vehiclesGroupedByType).map(([typeIdStr, vehicles]) => {
                      const typeId = Number(typeIdStr);
                      const typeName = getVehicleTypeName(typeId);
                      const isExpanded = expandedGroups[typeId];
                      
                      return (
                        <React.Fragment key={typeId}>
                          <TableRow 
                            className="bg-zinc-100/80 dark:bg-zinc-800/70 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 cursor-pointer"
                            onClick={() => toggleGroup(typeId)}
                          >
                            <TableCell colSpan={8} className="font-semibold py-2">
                              <div className="flex items-center">
                                {isExpanded ? (
                                  <ChevronDown className="mr-2 h-4 w-4" />
                                ) : (
                                  <ChevronRight className="mr-2 h-4 w-4" />
                                )}
                                {typeName} ({vehicles.length})
                              </div>
                            </TableCell>
                          </TableRow>
                          {isExpanded && vehicles.map((vehicle, index) => (
                            <TableRow key={vehicle.id} className={index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-zinc-50/60 dark:bg-zinc-900/60"}>
                              <TableCell className="font-medium">{vehicle.plate}</TableCell>
                              <TableCell>{vehicle.model}</TableCell>
                              <TableCell>{vehicle.brand}</TableCell>
                              <TableCell>{getVehicleTypeName(vehicle.vehicleTypeId)}</TableCell>
                              <TableCell>
                                <Select
                                  value={vehicle.status}
                                  onValueChange={(status) => toggleVehicleStatus.mutate({ id: vehicle.id, status })}
                                >
                                  <SelectTrigger className="w-32 h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="active">✓ {t('active')}</SelectItem>
                                    <SelectItem value="maintenance">⚠️ {t('maintenance')}</SelectItem>
                                    <SelectItem value="inactive">✗ {t('inactive')}</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>{vehicle.mileage ? parseFloat(vehicle.mileage).toLocaleString("pt-BR") : "0"}</TableCell>
                              <TableCell>{getFuelTypeLabel(vehicle.fuelType)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(vehicle)}
                                    className="h-8 w-8 p-0 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
                                    title="Editar veículo"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteVehicle.mutate(vehicle.id)}
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                                    title="Excluir veículo"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    paginatedVehicles.map((vehicle, index) => (
                    <TableRow key={vehicle.id} className={index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-zinc-50/60 dark:bg-zinc-900/60"}>
                      <TableCell className="font-medium">{vehicle.plate}</TableCell>
                      <TableCell>{vehicle.model}</TableCell>
                      <TableCell>{vehicle.brand}</TableCell>
                      <TableCell>{getVehicleTypeName(vehicle.vehicleTypeId)}</TableCell>
                      <TableCell>
                        <Select
                          value={vehicle.status}
                          onValueChange={(status) => toggleVehicleStatus.mutate({ id: vehicle.id, status })}
                        >
                          <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">✓ {t('active')}</SelectItem>
                            <SelectItem value="maintenance">⚠️ {t('maintenance')}</SelectItem>
                            <SelectItem value="inactive">✗ {t('inactive')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{vehicle.mileage ? parseFloat(vehicle.mileage).toLocaleString("pt-BR") : "0"}</TableCell>
                      <TableCell>{getFuelTypeLabel(vehicle.fuelType)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(vehicle)}
                            className="h-8 w-8 p-0 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
                            title="Editar veículo"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteVehicle.mutate(vehicle.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                            title="Excluir veículo"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )))}
                </TableBody>
              </Table>
            </div>
          )}

          {filteredVehicles.length === 0 && (
            <Card className="border-dashed border-2 border-zinc-300 dark:border-zinc-700">
              <CardContent className="p-12 text-center">
                <Car className="mx-auto h-12 w-12 text-amber-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{t('no-vehicles-found')}</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {searchTerm ? t('adjust-filters') : t('start-adding-vehicle')}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {filteredVehicles.length > itemsPerPage && (
            <div className="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Mostrando <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> a{' '}
                <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredVehicles.length)}</span> de{' '}
                <span className="font-medium">{filteredVehicles.length}</span> veículos
              </div>
              <div className="flex items-center space-x-6 lg:space-x-8">
                <div className="flex w-[100px] items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-300">
                  Página {currentPage} de {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    title="Primeira página"
                  >
                    ⟪
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    title="Página anterior"
                  >
                    ⟨
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    title="Próxima página"
                  >
                    ⟩
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    title="Última página"
                  >
                    ⟫
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default FleetManagement;
