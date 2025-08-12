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

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.fantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.cnpj.includes(searchTerm) ||
    supplier.responsavel.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    return <div className="flex items-center justify-center min-h-screen">{t('loading')}</div>;
  }

  return (
    <div className="mobile-container space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white">{t('suppliers')}</h1>
          <p className="text-sm lg:text-base text-gray-600 dark:text-gray-300">{t('supplier-management')}</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{t('new-supplier')}</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{t('new-supplier')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
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
              </div>
              <div className="mobile-button-group">
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
        <CardHeader>
          <CardTitle>{t('suppliers-list')}</CardTitle>
          <CardDescription>
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
        <CardContent>
          <div className="mobile-table-container">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('supplier-fantasia')}</TableHead>
                  <TableHead>{t('supplier-cnpj')}</TableHead>
                  <TableHead>{t('supplier-responsible')}</TableHead>
                  <TableHead>{t('supplier-phone')}</TableHead>
                  <TableHead>{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      {t('no-suppliers')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.fantasia}</TableCell>
                      <TableCell>{formatCNPJ(supplier.cnpj)}</TableCell>
                      <TableCell>{supplier.responsavel}</TableCell>
                      <TableCell>{supplier.phone ? formatPhone(supplier.phone) : "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 lg:gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(supplier)}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="h-3 w-3 lg:h-4 lg:w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(supplier.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-3 w-3 lg:h-4 lg:w-4" />
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('edit-supplier')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
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
            </div>
            <div className="mobile-button-group">
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