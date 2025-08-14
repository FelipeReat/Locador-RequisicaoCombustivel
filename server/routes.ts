import type { Express } from "express";
import { createServer, type Server } from "http";
import { DatabaseStorage } from "./db-storage";
import { insertFuelRequisitionSchema, updateFuelRequisitionStatusSchema, updateUserProfileSchema, changePasswordSchema, insertSupplierSchema, insertVehicleSchema, insertUserSchema, insertUserManagementSchema, insertCompanySchema, loginSchema } from "@shared/schema";

// Use database storage with PostgreSQL
const storage = new DatabaseStorage();

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const user = await storage.authenticateUser(validatedData);

      res.json(user);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'USER_NOT_FOUND') {
          return res.status(401).json({ 
            message: "Usuário não encontrado. Verifique se o nome de usuário está correto.",
            errorType: "USER_NOT_FOUND"
          });
        } else if (error.message === 'INVALID_PASSWORD') {
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
      // Clear the current logged in user
      storage.logoutCurrentUser();
      res.json({ message: "Logout realizado com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao fazer logout" });
    }
  });

  // User routes
  app.get("/api/user/profile", async (req, res) => {
    try {
      const user = await storage.getCurrentUser();
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar perfil do usuário" });
    }
  });

  app.put("/api/user/profile", async (req, res) => {
    try {
      const currentUser = await storage.getCurrentUser();
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
      const currentUser = await storage.getCurrentUser();
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
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const requisitions = await storage.getFuelRequisitions();
      
      // Implementa paginação para melhor performance
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedRequisitions = requisitions.slice(startIndex, endIndex);
      
      // Cache muito baixo para dados críticos
      res.set('Cache-Control', 'public, max-age=2');
      res.json(paginatedRequisitions);
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

  // Update a fuel requisition
  app.put("/api/fuel-requisitions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertFuelRequisitionSchema.partial().parse(req.body);
      const requisition = await storage.updateFuelRequisition(id, validatedData);

      if (!requisition) {
        return res.status(404).json({ message: "Requisição não encontrada" });
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

  // Delete a fuel requisition
  app.delete("/api/fuel-requisitions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
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

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteUser(id);

      if (!deleted) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      res.json({ message: "Usuário excluído com sucesso" });
    } catch (error) {
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

  const httpServer = createServer(app);
  return httpServer;
}