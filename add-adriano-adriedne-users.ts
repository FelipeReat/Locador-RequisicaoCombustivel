
import 'dotenv/config';
import { db } from './server/db';
import { users } from './shared/schema';

async function addNewUsers() {
  console.log('🔄 Adicionando novos usuários...');

  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const newUsers = [
      {
        username: "adriano.azevedo",
        password: "blomaq123",
        email: null,
        fullName: "Adriano Azevedo Paiva",
        departmentId: null,
        phone: null,
        position: "Almoxarifado",
        role: "employee",
        active: "true",
        hireDate: yesterday.toISOString(),
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
      {
        username: "adriedne.progenio",
        password: "blomaq123",
        email: "aprogenio@blomaq.com.br",
        fullName: "Adriedne Progenio da Mota",
        departmentId: null,
        phone: "(92) 99286-7316",
        position: "Assistente Operacional",
        role: "employee",
        active: "true",
        hireDate: yesterday.toISOString(),
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
    ];

    await db.insert(users).values(newUsers);

    console.log('✅ Usuários adicionados com sucesso!');
    console.log('\n👥 Usuários criados:');
    console.log('1. Adriano Azevedo Paiva (adriano.azevedo) - Almoxarifado');
    console.log('2. Adriedne Progenio da Mota (adriedne.progenio) - Assistente Operacional');
    
    console.log('\n🔑 Credenciais de acesso:');
    console.log('Adriano: adriano.azevedo / blomaq123');
    console.log('Adriedne: adriedne.progenio / blomaq123');

    console.log('\n📋 Ambos os usuários têm função de "employee" no sistema.');

  } catch (error) {
    console.error('❌ Erro ao adicionar usuários:', error);
    
    if (error instanceof Error && error.message.includes('duplicate key')) {
      console.error('⚠️  Um ou mais usuários já existem no banco de dados.');
    }
    
    throw error;
  }
}

// Executar automaticamente
addNewUsers()
  .then(() => {
    console.log('🎉 Processo concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Falha no processo:', error);
    process.exit(1);
  });
