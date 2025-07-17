
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { insertUserManagementSchema, type User, type InsertUserManagement, type Department } from "@shared/schema";
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
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  UserCheck,
  UserX,
  Shield
} from "lucide-react";

export default function UserManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { t } = useLanguage();

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: departments } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const form = useForm<InsertUserManagement>({
    resolver: zodResolver(insertUserManagementSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      fullName: "",
      departmentId: 0,
      phone: "",
      position: "",
      role: "employee",
      hireDate: "",
    },
  });

  const createUser = useMutation({
    mutationFn: async (data: InsertUserManagement) => {
      const response = await apiRequest("POST", "/api/users", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: t("success"),
        description: "Usuário criado com sucesso",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: t("error"),
        description: error.message || "Erro ao criar usuário",
        variant: "destructive",
      });
    },
  });

  const updateUser = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertUserManagement> }) => {
      const response = await apiRequest("PUT", `/api/users/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: t("success"),
        description: "Usuário atualizado com sucesso",
      });
      setIsDialogOpen(false);
      setEditingUser(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: t("error"),
        description: error.message || "Erro ao atualizar usuário",
        variant: "destructive",
      });
    },
  });

  const toggleUserStatus = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      const response = await apiRequest("PATCH", `/api/users/${id}/status`, { active: active.toString() });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: t("success"),
        description: "Status do usuário alterado com sucesso",
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

  const onSubmit = (data: InsertUserManagement) => {
    if (editingUser) {
      updateUser.mutate({ id: editingUser.id, data });
    } else {
      createUser.mutate(data);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.reset({
      username: user.username,
      password: "",
      email: user.email || "",
      fullName: user.fullName || "",
      departmentId: user.departmentId || 0,
      phone: user.phone || "",
      position: user.position || "",
      role: user.role as "admin" | "manager" | "employee",
      hireDate: user.hireDate || "",
    });
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setEditingUser(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const filteredUsers = users?.filter(user =>
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: "Administrador",
      manager: "Gerente", 
      employee: "Funcionário",
    };
    return labels[role as keyof typeof labels] || role;
  };

  const getRoleBadgeVariant = (role: string) => {
    const variants = {
      admin: "destructive",
      manager: "default",
      employee: "secondary",
    };
    return variants[role as keyof typeof variants] || "secondary";
  };

  const getDepartmentName = (departmentId: number | null) => {
    if (!departmentId) return "Sem departamento";
    const dept = departments?.find(d => d.id === departmentId);
    return dept?.name || "Departamento não encontrado";
  };

  if (usersLoading) {
    return <LoadingSpinner message="Carregando usuários..." />;
  }

  return (
    <>
      <Header 
        title="Gestão de Usuários" 
        subtitle="Gerencie funcionários e suas permissões no sistema" 
      />

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Actions Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar usuários..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleNew}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Usuário
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingUser ? "Editar Usuário" : "Novo Usuário"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingUser ? "Atualize as informações do usuário" : "Adicione um novo usuário ao sistema"}
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome de usuário *</FormLabel>
                            <FormControl>
                              <Input placeholder="Digite o nome de usuário" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{editingUser ? "Nova senha (deixe vazio para manter)" : "Senha *"}</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Digite a senha" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome completo *</FormLabel>
                          <FormControl>
                            <Input placeholder="Digite o nome completo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Digite o email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input placeholder="Digite o telefone" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
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
                        name="position"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cargo *</FormLabel>
                            <FormControl>
                              <Input placeholder="Digite o cargo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Perfil *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="employee">Funcionário</SelectItem>
                                <SelectItem value="manager">Gerente</SelectItem>
                                <SelectItem value="admin">Administrador</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="hireDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de contratação</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={createUser.isPending || updateUser.isPending}>
                        {editingUser ? "Atualizar" : "Criar"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Users List */}
          <div className="grid gap-4">
            {filteredUsers.map((user) => (
              <Card key={user.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{user.fullName}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">@{user.username}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                            <Shield className="w-3 h-3 mr-1" />
                            {getRoleLabel(user.role)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {getDepartmentName(user.departmentId)}
                          </Badge>
                          <Badge variant={user.active === "true" ? "default" : "secondary"} className="text-xs">
                            {user.active === "true" ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="text-right text-sm text-gray-600 dark:text-gray-300 mr-4">
                        <p><strong>Email:</strong> {user.email || "Não informado"}</p>
                        <p><strong>Cargo:</strong> {user.position || "Não informado"}</p>
                        <p><strong>Telefone:</strong> {user.phone || "Não informado"}</p>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleUserStatus.mutate({ 
                          id: user.id, 
                          active: user.active !== "true" 
                        })}
                      >
                        {user.active === "true" ? (
                          <UserX className="h-4 w-4" />
                        ) : (
                          <UserCheck className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Nenhum usuário encontrado</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {searchTerm ? "Tente ajustar sua busca" : "Comece criando um novo usuário"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </>
  );
}
