import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import RequisitionForm from "@/components/requisition/requisition-form";
import { useLanguage } from "@/contexts/language-context";
import type { FuelRequisition } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewRequisition() {
  const [location, setLocation] = useLocation();
  const { t } = useLanguage();
  const [editingRequisitionId, setEditingRequisitionId] = useState<number | null>(null);

  // Parse URL parameters to check if we're editing
  useEffect(() => {
    const searchParams = location.includes('?') ? location.split('?')[1] : '';
    const urlParams = new URLSearchParams(searchParams);
    const editId = urlParams.get('edit');
    if (editId && !isNaN(parseInt(editId))) {
      setEditingRequisitionId(parseInt(editId));
    } else {
      setEditingRequisitionId(null);
    }
  }, [location]);

  // Fetch requisition data if editing
  const { data: editingRequisition, isLoading: isLoadingRequisition } = useQuery<FuelRequisition>({
    queryKey: ["/api/fuel-requisitions", editingRequisitionId],
    enabled: !!editingRequisitionId,
  });

  const handleSuccess = () => {
    setLocation("/requisitions");
  };

  const isEditing = !!editingRequisitionId;
  const title = isEditing ? t('edit-requisition') : t('new-requisition');
  const subtitle = isEditing ? t('edit-fuel-requisition') : t('create-new-fuel-requisition');

  // Show loading if we're editing but haven't loaded the data yet
  if (isEditing && (isLoadingRequisition || !editingRequisition)) {
    return (
      <>
        <Header 
          title={title} 
          subtitle={subtitle} 
        />
        <main className="flex-1 mobile-content pt-12 sm:pt-4 lg:pt-6">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-8">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">Carregando dados da requisição...</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </>
    );
  }

  // Prepare initial data for editing
  const initialData = editingRequisition ? {
    requesterId: editingRequisition.requesterId,
    supplierId: editingRequisition.supplierId,
    client: editingRequisition.client,
    vehicleId: editingRequisition.vehicleId,
    kmAtual: editingRequisition.kmAtual?.toString() || "",
    kmAnterior: editingRequisition.kmAnterior?.toString() || "",
    kmRodado: editingRequisition.kmRodado?.toString() || "",
    tanqueCheio: editingRequisition.tanqueCheio as "true" | "false",
    quantity: editingRequisition.quantity?.toString() || "",
    fuelType: editingRequisition.fuelType as "gasolina" | "etanol" | "diesel" | "diesel_s10"
  } : undefined;

  return (
    <>
      <Header 
        title={title} 
        subtitle={subtitle} 
      />

      <main className="flex-1 mobile-content pt-12 sm:pt-4 lg:pt-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <div className="pointer-events-none absolute inset-x-0 -top-10 h-40 bg-gradient-to-r from-zinc-600/10 via-stone-600/10 to-amber-600/10 blur-3xl" />
            <div className="relative space-y-6">
              <div className="overflow-hidden rounded-xl border bg-gradient-to-br from-zinc-700 via-stone-700 to-amber-600 text-white shadow-sm">
                <div className="p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="text-sm text-white/80">{isEditing ? "Edição" : "Nova solicitação"}</div>
                    <div className="text-2xl font-semibold tracking-tight">{title}</div>
                    <div className="text-sm text-white/80">{subtitle}</div>
                  </div>
                </div>
              </div>

              <Card className="border">
                <CardHeader className="border-b bg-gradient-to-r from-zinc-50 via-background to-amber-50 pb-4 dark:from-zinc-900/40 dark:via-background dark:to-amber-950/20">
                  <CardTitle className="text-lg">
                    {isEditing ? t('edit-requisition-form') : t('requisition-form')}
                  </CardTitle>
                  <CardDescription>
                    {t('fill-required-data')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <RequisitionForm 
                    onSuccess={handleSuccess} 
                    initialData={initialData}
                    isEditing={isEditing}
                    editingId={editingRequisitionId}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
