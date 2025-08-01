
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import { Save } from "lucide-react";

interface FuelPrices {
  gasolina: string;
  etanol: string;
  diesel: string;
  dieselS10: string;
}

interface EditValuesData {
  prices: FuelPrices;
  invoiceNumber: string;
}

export default function EditValues() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  
  const [formData, setFormData] = useState<EditValuesData>({
    prices: {
      gasolina: "",
      etanol: "",
      diesel: "",
      dieselS10: "",
    },
    invoiceNumber: "",
  });

  // Função para formatar preço
  const formatPrice = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length === 0) return "";
    if (cleaned.length === 1) return `0,0${cleaned}`;
    if (cleaned.length === 2) return `0,${cleaned}`;
    return `${cleaned.slice(0, -2)},${cleaned.slice(-2)}`;
  };

  // Função para limitar cupom fiscal a 6 dígitos
  const formatInvoiceNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    return cleaned.slice(0, 6);
  };

  const handlePriceChange = (fuelType: keyof FuelPrices, value: string) => {
    const formattedPrice = formatPrice(value);
    setFormData(prev => ({
      ...prev,
      prices: {
        ...prev.prices,
        [fuelType]: formattedPrice
      }
    }));
  };

  const handleInvoiceChange = (value: string) => {
    const formattedInvoice = formatInvoiceNumber(value);
    setFormData(prev => ({
      ...prev,
      invoiceNumber: formattedInvoice
    }));
  };

  const updateMutation = useMutation({
    mutationFn: async (data: EditValuesData) => {
      const response = await fetch("/api/fuel-values", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Erro ao atualizar valores");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Valores atualizados com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar valores",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <>
      <Header 
        title="Editar Valores" 
        subtitle="Configure preços de combustíveis e informações fiscais" 
      />

      <main className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Valores</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Preços dos Combustíveis */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Preços por Litro</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gasolina">Gasolina (R$)</Label>
                      <Input
                        id="gasolina"
                        value={formData.prices.gasolina}
                        onChange={(e) => handlePriceChange("gasolina", e.target.value)}
                        placeholder="0,00"
                        maxLength={6}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="etanol">Etanol (R$)</Label>
                      <Input
                        id="etanol"
                        value={formData.prices.etanol}
                        onChange={(e) => handlePriceChange("etanol", e.target.value)}
                        placeholder="0,00"
                        maxLength={6}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="diesel">Diesel (R$)</Label>
                      <Input
                        id="diesel"
                        value={formData.prices.diesel}
                        onChange={(e) => handlePriceChange("diesel", e.target.value)}
                        placeholder="0,00"
                        maxLength={6}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dieselS10">Diesel S10 (R$)</Label>
                      <Input
                        id="dieselS10"
                        value={formData.prices.dieselS10}
                        onChange={(e) => handlePriceChange("dieselS10", e.target.value)}
                        placeholder="0,00"
                        maxLength={6}
                      />
                    </div>
                  </div>
                </div>

                {/* Cupom da Nota Fiscal */}
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber">Cupom da Nota Fiscal</Label>
                  <Input
                    id="invoiceNumber"
                    value={formData.invoiceNumber}
                    onChange={(e) => handleInvoiceChange(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                  />
                  <p className="text-sm text-gray-500">Máximo 6 dígitos numéricos</p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={updateMutation.isPending}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
