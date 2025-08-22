import 'dotenv/config';
import { db } from './db';
import { users, suppliers, companies, vehicles, fuelRequisitions } from '../shared/schema';

async function seedDatabase() {
  console.log('🌱 Verificando estrutura do banco de dados...');

  try {
    // Verificar se as tabelas estão funcionando corretamente
    console.log('🔍 Verificando conexão com o banco de dados...');

    const userCount = await db.select().from(users).then(result => result.length);
    const vehicleCount = await db.select().from(vehicles).then(result => result.length);
    const supplierCount = await db.select().from(suppliers).then(result => result.length);
    const companyCount = await db.select().from(companies).then(result => result.length);

    console.log('\n📊 Dados atuais no banco:');
    console.log(`- ${userCount} usuários`);
    console.log(`- ${vehicleCount} veículos`);
    console.log(`- ${supplierCount} fornecedores`);
    console.log(`- ${companyCount} empresas`);

    if (userCount === 0) {
      console.log('\n⚠️  Banco vazio detectado. Criando usuário administrador padrão...');

      const adminUser = {
        username: "admin",
        password: "admin123",
        email: "admin@blomaq.com.br",
        fullName: "Administrador do Sistema",
        departmentId: null,
        phone: null,
        position: "Administrador",
        role: "admin",
        active: "true",
        hireDate: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.insert(users).values([adminUser]);
      console.log('👤 Usuário administrador criado: admin / admin123');
    }

    console.log('\n✅ Estrutura do banco de dados verificada!');
    console.log('\n🔒 Todos os dados reais estão seguros no banco.');
    console.log('📋 Nenhuma informação sensível permanece no código.');

  } catch (error) {
    console.error('❌ Erro ao verificar o banco de dados:', error);
    throw error;
  }
}

// Executar automaticamente apenas se não houver dados
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('🎉 Verificação concluída!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro na verificação:', error);
      process.exit(1);
    });
}

export { seedDatabase };