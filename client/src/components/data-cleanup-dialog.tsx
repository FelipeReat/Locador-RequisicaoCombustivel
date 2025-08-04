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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, AlertTriangle, Database, FileText, Truck, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { usePermissions } from "@/hooks/usePermissions";

interface DataCleanupDialogProps {
  trigger: React.ReactNode;
}

export function DataCleanupDialog({ trigger }: DataCleanupDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userRole } = usePermissions();

  // Only allow admin access to data cleanup
  if (userRole !== 'admin') {
    return null;
  }

  const cleanupMutation = useMutation({
    mutationFn: async (dataType: string) => {
      const response = await apiRequest("DELETE", `/api/cleanup/${dataType}`);
      return response.json();
    },
    onSuccess: (data, dataType) => {
      queryClient.invalidateQueries();
      toast({
        title: "Limpeza Concluída",
        description: `${data.deletedCount} registro(s) de ${dataType} foram removidos.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro na Limpeza",
        description: error.message || "Erro ao limpar dados",
        variant: "destructive",
      });
    },
  });

  const cleanupOptions = [
    {
      id: "requisitions",
      title: "Requisições",
      description: "Remove todas as requisições do sistema",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      id: "vehicles",
      title: "Veículos",
      description: "Remove todos os veículos cadastrados",
      icon: Truck,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      id: "suppliers",
      title: "Fornecedores",
      description: "Remove todos os fornecedores cadastrados",
      icon: Building,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      id: "companies",
      title: "Empresas",
      description: "Remove todas as empresas cadastradas",
      icon: Database,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Database className="mr-2 h-5 w-5" />
            Limpeza de Dados
          </DialogTitle>
          <DialogDescription>
            Selecione os tipos de dados que deseja remover do sistema. Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <div className="text-sm text-yellow-800">
              <strong>Atenção:</strong> Esta operação é irreversível. Todos os dados selecionados serão permanentemente removidos.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cleanupOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Card key={option.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg ${option.bgColor} mr-3`}>
                          <Icon className={`h-5 w-5 ${option.color}`} />
                        </div>
                        <div>
                          <CardTitle className="text-sm">{option.title}</CardTitle>
                          <CardDescription className="text-xs">
                            {option.description}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      disabled={cleanupMutation.isPending}
                      onClick={() => cleanupMutation.mutate(option.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {cleanupMutation.isPending ? "Removendo..." : "Remover Todos"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}