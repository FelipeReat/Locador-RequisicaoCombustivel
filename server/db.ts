import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import * as schema from '../shared/schema';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

// Verifica se a URL do banco de dados está definida
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL não está definido no ambiente');
}

// Cria o cliente SQL usando a URL do banco de dados
const sql = neon(process.env.DATABASE_URL);

// Cria a instância do Drizzle ORM com o esquema definido
export const db = drizzle(sql, { schema });