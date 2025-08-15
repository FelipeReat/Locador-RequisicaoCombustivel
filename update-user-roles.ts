import 'dotenv/config';
import { db } from './server/db';
import { users } from './shared/schema';
import { eq } from 'drizzle-orm';

async function updateUserRoles() {
  console.log('🔄 Atualizando roles dos usuários...');

  try {
    // Atualizar Alexandre Serrão - de manager para employee
    const alexandreResult = await db
      .update(users)
      .set({ 
        role: "employee",
        updatedAt: new Date().toISOString()
      })
      .where(eq(users.username, "alexandre.serrao"))
      .returning();

    // Atualizar Rafael Dourado - de manager para employee  
    const rafaelResult = await db
      .update(users)
      .set({ 
        role: "employee",
        updatedAt: new Date().toISOString()
      })
      .where(eq(users.username, "rafael.dourado"))
      .returning();

    console.log('✅ Roles atualizados com sucesso!');
    
    if (alexandreResult.length > 0) {
      console.log(`👤 Alexandre Serrão: manager → employee`);
    } else {
      console.log('⚠️  Usuário alexandre.serrao não encontrado');
    }

    if (rafaelResult.length > 0) {
      console.log(`👤 Rafael Dourado: manager → employee`);
    } else {
      console.log('⚠️  Usuário rafael.dourado não encontrado');
    }

    console.log('\n📋 Ambos os usuários agora têm função de "employee" no sistema.');

  } catch (error) {
    console.error('❌ Erro ao atualizar roles:', error);
    throw error;
  }
}

// Executar automaticamente
updateUserRoles()
  .then(() => {
    console.log('🎉 Processo concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Falha no processo:', error);
    process.exit(1);
  });