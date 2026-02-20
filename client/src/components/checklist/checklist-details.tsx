import { useQuery } from "@tanstack/react-query";
import { VehicleChecklist, ChecklistTemplateItem, Vehicle, VehicleType } from "@shared/schema";
import { obsConfig as fallbackObsConfig, obsGroups, ObsGroupKey } from "@/lib/checklist-constants";
import { apiRequest } from "@/lib/queryClient";
import { Check, X } from "lucide-react";
import { useMemo } from "react";
import { isChecklistChecked } from "@/lib/checklist-utils";

interface ChecklistDetailsProps {
  checklist: VehicleChecklist;
}

export function ChecklistDetails({ checklist }: ChecklistDetailsProps) {
  // Try to infer template ID if missing (fix for older records)
  const { data: vehicle } = useQuery<Vehicle>({
    queryKey: [`/api/vehicles/${checklist.vehicleId}`],
    enabled: !checklist.checklistTemplateId && !!checklist.vehicleId
  });

  const { data: vehicleType } = useQuery<VehicleType>({
    queryKey: [`/api/vehicle-types/${vehicle?.vehicleTypeId}`],
    enabled: !!vehicle?.vehicleTypeId
  });

  const inspectionStart = useMemo(() => {
    if (!checklist.inspectionStart) return {};
    try { 
      const parsed = typeof checklist.inspectionStart === 'string' 
        ? JSON.parse(checklist.inspectionStart) 
        : checklist.inspectionStart;
      return parsed || {};
    } catch { return {}; }
  }, [checklist.inspectionStart]);

  const inspectionEnd = useMemo(() => {
    if (!checklist.inspectionEnd) return null;
    try { 
      const parsed = typeof checklist.inspectionEnd === 'string'
        ? JSON.parse(checklist.inspectionEnd)
        : checklist.inspectionEnd;
      return parsed || {};
    } catch { return {}; }
  }, [checklist.inspectionEnd]);

  // Check if data implies legacy format to prevent wrong template inference
  const isLegacyData = useMemo(() => {
     const keys = Object.keys(inspectionStart);
     if (keys.length === 0) return false;
     // Modern keys start with obs_
     // If we have keys but none start with obs_, it's likely legacy
     const hasModernKeys = keys.some(k => k.startsWith('obs_'));
     return !hasModernKeys;
  }, [inspectionStart]);

  const effectiveTemplateId = useMemo(() => {
    if (checklist.checklistTemplateId) return checklist.checklistTemplateId;
    if (isLegacyData) return null; // Force legacy if data looks legacy
    return vehicleType?.checklistTemplateId; // Infer only if data looks modern or empty
  }, [checklist.checklistTemplateId, isLegacyData, vehicleType]);

  // Fetch template items if applicable
  const { data: templateItems = [] } = useQuery<ChecklistTemplateItem[]>({
    queryKey: ["/api/checklist-templates", effectiveTemplateId, "items"],
    enabled: !!effectiveTemplateId
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
    enabled: !effectiveTemplateId
  });

  const currentItems = useMemo(() => {
    if (effectiveTemplateId) {
      if (templateItems.length > 0) {
        return templateItems.map(item => ({
          key: String(item.id),
          label: item.label,
          defaultChecked: item.defaultChecked,
          column: item.column as 1 | 2,
          order: item.order,
          group: item.group as ObsGroupKey
        }));
      }
      // If we have a template ID but no items yet (loading/error), 
      // do NOT fallback to legacy config, or we'll show wrong keys/items.
      return []; 
    }
    return legacyConfig;
  }, [effectiveTemplateId, templateItems, legacyConfig]);

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
                            const checked = isChecklistChecked(val);
                            let negative = false;
                            if (val === false) negative = true;
                            else if (typeof val === 'string') {
                              const norm = val.trim().toLowerCase();
                              if (norm === 'false' || norm === 'nao' || norm === 'não' || norm === 'n') negative = true;
                            }
                            return (
                               <div key={i.key} className="flex items-center justify-between border-b pb-1 last:border-0">
                                 <span>{i.label}</span>
                                 {checked ? <Check className="h-4 w-4 text-green-600" /> : (negative ? <X className="h-4 w-4 text-red-600" /> : null)}
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
                              const checked = isChecklistChecked(val);
                              let negative = false;
                              if (val === false) negative = true;
                              else if (typeof val === 'string') {
                                const norm = val.trim().toLowerCase();
                                if (norm === 'false' || norm === 'nao' || norm === 'não' || norm === 'n') negative = true;
                              }
                              return (
                                <div key={i.key} className="flex items-center justify-between border-b pb-1 last:border-0">
                                  <span>{i.label}</span>
                                  {checked ? <Check className="h-4 w-4 text-green-600" /> : (negative ? <X className="h-4 w-4 text-red-600" /> : null)}
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
