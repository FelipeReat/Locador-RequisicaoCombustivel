import { useQuery } from "@tanstack/react-query";
import { VehicleChecklist, ChecklistTemplateItem } from "@shared/schema";
import { obsConfig as fallbackObsConfig, obsGroups, ObsGroupKey } from "@/lib/checklist-constants";
import { apiRequest } from "@/lib/queryClient";
import { Check, X } from "lucide-react";
import { useMemo } from "react";

interface ChecklistDetailsProps {
  checklist: VehicleChecklist;
}

export function ChecklistDetails({ checklist }: ChecklistDetailsProps) {
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
      const groups = Array.from(new Set(currentItems.map(i => i.group)));
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

  // Parse inspection JSONs
  const inspectionStart = useMemo(() => {
    if (!checklist.inspectionStart) return {};
    try { return JSON.parse(checklist.inspectionStart as string); } catch { return {}; }
  }, [checklist.inspectionStart]);

  const inspectionEnd = useMemo(() => {
    if (!checklist.inspectionEnd) return null;
    try { return JSON.parse(checklist.inspectionEnd as string); } catch { return {}; }
  }, [checklist.inspectionEnd]);

  return (
    <div className="space-y-6">
       {/* Exit Inspection View */}
       <div className="border rounded-md p-4">
          <h4 className="font-semibold mb-2">Checklist de Saída</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
             <div><span className="font-medium">KM:</span> {checklist.kmInitial}</div>
             <div><span className="font-medium">Combustível:</span> {checklist.fuelLevelStart}</div>
             <div><span className="font-medium">Data:</span> {new Date(checklist.startDate).toLocaleString('pt-BR')}</div>
          </div>
          
          <div className="space-y-4">
             {currentGroups.map(group => {
                const items = currentItems.filter(i => i.group === group.key).sort((a,b)=>a.order-b.order);
                if (items.length === 0) return null;
                return (
                   <div key={`start-${group.key}`}>
                      <h5 className="font-medium text-xs uppercase text-muted-foreground mb-1">{group.label}</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                         {items.map(i => {
                            const val = inspectionStart[i.key];
                            return (
                               <div key={i.key} className="flex items-center justify-between border-b pb-1 last:border-0">
                                  <span>{i.label}</span>
                                  {val === true ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-red-600" />}
                               </div>
                            );
                         })}
                      </div>
                   </div>
                );
             })}
          </div>
          {inspectionStart.notes && (
             <div className="mt-4 pt-2 border-t">
                <span className="font-medium">Observações:</span> {inspectionStart.notes}
             </div>
          )}
       </div>

       {/* Return Inspection View (if exists) */}
       {checklist.endDate && inspectionEnd && (
          <div className="border rounded-md p-4 bg-slate-50">
            <h4 className="font-semibold mb-2">Checklist de Retorno</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                <div><span className="font-medium">KM:</span> {checklist.kmFinal}</div>
                <div><span className="font-medium">Combustível:</span> {checklist.fuelLevelEnd}</div>
                <div><span className="font-medium">Data:</span> {new Date(checklist.endDate).toLocaleString('pt-BR')}</div>
            </div>

            <div className="space-y-4">
                {currentGroups.map(group => {
                const items = currentItems.filter(i => i.group === group.key).sort((a,b)=>a.order-b.order);
                if (items.length === 0) return null;
                return (
                    <div key={`end-${group.key}`}>
                        <h5 className="font-medium text-xs uppercase text-muted-foreground mb-1">{group.label}</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {items.map(i => {
                            const val = inspectionEnd[i.key];
                            return (
                                <div key={i.key} className="flex items-center justify-between border-b pb-1 last:border-0">
                                    <span>{i.label}</span>
                                    {val === true ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-red-600" />}
                                </div>
                            );
                            })}
                        </div>
                    </div>
                );
                })}
            </div>
            {inspectionEnd.notes && (
                <div className="mt-4 pt-2 border-t">
                <span className="font-medium">Observações:</span> {inspectionEnd.notes}
                </div>
            )}
          </div>
       )}
    </div>
  );
}
