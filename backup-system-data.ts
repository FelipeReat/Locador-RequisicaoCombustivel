
import 'dotenv/config';
import { db } from './server/db';
import { users, vehicles, suppliers, companies } from './shared/schema';

async function backupSystemData() {
  console.log('📦 Criando backup completo dos dados do sistema...');

  try {
    // Buscar todos os dados atuais
    const allUsers = await db.select().from(users);
    const allVehicles = await db.select().from(vehicles);
    const allSuppliers = await db.select().from(suppliers);
    const allCompanies = await db.select().from(companies);

    console.log('\n📊 Dados encontrados no sistema:');
    console.log(`- ${allUsers.length} usuários`);
    console.log(`- ${allVehicles.length} veículos`);
    console.log(`- ${allSuppliers.length} fornecedores`);
    console.log(`- ${allCompanies.length} empresas`);

    // Criar backup em JSON para referência futura
    const backupData = {
      timestamp: new Date().toISOString(),
      users: allUsers.map(user => ({
        ...user,
        password: '***PROTECTED***' // Mascarar senhas no backup
      })),
      vehicles: allVehicles,
      suppliers: allSuppliers,
      companies: allCompanies
    };

    // Salvar backup em arquivo
    const fs = require('fs');
    const backupFileName = `system-backup-${new Date().toISOString().slice(0, 10)}.json`;
    fs.writeFileSync(backupFileName, JSON.stringify(backupData, null, 2));

    console.log(`\n💾 Backup salvo em: ${backupFileName}`);
    
    console.log('\n✅ Todos os dados estão seguros no banco de dados!');
    console.log('\n🔒 Dados sensíveis do código serão removidos agora...');

    console.log('\n👥 Usuários no sistema:');
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.fullName} (${user.username}) - ${user.role} - ${user.position}`);
    });

    console.log('\n🚗 Veículos na frota:');
    allVehicles.forEach((vehicle, index) => {
      console.log(`${index + 1}. ${vehicle.plate} - ${vehicle.brand} ${vehicle.model} (${vehicle.year}) - ${vehicle.fuelType}`);
    });

    console.log('\n🏪 Fornecedores cadastrados:');
    allSuppliers.forEach((supplier, index) => {
      console.log(`${index + 1}. ${supplier.fantasia} - ${supplier.cnpj} - ${supplier.responsavel}`);
    });

    console.log('\n🏢 Empresas cadastradas:');
    allCompanies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name} - ${company.cnpj} - ${company.contact}`);
    });

    console.log('\n🎉 Backup completo realizado com sucesso!');
    console.log('📋 Todos os dados estão preservados no banco de dados.');

  } catch (error) {
    console.error('❌ Erro ao criar backup:', error);
    throw error;
  }
}

// Executar automaticamente
backupSystemData()
  .then(() => {
    console.log('\n🔄 Próximo passo: Limpar dados sensíveis do código...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Falha no backup:', error);
    process.exit(1);
  });
