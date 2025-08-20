import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import RequisitionForm from "@/components/requisition/requisition-form";
import { useLanguage } from "@/contexts/language-context";
import type { FuelRequisition } from "@shared/schema";

export default function NewRequisition() {
  const [location, setLocation] = useLocation();
  const { t } = useLanguage();
  const [editingRequisitionId, setEditingRequisitionId] = useState<number | null>(null);

  // Parse URL parameters to check if we're editing
  useEffect(() => {
    console.log('Current location:', location);
    const searchParams = location.includes('?') ? location.split('?')[1] : '';
    const urlParams = new URLSearchParams(searchParams);
    const editId = urlParams.get('edit');
    console.log('Edit ID from URL:', editId);
    if (editId && !isNaN(parseInt(editId))) {
      setEditingRequisitionId(parseInt(editId));
    } else {
      setEditingRequisitionId(null);
    }
  }, [location]);

  // Fetch requisition data if editing
  const { data: editingRequisition, isLoading: isLoadingRequisition } = useQuery<FuelRequisition>({
    queryKey: ["/api/fuel-requisitions", editingRequisitionId],
    queryFn: async () => {
      const response = await fetch(`/api/fuel-requisitions/${editingRequisitionId}`);
      if (!response.ok) throw new Error("Failed to fetch requisition");
      return response.json();
    },
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
        <main className="flex-1 mobile-container py-4 lg:py-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Carregando dados da requisição...</span>
              </div>
            </div>
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

  console.log('New Requisition - isEditing:', isEditing, 'editingRequisition:', editingRequisition, 'initialData:', initialData);

  return (
    <>
      <Header 
        title={title} 
        subtitle={subtitle} 
      />

      <main className="flex-1 mobile-container py-4 lg:py-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="mobile-card border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-base lg:text-lg font-semibold text-gray-800 dark:text-white">
                {isEditing ? t('edit-requisition-form') : t('requisition-form')}
              </h3>
              <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-300 mt-1">
                {t('fill-required-data')}
              </p>
            </div>

            <div className="mobile-card">
              <RequisitionForm 
                onSuccess={handleSuccess} 
                initialData={initialData}
                isEditing={isEditing}
                editingId={editingRequisitionId}
              />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}