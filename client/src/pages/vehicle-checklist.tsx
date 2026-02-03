import { Fragment, useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { useLanguage } from "@/contexts/language-context";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useForm } from "react-hook-form";
import { ClipboardCheck, Search, CalendarCheck, ArrowUp, ArrowDown, Plus, Trash2, Check, CheckCircle, MoreHorizontal, FileText, Star, Settings, Filter, X, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useSmartInvalidation, useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";
import { apiRequest } from "@/lib/queryClient";
import type { ChecklistTemplate, ChecklistTemplateItem, VehicleChecklist, VehicleType, Vehicle } from "@shared/schema";
import { obsConfig as defaultObsConfig, obsGroups, fuelLevelOptions, FuelLevel, ObsGroupKey as LegacyObsGroupKey } from "@/lib/checklist-constants";
import { ChecklistReturnForm } from "@/components/checklist/checklist-return-form";
import { ChecklistDetails } from "@/components/checklist/checklist-details";
import { VehicleChecklistReport } from "@/components/checklist/vehicle-checklist-report";
import { formatDateBR } from "@/lib/checklist-utils";

type Company = {
  id: number;
  name: string;
};

// VehicleChecklist type removed, using imported type from @shared/schema

type Analytics = {
  completenessRate: number;
  openCount: number;
  closedCount: number;
  avgKmPerTrip: number;
  activeVehiclesWithOpen: number;
  dailyTrend: { date: string; count: number }[];
};

type ExitFormValues = {
  vehicleId: string;
  checklistTemplateId: string;
  kmInitial: string;
  fuelLevelStart: FuelLevel;
  startDate: string;
  notes: string;
} & Record<string, any>;

type ReturnFormValues = {
  checklistId: number;
  kmFinal: string;
  fuelLevelEnd: FuelLevel;
  endDate: string;
  notes: string;
};

export default function VehicleChecklistPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { invalidateByOperation } = useSmartInvalidation();
  useRealTimeUpdates();

  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  const [expandedReturnId, setExpandedReturnId] = useState<null | number>(null);
  const [expandedClosedId, setExpandedClosedId] = useState<null | number>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("saida");
  const [confirmDeleteChecklistId, setConfirmDeleteChecklistId] = useState<number | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [lockedVehicleId, setLockedVehicleId] = useState<number | null>(null);
  const [obsConfig, setObsConfig] = useState<ObsItem[]>([]);
  const obsGroups: { key: ObsGroupKey; label: string }[] = [
    { key: 'inspecao_veiculo', label: 'Inspeção do Veículo' },
    { key: 'seguranca', label: 'Sistema de Segurança' },
    { key: 'equipamentos', label: 'Equipamentos Internos' },
    { key: 'condutor_veiculo', label: 'Inspeção do Condutor e Veículo' },
  ];
  
  // Template System
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("legacy");

  const { data: templates = [] } = useQuery<ChecklistTemplate[]>({ 
    queryKey: ["/api/checklist-templates"],
    enabled: isExitDialogOpen 
  });

  const { data: selectedTemplateItems = [] } = useQuery<ChecklistTemplateItem[]>({
    queryKey: ["/api/checklist-templates", selectedTemplateId, "items"],
    enabled: selectedTemplateId !== "legacy" && !!selectedTemplateId
  });

  const obsLabels: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {};
    obsConfig.forEach(i => { map[i.key] = i.label });
    return map;
  }, [obsConfig]);

  function applyObsDefaultsToFormFor(vehicleId: string | null) {
    let templateId = "legacy";
    
    if (vehicleId) {
       const vehicle = vehicles.find(v => String(v.id) === vehicleId);
       if (vehicle && vehicle.vehicleTypeId) {
          const type = vehicleTypes.find(t => t.id === vehicle.vehicleTypeId);
          if (type && type.checklistTemplateId) {
             templateId = String(type.checklistTemplateId);
          }
       }
    }

    setSelectedTemplateId(templateId);
    const defaults: Record<string, boolean | undefined> = obsConfig.reduce((acc, i) => { acc[i.key] = undefined; return acc; }, {} as Record<string, boolean | undefined>);
    const notesText = [exitForm.getValues('notes')].filter(Boolean).join('\n');
    const base: any = {
      vehicleId: vehicleId ?? "",
      checklistTemplateId: templateId,
      kmInitial: "",
      fuelLevelStart: "half",
      startDate: nowManausLocalInput(),
      notes: notesText,
    };
    exitForm.reset({ ...base, ...defaults });
  }

  const { data: vehicles = [] } = useQuery<Vehicle[]>({ queryKey: ["/api/vehicles"] });
  const { data: openChecklists = [] } = useQuery<VehicleChecklist[]>({ queryKey: ["/api/checklists/open"] });
  const { data: closedChecklists = [] } = useQuery<VehicleChecklist[]>({ queryKey: ["/api/checklists/closed"] });
  const { data: analytics } = useQuery<Analytics>({ queryKey: ["/api/checklists/stats/analytics"] });
  const { data: companies = [] } = useQuery<Company[]>({ queryKey: ["/api/companies"] });
  const { data: users = [] } = useQuery<any[]>({ queryKey: ["/api/users"] });
  const { data: vehicleTypes = [] } = useQuery<VehicleType[]>({ queryKey: ["/api/vehicle-types"] });
  const { data: favorites = [] } = useQuery<number[]>({
    queryKey: ["/api/user/favorites", user?.id ?? 0],
    enabled: !!user?.id,
  });

  // Filters for Return Tab
  const [historyFilterMode, setHistoryFilterMode] = useState<'mine' | 'all'>('mine');
  const [historyFilterVehicleId, setHistoryFilterVehicleId] = useState<string>('all');
  const [entradaViewMode, setEntradaViewMode] = useState<'pending' | 'history'>('pending');

  const pendingReturns = useMemo(() => {
    let data = openChecklists;
    // Apply permissions (drivers see only theirs)
    const isAdmin = user?.role === 'admin' || user?.role === 'manager';
    if (!isAdmin || historyFilterMode === 'mine') {
       if (user) {
         data = data.filter(c => c.userId === user.id);
       }
    }
    
    if (historyFilterVehicleId !== 'all') {
      const vid = parseInt(historyFilterVehicleId);
      data = data.filter(c => c.vehicleId === vid);
    }
    
    return data.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [openChecklists, user, historyFilterMode, historyFilterVehicleId]);

  const filteredHistory = useMemo(() => {
    let data = [...openChecklists, ...closedChecklists];
    
    // Filter by User
    // If not admin/manager, force 'mine' effectively (or just don't show the option, but enforce here too for safety)
    const isAdmin = user?.role === 'admin' || user?.role === 'manager';
    if (!isAdmin || historyFilterMode === 'mine') {
       if (user) {
         data = data.filter(c => c.userId === user.id);
       }
    }
    
    // Filter by Vehicle
    if (historyFilterVehicleId !== 'all') {
      const vid = parseInt(historyFilterVehicleId);
      data = data.filter(c => c.vehicleId === vid);
    }
    
    return data.sort((a, b) => new Date((b.endDate || b.startDate)).getTime() - new Date((a.endDate || a.startDate)).getTime());
  }, [openChecklists, closedChecklists, historyFilterMode, historyFilterVehicleId, user]);

  // Reset filters
  const clearHistoryFilters = () => {
    setHistoryFilterMode('mine');
    setHistoryFilterVehicleId('all');
  };

  const availableFilterVehicles = useMemo(() => {
     const isAdmin = user?.role === 'admin' || user?.role === 'manager';
     if (isAdmin && historyFilterMode === 'all') {
       return vehicles;
     }
     
     // Get vehicles from user's history
     const userChecklists = [...openChecklists, ...closedChecklists].filter(c => c.userId === user?.id);
     const vehicleIds = new Set(userChecklists.map(c => c.vehicleId));
     return vehicles.filter(v => vehicleIds.has(v.id));
  }, [vehicles, openChecklists, closedChecklists, user, historyFilterMode]);

  const toggleFavorite = useMutation({
    mutationFn: async (vehicleId: number) => {
      const res = await apiRequest("POST", `/api/user/favorites/${vehicleId}`);
      return res.json();
    },
    onSuccess: () => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/user/favorites", user.id] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/user/favorites"] });
      }
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível atualizar favoritos.", variant: "destructive" });
    }
  });

  // Persistence for obsConfig
  const { data: savedObsConfig, isLoading: isLoadingConfig } = useQuery<ObsItem[] | null>({ 
    queryKey: ['/api/settings/obs_config'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/settings/obs_config");
      const data = await res.json();
      return Array.isArray(data) && data.length > 0 ? data : [];
    }
  });

  const [isConfigLoaded, setIsConfigLoaded] = useState(false);

  useEffect(() => {
    if (Array.isArray(savedObsConfig) && savedObsConfig.length > 0) {
      setObsConfig(savedObsConfig);
    } else {
      const ls = localStorage.getItem('obs_config');
      if (ls) {
        try {
          const parsed = JSON.parse(ls);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setObsConfig(parsed);
          }
        } catch {}
      }
    }
    setIsConfigLoaded(true);
  }, [savedObsConfig]);

  const activeVehicles = useMemo(() => vehicles.filter(v => v.status === "active" && v.companyId !== null), [vehicles]);
  const filteredVehicles = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const companyFiltered = selectedCompanyId === null
      ? activeVehicles
      : activeVehicles.filter(v => v.companyId === selectedCompanyId);
    
    const filtered = companyFiltered.filter(v =>
      v.plate.toLowerCase().includes(term) ||
      v.model.toLowerCase().includes(term) ||
      v.brand.toLowerCase().includes(term)
    );

    return filtered.sort((a, b) => {
      const isFavA = favorites.includes(a.id);
      const isFavB = favorites.includes(b.id);
      if (isFavA && !isFavB) return -1;
      if (!isFavA && isFavB) return 1;
      return 0;
    });
  }, [activeVehicles, searchTerm, selectedCompanyId, favorites]);

  const openByVehicle = useMemo(() => {
    const set = new Set(openChecklists.map(c => c.vehicleId));
    return set;
  }, [openChecklists]);

  // Exit form
  const exitForm = useForm<ExitFormValues, any, ExitFormValues>({
    defaultValues: {
      vehicleId: "",
      checklistTemplateId: "legacy",
      kmInitial: "",
      fuelLevelStart: "half",
      startDate: nowManausLocalInput(),
      notes: "",
    } as ExitFormValues,
  });

  // Effect to apply template defaults when items are loaded
  useEffect(() => {
    if (selectedTemplateId !== 'legacy' && selectedTemplateItems.length > 0) {
      const defaults: Record<string, boolean | undefined> = {};
      selectedTemplateItems.forEach(i => {
        defaults[String(i.id)] = i.defaultChecked;
      });
      const currentValues = exitForm.getValues();
      // Remove old obsConfig keys from values to clean up? Not strictly necessary but good.
      exitForm.reset({
        ...currentValues,
        ...defaults
      });
    } else if (selectedTemplateId === 'legacy' && obsConfig.length > 0) {
       // Re-apply legacy defaults if switching back
       const defaults: Record<string, boolean | undefined> = {};
       obsConfig.forEach(i => {
         defaults[i.key] = undefined; // Legacy defaults seem to be undefined or false?
         // In applyObsDefaultsToFormFor: defaults[i.key] = undefined;
       });
       const currentValues = exitForm.getValues();
       exitForm.reset({
         ...currentValues,
         ...defaults
       });
    }
  }, [selectedTemplateItems, selectedTemplateId, obsConfig, exitForm]);

  const createExit = useMutation({
    mutationFn: async (payload: { vehicleId: number; userId: number; kmInitial: number; fuelLevelStart: FuelLevel; startDate: string; inspectionStart: string; checklistTemplateId?: number }) => {
      const res = await apiRequest("POST", "/api/checklists/exit", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklists/open"] });
      invalidateByOperation("vehicle");
      toast({ title: t("confirm-exit"), description: "Saída registrada com sucesso" });
      setIsExitDialogOpen(false);
      exitForm.reset();
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  });

  // Return form
  const returnForm = useForm<ReturnFormValues, any, ReturnFormValues>({
    defaultValues: {
      checklistId: 0,
      kmFinal: "",
      fuelLevelEnd: "half",
      endDate: nowManausLocalInput(),
      notes: "",
    } as ReturnFormValues,
  });

  const closeReturn = useMutation({
    mutationFn: async ({ id, userId, kmFinal, fuelLevelEnd, endDate, inspectionEnd }: { id: number; userId: number; kmFinal: number; fuelLevelEnd: FuelLevel; endDate: string; inspectionEnd: string }) => {
      const res = await apiRequest("POST", `/api/checklists/return/${id}`, { userId, kmFinal, fuelLevelEnd, endDate, inspectionEnd });
      return res.json();
    },
    onSuccess: (updated: VehicleChecklist) => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklists/open"] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklists/closed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklists/stats/analytics"] });
      invalidateByOperation("vehicle");
      toast({ title: t("confirm-return"), description: "Retorno registrado com sucesso" });
      setActiveTab('entrada');
      setExpandedReturnId(null);
      setExpandedClosedId(updated.id);
      returnForm.reset();
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  });

  const deleteChecklist = useMutation({
    mutationFn: async (id: number) => {
      try {
        await apiRequest("DELETE", `/api/checklists/${id}`);
      } catch (e) {
        // Fallback
        await apiRequest("POST", `/api/checklists/${id}/delete`, { userId: user?.id });
      }
    },
    onSuccess: () => {
      // Optimistically remove from local caches
      queryClient.setQueryData<VehicleChecklist[]>(["/api/checklists/open"], (prev) => (prev || []).filter(c => c.id !== confirmDeleteChecklistId));
      queryClient.setQueryData<VehicleChecklist[]>(["/api/checklists/closed"], (prev) => (prev || []).filter(c => c.id !== confirmDeleteChecklistId));
      queryClient.invalidateQueries({ queryKey: ["/api/checklists/open"] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklists/closed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklists/stats/analytics"] });
      invalidateByOperation("vehicle");
      setConfirmDeleteChecklistId(null);
      toast({ title: "Checklist excluída", description: "Histórico de saída removido." });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  });

  const approveChecklist = useMutation({
    mutationFn: async ({ id, userId }: { id: number; userId: number }) => {
      const res = await apiRequest("POST", `/api/checklists/${id}/approve`, { userId });
      return res.json();
    },
    onSuccess: (updated: VehicleChecklist) => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklists/closed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklists/stats/analytics"] });
      invalidateByOperation("vehicle");
      toast({ title: "Checklist aprovado", description: "Conferência registrada com sucesso" });
      setExpandedClosedId(updated.id);
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  });

  const fuelLevelOptions: { value: FuelLevel; label: string }[] = [
    { value: "empty" as FuelLevel, label: "Vazio" },
    { value: "quarter", label: "1/4" },
    { value: "half", label: "1/2" },
    { value: "three_quarters", label: "3/4" },
    { value: "full", label: "cheio" },
  ];

  const fuelLabel = (v?: FuelLevel | null) => {
    if (!v) return "-";
    const opt = fuelLevelOptions.find(o => o.value === v);
    return opt ? opt.label : "-";
  };

  function formatDateTimeDisplay(d?: string | number | Date) {
    if (!d) return "-";
    return new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Manaus' });
  }

  function nowManausLocalInput() {
    const parts = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Manaus', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
    const map: Record<string, string> = Object.fromEntries(parts.map(p => [p.type, p.value]));
    return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}`;
  }

  // --- Dynamic Item Helpers ---

  // For Exit Form
  const currentExitItems = useMemo(() => {
    if (selectedTemplateId === 'legacy' || !selectedTemplateId) {
      return obsConfig;
    }
    return selectedTemplateItems.map(item => ({
      key: String(item.id),
      label: item.label,
      defaultChecked: item.defaultChecked,
      column: item.column as 1 | 2,
      order: item.order,
      group: item.group as ObsGroupKey
    }));
  }, [selectedTemplateId, obsConfig, selectedTemplateItems]);

  const currentExitGroups = useMemo(() => {
    const groups = Array.from(new Set(currentExitItems.map(i => i.group)));
    return groups.map(g => {
       const legacy = obsGroups.find(lg => lg.key === g);
       return {
         key: g,
         label: legacy ? legacy.label : g
       };
    }).sort((a,b) => {
       if (selectedTemplateId === 'legacy') {
          const idxA = obsGroups.findIndex(x => x.key === a.key);
          const idxB = obsGroups.findIndex(x => x.key === b.key);
          return idxA - idxB;
       }
       return 0;
    });
  }, [currentExitItems, selectedTemplateId, obsGroups]);

  // For Return Form / View
  const activeChecklist = useMemo(() => {
    if (expandedReturnId) return openChecklists.find(c => c.id === expandedReturnId);
    if (expandedClosedId) return closedChecklists.find(c => c.id === expandedClosedId);
    return null;
  }, [expandedReturnId, expandedClosedId, openChecklists, closedChecklists]);

  const activeTemplateId = activeChecklist?.checklistTemplateId;
  
  const { data: activeTemplateItems = [] } = useQuery<ChecklistTemplateItem[]>({
    queryKey: ["/api/checklist-templates", activeTemplateId, "items"],
    enabled: !!activeTemplateId
  });

  const currentViewItems = useMemo(() => {
    if (activeTemplateId && activeTemplateItems.length > 0) {
      return activeTemplateItems.map(item => ({
        key: String(item.id),
        label: item.label,
        defaultChecked: item.defaultChecked,
        column: item.column as 1 | 2,
        order: item.order,
        group: item.group as ObsGroupKey
      }));
    }
    return obsConfig;
  }, [activeTemplateId, activeTemplateItems, obsConfig]);
  
  const currentViewGroups = useMemo(() => {
    const groups = Array.from(new Set(currentViewItems.map(i => i.group)));
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
  }, [currentViewItems, obsGroups]);

  // Also update obsLabels for View (used in labels display)
  const currentViewLabels = useMemo(() => {
     const map: Record<string, string> = {};
     currentViewItems.forEach(i => { map[i.key] = i.label });
     return map;
  }, [currentViewItems]);

  return (
    <div className="flex-1">
      <Header title={t('vehicle-checklist')} subtitle={t('manage-company-vehicles')} />

      <div className="mobile-container space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="saida">Saída</TabsTrigger>
              <TabsTrigger value="entrada">Entrada</TabsTrigger>
              <TabsTrigger value="relatorio">Relatório</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="saida" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center ring-4 ring-primary/10">
                  <ClipboardCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{t('vehicle-checklist')}</h2>
                  <p className="text-sm text-muted-foreground">Checklist de saída: estado, combustível e condições</p>
                </div>
              </div>
              <Button onClick={() => { 
                setLockedVehicleId(null); 
                setIsExitDialogOpen(true);
                applyObsDefaultsToFormFor(null);
              }} className="w-full sm:w-auto">
                {t('new-exit-checklist')}
              </Button>
            </div>



            <Card>
              <CardHeader>
                <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <span>Veículos Ativos</span>
                  <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t('search-vehicles')} className="pl-9" />
                    </div>
                    <div className="w-full sm:w-64">
                      <Select value={selectedCompanyId === null ? 'all' : String(selectedCompanyId)} onValueChange={(val) => setSelectedCompanyId(val === 'all' ? null : parseInt(val))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Empresa" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas as empresas</SelectItem>
                          {companies.map(c => (
                            <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardTitle>
                <CardDescription>Selecione um veículo para iniciar um checklist de saída</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mobile-table-container">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Placa</TableHead>
                        <TableHead className="hidden sm:table-cell">Modelo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVehicles.map(v => (
                        <TableRow key={v.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 -ml-2" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite.mutate(v.id);
                                }}
                              >
                                <Star className={`h-4 w-4 ${favorites.includes(v.id) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                              </Button>
                              {v.plate}
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">{v.model}</TableCell>
                          <TableCell>
                            {openByVehicle.has(v.id) ? (
                              <Badge variant="outline" className="text-yellow-700">Saída Aberta</Badge>
                            ) : (
                              <Badge variant="secondary">Disponível</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setIsExitDialogOpen(true);
                                setLockedVehicleId(v.id);
                                applyObsDefaultsToFormFor(String(v.id));
                              }}
                              disabled={openByVehicle.has(v.id)}
                              aria-label="Iniciar checklist de saída"
                              className="gap-2 px-2 sm:px-4"
                            >
                              <Plus className="h-4 w-4" />
                              <span className="hidden sm:inline">{t('new-exit-checklist')}</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>





          </TabsContent>
          
          <TabsContent value="entrada" className="space-y-6">

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Retorno de Veículos</h2>
                <p className="text-muted-foreground">Gerencie as entradas e conferências de veículos</p>
              </div>
              <div className="flex items-center space-x-2 bg-muted p-1 rounded-lg">
                 <Button 
                   variant={entradaViewMode === 'pending' ? 'secondary' : 'ghost'} 
                   size="sm" 
                   onClick={() => setEntradaViewMode('pending')}
                   className="gap-2"
                 >
                   <AlertTriangle className="h-4 w-4 text-yellow-600" />
                   Pendentes ({pendingReturns.length})
                 </Button>
                 <Button 
                   variant={entradaViewMode === 'history' ? 'secondary' : 'ghost'} 
                   size="sm" 
                   onClick={() => setEntradaViewMode('history')}
                   className="gap-2"
                 >
                   <FileText className="h-4 w-4" />
                   Histórico Completo
                 </Button>
              </div>
            </div>

            {/* Histórico resumido */}
            <Card className={entradaViewMode === 'pending' ? "border-l-4 border-l-yellow-500" : ""}>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle>{entradaViewMode === 'pending' ? 'Veículos Pendentes de Retorno' : 'Histórico de Saídas'}</CardTitle>
                    <CardDescription>{entradaViewMode === 'pending' ? 'Veículos que saíram e ainda não retornaram. Necessitam de inspeção.' : 'Registros de saídas e retornos por veículo'}</CardDescription>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center bg-muted/30 p-2 rounded-lg">
                     {(user?.role === 'admin' || user?.role === 'manager') && (
                        <div className="flex items-center bg-background p-1 rounded-md border">
                          <RadioGroup 
                            value={historyFilterMode} 
                            onValueChange={(v) => setHistoryFilterMode(v as 'mine'|'all')}
                            className="flex items-center gap-4 px-2"
                            orientation="horizontal"
                          >
                             <div className="flex items-center space-x-2">
                               <RadioGroupItem value="mine" id="filter-mine" />
                               <Label htmlFor="filter-mine" className="cursor-pointer font-normal">Minhas</Label>
                             </div>
                             <div className="flex items-center space-x-2">
                               <RadioGroupItem value="all" id="filter-all" />
                               <Label htmlFor="filter-all" className="cursor-pointer font-normal">Todas</Label>
                             </div>
                          </RadioGroup>
                        </div>
                     )}

                     <div className="w-full sm:w-[200px]">
                        <Select value={historyFilterVehicleId} onValueChange={setHistoryFilterVehicleId}>
                          <SelectTrigger className="h-9 bg-background">
                            <SelectValue placeholder="Filtrar por Veículo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos os Veículos</SelectItem>
                            {availableFilterVehicles.map(v => (
                              <SelectItem key={v.id} value={String(v.id)}>{v.plate} - {v.model}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                     </div>
                     
                     {(historyFilterMode !== 'mine' || historyFilterVehicleId !== 'all') && (
                       <Button variant="ghost" size="sm" onClick={clearHistoryFilters} className="h-9 px-2 text-muted-foreground hover:text-foreground">
                         <X className="h-4 w-4 mr-1" />
                         Limpar
                       </Button>
                     )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mobile-table-container">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Veículo</TableHead>
                        <TableHead className="hidden lg:table-cell">Motorista</TableHead>
                        <TableHead className="hidden md:table-cell">KM Inicial</TableHead>
                        <TableHead className="hidden xl:table-cell">Nível Comb. (início)</TableHead>
                        <TableHead className="hidden sm:table-cell">Data Saída</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">KM Final</TableHead>
                        <TableHead className="hidden sm:table-cell">Data Retorno</TableHead>
                        <TableHead className="text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(entradaViewMode === 'pending' ? pendingReturns : filteredHistory).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                            {entradaViewMode === 'pending' ? "Nenhum veículo pendente de retorno." : "Nenhum registro encontrado com os filtros selecionados."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        (entradaViewMode === 'pending' ? pendingReturns : filteredHistory).map(c => {
                          const v = vehicles.find(v => v.id === c.vehicleId);
                          const checklistUser = users.find(u => u.id === c.userId);
                          const isClosed = c.status === 'closed';
                          const isExpanded = c.status === 'closed' ? expandedClosedId === c.id : expandedReturnId === c.id;
                          const start = c.inspectionStart ? JSON.parse(c.inspectionStart) : {};
                          const end = c.inspectionEnd ? JSON.parse(c.inspectionEnd) : {};
                          return (
                            <Fragment key={`hist-${c.id}-${c.status}`}>
                              <TableRow>
                                <TableCell className="font-medium">{v ? v.plate : c.vehicleId}</TableCell>
                                <TableCell className="hidden lg:table-cell">{checklistUser?.fullName || checklistUser?.username || '-'}</TableCell>
                                <TableCell className="hidden md:table-cell font-mono">{c.kmInitial} km</TableCell>
                                <TableCell className="hidden xl:table-cell text-center">{fuelLabel(c.fuelLevelStart as FuelLevel)}</TableCell>
                                <TableCell className="hidden sm:table-cell">{formatDateBR(c.startDate)}</TableCell>
                                <TableCell>
                                  {c.status === 'open' ? (
                                    <Badge variant="outline" className="text-yellow-700">Aberta</Badge>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <Badge variant="secondary">Concluída</Badge>
                                      {end?.approvedByName && (
                                        <Badge 
                                          variant="default" 
                                          className="bg-green-600 hover:bg-green-600"
                                          title={`Conferido por ${end.approvedByName}${end?.approvedAt ? ` em ${formatDateBR(end.approvedAt)}` : ''}`}
                                        >
                                          <Check className="h-3 w-3 mr-1" />
                                          Conferido
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="hidden md:table-cell font-mono">{c.kmFinal ? `${c.kmFinal} km` : '-'}</TableCell>
                                <TableCell className="hidden sm:table-cell">
                                  <div className="flex items-center gap-2">
                                    {c.endDate ? formatDateBR(c.endDate) : '-'}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  {isClosed ? (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                          <span className="sr-only">Abrir menu</span>
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                        {(user?.role !== 'driver') && !end?.approvedByUserId && (
                                          <DropdownMenuItem onClick={() => user && approveChecklist.mutate({ id: c.id, userId: user.id })}>
                                            <Check className="mr-2 h-4 w-4" />
                                            <span>Conferido</span>
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem onClick={() => setExpandedClosedId(isExpanded ? null : c.id)}>
                                          <Search className="mr-2 h-4 w-4" />
                                          <span>{isExpanded ? 'Fechar detalhes' : 'Ver detalhes'}</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={async () => {
                                          try {
                                            const { PDFGenerator } = await import('@/lib/pdf-generator');
                                            const gen = new PDFGenerator('portrait');
                                            const pdfUser = users.find(u => u.id === c.userId) || user;
                                            const groupsToPass = obsGroups.map(g => ({ key: g.key, label: g.label }));
                                            
                                            let itemsToPass = [];
                                            if (c.checklistTemplateId) {
                                                const res = await apiRequest("GET", `/api/checklist-templates/${c.checklistTemplateId}/items`);
                                                const items = await res.json();
                                                itemsToPass = items.map((i: any) => ({ key: String(i.id), label: i.label, group: i.group }));
                                            } else {
                                                itemsToPass = obsConfig.map(i => ({ key: i.key, label: obsLabels[i.key], group: i.group }));
                                            }

                                            gen.generateReturnedChecklistPDF(c, v, pdfUser, { company: 'Sistema de Controle de Abastecimento', obsGroups: groupsToPass, obsItems: itemsToPass });
                                            const dateStr = (c.endDate || c.startDate || '').toString().slice(0, 10);
                                            const plate = v?.plate || String(c.vehicleId);
                                            gen.save(`checklist-retorno-${plate}-${dateStr || new Date().toISOString().slice(0,10)}.pdf`);
                                            toast({ title: "PDF Gerado", description: "Documento exportado com sucesso." });
                                          } catch (e) {
                                            console.error(e);
                                            toast({ title: "Erro", description: "Falha ao gerar PDF do checklist.", variant: "destructive" });
                                          }
                                        }}>
                                          <FileText className="mr-2 h-4 w-4" />
                                          <span>Exportar PDF</span>
                                        </DropdownMenuItem>
                                        {(user?.role === 'admin' || user?.role === 'manager') && (
                                          <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => setConfirmDeleteChecklistId(c.id)} className="text-red-600">
                                              <Trash2 className="mr-2 h-4 w-4" />
                                              <span>Excluir</span>
                                            </DropdownMenuItem>
                                          </>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  ) : (
                                    <div className="flex items-center justify-end gap-2">
                                      <Button size="sm" variant={isExpanded ? 'secondary' : 'default'} disabled={user?.role === 'driver' && user?.id !== c.userId} onClick={() => {
                                      const next = isExpanded ? null : c.id;
                                      setExpandedReturnId(next);
                                      }}>
                                        {isExpanded ? 'Fechar' : <><span className="hidden sm:inline">{t('register-return-checklist')}</span><span className="sm:hidden">Retorno</span></>}
                                      </Button>
                                      {(user?.role === 'admin' || user?.role === 'manager') && (
                                        <Button variant="destructive" className="h-8 w-8 p-0" onClick={() => setConfirmDeleteChecklistId(c.id)}>
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                              {isExpanded && (
                                <TableRow>
                                  <TableCell colSpan={9}>
                                    <div className={`grid grid-cols-1 ${!isClosed ? 'lg:grid-cols-2' : ''} gap-6`}>
                                      <ChecklistDetails checklist={c} />
                                      {isClosed ? (
null
                                      ) : (
                                        <Card>
                                          <CardHeader>
                                            <CardTitle>Registrar Retorno</CardTitle>
                                            <CardDescription>Preencha as condições no retorno</CardDescription>
                                          </CardHeader>
                                          <CardContent>
                                            <ScrollArea className="h-[60vh] pr-4">
                                            <ChecklistReturnForm
                                              checklist={c}
                                              onSuccess={() => {
                                                setExpandedReturnId(null);
                                                setActiveTab('entrada');
                                              }}
                                              onCancel={() => setExpandedReturnId(null)}
                                            />
                                            </ScrollArea>
                                          </CardContent>
                                        </Card>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </Fragment>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="relatorio">
            <VehicleChecklistReport checklists={[...openChecklists, ...closedChecklists]} vehicles={vehicles} users={users} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Exit Dialog */}
      <Dialog open={isExitDialogOpen} onOpenChange={setIsExitDialogOpen}>
        <DialogContent className="mobile-container max-w-xl">
          <DialogHeader>
            <DialogTitle>{t('new-exit-checklist')}</DialogTitle>
            <DialogDescription>Informe os dados para iniciar a saída</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[70vh] pr-4">
          <Form {...exitForm}>
            <form
              className="space-y-4 px-1"
              onSubmit={exitForm.handleSubmit((values) => {
                const vid = parseInt(values.vehicleId);
                if (!vid) {
                  exitForm.setError('vehicleId', { message: 'Selecione um veículo' });
                  return;
                }

                // Validation for observations
                const missingObs = currentExitItems.find(i => (values as any)[i.key] === undefined || (values as any)[i.key] === null);
                if (missingObs) {
                  toast({ title: "Atenção", description: "Preencha todas as observações obrigatórias.", variant: "destructive" });
                  return;
                }

                const kmInitial = parseFloat(values.kmInitial);
                if (isNaN(kmInitial) || kmInitial < 0) {
                  exitForm.setError('kmInitial', { message: 'Informe uma quilometragem válida' });
                  return;
                }
                const inspectionObj: any = {};
                currentExitItems.forEach(obs => {
                  inspectionObj[obs.key] = (values as any)[obs.key];
                });
                inspectionObj.notes = values.notes;
                const inspectionStart = JSON.stringify(inspectionObj);
                const templateId = values.checklistTemplateId === 'legacy' ? undefined : parseInt(values.checklistTemplateId);
                createExit.mutate({ vehicleId: vid, userId: user!.id, kmInitial, fuelLevelStart: values.fuelLevelStart, startDate: values.startDate, inspectionStart, checklistTemplateId: templateId });
              })}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={exitForm.control}
                  name="vehicleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('vehicle')}</FormLabel>
                      <Select value={field.value} onValueChange={(val) => { 
                        if (lockedVehicleId === null) {
                          field.onChange(val);
                          // Auto-select template
                          const vehicle = activeVehicles.find(v => String(v.id) === val);
                          let templateId = 'legacy';
                          if (vehicle && vehicle.vehicleTypeId) {
                            const type = vehicleTypes.find(t => t.id === vehicle.vehicleTypeId);
                            if (type && type.checklistTemplateId) {
                              templateId = String(type.checklistTemplateId);
                            }
                          }
                          exitForm.setValue('checklistTemplateId', templateId);
                          setSelectedTemplateId(templateId);
                        } 
                      }}>
                        <SelectTrigger disabled={lockedVehicleId !== null}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {activeVehicles.map(v => (
                            <SelectItem key={v.id} value={String(v.id)} disabled={openByVehicle.has(v.id)}>
                              {v.plate} - {v.model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem>
                  <FormLabel>Modelo de Checklist (Automático)</FormLabel>
                  <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted text-sm text-muted-foreground flex items-center">
                    {selectedTemplateId === 'legacy' ? 'Padrão (Legado)' : (templates.find(t => String(t.id) === selectedTemplateId)?.name || 'Carregando...')}
                  </div>
                </FormItem>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={exitForm.control}
                  name="kmInitial"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('initial-mileage')}</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min={0} placeholder="Ex: 12000" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={exitForm.control}
                  name="fuelLevelStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('fuel-level')}</FormLabel>
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
                  control={exitForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data/Hora</FormLabel>
                      <FormControl>
                        <Input {...field} type="datetime-local" lang="pt-BR" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                {currentExitGroups.map(group => {
                  const items = currentExitItems.filter(i => i.group === group.key).sort((a,b)=>a.order-b.order);
                  if (items.length === 0) return null;
                  return (
                    <div key={`exit-${group.key}`} className="space-y-2">
                      <h4 className="font-semibold">{group.label}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {items.map(i=> (
                          <FormField key={i.key} control={exitForm.control} name={i.key as any} render={({ field }) => (
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
                control={exitForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Detalhes adicionais" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="mobile-button-group pt-2">
                <Button variant="outline" type="button" onClick={() => setIsExitDialogOpen(false)} className="w-full sm:w-auto">Cancelar</Button>
                <Button type="submit" className="w-full sm:w-auto" disabled={createExit.isPending}>{t('confirm-exit')}</Button>
              </div>
            </form>
          </Form>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDeleteChecklistId !== null} onOpenChange={(open) => !open && setConfirmDeleteChecklistId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir checklist</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Confirme para remover o histórico selecionado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDeleteChecklistId !== null && deleteChecklist.mutate(confirmDeleteChecklistId)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      
    </div>
  );
}
type ObsGroupKey = 'inspecao_veiculo' | 'seguranca' | 'equipamentos' | 'condutor_veiculo';
type ObsItem = { key: string; label: string; defaultChecked: boolean; column: 1 | 2; order: number; group: ObsGroupKey };
