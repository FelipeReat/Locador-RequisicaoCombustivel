
const { neon } = require('@neondatabase/serverless');

async function testConnection() {
  try {
    console.log('🔍 Verificando variável DATABASE_URL...');
    
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL não está configurada');
      console.log('📝 Configure a variável DATABASE_URL no painel de Secrets do Replit');
      return;
    }
    
    console.log('✅ DATABASE_URL encontrada');
    console.log('📍 URL:', process.env.DATABASE_URL.substring(0, 30) + '...');
    
    console.log('🔌 Testando conexão com Neon Database...');
    
    const sql = neon(process.env.DATABASE_URL);
    
    // Teste simples de conexão
    const result = await sql`SELECT NOW() as current_time, version() as db_version`;
    
    console.log('🎉 Conexão estabelecida com sucesso!');
    console.log('⏰ Hora do servidor:', result[0].current_time);
    console.log('🗄️ Versão do PostgreSQL:', result[0].db_version.split(' ')[0]);
    
    // Verificar se as tabelas existem
    console.log('\n📋 Verificando estrutura do banco...');
    
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    if (tables.length === 0) {
      console.log('⚠️ Nenhuma tabela encontrada - execute as migrações');
      console.log('🔧 Execute: npm run db:push');
    } else {
      console.log('✅ Tabelas encontradas:');
      tables.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao conectar com o banco:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('🔧 Solução: Verifique se a DATABASE_URL aponta para o Neon Database');
    } else if (error.message.includes('authentication')) {
      console.log('🔧 Solução: Verifique as credenciais do banco de dados');
    } else if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.log('🔧 Solução: Verifique se o banco de dados foi criado no Neon');
    }
  }
}

testConnection();
