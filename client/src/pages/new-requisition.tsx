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
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    const editId = urlParams.get('edit');
    if (editId) {
      setEditingRequisitionId(parseInt(editId));
    }
  }, [location]);

  // Fetch requisition data if editing
  const { data: editingRequisition } = useQuery<FuelRequisition>({
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
                initialData={editingRequisition ? {
                  ...editingRequisition,
                  tanqueCheio: editingRequisition.tanqueCheio as "true" | "false"
                } : undefined}
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
