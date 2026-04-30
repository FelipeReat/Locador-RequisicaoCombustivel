
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import { Pencil, Trash2, Plus, Search, Building2, UserRound, Phone, MapPin } from "lucide-react";
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

  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertSupplier) => {
      const response = await apiRequest("POST", "/api/suppliers", data);
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
      const response = await apiRequest("PUT", `/api/suppliers/${id}`, data);
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
      const response = await apiRequest("DELETE", `/api/suppliers/${id}`);
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
  const suppliersWithPhone = suppliers.filter((supplier) => supplier.phone).length;
  const suppliersWithAddress = suppliers.filter((supplier) => supplier.address).length;

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
      <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-zinc-700 via-stone-700 to-amber-600 text-white shadow-sm">
        <div className="p-6 space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="text-sm text-white/75">Rede de abastecimento</div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Building2 className="h-8 w-8 text-white" />
                {t('suppliers')}
              </h1>
              <p className="max-w-2xl text-sm text-white/80">{t('supplier-management')}</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white text-amber-700 hover:bg-white/90 shadow-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('new-supplier')}
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

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
            <div className="relative w-full xl:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
              <Input
                placeholder={t('search-suppliers')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-white/15 bg-white/10 pl-10 text-white placeholder:text-white/55"
              />
            </div>
            <div className="grid gap-px overflow-hidden rounded-xl bg-white/10 sm:grid-cols-3">
              <div className="bg-white/5 p-4">
                <div className="text-xs text-white/70">Fornecedores</div>
                <div className="mt-1 text-2xl font-semibold">{suppliers.length}</div>
              </div>
              <div className="bg-white/5 p-4">
                <div className="text-xs text-white/70">Com telefone</div>
                <div className="mt-1 text-2xl font-semibold">{suppliersWithPhone}</div>
              </div>
              <div className="bg-white/5 p-4">
                <div className="text-xs text-white/70">Com endereço</div>
                <div className="mt-1 text-2xl font-semibold">{suppliersWithAddress}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden border-muted/60">
        <CardHeader className="mobile-card border-b bg-gradient-to-r from-zinc-50 via-background to-amber-50 dark:from-zinc-900/40 dark:via-background dark:to-amber-950/20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="mobile-text-lg">{t('suppliers-list')}</CardTitle>
              <CardDescription className="mobile-text-sm">
                Lista ordenada por nome fantasia com dados principais e ações rápidas.
              </CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">{filteredSuppliers.length} resultado(s)</div>
          </div>
        </CardHeader>
        <CardContent className="mobile-card pt-0">
          <div className="mobile-table-container rounded-xl border mt-6">
            <Table>
              <TableHeader className="bg-zinc-100 dark:bg-zinc-800">
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
                        <div className="rounded-full bg-amber-100 dark:bg-amber-950/20 p-4">
                          <Building2 className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                        </div>
                        <p className="text-lg font-medium">{t('no-suppliers')}</p>
                        <p className="text-sm">Adicione fornecedores para começar</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSuppliers.map((supplier, index) => (
                    <TableRow key={supplier.id} className={`transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800 ${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-zinc-50/60 dark:bg-zinc-900/60'}`}>
                      <TableCell className="font-medium text-gray-900 dark:text-gray-100 py-4">
                        <div className="space-y-1">
                          <div>{supplier.fantasia}</div>
                          <div className="text-xs text-muted-foreground">{supplier.name}</div>
                        </div>
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
                            className="h-8 w-8 p-0 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
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
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border bg-zinc-50/80 dark:bg-zinc-900/40 p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UserRound className="h-4 w-4 text-amber-600" />
                Contato principal
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-zinc-500" />
                Telefone opcional
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-zinc-500" />
                Endereço opcional
              </div>
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
