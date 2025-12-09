import { useEffect, useMemo, useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { ClipboardCheck, Search, CalendarCheck } from "lucide-react";
import { useSmartInvalidation, useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";

type Vehicle = {
  id: number;
  plate: string;
  model: string;
  brand: string;
  status: string;
  mileage: string;
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
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState<null | number>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: vehicles = [] } = useQuery<Vehicle[]>({ queryKey: ["/api/vehicles"] });
  const { data: openChecklists = [] } = useQuery<VehicleChecklist[]>({ queryKey: ["/api/checklists/open"] });
  const { data: analytics } = useQuery<Analytics>({ queryKey: ["/api/checklists/stats/analytics"] });

  const activeVehicles = useMemo(() => vehicles.filter(v => v.status === "active"), [vehicles]);
  const filteredVehicles = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return activeVehicles.filter(v =>
      v.plate.toLowerCase().includes(term) ||
      v.model.toLowerCase().includes(term) ||
      v.brand.toLowerCase().includes(term)
    );
  }, [activeVehicles, searchTerm]);

  const openByVehicle = useMemo(() => {
    const set = new Set(openChecklists.map(c => c.vehicleId));
    return set;
  }, [openChecklists]);

  // Exit form
  const exitForm = useForm<{ vehicleId: string; kmInitial: string; fuelLevelStart: FuelLevel; startDate: string }>({
    defaultValues: {
      vehicleId: "",
      kmInitial: "",
      fuelLevelStart: "half",
      startDate: new Date().toISOString().slice(0, 16),
    },
  });

  const createExit = useMutation({
    mutationFn: async (payload: { vehicleId: number; userId: number; kmInitial: number; fuelLevelStart: FuelLevel; startDate: string }) => {
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
  const returnForm = useForm<{ kmFinal: string; fuelLevelEnd: FuelLevel; endDate: string }>({
    defaultValues: {
      kmFinal: "",
      fuelLevelEnd: "half",
      endDate: new Date().toISOString().slice(0, 16),
    },
  });

  const closeReturn = useMutation({
    mutationFn: async ({ id, kmFinal, fuelLevelEnd, endDate }: { id: number; kmFinal: number; fuelLevelEnd: FuelLevel; endDate: string }) => {
      const res = await fetch(`/api/checklists/return/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kmFinal, fuelLevelEnd, endDate }),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Erro ao concluir retorno");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklists/open"] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklists/closed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklists/stats/analytics"] });
      invalidateByOperation("vehicle");
      toast({ title: t("confirm-return"), description: "Retorno registrado com sucesso" });
      setIsReturnDialogOpen(null);
      returnForm.reset();
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

  return (
    <div className="flex-1">
      <Header title={t('vehicle-checklist')} subtitle={t('manage-company-vehicles')} />

      <div className="mobile-container space-y-6">
        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center ring-4 ring-primary/10">
              <ClipboardCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{t('vehicle-checklist')}</h2>
              <p className="text-sm text-muted-foreground">Fluxos de saída e retorno com validações</p>
            </div>
          </div>
          <Button onClick={() => setIsExitDialogOpen(true)} className="w-full sm:w-auto">
            {t('new-exit-checklist')}
          </Button>
        </div>

        {/* Vehicles list */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Veículos Ativos</span>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t('search-vehicles')} className="pl-9" />
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
                          onClick={() => setIsExitDialogOpen(true)}
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

        {/* Open exits */}
        <Card>
          <CardHeader>
            <CardTitle>{t('open-exits')}</CardTitle>
            <CardDescription>Retornos pendentes por veículo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mobile-table-container">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Veículo</TableHead>
                    <TableHead>{t('initial-mileage')}</TableHead>
                    <TableHead>Saída</TableHead>
                    <TableHead className="text-right">{t('register-return-checklist')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {openChecklists.map(c => {
                    const v = vehicles.find(v => v.id === c.vehicleId);
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{v ? v.plate : c.vehicleId}</TableCell>
                        <TableCell className="font-mono">{c.kmInitial} km</TableCell>
                        <TableCell>{new Date(c.startDate).toLocaleString('pt-BR')}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => setIsReturnDialogOpen(c.id)} aria-label="Registrar retorno">
                            {t('register-return-checklist')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Analytics */}
        {analytics && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5" />
                Relatórios Analíticos
              </CardTitle>
              <CardDescription>Completude, conformidade e tendências</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg border">
                  <Label>Completude</Label>
                  <div className="text-2xl font-bold">{analytics.completenessRate}%</div>
                </div>
                <div className="p-4 rounded-lg border">
                  <Label>Saídas Abertas</Label>
                  <div className="text-2xl font-bold">{analytics.openCount}</div>
                </div>
                <div className="p-4 rounded-lg border">
                  <Label>Concluídos</Label>
                  <div className="text-2xl font-bold">{analytics.closedCount}</div>
                </div>
                <div className="p-4 rounded-lg border">
                  <Label>Média km/viagem</Label>
                  <div className="text-2xl font-bold">{analytics.avgKmPerTrip}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
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
                createExit.mutate({ vehicleId: vid, userId: user!.id, kmInitial, fuelLevelStart: values.fuelLevelStart, startDate: values.startDate });
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
                      <Input {...field} type="datetime-local" />
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

      {/* Return Dialog */}
      <Dialog open={isReturnDialogOpen !== null} onOpenChange={(open) => !open && setIsReturnDialogOpen(null)}>
        <DialogContent className="mobile-container max-w-xl">
          <DialogHeader>
            <DialogTitle>{t('register-return-checklist')}</DialogTitle>
            <DialogDescription>Informe os dados para concluir a viagem</DialogDescription>
          </DialogHeader>
          <Form {...returnForm}>
            <form
              className="space-y-4"
              onSubmit={returnForm.handleSubmit((values) => {
                if (isReturnDialogOpen === null) return;
                const kmFinal = parseFloat(values.kmFinal);
                if (isNaN(kmFinal) || kmFinal < 0) {
                  returnForm.setError('kmFinal', { message: 'Informe uma quilometragem válida' });
                  return;
                }
                closeReturn.mutate({ id: isReturnDialogOpen, kmFinal, fuelLevelEnd: values.fuelLevelEnd, endDate: values.endDate });
              })}
            >
              <FormField
                control={returnForm.control}
                name="kmFinal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('final-mileage')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min={0} placeholder="Ex: 12340" />
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
                control={returnForm.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data/Hora</FormLabel>
                    <FormControl>
                      <Input {...field} type="datetime-local" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="mobile-button-group pt-2">
                <Button variant="outline" type="button" onClick={() => setIsReturnDialogOpen(null)} className="w-full sm:w-auto">Cancelar</Button>
                <Button type="submit" className="w-full sm:w-auto" disabled={closeReturn.isPending}>{t('confirm-return')}</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

