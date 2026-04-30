
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import { Plus, Edit, Trash2, Building2, Search, Mail, Phone, UserRound } from "lucide-react";
import { CNPJInput } from "@/components/cnpj-input";
import { PhoneInput } from "@/components/phone-input";
import type { Company, InsertCompany } from "@shared/schema";

export default function Companies() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<Partial<InsertCompany>>({
    name: "",
    cnpj: "",
    fullName: "",
    contact: "",
    phone: "",
    email: "",
  });

  // Fetch companies
  const { data: companiesData = [], isLoading } = useQuery<Company[]>({
    queryKey: ["companies"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/companies");
      return response.json();
    },
  });

  // Sort companies alphabetically by name
  const companies = companiesData.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.cnpj.includes(searchTerm) ||
    company.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const activeCompanies = companies.filter((company) => company.active === "true").length;
  const companiesWithEmail = companies.filter((company) => company.email).length;

  const createMutation = useMutation({
    mutationFn: async (data: InsertCompany) => {
      const response = await apiRequest("POST", "/api/companies", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      // Invalida cache das requisições para atualizar dados da empresa nos PDFs
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: t("success"),
        description: t("company-created-success"),
      });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertCompany> }) => {
      const response = await apiRequest("PUT", `/api/companies/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      // Invalida cache das requisições para atualizar dados da empresa nos PDFs
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Sucesso",
        description: "Empresa atualizada com sucesso.",
      });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/companies/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast({
        title: "Sucesso",
        description: "Empresa removida com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      cnpj: "",
      fullName: "",
      contact: "",
      phone: "",
      email: "",
    });
    setEditingCompany(null);
    setIsModalOpen(false);
  };

  const handleEdit = (company: Company) => {
    setFormData({
      name: company.name,
      cnpj: company.cnpj,
      fullName: company.fullName,
      contact: company.phone, // Corrected to use phone for contact field in form
      phone: company.phone,
      email: company.email,
    });
    setEditingCompany(company);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingCompany) {
      updateMutation.mutate({ id: editingCompany.id, data: formData as InsertCompany });
    } else {
      createMutation.mutate(formData as InsertCompany);
    }
  };

  const handleInputChange = (field: keyof InsertCompany, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="mobile-content space-y-4 lg:space-y-6">
      <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-zinc-700 via-stone-700 to-amber-600 text-white shadow-sm">
        <div className="p-6 space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="text-sm text-white/75">Base de clientes</div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Building2 className="h-8 w-8 text-white" />
                {t("companies")}
              </h1>
              <p className="max-w-2xl text-sm text-white/80">
                {t("manage-client-companies")}
              </p>
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingCompany(null)} className="bg-white text-amber-700 hover:bg-white/90 shadow-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("new-company")}
                </Button>
              </DialogTrigger>

          <DialogContent className="mobile-container max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingCompany ? t("edit-company") : t("new-company")}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("name")} *</Label>
                <Input
                  id="name"
                  value={formData.name || ""}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Ex: BBM Serviços"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ *</Label>
                <CNPJInput
                  id="cnpj"
                  value={formData.cnpj || ""}
                  onChange={(e) => handleInputChange("cnpj", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">{t("company-full-name")} *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName || ""}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  placeholder="Nome completo da empresa"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact">{t("contact")} *</Label>
                <PhoneInput
                  id="contact"
                  value={formData.contact || ""}
                  onChange={(e) => handleInputChange("contact", e.target.value)}
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t("phone")} *</Label>
                <PhoneInput
                  id="phone"
                  value={formData.phone || ""}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("email")} *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="email@empresa.com"
                  required
                />
              </div>

              <div className="mobile-button-group pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="w-full sm:w-auto"
                >
                  {t("cancel")}
                </Button>
                <Button
                  type="submit"
                  className="w-full sm:w-auto"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingCompany ? t("update") : t("create")}
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
                placeholder="Buscar por nome, CNPJ ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-white/15 bg-white/10 pl-10 text-white placeholder:text-white/55"
              />
            </div>
            <div className="grid gap-px overflow-hidden rounded-xl bg-white/10 sm:grid-cols-3">
              <div className="bg-white/5 p-4">
                <div className="text-xs text-white/70">Empresas</div>
                <div className="mt-1 text-2xl font-semibold">{companies.length}</div>
              </div>
              <div className="bg-white/5 p-4">
                <div className="text-xs text-white/70">Ativas</div>
                <div className="mt-1 text-2xl font-semibold">{activeCompanies}</div>
              </div>
              <div className="bg-white/5 p-4">
                <div className="text-xs text-white/70">Com email</div>
                <div className="mt-1 text-2xl font-semibold">{companiesWithEmail}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Carregando empresas...</p>
          </div>
        </div>
      ) : (
        <>
        <Card className="overflow-hidden border-muted/60">
          <CardHeader className="border-b bg-gradient-to-r from-zinc-50 via-background to-amber-50 dark:from-zinc-900/40 dark:via-background dark:to-amber-950/20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Empresas cadastradas</CardTitle>
                <CardDescription>Visão rápida das empresas clientes com contatos e ações de manutenção.</CardDescription>
              </div>
              <div className="text-sm text-muted-foreground">{filteredCompanies.length} resultado(s)</div>
            </div>
          </CardHeader>
        </Card>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCompanies.map((company) => (
            <Card key={company.id} className="overflow-hidden border-muted/60 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
              <CardHeader className="pb-3 border-b bg-gradient-to-r from-zinc-50 via-background to-amber-50/70 dark:from-zinc-900/40 dark:via-background dark:to-amber-950/10">
                <div className="flex justify-between items-start">
                  <div className="min-w-0 flex-1 pr-2">
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate mb-1">
                      {company.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      CNPJ: {company.cnpj}
                    </p>
                  </div>
                  <Badge 
                    variant={company.active === "true" ? "default" : "secondary"} 
                    className="shrink-0 text-xs"
                  >
                    {company.active === "true" ? t("active") : t("inactive")}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-0 space-y-3">
                <div className="space-y-3 pt-4">
                  <div className="rounded-lg border bg-zinc-50/80 dark:bg-zinc-900/40 p-3">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">{t("company-full-name")}</div>
                    <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">{company.fullName}</div>
                  </div>

                  <div className="grid gap-2">
                    <div className="flex items-center gap-2 rounded-lg border bg-zinc-50/80 dark:bg-zinc-900/40 p-3 text-sm text-gray-700 dark:text-gray-300">
                      <UserRound className="h-4 w-4 text-amber-600" />
                      <span className="truncate">{company.contact}</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border bg-zinc-50/80 dark:bg-zinc-900/40 p-3 text-sm text-gray-700 dark:text-gray-300">
                      <Phone className="h-4 w-4 text-zinc-500" />
                      <span>{company.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border bg-zinc-50/80 dark:bg-zinc-900/40 p-3 text-sm text-gray-700 dark:text-gray-300">
                      <Mail className="h-4 w-4 text-zinc-500" />
                      <span className="truncate">{company.email}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(company)}
                    className="flex-1 text-xs"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMutation.mutate(company.id)}
                    className="text-red-600 hover:text-red-700 px-3"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        </>
      )}

      {filteredCompanies.length === 0 && !isLoading && (
        <Card className="border-dashed border-2 border-zinc-300 dark:border-zinc-700">
          <CardContent className="mobile-card text-center py-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/20">
              <Building2 className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-gray-700 dark:text-gray-300 font-medium">Nenhuma empresa encontrada.</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ajuste a busca ou cadastre uma nova empresa.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
