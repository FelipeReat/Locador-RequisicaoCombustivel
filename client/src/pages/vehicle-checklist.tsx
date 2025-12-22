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
import { ClipboardCheck, Search, CalendarCheck, ArrowUp, ArrowDown, Plus, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    { key: 'scratches', label: 'Arranhões', defaultChecked: false, column: 1, order: 1 },
    { key: 'dents', label: 'Batidas', defaultChecked: false, column: 2, order: 2 },
    { key: 'tireOk', label: 'Pneus OK', defaultChecked: true, column: 1, order: 3 },
    { key: 'lightsOk', label: 'Iluminação OK', defaultChecked: true, column: 2, order: 4 },
    { key: 'documentsOk', label: 'Documentos OK', defaultChecked: true, column: 1, order: 5 },
    { key: 'cleanInterior', label: 'Limpeza interna', defaultChecked: true, column: 2, order: 6 },
    { key: 'cleanExterior', label: 'Limpeza externa', defaultChecked: true, column: 1, order: 7 },
  ]);
  const [extraNotes, setExtraNotes] = useState<string[]>([]);
  const [newNoteText, setNewNoteText] = useState("");

  const obsLabels: Record<ObsKey, string> = useMemo(() => {
    const map: Record<ObsKey, string> = {
      scratches: 'Arranhões', dents: 'Batidas', tireOk: 'Pneus OK', lightsOk: 'Iluminação OK', documentsOk: 'Documentos OK', cleanInterior: 'Limpeza interna', cleanExterior: 'Limpeza externa'
    } as Record<ObsKey, string>;
    obsConfig.forEach(i => { map[i.key] = i.label });
    return map;
  }, [obsConfig]);

  function applyObsDefaultsToFormFor(vehicleId: string | null) {
    const defaults: Record<ObsKey, boolean> = obsConfig.reduce((acc, i) => { acc[i.key] = i.defaultChecked; return acc; }, {
      scratches: false, dents: false, tireOk: true, lightsOk: true, documentsOk: true, cleanInterior: true, cleanExterior: true
    } as Record<ObsKey, boolean>);
    const notesText = [exitObsDefaults.notes, ...extraNotes].filter(Boolean).join('\n');
    exitForm.reset({
      vehicleId: vehicleId ?? "",
      kmInitial: "",
      fuelLevelStart: "half",
      startDate: nowManausLocalInput(),
      scratches: defaults.scratches,
      dents: defaults.dents,
      tireOk: defaults.tireOk,
      lightsOk: defaults.lightsOk,
      documentsOk: defaults.documentsOk,
      cleanInterior: defaults.cleanInterior,
      cleanExterior: defaults.cleanExterior,
      notes: notesText,
    });
  }

  const { data: vehicles = [] } = useQuery<Vehicle[]>({ queryKey: ["/api/vehicles"] });
  const { data: openChecklists = [] } = useQuery<VehicleChecklist[]>({ queryKey: ["/api/checklists/open"] });
  const { data: closedChecklists = [] } = useQuery<VehicleChecklist[]>({ queryKey: ["/api/checklists/closed"] });
  const { data: analytics } = useQuery<Analytics>({ queryKey: ["/api/checklists/stats/analytics"] });
  const { data: companies = [] } = useQuery<Company[]>({ queryKey: ["/api/companies"] });
  const { data: users = [] } = useQuery<any[]>({ queryKey: ["/api/users"] });

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
  const exitForm = useForm<{ vehicleId: string; kmInitial: string; fuelLevelStart: FuelLevel; startDate: string; scratches: boolean; dents: boolean; tireOk: boolean; lightsOk: boolean; documentsOk: boolean; cleanInterior: boolean; cleanExterior: boolean; notes: string }>({
    defaultValues: {
      vehicleId: "",
      kmInitial: "",
      fuelLevelStart: "half",
      startDate: nowManausLocalInput(),
      scratches: false,
      dents: false,
      tireOk: true,
      lightsOk: true,
      documentsOk: true,
      cleanInterior: true,
      cleanExterior: true,
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
  const returnForm = useForm<{ selectedChecklistId: string; kmFinal: string; fuelLevelEnd: FuelLevel; endDate: string; scratches: boolean; dents: boolean; tireOk: boolean; lightsOk: boolean; documentsOk: boolean; cleanInterior: boolean; cleanExterior: boolean; notes: string }>({
    defaultValues: {
      selectedChecklistId: "",
      kmFinal: "",
      fuelLevelEnd: "half",
      endDate: nowManausLocalInput(),
      scratches: false,
      dents: false,
      tireOk: true,
      lightsOk: true,
      documentsOk: true,
      cleanInterior: true,
      cleanExterior: true,
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
                  <div className="space-y-2">
                    {obsConfig.sort((a,b)=>a.order-b.order).map((item, idx) => (
                      <div key={item.key} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
                        <div className="sm:col-span-2">
                          <Label>Nome</Label>
                          <Input value={item.label} onChange={(e)=> setObsConfig(cfg=> cfg.map(x=> x.key===item.key? { ...x, label: e.target.value }: x))} />
                        </div>
                        <div>
                          <Label>Padrão</Label>
                          <div className="flex items-center gap-2">
                            <Checkbox checked={item.defaultChecked} onCheckedChange={(v)=> setObsConfig(cfg=> cfg.map(x=> x.key===item.key? { ...x, defaultChecked: !!v }: x))} />
                            <span>Marcado</span>
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
                        <div className="flex items-center gap-2 justify-end">
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
                      const inspectionStart = JSON.stringify({
                        scratches: values.scratches,
                        dents: values.dents,
                        tireOk: values.tireOk,
                        lightsOk: values.lightsOk,
                        documentsOk: values.documentsOk,
                        cleanInterior: values.cleanInterior,
                        cleanExterior: values.cleanExterior,
                        notes: values.notes,
                      });
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

                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField control={exitForm.control} name="scratches" render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <Checkbox checked={field.value} onCheckedChange={field.onChange as any} />
                          <FormLabel>Possui arranhões</FormLabel>
                        </FormItem>
                      )} />
                      <FormField control={exitForm.control} name="dents" render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <Checkbox checked={field.value} onCheckedChange={field.onChange as any} />
                          <FormLabel>Possui amassados/batidas</FormLabel>
                        </FormItem>
                      )} />
                      <FormField control={exitForm.control} name="tireOk" render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <Checkbox checked={field.value} onCheckedChange={field.onChange as any} />
                          <FormLabel>Pneus em condição OK</FormLabel>
                        </FormItem>
                      )} />
                      <FormField control={exitForm.control} name="lightsOk" render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <Checkbox checked={field.value} onCheckedChange={field.onChange as any} />
                          <FormLabel>Iluminação OK</FormLabel>
                        </FormItem>
                      )} />
                      <FormField control={exitForm.control} name="documentsOk" render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <Checkbox checked={field.value} onCheckedChange={field.onChange as any} />
                          <FormLabel>Documentos OK</FormLabel>
                        </FormItem>
                      )} />
                      <FormField control={exitForm.control} name="cleanInterior" render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <Checkbox checked={field.value} onCheckedChange={field.onChange as any} />
                          <FormLabel>Limpeza interna</FormLabel>
                        </FormItem>
                      )} />
                      <FormField control={exitForm.control} name="cleanExterior" render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <Checkbox checked={field.value} onCheckedChange={field.onChange as any} />
                          <FormLabel>Limpeza externa</FormLabel>
                        </FormItem>
                      )} />
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
                                    <Badge variant="secondary">Concluída</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="font-mono">{c.kmFinal ? `${c.kmFinal} km` : '-'}</TableCell>
                                <TableCell>{formatDateBR(c.endDate)}</TableCell>
                                <TableCell className="text-right">
                                  {isClosed ? (
                                    <div className="flex items-center justify-end gap-2">
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
                                              gen.generateReturnedChecklistPDF(c, v, pdfUser, { company: 'Sistema de Controle de Abastecimento' });
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
                                      returnForm.reset({
                                        selectedChecklistId: String(c.id),
                                        kmFinal: '',
                                        fuelLevelEnd: 'half',
                                        endDate: nowManausLocalInput(),
                                        scratches: !!startVals.scratches,
                                        dents: !!startVals.dents,
                                        tireOk: startVals.tireOk !== false,
                                        lightsOk: startVals.lightsOk !== false,
                                        documentsOk: startVals.documentsOk !== false,
                                        cleanInterior: startVals.cleanInterior !== false,
                                        cleanExterior: startVals.cleanExterior !== false,
                                        notes: '',
                                      });
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
                                              <div className="mt-1 grid grid-cols-2 gap-2">
                                                <div>- Arranhões: {start.scratches ? 'Sim' : 'Não'}</div>
                                                <div>- Batidas: {start.dents ? 'Sim' : 'Não'}</div>
                                                <div>- Pneus OK: {start.tireOk === false ? 'Não' : 'Sim'}</div>
                                                <div>- Iluminação OK: {start.lightsOk === false ? 'Não' : 'Sim'}</div>
                                                <div>- Documentos OK: {start.documentsOk === false ? 'Não' : 'Sim'}</div>
                                                <div>- Limpeza interna: {start.cleanInterior === false ? 'Não' : 'Sim'}</div>
                                                <div>- Limpeza externa: {start.cleanExterior === false ? 'Não' : 'Sim'}</div>
                                                <div className="lg:col-span-2">- Observações: {start.notes || '-'}</div>
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
                                                <div className="mt-1 grid grid-cols-2 gap-2">
                                                  <div>- Arranhões: {end.scratches ? 'Sim' : 'Não'}</div>
                                                  <div>- Batidas: {end.dents ? 'Sim' : 'Não'}</div>
                                                  <div>- Pneus OK: {end.tireOk === false ? 'Não' : 'Sim'}</div>
                                                  <div>- Iluminação OK: {end.lightsOk === false ? 'Não' : 'Sim'}</div>
                                                  <div>- Documentos OK: {end.documentsOk === false ? 'Não' : 'Sim'}</div>
                                                  <div>- Limpeza interna: {end.cleanInterior === false ? 'Não' : 'Sim'}</div>
                                                  <div>- Limpeza externa: {end.cleanExterior === false ? 'Não' : 'Sim'}</div>
                                                  <div className="lg:col-span-2">- Observações: {end.notes || '-'}</div>
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
                                            <Form {...returnForm}>
                                              <form
                                                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                                                onSubmit={returnForm.handleSubmit((values) => {
                                                  const id = parseInt(values.selectedChecklistId);
                                                  if (!id) {
                                                    returnForm.setError('selectedChecklistId', { message: 'Selecione uma saída' });
                                                    return;
                                                  }
                                                  const kmFinal = parseFloat(values.kmFinal);
                                                  if (isNaN(kmFinal) || kmFinal < 0) {
                                                    returnForm.setError('kmFinal', { message: 'Informe uma quilometragem válida' });
                                                    return;
                                                  }
                                                  const inspectionEnd = JSON.stringify({
                                                    scratches: values.scratches,
                                                    dents: values.dents,
                                                    tireOk: values.tireOk,
                                                    lightsOk: values.lightsOk,
                                                    documentsOk: values.documentsOk,
                                                    cleanInterior: values.cleanInterior,
                                                    cleanExterior: values.cleanExterior,
                                                    notes: values.notes,
                                                  });
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
                                                <div className="sm:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                                                  {obsConfig.filter(i=>i.column===1).sort((a,b)=>a.order-b.order).map(i=> (
                                                    <FormField key={i.key} control={returnForm.control} name={i.key} render={({ field }) => (
                                                      <FormItem className="flex items-center gap-2">
                                                        <Checkbox checked={field.value} onCheckedChange={field.onChange as any} />
                                                        <FormLabel>{obsLabels[i.key]}</FormLabel>
                                                      </FormItem>
                                                    )} />
                                                  ))}
                                                  {obsConfig.filter(i=>i.column===2).sort((a,b)=>a.order-b.order).map(i=> (
                                                    <FormField key={i.key} control={returnForm.control} name={i.key} render={({ field }) => (
                                                      <FormItem className="flex items-center gap-2">
                                                        <Checkbox checked={field.value} onCheckedChange={field.onChange as any} />
                                                        <FormLabel>{obsLabels[i.key]}</FormLabel>
                                                      </FormItem>
                                                    )} />
                                                  ))}
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
          <Form {...exitForm}>
            <form
              className="space-y-4"
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
                const inspectionStart = JSON.stringify({
                  scratches: values.scratches,
                  dents: values.dents,
                  tireOk: values.tireOk,
                  lightsOk: values.lightsOk,
                  documentsOk: values.documentsOk,
                  cleanInterior: values.cleanInterior,
                  cleanExterior: values.cleanExterior,
                  notes: values.notes,
                });
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {obsConfig.filter(i=>i.column===1).sort((a,b)=>a.order-b.order).map(i=> (
                  <FormField key={i.key} control={exitForm.control} name={i.key} render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <Checkbox checked={field.value} onCheckedChange={field.onChange as any} />
                      <FormLabel>{obsLabels[i.key]}</FormLabel>
                    </FormItem>
                  )} />
                ))}
                {obsConfig.filter(i=>i.column===2).sort((a,b)=>a.order-b.order).map(i=> (
                  <FormField key={i.key} control={exitForm.control} name={i.key} render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <Checkbox checked={field.value} onCheckedChange={field.onChange as any} />
                      <FormLabel>{obsLabels[i.key]}</FormLabel>
                    </FormItem>
                  )} />
                ))}
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
type ObsItem = { key: ObsKey; label: string; defaultChecked: boolean; column: 1 | 2; order: number };
