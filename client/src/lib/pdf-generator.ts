import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FuelRequisition } from '@shared/schema';

export interface PDFOptions {
  title?: string;
  subtitle?: string;
  company?: string;
  date?: string;
}

export class PDFGenerator {
  private doc: jsPDF;
  private currentY: number = 20;

  constructor(orientation: 'portrait' | 'landscape' = 'portrait') {
    this.doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4'
    });
  }

  private addHeader(options: PDFOptions) {
    const { title = 'Relatório de Requisições', subtitle, company = 'FuelControl System', date = new Date().toLocaleDateString('pt-BR') } = options;

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
      ['Solicitante:', requisition.requester],
      ['Departamento:', this.getDepartmentLabel(requisition.department)],
      ['Data de Criação:', new Date(requisition.createdAt).toLocaleDateString('pt-BR')],
      ['Data Necessária:', new Date(requisition.requiredDate).toLocaleDateString('pt-BR')],
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
      ['Quantidade:', `${requisition.quantity} litros`],
      ['Valor Estimado:', this.calculateEstimatedValue(requisition.fuelType, parseInt(requisition.quantity))]
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
    const justificationLines = this.doc.splitTextToSize(requisition.justification, 150);
    this.doc.text(justificationLines, 20, this.currentY);
    this.currentY += justificationLines.length * 5 + 10;

    // Aprovação (se houver)
    if (requisition.status === 'approved' || requisition.status === 'fulfilled') {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('INFORMAÇÕES DE APROVAÇÃO', 20, this.currentY);
      this.currentY += 10;

      const approvalInfo = [
        ['Aprovado por:', requisition.approver || 'N/A'],
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
      req.requester,
      this.getDepartmentLabel(req.department),
      this.getFuelTypeLabel(req.fuelType),
      `${req.quantity}L`,
      this.getStatusLabel(req.status),
      new Date(req.createdAt).toLocaleDateString('pt-BR')
    ]);

    autoTable(this.doc, {
      head: [['ID', 'Solicitante', 'Departamento', 'Combustível', 'Quantidade', 'Status', 'Data']],
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
      stats[req.status]++;
      const liters = parseInt(req.quantity) || 0;
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

  generatePurchaseOrderPDF(requisition: any) {
    this.doc = new jsPDF();
    this.currentY = 20;

    // Função para criar uma via do documento
    const createVia = (viaTitle: string) => {
      // Cabeçalho
      this.doc.setFontSize(16);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('REQUISIÇÃO PARA ABASTECIMENTO COM COMBUSTÍVEIS', 20, this.currentY);
      this.currentY += 15;

      this.doc.setFontSize(12);
      this.doc.text(viaTitle, 20, this.currentY);
      this.currentY += 15;

      // Informações da requisição com dados reais
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('REQUISIÇÃO | ID | EMISSÃO', 20, this.currentY);
      this.currentY += 5;
      this.doc.setFont('helvetica', 'normal');
      const dataEmissao = new Date(requisition.createdAt).toLocaleDateString('pt-BR');
      const horaEmissao = new Date(requisition.createdAt).toLocaleTimeString('pt-BR');
      this.doc.text(`REQ${String(requisition.id).padStart(3, '0')} | ${dataEmissao} | ${horaEmissao}`, 20, this.currentY);
      this.currentY += 15;

      // Fornecedor (dados fixos da empresa)
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('FORNECEDOR', 20, this.currentY);
      this.currentY += 5;
      this.doc.setFont('helvetica', 'normal');

      const fornecedorInfo = [
        'CPF/CNPJ: 22.222.444/0001-30',
        'Nome Empresarial: D DA C SAMPAIO COMERCIO',
        'DE COMBUSTIVEIS LTDA',
        'Contato: CARLOS',
        'Telefone: (92) 9883-8218',
        'Celular: (92) 98838-2180',
        'E-Mail: csilva@blomaq.com.br'
      ];

      fornecedorInfo.forEach(info => {
        this.doc.text(info, 20, this.currentY);
        this.currentY += 5;
      });
      this.currentY += 10;

      // Cliente (dados da empresa)
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('CLIENTE', 20, this.currentY);
      this.currentY += 5;
      this.doc.setFont('helvetica', 'normal');

      const clienteInfo = [
        'CPF/CNPJ: 13.844.973/0001-59',
        'Nome Empresarial: BBM SERVIÇOS,',
        'ALUGUEL DE MÁQUINAS E TECNOLOGIA LT',
        `Contato: ${requisition.requester}`,
        `Departamento: ${this.getDepartmentLabel(requisition.department)}`,
        'Telefone: (92) 3233-0634',
        'E-Mail: csilva@blomaq.com.br'
      ];

      clienteInfo.forEach(info => {
        this.doc.text(info, 20, this.currentY);
        this.currentY += 5;
      });
      this.currentY += 10;

      // Veículo (se houver informação do veículo na requisição)
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('VEÍCULO', 20, this.currentY);
      this.currentY += 5;
      this.doc.setFont('helvetica', 'normal');

      const veiculoInfo = [
        requisition.vehicleId ? `ID Veículo: ${requisition.vehicleId}` : 'Veículo: A ser definido',
        `Tipo de Combustível: ${this.getFuelTypeLabel(requisition.fuelType)}`,
        `Data Necessária: ${new Date(requisition.requiredDate).toLocaleDateString('pt-BR')}`,
        `Prioridade: ${this.getPriorityLabel(requisition.priority)}`
      ];

      veiculoInfo.forEach(info => {
        this.doc.text(info, 20, this.currentY);
        this.currentY += 5;
      });
      this.currentY += 10;

      // Abastecimento com dados reais da requisição
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('ABASTECIMENTO', 20, this.currentY);
      this.currentY += 10;

      // Tabela de abastecimento
      const headers = ['Combustível', 'QTD. / L', 'R$/L', '[R$] TOTAL'];
      const colWidths = [50, 30, 25, 35];
      let startX = 20;

      // Cabeçalho da tabela
      this.doc.setFont('helvetica', 'bold');
      headers.forEach((header, index) => {
        this.doc.text(header, startX, this.currentY);
        startX += colWidths[index];
      });
      this.currentY += 8;

      // Linha separadora
      this.doc.line(20, this.currentY, 160, this.currentY);
      this.currentY += 5;

      // Dados da tabela com informações reais
      this.doc.setFont('helvetica', 'normal');
      startX = 20;
      const quantity = parseFloat(requisition.quantity);
      const estimatedPrice = this.getEstimatedFuelPrice(requisition.fuelType);
      const total = quantity * estimatedPrice;

      const rowData = [
        this.getFuelTypeLabel(requisition.fuelType),
        quantity.toFixed(3),
        `R$ ${estimatedPrice.toFixed(2)}`,
        `R$ ${total.toFixed(2)}`
      ];

      rowData.forEach((data, index) => {
        this.doc.text(data, startX, this.currentY);
        startX += colWidths[index];
      });
      this.currentY += 10;

      // Linha separadora
      this.doc.line(20, this.currentY, 160, this.currentY);
      this.currentY += 10;

      // Justificativa
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('JUSTIFICATIVA:', 20, this.currentY);
      this.currentY += 5;
      this.doc.setFont('helvetica', 'normal');
      const justificationLines = this.doc.splitTextToSize(requisition.justification, 150);
      justificationLines.forEach((line: string) => {
        this.doc.text(line, 20, this.currentY);
        this.currentY += 5;
      });
      this.currentY += 10;

      // Status e aprovação
      if (requisition.status === 'approved' || requisition.status === 'fulfilled') {
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('APROVAÇÃO:', 20, this.currentY);
        this.currentY += 5;
        this.doc.setFont('helvetica', 'normal');
        this.doc.text(`Aprovado por: ${requisition.approver || 'N/A'}`, 20, this.currentY);
        this.currentY += 5;
        if (requisition.approvedDate) {
          this.doc.text(`Data de Aprovação: ${new Date(requisition.approvedDate).toLocaleDateString('pt-BR')}`, 20, this.currentY);
          this.currentY += 5;
        }
        this.currentY += 10;
      }

      // Assinatura
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('RESPONSÁVEL PELA REQUISIÇÃO', 20, this.currentY);
      this.currentY += 5;
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`Nome: ${requisition.requester}`, 20, this.currentY);
      this.currentY += 5;
      this.doc.text('Assinatura: ________________________', 20, this.currentY);
      this.currentY += 5;
      this.doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, this.currentY);
    };

    // Primeira via - Fornecedor
    createVia('1ª Via - Fornecedor');

    // Segunda via - Cliente
    this.doc.addPage();
    this.currentY = 20;
    createVia('2ª Via - Cliente');
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

  save(filename: string): void {
    this.doc.save(filename);
  }

  private getSupplierLabel(supplierId: number): string {
    // Este método deveria buscar os dados do fornecedor
    // Por enquanto retorna um placeholder
    return `Fornecedor #${supplierId}`;
  }
}