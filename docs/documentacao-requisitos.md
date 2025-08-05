# Documentação de Requisitos - Sistema de Controle de Abastecimento

## 1. Visão Geral do Produto

### 1.1 Propósito
O Sistema de Controle de Abastecimento é uma solução web desenvolvida para gerenciar e controlar requisições de combustível em ambiente corporativo. O sistema permite o controle completo do processo de solicitação, aprovação e acompanhamento de abastecimentos de veículos da frota empresarial.

### 1.2 Escopo
O sistema abrange desde a criação de requisições de combustível até a geração de relatórios analíticos, incluindo:
- Gestão de usuários e permissões
- Controle de frota de veículos
- Gerenciamento de fornecedores
- Fluxo de aprovação de requisições
- Relatórios e análises
- Geração de documentos PDF

### 1.3 Objetivos
- Automatizar o processo de requisição de combustível
- Centralizar o controle de abastecimento da frota
- Fornecer visibilidade e rastreabilidade das requisições
- Gerar relatórios para análise de consumo
- Implementar controles de aprovação e auditoria

## 2. Requisitos Funcionais

### 2.1 Gestão de Usuários (RF001-RF010)

#### RF001 - Autenticação de Usuários
**Descrição**: O sistema deve permitir que usuários façam login com credenciais válidas.
**Critérios de Aceitação**:
- Login com username e senha
- Validação de credenciais
- Mensagens de erro específicas para usuário não encontrado ou senha incorreta
- Sessão de usuário mantida durante navegação

#### RF002 - Controle de Acesso por Perfil
**Descrição**: O sistema deve implementar três níveis de acesso: Admin, Manager e Employee.
**Critérios de Aceitação**:
- **Employee**: Criar e visualizar próprias requisições
- **Manager**: Aprovar/rejeitar requisições, visualizar relatórios departamentais
- **Admin**: Acesso completo, gerenciamento de usuários, reset de senhas

#### RF003 - Gerenciamento de Perfil
**Descrição**: Usuários devem poder visualizar e editar seus dados pessoais.
**Critérios de Aceitação**:
- Visualização de dados do perfil
- Edição de nome completo, email, telefone e cargo
- Alteração de senha com validação da senha atual

#### RF004 - Cadastro de Usuários (Admin)
**Descrição**: Administradores devem poder criar, editar e excluir usuários.
**Critérios de Aceitação**:
- Formulário de cadastro com validações
- Definição de perfil de acesso
- Edição de dados de usuários existentes
- Desativação/exclusão de usuários

#### RF005 - Reset de Senhas em Massa (Admin)
**Descrição**: Administradores devem poder redefinir senhas de múltiplos usuários.
**Critérios de Aceitação**:
- Seleção de usuários para reset
- Definição de nova senha padrão
- Exclusão de usuários específicos do reset
- Confirmação da operação

### 2.2 Gestão de Veículos (RF011-RF020)

#### RF011 - Cadastro de Veículos
**Descrição**: O sistema deve permitir o cadastro completo de veículos da frota.
**Critérios de Aceitação**:
- Campos: placa, modelo, marca, ano, tipo de combustível
- Validação de placa única
- Controle de quilometragem atual
- Status do veículo (ativo/inativo)

#### RF012 - Controle de Quilometragem
**Descrição**: O sistema deve controlar a quilometragem dos veículos.
**Critérios de Aceitação**:
- Registro de quilometragem atual
- Histórico de quilometragem
- Cálculo automático de quilometragem rodada
- Funcionalidade de reset de quilometragem

#### RF013 - Manutenção de Veículos
**Descrição**: O sistema deve registrar informações de manutenção.
**Critérios de Aceitação**:
- Data da última manutenção
- Data da próxima manutenção
- Status de manutenção

### 2.3 Gestão de Fornecedores (RF021-RF025)

#### RF021 - Cadastro de Fornecedores
**Descrição**: O sistema deve permitir o cadastro de fornecedores de combustível.
**Critérios de Aceitação**:
- Dados empresariais: nome empresarial, nome fantasia, CNPJ
- Dados de contato: responsável, telefone, email
- Endereço completo
- Status ativo/inativo

#### RF022 - Gerenciamento de Fornecedores
**Descrição**: Permitir edição e exclusão de fornecedores.
**Critérios de Aceitação**:
- Edição de dados cadastrais
- Desativação de fornecedores
- Validação de CNPJ único

### 2.4 Gestão de Empresas/Clientes (RF026-RF030)

#### RF026 - Cadastro de Empresas
**Descrição**: O sistema deve permitir o cadastro de empresas clientes.
**Critérios de Aceitação**:
- Nome da empresa e nome completo
- CNPJ único
- Dados de contato completos
- Status ativo/inativo

### 2.5 Requisições de Combustível (RF031-RF050)

#### RF031 - Criação de Requisições
**Descrição**: Usuários devem poder criar requisições de combustível.
**Critérios de Aceitação**:
- Seleção de responsável, fornecedor, cliente e veículo
- Informações de quilometragem (atual, anterior, rodada)
- Tipo de combustível e quantidade
- Opção de tanque cheio
- Justificativa obrigatória
- Data requerida e prioridade

#### RF032 - Validação de Dados
**Descrição**: O sistema deve validar todos os dados da requisição.
**Critérios de Aceitação**:
- Validação de campos obrigatórios
- Validação de tipos de dados
- Verificação de quilometragem lógica
- Validação de datas

#### RF033 - Fluxo de Aprovação
**Descrição**: Requisições devem seguir fluxo de aprovação definido.
**Critérios de Aceitação**:
- Status: Pendente, Aprovada, Rejeitada, Atendida
- Aprovação por usuários com perfil Manager ou Admin
- Registro de aprovador e data
- Motivo de rejeição quando aplicável

#### RF034 - Edição de Requisições
**Descrição**: Permitir edição de requisições conforme regras de negócio.
**Critérios de Aceitação**:
- Edição apenas por criador ou admin
- Restrições baseadas no status
- Histórico de alterações

#### RF035 - Exclusão de Requisições
**Descrição**: Permitir exclusão de requisições com controles adequados.
**Critérios de Aceitação**:
- Exclusão apenas por criador ou admin
- Confirmação obrigatória
- Restrições baseadas no status

#### RF036 - Geração Automática de PDF
**Descrição**: O sistema deve gerar automaticamente PDF para cada requisição.
**Critérios de Aceitação**:
- PDF gerado na criação da requisição
- Formatação profissional com dados da empresa
- Inclusão de todos os dados relevantes
- Download disponível

### 2.6 Relatórios e Análises (RF051-RF060)

#### RF051 - Dashboard Executivo
**Descrição**: Painel com visão geral das requisições e estatísticas.
**Critérios de Aceitação**:
- Estatísticas gerais (total, pendentes, aprovadas, rejeitadas)
- Gráficos de tendências
- Requisições recentes
- Indicadores de performance

#### RF052 - Relatórios por Período
**Descrição**: Geração de relatórios filtrados por período.
**Critérios de Aceitação**:
- Seleção de data início e fim
- Filtros por status, departamento, tipo de combustível
- Exportação em PDF
- Gráficos e tabelas

#### RF053 - Análise por Departamento
**Descrição**: Relatórios segmentados por departamento.
**Critérios de Aceitação**:
- Consumo por departamento
- Comparativos mensais
- Ranking de consumo

#### RF054 - Análise por Tipo de Combustível
**Descrição**: Relatórios segmentados por tipo de combustível.
**Critérios de Aceitação**:
- Distribuição por tipo (gasolina, etanol, diesel, diesel S10)
- Tendências de consumo
- Análise de custos

#### RF055 - Relatórios Mensais
**Descrição**: Geração automática de relatórios mensais.
**Critérios de Aceitação**:
- Compilação automática mensal
- Gráficos de tendências
- Exportação em PDF
- Envio automático por email (futuro)

### 2.7 Administração do Sistema (RF061-RF070)

#### RF061 - Limpeza de Dados
**Descrição**: Funcionalidades para limpeza e manutenção de dados.
**Critérios de Aceitação**:
- Limpeza de requisições antigas
- Limpeza de veículos inativos
- Limpeza de fornecedores inativos
- Confirmação obrigatória para operações

#### RF062 - Configurações do Sistema
**Descrição**: Painel de configurações gerais.
**Critérios de Aceitação**:
- Configurações de tema (claro/escuro)
- Configurações de idioma
- Configurações de notificações
- Backup e restore de dados

## 3. Requisitos Não Funcionais

### 3.1 Performance (RNF001-RNF005)

#### RNF001 - Tempo de Resposta
**Descrição**: O sistema deve responder às requisições em tempo adequado.
**Critérios**:
- Páginas devem carregar em menos de 3 segundos
- APIs devem responder em menos de 1 segundo
- Operações de relatório em menos de 10 segundos

#### RNF002 - Capacidade
**Descrição**: O sistema deve suportar uso simultâneo.
**Critérios**:
- Suporte a pelo menos 50 usuários simultâneos
- Processamento de até 1000 requisições por dia
- Armazenamento de histórico de 5 anos

### 3.2 Usabilidade (RNF006-RNF010)

#### RNF006 - Interface Intuitiva
**Descrição**: A interface deve ser fácil de usar.
**Critérios**:
- Navegação clara e consistente
- Formulários com validação em tempo real
- Mensagens de erro claras
- Suporte a tema escuro/claro

#### RNF007 - Responsividade
**Descrição**: O sistema deve funcionar em diferentes dispositivos.
**Critérios**:
- Compatibilidade com desktop, tablet e mobile
- Layout adaptativo
- Touch-friendly em dispositivos móveis

### 3.3 Segurança (RNF011-RNF015)

#### RNF011 - Autenticação Segura
**Descrição**: Implementar autenticação robusta.
**Critérios**:
- Senhas criptografadas
- Sessões seguras
- Timeout automático de sessão

#### RNF012 - Controle de Acesso
**Descrição**: Implementar controle rigoroso de acesso.
**Critérios**:
- Autorização baseada em perfis
- Auditoria de ações críticas
- Proteção contra acesso não autorizado

#### RNF013 - Proteção de Dados
**Descrição**: Garantir proteção dos dados sensíveis.
**Critérios**:
- Criptografia de dados sensíveis
- Backup automático
- Conformidade com LGPD

### 3.4 Confiabilidade (RNF016-RNF020)

#### RNF016 - Disponibilidade
**Descrição**: O sistema deve estar disponível durante horário comercial.
**Critérios**:
- Disponibilidade de 99% durante horário comercial
- Tempo de recuperação menor que 1 hora
- Backup automático diário

#### RNF017 - Integridade de Dados
**Descrição**: Garantir integridade dos dados.
**Critérios**:
- Validação de dados em todas as camadas
- Transações atômicas
- Logs de auditoria

### 3.5 Manutenibilidade (RNF021-RNF025)

#### RNF021 - Código Limpo
**Descrição**: Código deve ser maintível e extensível.
**Critérios**:
- Arquitetura modular
- Documentação técnica completa
- Padrões de codificação consistentes
- Testes automatizados

#### RNF022 - Monitoramento
**Descrição**: Sistema deve permitir monitoramento.
**Critérios**:
- Logs detalhados de operações
- Métricas de performance
- Alertas de erro automáticos

## 4. Regras de Negócio

### 4.1 Requisições (RN001-RN010)

#### RN001 - Aprovação Obrigatória
Todas as requisições devem ser aprovadas por usuário com perfil Manager ou Admin antes do atendimento.

#### RN002 - Quilometragem Lógica
A quilometragem atual deve ser sempre maior ou igual à quilometragem anterior.

#### RN003 - Tanque Cheio vs Quantidade
Quando "tanque cheio" estiver marcado, o campo quantidade é opcional.

#### RN004 - Prioridade Padrão
Novas requisições têm prioridade "média" por padrão.

#### RN005 - Status Sequencial
O status das requisições deve seguir a sequência: Pendente → Aprovada/Rejeitada → Atendida.

### 4.2 Usuários (RN011-RN015)

#### RN011 - Username Único
Cada usuário deve ter um username único no sistema.

#### RN012 - Senha Mínima
Senhas devem ter pelo menos 6 caracteres.

#### RN013 - Admin Sempre Ativo
Pelo menos um usuário Admin deve estar sempre ativo no sistema.

### 4.3 Veículos (RN016-RN020)

#### RN016 - Placa Única
Cada veículo deve ter uma placa única no sistema.

#### RN017 - Tipo de Combustível
Veículos devem ter tipo de combustível definido: gasolina, etanol, diesel ou diesel S10.

### 4.4 Fornecedores (RN021-RN025)

#### RN021 - CNPJ Único
Cada fornecedor deve ter um CNPJ único no sistema.

#### RN022 - Fornecedor Ativo
Apenas fornecedores ativos podem ser selecionados em novas requisições.

## 5. Casos de Uso Principais

### 5.1 UC001 - Criar Requisição de Combustível
**Ator**: Employee, Manager, Admin
**Pré-condições**: Usuário autenticado
**Fluxo Principal**:
1. Usuário acessa página de nova requisição
2. Preenche formulário com dados obrigatórios
3. Sistema valida dados
4. Sistema cria requisição com status "Pendente"
5. Sistema gera PDF automaticamente
6. Sistema exibe confirmação

### 5.2 UC002 - Aprovar Requisição
**Ator**: Manager, Admin
**Pré-condições**: Requisição com status "Pendente"
**Fluxo Principal**:
1. Usuário visualiza requisição pendente
2. Analisa dados da requisição
3. Aprova requisição
4. Sistema atualiza status para "Aprovada"
5. Sistema registra aprovador e data

### 5.3 UC003 - Gerar Relatório Mensal
**Ator**: Manager, Admin
**Pré-condições**: Dados de requisições disponíveis
**Fluxo Principal**:
1. Usuário acessa página de relatórios
2. Seleciona período desejado
3. Sistema processa dados
4. Sistema gera gráficos e tabelas
5. Usuário pode exportar em PDF

### 5.4 UC004 - Gerenciar Usuários
**Ator**: Admin
**Pré-condições**: Usuário com perfil Admin
**Fluxo Principal**:
1. Admin acessa gerenciamento de usuários
2. Visualiza lista de usuários
3. Pode criar, editar ou desativar usuários
4. Define perfis de acesso
5. Sistema valida e salva alterações

## 6. Critérios de Qualidade

### 6.1 Funcionalidade
- Todas as funcionalidades especificadas devem estar implementadas
- Validações de dados em todas as entradas
- Tratamento adequado de erros

### 6.2 Confiabilidade
- Sistema deve funcionar sem falhas críticas
- Recuperação automática de erros menores
- Backup e restore funcionais

### 6.3 Usabilidade
- Interface intuitiva e consistente
- Tempo de aprendizado menor que 2 horas
- Satisfação do usuário acima de 80%

### 6.4 Eficiência
- Tempo de resposta adequado
- Uso otimizado de recursos
- Escalabilidade para crescimento futuro

### 6.5 Manutenibilidade
- Código bem documentado
- Arquitetura modular
- Facilidade para implementar mudanças

### 6.6 Portabilidade
- Funcionamento em diferentes navegadores
- Compatibilidade com dispositivos móveis
- Independência de sistema operacional

## 7. Restrições e Limitações

### 7.1 Tecnológicas
- Deve funcionar em navegadores modernos (Chrome, Firefox, Safari, Edge)
- Requer JavaScript habilitado
- Conexão com internet obrigatória

### 7.2 Operacionais
- Horário de manutenção: madrugada (2h às 4h)
- Backup diário automático
- Retenção de dados por 5 anos

### 7.3 Regulamentares
- Conformidade com LGPD
- Auditoria de acessos obrigatória
- Proteção de dados pessoais

## 8. Glossário

**Requisição**: Solicitação formal de combustível para um veículo específico
**Aprovador**: Usuário com permissão para aprovar requisições
**Tanque Cheio**: Opção para abastecer completamente o tanque do veículo
**Quilometragem Rodada**: Diferença entre quilometragem atual e anterior
**Status**: Estado atual da requisição no fluxo de aprovação
**Prioridade**: Nível de urgência da requisição (baixa, média, alta, urgente)
**Fornecedor**: Empresa que fornece combustível
**Frota**: Conjunto de veículos da empresa
**Dashboard**: Painel principal com visão geral do sistema