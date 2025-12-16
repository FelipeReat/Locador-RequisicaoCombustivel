import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import {
  insertUserManagementWithoutPasswordSchema,
  type User,
  type InsertUserManagement,
} from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import Header from "@/components/layout/header";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Shield,
  Mail,
  Phone,
  Briefcase,
} from "lucide-react";
import { Redirect, useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { useSystemSettings } from "@/contexts/system-settings-context";

function UserManagement() {
  const { user: currentUser } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { settings: systemSettings } = useSystemSettings();
  
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
    // Render a loading spinner or null while waiting for auth data
    return <LoadingSpinner message={t("loading-auth-data")} />;
  }

  if (!isAdminOrManager) {
    return null; // Will redirect in useEffect
  }


  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const form = useForm<Omit<InsertUserManagement, 'password'>>({
    resolver: zodResolver(insertUserManagementWithoutPasswordSchema),
    defaultValues: {
      username: "",
      email: "",
      fullName: "",
      phone: "",
      position: "",
      role: "employee",
    },
  });

  const createUser = useMutation({
    mutationFn: async (data: Omit<InsertUserManagement, 'password'>) => {
      // Add default password for new users
      const userData = { ...data, password: "blomaq123" };
      const response = await apiRequest("POST", "/api/users", userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      // Invalida cache das requisições para atualizar dados do usuário nos PDFs
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({
        title: t("success"),
        description: t("user-created-success"),
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: t("error"),
        description: error.message || t("error-creating-user"),
        variant: "destructive",
      });
    },
  });

  const updateUser = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<Omit<InsertUserManagement, 'password'>>;
    }) => {
      const response = await apiRequest("PUT", `/api/users/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      // Invalida cache das requisições para atualizar dados do usuário nos PDFs
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({
        title: t("success"),
        description: t("user-updated-success"),
      });
      setIsDialogOpen(false);
      setEditingUser(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: t("error"),
        description: error.message || t("error-updating-user"),
        variant: "destructive",
      });
    },
  });

  const toggleUserStatus = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/users/${id}/status`,
        { active: active }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao alterar status do usuário');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: t("success"),
        description: t("user-status-changed"),
      });
    },
    onError: (error) => {
      toast({
        title: t("error"),
        description: error.message || t("error-changing-user-status"),
        variant: "destructive",
      });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/users/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao excluir usuário');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: t("success"),
        description: t("user-deleted-success"),
      });
    },
    onError: (error) => {
      toast({
        title: t("error"),
        description: error.message || t("error-deleting-user"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: Omit<InsertUserManagement, 'password'>) => {
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
      email: user.email || "",
      fullName: user.fullName || "",
      phone: user.phone || "",
      position: user.position || "",
      role: user.role as "admin" | "manager" | "employee" | "driver",
    });
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setEditingUser(null);
    // Clear form completely
    form.reset();
    // Set default values after reset
    setTimeout(() => {
      form.reset({
        username: "",
        email: "",
        fullName: "",
        phone: "",
        position: "",
        role: "employee",
      });
    }, 0);
    setIsDialogOpen(true);
  };

  const filteredUsers =
    users?.filter(
      (user) =>
        user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => (a.fullName || a.username).localeCompare(b.fullName || b.username, 'pt-BR')) || [];

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: t("administrator"),
      manager: t("manager"),
      employee: t("employee"),
      driver: "Motorista",
    };
    return labels[role as keyof typeof labels] || role;
  };

  const getRoleBadgeVariant = (role: string): "default" | "destructive" | "secondary" => {
    const variants = {
      admin: "destructive" as const,
      manager: "default" as const,
      employee: "secondary" as const,
      driver: "secondary" as const,
    };
    return variants[role as keyof typeof variants] || "secondary";
  };

  if (usersLoading) {
    return <LoadingSpinner message={t("loading-users")} />;
  }

  return (
    <>
      <Header
        title={t("user-management")}
        subtitle={t("manage-employees-permissions")}
      />

      <main className="flex-1 mobile-content py-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={t("search-users")}
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
                  {t("new-user")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingUser ? t("edit-user") : t("new-user")}
                  </DialogTitle>
                  <DialogDescription>
                    {editingUser ? t("update-user-info") : t("add-new-user")}
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("username")} *</FormLabel>
                          <FormControl>
                            <Input placeholder={t("username")} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("full-name")} *</FormLabel>
                          <FormControl>
                            <Input placeholder={t("full-name")} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("email")}</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder={t("email")}
                                {...field}
                              />
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
                            <FormLabel>{t("phone")}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="(11) 99999-9999"
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, '');
                                  let formattedValue = value;

                                  if (value.length > 2) {
                                    formattedValue = '(' + value.slice(0, 2) + ') ' + value.slice(2);
                                  }
                                  if (value.length > 7) {
                                    formattedValue = '(' + value.slice(0, 2) + ') ' + value.slice(2, 7) + '-' + value.slice(7, 11);
                                  }

                                  field.onChange(formattedValue);
                                }}
                                maxLength={15}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="position"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("position")} *</FormLabel>
                            <FormControl>
                              <Input placeholder={t("position")} {...field} />
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
                            <FormLabel>{t("role")} *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("select-option")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="employee">{t("employee")}</SelectItem>
                                <SelectItem value="manager">{t("manager")}</SelectItem>
                                <SelectItem value="admin">{t("administrator")}</SelectItem>
                                <SelectItem value="driver">Motorista</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>



                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        {t("cancel")}
                      </Button>
                      <Button
                        type="submit"
                        disabled={createUser.isPending || updateUser.isPending}
                      >
                        {editingUser ? t("update") : t("create")}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Users List */}
          <div className="space-y-4">
            <div className="text-center text-sm text-muted-foreground mb-6">
              Usuários ordenados alfabeticamente ({filteredUsers.length} total)
            </div>
            {paginatedUsers.map((user) => (
              <Card key={user.id} className="hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col space-y-6">
                    {/* Header com Avatar e Info Principal */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/30 rounded-full flex items-center justify-center ring-4 ring-primary/10 shadow-lg">
                          <Users className="h-8 w-8 text-primary" />
                        </div>
                        <div className="text-center sm:text-left">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                            {user.fullName}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                            @{user.username}
                          </p>
                          <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2">
                            <Badge
                              variant={getRoleBadgeVariant(user.role)}
                              className="text-xs font-medium px-3 py-1"
                            >
                              <Shield className="w-3 h-3 mr-1" />
                              {getRoleLabel(user.role)}
                            </Badge>
                            <Badge
                              variant={user.active === "true" ? "default" : "secondary"}
                              className="text-xs px-3 py-1"
                            >
                              {user.active === "true" ? (
                                <>✓ {t("active")}</>
                              ) : (
                                <>✗ {t("inactive")}</>
                              )}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-center sm:justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            toggleUserStatus.mutate({
                              id: user.id,
                              active: user.active !== "true",
                            })
                          }
                          className={`px-4 py-2 rounded-lg transition-colors ${user.active === "true" ? 'hover:bg-orange-100 hover:text-orange-600 dark:hover:bg-orange-900/20' : 'hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900/20'}`}
                          title={user.active === "true" ? "Desativar usuário" : "Ativar usuário"}
                        >
                          {user.active === "true" ? (
                            <UserX className="h-4 w-4" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(user)}
                          className="px-4 py-2 rounded-lg hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/20 transition-colors"
                          title="Editar usuário"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(t("confirm-delete-user"))) {
                              deleteUser.mutate(user.id);
                            }
                          }}
                          className="px-4 py-2 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                          title="Excluir usuário"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Informações Detalhadas */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700/50 text-center">
                        <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                        <p className="font-semibold text-blue-800 dark:text-blue-300 text-xs uppercase tracking-wider mb-1">
                          {t("email")}
                        </p>
                        <p className="text-blue-900 dark:text-blue-100 font-medium break-all">
                          {user.email || <span className="text-blue-500 dark:text-blue-400 italic">Não informado</span>}
                        </p>
                      </div>

                      <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700/50 text-center">
                        <Briefcase className="h-5 w-5 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                        <p className="font-semibold text-purple-800 dark:text-purple-300 text-xs uppercase tracking-wider mb-1">
                          {t("position")}
                        </p>
                        <p className="text-purple-900 dark:text-purple-100 font-medium">
                          {user.position || <span className="text-purple-500 dark:text-purple-400 italic">Não informado</span>}
                        </p>
                      </div>

                      <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg border border-green-200 dark:border-green-700/50 text-center">
                        <Phone className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto mb-2" />
                        <p className="font-semibold text-green-800 dark:text-green-300 text-xs uppercase tracking-wider mb-1">
                          {t("phone")}
                        </p>
                        <p className="text-green-900 dark:text-green-100 font-medium">
                          {user.phone || <span className="text-green-500 dark:text-green-400 italic">Não informado</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <Card className="border-dashed border-2 border-gray-300 dark:border-gray-600">
              <CardContent className="p-16 text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-primary/5">
                  <Users className="h-10 w-10 text-primary/60" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  {t("no-users-found")}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
                  {searchTerm ? t("adjust-search") : t("start-creating-user")}
                </p>
                {!searchTerm && (
                  <Button onClick={handleNew} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    {t("new-user")}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {filteredUsers.length > itemsPerPage && (
            <div className="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Mostrando <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> a{' '}
                <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> de{' '}
                <span className="font-medium">{filteredUsers.length}</span> usuários
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

export default UserManagement;