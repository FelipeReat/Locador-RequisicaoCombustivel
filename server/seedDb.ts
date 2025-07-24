import { db } from './db';
import { users, vehicles, suppliers, fuelRequisitions, departments } from '../shared/schema';

/**
 * Script para popular o banco de dados com dados iniciais.
 * Este script pode ser executado após a inicialização do banco de dados para adicionar dados de exemplo.
 */
async function seedDatabase() {
  console.log('Iniciando população do banco de dados com dados iniciais...');

  try {
    // Verifica se já existem dados no banco
    const existingUsers = await db.select().from(users);
    if (existingUsers.length > 0) {
      console.log('O banco de dados já contém dados. Pulando a população inicial.');
      return;
    }

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Adiciona departamentos de exemplo
    console.log('Adicionando departamentos...');
    await db.insert(departments).values([
      {
        name: "Administrativo",
        description: "Departamento responsável pela administração geral",
        active: "true",
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
      {
        name: "Operacional",
        description: "Departamento responsável pelas operações de campo",
        active: "true",
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
      {
        name: "Financeiro",
        description: "Departamento responsável pelas finanças da empresa",
        active: "true",
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
      {
        name: "Recursos Humanos",
        description: "Departamento responsável pela gestão de pessoas",
        active: "true",
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
      {
        name: "TI",
        description: "Departamento responsável pela tecnologia da informação",
        active: "true",
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
    ]);

    // Adiciona fornecedores de exemplo
    console.log('Adicionando fornecedores...');
    await db.insert(suppliers).values([
      {
        name: "Posto Ipiranga Centro",
        cnpj: "12.345.678/0001-90",
        responsavel: "João Silva",
        active: "true",
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
      {
        name: "Posto Shell Zona Sul",
        cnpj: "98.765.432/0001-10",
        responsavel: "Maria Santos",
        active: "true",
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
    ]);

    // Adiciona usuários de exemplo
    console.log('Adicionando usuários...');
    await db.insert(users).values([
      {
        username: "joao.silva",
        password: "123456",
        email: "joao.silva@empresa.com",
        fullName: "João Silva",
        departmentId: 1,
        phone: "(11) 99999-9999",
        position: "Gerente de Operações",
        role: "admin",
        active: "true",
        hireDate: yesterday.toISOString(),
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
      {
        username: "alexandre.santos",
        password: "123456",
        email: "alexandre.santos@empresa.com",
        fullName: "Alexandre Santos",
        departmentId: 1,
        phone: "(11) 98888-8888",
        position: "Coordenador de Logística",
        role: "manager",
        active: "true",
        hireDate: yesterday.toISOString(),
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
      {
        username: "breno.oliveira",
        password: "123456",
        email: "breno.oliveira@empresa.com",
        fullName: "Breno Oliveira",
        departmentId: 2,
        phone: "(11) 97777-7777",
        position: "Técnico de Manutenção",
        role: "employee",
        active: "true",
        hireDate: yesterday.toISOString(),
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
    ]);

    // Adiciona veículos de exemplo
    console.log('Adicionando veículos...');
    await db.insert(vehicles).values([
      {
        plate: "ABC1234",
        model: "Gol",
        brand: "Volkswagen",
        year: 2020,
        fuelType: "gasolina",
        mileage: "15000",
        status: "active",
        lastMaintenance: yesterday.toISOString(),
        nextMaintenance: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
      {
        plate: "DEF5678",
        model: "Hilux",
        brand: "Toyota",
        year: 2021,
        fuelType: "diesel",
        mileage: "25000",
        status: "active",
        lastMaintenance: yesterday.toISOString(),
        nextMaintenance: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
      {
        plate: "GHI9012",
        model: "Onix",
        brand: "Chevrolet",
        year: 2022,
        fuelType: "etanol",
        mileage: "5000",
        status: "active",
        lastMaintenance: yesterday.toISOString(),
        nextMaintenance: new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
    ]);

    // Adiciona requisições de combustível de exemplo
    console.log('Adicionando requisições de combustível...');
    await db.insert(fuelRequisitions).values([
      {
        requesterId: 1,
        supplierId: 1,
        client: "Empresa A",
        vehicleId: 1,
        kmAtual: "15500",
        kmAnterior: "15000",
        kmRodado: "500",
        tanqueCheio: "true",
        fuelType: "gasolina",
        quantity: "50",
        justification: "Abastecimento para viagem a cliente",
        requiredDate: now.toISOString(),
        priority: "alta",
        status: "approved",
        approverId: 2,
        approvedDate: now.toISOString(),
        createdAt: yesterday.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        requesterId: 3,
        supplierId: 2,
        client: "Empresa B",
        vehicleId: 2,
        kmAtual: "25500",
        kmAnterior: "25000",
        kmRodado: "500",
        tanqueCheio: "false",
        fuelType: "diesel",
        quantity: "80",
        justification: "Abastecimento para entrega de materiais",
        requiredDate: now.toISOString(),
        priority: "media",
        status: "pending",
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    ]);

    console.log('Dados iniciais adicionados com sucesso!');
  } catch (error) {
    console.error('Erro ao adicionar dados iniciais:', error);
    throw error;
  }
}

// Executa a função de população se este arquivo for executado diretamente
// Em módulos ES, não existe require.main === module, então usamos uma abordagem diferente
// Verificamos se o arquivo está sendo executado diretamente usando import.meta.url
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  seedDatabase()
    .then(() => {
      console.log('Processo de população concluído!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Erro no processo de população:', error);
      process.exit(1);
    });
}

export { seedDatabase };