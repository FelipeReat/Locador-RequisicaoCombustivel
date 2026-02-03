# Prompt para IDE — Checklist por Tipo de Veículo (React + Node + Express + Drizzle)

## Contexto Técnico
- Frontend: React 18 + Vite + Tailwind + Radix UI
- Backend: NodeJS + Express
- ORM: **Drizzle ORM**
- Banco de dados: **PostgreSQL**
- Autenticação: Passport (roles: `admin`, `manager`, `employee`)
- Tabelas existentes relevantes:
  - `vehicle_types`
  - `vehicles` (FK: `vehicle_type_id`)
  - `users`

---

## Objetivo Geral
Evoluir o sistema de checklist de veículos para suportar **múltiplos modelos de checklist (templates)** e permitir a **associação de cada tipo de veículo a um checklist específico**, removendo a limitação atual de checklist global.

---

## Requisitos Funcionais

1. Permitir cadastro de **N checklists (templates)**.
2. Cada checklist deve conter **N itens configuráveis**:
   - label
   - defaultChecked
   - coluna (1 = esquerda, 2 = direita)
   - ordem
   - grupo
3. Associar **1 checklist a cada tipo de veículo (`vehicle_types`)**.
4. Ao gerar checklist de um veículo, carregar os itens do checklist associado ao tipo.
5. Transformar “Editar Observações” em **página administrativa dedicada**.
6. Restringir edição a usuários com role **admin** ou **manager**.
7. Migrar o checklist global legado para um template padrão.

---

## Alterações no Banco de Dados (Drizzle)

### Nova tabela: `checklist_templates`
- id (PK)
- name (unique)
- description
- active (boolean)
- created_at
- updated_at

### Nova tabela: `checklist_template_items`
- id (PK)
- checklist_template_id (FK)
- key
- label
- default_checked
- column
- order
- group
- active
- created_at
- updated_at

### Alteração em `vehicle_types`
- Adicionar coluna: `checklist_template_id` (FK, nullable)

---

## Migração do Legado

1. Criar checklist template:
   - Nome: **Padrão (Legado)**
2. Migrar dados do `obs_config` global para `checklist_template_items`.
3. Associar esse template a todos os `vehicle_types` sem checklist definido.

---

## Backend — Endpoints (Express)

### Admin (role admin/manager)

- GET `/api/admin/checklists`
- POST `/api/admin/checklists`
- GET `/api/admin/checklists/:id`
- PUT `/api/admin/checklists/:id`
- DELETE `/api/admin/checklists/:id`

### Itens do Checklist
- POST `/api/admin/checklists/:id/items`
- PUT `/api/admin/checklists/:id/items/:itemId`
- DELETE `/api/admin/checklists/:id/items/:itemId`
- PATCH `/api/admin/checklists/:id/items/reorder`

### Associação Tipo → Checklist
- GET `/api/admin/vehicle-types`
- PUT `/api/admin/vehicle-types/:id/checklist`

### Uso operacional
- GET `/api/vehicles/:id/checklist-template`

---

## Frontend — Rotas

### Administração
- `/admin/checklists`
- `/admin/checklists/:id/edit`
- `/admin/vehicle-types/checklists`

### Checklist Operacional
- Ajustar tela de checklist para buscar template via API do veículo

---

## Controle de Acesso
- Middleware backend validando roles
- Rotas admin protegidas no frontend
- Retornar 403 para acessos indevidos

---

## Critérios de Aceite

- Diferentes tipos de veículos exibem checklists diferentes
- Templates podem ser criados/editados/excluídos
- Checklist legado continua funcionando via template padrão
- Usuários comuns não conseguem acessar páginas administrativas

---

## Observações Finais
- Não utilizar mais `obs_config` global em runtime
- Centralizar regras de checklist nos templates
- Garantir ordenação e layout em duas colunas

