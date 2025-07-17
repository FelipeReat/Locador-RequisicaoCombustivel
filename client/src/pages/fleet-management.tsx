
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { insertVehicleSchema, type Vehicle, type InsertVehicle, type Department } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
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
  Gauge
} from "lucide-react";

export default function FleetManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const { t } = useLanguage();

  const { data: vehicles, isLoading: vehiclesLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const { data: departments } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const form = useForm<InsertVehicle>({
    resolver: zodResolver(insertVehicleSchema),
    defaultValues: {
      plate: "",
      model: "",
      brand: "",
      year: new Date().getFullYear(),
      fuelType: "gasolina",
      departmentId: 0,
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
        description: "Veículo criado com sucesso",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: t("error"),
        description: error.message || "Erro ao criar veículo",
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
        description: "Veículo atualizado com sucesso",
      });
      setIsDialogOpen(false);
      setEditingVehicle(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: t("error"),
        description: error.message || "Erro ao atualizar veículo",
        variant: "destructive",
      });
    },
  });

  const toggleVehicleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/vehicles/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({
        title: t("success"),
        description: "Status do veículo alterado com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: t("error"),
        description: error.message || "Erro ao alterar status",
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
      departmentId: vehicle.departmentId,
      mileage: vehicle.mileage || "0",
    });
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setEditingVehicle(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const getDepartmentName = (departmentId: number) => {
    const dept = departments?.find(d => d.id === departmentId);
    return dept?.name || "Departamento não encontrado";
  };

  const getFuelTypeLabel = (fuelType: string) => {
    const labels = {
      gasolina: "Gasolina",
      etanol: "Etanol",
      diesel: "Diesel",
      diesel_s10: "Diesel S10",
    };
    return labels[fuelType as keyof typeof labels] || fuelType;
  };

  const getStatusBadgeVariant = (status: string) => {
    const variants = {
      active: "default",
      maintenance: "secondary",
      inactive: "destructive",
    };
    return variants[status as keyof typeof variants] || "secondary";
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      active: "Ativo",
      maintenance: "Manutenção",
      inactive: "Inativo",
    };
    return labels[status as keyof typeof labels] || status;
  };

  const filteredVehicles = vehicles?.filter(vehicle => {
    const matchesSearch = vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = departmentFilter === "all" || vehicle.departmentId.toString() === departmentFilter;
    
    return matchesSearch && matchesDepartment;
  }) || [];

  if (vehiclesLoading) {
    return <LoadingSpinner message="Carregando frota..." />;
  }

  return (
    <>
      <Header 
        title="Gestão de Frota" 
        subtitle="Gerencie os veículos da empresa" 
      />

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Actions Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar veículos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os departamentos</SelectItem>
                  {departments?.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleNew}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Veículo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingVehicle ? "Editar Veículo" : "Novo Veículo"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingVehicle ? "Atualize as informações do veículo" : "Adicione um novo veículo à frota"}
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="plate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Placa *</FormLabel>
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
                            <FormLabel>Ano *</FormLabel>
                            <FormControl>
                              <Input type="number" min="1900" max={new Date().getFullYear() + 1} {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="brand"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Marca *</FormLabel>
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
                            <FormLabel>Modelo *</FormLabel>
                            <FormControl>
                              <Input placeholder="Corolla, Gol, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="fuelType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Combustível *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="gasolina">Gasolina</SelectItem>
                                <SelectItem value="etanol">Etanol</SelectItem>
                                <SelectItem value="diesel">Diesel</SelectItem>
                                <SelectItem value="diesel_s10">Diesel S10</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="departmentId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Departamento *</FormLabel>
                            <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {departments?.map((dept) => (
                                  <SelectItem key={dept.id} value={dept.id.toString()}>
                                    {dept.name}
                                  </SelectItem>
                                ))}
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
                            <FormLabel>Quilometragem</FormLabel>
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
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={createVehicle.isPending || updateVehicle.isPending}>
                        {editingVehicle ? "Atualizar" : "Criar"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Vehicles List */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredVehicles.map((vehicle) => (
              <Card key={vehicle.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Car className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex space-x-2">
                      <Select
                        value={vehicle.status}
                        onValueChange={(status) => toggleVehicleStatus.mutate({ id: vehicle.id, status })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="maintenance">Manutenção</SelectItem>
                          <SelectItem value="inactive">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(vehicle)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="text-lg text-gray-900 dark:text-gray-100">{vehicle.plate}</CardTitle>
                  <CardDescription className="text-sm text-gray-600 dark:text-gray-300">
                    {vehicle.brand} {vehicle.model} ({vehicle.year})
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Fuel className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>Combustível:</strong> {getFuelTypeLabel(vehicle.fuelType)}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Gauge className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>KM:</strong> {vehicle.mileage ? parseFloat(vehicle.mileage).toLocaleString("pt-BR") : "0"}
                    </span>
                  </div>

                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>Departamento:</strong> {getDepartmentName(vehicle.departmentId)}
                  </div>

                  {vehicle.lastMaintenance && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Última manutenção:</strong> {new Date(vehicle.lastMaintenance).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <Badge variant={getStatusBadgeVariant(vehicle.status)}>
                      {getStatusLabel(vehicle.status)}
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
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Nenhum veículo encontrado</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {searchTerm || departmentFilter !== "all" ? "Tente ajustar seus filtros" : "Comece adicionando um novo veículo"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </>
  );
}
