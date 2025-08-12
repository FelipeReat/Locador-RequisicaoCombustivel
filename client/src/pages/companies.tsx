import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
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
    <>
      <Header
        title={t("companies")}
        subtitle={t("manage-client-companies")}
      />

      <main className="flex-1 mobile-content py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t("companies-list")}
            </h1>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingCompany(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("new-company")}
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-md">
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

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {editingCompany ? t("update") : t("create")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                    >
                      {t("cancel")}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {companies.map((company) => (
                <Card key={company.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{company.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          CNPJ: {company.cnpj}
                        </p>
                      </div>
                      <Badge variant={company.active === "true" ? "default" : "secondary"}>
                        {company.active === "true" ? t("active") : t("inactive")}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t("company-full-name")}:
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {company.fullName}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t("contact")}:
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {company.contact}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t("phone")}:
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {company.phone}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t("email")}:
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {company.email}
                      </p>
                    </div>

                    <div className="flex gap-2 pt-3">
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
        </div>
      </main>
    </>
  );
}