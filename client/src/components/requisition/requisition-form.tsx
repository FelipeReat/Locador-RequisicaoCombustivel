import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertFuelRequisitionSchema, type InsertFuelRequisition, type FuelRequisition } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import { PDFGenerator } from "@/lib/pdf-generator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, FileText, Download } from "lucide-react";

interface RequisitionFormProps {
  onSuccess?: () => void;
  requisition?: FuelRequisition;
}

export default function RequisitionForm({ onSuccess, requisition }: RequisitionFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const form = useForm<InsertFuelRequisition>({
    resolver: zodResolver(insertFuelRequisitionSchema),
    defaultValues: {
      requester: "",
      department: undefined,
      fuelType: undefined,
      quantity: "",
      justification: "",
      requiredDate: "",
      priority: "media",
    },
  });

  const createRequisition = useMutation({
    mutationFn: async (data: InsertFuelRequisition) => {
      const response = await apiRequest("POST", "/api/fuel-requisitions", data);
      return response.json();
    },
    onSuccess: (newRequisition: FuelRequisition) => {
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-requisitions/stats/overview"] });
      toast({
        title: t("success"),
        description: t("form-saved"),
      });
      
      // Gerar PDF automaticamente
      setTimeout(() => {
        generatePDF(newRequisition);
      }, 1000);
      
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: t("error"),
        description: error.message || t("operation-failed"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertFuelRequisition) => {
    createRequisition.mutate(data);
  };

  const generatePDF = (req: FuelRequisition) => {
    try {
      const pdfGenerator = new PDFGenerator();
      pdfGenerator.generateRequisitionPDF(req);
      pdfGenerator.save(`requisicao-${String(req.id).padStart(4, '0')}.pdf`);
      
      toast({
        title: "PDF Gerado",
        description: "Documento da requisição baixado com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="requester"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('requester-label')} *</FormLabel>
                <FormControl>
                  <Input placeholder={t('requester-placeholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('department-label')} *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('select-department-placeholder')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="logistica">{t('logistics')}</SelectItem>
                    <SelectItem value="manutencao">{t('maintenance')}</SelectItem>
                    <SelectItem value="transporte">{t('transport')}</SelectItem>
                    <SelectItem value="operacoes">{t('operations')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="fuelType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('fuel-type-label')} *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('select-fuel-type')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="gasolina">{t('gasoline')}</SelectItem>
                    <SelectItem value="etanol">{t('ethanol')}</SelectItem>
                    <SelectItem value="diesel">{t('diesel')}</SelectItem>
                    <SelectItem value="diesel_s10">{t('diesel-s10')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('quantity-liters')} *</FormLabel>
                <FormControl>
                  <Input type="number" min="1" placeholder={t('quantity-placeholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="justification"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('justification-label-form')} *</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  placeholder={t('justification-placeholder')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="requiredDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('needed-date-form')} *</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    {...field} 
                    min={new Date().toISOString().split('T')[0]}
                    max="2099-12-31"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('priority-form')}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="baixa">{t('low')}</SelectItem>
                    <SelectItem value="media">{t('medium-priority')}</SelectItem>
                    <SelectItem value="alta">{t('high')}</SelectItem>
                    <SelectItem value="urgente">{t('urgent')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            {t('cancel')}
          </Button>
          <Button type="submit" disabled={createRequisition.isPending}>
            {createRequisition.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {t('create-requisition')}
          </Button>
        </div>
      </form>
    </Form>
  );
}