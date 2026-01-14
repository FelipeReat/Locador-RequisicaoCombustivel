import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FuelRequisition } from '@shared/schema';

export interface PDFOptions {
  title?: string;
  subtitle?: string;
  company?: string;
  date?: string;
  obsGroups?: { key: string; label: string }[];
  obsItems?: { key: string; label: string; group: string }[];
}

export const BLOMAQ_LOGO_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAyAAAAByCAYAAADbV0QYAAAACXBIWXMAAAsTAAALEwEAmpwYAAAgAElEQVR4nO3dS3bjuJYV8H7YVYLf2Nq3C0L1zBRtFvpgrJpGQweO37VwS40cCbrs7tYbWwJwYI3e9aK8JYxPZxH6kCkRr1tCeeO9w1W1JxkzH2oZBf5g0jqGWwBfA+8fC3jvzeS/9y8ueJb2f7yH3yB4nT0ZlQkqHf1h3e/4Efrgs9AFyGqMZr1BRERERERkTKcEhIiIiIiIiLSekpwSEiIiIiIiIrafEh4iIiIiIiIi0nhIcIiIiIiIiItJ6SnCIiIiIiIiISOsowSEiIiIiIiIi0npKcIiIiIiIiIhI6ynBISIiIiIiIiKtpwSHiIiIiIiIiLSeEhwiIiIiIiIi0npKcIiIiIiIiIhI6ynBISIiIiIiIiKtpwSHiIiIiIiIiLSeEhwiIiIiIiIi0npKcIiIiIiIiIhI6ynBISIiIiIiIiKtpwSHiIiIiIiIiLSeEhwiIiIiIiIi0npKcIiIiIiIiIhI6ynBISIiIiIiIiKtpwSHiIiIiIiIiLSeEhwiIiIiIiIi0npKcIiIiIiIiIhI6ynBISIiIiIiIiKtpwSHiIiIiIiIiLSeEhwiIiIiIiIi0npKcIiIiIiIiIhI6ynBISIiIiIiIiKtpwSHiIiIiIiIiLTe/wcLpXztq8GO7gAAAABJRU5ErkJggg==';

export class PDFGenerator {
  private doc: jsPDF;
  private currentY: number = 20;
  private obsGroupsConfig?: { key: string; label: string }[];
  private obsItemsConfig?: { key: string; label: string; group: string }[];

  constructor(orientation: 'portrait' | 'landscape' = 'portrait') {
    this.doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4'
    });
  }

  private addHeader(options: PDFOptions) {
    const { title = 'Relatório de Requisições', subtitle, company = 'Sistema de Controle de Abastecimento', date = new Date().toLocaleDateString('pt-BR') } = options;

    // Logo/Company
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(company, 20, this.currentY);

    this.currentY += 15;

    // Title
    this.doc.setFontSize(14);
    this.doc.text(title, 20, this.currentY);

    if (subtitle) {
      this.currentY += 8;
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(subtitle, 20, this.currentY);
    }

    // Date
    this.doc.setFontSize(10);
    this.doc.text(`Data: ${date}`, 150, 20);

    this.currentY += 15;

    // Line separator
    this.doc.setLineWidth(0.5);
    this.doc.line(20, this.currentY, 190, this.currentY);
    this.currentY += 10;
  }

  generateRequisitionPDF(requisition: FuelRequisition): void {
    this.addHeader({
      title: 'Requisição de Combustível',
      subtitle: `Requisição #${String(requisition.id).padStart(4, '0')}`,
      date: new Date(requisition.createdAt).toLocaleDateString('pt-BR')
    });

    // Informações básicas
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('INFORMAÇÕES DA REQUISIÇÃO', 20, this.currentY);
    this.currentY += 10;

    const basicInfo = [
      ['ID da Requisição:', `#${String(requisition.id).padStart(4, '0')}`],
      ['Cliente:', requisition.client],
      ['Fornecedor:', requisition.supplierId?.toString() || 'N/A'],
      ['Data de Criação:', new Date(requisition.createdAt).toLocaleDateString('pt-BR')],
      ['Data Necessária:', requisition.requiredDate ? new Date(requisition.requiredDate).toLocaleDateString('pt-BR') : 'N/A'],
      ['Status:', this.getStatusLabel(requisition.status)],
      ['Prioridade:', this.getPriorityLabel(requisition.priority)]
    ];

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);

    basicInfo.forEach(([label, value]) => {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(label, 20, this.currentY);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(value, 60, this.currentY);
      this.currentY += 6;
    });

    this.currentY += 5;

    // Detalhes do combustível
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('DETALHES DO COMBUSTÍVEL', 20, this.currentY);
    this.currentY += 10;

    const fuelInfo = [
      ['Tipo de Combustível:', this.getFuelTypeLabel(requisition.fuelType)],
      ['Quantidade:', requisition.quantity ? `${requisition.quantity} litros` : 'Tanque cheio'],
      ['KM Atual:', requisition.kmAtual],
      ['KM Anterior:', requisition.kmAnterior],
      ['KM Rodado:', requisition.kmRodado]
    ];

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);

    fuelInfo.forEach(([label, value]) => {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(label, 20, this.currentY);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(value, 60, this.currentY);
      this.currentY += 6;
    });

    this.currentY += 5;

    // Justificativa
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('JUSTIFICATIVA', 20, this.currentY);
    this.currentY += 10;

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    const text = requisition.justification || 'Nenhuma justificativa fornecida';
    const justificationLines = this.doc.splitTextToSize(text, 150);
    this.doc.text(justificationLines, 20, this.currentY);
    this.currentY += justificationLines.length * 5 + 10;

    // Aprovação (se houver)
    if (requisition.status === 'approved' || requisition.status === 'fulfilled') {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('INFORMAÇÕES DE APROVAÇÃO', 20, this.currentY);
      this.currentY += 10;

      const approvalInfo = [
        ['Data de Aprovação:', requisition.approvedDate ? new Date(requisition.approvedDate).toLocaleDateString('pt-BR') : 'N/A']
      ];

      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(10);

      approvalInfo.forEach(([label, value]) => {
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(label, 20, this.currentY);
        this.doc.setFont('helvetica', 'normal');
        this.doc.text(value, 60, this.currentY);
        this.currentY += 6;
      });
    }

    // Rejeição (se houver)
    if (requisition.status === 'rejected' && requisition.rejectionReason) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('MOTIVO DA REJEIÇÃO', 20, this.currentY);
      this.currentY += 10;

      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(10);
      const rejectionLines = this.doc.splitTextToSize(requisition.rejectionReason, 150);
      this.doc.text(rejectionLines, 20, this.currentY);
      this.currentY += rejectionLines.length * 5 + 10;
    }

    // Footer
    this.addFooter();
  }

  generateRequisitionsReport(requisitions: FuelRequisition[], options: PDFOptions = {}): void {
    this.addHeader({
      title: 'Relatório de Requisições de Combustível',
      subtitle: `Total de ${requisitions.length} requisições`,
      ...options
    });

    // Estatísticas resumidas
    const stats = this.calculateStats(requisitions);
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('RESUMO ESTATÍSTICO', 20, this.currentY);
    this.currentY += 10;

    const statsData = [
      ['Total de Requisições:', stats.total.toString()],
      ['Requisições Pendentes:', stats.pending.toString()],
      ['Requisições Aprovadas:', stats.approved.toString()],
      ['Requisições Rejeitadas:', stats.rejected.toString()],
      ['Requisições Cumpridas:', stats.fulfilled.toString()],
      ['Total de Litros:', `${stats.totalLiters} L`],
      ['Valor Total Estimado:', stats.totalValue]
    ];

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);

    statsData.forEach(([label, value]) => {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(label, 20, this.currentY);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(value, 80, this.currentY);
      this.currentY += 6;
    });

    this.currentY += 10;

    // Tabela de requisições
    const tableData = requisitions.map(req => [
      `#${String(req.id).padStart(4, '0')}`,
      req.client,
      this.getFuelTypeLabel(req.fuelType),
      req.quantity ? `${req.quantity}L` : 'Tanque cheio',
      this.getStatusLabel(req.status),
      new Date(req.createdAt).toLocaleDateString('pt-BR')
    ]);

    autoTable(this.doc, {
      head: [['ID', 'Cliente', 'Combustível', 'Quantidade', 'Status', 'Data']],
      body: tableData,
      startY: this.currentY,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [52, 144, 220] },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    this.addFooter();
  }

  private addFooter(): void {
    const pageCount = this.doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`Página ${i} de ${pageCount}`, 20, 285);
      this.doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 150, 285);
    }
  }

  private calculateStats(requisitions: FuelRequisition[]) {
    const stats = {
      total: requisitions.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      fulfilled: 0,
      totalLiters: 0,
      totalValue: 'R$ 0,00'
    };

    let totalValueNum = 0;

    requisitions.forEach(req => {
      (stats as any)[req.status]++;
      const liters = req.quantity ? parseInt(req.quantity) : 0;
      stats.totalLiters += liters;
      totalValueNum += this.calculateEstimatedValueNum(req.fuelType, liters);
    });

    stats.totalValue = `R$ ${totalValueNum.toFixed(2).replace('.', ',')}`;
    return stats;
  }

  private getDepartmentLabel(department: string): string {
    const labels = {
      'logistica': 'Logística',
      'manutencao': 'Manutenção',
      'transporte': 'Transporte',
      'operacoes': 'Operações',
      'administracao': 'Administração'
    };
    return labels[department as keyof typeof labels] || department;
  }

  private getFuelTypeLabel(fuelType: string): string {
    const labels = {
      'gasolina': 'Gasolina',
      'etanol': 'Etanol',
      'diesel': 'Diesel',
      'diesel_s10': 'Diesel S10'
    };
    return labels[fuelType as keyof typeof labels] || fuelType;
  }

  private getStatusLabel(status: string): string {
    const labels = {
      'pending': 'Pendente',
      'approved': 'Aprovado',
      'rejected': 'Rejeitado',
      'fulfilled': 'Cumprido'
    };
    return labels[status as keyof typeof labels] || status;
  }

  private getPriorityLabel(priority: string): string {
    const labels = {
      'baixa': 'Baixa',
      'media': 'Média',
      'alta': 'Alta',
      'urgente': 'Urgente'
    };
    return labels[priority as keyof typeof labels] || priority;
  }

  private getFuelLevelLabel(level: string): string {
    const labels = {
      'empty': 'Vazio',
      'quarter': '1/4',
      'half': '1/2',
      'three_quarters': '3/4',
      'full': 'Cheio'
    };
    return labels[level as keyof typeof labels] || level;
  }

  private calculateEstimatedValue(fuelType: string, quantity: number): string {
    return `R$ ${this.calculateEstimatedValueNum(fuelType, quantity).toFixed(2).replace('.', ',')}`;
  }

  private calculateEstimatedValueNum(fuelType: string, quantity: number): number {
    const prices = {
      'gasolina': 5.50,
      'etanol': 4.20,
      'diesel': 6.80,
      'diesel_s10': 7.20
    };
    const price = prices[fuelType as keyof typeof prices] || 5.00;
    return quantity * price;
  }

  generatePurchaseOrderPDF(requisition: any, supplier?: any, vehicle?: any, requesterUser?: any, company?: any) {
    this.doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Função simplificada para adicionar marca d'água apenas com texto
    const addWatermark = (centerX: number) => {
      try {
        // Marca d'água apenas com texto para melhor performance
        this.doc.setGState(this.doc.GState({ opacity: 0.05 }));
        this.doc.setFontSize(35);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('BLOMAQ', centerX, 95, { align: 'center' });
        this.doc.setGState(this.doc.GState({ opacity: 1.0 }));
      } catch (error) {
        console.log('Erro ao adicionar marca d\'água:', error);
      }
    };

    // Função para criar uma via do documento
    const createVia = (viaTitle: string, startX: number) => {
      let currentY = 10;
      const maxWidth = 130; // Largura máxima para cada via

      // Adicionar marca d'água centralizada na via
      addWatermark(startX + maxWidth / 2);

      // Cabeçalho
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('REQUISIÇÃO PARA ABASTECIMENTO COM COMBUSTÍVEIS', startX, currentY);
      currentY += 8;

      this.doc.setFontSize(10);
      this.doc.text(viaTitle, startX, currentY);
      currentY += 10;

      // Box da requisição
      this.doc.rect(startX, currentY, maxWidth, 12);
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('REQUISIÇÃO | ID | EMISSÃO', startX + 2, currentY + 4);
      this.doc.setFont('helvetica', 'normal');
      const dataEmissao = new Date(requisition.createdAt).toLocaleDateString('pt-BR');
      const horaEmissao = new Date(requisition.createdAt).toLocaleTimeString('pt-BR');
      this.doc.text(`${String(requisition.id).padStart(3, '0')} | ${dataEmissao} | ${horaEmissao}`, startX + 2, currentY + 8);
      currentY += 15;

      // Box do Fornecedor (com informações dinâmicas)
      this.doc.rect(startX, currentY, maxWidth, 28);
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('FORNECEDOR', startX + 2, currentY + 4);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8);

      const fornecedorInfo = [
        `CPF/CNPJ: ${supplier?.cnpj || 'Não informado'}`,
        `Nome Empresarial: ${supplier?.name || 'Não informado'}`,
        `Contato: ${supplier?.responsavel || 'Não informado'}`,
        `Telefone: ${supplier?.phone || 'Não informado'}`
      ];

      let lineY = currentY + 7;
      fornecedorInfo.forEach(info => {
        this.doc.text(info, startX + 2, lineY);
        lineY += 4;
      });
      currentY += 30;

      // Box do Cliente (com informações dinâmicas)
      this.doc.rect(startX, currentY, maxWidth, 28);
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('CLIENTE', startX + 2, currentY + 4);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8);

      // Informações baseadas nos dados atuais da empresa do banco de dados
      let clienteInfo: string[] = [];

      if (company) {
        // Usar dados atuais da empresa do banco de dados
        clienteInfo = [
          `CPF/CNPJ: ${company.cnpj || 'Não informado'}`,
          `Nome Empresarial: ${company.fullName || company.name || 'Não informado'}`,
          `Contato: ${company.contact || requesterUser?.fullName || 'Não informado'}`,
          `Telefone: ${company.phone || requesterUser?.phone || 'Não informado'}`,
          `Email: ${company.email || requesterUser?.email || 'Não informado'}`
        ];
      } else {
        // Fallback para quando não encontrar a empresa no banco
        clienteInfo = [
          `CPF/CNPJ: ${requisition.clientCnpj || 'Não informado'}`,
          `Nome Empresarial: ${requisition.client}`,
          `Contato: ${requesterUser?.fullName || requisition.requester || 'Não informado'}`,
          `Telefone: ${requesterUser?.phone || 'Não informado'}`
        ];

        // Adicionar email apenas se o usuário tiver email
        if (requesterUser?.email) {
          clienteInfo.push(`Email: ${requesterUser.email}`);
        }
      }

      lineY = currentY + 7;
      clienteInfo.forEach((info, index) => {
        // Usar fonte menor para nomes empresariais muito longos
        if (info.includes("Nome Empresarial:") && info.length > 80) {
          this.doc.setFontSize(7); // Fonte menor para nomes longos
          this.doc.text(info, startX + 2, lineY);
          this.doc.setFontSize(8); // Voltar ao tamanho normal
        } else {
          this.doc.text(info, startX + 2, lineY);
        }
        lineY += 4;
      });
      currentY += 30;

      // Box do Veículo (com informações dinâmicas)
      this.doc.rect(startX, currentY, maxWidth, 20);
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('VEÍCULO', startX + 2, currentY + 4);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8);

      const veiculoInfo = [
        `Placa: ${vehicle?.plate || 'N/A'}`,
        `Marca/Modelo: ${vehicle?.brand || 'N/A'} ${vehicle?.model || 'N/A'}`,
        `Cor: ${vehicle?.color || 'N/A'}`,
        `Hodômetro: ${requisition.kmAtual || 'N/A'}`
      ];

      lineY = currentY + 7;
      veiculoInfo.forEach(info => {
        this.doc.text(info, startX + 2, lineY);
        lineY += 4;
      });
      currentY += 22;

      // Box do Abastecimento (com informações dinâmicas)
      this.doc.rect(startX, currentY, maxWidth, 25);
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('ABASTECIMENTO', startX + 2, currentY + 4);
      currentY += 8;

      // Checkbox e tabela
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');

      // Checkbox para tanque cheio
      const isFullTank = requisition.tanqueCheio === 'true';
      this.doc.rect(startX + 2, currentY, 3, 3);
      if (isFullTank) {
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('X', startX + 3, currentY + 2.5);
        this.doc.setFont('helvetica', 'normal');
      }
      this.doc.text('Tanque Cheio', startX + 7, currentY + 2);
      currentY += 6;

      // Cabeçalho da tabela de combustível
      const fuelTypeLabel = this.getFuelTypeLabel(requisition.fuelType || '');
      const headers = [`QTD. / L (${fuelTypeLabel})`, 'R$/L', '[R$] TOTAL'];
      const colX = [startX + 40, startX + 70, startX + 100];

      headers.forEach((header, index) => {
        this.doc.text(header, colX[index], currentY);
      });
      currentY += 4;

      // Linha da tabela - sempre com valores zerados
      const quantity = isFullTank ? 0 : parseFloat(requisition.quantity || '0');

      if (!isFullTank) {
        this.doc.text(quantity.toFixed(3), colX[0], currentY);
        this.doc.text('0,00', colX[1], currentY);
        this.doc.text('0,00', colX[2], currentY);
      } else {
        this.doc.text('Completo', colX[0], currentY);
        this.doc.text('0,00', colX[1], currentY);
        this.doc.text('0,00', colX[2], currentY);
      }
      currentY += 8;

      // Campo de assinatura (adicionado no canto inferior direito)
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      const signatureX = startX + maxWidth - 40;
      const signatureY = 190;

      // Nome do responsável em negrito
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(8);
      let responsavelNome = 'Responsável não identificado';

      // Buscar o nome do responsável de diferentes formas
      if (requesterUser?.fullName) {
        responsavelNome = requesterUser.fullName.toUpperCase();
      } else if (requesterUser?.username) {
        responsavelNome = requesterUser.username.toUpperCase();
      } else if (requisition.requesterName) {
        responsavelNome = requisition.requesterName.toUpperCase();
      }

      console.log('Nome do responsável para o PDF:', responsavelNome, 'Dados do usuário:', requesterUser);

      this.doc.text(responsavelNome, signatureX + 17.5, signatureY, { align: 'center' });

      // Rodapé da via
      this.doc.setFontSize(10);
      this.doc.text('OBRIGATÓRIO ANEXAR GRAMPEADO O CUPOM FISCAL NA VIA BLOMAQ', startX, 200);
    };

    // Criar as duas vias lado a lado
    createVia('1ª Via - Fornecedor', 10);

    // Linha divisória pontilhada vertical
    this.doc.setLineDashPattern([2, 2], 0);
    this.doc.line(148, 10, 148, 200);
    this.doc.setLineDashPattern([], 0);

    createVia('2ª Via - Cliente', 155);
  }

  private getEstimatedFuelPrice(fuelType: string): number {
    const prices = {
      'gasolina': 6.20,
      'etanol': 4.80,
      'diesel': 6.90,
      'diesel_s10': 7.10
    };
    return prices[fuelType as keyof typeof prices] || 6.00;
  }

  generateMonthlyFuelReport(
    requisitions: FuelRequisition[], 
    monthlyStats: any, 
    month: number, 
    year: number,
    vehicles?: any[],
    users?: any[]
  ): void {
    console.log('PDFGenerator.generateMonthlyFuelReport iniciado');
    console.log('Parâmetros recebidos:', {
      requisitionsCount: requisitions?.length || 0,
      monthlyStats,
      month,
      year,
      vehiclesCount: vehicles?.length || 0,
      usersCount: users?.length || 0
    });

    try {
      const monthName = new Date(year, month - 1).toLocaleDateString('pt-BR', { 
        month: 'long', 
        year: 'numeric' 
      });

      console.log('Adicionando cabeçalho...');
      this.addHeader({
        title: 'Relatório Mensal de Combustível',
        subtitle: `Período: ${monthName}`,
        date: new Date().toLocaleDateString('pt-BR')
      });
      console.log('Cabeçalho adicionado com sucesso');
    } catch (error) {
      console.error('Erro ao adicionar cabeçalho:', error);
      throw error;
    }

    // Estatísticas resumidas
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('RESUMO ESTATÍSTICO', 20, this.currentY);
    this.currentY += 10;

    const statsData = [
      ['Total de Requisições:', monthlyStats.total.toString()],
      ['Requisições Pendentes:', monthlyStats.pending.toString()],
      ['Requisições Aprovadas:', monthlyStats.approved.toString()],
      ['Requisições Rejeitadas:', monthlyStats.rejected.toString()],
      ['Requisições Realizadas:', monthlyStats.fulfilled.toString()],
      ['Total de Litros:', `${monthlyStats.totalLiters} L`],
      ['Custo Total:', `R$ ${Number(monthlyStats.totalCost || 0).toFixed(2).replace('.', ',')}`]
    ];

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);

    statsData.forEach(([label, value]) => {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(label, 20, this.currentY);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(value, 80, this.currentY);
      this.currentY += 6;
    });

    this.currentY += 10;

    // Distribuição por Status (dados do gráfico em formato tabela)
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('DISTRIBUIÇÃO POR STATUS', 20, this.currentY);
    this.currentY += 10;

    const statusTableData = [
      ['Pendentes', monthlyStats.pending.toString(), `${((Number(monthlyStats.pending || 0) / Number(monthlyStats.total || 1)) * 100).toFixed(1)}%`],
      ['Aprovadas', monthlyStats.approved.toString(), `${((Number(monthlyStats.approved || 0) / Number(monthlyStats.total || 1)) * 100).toFixed(1)}%`],
      ['Rejeitadas', monthlyStats.rejected.toString(), `${((Number(monthlyStats.rejected || 0) / Number(monthlyStats.total || 1)) * 100).toFixed(1)}%`],
      ['Realizadas', monthlyStats.fulfilled.toString(), `${((Number(monthlyStats.fulfilled || 0) / Number(monthlyStats.total || 1)) * 100).toFixed(1)}%`]
    ];

    autoTable(this.doc, {
      head: [['Status', 'Quantidade', 'Percentual']],
      body: statusTableData,
      startY: this.currentY,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [52, 144, 220] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 20, right: 20 }
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 15;

    // Média L/km por veículo
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('MÉDIA DE LITROS POR KM POR VEÍCULO', 20, this.currentY);
    this.currentY += 10;
    const effMap = new Map<number, { plate: string; name: string; km: number; liters: number; cost: number; lpkm: number; kmpl: number; rpkm: number; rpl: number }>();
    const consideredReqs = requisitions;
    consideredReqs.forEach((req) => {
      const v = vehicles?.find((vv) => vv.id === req.vehicleId);
      const plate = v?.plate || String(req.vehicleId);
      const name = v ? `${v.brand || ''} ${v.model || ''}`.trim() : '';
      const created = v?.createdAt ? new Date(v.createdAt) : null;
      const isNewInMonth = !!created && (created.getMonth() + 1 === month) && (created.getFullYear() === year);
      const kmAtual = req.kmAtual ? Number(req.kmAtual) : 0;
      const kmAnterior = req.kmAnterior ? Number(req.kmAnterior) : 0;
      const kmRodado = req.kmRodado ? Number(req.kmRodado) : (isFinite(kmAtual) && isFinite(kmAnterior) ? Math.max(kmAtual - kmAnterior, 0) : 0);
      const liters = req.quantity ? Number(req.quantity) : 0;
      const pricePerLiter = req.pricePerLiter ? Number(req.pricePerLiter) : 0;
      const isValidPrice = !isNaN(pricePerLiter) && isFinite(pricePerLiter) && pricePerLiter > 0;
      const cost = isValidPrice && liters > 0 ? liters * pricePerLiter : 0;
      const validKm = isNewInMonth ? 0 : (isFinite(kmRodado) && kmRodado > 0 ? kmRodado : 0);
      const validLiters = isFinite(liters) && liters > 0 ? liters : 0;
      if (!effMap.has(req.vehicleId)) {
        effMap.set(req.vehicleId, { plate, name, km: 0, liters: 0, cost: 0, lpkm: 0, kmpl: 0, rpkm: 0, rpl: 0 });
      }
      const acc = effMap.get(req.vehicleId)!;
      acc.km += validKm;
      acc.liters += validLiters;
      acc.cost += isNaN(cost) ? 0 : cost;
    });
    const effRows = Array.from(effMap.values())
      .map((r) => {
        const lpkm = r.km > 0 && r.liters > 0 ? r.liters / r.km : 0;
        const kmpl = r.liters > 0 && r.km > 0 ? r.km / r.liters : 0;
        const rpkm = r.km > 0 && r.cost > 0 ? r.cost / r.km : 0;
        const rpl = r.liters > 0 && r.cost > 0 ? r.cost / r.liters : 0;
        return [
          r.plate,
          r.name || '-',
          Number.isFinite(r.km) ? `${r.km.toFixed(0)} km` : 'N/A',
          Number.isFinite(r.liters) ? `${r.liters.toFixed(1)} L` : 'N/A',
          r.km > 0 && r.liters > 0 ? kmpl.toFixed(2) : '—',
          r.km > 0 && r.liters > 0 ? lpkm.toFixed(3) : '—',
          (r.km > 0 && r.cost > 0) ? `R$ ${rpkm.toFixed(2).replace('.', ',')}` : '—',
          (r.liters > 0 && r.cost > 0) ? `R$ ${rpl.toFixed(2).replace('.', ',')}` : '—',
        ];
      })
      .sort((a, b) => {
        const av = parseFloat(String(a[4]).replace(',', '.')) || 0;
        const bv = parseFloat(String(b[4]).replace(',', '.')) || 0;
        return bv - av;
      });
    if (effRows.length > 0) {
      autoTable(this.doc, {
        head: [['Veículo', 'Descrição', 'KM Total (mês)', 'Litros Total', 'Média (KM/L)', 'Média (L/KM)', 'Custo (R$/km)', 'Custo (R$/L)']],
        body: effRows,
        startY: this.currentY,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [52, 144, 220] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 20, right: 20 }
      });
      this.currentY = (this.doc as any).lastAutoTable.finalY + 15;
    }

    // Tabela detalhada de requisições
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('DETALHAMENTO DAS REQUISIÇÕES', 20, this.currentY);
    this.currentY += 10;

    const getVehiclePlate = (vehicleId: number) => {
      const vehicle = vehicles?.find(v => v.id === vehicleId);
      return vehicle?.plate || 'N/A';
    };

    const getUserName = (userId: number) => {
      const user = users?.find(u => u.id === userId);
      return user?.name || 'N/A';
    };

    const tableData = requisitions.map(req => {
      // Garantir que pricePerLiter seja um número válido
      const pricePerLiter = req.pricePerLiter ? Number(req.pricePerLiter) : 0;
      const isValidPrice = !isNaN(pricePerLiter) && isFinite(pricePerLiter);
      
      // Calcular total com base na quantidade e preço por litro
      const quantity = req.quantity ? Number(req.quantity) : 0;
      const totalCost = isValidPrice && !isNaN(quantity) && isFinite(quantity) ? pricePerLiter * quantity : 0;
      const isValidCost = !isNaN(totalCost) && isFinite(totalCost);
      const kmAtual = req.kmAtual ? Number(req.kmAtual) : 0;
      const kmAnterior = req.kmAnterior ? Number(req.kmAnterior) : 0;
      const kmRodado = req.kmRodado ? Number(req.kmRodado) : (isFinite(kmAtual) && isFinite(kmAnterior) ? Math.max(kmAtual - kmAnterior, 0) : 0);
      
      return [
        new Date(req.createdAt).toLocaleDateString('pt-BR'),
        getVehiclePlate(req.vehicleId),
        getUserName(req.requesterId),
        this.getFuelTypeLabel(req.fuelType),
        Number.isFinite(kmRodado) ? `${kmRodado.toFixed(0)} km` : 'N/A',
        req.quantity ? `${req.quantity}L` : 'Tanque cheio',
        isValidPrice ? `R$ ${pricePerLiter.toFixed(2)}` : 'N/A',
        isValidCost ? `R$ ${totalCost.toFixed(2)}` : 'N/A',
        this.getStatusLabel(req.status)
      ];
    });

    try {
      console.log('Criando tabela detalhada com', tableData.length, 'linhas');
      autoTable(this.doc, {
        head: [['Data', 'Veículo', 'Solicitante', 'Combustível', 'KM Rodado', 'Quantidade', 'Preço/L', 'Total', 'Status']],
        body: tableData,
        startY: this.currentY,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [52, 144, 220] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 20 },
          2: { cellWidth: 25 },
          3: { cellWidth: 20 },
          4: { cellWidth: 20 },
          5: { cellWidth: 20 },
          6: { cellWidth: 18 },
          7: { cellWidth: 18 },
          8: { cellWidth: 18 }
        }
      });
      console.log('Tabela detalhada criada com sucesso');

      console.log('Adicionando rodapé...');
      this.addFooter();
      console.log('Rodapé adicionado com sucesso');
      console.log('PDFGenerator.generateMonthlyFuelReport concluído');
    } catch (error) {
      console.error('Erro ao criar tabela ou rodapé:', error);
      throw error;
    }
  }

  save(filename: string): void {
    try {
      console.log('Salvando PDF com nome:', filename);
      this.doc.save(filename);
      console.log('PDF salvo com sucesso');
    } catch (error) {
      console.error('Erro ao salvar PDF:', error);
      throw error;
    }
  }

  private getSupplierLabel(supplierId: number): string {
    // Este método deveria buscar os dados do fornecedor
    // Por enquanto retorna um placeholder
    return `Fornecedor #${supplierId}`;
  }
  /*
  export const BLOMAQ_LOGO_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAyAAAAByCAYAAADbV0QYAAAACXBIWXMAAAsTAAALEwEAmpwYAAAgAElEQVR4nO3dS3bjuJYV8H7YVYLf2Nq3C0L1zBRtFvpgrJpGQweO37VwS40cCbrs7tYbWwJwYI3e9aK8JYxPZxH6kCkRr1tCeeO9w1W1JxkzH2oZBf5g0jqGWwBfA+8fC3jvzeS/9y8ueJb2f7yH3yB4nT0ZlQkqHf1h3e/4Efrgs9AFyGqMZr1BRERERERkTKcEhIiIiIiIiLSekpwSEiIiIiIiIrafEh4iIiIiIiIi0nhIcIiIiIiIiItJ6SnCIiIiIiIiISOsowSEiIiIiIiIi0npKcIiIiIiIiIhI6ynBISIiIiIiIiKtpwSHiIiIiIiIiLSeEhwiIiIiIiIi0npKcIiIiIiIiIhI6ynBISIiIiIiIiKtpwSHiIiIiIiIiLSeEhwiIiIiIiIi0npKcIiIiIiIiIhI6ynBISIiIiIiIiKtpwSHiIiIiIiIiLSeEhwiIiIiIiIi0npKcIiIiIiIiIhI6ynBISIiIiIiIiKtpwSHiIiIiIiIiLSeEhwiIiIiIiIi0npKcIiIiIiIiIhI6ynBISIiIiIiIiKtpwSHiIiIiIiIiLSeEhwiIiIiIiIi0npKcIiIiIiIiIhI6ynBISIiIiIiIiKtpwSHiIiIiIiIiLSeEhwiIiIiIiIi0npKcIiIiIiIiIhI6ynBISIiIiIiIiKtpwSHiIiIiIiIiLSeEhwiIiIiIiIi0npKcIiIiIiIiIhI6ynBISIiIiIiIiKtpwSHiIiIiIiIiLSeEhwiIiIiIiIi0npKcIiIiIiIiIhI6ynBISIiIiIiIiKtpwSHiIiIiIiIiLSeEhwiIiIiIiIi0npKcIiIiIiIiIhI6ynBISIiIiIiIiKtpwSHiIiIiIiIiLSeEhwiIiIiIiIi0npKcIiIiIiIiIhI6ynBISIiIiIiIiKtpwSHiIiIiIiIiLSeEhwiIiIiIiIi0npKcIiIiIiIiIhI6ynBISIiIiIiIiKtpwSHiIiIiIiIiLSeEhwiIiIiIiIi0npKcIiIiIiIiIhI6ynBISIiIiIiIiKtpwSHiIiIiIiIiLSeEhwiIiIiIiIi0npKcIiIiIiIiIhI6ynBISIiIiIiIiKtpwSHiIiIiIiIiLTe/wcLpXztq8GO7gAAAABJRU5ErkJggg==';
  */
  generateReturnedChecklistPDF(checklist: any, vehicle?: any, user?: any, options: PDFOptions = {}): void {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    this.currentY = 20;
    this.obsGroupsConfig = options.obsGroups;
    this.obsItemsConfig = options.obsItems;

    const plate = vehicle?.plate || String(checklist.vehicleId);
    const startDate = checklist.startDate ? new Date(checklist.startDate).toLocaleString('pt-BR') : 'N/A';
    const endDate = checklist.endDate ? new Date(checklist.endDate).toLocaleString('pt-BR') : 'N/A';
    const kmInitialNum = Number(checklist.kmInitial || 0);
    const kmFinalNum = Number(checklist.kmFinal || 0);
    const kmRodado = kmFinalNum > kmInitialNum ? kmFinalNum - kmInitialNum : Math.max(kmFinalNum - kmInitialNum, 0);

    // --- PÁGINA 1: SAÍDA ---
    this.addHeader({
      title: 'Checklist de Saída do Veículo',
      subtitle: `Veículo ${plate} • Saída #${String(checklist.id).padStart(4, '0')}`,
      company: options.company || 'Sistema de Controle de Abastecimento',
      date: checklist.startDate ? new Date(checklist.startDate).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')
    });

    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('DADOS DO VEÍCULO', 20, this.currentY);
    this.currentY += 8;

    const vehicleInfo = [
      ['Placa:', plate],
      ['Modelo:', vehicle?.model || 'N/A'],
      ['Marca:', vehicle?.brand || 'N/A'],
    ];
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    vehicleInfo.forEach(([label, value]) => {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(label, 20, this.currentY);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(String(value), 60, this.currentY);
      this.currentY += 5;
    });

    this.currentY += 2;
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('DADOS DA SAÍDA', 20, this.currentY);
    this.currentY += 8;

    const exitInfo = [
      ['Motorista/Responsável:', user?.fullName || user?.username || 'N/A'],
      ['Data da Saída:', startDate],
      ['KM Inicial:', `${kmInitialNum} km`],
      ['Combustível (início):', this.getFuelLevelLabel(checklist.fuelLevelStart)],
      ['Status:', (checklist.status || '').toString().toLowerCase() === 'closed' ? 'Concluída' : (checklist.status || 'Aberta')]
    ];
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    exitInfo.forEach(([label, value]) => {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(label, 20, this.currentY);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(String(value || 'N/A'), 80, this.currentY);
      this.currentY += 5;
    });

    this.currentY += 5;
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('INSPEÇÃO NA SAÍDA', 20, this.currentY);
    this.currentY += 8;
    const start = checklist.inspectionStart ? safeParseJSON(checklist.inspectionStart) : {};
    this.renderInspectionBlock(start);

    // Assinaturas Saída (Fixo no rodapé)
    this.currentY = 260;
    this.doc.setLineWidth(0.5);
    this.doc.line(20, this.currentY, 90, this.currentY);
    this.doc.line(110, this.currentY, 180, this.currentY);
    this.doc.setFontSize(8);
    
    const driverName = user?.fullName || user?.username || 'Motorista / Responsável';
    this.doc.text(driverName, 35, this.currentY + 5);
    this.doc.text('Visto do Conferente', 125, this.currentY + 5);
    
    this.addFooter();


    // --- PÁGINA 2: RETORNO ---
    this.doc.addPage();
    this.currentY = 20;

    this.addHeader({
      title: 'Checklist de Retorno do Veículo',
      subtitle: `Veículo ${plate} • Retorno #${String(checklist.id).padStart(4, '0')}`,
      company: options.company || 'Sistema de Controle de Abastecimento',
      date: checklist.endDate ? new Date(checklist.endDate).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')
    });

    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('DADOS DO VEÍCULO', 20, this.currentY);
    this.currentY += 8;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    vehicleInfo.forEach(([label, value]) => {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(label, 20, this.currentY);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(String(value), 60, this.currentY);
      this.currentY += 5;
    });

    this.currentY += 2;
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('DADOS DO RETORNO', 20, this.currentY);
    this.currentY += 8;

    const returnInfo = [
      ['Motorista/Responsável:', user?.fullName || user?.username || 'N/A'],
      ['Data do Retorno:', endDate],
      ['KM Final:', checklist.kmFinal ? `${kmFinalNum} km` : 'N/A'],
      ['Combustível (retorno):', this.getFuelLevelLabel(checklist.fuelLevelEnd)],
      ['KM Rodado:', `${kmRodado} km`],
    ];
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    returnInfo.forEach(([label, value]) => {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(label, 20, this.currentY);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(String(value || 'N/A'), 80, this.currentY);
      this.currentY += 5;
    });

    this.currentY += 5;
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('INSPEÇÃO NO RETORNO', 20, this.currentY);
    this.currentY += 8;
    const end = checklist.inspectionEnd ? safeParseJSON(checklist.inspectionEnd) : {};
    this.renderInspectionBlock(end);
    
    // Bloco de conferência
    if (end?.approvedByName || end?.approvedAt) {
      this.currentY += 5;
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('CONFERÊNCIA', 20, this.currentY);
      this.currentY += 6;
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(9);
      if (end?.approvedByName) {
        this.doc.text(`Conferido por: ${String(end.approvedByName)}`, 20, this.currentY);
        this.currentY += 5;
      }
      if (end?.approvedAt) {
        const dt = new Date(end.approvedAt).toLocaleString('pt-BR');
        this.doc.text(`Data da Conferência: ${dt}`, 20, this.currentY);
        this.currentY += 5;
      }
    }

    // Assinaturas Retorno (Fixo no rodapé)
    this.currentY = 260;
    this.doc.setLineWidth(0.5);
    this.doc.line(20, this.currentY, 90, this.currentY);
    this.doc.line(110, this.currentY, 180, this.currentY);
    this.doc.setFontSize(8);
    this.doc.text(driverName, 35, this.currentY + 5);
    this.doc.text('Visto do Conferente', 125, this.currentY + 5);

    this.addFooter();
  }

  private renderInspectionBlock(vals: any) {
    const groups = this.obsGroupsConfig && this.obsGroupsConfig.length > 0 ? this.obsGroupsConfig : [
      { key: 'inspecao_veiculo', label: 'Inspeção do Veículo' },
      { key: 'seguranca', label: 'Sistema de Segurança' },
      { key: 'equipamentos', label: 'Equipamentos Internos' },
      { key: 'condutor_veiculo', label: 'Inspeção do Condutor e Veículo' },
    ];
    const items = this.obsItemsConfig && this.obsItemsConfig.length > 0 ? this.obsItemsConfig : [
      { key: 'scratches', label: 'Arranhões', group: 'inspecao_veiculo' },
      { key: 'dents', label: 'Batidas', group: 'inspecao_veiculo' },
      { key: 'tireOk', label: 'Pneus OK', group: 'inspecao_veiculo' },
      { key: 'lightsOk', label: 'Iluminação OK', group: 'seguranca' },
      { key: 'documentsOk', label: 'Documentos OK', group: 'condutor_veiculo' },
      { key: 'cleanInterior', label: 'Limpeza interna', group: 'equipamentos' },
      { key: 'cleanExterior', label: 'Limpeza externa', group: 'inspecao_veiculo' },
    ];

    const colWidth = 90;
    
    groups.forEach(g => {
      const groupItems = items.filter(i => i.group === g.key);
      if (groupItems.length === 0) return;
      
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(9);
      this.doc.text(g.label, 20, this.currentY);
      this.currentY += 5;
      
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8);

      let col = 0;
      for (let i = 0; i < groupItems.length; i++) {
        const item = groupItems[i];
        const value = vals?.[item.key];
        // Símbolo unicode check/cross pode não funcionar bem em fontes padrão do jsPDF, usando texto Sim/Não
        const labelText = value === false ? 'Não' : (value ? 'Sim' : 'Sim');
        const text = `- ${item.label}: ${labelText}`;
        
        const xPos = 20 + (col * colWidth);
        this.doc.text(text, xPos, this.currentY);

        if (col === 1) {
          col = 0;
          this.currentY += 4;
        } else {
          col = 1;
          // Se for o último item impar, avança linha também
          if (i === groupItems.length - 1) {
            this.currentY += 4;
          }
        }
      }
      // Pequeno espaço após o grupo
      this.currentY += 2;
    });
    
    const notesLine = `Observações: ${vals?.notes || '-'}`;
    const wrappedNotes = this.doc.splitTextToSize(notesLine, 170);
    this.doc.setFontSize(9);
    this.doc.text(wrappedNotes, 20, this.currentY);
    this.currentY += wrappedNotes.length * 5;
  }
}

function safeParseJSON(text: any): any {
  try {
    if (typeof text === 'string') return JSON.parse(text);
    return text || {};
  } catch {
    return {};
  }
}
