
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
        username: "daene.lobato",
        password: "blomaq123",
        email: "daene.lobato@blomaq.com.br",
        fullName: "Daene Chaves Lobato",
        departmentId: null,
        phone: "(92) 98527-5909",
        position: "Gerente Operacional",
        role: "manager",
        active: "true",
        hireDate: yesterday.toISOString(),
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
      {
        username: "andrea.luniere",
        password: "blomaq123",
        email: "aluniere@blomaq.com.br",
        fullName: "Andréa Silva Luniére",
        departmentId: null,
        phone: "(92) 99421-3621",
        position: "Supervisora Operacional",
        role: "manager",
        active: "true",
        hireDate: yesterday.toISOString(),
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
    ];

    await db.insert(users).values(newUsers);

    console.log('✅ Usuários adicionados com sucesso!');
    console.log('\n👥 Usuários criados:');
    console.log('1. Daene Chaves Lobato (daene.lobato) - Gerente Operacional');
    console.log('2. Andréa Silva Luniére (andrea.luniere) - Supervisora Operacional');
    
    console.log('\n🔑 Credenciais de acesso:');
    console.log('Daene: daene.lobato / blomaq123');
    console.log('Andrea: andrea.luniere / blomaq123');

    console.log('\n📋 Ambos os usuários têm função de "manager" no sistema.');

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
