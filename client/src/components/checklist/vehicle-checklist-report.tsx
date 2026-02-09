import { useState, useMemo, useEffect, Fragment } from "react";
import { VehicleChecklist, Vehicle, User } from "@shared/schema";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Download, FileText, AlertTriangle, CheckCircle, MoreHorizontal, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { formatDateBR, groupChecklistsByVehicle, filterChecklistsByDate, isNonCompliant } from "@/lib/checklist-utils";
import { ChecklistDetails } from "@/components/checklist/checklist-details";

interface VehicleChecklistReportProps {
  checklists: VehicleChecklist[];
  vehicles: Vehicle[];
  users: User[];
  currentUser: any;
  onExportPDF: (c: VehicleChecklist) => void;
  onDelete: (id: number) => void;
}

export function VehicleChecklistReport({ checklists, vehicles, users, currentUser, onExportPDF, onDelete }: VehicleChecklistReportProps) {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredData = useMemo(() => {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    const filtered = filterChecklistsByDate(checklists, start, end);
    // Reset page when data changes significantly (optional, but good practice)
    return groupChecklistsByVehicle(filtered, vehicles);
  }, [checklists, vehicles, startDate, endDate]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExportCSV = () => {
    // Generate CSV content
    const headers = ["Placa", "Modelo", "Data", "Motorista", "KM Inicial", "KM Final", "Status", "Conformidade"];
    const rows: string[] = [];
    rows.push(headers.join(","));

    filteredData.forEach(group => {
      group.checklists.forEach(c => {
        const user = users.find(u => u.id === c.userId);
        const driverName = user ? (user.fullName || user.username) : "N/A";
        const compliant = isNonCompliant(c) ? "Não Conforme" : "Conforme";
        const status = c.status === 'open' ? "Aberto" : "Fechado";
        
        rows.push([
          group.plate,
          group.model,
          formatDateBR(c.startDate),
          `"${driverName}"`,
          c.kmInitial,
          c.kmFinal || "",
          status,
          compliant
        ].join(","));
      });
    });

    const csvContent = "data:text/csv;charset=utf-8," + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "relatorio_checklists.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filtros do Relatório</CardTitle>
          <CardDescription>Selecione o período para análise</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="grid gap-2">
              <Label htmlFor="start-date">Data Inicial</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end-date">Data Final</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button onClick={handleExportCSV} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar Excel (CSV)
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum registro encontrado para o período selecionado.
          </div>
        ) : (
          <>
          <Accordion type="multiple" className="w-full">
            {paginatedData.map((group) => (
              <AccordionItem key={group.vehicleId} value={String(group.vehicleId)}>
                <AccordionTrigger className="hover:no-underline px-4 bg-muted/20 rounded-t-lg">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex flex-col items-start text-left">
                      <span className="font-bold text-lg">{group.plate}</span>
                      <span className="text-sm text-muted-foreground">{group.model}</span>
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground hidden sm:flex">
                      <div className="flex flex-col items-end">
                        <span className="font-semibold">{group.totalChecklists}</span>
                        <span className="text-xs">Checklists</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-semibold">{group.totalKm.toFixed(0)} km</span>
                        <span className="text-xs">Rodados</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-semibold">{group.avgKmPerTrip.toFixed(1)} km</span>
                        <span className="text-xs">Média/Viagem</span>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 border-x border-b rounded-b-lg">
                  <div className="pt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data/Hora</TableHead>
                          <TableHead>Motorista</TableHead>
                          <TableHead>KM Inicial</TableHead>
                          <TableHead>KM Final</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Conformidade</TableHead>
                          <TableHead className="text-right">Ação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.checklists.map((checklist) => {
                          const user = users.find(u => u.id === checklist.userId);
                          const isBad = isNonCompliant(checklist);
                          const isExpanded = expandedId === checklist.id;

                          return (
                            <Fragment key={checklist.id}>
                              <TableRow>
                                <TableCell>{formatDateBR(checklist.startDate)}</TableCell>
                                <TableCell>{user?.fullName || user?.username || "-"}</TableCell>
                                <TableCell>{checklist.kmInitial} km</TableCell>
                                <TableCell>{checklist.kmFinal ? `${checklist.kmFinal} km` : "-"}</TableCell>
                                <TableCell>
                                  {checklist.status === 'open' ? (
                                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">Aberto</Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-green-600 border-green-600">Fechado</Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {checklist.status === 'closed' && (
                                    isBad ? (
                                      <Badge variant="destructive" className="gap-1">
                                        <AlertTriangle className="h-3 w-3" />
                                        Não Conforme
                                      </Badge>
                                    ) : (
                                      <Badge variant="default" className="bg-green-600 hover:bg-green-700 gap-1">
                                        <CheckCircle className="h-3 w-3" />
                                        Conforme
                                      </Badge>
                                    )
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  {checklist.status === 'closed' && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                          <span className="sr-only">Abrir menu</span>
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => setExpandedId(isExpanded ? null : checklist.id)}>
                                          <Search className="mr-2 h-4 w-4" />
                                          <span>{isExpanded ? 'Fechar detalhes' : 'Ver detalhes'}</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onExportPDF(checklist)}>
                                          <FileText className="mr-2 h-4 w-4" />
                                          <span>Exportar PDF</span>
                                        </DropdownMenuItem>
                                        {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
                                          <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => onDelete(checklist.id)} className="text-red-600">
                                              <Trash2 className="mr-2 h-4 w-4" />
                                              <span>Excluir</span>
                                            </DropdownMenuItem>
                                          </>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </TableCell>
                              </TableRow>
                              {isExpanded && (
                                <TableRow>
                                  <TableCell colSpan={7}>
                                    <div className="p-4 bg-muted/20 rounded-lg">
                                      <ChecklistDetails checklist={checklist} />
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left sm:hidden">
                       <div>
                          <span className="text-xs text-muted-foreground block">Total Checklists</span>
                          <span className="font-bold">{group.totalChecklists}</span>
                       </div>
                       <div>
                          <span className="text-xs text-muted-foreground block">KM Total</span>
                          <span className="font-bold">{group.totalKm.toFixed(0)} km</span>
                       </div>
                       <div>
                          <span className="text-xs text-muted-foreground block">Média/Viagem</span>
                          <span className="font-bold">{group.avgKmPerTrip.toFixed(1)} km</span>
                       </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          {totalPages > 1 && (
            <Pagination className="mt-4 justify-center">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(p => Math.max(1, p - 1));
                    }}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === page}
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(page);
                      }}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(p => Math.min(totalPages, p + 1));
                    }}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
          </>
        )}
      </div>
    </div>
  );
}
