import { db } from './db';
import { users, vehicles, fuelRequisitions, suppliers, departments } from '../shared/schema';

/**
 * Script para inicializar o banco de dados com as tabelas definidas no esquema.
 * Este script pode ser executado manualmente para criar as tabelas no banco de dados.
 */
async function initializeDatabase() {
  console.log('Iniciando criação das tabelas no banco de dados...');

  try {
    // Cria as tabelas no banco de dados
    const queries = [
      // Tabela de departamentos
      `CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        active TEXT NOT NULL DEFAULT 'true',
        created_at TEXT NOT NULL DEFAULT 'now()',
        updated_at TEXT NOT NULL DEFAULT 'now()'
      )`,

      // Tabela de usuários
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT,
        full_name TEXT,
        department_id INTEGER,
        phone TEXT,
        position TEXT,
        role TEXT NOT NULL DEFAULT 'employee',
        active TEXT NOT NULL DEFAULT 'true',
        hire_date TEXT,
        created_at TEXT NOT NULL DEFAULT 'now()',
        updated_at TEXT NOT NULL DEFAULT 'now()'
      )`,

      // Tabela de veículos
      `CREATE TABLE IF NOT EXISTS vehicles (
        id SERIAL PRIMARY KEY,
        plate TEXT NOT NULL UNIQUE,
        model TEXT NOT NULL,
        brand TEXT NOT NULL,
        year INTEGER NOT NULL,
        fuel_type TEXT NOT NULL,
        mileage DECIMAL DEFAULT '0',
        status TEXT NOT NULL DEFAULT 'active',
        last_maintenance TEXT,
        next_maintenance TEXT,
        created_at TEXT NOT NULL DEFAULT 'now()',
        updated_at TEXT NOT NULL DEFAULT 'now()'
      )`,

      // Tabela de fornecedores
      `CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        cnpj TEXT NOT NULL,
        responsavel TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        active TEXT NOT NULL DEFAULT 'true',
        created_at TEXT NOT NULL DEFAULT 'now()',
        updated_at TEXT NOT NULL DEFAULT 'now()'
      )`,

      // Tabela de requisições de combustível
      `CREATE TABLE IF NOT EXISTS fuel_requisitions (
        id SERIAL PRIMARY KEY,
        requester_id INTEGER NOT NULL,
        supplier_id INTEGER NOT NULL,
        client TEXT NOT NULL,
        vehicle_id INTEGER NOT NULL,
        km_atual TEXT NOT NULL,
        km_anterior TEXT NOT NULL,
        km_rodado TEXT NOT NULL,
        tanque_cheio TEXT NOT NULL DEFAULT 'false',
        fuel_type TEXT NOT NULL,
        quantity TEXT,
        justification TEXT,
        required_date TEXT,
        priority TEXT NOT NULL DEFAULT 'media',
        status TEXT NOT NULL DEFAULT 'pending',
        approver_id INTEGER,
        approved_date TEXT,
        rejection_reason TEXT,
        created_at TEXT NOT NULL DEFAULT 'now()',
        updated_at TEXT NOT NULL DEFAULT 'now()'
      )`
    ];

    // Executa as queries para criar as tabelas
    for (const query of queries) {
      await db.execute(query);
    }

    console.log('Tabelas criadas com sucesso!');
  } catch (error) {
    console.error('Erro ao criar tabelas:', error);
    throw error;
  }
}

// Executa a função de inicialização se este arquivo for executado diretamente
// Em módulos ES, não existe require.main === module, então usamos uma abordagem diferente
// Verificamos se o arquivo está sendo executado diretamente usando import.meta.url
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  initializeDatabase()
    .then(() => {
      console.log('Banco de dados inicializado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Erro ao inicializar banco de dados:', error);
      process.exit(1);
    });
}

export { initializeDatabase };