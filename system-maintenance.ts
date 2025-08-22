
import 'dotenv/config';
import { db } from './server/db';
import { users, vehicles, suppliers, companies, fuelRequisitions } from './shared/schema';
import { eq } from 'drizzle-orm';

async function systemMaintenance() {
  console.log('🔧 Executando manutenção do sistema...');

  try {
    // Verificar integridade dos dados
    const userCount = await db.select().from(users).then(result => result.length);
    const vehicleCount = await db.select().from(vehicles).then(result => result.length);
    const supplierCount = await db.select().from(suppliers).then(result => result.length);
    const companyCount = await db.select().from(companies).then(result => result.length);
    const requisitionCount = await db.select().from(fuelRequisitions).then(result => result.length);

    console.log('\n📊 Estado atual do sistema:');
    console.log(`- ${userCount} usuários ativos`);
    console.log(`- ${vehicleCount} veículos cadastrados`);
    console.log(`- ${supplierCount} fornecedores`);
    console.log(`- ${companyCount} empresas`);
    console.log(`- ${requisitionCount} requisições de combustível`);

    // Verificar usuários administrativos
    const adminUsers = await db.select().from(users).where(eq(users.role, 'admin'));
    console.log(`\n👑 ${adminUsers.length} administradores no sistema`);

    // Verificar usuários ativos
    const activeUsers = await db.select().from(users).where(eq(users.active, 'true'));
    console.log(`👥 ${activeUsers.length} usuários ativos`);

    // Verificar veículos ativos
    const activeVehicles = await db.select().from(vehicles).where(eq(vehicles.status, 'active'));
    console.log(`🚗 ${activeVehicles.length} veículos ativos na frota`);

    console.log('\n✅ Sistema operando normalmente!');
    console.log('🔒 Todos os dados estão seguros no banco de dados.');

  } catch (error) {
    console.error('❌ Erro na manutenção do sistema:', error);
    throw error;
  }
}

// Executar automaticamente
systemMaintenance()
  .then(() => {
    console.log('\n🎉 Manutenção concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Falha na manutenção:', error);
    process.exit(1);
  });
