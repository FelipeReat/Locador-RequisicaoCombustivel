Você é um desenvolvedor full stack sênior especializado em apps mobile empresariais (Android e iOS).
Quero que você projete e implemente um aplicativo completo de checklist diário de utilização de veículos para uma empresa de locação de equipamentos.

1. Contexto do negócio

A empresa possui veículos próprios (pickup, caminhão, moto etc.) que são usados por funcionários para:

transportar materiais para entrega;

fazer serviços diversos externos.

É necessário controlar uso diário dos veículos através de checklists de saída e retorno, com registros de quilometragem, combustível, itens de verificação e responsáveis.

2. Objetivo do sistema

Criar um app mobile (e backend, se necessário) que permita:

Usuários (motoristas/colaboradores) realizarem checklist de saída e de entrada dos veículos;

Administração interna de usuários, veículos, tipos de veículo e itens de checklist;

Gestores/administradores visualizarem dashboards e relatórios sobre utilização de veículos e status dos checklists;

Garantir rastreabilidade, integridade dos dados e controle de permissões.

Sugira uma arquitetura moderna e robusta (por exemplo: backend REST/GraphQL + banco relacional + app em React Native/Flutter, ou similar).

3. Perfis de usuário e permissões

Crie pelo menos estes perfis:

Administrador

Cadastra, edita e desativa usuários;

Cadastra, edita e desativa veículos;

Cadastra, edita e desativa tipos de veículo (Pickup, Caminhão, Moto, Geral);

Cadastra, edita e desativa itens de checklist, configurando quais itens se aplicam a cada tipo de veículo;

Acessa todos os checklists;

Aprova, rejeita ou corrige solicitações de correção feitas pelos usuários;

Acessa dashboards e relatórios gerenciais.

Gestor

Não gerencia usuários, mas:

Consulta todos os veículos;

Consulta todos os checklists;

Acessa dashboards e relatórios;

Pode registrar observações sobre checklists (ex: advertência, bloqueio de veículo etc.).

Usuário padrão (motorista/colaborador)

Faz login com usuário e senha;

Realiza checklists de saída e entrada;

Consulta apenas os checklists feitos por ele;

Pode solicitar correção de um checklist, mas não pode alterar diretamente;

Não tem acesso a dashboards gerenciais.

4. Fluxos principais
4.1. Login e autenticação

Sistema de login com usuário e senha;

Gestão de usuários é interna ao app, feita pelo administrador (não usar provedores externos);

Implementar:

Criação de usuário (apenas admin);

Redefinição de senha (fluxo interno simples);

Bloqueio/reativação de usuário;

Autenticação segura (tokens, refresh, etc. — detalhe a solução proposta).

4.2. Cadastro de veículos

O administrador cadastra veículos com:

Placa (obrigatória, única);

Descrição (ex: “Pickup Hilux branca”);

Tipo de veículo (Pickup, Caminhão, Moto, Geral);

Situação (ativo/inativo).

Validações:

Não permitir duas placas iguais;

Impedir uso de veículo inativo em novos checklists.

4.3. Configuração dos tipos de veículo e checklists

Manter entidade Tipo de Veículo (Pickup, Caminhão, Moto, Geral, etc.);

Para cada tipo de veículo:

Administrador consegue definir lista de itens de checklist (ex: calibragem pneus, nível de óleo, estado da lataria, funcionamento das luzes, etc.);

Permitir adicionar/remover itens por tipo de veículo;

Permitir marcar item como obrigatório ou opcional;

Tipo de campo para o item (ex: checkbox OK/Não OK, campo texto observação).

O app deve, ao iniciar um checklist, carregar a lista de itens de acordo com o tipo do veículo escolhido.

4.4. Checklist de saída (check-in de saída)

Fluxo do usuário padrão:

Faz login.

Escolhe “Novo checklist de SAÍDA”.

Informa:

Veículo (lista apenas veículos ativos);

Quilometragem inicial (obrigatório, número);

Nível de combustível: opções fixas

vazio, 1/4, 1/2, 3/4, cheio;

Data e hora (usar padrão automaticamente, mas permitir ajuste se necessário, conforme regras de negócio que você sugerir).

App carrega automaticamente itens de checklist do tipo de veículo:

Usuário marca cada item (OK/Não OK, observações etc.);

Se algum item obrigatório não for marcado, impedir conclusão.

Ao confirmar:

Registrar checklist como “Saída aberta”;

Bloquear que haja mais de uma saída aberta para o mesmo veículo;

Salvar o usuário responsável, data/hora, IP/Device info se possível.

4.5. Checklist de entrada (check-in de retorno)

Fluxo do usuário padrão:

Seleciona opção “Registrar RETORNO”.

O sistema deve mostrar apenas as saídas em aberto (por veículo/usuário, conforme regra mais adequada, que você deve detalhar).

Ao selecionar uma saída aberta:

Exibir dados da saída (veículo, km inicial, combustível na saída, data/hora).

Usuário informa:

Quilometragem final (obrigatório; validar que é maior ou igual à quilometragem inicial);

Nível de combustível no retorno (mesmo conjunto de opções);

Data/hora de retorno.

Reapresentar os mesmos itens de checklist (ou permitir uma lista ajustada para retorno, se fizer sentido) para verificação do estado do veículo na volta.

Ao confirmar:

Checklist é marcado como “fechado/concluído”;

Registrar quilometragem rodada (km_final - km_inicial);

Veículo fica liberado para nova saída.

5. Solicitação de correção de checklists

Usuário padrão pode, ao visualizar um checklist feito por ele:

Acionar "Solicitar correção";

Informar um texto justificando o erro (ex: digitou km errado).

Essa solicitação vai para uma fila visível para administradores (e gestores, se fizer sentido).

Administrador pode:

Ver histórico do checklist;

Editar os campos necessários;

Registrar um comentário/justificativa da correção;

Aprovar a correção e salvar;

Manter histórico de alterações (log de auditoria) com: quem alterou, o que foi alterado, data/hora.

Usuário não pode editar diretamente o checklist depois de concluído, apenas solicitar correção.

6. Consultas, relatórios e dashboards
Para usuários padrão

Lista de checklists realizados pelo próprio usuário, com filtros por:

Período (data início / fim);

Veículo;

Status (saída aberta, concluído, em correção);

Tela de detalhes de um checklist com:

Dados do veículo;

Dados de saída e entrada (quando houver);

Itens de checklist marcados;

Status de correção (se tiver).

Para administradores e gestores

Criar dashboard gerencial com, pelo menos:

Total de checklists por período;

Quilometragem total rodada por veículo e por motorista;

Média de km por viagem;

Situação dos veículos (quantos com saída em aberto, quantos livres);

Listagem de checklists com filtros por:

Período;

Veículo;

Tipo de veículo;

Usuário;

Status;

Exportação de relatórios (por exemplo, CSV ou PDF — descreva a abordagem).

7. Modelagem de dados (mínimo esperado)

Defina e detalhe um modelo de dados (tabelas/coleções) com, no mínimo:

Usuário

Perfil (ou associação de papéis do usuário)

Veículo

Tipo de veículo

Item de checklist (modelo dos itens)

Configuração de itens por tipo de veículo

Checklist (cabeçalho)

Checklist_Item (respostas do checklist)

Solicitação de correção

Log de auditoria (alterações de checklists, correções etc.)

Explique rapidamente as relações entre essas entidades.

8. Requisitos não funcionais

Interface amigável para uso em celular, focada em simplicidade para o motorista;

Validações claras e mensagens de erro adequadas;

Considerar uso em campo: se possível, prever modo offline com sincronização (descreva uma estratégia, mesmo que simples);

Segurança:

Autenticação e autorização por perfil;

Proteção mínima de APIs;

Organização do código:

Separação clara entre camadas (apresentação, negócio, dados);

Padrões de projeto e boas práticas (explique brevemente o que utilizará).

9. Entregáveis esperados da IA

Quero que você produza:

Resumo de arquitetura (frontend, backend, banco, autenticação);

Modelagem de dados (desenho e/ou descrição das entidades e relacionamentos);

Descrição dos principais endpoints de API (separando por recursos: usuários, veículos, checklists etc.);

Estrutura inicial do projeto (pastas, módulos, organização);

Código de exemplo das telas principais do app:

Tela de login;

Tela de lista de checklists do usuário;

Tela de novo checklist de saída;

Tela de checklist de retorno;

Tela de cadastro de veículo (admin);

Tela de configuração de itens de checklist por tipo de veículo (admin);

Tela de dashboard/resumo (gestor/admin);

Exemplos de validações importantes (km final ≥ km inicial, veículo não pode ter duas saídas abertas, itens obrigatórios etc.);

Sugestão de melhorias futuras (ex: integração com sistema ERP, fotos do veículo, assinatura digital etc.).

Responda trazendo tudo o que for necessário para começar a implementação imediatamente, com foco em clareza, organização e boas práticas de desenvolvimento.