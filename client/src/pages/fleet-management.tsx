import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { insertVehicleSchema, type Vehicle, type InsertVehicle } from "@shared/schema";
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
  Trash2
} from "lucide-react";
import { MileageResetDialog } from "@/components/mileage-reset-dialog";
import { Redirect, useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";

function FleetManagement() {
  const { user: currentUser } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();

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


  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [searchTerm, setSearchTerm] = useState("");


  // Hooks para atualizações em tempo real
  const { forceRefresh } = useRealTimeUpdates();
  const { invalidateByOperation } = useSmartInvalidation();

  const { data: vehicles, isLoading: vehiclesLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const form = useForm<InsertVehicle>({
    resolver: zodResolver(insertVehicleSchema),
    defaultValues: {
      plate: "",
      model: "",
      brand: "",
      year: new Date().getFullYear(),
      fuelType: "gasolina",
      mileage: "0",
    },
  });

  const createVehicle = useMutation({
    mutationFn: async (data: InsertVehicle) => {
      const response = await apiRequest("POST", "/api/vehicles", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
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
      console.log(`🔄 Alterando status do veículo ${id} para ${status}`);
      const response = await apiRequest("PATCH", `/api/vehicles/${id}/status`, { status });
      const result = await response.json();
      console.log(`✅ Resposta do servidor:`, result);
      return result;
    },
    onSuccess: (data, { id, status }) => {
      console.log(`🎉 Sucesso na mutação - Veículo ${id} agora tem status ${status}`);

      // Invalidação agressiva e refetch imediato para garantir dados atualizados
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      queryClient.refetchQueries({ queryKey: ["/api/vehicles"] });

      // Atualização otimista adicional com dados do servidor
      queryClient.setQueryData<Vehicle[]>(["/api/vehicles"], (old) => {
        if (!old) return old;
        return old.map(vehicle => 
          vehicle.id === id ? data : vehicle
        );
      });

      console.log(`🔄 Cache invalidado e atualizado com força`);

      toast({
        title: t("success"),
        description: t("vehicle-status-changed"),
      });
    },
    onError: (error) => {
      console.error(`❌ Erro na mutação:`, error);

      // Forçar refresh dos dados para garantir consistência
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
      fuelType: vehicle.fuelType as "gasolina" | "etanol" | "diesel" | "diesel_s10",
      mileage: vehicle.mileage || "0",
    });
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setEditingVehicle(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const getFuelTypeLabel = (fuelType: string) => {
    const labels = {
      gasolina: t("gasoline"),
      etanol: t("ethanol"),
      diesel: t("diesel"),
      diesel_s10: t("diesel-s10"),
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

  const filteredVehicles = sortedVehicles.filter(vehicle => {
    const matchesSearch = vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

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
          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={t('search-vehicles')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleNew} className="w-full sm:w-auto">
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
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

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
                      <Button type="submit" disabled={createVehicle.isPending || updateVehicle.isPending}>
                        {editingVehicle ? t('update') : t('create')}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Vehicles Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {groupedVehicles.active?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">{t('active')}</div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {groupedVehicles.maintenance?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">{t('maintenance')}</div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {groupedVehicles.inactive?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">{t('inactive')}</div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {filteredVehicles.length}
                </div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </Card>
          </div>

          {/* Vehicles List */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Veículos por Modelo (A-Z)
              </h3>
              <div className="text-sm text-muted-foreground">
                {filteredVehicles.length} veículos encontrados
              </div>
            </div>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredVehicles.map((vehicle) => (
              <Card key={vehicle.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/30">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center ring-2 ring-primary/20">
                      <Car className="h-6 w-6 text-primary" />
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
                          className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
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
                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-2 rounded">
                      <div className="flex items-center space-x-2">
                        <Fuel className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('fuel')}:
                        </span>
                      </div>
                      <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                        {getFuelTypeLabel(vehicle.fuelType)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-2 rounded">
                      <div className="flex items-center space-x-2">
                        <Gauge className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          KM:
                        </span>
                      </div>
                      <span className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                        {vehicle.mileage ? parseFloat(vehicle.mileage).toLocaleString("pt-BR") : "0"}
                      </span>
                    </div>

                    {vehicle.lastMaintenance && (
                      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-2 rounded">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
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

          {filteredVehicles.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Car className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{t('no-vehicles-found')}</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {searchTerm ? t('adjust-filters') : t('start-adding-vehicle')}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </>
  );
}

export default FleetManagement;