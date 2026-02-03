import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { insertVehicleTypeSchema, type VehicleType, type InsertVehicleType, type ChecklistTemplate } from "@shared/schema";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  Edit, 
  Search,
  Trash2,
  Power,
  Truck
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Redirect } from "wouter";

export default function VehicleTypes() {
  const { user: currentUser } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<VehicleType | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const isAdminOrManager = currentUser?.role === "admin" || currentUser?.role === "manager";

  if (currentUser && !isAdminOrManager) {
    return <Redirect to="/dashboard" />;
  }

  const { data: vehicleTypes, isLoading } = useQuery<VehicleType[]>({
    queryKey: ["/api/vehicle-types"],
  });

  const { data: checklistTemplates } = useQuery<ChecklistTemplate[]>({
    queryKey: ["/api/checklist-templates"],
  });

  const form = useForm<InsertVehicleType>({
    resolver: zodResolver(insertVehicleTypeSchema),
    defaultValues: {
      name: "",
      description: "",
      checklistTemplateId: null,
    },
  });

  useEffect(() => {
    if (editingType) {
      form.reset({
        name: editingType.name,
        description: editingType.description || "",
        checklistTemplateId: editingType.checklistTemplateId,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        checklistTemplateId: null,
      });
    }
  }, [editingType, form]);

  const mutation = useMutation({
    mutationFn: async (data: InsertVehicleType) => {
      if (editingType) {
        return apiRequest("PUT", `/api/vehicle-types/${editingType.id}`, data);
      } else {
        return apiRequest("POST", "/api/vehicle-types", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-types"] });
      setIsDialogOpen(false);
      setEditingType(null);
      form.reset();
      toast({
        title: "Sucesso",
        description: editingType ? "Tipo de veículo atualizado com sucesso." : "Tipo de veículo criado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      return apiRequest("PATCH", `/api/vehicle-types/${id}/status`, { active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-types"] });
      toast({
        title: "Sucesso",
        description: "Status alterado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/vehicle-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-types"] });
      toast({
        title: "Sucesso",
        description: "Tipo de veículo excluído com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredTypes = vehicleTypes?.filter((type) =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onSubmit = (data: InsertVehicleType) => {
    mutation.mutate(data);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header 
        title="Tipos de Veículos" 
        subtitle="Gerencie as categorias e tipos de veículos da frota"
      />
      
      <main className="container mx-auto px-4 pt-24 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Truck className="h-8 w-8 text-primary" />
              Tipos de Veículos
            </h1>
            <p className="text-gray-500 mt-1">
              Gerencie as categorias e tipos de veículos da frota
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingType(null);
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white shadow-sm">
                <Plus className="h-4 w-4 mr-2" />
                Novo Tipo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingType ? "Editar Tipo de Veículo" : "Novo Tipo de Veículo"}</DialogTitle>
                <DialogDescription>
                  Preencha os dados do tipo de veículo abaixo.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Caminhão, Carro de Passeio, Motocicleta" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="checklistTemplateId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template de Checklist</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value === "null" ? null : Number(value))} 
                          value={field.value === null || field.value === undefined ? "null" : field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um template (opcional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="null">Nenhum (Padrão)</SelectItem>
                            {checklistTemplates?.filter(t => t.active).map((template) => (
                              <SelectItem key={template.id} value={template.id.toString()}>
                                {template.name}
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
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Input placeholder="Breve descrição do tipo de veículo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                      {mutation.isPending && <LoadingSpinner className="mr-2 h-4 w-4" />}
                      {editingType ? "Salvar Alterações" : "Criar Tipo"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-none shadow-md bg-white/80 backdrop-blur">
          <CardHeader className="pb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar por nome ou descrição..."
                className="pl-9 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredTypes && filteredTypes.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredTypes.map((type) => (
                    <Card key={type.id} className="overflow-hidden transition-all hover:shadow-md border-l-4" style={{ borderLeftColor: type.active ? '#10b981' : '#ef4444' }}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{type.name}</h3>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {type.description || "Sem descrição"}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                              <span className="font-medium text-xs uppercase tracking-wider text-gray-400">Template:</span>
                              <Badge variant="outline" className="font-normal">
                                {checklistTemplates?.find(t => t.id === type.checklistTemplateId)?.name || "Padrão"}
                              </Badge>
                            </div>
                          </div>
                          <Badge variant={type.active ? "default" : "destructive"}>
                            {type.active ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                        
                        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setEditingType(type);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4 text-blue-600" />
                          </Button>
                          
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => toggleStatusMutation.mutate({ id: type.id, active: !type.active })}
                            title={type.active ? "Desativar" : "Ativar"}
                          >
                            <Power className={`h-4 w-4 ${type.active ? "text-orange-500" : "text-green-500"}`} />
                          </Button>

                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              if (confirm("Tem certeza que deseja excluir permanentemente este tipo de veículo?")) {
                                deleteMutation.mutate(type.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Truck className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p>Nenhum tipo de veículo encontrado.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
