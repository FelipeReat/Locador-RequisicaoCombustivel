import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFuelRequisitionSchema, updateFuelRequisitionStatusSchema, updateUserProfileSchema, changePasswordSchema, insertSupplierSchema, insertVehicleSchema, insertUserSchema, insertUserManagementSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
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
      const validatedData = updateUserProfileSchema.parse(req.body);
      const user = await storage.updateUserProfile(1, validatedData); // Using ID 1 for demo
      
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
      const validatedData = changePasswordSchema.parse(req.body);
      const success = await storage.changePassword(1, validatedData.currentPassword, validatedData.newPassword);
      
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

  // Update requisition status (approve/reject)
  app.patch("/api/fuel-requisitions/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = updateFuelRequisitionStatusSchema.parse(req.body);
      const requisition = await storage.updateFuelRequisitionStatus(id, validatedData);
      
      if (!requisition) {
        return res.status(404).json({ message: "Requisição não encontrada" });
      }
      
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

  // Get requisition statistics
  app.get("/api/fuel-requisitions/stats/overview", async (req, res) => {
    try {
      const stats = await storage.getRequisitionStats();
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

  // Supplier routes
  app.get("/api/suppliers", async (req, res) => {
    try {
      const suppliers = await storage.getSuppliers();
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

  // User management routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
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
      
      const vehicle = await storage.updateVehicle(id, { status });
      
      if (!vehicle) {
        return res.status(404).json({ message: "Veículo não encontrado" });
      }
      
      res.json(vehicle);
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

  const httpServer = createServer(app);
  return httpServer;
}
