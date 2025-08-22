
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import type { Supplier, InsertSupplier } from "@shared/schema";

export default function Suppliers() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState<InsertSupplier>({
    name: "",
    fantasia: "",
    cnpj: "",
    responsavel: "",
    phone: "",
    address: "",
  });

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["/api/suppliers"],
    queryFn: async () => {
      const response = await fetch("/api/suppliers");
      if (!response.ok) throw new Error("Erro ao buscar fornecedores");
      return response.json() as Promise<Supplier[]>;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertSupplier) => {
      const response = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Erro ao criar fornecedor");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      // Invalida cache das requisições para atualizar dados do fornecedor nos PDFs
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: t("success"),
        description: t("supplier-created"),
      });
    },
    onError: () => {
      toast({
        title: t("error"),
        description: t("error-creating-supplier"),
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertSupplier> }) => {
      const response = await fetch(`/api/suppliers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Erro ao atualizar fornecedor");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      // Invalida cache das requisições para atualizar dados do fornecedor nos PDFs
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsEditDialogOpen(false);
      setEditingSupplier(null);
      resetForm();
      toast({
        title: t("success"),
        description: t("supplier-updated"),
      });
    },
    onError: () => {
      toast({
        title: t("error"),
        description: t("error-updating-supplier"),
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/suppliers/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Erro ao excluir fornecedor");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({
        title: t("success"),
        description: t("supplier-deleted"),
      });
    },
    onError: () => {
      toast({
        title: t("error"),
        description: t("error-deleting-supplier"),
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      fantasia: "",
      cnpj: "",
      responsavel: "",
      phone: "",
      address: "",
    });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      fantasia: supplier.fantasia,
      cnpj: supplier.cnpj,
      responsavel: supplier.responsavel,
      phone: supplier.phone || "",
      address: supplier.address || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier) return;
    updateMutation.mutate({ id: editingSupplier.id, data: formData });
  };

  const handleDelete = (id: number) => {
    if (confirm(t('confirm-delete'))) {
      deleteMutation.mutate(id);
    }
  };

  const filteredSuppliers = suppliers
    .filter(supplier =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.fantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.cnpj.includes(searchTerm) ||
      supplier.responsavel.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.fantasia.localeCompare(b.fantasia, 'pt-BR'));

  const formatCNPJ = (cnpj: string) => {
    const cleaned = cnpj.replace(/\D/g, "");
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    return phone;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-content space-y-4 lg:space-y-6">
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0 ml-12 sm:ml-0">
          <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white truncate">{t('suppliers')}</h1>
          <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-300 mt-1 hidden sm:block">{t('supplier-management')}</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0 h-8 sm:h-10">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{t('new-supplier')}</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="mobile-container max-w-lg">
            <DialogHeader>
              <DialogTitle>{t('new-supplier')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('supplier-name')} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome empresarial completo"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fantasia">{t('supplier-fantasia')} *</Label>
                <Input
                  id="fantasia"
                  value={formData.fantasia}
                  onChange={(e) => setFormData(prev => ({ ...prev, fantasia: e.target.value }))}
                  placeholder="Nome fantasia do posto"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">{t('supplier-cnpj')} *</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    let formattedValue = value;

                    if (value.length > 2) {
                      formattedValue = value.slice(0, 2) + '.' + value.slice(2);
                    }
                    if (value.length > 5) {
                      formattedValue = value.slice(0, 2) + '.' + value.slice(2, 5) + '.' + value.slice(5);
                    }
                    if (value.length > 8) {
                      formattedValue = value.slice(0, 2) + '.' + value.slice(2, 5) + '.' + value.slice(5, 8) + '/' + value.slice(8);
                    }
                    if (value.length > 12) {
                      formattedValue = value.slice(0, 2) + '.' + value.slice(2, 5) + '.' + value.slice(5, 8) + '/' + value.slice(8, 12) + '-' + value.slice(12, 14);
                    }

                    setFormData(prev => ({ ...prev, cnpj: formattedValue }));
                  }}
                  placeholder="00.000.000/0000-00"
                  required
                  maxLength={18}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="responsavel">{t('supplier-responsible')} *</Label>
                <Input
                  id="responsavel"
                  value={formData.responsavel}
                  onChange={(e) => setFormData(prev => ({ ...prev, responsavel: e.target.value }))}
                  placeholder={t('supplier-responsible')}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">{t('supplier-phone')}</Label>
                <Input
                  id="phone"
                  value={formData.phone || ""}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    let formattedValue = value;

                    if (value.length > 2) {
                      formattedValue = '(' + value.slice(0, 2) + ') ' + value.slice(2);
                    }
                    if (value.length > 7) {
                      formattedValue = '(' + value.slice(0, 2) + ') ' + value.slice(2, 7) + '-' + value.slice(7, 11);
                    }

                    setFormData(prev => ({ ...prev, phone: formattedValue }));
                  }}
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">{t('supplier-address')}</Label>
                <Input
                  id="address"
                  value={formData.address || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder={t('supplier-address')}
                />
              </div>
              <div className="mobile-button-group pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="w-full sm:w-auto">
                  {t('cancel')}
                </Button>
                <Button type="submit" disabled={createMutation.isPending} className="w-full sm:w-auto">
                  {createMutation.isPending ? t('loading') : t('create')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="mobile-card">
          <CardTitle className="mobile-text-lg">{t('suppliers-list')}</CardTitle>
          <CardDescription className="mobile-text-sm">
            {t('supplier-management')}
          </CardDescription>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('search-suppliers')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent className="mobile-card pt-0">
          <div className="mobile-table-container">
            <Table>
              <TableHeader>
                <TableRow className="border-b-2">
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                    {t('supplier-fantasia')} 
                    <span className="text-xs text-muted-foreground ml-1">(A-Z)</span>
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">{t('supplier-cnpj')}</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">{t('supplier-responsible')}</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">{t('supplier-phone')}</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300 text-center">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                      <div className="flex flex-col items-center space-y-2">
                        <div className="text-4xl">📋</div>
                        <p className="text-lg font-medium">{t('no-suppliers')}</p>
                        <p className="text-sm">Adicione fornecedores para começar</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSuppliers.map((supplier, index) => (
                    <TableRow key={supplier.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${index % 2 === 0 ? 'bg-gray-25 dark:bg-gray-900/20' : ''}`}>
                      <TableCell className="font-medium text-gray-900 dark:text-gray-100 py-4">
                        {supplier.fantasia}
                      </TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300 font-mono text-sm">
                        {formatCNPJ(supplier.cnpj)}
                      </TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">
                        {supplier.responsavel}
                      </TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300 font-mono text-sm">
                        {supplier.phone ? formatPhone(supplier.phone) : <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(supplier)}
                            className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                            title="Editar fornecedor"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(supplier.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                            title="Excluir fornecedor"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="mobile-container max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('edit-supplier')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">{t('supplier-name')} *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome empresarial completo"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-fantasia">{t('supplier-fantasia')} *</Label>
              <Input
                id="edit-fantasia"
                value={formData.fantasia}
                onChange={(e) => setFormData(prev => ({ ...prev, fantasia: e.target.value }))}
                placeholder="Nome fantasia do posto"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cnpj">{t('supplier-cnpj')} *</Label>
              <Input
                id="edit-cnpj"
                value={formData.cnpj}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  let formattedValue = value;

                  if (value.length > 2) {
                    formattedValue = value.slice(0, 2) + '.' + value.slice(2);
                  }
                  if (value.length > 5) {
                    formattedValue = value.slice(0, 2) + '.' + value.slice(2, 5) + '.' + value.slice(5);
                  }
                  if (value.length > 8) {
                    formattedValue = value.slice(0, 2) + '.' + value.slice(2, 5) + '.' + value.slice(5, 8) + '/' + value.slice(8);
                  }
                  if (value.length > 12) {
                    formattedValue = value.slice(0, 2) + '.' + value.slice(2, 5) + '.' + value.slice(5, 8) + '/' + value.slice(8, 12) + '-' + value.slice(12, 14);
                  }

                  setFormData(prev => ({ ...prev, cnpj: formattedValue }));
                }}
                placeholder="00.000.000/0000-00"
                required
                maxLength={18}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-responsavel">{t('supplier-responsible')} *</Label>
              <Input
                id="edit-responsavel"
                value={formData.responsavel}
                onChange={(e) => setFormData(prev => ({ ...prev, responsavel: e.target.value }))}
                placeholder={t('supplier-responsible')}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-phone">{t('supplier-phone')}</Label>
              <Input
                id="edit-phone"
                value={formData.phone || ""}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  let formattedValue = value;

                  if (value.length > 2) {
                    formattedValue = '(' + value.slice(0, 2) + ') ' + value.slice(2);
                  }
                  if (value.length > 7) {
                    formattedValue = '(' + value.slice(0, 2) + ') ' + value.slice(2, 7) + '-' + value.slice(7, 11);
                  }

                  setFormData(prev => ({ ...prev, phone: formattedValue }));
                }}
                placeholder="(11) 99999-9999"
                maxLength={15}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">{t('supplier-address')}</Label>
              <Input
                id="edit-address"
                value={formData.address || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder={t('supplier-address')}
              />
            </div>
            <div className="mobile-button-group pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} className="w-full sm:w-auto">
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={updateMutation.isPending} className="w-full sm:w-auto">
                {updateMutation.isPending ? t('loading') : t('update')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
