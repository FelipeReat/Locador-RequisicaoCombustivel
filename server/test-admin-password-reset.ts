import 'dotenv/config';
import { db } from './db';
import { DatabaseStorage } from './db-storage';
import { users, auditLog } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function testAdminPasswordReset() {
  console.log('🧪 Iniciando testes de redefinição de senha por administrador...');
  
  const storage = new DatabaseStorage();
  const testAdminUsername = 'test_admin_reset';
  const testUserUsername = 'test_user_reset';
  
  try {
    // 1. Setup: Criar Admin e Usuário de teste
    console.log('📝 Criando usuários de teste...');
    
    // Limpar usuários de teste anteriores se existirem
    const existingAdmin = await storage.getUserByUsername(testAdminUsername);
    if (existingAdmin) await storage.deleteUser(existingAdmin.id);
    
    const existingUser = await storage.getUserByUsername(testUserUsername);
    if (existingUser) await storage.deleteUser(existingUser.id);
    
    const admin = await storage.createUser({
      username: testAdminUsername,
      password: 'OldPassword123',
      fullName: 'Test Admin',
      email: 'admin@test.com',
      role: 'admin',
      position: 'Tester',
      phone: '123456789',
      departmentId: null,
      active: 'true'
    } as any);
    
    const user = await storage.createUser({
      username: testUserUsername,
      password: 'OldPassword123',
      fullName: 'Test User',
      email: 'user@test.com',
      role: 'employee',
      position: 'Tester',
      phone: '123456789',
      departmentId: null,
      active: 'true'
    } as any);
    
    console.log(`✅ Usuários criados: Admin ID ${admin.id}, User ID ${user.id}`);
    
    // 2. Teste: Alterar senha
    const newPassword = 'NewStrongPassword123!';
    console.log(`🔄 Tentando alterar senha do usuário ${user.id} pelo admin ${admin.id}...`);
    
    const success = await storage.adminSetPassword(user.id, newPassword, admin.id);
    
    if (!success) {
      throw new Error('❌ Falha ao alterar senha.');
    }
    console.log('✅ Função adminSetPassword retornou sucesso.');
    
    // 3. Verificação: Senha alterada
    const updatedUser = await storage.getUser(user.id);
    if (!updatedUser) throw new Error('❌ Usuário não encontrado após atualização.');
    
    const isMatch = await bcrypt.compare(newPassword, updatedUser.password);
    if (isMatch) {
      console.log('✅ Senha verificada com sucesso (hash corresponde).');
    } else {
      throw new Error('❌ Senha atualizada não corresponde ao hash.');
    }
    
    // 4. Verificação: Log de Auditoria
    console.log('🔍 Verificando log de auditoria...');
    const logs = await db.select().from(auditLog)
      .where(eq(auditLog.recordId, user.id.toString()))
      .orderBy(desc(auditLog.timestamp))
      .limit(1);
      
    if (logs.length > 0 && logs[0].userId === admin.id && logs[0].action === 'UPDATE') {
      console.log('✅ Log de auditoria encontrado e correto.');
      console.log(`   Log: ${logs[0].description} (Admin: ${logs[0].userId})`);
    } else {
      console.log('Logs encontrados:', logs);
      throw new Error('❌ Log de auditoria não encontrado ou incorreto.');
    }
    
    // 5. Cleanup
    console.log('🧹 Limpando dados de teste...');
    await storage.deleteUser(admin.id);
    await storage.deleteUser(user.id);
    
    console.log('🎉 Todos os testes passaram com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
    process.exit(1);
  }
}

testAdminPasswordReset();
