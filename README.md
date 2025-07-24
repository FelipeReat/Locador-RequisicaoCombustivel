# Sistema de Controle de Abastecimento

## Visão Geral

Este sistema gerencia requisições de combustível, permitindo que usuários solicitem abastecimento para veículos, com fluxo de aprovação e controle de fornecedores.

## Arquitetura

### Backend
- **Framework**: Express.js com TypeScript
- **Runtime**: Node.js com módulos ESM
- **Banco de Dados**: PostgreSQL com Drizzle ORM
- **Provedor de Banco de Dados**: Neon Database (PostgreSQL serverless)
- **Validação**: Esquemas Zod compartilhados entre frontend e backend

### Frontend
- **Framework**: React com TypeScript
- **Gerenciamento de Estado**: React Query
- **UI**: Tailwind CSS com componentes Radix UI
- **Roteamento**: Wouter

## Configuração do Ambiente

### Pré-requisitos
- Node.js (versão 18 ou superior)
- NPM ou Yarn

### Variáveis de Ambiente
O projeto utiliza um arquivo `.env` na raiz para configurar as variáveis de ambiente. As principais variáveis são:

```
DATABASE_URL=postgresql://usuario:senha@host:porta/banco?sslmode=require
```

## Instalação

1. Clone o repositório
2. Instale as dependências:
   ```
   npm install
   ```
3. Configure o arquivo `.env` na raiz do projeto com a URL do banco de dados PostgreSQL:
   ```
   DATABASE_URL=postgresql://usuario:senha@host:porta/banco?sslmode=require
   ```
   
   Se você estiver usando o Neon Database, a URL terá um formato similar a:
   ```
   DATABASE_URL=postgresql://usuario:senha@endpoint-pooler.region.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   ```

4. Configure o banco de dados (cria tabelas e adiciona dados iniciais):
   ```
   npm run db:setup
   ```
   
   Alternativamente, você pode executar os comandos separadamente:
   ```
   npm run db:init   # Cria as tabelas no banco de dados
   npm run db:seed   # Adiciona dados iniciais de exemplo
   ```

5. Execute o projeto em modo de desenvolvimento:
   ```
   npm run dev
   ```
   
   O servidor estará disponível em `http://localhost:5000`

## Scripts Disponíveis

- `npm run dev`: Inicia o servidor de desenvolvimento com hot reload
- `npm run build`: Compila o frontend e o backend para produção
- `npm run start`: Inicia o servidor em modo de produção
- `npm run db:push`: Atualiza o esquema do banco de dados usando Drizzle Kit
- `npm run db:init`: Inicializa o banco de dados com as tabelas necessárias
- `npm run db:generate`: Gera arquivos de migração baseados nas alterações do esquema
- `npm run db:migrate`: Executa as migrações pendentes no banco de dados
- `npm run db:seed`: Popula o banco de dados com dados iniciais de exemplo
- `npm run db:setup`: Configura o banco de dados (inicializa e popula com dados iniciais)

> **Nota**: Os scripts de banco de dados (`db:init`, `db:seed`, `db:migrate`) utilizam `node --import tsx` em vez de `tsx` diretamente para garantir o carregamento correto das variáveis de ambiente do arquivo `.env`.

## Implementação do Banco de Dados

O projeto utiliza Drizzle ORM para interagir com o banco de dados PostgreSQL. A implementação inclui:

1. **Conexão**: Configurada em `server/db.ts` usando `@neondatabase/serverless`
2. **Esquema**: Definido em `shared/schema.ts` com tabelas para usuários, veículos, requisições e fornecedores
3. **Armazenamento**: Implementado em `server/DbStorage.ts`, que implementa a interface `IStorage`
4. **Migrações**: Gerenciadas através de `drizzle-kit` e scripts personalizados

Para alternar entre armazenamento em memória e banco de dados, edite o arquivo `server/storage.ts`.

### Configuração Inicial do Banco de Dados

Para configurar o banco de dados pela primeira vez, siga estes passos:

1. Certifique-se de que o arquivo `.env` contém a variável `DATABASE_URL` com a string de conexão correta
2. Execute o comando para configurar o banco de dados:
   ```
   npm run db:setup
   ```
   Este comando irá:
   - Criar as tabelas necessárias no banco de dados
   - Popular o banco com dados iniciais de exemplo

### Gerenciamento de Alterações no Esquema

Quando você fizer alterações no esquema do banco de dados (`shared/schema.ts`), siga estes passos:

1. Gere arquivos de migração para as alterações:
   ```
   npm run db:generate
   ```
2. Aplique as migrações ao banco de dados:
   ```
   npm run db:migrate
   ```

Alternativamente, você pode usar o comando `npm run db:push` para aplicar as alterações diretamente sem gerar arquivos de migração (não recomendado para ambientes de produção).

## Estrutura do Projeto

- `/client`: Código do frontend React
- `/server`: Código do backend Express
- `/shared`: Esquemas e tipos compartilhados
- `/migrations`: Migrações do banco de dados (geradas pelo Drizzle Kit)

## Solução de Problemas

### Erro: DATABASE_URL não está definido no ambiente

Se você encontrar o erro `DATABASE_URL não está definido no ambiente` ao executar os scripts de banco de dados, verifique:

1. Se o arquivo `.env` existe na raiz do projeto
2. Se o arquivo `.env` contém a variável `DATABASE_URL` com o valor correto
3. Se você está executando os scripts usando os comandos `npm run` definidos no `package.json`

Os scripts foram configurados para usar `node --import tsx` em vez de `tsx` diretamente para garantir o carregamento correto das variáveis de ambiente.