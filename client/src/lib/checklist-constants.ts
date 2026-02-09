export const obsConfig = [
  // Acessórios
  { key: 'tapetes', label: 'Tapetes', group: 'acessorios', column: 1, order: 1 },
  { key: 'chave_roda', label: 'Chave de Roda', group: 'acessorios', column: 1, order: 2 },
  { key: 'triangulo', label: 'Triângulo', group: 'acessorios', column: 1, order: 3 },
  { key: 'macaco', label: 'Macaco', group: 'acessorios', column: 1, order: 4 },
  { key: 'antena', label: 'Antena', group: 'acessorios', column: 2, order: 5 },
  { key: 'manual', label: 'Manual do Proprietário', group: 'acessorios', column: 2, order: 6 },
  { key: 'documentos', label: 'Documentos (CRLV)', group: 'acessorios', column: 2, order: 7 },
  { key: 'estepe', label: 'Estepe', group: 'acessorios', column: 2, order: 8 },
  
  // Segurança
  { key: 'extintor', label: 'Extintor de Incêndio', group: 'seguranca_item', column: 1, order: 9 },
  { key: 'macaco_chave', label: 'Macaco e Chave de Roda', group: 'seguranca_item', column: 1, order: 10 },
  { key: 'freio_mao', label: 'Freio de Mão', group: 'seguranca_item', column: 2, order: 12 },

  // Documentos
  { key: 'cnh', label: 'CNH do Condutor', group: 'documentos', column: 1, order: 13 },
  { key: 'documento_veiculo', label: 'Documento do Veículo (CRLV)', group: 'documentos', column: 1, order: 14 },

  // Limpeza e Organização
  { key: 'limpeza_interna', label: 'Limpeza Interna', group: 'limpeza_organizacao', column: 1, order: 15 },
  { key: 'limpeza_externa', label: 'Limpeza Externa', group: 'limpeza_organizacao', column: 1, order: 16 },
];

export type ObsGroupKey = 'acessorios' | 'seguranca_item' | 'documentos' | 'limpeza_organizacao';

export const obsGroups: { key: ObsGroupKey; label: string }[] = [
  { key: 'acessorios', label: 'Acessórios' },
  { key: 'seguranca_item', label: 'Segurança' },
  { key: 'documentos', label: 'Documentos' },
  { key: 'limpeza_organizacao', label: 'Limpeza e Organização' },
];

export const obsLabels: Record<string, string> = obsConfig.reduce((acc, cur) => {
  acc[cur.key] = cur.label;
  return acc;
}, {} as Record<string, string>);

export type FuelLevel = 
  | 'empty' 
  | 'reserve' 
  | 'low' 
  | 'one_eighth' 
  | 'quarter' 
  | 'three_eighths' 
  | 'half' 
  | 'five_eighths' 
  | 'three_quarters' 
  | 'seven_eighths' 
  | 'full';

export const fuelLevelOptions: { value: FuelLevel; label: string }[] = [
  { value: 'empty', label: 'Vazio (0/8)' },
  { value: 'reserve', label: 'Reserva' },
  { value: 'low', label: 'Baixo (1/4)' },
  { value: 'one_eighth', label: '1/8' },
  { value: 'quarter', label: '1/4 (2/8)' },
  { value: 'three_eighths', label: '3/8' },
  { value: 'half', label: '1/2 (4/8)' },
  { value: 'five_eighths', label: '5/8' },
  { value: 'three_quarters', label: '3/4 (6/8)' },
  { value: 'seven_eighths', label: '7/8' },
  { value: 'full', label: 'Cheio (8/8)' },
];
