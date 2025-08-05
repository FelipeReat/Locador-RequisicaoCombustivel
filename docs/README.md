# Documentação - Sistema de Controle de Abastecimento

Este diretório contém toda a documentação do Sistema de Controle de Abastecimento, uma aplicação web moderna para gerenciamento de requisições de combustível para frotas de veículos.

## 📚 Documentos Disponíveis

### 📋 [Documentação Técnica](./documentacao-tecnica.md)
Documentação completa da arquitetura, tecnologias utilizadas, estrutura do código e componentes do sistema.

**Conteúdo:**
- Visão geral da arquitetura
- Tecnologias e dependências
- Estrutura de pastas
- Esquema do banco de dados
- Endpoints da API
- Componentes do frontend
- Segurança e controle de acesso

### 📖 [Documentação de Requisitos](./documentacao-requisitos.md)
Especificação completa dos requisitos funcionais e não-funcionais do sistema.

**Conteúdo:**
- Requisitos funcionais detalhados
- Requisitos não-funcionais
- Regras de negócio
- Casos de uso principais
- Critérios de qualidade
- Restrições e limitações

### 🚀 [Guia de Instalação](./guia-instalacao.md)
Instruções passo a passo para instalação, configuração e execução do sistema.

**Conteúdo:**
- Pré-requisitos
- Instalação local
- Configuração do banco de dados
- Variáveis de ambiente
- Execução em desenvolvimento e produção
- Deployment e monitoramento

### 👤 [Manual do Usuário](./manual-usuario.md)
Guia completo para uso do sistema por todos os tipos de usuários.

**Conteúdo:**
- Instruções de login e navegação
- Funcionalidades por perfil de usuário
- Guias passo a passo para todas as operações
- Dicas e truques de uso
- Solução de problemas comuns
- Recursos adicionais

### 🔌 [Documentação da API](./api-documentation.md)
Referência completa da API REST do sistema para desenvolvedores.

**Conteúdo:**
- Endpoints de autenticação
- Endpoints de usuários e requisições
- Endpoints de veículos e fornecedores
- Endpoints de relatórios
- Códigos de status e exemplos
- Segurança e versionamento

## 🎯 Visão Geral do Sistema

O Sistema de Controle de Abastecimento é uma aplicação web full-stack que permite:

### ✨ Funcionalidades Principais
- **Gestão de Requisições**: Criação, aprovação e acompanhamento de requisições de combustível
- **Controle de Frota**: Gerenciamento completo de veículos e quilometragem
- **Gestão de Usuários**: Sistema de autenticação com três níveis de acesso (Admin, Manager, Employee)
- **Fornecedores e Empresas**: Cadastro e gerenciamento de fornecedores e empresas clientes
- **Relatórios e Análises**: Dashboard executivo com gráficos e relatórios detalhados
- **Geração de PDF**: Documentos automáticos para requisições e relatórios
- **Tema Escuro/Claro**: Interface moderna com suporte a temas

### 🏗️ Arquitetura
- **Frontend**: React 18 + TypeScript + Tailwind CSS + Radix UI
- **Backend**: Node.js + Express.js + TypeScript
- **Banco de Dados**: PostgreSQL (Neon Database) + Drizzle ORM
- **Build**: Vite + ESBuild

### 👥 Níveis de Acesso
- **Employee**: Criar e visualizar próprias requisições
- **Manager**: Aprovar/rejeitar requisições, visualizar relatórios departamentais
- **Admin**: Acesso completo, gerenciamento de usuários, configurações do sistema

## 🚀 Como Usar Esta Documentação

### Para Desenvolvedores
1. Leia a **Documentação Técnica** para entender a arquitetura e implementação
2. Consulte os endpoints da API para integração
3. Verifique a estrutura do banco de dados para modificações

### Para Analistas de Negócio
1. Consulte a **Documentação de Requisitos** para entender as funcionalidades
2. Revise os casos de uso para compreender os fluxos
3. Analise as regras de negócio implementadas

### Para Gestores de Projeto
1. Use ambos os documentos para planejamento
2. Consulte os requisitos não funcionais para infraestrutura
3. Revise os critérios de qualidade para validação

## 📊 Estatísticas do Projeto

- **Páginas**: 10 páginas principais
- **Componentes**: 50+ componentes reutilizáveis
- **APIs**: 40+ endpoints REST
- **Tabelas**: 5 tabelas principais no banco
- **Funcionalidades**: 70+ requisitos funcionais

## 🔄 Atualizações Recentes

### Agosto 2025
- ✅ Implementação de controle de acesso baseado em perfis
- ✅ Sistema de login moderno com autenticação segura
- ✅ Funcionalidades de reset de senha em massa
- ✅ Limpeza de dados e manutenção do sistema

### Julho 2025
- ✅ Geração automática de PDFs para requisições
- ✅ Tema escuro/claro completo
- ✅ Relatórios mensais com gráficos
- ✅ Migração completa para ambiente Replit

## 📞 Suporte

Para dúvidas sobre a documentação ou sistema:
1. Consulte primeiro os documentos técnicos
2. Verifique os casos de uso na documentação de requisitos
3. Entre em contato com a equipe de desenvolvimento

## 📝 Contribuição

Para contribuir com a documentação:
1. Mantenha a consistência com o formato existente
2. Atualize ambos os documentos quando necessário
3. Inclua exemplos práticos quando possível
4. Mantenha as informações atualizadas com o código

---

**Última atualização**: Janeiro 2025  
**Versão do Sistema**: 1.0.0  
**Status**: Produção