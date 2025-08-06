import 'dotenv/config';
import { DatabaseStorage } from './db-storage';

async function testVehicleStatusUpdate() {
  const storage = new DatabaseStorage();
  
  try {
    console.log('🔍 Testando atualizações de status de veículos...\n');
    
    // Busca todos os veículos
    const vehicles = await storage.getVehicles();
    console.log(`📋 Total de veículos encontrados: ${vehicles.length}\n`);
    
    if (vehicles.length === 0) {
      console.log('❌ Nenhum veículo encontrado para testar');
      return;
    }
    
    // Pega o primeiro veículo para teste
    const testVehicle = vehicles[0];
    console.log(`🚗 Testando com veículo: ${testVehicle.plate} (ID: ${testVehicle.id})`);
    console.log(`📊 Status atual: ${testVehicle.status}\n`);
    
    // Determina novo status para teste
    const newStatus = testVehicle.status === 'active' ? 'maintenance' : 'active';
    console.log(`🔄 Alterando status para: ${newStatus}`);
    
    // Atualiza o status
    const updatedVehicle = await storage.updateVehicleStatus(testVehicle.id, newStatus);
    
    if (updatedVehicle) {
      console.log(`✅ Status atualizado com sucesso!`);
      console.log(`📊 Novo status: ${updatedVehicle.status}`);
      console.log(`🕒 Atualizado em: ${updatedVehicle.updatedAt}\n`);
      
      // Verifica se a mudança foi persistida
      const vehicleFromDb = await storage.getVehicle(testVehicle.id);
      if (vehicleFromDb && vehicleFromDb.status === newStatus) {
        console.log('✅ Mudança confirmada no banco de dados!');
      } else {
        console.log('❌ Erro: Mudança não foi persistida no banco de dados');
      }
    } else {
      console.log('❌ Erro ao atualizar status do veículo');
    }
    
    // Lista status de todos os veículos
    console.log('\n📋 Status atual de todos os veículos:');
    const allVehicles = await storage.getVehicles();
    allVehicles.forEach(vehicle => {
      console.log(`  ${vehicle.plate} (${vehicle.brand} ${vehicle.model}): ${vehicle.status}`);
    });
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testVehicleStatusUpdate();