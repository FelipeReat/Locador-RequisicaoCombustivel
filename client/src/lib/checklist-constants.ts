
export type ObsGroupKey = 'inspecao_veiculo' | 'seguranca_item' | 'documentos' | 'limpeza_organizacao';

export const obsGroups: { key: ObsGroupKey; label: string }[] = [
  { key: 'inspecao_veiculo', label: 'Inspeção do Veículo' },
  { key: 'seguranca_item', label: 'Itens de Segurança' },
  { key: 'documentos', label: 'Documentos' },
  { key: 'limpeza_organizacao', label: 'Limpeza e Organização' },
];

export const obsConfig: { key: string; label: string; group: ObsGroupKey; column: 1 | 2; order: number }[] = [
  // Inspeção do Veículo
  { key: 'lataria', label: 'Lataria (Amassados/Arranhões)', group: 'inspecao_veiculo', column: 1, order: 1 },
  { key: 'pneus', label: 'Pneus (Calibragem/Estado)', group: 'inspecao_veiculo', column: 1, order: 2 },
  { key: 'vidros', label: 'Vidros/Retrovisores', group: 'inspecao_veiculo', column: 1, order: 3 },
  { key: 'farois_lanternas', label: 'Faróis e Lanternas', group: 'inspecao_veiculo', column: 1, order: 4 },
  { key: 'oleo_agua', label: 'Nível de Óleo e Água', group: 'inspecao_veiculo', column: 2, order: 5 },
  { key: 'painel', label: 'Luzes do Painel', group: 'inspecao_veiculo', column: 2, order: 6 },
  { key: 'ar_condicionado', label: 'Ar Condicionado', group: 'inspecao_veiculo', column: 2, order: 7 },

  // Itens de Segurança
  { key: 'cinto_seguranca', label: 'Cinto de Segurança', group: 'seguranca_item', column: 1, order: 8 },
  { key: 'extintor', label: 'Extintor de Incêndio', group: 'seguranca_item', column: 1, order: 9 },
  { key: 'macaco_chave', label: 'Macaco e Chave de Roda', group: 'seguranca_item', column: 1, order: 10 },
  { key: 'triangulo', label: 'Triângulo de Sinalização', group: 'seguranca_item', column: 2, order: 11 },
  { key: 'freio_mao', label: 'Freio de Mão', group: 'seguranca_item', column: 2, order: 12 },

  // Documentos
  { key: 'cnh', label: 'CNH do Condutor', group: 'documentos', column: 1, order: 13 },
  { key: 'documento_veiculo', label: 'Documento do Veículo (CRLV)', group: 'documentos', column: 1, order: 14 },

  // Limpeza e Organização
  { key: 'limpeza_interna', label: 'Limpeza Interna', group: 'limpeza_organizacao', column: 1, order: 15 },
  { key: 'limpeza_externa', label: 'Limpeza Externa', group: 'limpeza_organizacao', column: 1, order: 16 },
];

export const obsLabels: Record<string, string> = obsConfig.reduce((acc, cur) => {
  acc[cur.key] = cur.label;
  return acc;
}, {} as Record<string, string>);

export type FuelLevel = 'reserve' | 'low' | 'quarter' | 'half' | 'three_quarters' | 'full';

export const fuelLevelOptions: { value: FuelLevel; label: string }[] = [
  { value: 'reserve', label: 'Reserva' },
  { value: 'low', label: 'Baixo (1/4)' },
  { value: 'quarter', label: 'Um Quarto (1/4)' },
  { value: 'half', label: 'Meio Tanque (1/2)' },
  { value: 'three_quarters', label: 'Três Quartos (3/4)' },
  { value: 'full', label: 'Cheio' },
];
