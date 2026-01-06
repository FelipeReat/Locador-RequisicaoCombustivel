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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { ClipboardCheck, Search, CalendarCheck, ArrowUp, ArrowDown, Plus, Trash2, Check, CheckCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useSmartInvalidation, useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";

type Vehicle = {
  id: number;
  plate: string;
  model: string;
  brand: string;
  status: string;
  mileage: string;
  companyId: number | null;
};

type Company = {
  id: number;
  name: string;
};

type FuelLevel = 'empty' | 'quarter' | 'half' | 'three_quarters' | 'full';

type VehicleChecklist = {
  id: number;
  vehicleId: number;
  userId: number;
  kmInitial: number;
  kmFinal?: number;
  fuelLevelStart: FuelLevel;
  fuelLevelEnd?: FuelLevel;
  inspectionStart?: string;
  inspectionEnd?: string;
  status: 'open' | 'closed';
  startDate: string;
  endDate?: string;
};

type Analytics = {
  completenessRate: number;
  openCount: number;
  closedCount: number;
  avgKmPerTrip: number;
  activeVehiclesWithOpen: number;
  dailyTrend: { date: string; count: number }[];
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
  const [exitObsDefaults, setExitObsDefaults] = useState({
    scratches: false,
    dents: false,
    tireOk: true,
    lightsOk: true,
    documentsOk: true,
    cleanInterior: true,
    cleanExterior: true,
    notes: "",
  });
  const [showObsEditor, setShowObsEditor] = useState(false);
  const [obsConfig, setObsConfig] = useState<ObsItem[]>([
    { key: 'scratches', label: 'Arranhões', defaultChecked: false, column: 1, order: 1, group: 'inspecao_veiculo' },
    { key: 'dents', label: 'Batidas', defaultChecked: false, column: 2, order: 2, group: 'inspecao_veiculo' },
    { key: 'tireOk', label: 'Pneus OK', defaultChecked: true, column: 1, order: 3, group: 'inspecao_veiculo' },
    { key: 'lightsOk', label: 'Iluminação OK', defaultChecked: true, column: 2, order: 4, group: 'seguranca' },
    { key: 'documentsOk', label: 'Documentos OK', defaultChecked: true, column: 1, order: 5, group: 'condutor_veiculo' },
    { key: 'cleanInterior', label: 'Limpeza interna', defaultChecked: true, column: 2, order: 6, group: 'equipamentos' },
    { key: 'cleanExterior', label: 'Limpeza externa', defaultChecked: true, column: 1, order: 7, group: 'inspecao_veiculo' },
  ]);
  const obsGroups: { key: ObsGroupKey; label: string }[] = [
    { key: 'inspecao_veiculo', label: 'Inspeção do Veículo' },
    { key: 'seguranca', label: 'Sistema de Segurança' },
    { key: 'equipamentos', label: 'Equipamentos Internos' },
    { key: 'condutor_veiculo', label: 'Inspeção do Condutor e Veículo' },
  ];
  const [extraNotes, setExtraNotes] = useState<string[]>([]);
  const [newNoteText, setNewNoteText] = useState("");
  const [newObsLabel, setNewObsLabel] = useState("");
  const [newObsGroup, setNewObsGroup] = useState<ObsGroupKey>('inspecao_veiculo');
  const [newObsColumn, setNewObsColumn] = useState<1 | 2>(1);
  const [newObsDefault, setNewObsDefault] = useState(false);

  const obsLabels: Record<ObsKey, string> = useMemo(() => {
    const map: Record<ObsKey, string> = {
      scratches: 'Arranhões', dents: 'Batidas', tireOk: 'Pneus OK', lightsOk: 'Iluminação OK', documentsOk: 'Documentos OK', cleanInterior: 'Limpeza interna', cleanExterior: 'Limpeza externa'
    } as Record<ObsKey, string>;
    obsConfig.forEach(i => { map[i.key] = i.label });
    return map;
  }, [obsConfig]);

  function applyObsDefaultsToFormFor(vehicleId: string | null) {
    const defaults: Record<string, boolean | undefined> = obsConfig.reduce((acc, i) => { acc[i.key] = undefined; return acc; }, {} as Record<string, boolean | undefined>);
    const notesText = [exitObsDefaults.notes, ...extraNotes].filter(Boolean).join('\n');
    const base: any = {
      vehicleId: vehicleId ?? "",
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

  // Persistence for obsConfig
  const { data: savedObsConfig, isLoading: isLoadingConfig } = useQuery<ObsItem[]>({ 
    queryKey: ['/api/settings/obs_config'],
    queryFn: async () => {
      const res = await fetch('/api/settings/obs_config');
      if (!res.ok) throw new Error("Failed to fetch config");
      const data = await res.json();
      return Array.isArray(data) && data.length > 0 ? data : null;
    }
  });

  const saveConfigMutation = useMutation({
    mutationFn: async (newConfig: ObsItem[]) => {
      await fetch('/api/settings/obs_config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao salvar configurações.", variant: "destructive" });
    }
  });

  const [isConfigLoaded, setIsConfigLoaded] = useState(false);

  useEffect(() => {
    if (savedObsConfig) {
      setObsConfig(savedObsConfig);
    }
    setIsConfigLoaded(true);
  }, [savedObsConfig]);

  useEffect(() => {
    if (isConfigLoaded && !isLoadingConfig) {
      const timeout = setTimeout(() => {
        saveConfigMutation.mutate(obsConfig);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [obsConfig, isConfigLoaded, isLoadingConfig]);

  const activeVehicles = useMemo(() => vehicles.filter(v => v.status === "active" && v.companyId !== null), [vehicles]);
  const filteredVehicles = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const companyFiltered = selectedCompanyId === null
      ? activeVehicles
      : activeVehicles.filter(v => v.companyId === selectedCompanyId);
    return companyFiltered.filter(v =>
      v.plate.toLowerCase().includes(term) ||
      v.model.toLowerCase().includes(term) ||
      v.brand.toLowerCase().includes(term)
    );
  }, [activeVehicles, searchTerm, selectedCompanyId]);

  const openByVehicle = useMemo(() => {
    const set = new Set(openChecklists.map(c => c.vehicleId));
    return set;
  }, [openChecklists]);

  // Exit form
  const exitForm = useForm<{ vehicleId: string; kmInitial: string; fuelLevelStart: FuelLevel; startDate: string; notes: string } & Record<string, boolean | undefined>>({
    defaultValues: {
      vehicleId: "",
      kmInitial: "",
      fuelLevelStart: "half",
      startDate: nowManausLocalInput(),
      notes: "",
    },
  });

  const createExit = useMutation({
    mutationFn: async (payload: { vehicleId: number; userId: number; kmInitial: number; fuelLevelStart: FuelLevel; startDate: string; inspectionStart: string }) => {
      const res = await fetch("/api/checklists/exit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Erro ao criar saída");
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
  const returnForm = useForm<{ selectedChecklistId: string; kmFinal: string; fuelLevelEnd: FuelLevel; endDate: string; notes: string } & Record<string, boolean | undefined>>({
    defaultValues: {
      selectedChecklistId: "",
      kmFinal: "",
      fuelLevelEnd: "half",
      endDate: nowManausLocalInput(),
      notes: "",
    },
  });

  const closeReturn = useMutation({
    mutationFn: async ({ id, kmFinal, fuelLevelEnd, endDate, inspectionEnd }: { id: number; kmFinal: number; fuelLevelEnd: FuelLevel; endDate: string; inspectionEnd: string }) => {
      const res = await fetch(`/api/checklists/return/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kmFinal, fuelLevelEnd, endDate, inspectionEnd }),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Erro ao concluir retorno");
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
      // Tenta DELETE; se falhar por resposta inválida, usa POST fallback
      const resDel = await fetch(`/api/checklists/${id}`, { method: "DELETE", headers: { "Accept": "application/json" } });
      const ctDel = resDel.headers.get("content-type") || "";
      if (resDel.ok && ctDel.includes("application/json")) {
        return resDel.json();
      }
      const resPost = await fetch(`/api/checklists/${id}/delete`, { method: "POST", headers: { "Accept": "application/json" } });
      const ctPost = resPost.headers.get("content-type") || "";
      if (!resPost.ok) {
        if (ctPost.includes("application/json")) {
          const payload = await resPost.json();
          throw new Error(payload?.message || "Erro ao excluir checklist");
        } else {
          const text = await resPost.text();
          throw new Error(text || "Erro ao excluir checklist");
        }
      }
      if (!ctPost.includes("application/json")) {
        throw new Error("Resposta inválida do servidor");
      }
      return resPost.json();
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
    mutationFn: async (id: number) => {
      const sessionId = localStorage.getItem('session-id') || "";
      const res = await fetch(`/api/checklists/${id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": sessionId
        }
      });
      const ct = res.headers.get("content-type") || "";
      if (!res.ok) {
        if (ct.includes("application/json")) {
          const payload = await res.json();
          throw new Error(payload?.message || "Erro ao aprovar checklist");
        } else {
          const text = await res.text();
          throw new Error(text || "Erro ao aprovar checklist");
        }
      }
      if (!ct.includes("application/json")) {
        throw new Error("Resposta inválida do servidor");
      }
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
    { value: "empty", label: "vazio" },
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
  function formatDateBR(d?: string | number | Date) {
    if (!d) return "-";
    const parts = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Manaus', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(d));
    const map: Record<string, string> = Object.fromEntries(parts.map(p => [p.type, p.value]));
    return `${map.day}/${map.month}/${map.year}`;
  }
  function nowManausLocalInput() {
    const parts = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Manaus', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
    const map: Record<string, string> = Object.fromEntries(parts.map(p => [p.type, p.value]));
    return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}`;
  }

  return (
    <div className="flex-1">
      <Header title={t('vehicle-checklist')} subtitle={t('manage-company-vehicles')} />

      <div className="mobile-container space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="saida">Saída</TabsTrigger>
              <TabsTrigger value="entrada">Entrada</TabsTrigger>
            </TabsList>
            {(user?.role === 'admin' || user?.role === 'manager') && (
              <Button variant="outline" size="sm" onClick={() => setShowObsEditor(v => !v)}>
                Editar observações
              </Button>
            )}
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

            {(user?.role === 'admin' || user?.role === 'manager') && showObsEditor && (
              <Card>
                <CardHeader>
                  <CardTitle>Editar observações</CardTitle>
                  <CardDescription>Personalize rótulos, posições, ordem e padrões</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    {obsGroups.map(group => {
                      const items = obsConfig.filter(i => i.group === group.key).sort((a,b)=>a.order-b.order);
                      return (
                        <div key={`editor-${group.key}`} className="space-y-2">
                          <h4 className="font-semibold">{group.label}</h4>
                          <div className="space-y-2">
                            {items.map((item) => (
                              <div key={item.key} className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-center">
                                <div className="sm:col-span-2">
                                  <Label>Nome</Label>
                                  <Input value={item.label} onChange={(e)=> setObsConfig(cfg=> cfg.map(x=> x.key===item.key? { ...x, label: e.target.value }: x))} />
                                </div>
                                <div>
                                  <Label>Padrão</Label>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant={item.defaultChecked ? "default" : "outline"}
                                      className={item.defaultChecked ? "bg-green-600 hover:bg-green-700 h-7 px-3" : "h-7 px-3 text-muted-foreground"}
                                      onClick={() => setObsConfig(cfg=> cfg.map(x=> x.key===item.key? { ...x, defaultChecked: true }: x))}
                                    >
                                      Sim
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant={!item.defaultChecked ? "destructive" : "outline"}
                                      className={!item.defaultChecked ? "h-7 px-3" : "h-7 px-3 text-muted-foreground"}
                                      onClick={() => setObsConfig(cfg=> cfg.map(x=> x.key===item.key? { ...x, defaultChecked: false }: x))}
                                    >
                                      Não
                                    </Button>
                                  </div>
                                </div>
                                <div>
                                  <Label>Coluna</Label>
                                  <Select value={String(item.column)} onValueChange={(val)=> setObsConfig(cfg=> cfg.map(x=> x.key===item.key? { ...x, column: parseInt(val) as 1|2 }: x))}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="1">Esquerda</SelectItem>
                                      <SelectItem value="2">Direita</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label>Grupo</Label>
                                  <Select value={item.group} onValueChange={(val)=> setObsConfig(cfg=> cfg.map(x=> x.key===item.key? { ...x, group: val as ObsGroupKey }: x))}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {obsGroups.map(g => (
                                        <SelectItem key={g.key} value={g.key}>{g.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex items-center gap-2 justify-end">
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="icon"
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => {
                                      if (confirm('Tem certeza que deseja excluir esta observação?')) {
                                        setObsConfig(cfg => cfg.filter(x => x.key !== item.key));
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                  <Button type="button" variant="outline" size="icon" onClick={()=> setObsConfig(cfg=> {
                                    const arr = [...cfg];
                                    const pos = arr.findIndex(x=>x.key===item.key);
                                    if (pos>0) { const prevOrder = arr[pos-1].order; arr[pos-1].order = arr[pos].order; arr[pos].order = prevOrder; }
                                    return arr;
                                  })}><ArrowUp className="h-4 w-4" /></Button>
                                  <Button type="button" variant="outline" size="icon" onClick={()=> setObsConfig(cfg=> {
                                    const arr = [...cfg];
                                    const pos = arr.findIndex(x=>x.key===item.key);
                                    if (pos<arr.length-1) { const nextOrder = arr[pos+1].order; arr[pos+1].order = arr[pos].order; arr[pos].order = nextOrder; }
                                    return arr;
                                  })}><ArrowDown className="h-4 w-4" /></Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    <div className="border-t pt-4 space-y-2">
                      <h4 className="font-semibold">Adicionar observação</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-center">
                        <div className="sm:col-span-2">
                          <Label>Nome</Label>
                          <Input value={newObsLabel} onChange={(e)=> setNewObsLabel(e.target.value)} placeholder="Ex: Extintor OK" />
                        </div>
                        <div>
                          <Label>Padrão</Label>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant={newObsDefault ? "default" : "outline"}
                              className={newObsDefault ? "bg-green-600 hover:bg-green-700 h-7 px-3" : "h-7 px-3 text-muted-foreground"}
                              onClick={() => setNewObsDefault(true)}
                            >
                              Sim
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={!newObsDefault ? "destructive" : "outline"}
                              className={!newObsDefault ? "h-7 px-3" : "h-7 px-3 text-muted-foreground"}
                              onClick={() => setNewObsDefault(false)}
                            >
                              Não
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label>Coluna</Label>
                          <Select value={String(newObsColumn)} onValueChange={(val)=> setNewObsColumn(parseInt(val) as 1|2)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Esquerda</SelectItem>
                              <SelectItem value="2">Direita</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Grupo</Label>
                          <Select value={newObsGroup} onValueChange={(val)=> setNewObsGroup(val as ObsGroupKey)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {obsGroups.map(g => (
                                <SelectItem key={g.key} value={g.key}>{g.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center justify-end">
                          <Button
                            type="button"
                            onClick={() => {
                              const label = newObsLabel.trim() || 'Observação';
                              const newItem: ObsItem = {
                                key: `obs_${Date.now()}` as ObsKey,
                                label,
                                defaultChecked: newObsDefault,
                                column: newObsColumn,
                                order: obsConfig.length + 1,
                                group: newObsGroup
                              };
                              setObsConfig(cfg => [...cfg, newItem]);
                              setNewObsLabel("");
                              setNewObsDefault(false);
                              setNewObsColumn(1);
                              setNewObsGroup('inspecao_veiculo');
                              toast({ title: "Observação adicionada", description: "Você pode mover entre grupos e colunas." });
                            }}
                          >
                            Adicionar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Observações adicionais</Label>
                    <div className="space-y-2">
                      {extraNotes.map((n, i)=> (
                        <div key={i} className="flex items-center gap-2">
                          <Input value={n} onChange={(e)=> setExtraNotes(arr=> arr.map((x,idx)=> idx===i ? e.target.value : x))} />
                          <Button type="button" variant="outline" size="icon" onClick={()=> setExtraNotes(arr=> arr.filter((_,idx)=> idx!==i))}><Trash2 className="h-4 w-4" /></Button>
                          <Button type="button" variant="outline" size="icon" onClick={()=> setExtraNotes(arr=> { if(i===0) return arr; const b=[...arr]; [b[i-1], b[i]] = [b[i], b[i-1]]; return b; })}><ArrowUp className="h-4 w-4" /></Button>
                          <Button type="button" variant="outline" size="icon" onClick={()=> setExtraNotes(arr=> { if(i===arr.length-1) return arr; const b=[...arr]; [b[i+1], b[i]] = [b[i], b[i+1]]; return b; })}><ArrowDown className="h-4 w-4" /></Button>
                        </div>
                      ))}
                      <div className="flex items-center gap-2">
                        <Input placeholder="Nova observação" value={newNoteText} onChange={(e)=> setNewNoteText(e.target.value)} />
                        <Button type="button" onClick={()=> { if(newNoteText.trim()) { setExtraNotes(arr=> [...arr, newNoteText.trim()]); setNewNoteText(''); } }}><Plus className="h-4 w-4 mr-2" />Adicionar linha</Button>
                      </div>
                    </div>
                    <div>
                      <Label>Observação livre padrão</Label>
                      <Input value={exitObsDefaults.notes} onChange={(e)=> setExitObsDefaults(s=> ({...s, notes: e.target.value}))} placeholder="Texto livre padrão" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <span>Veículos Ativos</span>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
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
                        <TableHead>Modelo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVehicles.map(v => (
                        <TableRow key={v.id}>
                          <TableCell className="font-medium">{v.plate}</TableCell>
                          <TableCell>{v.model}</TableCell>
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
                            >
                              {t('new-exit-checklist')}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>



            {/* Formulário de Saída (Checklist) */}
            <Card className="hidden">
              <CardHeader>
                <CardTitle>Checklist de Saída</CardTitle>
                <CardDescription>Preencha as condições do veículo na saída</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...exitForm}>
                  <form
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    onSubmit={exitForm.handleSubmit((values) => {
                      const vid = parseInt(values.vehicleId);
                      if (!vid) {
                        exitForm.setError('vehicleId', { message: 'Selecione um veículo' });
                        return;
                      }
                      const kmInitial = parseFloat(values.kmInitial);
                      if (isNaN(kmInitial) || kmInitial < 0) {
                        exitForm.setError('kmInitial', { message: 'Informe uma quilometragem válida' });
                        return;
                      }
                      const startObj: any = {};
                      obsConfig.forEach(i => {
                        startObj[i.key] = (values as any)[i.key] !== false;
                      });
                      startObj.notes = (values as any).notes;
                      const inspectionStart = JSON.stringify(startObj);
                      createExit.mutate({ vehicleId: vid, userId: user!.id, kmInitial, fuelLevelStart: values.fuelLevelStart, startDate: values.startDate, inspectionStart });
                    })}
                  >
                    <FormField
                      control={exitForm.control}
                      name="vehicleId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('vehicle')}</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
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

                    <div className="md:col-span-2 space-y-4">
                      {obsGroups.map(group => {
                        const items = obsConfig.filter(i => i.group === group.key).sort((a,b)=>a.order-b.order);
                        if (items.length === 0) return null;
                        return (
                          <div key={group.key} className="space-y-2">
                            <h4 className="font-semibold">{group.label}</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {items.filter(i=>i.column===1).map(i=> (
                                <FormField key={i.key} control={exitForm.control} name={i.key as any} render={({ field }) => (
                                  <FormItem className="flex items-center gap-2">
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange as any} />
                                    <FormLabel>{obsLabels[i.key]}</FormLabel>
                                  </FormItem>
                                )} />
                              ))}
                              {items.filter(i=>i.column===2).map(i=> (
                                <FormField key={i.key} control={exitForm.control} name={i.key as any} render={({ field }) => (
                                  <FormItem className="flex items-center gap-2">
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange as any} />
                                    <FormLabel>{obsLabels[i.key]}</FormLabel>
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
                        <FormItem className="md:col-span-2">
                          <FormLabel>Observações</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Detalhes adicionais" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="md:col-span-2 mobile-button-group pt-2">
                      <Button type="submit" className="w-full sm:w-auto" disabled={createExit.isPending}>{t('confirm-exit')}</Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

          </TabsContent>
          
          <TabsContent value="entrada" className="space-y-6">

            {/* Histórico resumido */}
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Saídas</CardTitle>
                <CardDescription>Registros de saídas e retornos por veículo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mobile-table-container">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Veículo</TableHead>
                        <TableHead>Motorista</TableHead>
                        <TableHead>KM Inicial</TableHead>
                        <TableHead>Nível Comb. (início)</TableHead>
                        <TableHead>Data Saída</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>KM Final</TableHead>
                        <TableHead>Data Retorno</TableHead>
                        <TableHead className="text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...openChecklists, ...closedChecklists]
                        .sort((a, b) => new Date((b.endDate || b.startDate)).getTime() - new Date((a.endDate || a.startDate)).getTime())
                        .map(c => {
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
                                <TableCell>{checklistUser?.fullName || checklistUser?.username || '-'}</TableCell>
                                <TableCell className="font-mono">{c.kmInitial} km</TableCell>
                                <TableCell className="text-center">{fuelLabel(c.fuelLevelStart)}</TableCell>
                                <TableCell>{formatDateBR(c.startDate)}</TableCell>
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
                                <TableCell className="font-mono">{c.kmFinal ? `${c.kmFinal} km` : '-'}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {formatDateBR(c.endDate)}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  {isClosed ? (
                                    <div className="flex items-center justify-end gap-2">
                                      {(user?.role !== 'driver') && !end?.approvedByUserId && (
                                        <Button size="sm" variant="default" onClick={() => approveChecklist.mutate(c.id)}>
                                          <Check className="h-4 w-4 mr-1" />
                                          Aprovar
                                        </Button>
                                      )}
                                      <Button size="sm" variant={isExpanded ? 'secondary' : 'outline'} onClick={() => setExpandedClosedId(isExpanded ? null : c.id)}>
                                        {isExpanded ? 'Fechar' : 'Ver detalhes'}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          import('@/lib/pdf-generator')
                                            .then(({ PDFGenerator }) => {
                                              const gen = new PDFGenerator('portrait');
                                              const pdfUser = users.find(u => u.id === c.userId) || user;
                                              const groupsToPass = obsGroups.map(g => ({ key: g.key, label: g.label }));
                                              const itemsToPass = obsConfig.map(i => ({ key: i.key, label: obsLabels[i.key], group: i.group }));
                                              gen.generateReturnedChecklistPDF(c, v, pdfUser, { company: 'Sistema de Controle de Abastecimento', obsGroups: groupsToPass, obsItems: itemsToPass });
                                              const dateStr = (c.endDate || c.startDate || '').toString().slice(0, 10);
                                              const plate = v?.plate || String(c.vehicleId);
                                              gen.save(`checklist-retorno-${plate}-${dateStr || new Date().toISOString().slice(0,10)}.pdf`);
                                              toast({ title: "PDF Gerado", description: "Documento exportado com sucesso." });
                                            })
                                            .catch(() => {
                                              toast({ title: "Erro", description: "Falha ao gerar PDF do checklist.", variant: "destructive" });
                                            });
                                        }}
                                      >
                                        Exportar PDF
                                      </Button>
                                      {(user?.role === 'admin' || user?.role === 'manager') && (
                                        <Button size="sm" variant="destructive" onClick={() => setConfirmDeleteChecklistId(c.id)}>
                                          Excluir
                                        </Button>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-end gap-2">
                                      <Button size="sm" variant={isExpanded ? 'secondary' : 'default'} onClick={() => {
                                      const next = isExpanded ? null : c.id;
                                      setExpandedReturnId(next);
                                      if (!next) return;
                                      const startVals = c.inspectionStart ? JSON.parse(c.inspectionStart) : {};
                                      const base: any = {
                                        selectedChecklistId: String(c.id),
                                        kmFinal: '',
                                        fuelLevelEnd: 'half',
                                        endDate: nowManausLocalInput(),
                                        notes: '',
                                      };
                                      const dynamicDefaults: Record<string, boolean | undefined> = {};
                                      returnForm.reset({ ...base, ...dynamicDefaults });
                                      }}>
                                        {isExpanded ? 'Fechar' : t('register-return-checklist')}
                                      </Button>
                                      {(user?.role === 'admin' || user?.role === 'manager') && (
                                        <Button size="sm" variant="destructive" onClick={() => setConfirmDeleteChecklistId(c.id)}>
                                          Excluir
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                              {isExpanded && (
                                <TableRow>
                                  <TableCell colSpan={9}>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                      <Card>
                                        <CardHeader>
                                          <CardTitle>Dados da Saída</CardTitle>
                                          <CardDescription>Condições registradas na abertura</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                          <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                              <Label>KM Inicial</Label>
                                              <div className="font-mono">{c.kmInitial} km</div>
                                            </div>
                                            <div>
                                              <Label>Nível Combustível</Label>
                                              <div className="text-center">{fuelLabel(c.fuelLevelStart)}</div>
                                            </div>
                                            <div className="lg:col-span-2">
                                              <Label>Inspeção</Label>
                                              <div className="mt-2 space-y-3">
                                                {obsGroups.map(group => {
                                                  const items = obsConfig.filter(i => i.group === group.key).sort((a,b)=>a.order-b.order);
                                                  if (items.length === 0) return null;
                                                  return (
                                                    <div key={`start-${group.key}`}>
                                                      <div className="font-medium">{group.label}</div>
                                                      <div className="mt-1 grid grid-cols-2 gap-2">
                                                        {items.map(i => (
                                                          <div key={`start-item-${i.key}`}>- {obsLabels[i.key]}: {start[i.key] === true ? 'Sim' : 'Não'}</div>
                                                        ))}
                                                      </div>
                                                    </div>
                                                  );
                                                })}
                                                <div>- Observações: {start.notes || '-'}</div>
                                              </div>
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                      {isClosed ? (
                                        <Card>
                                          <CardHeader>
                                            <CardTitle>Dados do Retorno</CardTitle>
                                            <CardDescription>Condições registradas na entrada</CardDescription>
                                          </CardHeader>
                                          <CardContent>
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                              <div>
                                                <Label>KM Final</Label>
                                                <div className="font-mono">{c.kmFinal} km</div>
                                              </div>
                                              <div>
                                                <Label>Nível Combustível</Label>
                                              <div className="text-center">{fuelLabel(c.fuelLevelEnd)}</div>
                                              </div>
                                              <div>
                                                <Label>Retorno</Label>
                                              <div>{formatDateBR(c.endDate)}</div>
                                              </div>
                                              <div className="lg:col-span-2">
                                              <Label>Inspeção</Label>
                                              <div className="mt-2 space-y-3">
                                                {obsGroups.map(group => {
                                                  const items = obsConfig.filter(i => i.group === group.key).sort((a,b)=>a.order-b.order);
                                                  if (items.length === 0) return null;
                                                  return (
                                                    <div key={`end-${group.key}`}>
                                                      <div className="font-medium">{group.label}</div>
                                                      <div className="mt-1 grid grid-cols-2 gap-2">
                                                        {items.map(i => (
                                                          <div key={`end-item-${i.key}`}>- {obsLabels[i.key]}: {(end[i.key] === false) ? 'Não' : (end[i.key] ? 'Sim' : 'Sim')}</div>
                                                        ))}
                                                      </div>
                                                    </div>
                                                  );
                                                })}
                                                <div>- Observações: {end.notes || '-'}</div>
                                                {end?.approvedByName && (
                                                  <div>- Conferido por: {end.approvedByName}</div>
                                                )}
                                                {end?.approvedAt && (
                                                  <div>- Data da Conferência: {formatDateBR(end.approvedAt)}</div>
                                                )}
                                              </div>
                                              </div>
                                            </div>
                                          </CardContent>
                                        </Card>
                                      ) : (
                                        <Card>
                                          <CardHeader>
                                            <CardTitle>Registrar Retorno</CardTitle>
                                            <CardDescription>Preencha as condições no retorno</CardDescription>
                                          </CardHeader>
                                          <CardContent>
                                            <ScrollArea className="h-[60vh] pr-4">
                                            <Form {...returnForm}>
                                              <form
                                                className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-1"
                                                onSubmit={returnForm.handleSubmit((values) => {
                                                  const id = parseInt(values.selectedChecklistId);
                                                  if (!id) {
                                                    returnForm.setError('selectedChecklistId', { message: 'Selecione uma saída' });
                                                    return;
                                                  }
                                                  
                                                  // Validation for observations
                                                  const missingObs = obsConfig.find(i => (values as any)[i.key] === undefined || (values as any)[i.key] === null);
                                                  if (missingObs) {
                                                    toast({ title: "Atenção", description: "Preencha todas as observações obrigatórias.", variant: "destructive" });
                                                    return;
                                                  }

                                                  const kmFinal = parseFloat(values.kmFinal);
                                                  if (isNaN(kmFinal) || kmFinal < 0) {
                                                    returnForm.setError('kmFinal', { message: 'Informe uma quilometragem válida' });
                                                    return;
                                                  }
                                                  const endObj: any = {};
                                                  obsConfig.forEach(i => {
                                                    endObj[i.key] = (values as any)[i.key];
                                                  });
                                                  endObj.notes = values.notes;
                                                  const inspectionEnd = JSON.stringify(endObj);
                                                  closeReturn.mutate({ id, kmFinal, fuelLevelEnd: values.fuelLevelEnd, endDate: values.endDate, inspectionEnd });
                                                })}
                                              >
                                                <FormField control={returnForm.control} name="selectedChecklistId" render={({ field }) => (
                                                  <FormItem>
                                                    <FormLabel>Saída</FormLabel>
                                                    <FormControl>
                                                      <Input {...field} value={field.value} readOnly />
                                                    </FormControl>
                                                    <FormMessage />
                                                  </FormItem>
                                                )} />
                                                <FormField control={returnForm.control} name="kmFinal" render={({ field }) => (
                                                  <FormItem>
                                                    <FormLabel>KM Final</FormLabel>
                                                    <FormControl>
                                                      <Input {...field} type="number" min={0} placeholder="Ex: 12500" />
                                                    </FormControl>
                                                    <FormMessage />
                                                  </FormItem>
                                                )} />
                                                <FormField control={returnForm.control} name="fuelLevelEnd" render={({ field }) => (
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
                                                )} />
                                            <FormField control={returnForm.control} name="endDate" render={({ field }) => (
                                              <FormItem>
                                                <FormLabel>Data/Hora</FormLabel>
                                                <FormControl>
                                                  <Input {...field} type="datetime-local" lang="pt-BR" />
                                                </FormControl>
                                                <FormMessage />
                                              </FormItem>
                                            )} />
                                                <div className="sm:col-span-2 space-y-4">
                                                  {obsGroups.map(group => {
                                                    const items = obsConfig.filter(i => i.group === group.key).sort((a,b)=>a.order-b.order);
                                                    if (items.length === 0) return null;
                                                    return (
                                                      <div key={group.key} className="space-y-2">
                                                        <h4 className="font-semibold">{group.label}</h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                          {items.filter(i=>i.column===1).map(i=> (
                                                            <FormField key={i.key} control={returnForm.control} name={i.key as any} render={({ field }) => (
                                                            <FormItem className="flex items-center justify-between p-1">
                                                              <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 !mt-0">{obsLabels[i.key]}</FormLabel>
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
                                                          {items.filter(i=>i.column===2).map(i=> (
                                                            <FormField key={i.key} control={returnForm.control} name={i.key} render={({ field }) => (
                                                            <FormItem className="flex items-center justify-between p-1">
                                                              <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 !mt-0">{obsLabels[i.key]}</FormLabel>
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
                                                <FormField control={returnForm.control} name="notes" render={({ field }) => (
                                                  <FormItem className="sm:col-span-2">
                                                    <FormLabel>Observações</FormLabel>
                                                    <FormControl>
                                                      <Input {...field} placeholder="Detalhes do retorno" />
                                                    </FormControl>
                                                    <FormMessage />
                                                  </FormItem>
                                                )} />
                                                <div className="sm:col-span-2 mobile-button-group pt-2">
                                                  <Button type="submit" className="w-full sm:w-auto" disabled={closeReturn.isPending}>{t('confirm-return')}</Button>
                                                </div>
                                              </form>
                                            </Form>
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
                        })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
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
                const missingObs = obsConfig.find(i => (values as any)[i.key] === undefined || (values as any)[i.key] === null);
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
                obsConfig.forEach(obs => {
                  inspectionObj[obs.key] = (values as any)[obs.key];
                });
                inspectionObj.notes = values.notes;
                const inspectionStart = JSON.stringify(inspectionObj);
                createExit.mutate({ vehicleId: vid, userId: user!.id, kmInitial, fuelLevelStart: values.fuelLevelStart, startDate: values.startDate, inspectionStart });
              })}
            >
              <FormField
                control={exitForm.control}
                name="vehicleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('vehicle')}</FormLabel>
                    <Select value={field.value} onValueChange={(val) => { if (lockedVehicleId === null) field.onChange(val); }}>
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

              <div className="space-y-4">
                {obsGroups.map(group => {
                  const items = obsConfig.filter(i => i.group === group.key).sort((a,b)=>a.order-b.order);
                  if (items.length === 0) return null;
                  return (
                    <div key={`exit-${group.key}`} className="space-y-2">
                      <h4 className="font-semibold">{group.label}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {items.filter(i=>i.column===1).map(i=> (
                          <FormField key={i.key} control={exitForm.control} name={i.key} render={({ field }) => (
                            <FormItem className="flex items-center justify-between p-1">
                              <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 !mt-0">{obsLabels[i.key]}</FormLabel>
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
                        {items.filter(i=>i.column===2).map(i=> (
                          <FormField key={i.key} control={exitForm.control} name={i.key} render={({ field }) => (
                            <FormItem className="flex items-center justify-between p-1">
                              <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 !mt-0">{obsLabels[i.key]}</FormLabel>
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
type ObsKey = 'scratches' | 'dents' | 'tireOk' | 'lightsOk' | 'documentsOk' | 'cleanInterior' | 'cleanExterior';
type ObsGroupKey = 'inspecao_veiculo' | 'seguranca' | 'equipamentos' | 'condutor_veiculo';
type ObsItem = { key: ObsKey; label: string; defaultChecked: boolean; column: 1 | 2; order: number; group: ObsGroupKey };
