# Funcionalidade: Redefinição de Senha por Administrador

## Visão Geral
Esta funcionalidade permite que administradores do sistema definam diretamente uma nova senha para qualquer usuário cadastrado. O objetivo é facilitar o suporte a usuários que perderam acesso ou precisam de redefinição imediata de credenciais, mantendo a segurança e rastreabilidade da operação.

## Fluxo da Funcionalidade

1.  **Acesso**:
    *   O Administrador acessa a tela de **Gerenciamento de Usuários**.
    *   Na lista de usuários, identifica o usuário alvo.
    *   Clica no ícone de **Chave** ("Definir Nova Senha") disponível nas ações do usuário.

2.  **Definição da Senha**:
    *   Uma janela modal é aberta solicitando a nova senha.
    *   O Administrador insere a nova senha e a confirmação.
    *   O sistema valida a força da senha e se a confirmação coincide.

3.  **Confirmação**:
    *   Ao submeter, uma caixa de diálogo de confirmação alerta sobre a irreversibilidade da ação e o envio de notificação.
    *   O Administrador confirma a operação.

4.  **Processamento (Backend)**:
    *   O sistema verifica se o solicitante possui permissão de **Administrador**.
    *   A nova senha é criptografada (hash).
    *   O registro do usuário é atualizado no banco de dados.
    *   Uma entrada é gerada no **Log de Auditoria**.
    *   Um e-mail de notificação é enviado ao usuário afetado.

5.  **Conclusão**:
    *   O Administrador recebe uma mensagem de sucesso.
    *   O Usuário recebe um e-mail informando sobre a alteração.

## Requisitos de Segurança

*   **Autenticação e Autorização**:
    *   Apenas usuários com perfil `admin` podem acessar o endpoint de redefinição (`POST /api/users/:id/reset-password`).
    *   Tentativas de acesso por outros perfis retornam erro `403 Forbidden`.

*   **Criptografia de Senha**:
    *   As senhas nunca são armazenadas em texto plano.
    *   Utiliza-se o algoritmo **bcrypt** (via biblioteca `bcryptjs`) com *salt* de 10 rodadas para gerar o hash da senha antes do armazenamento.

*   **Validação de Senha**:
    *   Mínimo de 8 caracteres.
    *   Deve conter letras maiúsculas, minúsculas, números e caracteres especiais.

*   **Notificação**:
    *   O usuário é notificado por e-mail para garantir que ele esteja ciente da alteração de suas credenciais, prevenindo alterações maliciosas silenciosas.

## Procedimentos de Auditoria

Todas as alterações de senha realizadas por administradores são registradas na tabela `audit_log`.

**Dados Registrados**:
*   **Tabela**: `users`
*   **Registro ID**: ID do usuário que teve a senha alterada.
*   **Ação**: `UPDATE`
*   **Usuário (Autor)**: ID do Administrador que realizou a ação.
*   **Timestamp**: Data e hora da alteração.
*   **Descrição**: "Senha do usuário [username] alterada pelo administrador".
*   **Valores**: Os campos de senha são mascarados (`***`) nos detalhes do log para segurança.

## Detalhes Técnicos

### Backend
*   **Endpoint**: `POST /api/users/:id/reset-password`
*   **Controller**: `server/routes.ts`
*   **Service**: `DatabaseStorage.adminSetPassword` (em `server/db-storage.ts`)
*   **Email Service**: `server/email-service.ts`

### Frontend
*   **Componente**: `UserManagement` (em `client/src/pages/user-management.tsx`)
*   **Bibliotecas**:
    *   `react-hook-form` + `zod` para formulários e validação.
    *   `@tanstack/react-query` para comunicação com API.
    *   `lucide-react` para ícones.

## Testes

Foram implementados testes de integração no backend (`server/test-admin-password-reset.ts`) cobrindo:
1.  Criação de usuários de teste.
2.  Execução da alteração de senha via função de serviço.
3.  Verificação da validade da nova senha (hash matching).
4.  Verificação da existência e integridade do log de auditoria.
