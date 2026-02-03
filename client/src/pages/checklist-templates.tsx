
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertChecklistTemplateSchema, insertChecklistTemplateItemSchema } from "@shared/schema";
import type { ChecklistTemplate, ChecklistTemplateItem, InsertChecklistTemplate, InsertChecklistTemplateItem } from "@shared/schema";
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
import { Plus, Trash2, Edit, Save, ArrowUp, ArrowDown, Move, Copy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function ChecklistTemplates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplate | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistTemplateItem | null>(null);

  // Fetch Templates
  const { data: templates = [], isLoading: isLoadingTemplates } = useQuery<ChecklistTemplate[]>({
    queryKey: ["/api/checklist-templates"],
  });

  // Fetch Items for Selected Template
  const { data: templateItems = [], isLoading: isLoadingItems } = useQuery<ChecklistTemplateItem[]>({
    queryKey: ["/api/checklist-templates", selectedTemplate?.id, "items"],
    enabled: !!selectedTemplate,
  });

  // Create Template Mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (data: InsertChecklistTemplate) => {
      const res = await apiRequest("POST", "/api/checklist-templates", data);
      return res.json();
    },
    onSuccess: (newTemplate) => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-templates"] });
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
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertChecklistTemplate> }) => {
      const res = await apiRequest("PATCH", `/api/checklist-templates/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-templates"] });
      toast({ title: "Template atualizado", description: "As alterações foram salvas." });
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
      const res = await apiRequest("PATCH", `/api/checklist-templates/${selectedTemplate.id}/items/${id}`, data);
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
  const createTemplateForm = useForm<InsertChecklistTemplate>({
    resolver: zodResolver(insertChecklistTemplateSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const itemForm = useForm<InsertChecklistTemplateItem>({
    resolver: zodResolver(insertChecklistTemplateItemSchema),
    defaultValues: {
      key: "",
      label: "",
      group: "Geral",
      defaultChecked: false,
      column: 1,
    },
  });

  // Handlers
  const handleCreateTemplate = (data: InsertChecklistTemplate) => {
    createTemplateMutation.mutate(data);
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
        key: item.key,
        label: item.label,
        group: item.group,
        defaultChecked: item.defaultChecked,
        column: item.column,
      });
    } else {
      setEditingItem(null);
      itemForm.reset({
        key: `item_${Date.now()}`,
        label: "",
        group: "Geral",
        defaultChecked: false,
        column: 1,
      });
    }
    setIsItemDialogOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <Header title="Modelos de Checklist" subtitle="Gerencie os modelos de checklist de veículos" />
      
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* Sidebar: List of Templates */}
        <Card className="w-1/3 flex flex-col">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Modelos</CardTitle>
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
                      <DialogFooter>
                        <Button type="submit">Criar</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            {isLoadingTemplates ? (
              <div className="text-center py-4">Carregando...</div>
            ) : templates.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">Nenhum modelo encontrado.</div>
            ) : (
              <div className="space-y-2">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors ${
                      selectedTemplate?.id === template.id ? "bg-accent border-primary" : ""
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="font-medium">{template.name}</div>
                    {template.description && (
                      <div className="text-xs text-muted-foreground truncate">{template.description}</div>
                    )}
                    <div className="mt-2 flex gap-2">
                       {template.active ? (
                         <Badge variant="default" className="text-[10px] h-5">Ativo</Badge>
                       ) : (
                         <Badge variant="secondary" className="text-[10px] h-5">Inativo</Badge>
                       )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content: Template Details */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {selectedTemplate ? (
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardHeader className="border-b bg-muted/20">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{selectedTemplate.name}</CardTitle>
                    <CardDescription>{selectedTemplate.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                     {/* Actions for template could go here */}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
                <div className="p-4 border-b flex justify-between items-center bg-background">
                  <h3 className="font-semibold">Itens do Checklist</h3>
                  <Button size="sm" onClick={() => openItemDialog()}>
                    <Plus className="h-4 w-4 mr-2" /> Adicionar Item
                  </Button>
                </div>
                
                <div className="flex-1 overflow-auto p-4">
                  {isLoadingItems ? (
                    <div className="text-center py-8">Carregando itens...</div>
                  ) : templateItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
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
            <div className="flex-1 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg m-4">
              Selecione um modelo para ver os detalhes ou crie um novo.
            </div>
          )}
        </div>
      </div>

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
                          <SelectItem value="Geral">Geral</SelectItem>
                          <SelectItem value="Mecânica">Mecânica</SelectItem>
                          <SelectItem value="Elétrica">Elétrica</SelectItem>
                          <SelectItem value="Segurança">Segurança</SelectItem>
                          <SelectItem value="Documentação">Documentação</SelectItem>
                          <SelectItem value="Limpeza">Limpeza</SelectItem>
                          <SelectItem value="Acessórios">Acessórios</SelectItem>
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
