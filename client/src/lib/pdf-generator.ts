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

  generatePurchaseOrderPDF(requisition: any, supplier?: any, vehicle?: any, requesterUser?: any) {
    this.doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Função para adicionar marca d'água da logo
    const addWatermark = (centerX: number) => {
      // Dados da imagem em base64 (logo Blomaq)
      const logoBase64 = 'data:image/png;base64,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';

      try {
        this.doc.addImage(logoBase64, 'PNG', centerX - 25, 100, 50, 25, undefined, 'NONE');
        
        // Aplicar baixa opacidade (marca d'água)
        this.doc.setGState(this.doc.GState({ opacity: 0.1 }));
        this.doc.addImage(logoBase64, 'PNG', centerX - 25, 100, 50, 25, undefined, 'NONE');
        this.doc.setGState(this.doc.GState({ opacity: 1.0 }));
      } catch (error) {
        console.log('Erro ao adicionar logo:', error);
      }
    };

    // Função para criar uma via do documento
    const createVia = (viaTitle: string, startX: number) => {
      let currentY = 10;
      const maxWidth = 130; // Largura máxima para cada via

      // Adicionar marca d'água centralizada na via
      addWatermark(startX + maxWidth / 2);

      // Cabeçalho
      this.doc.setFontSize(11);
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
        `CPF/CNPJ: ${supplier?.cnpj || '22.272.444/0001-30'}`,
        `Nome Empresarial: ${supplier?.name || 'D DA C SAMPAIO COMERCIO DE COMBUSTIVEIS LTDA'}`,
        `Contato: ${supplier?.responsavel || 'CARLOS'}`,
        `Telefone: ${supplier?.phone || '(92) 9883-8218'}  Celular: ${supplier?.mobile || '(92) 98838-2180'}`,
        `E-Mail: ${supplier?.email || 'csilva@blomaq.com.br'}`
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

      const clienteInfo = [
        `CPF/CNPJ: ${requisition.clientCnpj || '13.844.973/0001-59'}`,
        `Nome Empresarial: ${requisition.client || 'BBM SERVIÇOS, ALUGUEL DE MÁQUINAS E TECNOLOGIA LT'}`,
        `Contato: ${requesterUser?.fullName || requisition.requester || 'Não informado'}`,
        `Telefone: ${requesterUser?.phone || '(92) 3233-0634'}`,
        `E-Mail: ${requesterUser?.email || 'csilva@blomaq.com.br'}`
      ];

      lineY = currentY + 7;
      clienteInfo.forEach(info => {
        this.doc.text(info, startX + 2, lineY);
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
        this.doc.text('✓', startX + 2.5, currentY + 2.5);
      }
      this.doc.text('Tanque Cheio.', startX + 7, currentY + 2);
      currentY += 6;

      // Cabeçalho da tabela de combustível
      const headers = ['QTD. / L', 'R$/L', '[R$] TOTAL'];
      const colX = [startX + 40, startX + 70, startX + 100];

      headers.forEach((header, index) => {
        this.doc.text(header, colX[index], currentY);
      });
      currentY += 4;

      // Linha da tabela
      const quantity = isFullTank ? 0 : parseFloat(requisition.quantity || '0');
      const estimatedPrice = this.getEstimatedFuelPrice(requisition.fuelType);
      const total = quantity * estimatedPrice;

      if (!isFullTank) {
        this.doc.text(quantity.toFixed(3), colX[0], currentY);
        this.doc.text(estimatedPrice.toFixed(2), colX[1], currentY);
        this.doc.text(total.toFixed(2), colX[2], currentY);
      } else {
        this.doc.text('Completo', colX[0], currentY);
        this.doc.text(estimatedPrice.toFixed(2), colX[1], currentY);
        this.doc.text('A calcular', colX[2], currentY);
      }
      currentY += 8;

      // Campo de assinatura (adicionado no canto inferior direito)
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      const signatureX = startX + maxWidth - 40;
      const signatureY = 190;

      // Linha para assinatura
      this.doc.line(signatureX, signatureY, signatureX + 35, signatureY);

      // Texto do responsável centralizado embaixo da linha
      this.doc.text(`${requesterUser?.fullName || requisition.requester || 'Responsável'}`, signatureX + 17.5, signatureY + 4, { align: 'center' });

      // Rodapé da via
      this.doc.setFontSize(7);
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

  save(filename: string): void {
    this.doc.save(filename);
  }

  private getSupplierLabel(supplierId: number): string {
    // Este método deveria buscar os dados do fornecedor
    // Por enquanto retorna um placeholder
    return `Fornecedor #${supplierId}`;
  }
}