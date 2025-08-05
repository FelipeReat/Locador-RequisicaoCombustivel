# API Documentation - Sistema de Controle de Abastecimento

Esta documentação descreve todos os endpoints da API REST do Sistema de Controle de Abastecimento.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Autenticação](#autenticação)
3. [Endpoints de Usuário](#endpoints-de-usuário)
4. [Endpoints de Requisições](#endpoints-de-requisições)
5. [Endpoints de Veículos](#endpoints-de-veículos)
6. [Endpoints de Fornecedores](#endpoints-de-fornecedores)
7. [Endpoints de Empresas](#endpoints-de-empresas)
8. [Endpoints de Relatórios](#endpoints-de-relatórios)
9. [Endpoints Administrativos](#endpoints-administrativos)
10. [Códigos de Status](#códigos-de-status)
11. [Exemplos de Uso](#exemplos-de-uso)

## 🌐 Visão Geral

### Base URL
```
http://localhost:5000/api
```

### Formato de Dados
- **Request**: JSON
- **Response**: JSON
- **Content-Type**: `application/json`

### Autenticação
O sistema utiliza sessões baseadas em cookies para autenticação. Após o login bem-sucedido, todas as requisições subsequentes incluem automaticamente o cookie de sessão.

## 🔐 Autenticação

### POST /auth/login
Realiza login no sistema.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "id": "number",
  "username": "string",
  "name": "string",
  "email": "string",
  "role": "employee|manager|admin",
  "department": "string"
}
```

**Response (401):**
```json
{
  "error": "Credenciais inválidas"
}
```

### GET /auth/me
Retorna informações do usuário logado.

**Response (200):**
```json
{
  "id": "number",
  "username": "string",
  "name": "string",
  "email": "string",
  "role": "employee|manager|admin",
  "department": "string"
}
```

### POST /auth/logout
Realiza logout do sistema.

**Response (200):**
```json
{
  "message": "Logout realizado com sucesso"
}
```

## 👤 Endpoints de Usuário

### GET /user/profile
Retorna perfil do usuário logado.

**Response (200):**
```json
{
  "id": "number",
  "username": "string",
  "name": "string",
  "email": "string",
  "phone": "string",
  "department": "string",
  "role": "employee|manager|admin"
}
```

### PUT /user/profile
Atualiza perfil do usuário logado.

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "department": "string"
}
```

### POST /user/change-password
Altera senha do usuário logado.

**Request Body:**
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

### GET /users
Lista todos os usuários (Admin/Manager).

**Query Parameters:**
- `page`: número da página (padrão: 1)
- `limit`: itens por página (padrão: 10)
- `search`: busca por nome ou username
- `role`: filtrar por perfil

**Response (200):**
```json
{
  "users": [
    {
      "id": "number",
      "username": "string",
      "name": "string",
      "email": "string",
      "role": "employee|manager|admin",
      "department": "string",
      "isActive": "boolean",
      "createdAt": "string",
      "lastLogin": "string"
    }
  ],
  "total": "number",
  "page": "number",
  "totalPages": "number"
}
```

### POST /users
Cria novo usuário (Admin).

**Request Body:**
```json
{
  "username": "string",
  "password": "string",
  "name": "string",
  "email": "string",
  "phone": "string",
  "department": "string",
  "role": "employee|manager|admin"
}
```

### PUT /users/:id
Atualiza usuário (Admin).

**Request Body:**
```json
{
  "username": "string",
  "name": "string",
  "email": "string",
  "phone": "string",
  "department": "string",
  "role": "employee|manager|admin",
  "isActive": "boolean"
}
```

### DELETE /users/:id
Remove usuário (Admin).

**Response (200):**
```json
{
  "message": "Usuário removido com sucesso"
}
```

## 📋 Endpoints de Requisições

### GET /fuel-requisitions
Lista requisições de combustível.

**Query Parameters:**
- `page`: número da página
- `limit`: itens por página
- `status`: filtrar por status (pending, approved, rejected)
- `startDate`: data inicial (YYYY-MM-DD)
- `endDate`: data final (YYYY-MM-DD)
- `fuelType`: tipo de combustível
- `responsibleId`: ID do responsável
- `vehicleId`: ID do veículo

**Response (200):**
```json
{
  "requisitions": [
    {
      "id": "number",
      "responsibleId": "number",
      "responsibleName": "string",
      "supplierId": "number",
      "supplierName": "string",
      "companyId": "number",
      "companyName": "string",
      "vehicleId": "number",
      "vehiclePlate": "string",
      "currentMileage": "number",
      "previousMileage": "number",
      "mileageDriven": "number",
      "fuelType": "gasoline|ethanol|diesel|diesel_s10",
      "isFullTank": "boolean",
      "quantity": "number",
      "pricePerLiter": "number",
      "totalCost": "number",
      "fiscalCoupon": "string",
      "justification": "string",
      "requiredDate": "string",
      "priority": "low|medium|high|urgent",
      "status": "pending|approved|rejected",
      "approvedBy": "number",
      "approvedAt": "string",
      "rejectionReason": "string",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "total": "number",
  "page": "number",
  "totalPages": "number"
}
```

### POST /fuel-requisitions
Cria nova requisição de combustível.

**Request Body:**
```json
{
  "responsibleId": "number",
  "supplierId": "number",
  "companyId": "number",
  "vehicleId": "number",
  "currentMileage": "number",
  "previousMileage": "number",
  "fuelType": "gasoline|ethanol|diesel|diesel_s10",
  "isFullTank": "boolean",
  "quantity": "number",
  "pricePerLiter": "number",
  "fiscalCoupon": "string",
  "justification": "string",
  "requiredDate": "string",
  "priority": "low|medium|high|urgent"
}
```

### PUT /fuel-requisitions/:id
Atualiza requisição de combustível.

**Request Body:** (mesmos campos do POST)

### DELETE /fuel-requisitions/:id
Remove requisição de combustível.

### PATCH /fuel-requisitions/:id/status
Aprova ou rejeita requisição (Manager/Admin).

**Request Body:**
```json
{
  "status": "approved|rejected",
  "rejectionReason": "string" // obrigatório se status = rejected
}
```

## 🚗 Endpoints de Veículos

### GET /vehicles
Lista veículos.

**Query Parameters:**
- `page`: número da página
- `limit`: itens por página
- `search`: busca por placa ou modelo
- `isActive`: filtrar por status ativo

**Response (200):**
```json
{
  "vehicles": [
    {
      "id": "number",
      "plate": "string",
      "model": "string",
      "brand": "string",
      "year": "number",
      "fuelType": "gasoline|ethanol|diesel|diesel_s10",
      "currentMileage": "number",
      "isActive": "boolean",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "total": "number",
  "page": "number",
  "totalPages": "number"
}
```

### POST /vehicles
Cria novo veículo (Admin/Manager).

**Request Body:**
```json
{
  "plate": "string",
  "model": "string",
  "brand": "string",
  "year": "number",
  "fuelType": "gasoline|ethanol|diesel|diesel_s10",
  "currentMileage": "number"
}
```

### PUT /vehicles/:id
Atualiza veículo (Admin/Manager).

### DELETE /vehicles/:id
Remove veículo (Admin/Manager).

### PATCH /vehicles/:id/status
Ativa/desativa veículo (Admin/Manager).

**Request Body:**
```json
{
  "isActive": "boolean"
}
```

### PATCH /vehicles/:id/mileage
Atualiza quilometragem do veículo (Admin/Manager).

**Request Body:**
```json
{
  "currentMileage": "number"
}
```

## 🏢 Endpoints de Fornecedores

### GET /suppliers
Lista fornecedores.

**Response (200):**
```json
{
  "suppliers": [
    {
      "id": "number",
      "name": "string",
      "cnpj": "string",
      "address": "string",
      "phone": "string",
      "email": "string",
      "isActive": "boolean",
      "createdAt": "string"
    }
  ]
}
```

### POST /suppliers
Cria novo fornecedor (Admin/Manager).

**Request Body:**
```json
{
  "name": "string",
  "cnpj": "string",
  "address": "string",
  "phone": "string",
  "email": "string"
}
```

### PUT /suppliers/:id
Atualiza fornecedor (Admin/Manager).

### DELETE /suppliers/:id
Remove fornecedor (Admin/Manager).

## 🏭 Endpoints de Empresas

### GET /companies
Lista empresas.

**Response (200):**
```json
{
  "companies": [
    {
      "id": "number",
      "name": "string",
      "cnpj": "string",
      "address": "string",
      "phone": "string",
      "email": "string",
      "isActive": "boolean",
      "createdAt": "string"
    }
  ]
}
```

### POST /companies
Cria nova empresa (Admin/Manager).

**Request Body:**
```json
{
  "name": "string",
  "cnpj": "string",
  "address": "string",
  "phone": "string",
  "email": "string"
}
```

### PUT /companies/:id
Atualiza empresa (Admin/Manager).

### DELETE /companies/:id
Remove empresa (Admin/Manager).

## 📊 Endpoints de Relatórios

### GET /fuel-requisitions/stats/overview
Estatísticas gerais das requisições.

**Query Parameters:**
- `startDate`: data inicial
- `endDate`: data final

**Response (200):**
```json
{
  "totalRequisitions": "number",
  "approvedRequisitions": "number",
  "pendingRequisitions": "number",
  "rejectedRequisitions": "number",
  "totalCost": "number",
  "totalLiters": "number",
  "averageCostPerLiter": "number"
}
```

### GET /fuel-requisitions/stats/department
Estatísticas por departamento.

**Response (200):**
```json
{
  "departments": [
    {
      "department": "string",
      "totalRequisitions": "number",
      "totalCost": "number",
      "totalLiters": "number"
    }
  ]
}
```

### GET /fuel-requisitions/stats/fuel-type
Estatísticas por tipo de combustível.

**Response (200):**
```json
{
  "fuelTypes": [
    {
      "fuelType": "string",
      "totalRequisitions": "number",
      "totalCost": "number",
      "totalLiters": "number",
      "averagePrice": "number"
    }
  ]
}
```

## 🔧 Endpoints Administrativos

### POST /admin/reset-passwords
Reset de senhas em massa (Admin).

**Request Body:**
```json
{
  "newPassword": "string",
  "userIds": ["number"] // opcional, se não informado aplica a todos
}
```

### DELETE /cleanup/requisitions
Remove requisições antigas (Admin).

**Query Parameters:**
- `days`: número de dias (padrão: 365)

### DELETE /cleanup/vehicles
Remove veículos inativos antigos (Admin).

### DELETE /cleanup/suppliers
Remove fornecedores inativos antigos (Admin).

### DELETE /cleanup/companies
Remove empresas inativas antigas (Admin).

## 📊 Códigos de Status

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 400 | Dados inválidos |
| 401 | Não autenticado |
| 403 | Sem permissão |
| 404 | Não encontrado |
| 409 | Conflito (dados duplicados) |
| 422 | Erro de validação |
| 500 | Erro interno do servidor |

## 🔍 Exemplos de Uso

### Exemplo 1: Login e Criação de Requisição

```javascript
// 1. Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'joao.silva',
    password: 'senha123'
  })
});

const user = await loginResponse.json();

// 2. Criar requisição
const requisitionResponse = await fetch('/api/fuel-requisitions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    responsibleId: user.id,
    supplierId: 1,
    companyId: 1,
    vehicleId: 5,
    currentMileage: 45000,
    previousMileage: 44800,
    fuelType: 'gasoline',
    isFullTank: true,
    pricePerLiter: 5.89,
    fiscalCoupon: '123456789',
    justification: 'Viagem para cliente em São Paulo',
    requiredDate: '2025-01-15',
    priority: 'medium'
  })
});

const requisition = await requisitionResponse.json();
```

### Exemplo 2: Aprovação de Requisição

```javascript
// Aprovar requisição
const approvalResponse = await fetch('/api/fuel-requisitions/123/status', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'approved'
  })
});
```

### Exemplo 3: Busca com Filtros

```javascript
// Buscar requisições pendentes do último mês
const searchResponse = await fetch('/api/fuel-requisitions?' + new URLSearchParams({
  status: 'pending',
  startDate: '2025-01-01',
  endDate: '2025-01-31',
  page: '1',
  limit: '20'
}));

const results = await searchResponse.json();
```

### Exemplo 4: Relatório de Estatísticas

```javascript
// Obter estatísticas gerais
const statsResponse = await fetch('/api/fuel-requisitions/stats/overview?' + new URLSearchParams({
  startDate: '2025-01-01',
  endDate: '2025-01-31'
}));

const stats = await statsResponse.json();
console.log(`Total de requisições: ${stats.totalRequisitions}`);
console.log(`Custo total: R$ ${stats.totalCost.toFixed(2)}`);
```

## 🛡️ Segurança

### Autenticação
- Todas as rotas (exceto login) requerem autenticação
- Sessões expiram após inatividade
- Senhas são hasheadas com bcrypt

### Autorização
- **Employee**: Acesso limitado às próprias requisições
- **Manager**: Pode aprovar requisições e acessar relatórios
- **Admin**: Acesso completo ao sistema

### Validação
- Todos os dados de entrada são validados com Zod
- Sanitização automática de dados
- Proteção contra SQL injection

### Rate Limiting
- Limite de requisições por IP
- Proteção contra ataques de força bruta
- Throttling em endpoints sensíveis

## 🔄 Versionamento

A API segue versionamento semântico:
- **Major**: Mudanças incompatíveis
- **Minor**: Novas funcionalidades compatíveis
- **Patch**: Correções de bugs

**Versão Atual**: 1.0.0

## 📞 Suporte

Para dúvidas sobre a API:
- Consulte esta documentação
- Verifique os logs do servidor
- Entre em contato com a equipe de desenvolvimento

---

**Última atualização**: Janeiro 2025  
**Versão da API**: 1.0.0