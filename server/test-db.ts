import 'dotenv/config';
import { db } from './db';
import { users, suppliers, companies, vehicles, type User, type Supplier, type Company, type Vehicle } from '../shared/schema';

async function testDatabase() {
  console.log('🔍 Testando conexão com o banco de dados...');

  try {
    // Testar usuários
    const allUsers: User[] = await db.select().from(users) as unknown as User[];
    console.log(`✅ Conexão bem-sucedida! Encontrados ${allUsers.length} usuários no banco.`);
    
    console.log('\n👥 Usuários encontrados:');
    allUsers.forEach((user: User) => {
      console.log(`- ${user.fullName} (${user.username}) - ${user.role}`);
    });

    // Testar fornecedores
    const allSuppliers: Supplier[] = await db.select().from(suppliers) as unknown as Supplier[];
    console.log(`\n🏪 Encontrados ${allSuppliers.length} fornecedores:`);
    allSuppliers.forEach((supplier: Supplier) => {
      console.log(`- ${supplier.fantasia} (${supplier.cnpj})`);
    });

    // Testar empresas
    const allCompanies: Company[] = await db.select().from(companies) as unknown as Company[];
    console.log(`\n🏢 Encontradas ${allCompanies.length} empresas:`);
    allCompanies.forEach((company: Company) => {
      console.log(`- ${company.name} (${company.cnpj})`);
    });

    // Testar veículos
    const allVehicles: Vehicle[] = await db.select().from(vehicles) as unknown as Vehicle[];
    console.log(`\n🚗 Encontrados ${allVehicles.length} veículos:`);
    
    // Agrupar por marca
    const vehiclesByBrand = allVehicles.reduce((acc: Record<string, Vehicle[]>, vehicle: Vehicle) => {
      if (!acc[vehicle.brand]) {
        acc[vehicle.brand] = [];
      }
      acc[vehicle.brand].push(vehicle);
      return acc;
    }, {} as Record<string, Vehicle[]>);

    Object.entries(vehiclesByBrand).forEach(([brand, vehiclesList]: [string, Vehicle[]]) => {
      console.log(`  ${brand}: ${vehiclesList.length} veículos`);
      vehiclesList.slice(0, 3).forEach((vehicle: Vehicle) => {
        console.log(`    - ${vehicle.plate} - ${vehicle.model} (${vehicle.year})`);
      });
      if (vehiclesList.length > 3) {
        console.log(`    ... e mais ${vehiclesList.length - 3} veículos`);
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
