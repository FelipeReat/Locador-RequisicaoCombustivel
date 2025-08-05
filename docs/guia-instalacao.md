# Guia de Instalação e Configuração

Este guia fornece instruções detalhadas para instalar, configurar e executar o Sistema de Controle de Abastecimento.

## 📋 Pré-requisitos

### Software Necessário
- **Node.js**: versão 18.0 ou superior
- **npm**: versão 8.0 ou superior (incluído com Node.js)
- **Git**: para clonagem do repositório
- **Navegador moderno**: Chrome, Firefox, Safari ou Edge

### Serviços Externos
- **Neon Database**: Conta gratuita ou paga para PostgreSQL serverless
- **Replit** (opcional): Para deploy em ambiente cloud

## 🚀 Instalação

### 1. Clonagem do Repositório
```bash
git clone <url-do-repositorio>
cd Locador-RequisicaoCombustivel
```

### 2. Instalação de Dependências
```bash
npm install
```

### 3. Configuração do Banco de Dados

#### 3.1 Criar Conta no Neon Database
1. Acesse [neon.tech](https://neon.tech)
2. Crie uma conta gratuita
3. Crie um novo projeto
4. Copie a string de conexão PostgreSQL

#### 3.2 Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto:

```env
# Banco de Dados
DATABASE_URL=postgresql://username:password@host/database?sslmode=require

# Ambiente
NODE_ENV=development

# Porta do Servidor
PORT=5000
```

**Exemplo de DATABASE_URL:**
```
DATABASE_URL=postgresql://user:pass@ep-example-123456.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### 4. Configuração do Banco de Dados

#### 4.1 Aplicar Schema
```bash
npm run db:push
```

Este comando irá:
- Criar todas as tabelas necessárias
- Aplicar as constraints e índices
- Configurar a estrutura inicial

#### 4.2 Dados Iniciais (Opcional)
O sistema criará automaticamente um usuário admin na primeira execução:
- **Username**: admin
- **Senha**: admin123

## 🏃‍♂️ Execução

### Desenvolvimento
```bash
npm run dev
```

O sistema estará disponível em: `http://localhost:5000`

### Produção
```bash
# Build do projeto
npm run build

# Execução em produção
npm start
```

## 🔧 Configuração Avançada

### 1. Configuração de CORS (se necessário)
Se você precisar configurar CORS para acesso de outros domínios, edite o arquivo `server/index.ts`:

```typescript
import cors from 'cors';

app.use(cors({
  origin: ['http://localhost:3000', 'https://seu-dominio.com'],
  credentials: true
}));
```

### 2. Configuração de Sessão
Para ambiente de produção, configure uma chave secreta para sessões no `.env`:

```env
SESSION_SECRET=sua-chave-secreta-muito-segura-aqui
```

### 3. Configuração de Upload (futuro)
Para funcionalidades de upload de arquivos, configure:

```env
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  # 10MB
```

## 🐳 Deploy com Docker (Opcional)

### 1. Criar Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

### 2. Criar docker-compose.yml
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    restart: unless-stopped
```

### 3. Executar
```bash
docker-compose up -d
```

## ☁️ Deploy no Replit

### 1. Importar Projeto
1. Acesse [replit.com](https://replit.com)
2. Clique em "Create Repl"
3. Selecione "Import from GitHub"
4. Cole a URL do repositório

### 2. Configurar Secrets
No painel do Replit, adicione as seguintes secrets:
- `DATABASE_URL`: String de conexão do Neon Database
- `NODE_ENV`: production

### 3. Executar
O Replit executará automaticamente o comando `npm run dev`

## 🔒 Configuração de Segurança

### 1. Senhas Seguras
- Altere a senha padrão do admin imediatamente
- Use senhas com pelo menos 8 caracteres
- Implemente política de senhas se necessário

### 2. HTTPS em Produção
Para produção, sempre use HTTPS:
```bash
# Com certificado SSL
npm start --ssl-cert=path/to/cert.pem --ssl-key=path/to/key.pem
```

### 3. Firewall e Rede
- Configure firewall para permitir apenas portas necessárias
- Use proxy reverso (nginx) em produção
- Configure rate limiting se necessário

## 📊 Monitoramento

### 1. Logs
Os logs são exibidos no console. Para produção, configure:

```bash
# Redirecionar logs para arquivo
npm start > app.log 2>&1
```

### 2. Health Check
Endpoint disponível em: `GET /api/health`

### 3. Métricas
- Monitor de CPU e memória
- Logs de erro automáticos
- Tempo de resposta das APIs

## 🛠️ Manutenção

### 1. Backup do Banco
```bash
# Backup automático (configure cron job)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### 2. Atualizações
```bash
# Atualizar dependências
npm update

# Verificar vulnerabilidades
npm audit

# Corrigir vulnerabilidades
npm audit fix
```

### 3. Limpeza de Dados
Use as funcionalidades de limpeza no painel admin:
- Limpeza de requisições antigas
- Limpeza de veículos inativos
- Limpeza de fornecedores inativos

## 🐛 Solução de Problemas

### Problema: Erro de Conexão com Banco
**Solução:**
1. Verifique se a DATABASE_URL está correta
2. Confirme se o Neon Database está ativo
3. Teste a conexão manualmente

### Problema: Porta já em Uso
**Solução:**
```bash
# Encontrar processo usando a porta
lsof -i :5000

# Matar processo
kill -9 <PID>

# Ou usar porta diferente
PORT=3000 npm run dev
```

### Problema: Erro de Permissão
**Solução:**
```bash
# Limpar cache npm
npm cache clean --force

# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

### Problema: Build Falha
**Solução:**
1. Verifique se todas as dependências estão instaladas
2. Execute verificação de tipos: `npm run check`
3. Limpe cache e reinstale dependências

## 📞 Suporte

### Logs Úteis
```bash
# Ver logs em tempo real
tail -f app.log

# Verificar status do sistema
npm run check

# Testar conexão com banco
npm run db:push
```

### Comandos de Diagnóstico
```bash
# Verificar versões
node --version
npm --version

# Verificar dependências
npm list

# Verificar configuração
npm config list
```

### Contato
Para suporte técnico:
1. Verifique os logs de erro
2. Consulte esta documentação
3. Entre em contato com a equipe de desenvolvimento

---

**Nota**: Este guia assume conhecimento básico de linha de comando e desenvolvimento web. Para usuários iniciantes, recomenda-se buscar ajuda de um desenvolvedor experiente.