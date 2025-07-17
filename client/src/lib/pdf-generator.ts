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

  generatePurchaseOrderPDF(requisition: FuelRequisition): void {
    // Criar documento A4 com duas colunas lado a lado
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Configurar fonte padrão
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8);

    // Função para desenhar uma via do documento
    const drawVia = (x: number, viaTitle: string) => {
      let y = 20;
      
      // Título principal
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('REQUISIÇÃO PARA ABASTECIMENTO COM COMBUSTÍVEIS', x, y, { maxWidth: 90 });
      y += 15;
      
      // Título da via
      this.doc.setFontSize(8);
      this.doc.text(viaTitle, x, y);
      y += 10;
      
      // Linha de requisição
      this.doc.setFont('helvetica', 'normal');
      this.doc.text('REQUISIÇÃO | ID | EMISSÃO', x, y);
      y += 5;
      
      // Dados da requisição
      const requisitionId = String(requisition.id).padStart(4, '0');
      const emissionDate = new Date(requisition.createdAt).toLocaleDateString('pt-BR') + ' ' + 
                          new Date(requisition.createdAt).toLocaleTimeString('pt-BR');
      this.doc.text(`${requisitionId}   ${emissionDate}`, x, y);
      y += 10;
      
      // FORNECEDOR
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('FORNECEDOR', x, y);
      y += 5;
      this.doc.setFont('helvetica', 'normal');
      this.doc.text('CPF/CNPJ: 10.272.444/0001-30', x, y);
      y += 4;
      this.doc.text('Nome Empresarial: D DA C SAMPAIO COMERCIO', x, y);
      y += 3;
      this.doc.text('DE COMBUSTIVEIS LTDA', x, y);
      y += 4;
      this.doc.text('Contato: CARLOS', x, y);
      y += 4;
      this.doc.text('Telefone: (92) 9883-8218', x, y);
      y += 4;
      this.doc.text('Celular: (92) 98838-2180', x, y);
      y += 4;
      this.doc.text('E-Mail: csilva@blomaq.com.br', x, y);
      y += 8;
      
      // CLIENTE
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('CLIENTE', x, y);
      y += 5;
      this.doc.setFont('helvetica', 'normal');
      this.doc.text('CPF/CNPJ: 13.844.973/0001-59', x, y);
      y += 4;
      this.doc.text('Nome Empresarial: BBM SERVICOS,', x, y);
      y += 3;
      this.doc.text('ALUGUEL DE MAQUINAS E TECNOLOGIA LT', x, y);
      y += 4;
      this.doc.text('Contato: CLEVERSON', x, y);
      y += 4;
      this.doc.text('Telefone: (92) 3233-0634', x, y);
      y += 4;
      this.doc.text('Celular: (92) 99378-4409', x, y);
      y += 4;
      this.doc.text('E-Mail: csilva@blomaq.com.br', x, y);
      y += 8;
      
      // VEÍCULO
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('VEÍCULO', x, y);
      y += 5;
      this.doc.setFont('helvetica', 'normal');
      this.doc.text('Placa: TAC-5I79', x, y);
      y += 4;
      this.doc.text('Marca/Modelo: HONDA/CG 160 CARGO', x, y);
      y += 4;
      this.doc.text('Cor: BRANCA', x, y);
      y += 4;
      this.doc.text('Hodometro: 22.004', x, y);
      y += 8;
      
      // ABASTECIMENTO
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('ABASTECIMENTO', x, y);
      y += 5;
      this.doc.setFont('helvetica', 'normal');
      this.doc.text('Tanque Cheio.    QTI. / L        R$/L', x, y);
      this.doc.text('[R$] TOTAL', x + 65, y);
      y += 5;
      
      // Dados do abastecimento (usando dados da requisição)
      const quantity = parseFloat(requisition.quantity) || 0;
      const pricePerLiter = 6.99; // Preço fixo como no template
      const total = quantity * pricePerLiter;
      
      this.doc.text(`                 ${quantity.toFixed(3)}`, x, y);
      this.doc.text(`${pricePerLiter.toFixed(3)}`, x + 35, y);
      this.doc.text(`${total.toFixed(2)}`, x + 65, y);
      y += 30;
      
      // Assinatura
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('ALEXANDRE SERRÃO DE SOUZA', x, y);
      y += 5;
      this.doc.setFont('helvetica', 'normal');
      this.doc.text('OBRIGATÓRIO ANEXAR GRAMPEADO', x, y);
      y += 3;
      this.doc.text('O CUPOM FISCAL NA VIA BLOMAQ.', x, y);
    };
    
    // Desenhar 1ª via (lado esquerdo)
    drawVia(10, '1ª Via - Fornecedor');
    
    // Desenhar 2ª via (lado direito)
    drawVia(110, '2ª Via - Cliente');
    
    // Linha vertical separadora
    this.doc.setLineWidth(0.5);
    this.doc.line(105, 10, 105, 280);
  }

  save(filename: string): void {
    this.doc.save(filename);
  }
}