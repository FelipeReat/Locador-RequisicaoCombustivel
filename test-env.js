import dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

// Imprime a variável DATABASE_URL para verificar se foi carregada corretamente
console.log('DATABASE_URL:', process.env.DATABASE_URL);