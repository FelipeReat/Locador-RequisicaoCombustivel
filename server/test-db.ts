import 'dotenv/config';
import { db } from './db';
import { users, suppliers, companies, vehicles } from '../shared/schema';

async function testDatabase() {
  console.log('🔍 Testando conexão com o banco de dados...');

  try {
    // Testar usuários
    const allUsers = await db.select().from(users);
    console.log(`✅ Conexão bem-sucedida! Encontrados ${allUsers.length} usuários no banco.`);
    
    console.log('\n👥 Usuários encontrados:');
    allUsers.forEach(user => {
      console.log(`- ${user.fullName} (${user.username}) - ${user.role}`);
    });

    // Testar fornecedores
    const allSuppliers = await db.select().from(suppliers);
    console.log(`\n🏪 Encontrados ${allSuppliers.length} fornecedores:`);
    allSuppliers.forEach(supplier => {
      console.log(`- ${supplier.fantasia} (${supplier.cnpj})`);
    });

    // Testar empresas
    const allCompanies = await db.select().from(companies);
    console.log(`\n🏢 Encontradas ${allCompanies.length} empresas:`);
    allCompanies.forEach(company => {
      console.log(`- ${company.name} (${company.cnpj})`);
    });

    // Testar veículos
    const allVehicles = await db.select().from(vehicles);
    console.log(`\n🚗 Encontrados ${allVehicles.length} veículos:`);
    
    // Agrupar por marca
    const vehiclesByBrand = allVehicles.reduce((acc, vehicle) => {
      if (!acc[vehicle.brand]) {
        acc[vehicle.brand] = [];
      }
      acc[vehicle.brand].push(vehicle);
      return acc;
    }, {} as Record<string, typeof allVehicles>);

    Object.entries(vehiclesByBrand).forEach(([brand, vehicles]) => {
      console.log(`  ${brand}: ${vehicles.length} veículos`);
      vehicles.slice(0, 3).forEach(vehicle => {
        console.log(`    - ${vehicle.plate} - ${vehicle.model} (${vehicle.year})`);
      });
      if (vehicles.length > 3) {
        console.log(`    ... e mais ${vehicles.length - 3} veículos`);
      }
    });

    console.log('\n📊 Resumo dos dados:');
    console.log(`- Total de usuários: ${allUsers.length}`);
    console.log(`- Total de fornecedores: ${allSuppliers.length}`);
    console.log(`- Total de empresas: ${allCompanies.length}`);
    console.log(`- Total de veículos: ${allVehicles.length}`);

    console.log('\n✅ Todos os dados foram inseridos com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao conectar com o banco de dados:', error);
  }
}

testDatabase();