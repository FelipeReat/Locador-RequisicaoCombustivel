import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RotateCcw, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface MileageResetDialogProps {
  vehicleId: number;
  currentMileage: string;
  trigger: React.ReactNode;
}

export function MileageResetDialog({ vehicleId, currentMileage, trigger }: MileageResetDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newMileage, setNewMileage] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const resetMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/vehicles/${vehicleId}/mileage`, {
        mileage: newMileage,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({
        title: "Quilometragem Atualizada",
        description: `A quilometragem foi redefinida para ${newMileage} km.`,
      });
      setIsOpen(false);
      setNewMileage("");
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar quilometragem",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMileage.trim()) {
      toast({
        title: "Campo Obrigatório",
        description: "Por favor, insira a nova quilometragem.",
        variant: "destructive",
      });
      return;
    }
    resetMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <RotateCcw className="mr-2 h-5 w-5" />
            Redefinir Quilometragem
          </DialogTitle>
          <DialogDescription>
            Atualize a quilometragem atual do veículo. Esta ação será registrada no histórico.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentMileage">Quilometragem Atual</Label>
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <Truck className="h-4 w-4 text-gray-500 mr-2" />
              <span className="text-sm font-medium">{currentMileage || "0"} km</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newMileage">Nova Quilometragem *</Label>
            <Input
              id="newMileage"
              type="number"
              placeholder="Digite a nova quilometragem"
              value={newMileage}
              onChange={(e) => setNewMileage(e.target.value)}
              min="0"
              step="1"
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={resetMutation.isPending}>
              {resetMutation.isPending ? "Atualizando..." : "Atualizar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}