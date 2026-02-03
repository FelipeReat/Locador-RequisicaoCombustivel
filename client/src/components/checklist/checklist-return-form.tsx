import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { VehicleChecklist, ChecklistTemplateItem } from "@shared/schema";
import { obsConfig as fallbackObsConfig, obsGroups, fuelLevelOptions, FuelLevel, ObsGroupKey } from "@/lib/checklist-constants";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";

// Helper to format date
function nowManausLocalInput() {
    const parts = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Manaus', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
    const map: Record<string, string> = Object.fromEntries(parts.map(p => [p.type, p.value]));
    return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}`;
}

type ReturnFormValues = {
  checklistId: number;
  kmFinal: string;
  fuelLevelEnd: FuelLevel;
  endDate: string;
  notes: string;
};

interface ChecklistReturnFormProps {
  checklist: VehicleChecklist;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ChecklistReturnForm({ checklist, onSuccess, onCancel }: ChecklistReturnFormProps) {
  const queryClient = useQueryClient();

  // Fetch template items if applicable
  const { data: templateItems = [] } = useQuery<ChecklistTemplateItem[]>({
    queryKey: ["/api/checklist-templates", checklist.checklistTemplateId, "items"],
    enabled: !!checklist.checklistTemplateId
  });

  // Fetch default config for legacy checklists
  const { data: legacyConfig = fallbackObsConfig } = useQuery({
    queryKey: ['/api/settings/obs_config'],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/settings/obs_config");
        const data = await res.json();
        return Array.isArray(data) && data.length > 0 ? data : fallbackObsConfig;
      } catch {
        return fallbackObsConfig;
      }
    },
    enabled: !checklist.checklistTemplateId
  });

  const currentItems = useMemo(() => {
    if (checklist.checklistTemplateId && templateItems.length > 0) {
      return templateItems.map(item => ({
        key: String(item.id),
        label: item.label,
        defaultChecked: item.defaultChecked,
        column: item.column as 1 | 2,
        order: item.order,
        group: item.group as ObsGroupKey
      }));
    }
    return legacyConfig;
  }, [checklist.checklistTemplateId, templateItems, legacyConfig]);

  const currentGroups = useMemo(() => {
      const groups = Array.from(new Set(currentItems.map((i: any) => i.group)));
      return groups.map(g => {
         const legacy = obsGroups.find(lg => lg.key === g);
         return {
           key: g,
           label: legacy ? legacy.label : g
         };
      }).sort((a,b) => {
         const idxA = obsGroups.findIndex(x => x.key === a.key);
         const idxB = obsGroups.findIndex(x => x.key === b.key);
         if (idxA !== -1 && idxB !== -1) return idxA - idxB;
         return 0;
      });
  }, [currentItems]);

  const returnForm = useForm<ReturnFormValues>({
    defaultValues: {
      checklistId: checklist.id,
      kmFinal: String(checklist.kmInitial),
      fuelLevelEnd: checklist.fuelLevelStart as FuelLevel,
      endDate: nowManausLocalInput(),
      notes: "",
    }
  });

  const createReturn = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiRequest("POST", `/api/checklists/return/${payload.checklistId}`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklists/open"] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklists/closed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({ title: "Retorno registrado", description: "O checklist de retorno foi salvo com sucesso." });
      if (onSuccess) onSuccess();
    },
    onError: () => {
        toast({ title: "Erro", description: "Falha ao registrar retorno.", variant: "destructive" });
    }
  });

  const onSubmit = (values: ReturnFormValues) => {
      const kmFinal = parseFloat(values.kmFinal);
      const kmInitial = typeof checklist.kmInitial === 'string' ? parseFloat(checklist.kmInitial) : checklist.kmInitial;
      if (isNaN(kmFinal) || kmFinal < kmInitial) {
        returnForm.setError('kmFinal', { message: `A quilometragem deve ser maior ou igual a ${checklist.kmInitial}` });
        return;
      }

      // Validation
      const missingObs = currentItems.find(i => (values as any)[i.key] === undefined || (values as any)[i.key] === null);
      if (missingObs) {
          toast({ title: "Atenção", description: "Preencha todas as observações obrigatórias.", variant: "destructive" });
          return;
      }

      const inspectionObj: any = {};
      currentItems.forEach(obs => {
          inspectionObj[obs.key] = (values as any)[obs.key];
      });
      inspectionObj.notes = values.notes;

      createReturn.mutate({
          checklistId: checklist.id,
          kmFinal,
          fuelLevelEnd: values.fuelLevelEnd,
          endDate: values.endDate,
          inspectionEnd: JSON.stringify(inspectionObj)
      });
  };

  return (
      <Form {...returnForm}>
          <form onSubmit={returnForm.handleSubmit(onSubmit)} className="space-y-4 pt-4 border-t">
              <h4 className="font-semibold mb-2">Registro de Retorno</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={returnForm.control}
                    name="kmFinal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quilometragem Final (Início: {checklist.kmInitial})</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min={checklist.kmInitial} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={returnForm.control}
                    name="fuelLevelEnd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nível de Combustível</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fuelLevelOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={returnForm.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data/Hora Retorno</FormLabel>
                        <FormControl>
                          <Input {...field} type="datetime-local" lang="pt-BR" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>

             <div className="space-y-4">
                {currentGroups.map(group => {
                  const items = currentItems.filter(i => i.group === group.key).sort((a,b)=>a.order-b.order);
                  if (items.length === 0) return null;
                  return (
                    <div key={`ret-${group.key}`} className="space-y-2">
                      <h4 className="font-semibold">{group.label}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {items.map(i=> (
                          <FormField key={i.key} control={returnForm.control} name={i.key as any} render={({ field }) => (
                            <FormItem className="flex items-center justify-between p-1">
                              <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 !mt-0">{i.label}</FormLabel>
                              <FormControl>
                                <div className="flex items-center gap-1">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant={field.value ? "default" : "outline"}
                                    className={field.value ? "bg-green-600 hover:bg-green-700 h-7 px-3" : "h-7 px-3 text-muted-foreground"}
                                    onClick={() => field.onChange(true)}
                                  >
                                    Sim
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant={field.value === false ? "destructive" : "outline"}
                                    className={field.value === false ? "h-7 px-3" : "h-7 px-3 text-muted-foreground"}
                                    onClick={() => field.onChange(false)}
                                  >
                                    Não
                                  </Button>
                                </div>
                              </FormControl>
                            </FormItem>
                          )} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <FormField
                control={returnForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações de Retorno</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Detalhes adicionais do retorno" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                  {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>}
                  <Button type="submit" disabled={createReturn.isPending}>
                      {createReturn.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Confirmar Retorno
                  </Button>
              </div>
          </form>
      </Form>
  );
}
