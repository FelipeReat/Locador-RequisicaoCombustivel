import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/layout/header";
import RequisitionForm from "@/components/requisition/requisition-form";

import { useLanguage } from "@/contexts/language-context";

export default function NewRequisition() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  const handleSuccess = () => {
    setLocation("/requisitions");
  };

  return (
    <>
      <Header 
        title={t('new-requisition')} 
        subtitle={t('create-new-fuel-requisition')} 
      />
      
      <main className="flex-1 mobile-container py-4 lg:py-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="mobile-card border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-base lg:text-lg font-semibold text-gray-800 dark:text-white">
                {t('requisition-form')}
              </h3>
              <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-300 mt-1">
                {t('fill-required-data')}
              </p>
            </div>
            
            <div className="mobile-card">
              <RequisitionForm onSuccess={handleSuccess} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
