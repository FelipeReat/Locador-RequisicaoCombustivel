import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { db } from './db';

/**
 * Script para executar migrações do banco de dados.
 * Este script aplica as migrações definidas na pasta 'migrations'.
 */
async function runMigrations() {
  console.log('Iniciando migrações do banco de dados...');

  try {
    // Executa as migrações
    await migrate(db, { migrationsFolder: './migrations' });
    console.log('Migrações aplicadas com sucesso!');
  } catch (error) {
    console.error('Erro ao executar migrações:', error);
    throw error;
  }
}

// Executa a função de migração se este arquivo for executado diretamente
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Processo de migração concluído!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Erro no processo de migração:', error);
      process.exit(1);
    });
}

export { runMigrations };