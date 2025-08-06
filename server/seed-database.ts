import 'dotenv/config';
import { db } from './db';
import { users, suppliers, companies, vehicles, fuelRequisitions } from '../shared/schema';

async function seedDatabase() {
  console.log('🌱 Iniciando população completa do banco de dados...');

  try {
    // Limpar dados existentes
    console.log('🗑️ Removendo dados existentes...');
    await db.delete(fuelRequisitions);
    await db.delete(vehicles);
    await db.delete(users);
    await db.delete(suppliers);
    await db.delete(companies);
    console.log('🗑️ Dados existentes removidos');

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Inserir fornecedores
    const sampleSuppliers = [
      {
        name: "TRANSDIESEL COMERCIO DE DERIVADOS DE PETROLEO LTDA",
        fantasia: "TRANSDIESEL",
        cnpj: "18.001.964/0001-10",
        responsavel: "CARLOS",
        email: null,
        phone: "(92) 3233-0634",
        address: "RUA DAS FLORES, 123",
        active: "true",
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
      {
        name: "D DA C SAMPAIO COMERCIO DE COMBUSTIVEIS LTDA",
        fantasia: "POSTO NOVO ALEIXO",
        cnpj: "10.272.444/0001-59",
        responsavel: "CARLOS",
        email: null,
        phone: "(92) 9883-8218",
        address: "AV. NOVO ALEIXO, 456",
        active: "true",
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
      {
        name: "A L X COMERCIO DE COMBUSTIVEIS LTDA",
        fantasia: "POSTO NOSSA SENHORA APARECIDA",
        cnpj: "13.191.900/0002-96",
        responsavel: "NILDA",
        email: null,
        phone: "(92) 98838-2180",
        address: "RUA NOSSA SENHORA APARECIDA, 789",
        active: "true",
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
    ];

    await db.insert(suppliers).values(sampleSuppliers);
    console.log('🏪 Fornecedores inseridos');

    // Inserir empresas
    const sampleCompanies = [
      {
        name: "BBM Serviços",
        cnpj: "13.844.973/0001-59",
        fullName: "BBM Serviços, Aluguel de Máquinas e Tecnologia LTDA",
        contact: "Bruno Rodrigues Derzi",
        phone: "(92) 3233-0634",
        email: "bruno.derzi@blomaq.com.br",
        active: "true",
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
      {
        name: "J.B Andaimes",
        cnpj: "09.518.795/0001-07",
        fullName: "J. B. ANDAIMES - LOCADORA DE EQUIPAMENTOS PARA CONSTRUCAO CIVIL LTDA",
        contact: "Bruno Rodrigues Derzi",
        phone: "(92) 3233-0634",
        email: "bruno.derzi@blomaq.com.br",
        active: "true",
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
    ];

    await db.insert(companies).values(sampleCompanies);
    console.log('🏢 Empresas inseridas');

    // Inserir usuários completos
    const sampleUsers = [
      {
        username: "admin",
        password: "admin123",
        email: "admin@blomaq.com.br",
        fullName: "Administrador do Sistema",
        departmentId: null,
        phone: "(11) 99999-9999",
        position: "Administrador",
        role: "admin",
        active: "true",
        hireDate: null,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
      {
        username: "alexandre.serrao",
        password: "blomaq123",
        email: "apaiva@blomaq.com.br",
        fullName: "Alexandre Serrão de Souza",
        departmentId: null,
        phone: "(92) 99460-3483",
        position: "Almoxarifado",
        role: "manager",
        active: "true",
        hireDate: yesterday.toISOString(),
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
      {
        username: "breno.derzi",
        password: "blomaq123",
        email: "breno.derzi@blomaq.com.br",
        fullName: "Wenderson Breno Grante Souza",
        departmentId: 2,
        phone: "(92) 99283-3418",
        position: "Coordenador Operacional",
        role: "manager",
        active: "true",
        hireDate: yesterday.toISOString(),
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
      {
        username: "bruno.derzi",
        password: "blomaq123",
        email: "bruno.derzi@blomaq.com.br",
        fullName: "Bruno Rodrigues Derzi",
        departmentId: 3,
        phone: "(92) 99284-3060",
        position: "Diretor Executivo",
        role: "admin",
        active: "true",
        hireDate: yesterday.toISOString(),
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
      {
        username: "david.medeiros",
        password: "blomaq123",
        email: "david.medeiros@blomaq.com.br",
        fullName: "David Medeiros de Souza",
        departmentId: 5,
        phone: "(92) 99183-5073",
        position: "Analista Operacional",
        role: "employee",
        active: "true",
        hireDate: yesterday.toISOString(),
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
      {
        username: "wesley.fernandes",
        password: "blomaq123",
        email: "wfernandes@blomaq.com.br",
        fullName: "Wesley Fernandes da Gama",
        departmentId: 1,
        phone: "(92) 99199-4477",
        position: "Supervisor Operacional",
        role: "employee",
        active: "true",
        hireDate: yesterday.toISOString(),
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
      {
        username: "rafael.dourado",
        password: "blomaq123",
        email: "rdourado@blomaq.com.br",
        fullName: "Rafael da Anunciação Dourado",
        departmentId: 1,
        phone: "(92) 92412-385",
        position: "Almoxarifado",
        role: "manager",
        active: "true",
        hireDate: yesterday.toISOString(),
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
    ];

    await db.insert(users).values(sampleUsers);
    console.log('👥 Usuários inseridos');

    // Inserir todos os veículos do storage.ts
    const sampleVehicles = [
      // Primeira imagem
      { plate: "OAE-8506", model: "HONDA CG 125 CARGO KS", brand: "Honda", year: 2020, fuelType: "gasolina", mileage: "0", status: "active", lastMaintenance: null, nextMaintenance: null, createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { plate: "QZQ-1B85", model: "HONDA CG 160 CARGO", brand: "Honda", year: 2021, fuelType: "gasolina", mileage: "0", status: "active", lastMaintenance: null, nextMaintenance: null, createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { plate: "QZQ-1B75", model: "HONDA CG 160 CARGO", brand: "Honda", year: 2021, fuelType: "gasolina", mileage: "0", status: "active", lastMaintenance: null, nextMaintenance: null, createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { plate: "TAC-7I79", model: "HONDA/CG 160 CARGO", brand: "Honda", year: 2020, fuelType: "gasolina", mileage: "0", status: "active", lastMaintenance: null, nextMaintenance: null, createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { plate: "QZW-9C01", model: "HYUNDAI HB20S", brand: "Hyundai", year: 2018, fuelType: "gasolina", mileage: "0", status: "active", lastMaintenance: null, nextMaintenance: null, createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { plate: "QZR-0E86", model: "HYUNDAI HD 80", brand: "Hyundai", year: 2019, fuelType: "diesel", mileage: "0", status: "active", lastMaintenance: null, nextMaintenance: null, createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { plate: "QZJ-6D66", model: "HYUNDAI HD 80", brand: "Hyundai", year: 2019, fuelType: "diesel", mileage: "0", status: "active", lastMaintenance: null, nextMaintenance: null, createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { plate: "OAK-2560", model: "HYUNDAI HR HD", brand: "Hyundai", year: 2017, fuelType: "diesel", mileage: "0", status: "active", lastMaintenance: null, nextMaintenance: null, createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { plate: "QZL-5G28", model: "HYUNDAI HR HDB", brand: "Hyundai", year: 2018, fuelType: "diesel", mileage: "0", status: "active", lastMaintenance: null, nextMaintenance: null, createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { plate: "TAC-7I87", model: "HYUNDAI/HR HBD 4WD", brand: "Hyundai", year: 2020, fuelType: "diesel", mileage: "0", status: "active", lastMaintenance: null, nextMaintenance: null, createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { plate: "TSC-5I44", model: "JEEP", brand: "Jeep", year: 2015, fuelType: "gasolina", mileage: "0", status: "active", lastMaintenance: null, nextMaintenance: null, createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { plate: "QZX-2I14", model: "JEEP COMMANDER", brand: "Jeep", year: 2016, fuelType: "gasolina", mileage: "0", status: "active", lastMaintenance: null, nextMaintenance: null, createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { plate: "NA0-0002", model: "NÃO APLICÁVEL", brand: "Diversos", year: 2020, fuelType: "diesel", mileage: "0", status: "inactive", lastMaintenance: null, nextMaintenance: null, createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { plate: "QZA-9A00", model: "NISSAN FRONTIER", brand: "Nissan", year: 2018, fuelType: "diesel", mileage: "0", status: "active", lastMaintenance: null, nextMaintenance: null, createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { plate: "33RTS", model: "PEMT TESOURA DIESEL JLG 33RTS 13M", brand: "JLG", year: 2015, fuelType: "diesel", mileage: "0", status: "maintenance", lastMaintenance: null, nextMaintenance: null, createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { plate: "TAE-3I55", model: "POLO", brand: "Volkswagen", year: 2019, fuelType: "gasolina", mileage: "0", status: "active", lastMaintenance: null, nextMaintenance: null, createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },

      // Segunda imagem
      { plate: "NOY-8355", model: "RENAULT SANDERO", brand: "Renault", year: 2017, fuelType: "gasolina", mileage: "0", status: "active", lastMaintenance: null, nextMaintenance: null, createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { plate: "QZT-2D80", model: "SAVEIRO", brand: "Volkswagen", year: 2020, fuelType: "gasolina", mileage: "0", status: "active", lastMaintenance: null, nextMaintenance: null, createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { plate: "STZ-3H82", model: "T-CROSS", brand: "Volkswagen", year: 2021, fuelType: "gasolina", mileage: "0", status: "active", lastMaintenance: null, nextMaintenance: null, createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { plate: "QZY-9J96", model: "TOYOTA COROLLA XEI 2.0", brand: "Toyota", year: 2018, fuelType: "gasolina", mileage: "0", status: "active", lastMaintenance: null, nextMaintenance: null, createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { plate: "QZN-7A75", model: "VW NIVUS", brand: "Volkswagen", year: 2021, fuelType: "gasolina", mileage: "0", status: "active", lastMaintenance: null, nextMaintenance: null, createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { plate: "QZK-7H62", model: "VW NIVUS", brand: "Volkswagen", year: 2021, fuelType: "gasolina", mileage: "0", status: "active", lastMaintenance: null, nextMaintenance: null, createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { plate: "QZP-9B52", model: "VW NIVUS", brand: "Volkswagen", year: 2021, fuelType: "gasolina", mileage: "0", status: "active", lastMaintenance: null, nextMaintenance: null, createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { plate: "TAC-9D81", model: "VW POLO", brand: "Volkswagen", year: 2019, fuelType: "gasolina", mileage: "0", status: "active", lastMaintenance: null, nextMaintenance: null, createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { plate: "QZF-7E10", model: "VW POLO TRACK", brand: "Volkswagen", year: 2020, fuelType: "gasolina", mileage: "0", status: "active", lastMaintenance: null, nextMaintenance: null, createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { plate: "QZO-0B20", model: "VW SAVEIRO", brand: "Volkswagen", year: 2020, fuelType: "gasolina", mileage: "0", status: "active", lastMaintenance: null, nextMaintenance: null, createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { plate: "QZK-9I70", model: "VW VIRTUS", brand: "Volkswagen", year: 2021, fuelType: "gasolina", mileage: "0", status: "active", lastMaintenance: null, nextMaintenance: null, createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { plate: "QZF-9I38", model: "VW/GOL 1.0L MC4", brand: "Volkswagen", year: 2016, fuelType: "gasolina", mileage: "0", status: "active", lastMaintenance: null, nextMaintenance: null, createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { plate: "TAA-6I29", model: "VW/SAVEIRO CS RB MF", brand: "Volkswagen", year: 2019, fuelType: "gasolina", mileage: "0", status: "active", lastMaintenance: null, nextMaintenance: null, createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },

      // Terceira imagem - veículos adicionais
      { plate: "QZV-8J59", model: "CHEVROLET MONTANA", brand: "Chevrolet", year: 2018, fuelType: "gasolina", mileage: "0", status: "active", lastMaintenance: null, nextMaintenance: null, createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { plate: "SHO-1C26", model: "CHEVROLET TRACKER", brand: "Chevrolet", year: 2019, fuelType: "gasolina", mileage: "0", status: "active", lastMaintenance: null, nextMaintenance: null, createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { plate: "QZV-8C10", model: "FIAT FASTBACK", brand: "Fiat", year: 2022, fuelType: "gasolina", mileage: "0", status: "active", lastMaintenance: null, nextMaintenance: null, createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { plate: "STL-9J75", model: "FIAT MOBI", brand: "Fiat", year: 2020, fuelType: "gasolina", mileage: "0", status: "active", lastMaintenance: null, nextMaintenance: null, createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { plate: "QZD-3F61", model: "FIAT STRADA", brand: "Fiat", year: 2021, fuelType: "gasolina", mileage: "0", status: "active", lastMaintenance: null, nextMaintenance: null, createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { plate: "RUJ-7D62", model: "FIAT STRADA", brand: "Fiat", year: 2021, fuelType: "gasolina", mileage: "0", status: "active", lastMaintenance: null, nextMaintenance: null, createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { plate: "RUJ-7D54", model: "FIAT STRADA", brand: "Fiat", year: 2021, fuelType: "gasolina", mileage: "0", status: "active", lastMaintenance: null, nextMaintenance: null, createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { plate: "PHX-9G24", model: "FIAT TORO", brand: "Fiat", year: 2020, fuelType: "diesel", mileage: "0", status: "active", lastMaintenance: null, nextMaintenance: null, createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { plate: "QZU-4A71", model: "FIAT TORO", brand: "Fiat", year: 2020, fuelType: "diesel", mileage: "0", status: "active", lastMaintenance: null, nextMaintenance: null, createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { plate: "PHZ-5D93", model: "FORD KA", brand: "Ford", year: 2018, fuelType: "gasolina", mileage: "0", status: "active", lastMaintenance: null, nextMaintenance: null, createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { plate: "PHZ-5D63", model: "FORD KA", brand: "Ford", year: 2018, fuelType: "gasolina", mileage: "0", status: "active", lastMaintenance: null, nextMaintenance: null, createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { plate: "TSE-7A86", model: "GEEP RENEGADE", brand: "Jeep", year: 2017, fuelType: "gasolina", mileage: "0", status: "active", lastMaintenance: null, nextMaintenance: null, createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { plate: "NUK-2F38", model: "HONDA CG 125 CARGO ES", brand: "Honda", year: 2020, fuelType: "gasolina", mileage: "0", status: "active", lastMaintenance: null, nextMaintenance: null, createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
    ];

    await db.insert(vehicles).values(sampleVehicles);
    console.log('🚗 Veículos inseridos');

    console.log('✅ Banco de dados populado com sucesso!');

    console.log('\n📋 Dados inseridos:');
    console.log(`- ${sampleUsers.length} usuários`);
    console.log(`- ${sampleSuppliers.length} fornecedores`);
    console.log(`- ${sampleCompanies.length} empresas`);
    console.log(`- ${sampleVehicles.length} veículos`);

    console.log('\n🔑 Credenciais de acesso:');
    console.log('Admin: admin / admin123');
    console.log('Alexandre: alexandre.serrao / blomaq123');
    console.log('Breno: breno.derzi / blomaq123');
    console.log('Bruno: bruno.derzi / blomaq123');
    console.log('David: david.medeiros / blomaq123');
    console.log('Wesley: wesley.fernandes / blomaq123');
    console.log('Rafael: rafael.dourado / blomaq123');

    console.log('🎉 Processo concluído!');

  } catch (error) {
    console.error('❌ Erro ao popular o banco de dados:', error);
    throw error;
  }
}

// Executar automaticamente
seedDatabase();