# Manual do Usuário - Sistema de Controle de Abastecimento

Este manual fornece instruções detalhadas sobre como usar o Sistema de Controle de Abastecimento para todos os tipos de usuários.

## 📋 Índice

1. [Introdução](#introdução)
2. [Acesso ao Sistema](#acesso-ao-sistema)
3. [Navegação Básica](#navegação-básica)
4. [Funcionalidades por Perfil](#funcionalidades-por-perfil)
5. [Guias Detalhados](#guias-detalhados)
6. [Dicas e Truques](#dicas-e-truques)
7. [Solução de Problemas](#solução-de-problemas)

## 🎯 Introdução

O Sistema de Controle de Abastecimento é uma ferramenta web que permite gerenciar requisições de combustível para a frota de veículos da empresa. O sistema oferece diferentes funcionalidades baseadas no seu perfil de usuário.

### Perfis de Usuário
- **👤 Employee (Funcionário)**: Pode criar e visualizar suas próprias requisições
- **👨‍💼 Manager (Gerente)**: Pode aprovar/rejeitar requisições e visualizar relatórios
- **👨‍💻 Admin (Administrador)**: Acesso completo ao sistema

## 🔐 Acesso ao Sistema

### 1. Login
1. Acesse a URL do sistema no seu navegador
2. Digite seu **nome de usuário** e **senha**
3. Clique em **"Entrar"**

### 2. Primeiro Acesso
Se for seu primeiro acesso:
- Use as credenciais fornecidas pelo administrador
- Altere sua senha nas configurações do perfil
- Complete suas informações pessoais

### 3. Esqueci Minha Senha
- Entre em contato com o administrador do sistema
- Solicite o reset da sua senha
- Use a nova senha temporária fornecida

## 🧭 Navegação Básica

### Menu Lateral
O menu lateral contém todas as funcionalidades disponíveis:

- **🏠 Dashboard**: Visão geral do sistema
- **📋 Requisições**: Lista de todas as requisições
- **➕ Nova Requisição**: Criar nova requisição
- **📊 Relatórios**: Análises e relatórios
- **👥 Usuários**: Gerenciamento de usuários (Admin)
- **🚗 Frota**: Gerenciamento de veículos (Admin/Manager)
- **🏢 Fornecedores**: Cadastro de fornecedores (Admin/Manager)
- **🏭 Empresas**: Cadastro de empresas (Admin/Manager)
- **⚙️ Configurações**: Configurações pessoais

### Cabeçalho
- **🌙/☀️ Tema**: Alternar entre tema claro e escuro
- **👤 Perfil**: Acesso rápido ao perfil e logout
- **🔔 Notificações**: Alertas e notificações do sistema

## 👥 Funcionalidades por Perfil

### 👤 Employee (Funcionário)

#### O que você pode fazer:
- ✅ Criar novas requisições de combustível
- ✅ Visualizar suas próprias requisições
- ✅ Editar requisições pendentes
- ✅ Baixar PDFs das requisições
- ✅ Alterar dados do perfil
- ✅ Visualizar dashboard básico

#### O que você NÃO pode fazer:
- ❌ Aprovar ou rejeitar requisições
- ❌ Ver requisições de outros usuários
- ❌ Gerenciar usuários, veículos ou fornecedores
- ❌ Acessar relatórios completos

### 👨‍💼 Manager (Gerente)

#### Tudo do Employee, mais:
- ✅ Aprovar ou rejeitar requisições
- ✅ Visualizar todas as requisições
- ✅ Acessar relatórios completos
- ✅ Gerenciar veículos da frota
- ✅ Gerenciar fornecedores
- ✅ Visualizar dashboard completo

### 👨‍💻 Admin (Administrador)

#### Acesso completo, incluindo:
- ✅ Todas as funcionalidades anteriores
- ✅ Gerenciar usuários (criar, editar, excluir)
- ✅ Reset de senhas em massa
- ✅ Limpeza de dados do sistema
- ✅ Configurações avançadas
- ✅ Gerenciar empresas

## 📖 Guias Detalhados

### 🆕 Como Criar uma Requisição

1. **Acesse Nova Requisição**
   - Clique em "➕ Nova Requisição" no menu lateral

2. **Preencha os Dados Básicos**
   - **Responsável**: Selecione quem será responsável
   - **Fornecedor**: Escolha o posto de combustível
   - **Cliente**: Selecione a empresa cliente
   - **Veículo**: Escolha o veículo a ser abastecido

3. **Informações de Quilometragem**
   - **KM Atual**: Quilometragem atual do veículo
   - **KM Anterior**: Última quilometragem registrada
   - **KM Rodado**: Calculado automaticamente

4. **Detalhes do Combustível**
   - **Tipo**: Gasolina, Etanol, Diesel ou Diesel S10
   - **Tanque Cheio**: Marque se for abastecer completamente
   - **Quantidade**: Litros (opcional se tanque cheio)
   - **Preço por Litro**: Valor do combustível
   - **Cupom Fiscal**: Número do cupom

5. **Informações Adicionais**
   - **Justificativa**: Motivo da requisição (obrigatório)
   - **Data Requerida**: Quando precisa do combustível
   - **Prioridade**: Baixa, Média, Alta ou Urgente

6. **Finalizar**
   - Clique em "Criar Requisição"
   - O sistema gerará automaticamente um PDF
   - A requisição ficará com status "Pendente"

### ✅ Como Aprovar/Rejeitar Requisições (Manager/Admin)

1. **Acessar Requisições**
   - Vá para "📋 Requisições"
   - Filtre por status "Pendente"

2. **Visualizar Detalhes**
   - Clique na requisição desejada
   - Analise todos os dados fornecidos

3. **Tomar Decisão**
   - **Para Aprovar**: Clique em "Aprovar"
   - **Para Rejeitar**: Clique em "Rejeitar" e informe o motivo

4. **Confirmação**
   - O sistema registrará sua decisão
   - O status será atualizado automaticamente
   - O solicitante será notificado

### 📊 Como Gerar Relatórios (Manager/Admin)

1. **Acessar Relatórios**
   - Clique em "📊 Relatórios" no menu

2. **Selecionar Período**
   - Escolha data de início e fim
   - Ou selecione um mês específico

3. **Aplicar Filtros**
   - Por status da requisição
   - Por tipo de combustível
   - Por departamento
   - Por veículo

4. **Visualizar Dados**
   - Gráficos de tendências
   - Tabelas detalhadas
   - Estatísticas resumidas

5. **Exportar**
   - Clique em "Exportar PDF"
   - O relatório será baixado automaticamente

### 🚗 Como Gerenciar Veículos (Admin/Manager)

1. **Acessar Frota**
   - Vá para "🚗 Frota" no menu

2. **Adicionar Novo Veículo**
   - Clique em "Adicionar Veículo"
   - Preencha: placa, modelo, marca, ano, tipo de combustível
   - Defina quilometragem inicial

3. **Editar Veículo**
   - Clique no veículo desejado
   - Modifique os dados necessários
   - Salve as alterações

4. **Atualizar Quilometragem**
   - Use o botão "Atualizar KM"
   - Informe a nova quilometragem
   - Confirme a operação

5. **Desativar Veículo**
   - Clique em "Desativar"
   - Confirme a operação
   - O veículo não aparecerá mais em novas requisições

### 👥 Como Gerenciar Usuários (Admin)

1. **Acessar Usuários**
   - Vá para "👥 Usuários" no menu

2. **Criar Novo Usuário**
   - Clique em "Adicionar Usuário"
   - Preencha dados pessoais
   - Defina username e senha
   - Selecione o perfil (Employee/Manager/Admin)

3. **Editar Usuário**
   - Clique no usuário desejado
   - Modifique dados necessários
   - Altere perfil se necessário

4. **Reset de Senhas em Massa**
   - Clique em "Reset de Senhas"
   - Defina nova senha padrão
   - Selecione usuários (ou todos)
   - Confirme a operação

5. **Desativar Usuário**
   - Clique em "Desativar"
   - O usuário não conseguirá mais fazer login

## 💡 Dicas e Truques

### ⚡ Atalhos Úteis
- **Ctrl + /**: Busca rápida no sistema
- **Esc**: Fechar modais e diálogos
- **Tab**: Navegar entre campos de formulário

### 🎨 Personalização
- **Tema Escuro**: Ideal para uso noturno ou ambientes com pouca luz
- **Tema Claro**: Melhor para ambientes bem iluminados
- **Configurações**: Personalize notificações e preferências

### 📱 Uso Mobile
- O sistema é responsivo e funciona em tablets e smartphones
- Use orientação paisagem para melhor experiência
- Todos os recursos estão disponíveis na versão mobile

### 🔍 Filtros e Busca
- Use filtros para encontrar requisições específicas
- Combine múltiplos filtros para resultados precisos
- Salve filtros frequentes como favoritos

### 📄 PDFs
- PDFs são gerados automaticamente para cada requisição
- Baixe PDFs para arquivo ou impressão
- PDFs contêm todas as informações da requisição

## 🆘 Solução de Problemas

### ❓ Problemas Comuns

#### "Não consigo fazer login"
**Soluções:**
1. Verifique se username e senha estão corretos
2. Certifique-se de que Caps Lock está desligado
3. Limpe cache do navegador
4. Entre em contato com administrador

#### "Página não carrega"
**Soluções:**
1. Atualize a página (F5)
2. Verifique sua conexão com internet
3. Tente outro navegador
4. Limpe cache e cookies

#### "Erro ao criar requisição"
**Soluções:**
1. Verifique se todos os campos obrigatórios estão preenchidos
2. Confirme se KM atual é maior que KM anterior
3. Verifique se fornecedor e veículo estão ativos
4. Tente novamente em alguns minutos

#### "Não vejo botão de aprovação"
**Causa:** Você não tem permissão para aprovar requisições
**Solução:** Entre em contato com administrador para verificar seu perfil

#### "Relatório não gera"
**Soluções:**
1. Verifique se há dados no período selecionado
2. Tente um período menor
3. Aguarde alguns segundos para processamento
4. Atualize a página e tente novamente

### 🔧 Dicas de Performance
- **Feche abas desnecessárias** para melhor performance
- **Use filtros** para reduzir quantidade de dados carregados
- **Atualize a página** se estiver lenta
- **Limpe cache** regularmente

### 📞 Quando Buscar Ajuda
Entre em contato com suporte quando:
- Erro persiste após tentativas de solução
- Precisa de alteração de perfil/permissões
- Dados importantes foram perdidos
- Sistema está inacessível por mais de 30 minutos

## 📚 Recursos Adicionais

### 🎓 Treinamento
- Assista aos vídeos tutoriais (se disponíveis)
- Participe de treinamentos presenciais
- Pratique em ambiente de teste

### 📖 Documentação
- Consulte a documentação técnica para detalhes avançados
- Leia as notas de atualização para novos recursos
- Mantenha-se atualizado com mudanças no sistema

### 💬 Comunidade
- Compartilhe dicas com outros usuários
- Reporte bugs e sugestões
- Participe de grupos de usuários

---

**Lembre-se**: Este manual é um guia geral. Algumas funcionalidades podem variar dependendo da configuração específica do seu sistema e do seu perfil de usuário.

**Última atualização**: Janeiro 2025  
**Versão do Sistema**: 1.0.0