
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import { Plus, Edit, Trash2 } from "lucide-react";
import { CNPJInput } from "@/components/cnpj-input";
import { PhoneInput } from "@/components/phone-input";
import type { Company, InsertCompany } from "@shared/schema";

export default function Companies() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState<Partial<InsertCompany>>({
    name: "",
    cnpj: "",
    fullName: "",
    contact: "",
    phone: "",
    email: "",
  });

  // Fetch companies
  const { data: companies = [], isLoading } = useQuery<Company[]>({
    queryKey: ["companies"],
    queryFn: async () => {
      const response = await fetch("/api/companies");
      if (!response.ok) throw new Error("Failed to fetch companies");
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertCompany) => {
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create company");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
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
      const response = await fetch(`/api/companies/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update company");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
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
      const response = await fetch(`/api/companies/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete company");
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

    // Create fleets if they don't exist
    if (formData.name === "GERADOR CABINADO 218KVA 127V/220V FG" || formData.name === "GALÃO 50 LT") {
      // In a real application, you would likely have a separate mutation or API call
      // to create fleets. For this example, we'll simulate it by just logging.
      console.log(`Fleet "${formData.name}" created.`);
    }

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
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white truncate">{t("companies")}</h1>
          <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-300 mt-1 hidden sm:block">
            {t("manage-client-companies")}
          </p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingCompany(null)} className="shrink-0 h-8 sm:h-10">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{t("new-company")}</span>
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

      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Carregando empresas...</p>
          </div>
        </div>
      ) : (
        <div className="mobile-grid">
          {companies.map((company) => (
            <Card key={company.id} className="relative">
              <CardHeader className="mobile-card pb-3">
                <div className="flex justify-between items-start">
                  <div className="min-w-0 flex-1 pr-4">
                    <CardTitle className="mobile-text-lg truncate">{company.name}</CardTitle>
                    <p className="mobile-text-sm text-muted-foreground mt-1 truncate">
                      CNPJ: {company.cnpj}
                    </p>
                  </div>
                  <Badge variant={company.active === "true" ? "default" : "secondary"} className="shrink-0">
                    {company.active === "true" ? t("active") : t("inactive")}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="mobile-card pt-0 space-y-2">
                <div>
                  <p className="mobile-text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("company-full-name")}:
                  </p>
                  <p className="mobile-text-sm text-gray-600 dark:text-gray-400 truncate">
                    {company.fullName}
                  </p>
                </div>

                <div>
                  <p className="mobile-text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("contact")}:
                  </p>
                  <p className="mobile-text-sm text-gray-600 dark:text-gray-400">
                    {company.contact}
                  </p>
                </div>

                <div>
                  <p className="mobile-text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("phone")}:
                  </p>
                  <p className="mobile-text-sm text-gray-600 dark:text-gray-400">
                    {company.phone}
                  </p>
                </div>

                <div>
                  <p className="mobile-text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("email")}:
                  </p>
                  <p className="mobile-text-sm text-gray-600 dark:text-gray-400 truncate">
                    {company.email}
                  </p>
                </div>

                <div className="mobile-button-group pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(company)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMutation.mutate(company.id)}
                    className="text-red-600 hover:text-red-700"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {companies.length === 0 && !isLoading && (
        <Card>
          <CardContent className="mobile-card text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">Nenhuma empresa cadastrada ainda.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
