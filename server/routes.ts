import type { Express } from "express";
import { createServer, type Server } from "http";
import { DatabaseStorage } from "./db-storage";
import { MemStorage } from "./storage";
import { insertFuelRequisitionSchema, updateFuelRequisitionStatusSchema, updateUserProfileSchema, changePasswordSchema, insertSupplierSchema, insertVehicleSchema, insertUserSchema, insertUserManagementSchema, insertCompanySchema, loginSchema, insertFuelRecordSchema } from "@shared/schema";

// Use database storage for production
const storage = new DatabaseStorage();

// Session management
const userSessions = new Map<string, { userId: number; timestamp: number }>();

const generateSessionId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const getUserFromSession = async (sessionId: string) => {
  const session = userSessions.get(sessionId);
  if (!session) return null;

  // Clean up expired sessions (24 hours)
  if (Date.now() - session.timestamp > 24 * 60 * 60 * 1000) {
    userSessions.delete(sessionId);
    return null;
  }

  return await storage.getUser(session.userId);
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const user = await storage.authenticateUser(validatedData);

      if (!user) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      // Create session for authenticated user
      const sessionId = generateSessionId();
      userSessions.set(sessionId, {
        userId: user.id,
        timestamp: Date.now()
      });

      res.json({ ...user, sessionId });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Usuário não encontrado')) {
          return res.status(401).json({ 
            message: "Usuário não encontrado. Verifique se o nome de usuário está correto.",
            errorType: "USER_NOT_FOUND"
          });
        } else if (error.message.includes('Senha incorreta')) {
          return res.status(401).json({ 
            message: "Senha incorreta. Verifique sua senha e tente novamente.",
            errorType: "INVALID_PASSWORD"
          });
        } else {
          res.status(400).json({ message: error.message });
        }
      } else {
        res.status(500).json({ message: "Erro interno do servidor" });
      }
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      // Check for authentication header or session
      const authHeader = req.headers.authorization;
      const authToken = req.headers['x-auth-token'];

      if (!authHeader && !authToken) {
        return res.status(401).json({ message: "Não autenticado" });
      }

      // In a real implementation, you would validate the token/session
      const user = await storage.getCurrentUser();
      if (!user) {
        return res.status(401).json({ message: "Não autenticado" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar usuário" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      if (sessionId) {
        userSessions.delete(sessionId);
      }
      storage.logoutCurrentUser();
      res.json({ message: "Logout realizado com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao fazer logout" });
    }
  });



  // User routes
  app.get("/api/user/profile", async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      
      if (!sessionId) {
        return res.status(401).json({ message: "Sessão não encontrada" });
      }

      // Tenta buscar da sessão ativa primeiro
      let user = await getUserFromSession(sessionId);
      
      // Se não encontrar na sessão (servidor reiniciado), tenta recuperar baseado no sessionId salvo
      if (!user && sessionId) {
        // Como o servidor reiniciou, vamos procurar o usuário pelos dados de login recentes
        // Vamos permitir que o usuário faça login automaticamente se tiver sessionId válido
        const users = await storage.getUsers();
        
        // Por enquanto, retorna falha para forçar novo login
        // Em uma implementação real, poderíamos implementar persistência de sessão no banco
      }
      
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      res.json(user);
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
      res.status(500).json({ message: "Erro ao buscar perfil do usuário" });
    }
  });

  app.put("/api/user/profile", async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      if (!sessionId) {
        return res.status(401).json({ message: "Sessão não encontrada" });
      }

      const currentUser = await getUserFromSession(sessionId);
      if (!currentUser) {
        return res.status(401).json({ message: "Não autenticado" });
      }

      const validatedData = updateUserProfileSchema.parse(req.body);
      const user = await storage.updateUserProfile(currentUser.id, validatedData);

      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      res.json(user);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Erro ao atualizar perfil" });
      }
    }
  });

  app.post("/api/user/change-password", async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      if (!sessionId) {
        return res.status(401).json({ message: "Sessão não encontrada" });
      }

      const currentUser = await getUserFromSession(sessionId);
      if (!currentUser) {
        return res.status(401).json({ message: "Não autenticado" });
      }

      const validatedData = changePasswordSchema.parse(req.body);
      const success = await storage.changePassword(currentUser.id, validatedData.currentPassword, validatedData.newPassword);

      if (!success) {
        return res.status(400).json({ message: "Senha atual incorreta" });
      }

      res.json({ message: "Senha alterada com sucesso" });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Erro ao alterar senha" });
      }
    }
  });

  // Get all fuel requisitions
  app.get("/api/fuel-requisitions", async (req, res) => {
    try {
      const requisitions = await storage.getFuelRequisitions();

      // Retorna todas as requisições sem paginação
      // Cache muito baixo para dados críticos
      res.set('Cache-Control', 'public, max-age=2');
      res.json(requisitions);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar requisições" });
    }
  });

  // Get a specific fuel requisition
  app.get("/api/fuel-requisitions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const requisition = await storage.getFuelRequisition(id);

      if (!requisition) {
        return res.status(404).json({ message: "Requisição não encontrada" });
      }

      res.json(requisition);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar requisição" });
    }
  });

  // Route to mark purchase order as generated
  app.patch("/api/fuel-requisitions/:id/purchase-order", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { generated } = req.body;

      // Use updateFuelRequisition since markPurchaseOrderGenerated doesn't exist
      const requisition = await storage.updateFuelRequisition(id, { purchaseOrderGenerated: generated });

      if (!requisition) {
        return res.status(404).json({ message: "Requisição não encontrada" });
      }

      res.json(requisition);
    } catch (error) {
      res.status(500).json({ message: "Erro ao marcar ordem de compra como gerada" });
    }
  });

  // Create a new fuel requisition
  app.post("/api/fuel-requisitions", async (req, res) => {
    try {
      const validatedData = insertFuelRequisitionSchema.parse(req.body);
      const requisition = await storage.createFuelRequisition(validatedData);
      res.status(201).json(requisition);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Erro ao criar requisição" });
      }
    }
  });

  // Get a specific fuel requisition
  app.get("/api/fuel-requisitions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const requisition = await storage.getFuelRequisition(id);
      if (!requisition) {
        return res.status(404).json({ message: "Requisição não encontrada" });
      }

      res.json(requisition);
    } catch (error) {
      console.error("Error fetching fuel requisition:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Update a fuel requisition
  app.put("/api/fuel-requisitions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // Allow partial updates for existing requisitions
      const validatedData = insertFuelRequisitionSchema.partial().parse(req.body);

      // Fetch the current requisition to check its status
      const currentRequisition = await storage.getFuelRequisition(id);
      if (!currentRequisition) {
        return res.status(404).json({ message: "Requisição não encontrada" });
      }

      // Allow editing of approved requisitions for values updates (quantity, pricePerLiter, discount, fiscalCoupon)
      // Only restrict editing of basic data for pending requisitions
      const allowedFields = ['quantity', 'pricePerLiter', 'discount', 'fiscalCoupon'];
      const isValuesUpdate = Object.keys(validatedData).every(key => allowedFields.includes(key));

      if (currentRequisition.status === 'pending' || 
          (currentRequisition.status === 'approved' && isValuesUpdate)) {
        // Allow the update
      } else if (currentRequisition.status === 'approved' && !isValuesUpdate) {
        return res.status(400).json({ message: "Para requisições aprovadas, só é possível editar valores (quantidade, preço, desconto, cupom fiscal)" });
      } else {
        return res.status(400).json({ message: "Não é possível editar requisições rejeitadas ou finalizadas" });
      }

      const requisition = await storage.updateFuelRequisition(id, validatedData);

      if (!requisition) {
        // This case should ideally not happen if currentRequisition was found, but good for safety
        return res.status(404).json({ message: "Requisição não encontrada após a verificação" });
      }

      res.json(requisition);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Erro ao atualizar requisição" });
      }
    }
  });

  // Update requisition status (approve/reject) - Otimizado para resposta imediata
  app.patch("/api/fuel-requisitions/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = updateFuelRequisitionStatusSchema.parse(req.body);
      const requisition = await storage.updateFuelRequisitionStatus(id, validatedData);

      if (!requisition) {
        return res.status(404).json({ message: "Requisição não encontrada" });
      }

      // Headers para evitar cache em status updates críticos
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.json(requisition);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Erro ao atualizar status da requisição" });
      }
    }
  });

  // Undo a fulfilled requisition (admin only)
  app.patch("/api/fuel-requisitions/:id/undo", async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      if (!sessionId) {
        return res.status(401).json({ message: "Sessão não encontrada" });
      }

      const currentUser = await getUserFromSession(sessionId);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado - apenas administradores podem desfazer requisições realizadas" });
      }

      const id = parseInt(req.params.id);
      
      // Get current requisition to verify it's fulfilled
      const currentRequisition = await storage.getFuelRequisition(id);
      if (!currentRequisition) {
        return res.status(404).json({ message: "Requisição não encontrada" });
      }

      if (currentRequisition.status !== 'fulfilled') {
        return res.status(400).json({ message: "Apenas requisições realizadas podem ser desfeitas" });
      }

      // Update status back to approved
      const requisition = await storage.updateFuelRequisitionStatus(id, { 
        status: 'approved',
        rejectionReason: undefined 
      });

      if (!requisition) {
        return res.status(404).json({ message: "Requisição não encontrada" });
      }

      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.json(requisition);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Erro ao desfazer requisição" });
      }
    }
  });

  // Delete a fuel requisition
  app.delete("/api/fuel-requisitions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      const requisition = await storage.getFuelRequisition(id);
      if (!requisition) {
        return res.status(404).json({ message: "Requisição não encontrada" });
      }

      // Apenas reverte o KM se a requisição não foi realizada
      if (requisition.status !== 'fulfilled') {
        try {
          const vehicle = await storage.getVehicle(requisition.vehicleId);
          if (vehicle) {
            const currentMileage = parseFloat(vehicle.mileage || '0');
            const kmAtual = parseFloat(requisition.kmAtual || '0');
            const kmAnterior = parseFloat(requisition.kmAnterior || '0');

            // Reverte somente quando o hodômetro do veículo coincide com o kmAtual informado na requisição
            if (Number.isFinite(currentMileage) && Number.isFinite(kmAtual) && currentMileage === kmAtual) {
              await storage.updateVehicleMileage(requisition.vehicleId, kmAnterior.toString());
            }
          }
        } catch (_err) {
          // Ignora erro de reversão de KM para não bloquear exclusão
        }
      }

      const deleted = await storage.deleteFuelRequisition(id);
      if (!deleted) {
        return res.status(404).json({ message: "Requisição não encontrada" });
      }

      res.json({ message: "Requisição excluída com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir requisição" });
    }
  });

  // Get requisition statistics (cached)
  app.get("/api/fuel-requisitions/stats/overview", async (req, res) => {
    try {
      const stats = await storage.getRequisitionStats();
      // Cache moderado para estatísticas
      res.set('Cache-Control', 'public, max-age=20');
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar estatísticas" });
    }
  });

  // Get requisitions by department
  app.get("/api/fuel-requisitions/stats/department", async (req, res) => {
    try {
      const stats = await storage.getRequisitionsByDepartment();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar estatísticas por departamento" });
    }
  });

  // Get requisitions by fuel type
  app.get("/api/fuel-requisitions/stats/fuel-type", async (req, res) => {
    try {
      const stats = await storage.getRequisitionsByFuelType();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar estatísticas por tipo de combustível" });
    }
  });

  app.get("/api/fuel-requisitions/stats/fuel-efficiency", async (req, res) => {
    try {
      const stats = await storage.getFuelEfficiencyStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar estatísticas de eficiência de combustível" });
    }
  });

  // Supplier routes (cached)
  app.get("/api/suppliers", async (req, res) => {
    try {
      const suppliers = await storage.getSuppliers();
      // Cache ultra baixo para garantir dados atualizados nas edições
      res.set('Cache-Control', 'public, max-age=1');
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar fornecedores" });
    }
  });

  app.get("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const supplier = await storage.getSupplier(id);

      if (!supplier) {
        return res.status(404).json({ message: "Fornecedor não encontrado" });
      }

      res.json(supplier);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar fornecedor" });
    }
  });

  app.post("/api/suppliers", async (req, res) => {
    try {
      const validatedData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(validatedData);
      res.status(201).json(supplier);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Erro ao criar fornecedor" });
      }
    }
  });

  app.put("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertSupplierSchema.partial().parse(req.body);
      const supplier = await storage.updateSupplier(id, validatedData);

      if (!supplier) {
        return res.status(404).json({ message: "Fornecedor não encontrado" });
      }

      // Headers anti-cache para edições críticas
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.json(supplier);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Erro ao atualizar fornecedor" });
      }
    }
  });

  app.delete("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteSupplier(id);

      if (!deleted) {
        return res.status(404).json({ message: "Fornecedor não encontrado" });
      }

      res.json({ message: "Fornecedor excluído com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir fornecedor" });
    }
  });

  // Password reset route (admin only)
  app.post("/api/admin/reset-passwords", async (req, res) => {
    try {
      const currentUser = await storage.getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado - apenas administradores" });
      }

      const { newPassword, excludeUsernames } = req.body;
      if (!newPassword) {
        return res.status(400).json({ message: "Nova senha é obrigatória" });
      }

      const count = await storage.resetAllPasswords(newPassword, excludeUsernames || []);
      res.json({ 
        message: `${count} senhas foram redefinidas com sucesso`,
        count 
      });
    } catch (error) {
      res.status(500).json({ message: "Erro ao redefinir senhas" });
    }
  });

  // User management routes (cached)
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      // Cache ultra baixo para garantir dados atualizados nas edições
      res.set('Cache-Control', 'public, max-age=1');
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar usuários" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);

      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Headers para garantir dados atuais nos PDFs
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar usuário" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const validatedData = insertUserManagementSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Erro ao criar usuário" });
      }
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertUserManagementSchema.partial().parse(req.body);
      const user = await storage.updateUser(id, validatedData);

      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Headers anti-cache para edições críticas
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.json(user);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Erro ao atualizar usuário" });
      }
    }
  });

  // Update user status
  app.patch("/api/users/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { active } = req.body;

      // Convert boolean to string for database
      const activeStatus = typeof active === 'boolean' ? active.toString() : active;

      const user = await (storage as any).updateUserActive(id, activeStatus);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Erro ao atualizar status do usuário" });
    }
  });

  // Delete user
  app.delete("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteUser(id);

      if (!deleted) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      res.json({ message: "Usuário excluído com sucesso" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Erro ao excluir usuário" });
    }
  });

  // Vehicle routes
  app.get("/api/vehicles", async (req, res) => {
    try {
      const vehicles = await storage.getVehicles();
      // Cache ultra baixo para garantir dados atualizados imediatamente
      res.set('Cache-Control', 'public, max-age=1');
      res.json(vehicles);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar veículos" });
    }
  });

  app.get("/api/vehicles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const vehicle = await storage.getVehicle(id);

      if (!vehicle) {
        return res.status(404).json({ message: "Veículo não encontrado" });
      }

      res.json(vehicle);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar veículo" });
    }
  });

  app.post("/api/vehicles", async (req, res) => {
    try {
      const validatedData = insertVehicleSchema.parse(req.body);
      const vehicle = await storage.createVehicle(validatedData);
      res.status(201).json(vehicle);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Erro ao criar veículo" });
      }
    }
  });

  app.put("/api/vehicles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertVehicleSchema.partial().parse(req.body);
      const vehicle = await storage.updateVehicle(id, validatedData);

      if (!vehicle) {
        return res.status(404).json({ message: "Veículo não encontrado" });
      }

      res.json(vehicle);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Erro ao atualizar veículo" });
      }
    }
  });

  app.patch("/api/vehicles/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      const vehicle = await storage.getVehicle(id);
      if (!vehicle) {
        return res.status(404).json({ message: "Veículo não encontrado" });
      }

      const updatedVehicle = await storage.updateVehicleStatus(id, status);

      // Headers para evitar cache em status updates críticos
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.json(updatedVehicle);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar status do veículo" });
    }
  });

  app.delete("/api/vehicles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteVehicle(id);

      if (!deleted) {
        return res.status(404).json({ message: "Veículo não encontrado" });
      }

      res.json({ message: "Veículo excluído com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir veículo" });
    }
  });

  // Suppliers routes - Duplicate routes removed for better performance

  // Vehicle mileage update route
  app.patch("/api/vehicles/:id/mileage", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { mileage } = req.body;

      const success = await storage.updateVehicleMileage(id, mileage);
      if (!success) {
        return res.status(404).json({ message: "Veículo não encontrado" });
      }

      res.json({ message: "Quilometragem atualizada com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar quilometragem" });
    }
  });

  // Data cleanup routes
  app.delete("/api/cleanup/requisitions", async (req, res) => {
    try {
      const deletedCount = await storage.cleanupRequisitions();

      // Headers para forçar limpeza de cache
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');

      res.json({ deletedCount, message: "Requisições removidas com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao remover requisições" });
    }
  });

  app.delete("/api/cleanup/vehicles", async (req, res) => {
    try {
      const deletedCount = await storage.cleanupVehicles();
      res.json({ deletedCount, message: "Veículos removidos com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao remover veículos" });
    }
  });

  app.delete("/api/cleanup/suppliers", async (req, res) => {
    try {
      const deletedCount = await storage.cleanupSuppliers();
      res.json({ deletedCount, message: "Fornecedores removidos com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao remover fornecedores" });
    }
  });

  app.delete("/api/cleanup/companies", async (req, res) => {
    try {
      const deletedCount = await storage.cleanupCompanies();
      res.json({ deletedCount, message: "Empresas removidas com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao remover empresas" });
    }
  });

  // Endpoint para limpar cache manualmente
  app.post("/api/admin/clear-cache", async (req, res) => {
    try {
      if (storage instanceof DatabaseStorage) {
        (storage as any).cache?.clear();
      }

      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache'); 
      res.set('Expires', '0');

      res.json({ message: "Cache limpo com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao limpar cache" });
    }
  });

  // Companies routes (cached)
  app.get("/api/companies", async (req, res) => {
    try {
      const companies = await storage.getCompanies();
      // Cache ultra baixo para garantir dados atualizados nas edições
      res.set('Cache-Control', 'public, max-age=1');
      res.json(companies);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar empresas" });
    }
  });

  app.get("/api/companies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const company = await storage.getCompany(id);

      if (!company) {
        return res.status(404).json({ error: "Empresa não encontrada" });
      }

      res.json(company);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar empresa" });
    }
  });

  app.post("/api/companies", async (req, res) => {
    try {
      const validatedData = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(validatedData);
      res.status(201).json(company);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Erro ao criar empresa" });
      }
    }
  });

  app.put("/api/companies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertCompanySchema.partial().parse(req.body);
      const company = await storage.updateCompany(id, validatedData);

      if (!company) {
        return res.status(404).json({ message: "Empresa não encontrada" });
      }

      // Headers anti-cache para edições críticas
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.json(company);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Erro ao atualizar empresa" });
      }
    }
  });

  app.delete("/api/companies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCompany(id);

      if (!deleted) {
        return res.status(404).json({ message: "Empresa não encontrada" });
      }

      res.json({ message: "Empresa excluída com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir empresa" });
    }
  });

  // Fuel Records API Routes (Vehicle Check-in System)
  app.get("/api/fuel-records", async (req, res) => {
    try {
      const records = await storage.getFuelRecords();
      res.set('Cache-Control', 'public, max-age=2');
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar registros de combustível" });
    }
  });

  app.get("/api/fuel-records/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const record = await storage.getFuelRecord(id);

      if (!record) {
        return res.status(404).json({ error: "Registro não encontrado" });
      }

      res.json(record);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar registro" });
    }
  });

  app.post("/api/fuel-records", async (req, res) => {
    try {
      const validatedData = insertFuelRecordSchema.parse(req.body);
      const record = await storage.createFuelRecord(validatedData);

      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.status(201).json(record);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Erro ao criar registro de combustível" });
      }
    }
  });

  app.put("/api/fuel-records/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertFuelRecordSchema.partial().parse(req.body);
      const record = await storage.updateFuelRecord(id, validatedData);

      if (!record) {
        return res.status(404).json({ message: "Registro não encontrado" });
      }

      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.json(record);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Erro ao atualizar registro" });
      }
    }
  });

  app.delete("/api/fuel-records/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteFuelRecord(id);

      if (!deleted) {
        return res.status(404).json({ message: "Registro não encontrado" });
      }

      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.json({ message: "Registro excluído com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir registro" });
    }
  });

  app.get("/api/fuel-records/vehicle/:vehicleId", async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      const records = await storage.getFuelRecordsByVehicle(vehicleId);
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar registros do veículo" });
    }
  });

  app.get("/api/fuel-records/reports/monthly", async (req, res) => {
    try {
      const year = parseInt(req.query.year as string);
      const month = parseInt(req.query.month as string);

      if (!year || !month) {
        return res.status(400).json({ message: "Ano e mês são obrigatórios" });
      }

      const report = await storage.getMonthlyFuelReport(year, month);
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Erro ao gerar relatório mensal" });
    }
  });

  app.delete("/api/cleanup/fuel-records", async (req, res) => {
    try {
      const deletedCount = await storage.cleanupFuelRecords();
      res.json({ deletedCount, message: "Registros de combustível removidos com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao remover registros de combustível" });
    }
  });

  // ================== Vehicle Checklist Routes ==================
  app.get("/api/checklists/open", async (req, res) => {
    try {
      const list = await storage.getOpenChecklists();
      res.json(list);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar checklists em aberto" });
    }
  });

  app.get("/api/checklists/closed", async (req, res) => {
    try {
      const list = await storage.getClosedChecklists();
      res.json(list);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar checklists fechados" });
    }
  });

  app.post("/api/checklists/exit", async (req, res) => {
    try {
      const { vehicleId, userId, kmInitial, fuelLevelStart, startDate, inspectionStart } = req.body;
      const created = await storage.createExitChecklist({ vehicleId: parseInt(vehicleId), userId: parseInt(userId), kmInitial: parseFloat(kmInitial), fuelLevelStart, startDate, inspectionStart });
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.json(created);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Erro ao criar checklist de saída" });
      }
    }
  });

  app.post("/api/checklists/return/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { kmFinal, fuelLevelEnd, endDate, inspectionEnd } = req.body;
      const updated = await storage.closeReturnChecklist(id, { kmFinal: parseFloat(kmFinal), fuelLevelEnd, endDate, inspectionEnd });
      if (!updated) {
        return res.status(404).json({ message: "Checklist não encontrado" });
      }
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.json(updated);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Erro ao fechar checklist de retorno" });
      }
    }
  });

  app.delete("/api/checklists/:id", async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      if (!sessionId) {
        return res.status(401).json({ message: "Não autenticado" });
      }

      const user = await getUserFromSession(sessionId);
      if (!user) {
        return res.status(401).json({ message: "Sessão inválida" });
      }

      if (user.role !== 'admin' && user.role !== 'manager') {
        return res.status(403).json({ message: "Acesso negado - Apenas gerentes e administradores podem excluir checklists" });
      }

      const id = parseInt(req.params.id);
      const deleted = await storage.deleteChecklist(id);
      if (!deleted) {
        return res.status(404).json({ message: "Checklist não encontrado" });
      }
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.json({ message: "Checklist excluída com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir checklist" });
    }
  });

  // Fallback para ambientes que bloqueiam DELETE
  app.post("/api/checklists/:id/delete", async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      if (!sessionId) {
        return res.status(401).json({ message: "Não autenticado" });
      }

      const user = await getUserFromSession(sessionId);
      if (!user) {
        return res.status(401).json({ message: "Sessão inválida" });
      }

      if (user.role !== 'admin' && user.role !== 'manager') {
        return res.status(403).json({ message: "Acesso negado - Apenas gerentes e administradores podem excluir checklists" });
      }

      const id = parseInt(req.params.id);
      const deleted = await storage.deleteChecklist(id);
      if (!deleted) {
        return res.status(404).json({ message: "Checklist não encontrado" });
      }
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.json({ message: "Checklist excluída com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir checklist" });
    }
  });

  app.get("/api/checklists/stats/analytics", async (req, res) => {
    try {
      const analytics = await storage.getChecklistAnalytics();
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Erro ao gerar analytics do checklist" });
    }
  });

  // ============== ROTAS DE AUDITORIA E BACKUP - GARANTEM PERSISTÊNCIA PERMANENTE ==============
  
  // Buscar logs de auditoria geral
  app.get("/api/audit/logs", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await storage.getAuditLog(limit);
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.json(logs);
    } catch (error) {
      console.error('Erro ao buscar logs de auditoria:', error);
      res.status(500).json({ message: "Erro ao buscar logs de auditoria" });
    }
  });

  // Buscar logs de auditoria por tabela específica
  app.get("/api/audit/logs/:tableName", async (req, res) => {
    try {
      const tableName = req.params.tableName;
      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await storage.getAuditLogByTable(tableName, limit);
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.json(logs);
    } catch (error) {
      console.error('Erro ao buscar logs por tabela:', error);
      res.status(500).json({ message: "Erro ao buscar logs de auditoria por tabela" });
    }
  });

  // Buscar backups de dados
  app.get("/api/audit/backups", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const backups = await storage.getDataBackups(limit);
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.json(backups);
    } catch (error) {
      console.error('Erro ao buscar backups:', error);
      res.status(500).json({ message: "Erro ao buscar backups de dados" });
    }
  });

  // Buscar backups por tabela específica
  app.get("/api/audit/backups/:tableName", async (req, res) => {
    try {
      const tableName = req.params.tableName;
      const limit = parseInt(req.query.limit as string) || 5;
      const backups = await storage.getBackupsByTable(tableName, limit);
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.json(backups);
    } catch (error) {
      console.error('Erro ao buscar backups por tabela:', error);
      res.status(500).json({ message: "Erro ao buscar backups por tabela" });
    }
  });

  // Criar backup completo do sistema (admin apenas)
  app.post("/api/audit/backup-system", async (req, res) => {
    try {
      const currentUser = await storage.getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado - apenas administradores" });
      }

      const { description } = req.body;
      await storage.createFullSystemBackup(description);
      
      res.json({ 
        message: "Backup completo do sistema criado com sucesso",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao criar backup completo:', error);
      res.status(500).json({ message: "Erro ao criar backup do sistema" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
