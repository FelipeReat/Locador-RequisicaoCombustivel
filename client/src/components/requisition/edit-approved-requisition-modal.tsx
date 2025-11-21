import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type FuelRequisition } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { MoneyInput } from "@/components/money-input";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Save, X } from "lucide-react";
import { useState, useEffect } from "react";

interface EditApprovedRequisitionModalProps {
  requisition: FuelRequisition | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditApprovedRequisitionModal({
  requisition,
  isOpen,
  onClose,
}: EditApprovedRequisitionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState("");
  const [pricePerLiter, setPricePerLiter] = useState("");
  const [discount, setDiscount] = useState("");
  const [fiscalCoupon, setFiscalCoupon] = useState("");

  useEffect(() => {
    if (requisition) {
      setQuantity(requisition.quantity || "");
      setPricePerLiter(requisition.pricePerLiter || "");
      setDiscount(requisition.discount || "");
      setFiscalCoupon(requisition.fiscalCoupon || "");
    }
  }, [requisition]);

  const updateRequisition = useMutation({
    mutationFn: async (data: { quantity: string; pricePerLiter: string; discount: string; fiscalCoupon: string }) => {
      const response = await apiRequest(
        "PUT",
        `/api/fuel-requisitions/${requisition?.id}`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-requisitions/stats"] });
      toast({
        title: "Sucesso",
        description: "Valores da requisição atualizados com sucesso!",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar os valores da requisição",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!quantity.trim()) {
      toast({
        title: "Erro",
        description: "A quantidade de litros é obrigatória",
        variant: "destructive",
      });
      return;
    }

    if (!pricePerLiter.trim()) {
      toast({
        title: "Erro",
        description: "O preço por litro é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (!fiscalCoupon.trim()) {
      toast({
        title: "Erro",
        description: "O cupom fiscal é obrigatório",
        variant: "destructive",
      });
      return;
    }

    const quantityNum = parseFloat(quantity.replace(",", "."));
    const priceNum = parseFloat(pricePerLiter.replace(",", "."));
    const discountNum = discount.trim() ? parseFloat(discount.replace(",", ".")) : 0;

    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast({
        title: "Erro",
        description: "Digite uma quantidade válida de litros",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(priceNum) || priceNum <= 0) {
      toast({
        title: "Erro",
        description: "Digite um preço válido por litro",
        variant: "destructive",
      });
      return;
    }

    if (discount.trim() && (isNaN(discountNum) || discountNum < 0)) {
      toast({
        title: "Erro",
        description: "Digite um valor de desconto válido",
        variant: "destructive",
      });
      return;
    }

    // Validar se o desconto não é maior que o valor total
    const totalValue = quantityNum * priceNum;
    if (discountNum > totalValue) {
      toast({
        title: "Erro",
        description: "O desconto não pode ser maior que o valor total da requisição",
        variant: "destructive",
      });
      return;
    }

    updateRequisition.mutate({
      quantity: quantityNum.toString(),
      pricePerLiter: priceNum.toString(),
      discount: discountNum.toString(),
      fiscalCoupon,
    });
  };

  const calculateTotal = () => {
    const quantityNum = parseFloat(quantity.replace(",", "."));
    const priceNum = parseFloat(pricePerLiter.replace(",", "."));
    const discountNum = discount.trim() ? parseFloat(discount.replace(",", ".")) : 0;

    if (!isNaN(quantityNum) && !isNaN(priceNum)) {
      const total = (quantityNum * priceNum) - discountNum;
      return Math.max(0, total).toFixed(2).replace(".", ",");
    }
    return "0,00";
  };

  if (!requisition) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">
            Editar Valores - REQ{String(requisition.id).padStart(3, "0")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Quantidade Real de Litros *
            </Label>
            <Input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Ex: 50"
              className="w-full"
              type="number"
              min="0"
              step="0.01"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Informe a quantidade real abastecida
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Preço por Litro (R$) *
            </Label>
            <MoneyInput
              value={pricePerLiter}
              onChange={(value) => setPricePerLiter(value)}
              placeholder="Ex: 5,89"
              className="w-full"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Valor pago por litro de combustível
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Desconto (R$)
            </Label>
            <MoneyInput
              value={discount}
              onChange={(value) => setDiscount(value)}
              placeholder="Ex: 10,00"
              className="w-full"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Valor do desconto a ser subtraído do total (opcional)
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Cupom da Nota Fiscal *
            </Label>
            <Input
              value={fiscalCoupon}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                if (value.length <= 12) {
                  setFiscalCoupon(value);
                }
              }}
              placeholder="Ex: 123456789012"
              className="w-full"
              maxLength={12}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Número do cupom fiscal obrigatório (máximo 12 dígitos)
            </p>
          </div>

          {quantity && pricePerLiter && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Valor Total:
                </span>
                <span className="text-lg font-bold text-blue-800 dark:text-blue-200">
                  R$ {calculateTotal()}
                </span>
              </div>
            </div>
          )}

          <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
            <strong>Importante:</strong> Estes valores serão usados nos relatórios de consumo 
            e análises financeiras. Certifique-se de que estão corretos.
          </div>
        </div>

        <DialogFooter className="flex space-x-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={updateRequisition.isPending}
          >
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>

          <Button
            onClick={handleSave}
            disabled={updateRequisition.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {updateRequisition.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Valores
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EditApprovedRequisitionModal;