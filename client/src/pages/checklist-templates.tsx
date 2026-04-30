import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertChecklistTemplateSchema, insertChecklistTemplateItemSchema } from "@shared/schema";
import type { ChecklistTemplate, ChecklistTemplateItem, InsertChecklistTemplate, InsertChecklistTemplateItem, VehicleType } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Edit, Save, ArrowUp, ArrowDown, Move, Copy, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export default function ChecklistTemplates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplate | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistTemplateItem | null>(null);
  const [editOriginalVehicleTypeIds, setEditOriginalVehicleTypeIds] = useState<number[]>([]);

  // Fetch Templates
  const { data: templates = [], isLoading: isLoadingTemplates } = useQuery<ChecklistTemplate[]>({
    queryKey: ["/api/checklist-templates"],
  });

  // Fetch Items for Selected Template
  const { data: templateItems = [], isLoading: isLoadingItems } = useQuery<ChecklistTemplateItem[]>({
    queryKey: ["/api/checklist-templates", selectedTemplate?.id, "items"],
    enabled: !!selectedTemplate,
  });

  // Fetch Vehicle Types
  const { data: vehicleTypes = [] } = useQuery<VehicleType[]>({
    queryKey: ["/api/vehicle-types"],
  });

  // Create Template Mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (data: InsertChecklistTemplate & { vehicleTypeIds: number[] }) => {
      const res = await apiRequest("POST", "/api/checklist-templates", data);
      return res.json();
    },
    onSuccess: (newTemplate) => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-templates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-types"] });
      setIsCreateDialogOpen(false);
      setSelectedTemplate(newTemplate);
      toast({ title: "Template criado", description: "O novo template foi criado com sucesso." });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao criar template", description: err.message, variant: "destructive" });
    },
  });

  // Update Template Mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertChecklistTemplate> & { vehicleTypeIds?: number[] } }) => {
      const res = await apiRequest("PUT", `/api/checklist-templates/${id}`, data);
      return res.json();
    },
    onSuccess: (updatedTemplate: ChecklistTemplate) => {
      queryClient.setQueryData<ChecklistTemplate[]>(["/api/checklist-templates"], (current) => {
        if (!current) return current;
        return current.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t));
      });
      setSelectedTemplate(updatedTemplate);
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-types"] });
      setIsEditDialogOpen(false);
      toast({ title: "Template atualizado", description: "As alterações foram salvas." });
    },
    onError: (err: any) => {
      toast({
        title: "Erro ao salvar alterações",
        description: err?.message || "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    },
  });

  // Clone Template Mutation
  const cloneTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/checklist-templates/${id}/clone`, {});
      return res.json();
    },
    onSuccess: (newTemplate) => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-templates"] });
      setSelectedTemplate(newTemplate);
      toast({ title: "Template clonado", description: "Uma cópia do template foi criada." });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao clonar template", description: err.message, variant: "destructive" });
    },
  });

  // Create Item Mutation
  const createItemMutation = useMutation({
    mutationFn: async (data: InsertChecklistTemplateItem) => {
      if (!selectedTemplate) throw new Error("Nenhum template selecionado");
      const res = await apiRequest("POST", `/api/checklist-templates/${selectedTemplate.id}/items`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-templates", selectedTemplate?.id, "items"] });
      setIsItemDialogOpen(false);
      setEditingItem(null);
      toast({ title: "Item adicionado", description: "O item foi adicionado ao template." });
    },
  });

  // Update Item Mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertChecklistTemplateItem> }) => {
      if (!selectedTemplate) throw new Error("Nenhum template selecionado");
      const res = await apiRequest("PUT", `/api/checklist-templates/${selectedTemplate.id}/items/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-templates", selectedTemplate?.id, "items"] });
      setIsItemDialogOpen(false);
      setEditingItem(null);
      toast({ title: "Item atualizado", description: "As alterações no item foram salvas." });
    },
  });

  // Delete Item Mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!selectedTemplate) throw new Error("Nenhum template selecionado");
      await apiRequest("DELETE", `/api/checklist-templates/${selectedTemplate.id}/items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-templates", selectedTemplate?.id, "items"] });
      toast({ title: "Item removido", description: "O item foi removido do template." });
    },
  });

  // Reorder Items Mutation
  const reorderItemsMutation = useMutation({
    mutationFn: async ({ templateId, itemIds }: { templateId: number; itemIds: number[] }) => {
      await apiRequest("POST", `/api/checklist-templates/${templateId}/reorder-items`, { itemIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-templates", selectedTemplate?.id, "items"] });
      toast({ title: "Ordem atualizada", description: "A nova ordem dos itens foi salva." });
    },
  });

  // Forms
  const createTemplateForm = useForm<InsertChecklistTemplate & { vehicleTypeIds: number[] }>({
    resolver: zodResolver(insertChecklistTemplateSchema),
    defaultValues: {
      name: "",
      description: "",
      groups: ["Geral", "Mecânica", "Elétrica", "Segurança", "Documentação", "Limpeza", "Acessórios"],
      vehicleTypeIds: [],
    },
  });

  const editTemplateForm = useForm<InsertChecklistTemplate & { vehicleTypeIds: number[] }>({
    resolver: zodResolver(insertChecklistTemplateSchema),
    defaultValues: {
      name: "",
      description: "",
      groups: ["Geral", "Mecânica", "Elétrica", "Segurança", "Documentação", "Limpeza", "Acessórios"],
      vehicleTypeIds: [],
    },
  });

  const [newGroupInput, setNewGroupInput] = useState("");

  const itemForm = useForm<InsertChecklistTemplateItem>({
    resolver: zodResolver(insertChecklistTemplateItemSchema),
    defaultValues: {
      checklistTemplateId: 0,
      key: "",
      label: "",
      group: "Geral",
      defaultChecked: false,
      column: 1,
    },
  });

  // Handlers
  const handleCreateTemplate = (data: InsertChecklistTemplate & { vehicleTypeIds: number[] }) => {
    createTemplateMutation.mutate(data);
  };

  const handleUpdateTemplate = (data: InsertChecklistTemplate & { vehicleTypeIds: number[] }) => {
    if (!selectedTemplate) return;
    const { vehicleTypeIds, ...templateData } = data;

    const isSameVehicleTypeIds = (() => {
      if (vehicleTypeIds.length !== editOriginalVehicleTypeIds.length) return false;
      const setB = new Set(editOriginalVehicleTypeIds);
      for (const id of vehicleTypeIds) {
        if (!setB.has(id)) return false;
      }
      return true;
    })();

    const payload: Partial<InsertChecklistTemplate> & { vehicleTypeIds?: number[] } = templateData;
    if (!isSameVehicleTypeIds) {
      payload.vehicleTypeIds = vehicleTypeIds;
    }

    updateTemplateMutation.mutate({ id: selectedTemplate.id, data: payload });
  };

  useEffect(() => {
    if (!selectedTemplate?.id) return;
    const updated = templates.find((t) => t.id === selectedTemplate.id);
    if (updated && updated !== selectedTemplate) {
      setSelectedTemplate(updated);
    }
  }, [templates, selectedTemplate?.id]);

  const openEditDialog = () => {
    if (!selectedTemplate) return;
    
    // Find vehicle types associated with this template
    const associatedVehicleTypes = vehicleTypes
      .filter(vt => vt.checklistTemplateId === selectedTemplate.id)
      .map(vt => vt.id);

    setEditOriginalVehicleTypeIds(associatedVehicleTypes);

    editTemplateForm.reset({
      name: selectedTemplate.name,
      description: selectedTemplate.description || "",
      groups: selectedTemplate.groups || ["Geral", "Mecânica", "Elétrica", "Segurança", "Documentação", "Limpeza", "Acessórios"],
      vehicleTypeIds: associatedVehicleTypes,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveItem = (data: InsertChecklistTemplateItem) => {
    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, data });
    } else {
      createItemMutation.mutate(data);
    }
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    if (!selectedTemplate || !templateItems.length) return;
    
    const newItems = [...templateItems];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    
    const itemIds = newItems.map(item => item.id);
    reorderItemsMutation.mutate({ templateId: selectedTemplate.id, itemIds });
  };

  const openItemDialog = (item?: ChecklistTemplateItem) => {
    if (item) {
      setEditingItem(item);
      itemForm.reset({
        checklistTemplateId: item.checklistTemplateId,
        key: item.key,
        label: item.label,
        group: item.group,
        defaultChecked: item.defaultChecked,
        column: item.column,
      });
    } else {
      setEditingItem(null);
      itemForm.reset({
        checklistTemplateId: selectedTemplate?.id || 0,
        key: `item_${Date.now()}`,
        label: "",
        group: selectedTemplate?.groups?.[0] || "Geral",
        defaultChecked: false,
        column: 1,
      });
    }
    setIsItemDialogOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <Header title="Modelos de Checklist" subtitle="Gerencie os modelos de checklist e suas associações com frotas" />
      
      <div className="flex-1 overflow-auto p-4 space-y-6">
        <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-zinc-700 via-stone-700 to-amber-600 text-white shadow-sm">
          <div className="grid gap-px bg-white/10 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="bg-white/5 p-6">
              <div className="space-y-2">
                <div className="text-sm text-white/80">Padronização</div>
                <h2 className="text-2xl font-semibold tracking-tight">Modelos de Checklist</h2>
                <p className="max-w-2xl text-sm text-white/80">
                  Organize grupos, itens e vínculos com tipos de veículo em uma área mais clara para administração.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-px bg-white/10">
              <div className="bg-white/5 p-4">
                <div className="text-xs text-white/70">Modelos</div>
                <div className="mt-1 text-2xl font-semibold">{templates.length}</div>
              </div>
              <div className="bg-white/5 p-4">
                <div className="text-xs text-white/70">Itens do modelo</div>
                <div className="mt-1 text-2xl font-semibold">{templateItems.length}</div>
              </div>
              <div className="bg-white/5 p-4">
                <div className="text-xs text-white/70">Tipos de veículo</div>
                <div className="mt-1 text-2xl font-semibold">{vehicleTypes.length}</div>
              </div>
              <div className="bg-white/5 p-4">
                <div className="text-xs text-white/70">Modelo ativo</div>
                <div className="mt-1 text-lg font-semibold truncate">{selectedTemplate?.name || "Nenhum"}</div>
              </div>
            </div>
          </div>
        </div>

      <div className="grid flex-1 gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
        {/* Sidebar: List of Templates */}
          <Card className="flex min-h-[640px] flex-col overflow-hidden border-muted/60">
          <CardHeader className="border-b bg-gradient-to-r from-zinc-50 via-background to-amber-50 dark:from-zinc-900/40 dark:via-background dark:to-amber-950/20">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Modelos</CardTitle>
                <CardDescription>Selecione um modelo para editar grupos e itens.</CardDescription>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-2" /> Novo</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Novo Modelo de Checklist</DialogTitle>
                    <DialogDescription>Crie um novo modelo para organizar suas verificações.</DialogDescription>
                  </DialogHeader>
                  <Form {...createTemplateForm}>
                    <form onSubmit={createTemplateForm.handleSubmit(handleCreateTemplate)} className="space-y-4">
                      <FormField
                        control={createTemplateForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Checklist Padrão" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createTemplateForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descrição</FormLabel>
                            <FormControl>
                              <Input placeholder="Descrição opcional" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="space-y-2">
                        <FormLabel>Tipos de Veículo (Frotas)</FormLabel>
                        <div className="border rounded-md p-3 space-y-2 max-h-[200px] overflow-y-auto">
                          {vehicleTypes.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Nenhum tipo de veículo cadastrado.</p>
                          ) : (
                            vehicleTypes.map((vt) => (
                              <div key={vt.id} className="flex items-center space-x-2">
                                <Checkbox 
                                  id={`vt-create-${vt.id}`} 
                                  checked={(createTemplateForm.watch("vehicleTypeIds") || []).includes(vt.id)}
                                  onCheckedChange={(checked) => {
                                    const current = createTemplateForm.getValues("vehicleTypeIds") || [];
                                    if (checked) {
                                      createTemplateForm.setValue("vehicleTypeIds", [...current, vt.id]);
                                    } else {
                                      createTemplateForm.setValue("vehicleTypeIds", current.filter(id => id !== vt.id));
                                    }
                                  }}
                                />
                                <label 
                                  htmlFor={`vt-create-${vt.id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                  {vt.name}
                                  {vt.checklistTemplateId && (
                                    <span className="ml-2 text-xs text-muted-foreground">(já possui template)</span>
                                  )}
                                </label>
                              </div>
                            ))
                          )}
                        </div>
                        <p className="text-[0.8rem] text-muted-foreground">
                          Selecione quais tipos de veículo utilizarão este modelo de checklist automaticamente.
                        </p>
                      </div>

                      <DialogFooter>
                        <Button type="submit">Criar</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-4">
            {isLoadingTemplates ? (
              <div className="text-center py-4">Carregando...</div>
            ) : templates.length === 0 ? (
              <div className="rounded-xl border border-dashed py-10 text-center text-muted-foreground">Nenhum modelo encontrado.</div>
            ) : (
              <div className="space-y-2">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={cn(
                      "cursor-pointer rounded-xl border p-3 transition-all hover:bg-accent/60",
                      selectedTemplate?.id === template.id
                        ? "border-amber-500/40 bg-amber-500/10 shadow-sm"
                        : "border-border"
                    )}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{template.name}</div>
                        {template.description && (
                          <div className="text-xs text-muted-foreground truncate">{template.description}</div>
                        )}
                      </div>
                      <Badge variant={template.active ? "default" : "secondary"} className="text-[10px] h-5 shrink-0">
                        {template.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    {template.description && (
                      <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{templates.filter(t => t.id === template.id).length ? "Modelo disponível" : ""}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content: Template Details */}
        <div className="flex min-h-[640px] flex-col overflow-hidden">
          {selectedTemplate ? (
            <Card className="flex-1 flex flex-col overflow-hidden border-muted/60">
              <CardHeader className="border-b bg-gradient-to-r from-zinc-50 via-background to-amber-50 dark:from-zinc-900/40 dark:via-background dark:to-amber-950/20">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <CardTitle>{selectedTemplate.name}</CardTitle>
                    <CardDescription>{selectedTemplate.description}</CardDescription>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{templateItems.length} item(ns)</Badge>
                      <Badge variant="outline">{selectedTemplate.groups?.length || 0} grupo(s)</Badge>
                      <Badge variant="outline">
                        {vehicleTypes.filter(vt => vt.checklistTemplateId === selectedTemplate.id).length} frota(s)
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                     <Button 
                       variant="outline" 
                       size="sm" 
                       onClick={openEditDialog}
                     >
                       <Edit className="h-4 w-4 mr-2" />
                       Editar
                     </Button>
                     <Button 
                       variant="outline" 
                       size="sm" 
                       onClick={() => cloneTemplateMutation.mutate(selectedTemplate.id)}
                       disabled={cloneTemplateMutation.isPending}
                     >
                       <Copy className="h-4 w-4 mr-2" />
                       Clonar
                     </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
                <div className="flex flex-col gap-3 border-b bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold">Itens do Checklist</h3>
                    <p className="text-sm text-muted-foreground">Gerencie a ordem, agrupamento e itens padrão deste modelo.</p>
                  </div>
                  <Button size="sm" onClick={() => openItemDialog()}>
                    <Plus className="h-4 w-4 mr-2" /> Adicionar Item
                  </Button>
                </div>
                
                <div className="flex-1 overflow-auto p-4">
                  {isLoadingItems ? (
                    <div className="text-center py-8">Carregando itens...</div>
                  ) : templateItems.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed py-10 text-center text-muted-foreground">
                      Este modelo não possui itens ainda.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">Ordem</TableHead>
                          <TableHead>Rótulo</TableHead>
                          <TableHead>Grupo</TableHead>
                          <TableHead className="w-[80px]">Coluna</TableHead>
                          <TableHead className="w-[80px]">Padrão</TableHead>
                          <TableHead className="w-[100px] text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {templateItems.map((item, index) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6" 
                                  disabled={index === 0}
                                  onClick={(e) => { e.stopPropagation(); handleMoveItem(index, 'up'); }}
                                >
                                  <ArrowUp className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6" 
                                  disabled={index === templateItems.length - 1}
                                  onClick={(e) => { e.stopPropagation(); handleMoveItem(index, 'down'); }}
                                >
                                  <ArrowDown className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{item.label}</TableCell>
                            <TableCell><Badge variant="outline">{item.group}</Badge></TableCell>
                            <TableCell className="text-center">{item.column}</TableCell>
                            <TableCell className="text-center">
                              {item.defaultChecked && <Check className="h-4 w-4 mx-auto text-green-500" />}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => openItemDialog(item)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => {
                                    if(confirm('Tem certeza que deseja excluir este item?')) {
                                      deleteItemMutation.mutate(item.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="flex-1 border-muted/60">
              <CardContent className="flex h-full items-center justify-center p-8">
                <div className="rounded-xl border-2 border-dashed px-8 py-16 text-center text-muted-foreground">
                  Selecione um modelo para ver os detalhes ou crie um novo.
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      </div>

      {/* Edit Template Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Modelo</DialogTitle>
            <DialogDescription>Alterar nome e descrição do modelo.</DialogDescription>
          </DialogHeader>
          <Form {...editTemplateForm}>
            <form onSubmit={editTemplateForm.handleSubmit(handleUpdateTemplate)} className="space-y-4">
              <FormField
                control={editTemplateForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Checklist Padrão" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editTemplateForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input placeholder="Descrição opcional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <FormLabel>Grupos do Checklist</FormLabel>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Novo grupo..." 
                    value={newGroupInput}
                    onChange={(e) => setNewGroupInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newGroupInput.trim()) {
                          const current = editTemplateForm.getValues("groups") || [];
                          if (!current.includes(newGroupInput.trim())) {
                            editTemplateForm.setValue("groups", [...current, newGroupInput.trim()]);
                            setNewGroupInput("");
                          }
                        }
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      if (newGroupInput.trim()) {
                        const current = editTemplateForm.getValues("groups") || [];
                        if (!current.includes(newGroupInput.trim())) {
                          editTemplateForm.setValue("groups", [...current, newGroupInput.trim()]);
                          setNewGroupInput("");
                        }
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-2 p-2 border rounded-md min-h-[50px]">
                  {(editTemplateForm.watch("groups") || []).length === 0 && (
                    <span className="text-sm text-muted-foreground">Nenhum grupo definido</span>
                  )}
                  {(editTemplateForm.watch("groups") || []).map((group: string, index: number) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1 pr-1">
                      {group}
                      <button
                        type="button"
                        onClick={() => {
                          const current = editTemplateForm.getValues("groups") || [];
                          const newGroups = current.filter((_, i) => i !== index);
                          editTemplateForm.setValue("groups", newGroups);
                        }}
                        className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <p className="text-[0.8rem] text-muted-foreground">
                  Defina os grupos que organizarão os itens deste checklist.
                </p>
              </div>

              <div className="space-y-2">
                <FormLabel>Tipos de Veículo (Frotas)</FormLabel>
                <div className="border rounded-md p-3 space-y-2 max-h-[200px] overflow-y-auto">
                  {vehicleTypes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum tipo de veículo cadastrado.</p>
                  ) : (
                    vehicleTypes.map((vt) => (
                      <div key={vt.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`vt-edit-${vt.id}`} 
                          checked={(editTemplateForm.watch("vehicleTypeIds") || []).includes(vt.id)}
                          onCheckedChange={(checked) => {
                            const current = editTemplateForm.getValues("vehicleTypeIds") || [];
                            if (checked) {
                              editTemplateForm.setValue("vehicleTypeIds", [...current, vt.id]);
                            } else {
                              editTemplateForm.setValue("vehicleTypeIds", current.filter(id => id !== vt.id));
                            }
                          }}
                        />
                        <label 
                          htmlFor={`vt-edit-${vt.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {vt.name}
                          {vt.checklistTemplateId && vt.checklistTemplateId !== selectedTemplate?.id && (
                            <span className="ml-2 text-xs text-muted-foreground">(já possui outro template)</span>
                          )}
                        </label>
                      </div>
                    ))
                  )}
                </div>
                <p className="text-[0.8rem] text-muted-foreground">
                  Selecione quais tipos de veículo utilizarão este modelo de checklist automaticamente.
                </p>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={updateTemplateMutation.isPending}>
                  {updateTemplateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Editar Item" : "Novo Item"}</DialogTitle>
          </DialogHeader>
          <Form {...itemForm}>
            <form onSubmit={itemForm.handleSubmit(handleSaveItem)} className="space-y-4">
              <FormField
                control={itemForm.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rótulo (Label)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Freios, Luzes..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={itemForm.control}
                  name="group"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grupo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um grupo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(selectedTemplate?.groups || ["Geral", "Mecânica", "Elétrica", "Segurança", "Documentação", "Limpeza", "Acessórios"]).map((group) => (
                            <SelectItem key={group} value={group}>{group}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={itemForm.control}
                  name="column"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Coluna</FormLabel>
                      <Select 
                        onValueChange={(val) => field.onChange(parseInt(val))} 
                        defaultValue={String(field.value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a coluna" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">Coluna 1 (Esquerda)</SelectItem>
                          <SelectItem value="2">Coluna 2 (Direita)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={itemForm.control}
                name="defaultChecked"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Marcado por padrão?
                      </FormLabel>
                      <DialogDescription>
                        Se marcado, este item já virá selecionado no checklist.
                      </DialogDescription>
                    </div>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
