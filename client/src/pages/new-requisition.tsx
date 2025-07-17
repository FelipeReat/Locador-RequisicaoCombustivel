import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/layout/header";
import RequisitionForm from "@/components/requisition/requisition-form";

export default function NewRequisition() {
  const [, setLocation] = useLocation();

  const handleSuccess = () => {
    setLocation("/requisitions");
  };

  return (
    <>
      <Header 
        title="Nova Requisição" 
        subtitle="Criar uma nova requisição de combustível" 
      />
      
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Formulário de Requisição
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Preencha os dados necessários para criar uma nova requisição de combustível
              </p>
            </div>
            
            <div className="p-6">
              <RequisitionForm onSuccess={handleSuccess} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
