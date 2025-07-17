import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import {
  insertDepartmentSchema,
  type Department,
  type InsertDepartment,
  type User,
} from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import Header from "@/components/layout/header";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Building, Plus, Edit, Search, Users, DollarSign } from "lucide-react";

export default function DepartmentManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const { t } = useLanguage();

  const { data: departments, isLoading: departmentsLoading } = useQuery<
    Department[]
  >({
    queryKey: ["/api/departments"],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const form = useForm<InsertDepartment>({
    resolver: zodResolver(insertDepartmentSchema),
    defaultValues: {
      name: "",
      description: "",
      managerId: undefined,
      budget: "",
    },
  });

  const createDepartment = useMutation({
    mutationFn: async (data: InsertDepartment) => {
      const response = await apiRequest("POST", "/api/departments", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      toast({
        title: t("success"),
        description: t("department_created_successfully"),
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: t("error"),
        description: error.message || t("error_creating_department"),
        variant: "destructive",
      });
    },
  });

  const updateDepartment = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<InsertDepartment>;
    }) => {
      const response = await apiRequest("PUT", `/api/departments/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      toast({
        title: t("success"),
        description: t("department_updated_successfully"),
      });
      setIsDialogOpen(false);
      setEditingDepartment(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: t("error"),
        description: error.message || t("error_updating_department"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertDepartment) => {
    if (editingDepartment) {
      updateDepartment.mutate({ id: editingDepartment.id, data });
    } else {
      createDepartment.mutate(data);
    }
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    form.reset({
      name: department.name,
      description: department.description || "",
      managerId: department.managerId || undefined,
      budget: department.budget || "",
    });
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setEditingDepartment(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const filteredDepartments =
    departments?.filter(
      (dept) =>
        dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.description?.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || [];

  const getManagerName = (managerId: number | null) => {
    if (!managerId) return t("no_manager");
    const manager = users?.find((u) => u.id === managerId);
    return manager?.fullName || t("manager_not_found");
  };

  const getDepartmentEmployeeCount = (departmentId: number) => {
    return (
      users?.filter(
        (u) => u.departmentId === departmentId && u.active === "true",
      ).length || 0
    );
  };

  if (departmentsLoading) {
    return <LoadingSpinner message={t("loading_departments")} />;
  }

  return (
    <>
      <Header
        title={t("department_management")}
        subtitle={t("manage_company_departments")}
      />

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Actions Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={t("search_departments")}
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
                  {t("new_department")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingDepartment
                      ? t("edit_department")
                      : t("new_department")}
                  </DialogTitle>
                  <DialogDescription>
                    {editingDepartment
                      ? t("update_department_info")
                      : t("add_new_department")}
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("department_name")} *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t("enter_department_name")}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("description")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("enter_department_description")}
                              {...field}
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="managerId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("manager")}</FormLabel>
                            <Select
                              onValueChange={(value) =>
                                field.onChange(Number(value))
                              }
                              value={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("select_manager")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="0">{t("no_manager")}</SelectItem>
                                {users
                                  ?.filter((u) => u.active === "true")
                                  .map((user) => (
                                    <SelectItem
                                      key={user.id}
                                      value={user.id.toString()}
                                    >
                                      {user.fullName}
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
                        name="budget"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("budget")} (R$)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                              />
                            </FormControl>
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
                        disabled={
                          createDepartment.isPending ||
                          updateDepartment.isPending
                        }
                      >
                        {editingDepartment ? t("update") : t("create")}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Departments List */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredDepartments.map((department) => (
              <Card
                key={department.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Building className="h-6 w-6 text-primary" />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(department)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardTitle className="text-lg text-gray-900 dark:text-gray-100">
                    {department.name}
                  </CardTitle>
                  {department.description && (
                    <CardDescription className="text-sm text-gray-600 dark:text-gray-300">
                      {department.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>{t("manager")}:</strong>{" "}
                      {getManagerName(department.managerId)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>{t("employees")}:</strong>{" "}
                      {getDepartmentEmployeeCount(department.id)}
                    </span>
                  </div>

                  {department.budget && (
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>{t("budget")}:</strong> R${" "}
                        {parseFloat(department.budget).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <Badge
                      variant={
                        department.active === "true" ? "default" : "secondary"
                      }
                    >
                      {department.active === "true" ? t("active") : t("inactive")}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredDepartments.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {t("no_departments_found")}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {searchTerm
                    ? t("try_adjusting_search")
                    : t("start_creating_new_department")}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </>
  );
}