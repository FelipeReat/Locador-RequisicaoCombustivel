import { users, fuelRequisitions, type User, type InsertUser, type FuelRequisition, type InsertFuelRequisition, type UpdateFuelRequisitionStatus } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Fuel Requisitions
  getFuelRequisitions(): Promise<FuelRequisition[]>;
  getFuelRequisition(id: number): Promise<FuelRequisition | undefined>;
  createFuelRequisition(requisition: InsertFuelRequisition): Promise<FuelRequisition>;
  updateFuelRequisition(id: number, updates: Partial<FuelRequisition>): Promise<FuelRequisition | undefined>;
  updateFuelRequisitionStatus(id: number, statusUpdate: UpdateFuelRequisitionStatus): Promise<FuelRequisition | undefined>;
  deleteFuelRequisition(id: number): Promise<boolean>;
  
  // Analytics
  getRequisitionStats(): Promise<{
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    totalLiters: number;
  }>;
  
  getRequisitionsByDepartment(): Promise<{ department: string; count: number; totalLiters: number }[]>;
  getRequisitionsByFuelType(): Promise<{ fuelType: string; count: number; totalLiters: number }[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private fuelRequisitions: Map<number, FuelRequisition>;
  private currentUserId: number;
  private currentRequisitionId: number;

  constructor() {
    this.users = new Map();
    this.fuelRequisitions = new Map();
    this.currentUserId = 1;
    this.currentRequisitionId = 1;
    
    // Add sample data for demonstration
    this.addSampleData();
  }
  
  private addSampleData() {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    // Sample requisitions
    const sampleRequisitions = [
      {
        id: 1,
        requester: "Maria Silva",
        department: "logistica",
        fuelType: "diesel",
        quantity: "500",
        justification: "Abastecimento da frota de caminhões para entregas da semana",
        requiredDate: tomorrow.toISOString().split('T')[0],
        priority: "alta",
        status: "pending",
        approver: null,
        approvedDate: null,
        rejectionReason: null,
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
      {
        id: 2,
        requester: "João Santos",
        department: "manutencao",
        fuelType: "gasolina",
        quantity: "200",
        justification: "Combustível para geradores durante manutenção preventiva",
        requiredDate: now.toISOString().split('T')[0],
        priority: "media",
        status: "approved",
        approver: "Ana Costa",
        approvedDate: now.toISOString(),
        rejectionReason: null,
        createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: 3,
        requester: "Carlos Oliveira",
        department: "transporte",
        fuelType: "etanol",
        quantity: "300",
        justification: "Abastecimento dos veículos administrativos",
        requiredDate: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: "baixa",
        status: "fulfilled",
        approver: "Ana Costa",
        approvedDate: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        rejectionReason: null,
        createdAt: new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
      },
    ];
    
    sampleRequisitions.forEach(req => {
      this.fuelRequisitions.set(req.id, req as FuelRequisition);
    });
    
    this.currentRequisitionId = 4;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getFuelRequisitions(): Promise<FuelRequisition[]> {
    return Array.from(this.fuelRequisitions.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getFuelRequisition(id: number): Promise<FuelRequisition | undefined> {
    return this.fuelRequisitions.get(id);
  }

  async createFuelRequisition(insertRequisition: InsertFuelRequisition): Promise<FuelRequisition> {
    const id = this.currentRequisitionId++;
    const now = new Date().toISOString();
    const requisition: FuelRequisition = {
      ...insertRequisition,
      id,
      status: "pending",
      approver: null,
      approvedDate: null,
      rejectionReason: null,
      createdAt: now,
      updatedAt: now,
    };
    this.fuelRequisitions.set(id, requisition);
    return requisition;
  }

  async updateFuelRequisition(id: number, updates: Partial<FuelRequisition>): Promise<FuelRequisition | undefined> {
    const requisition = this.fuelRequisitions.get(id);
    if (!requisition) return undefined;

    const updatedRequisition = {
      ...requisition,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.fuelRequisitions.set(id, updatedRequisition);
    return updatedRequisition;
  }

  async updateFuelRequisitionStatus(id: number, statusUpdate: UpdateFuelRequisitionStatus): Promise<FuelRequisition | undefined> {
    const requisition = this.fuelRequisitions.get(id);
    if (!requisition) return undefined;

    const updates: Partial<FuelRequisition> = {
      status: statusUpdate.status,
      updatedAt: new Date().toISOString(),
    };

    if (statusUpdate.status === "approved") {
      updates.approver = statusUpdate.approver;
      updates.approvedDate = new Date().toISOString();
      updates.rejectionReason = null;
    } else if (statusUpdate.status === "rejected") {
      updates.approver = statusUpdate.approver;
      updates.rejectionReason = statusUpdate.rejectionReason;
      updates.approvedDate = null;
    }

    const updatedRequisition = {
      ...requisition,
      ...updates,
    };
    this.fuelRequisitions.set(id, updatedRequisition);
    return updatedRequisition;
  }

  async deleteFuelRequisition(id: number): Promise<boolean> {
    return this.fuelRequisitions.delete(id);
  }

  async getRequisitionStats(): Promise<{
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    totalLiters: number;
  }> {
    const requisitions = Array.from(this.fuelRequisitions.values());
    
    return {
      totalRequests: requisitions.length,
      pendingRequests: requisitions.filter(r => r.status === "pending").length,
      approvedRequests: requisitions.filter(r => r.status === "approved").length,
      rejectedRequests: requisitions.filter(r => r.status === "rejected").length,
      totalLiters: requisitions
        .filter(r => r.status === "approved" || r.status === "fulfilled")
        .reduce((sum, r) => sum + parseFloat(r.quantity), 0),
    };
  }

  async getRequisitionsByDepartment(): Promise<{ department: string; count: number; totalLiters: number }[]> {
    const requisitions = Array.from(this.fuelRequisitions.values());
    const departmentMap = new Map<string, { count: number; totalLiters: number }>();

    requisitions.forEach(req => {
      const current = departmentMap.get(req.department) || { count: 0, totalLiters: 0 };
      current.count += 1;
      if (req.status === "approved" || req.status === "fulfilled") {
        current.totalLiters += parseFloat(req.quantity);
      }
      departmentMap.set(req.department, current);
    });

    return Array.from(departmentMap.entries()).map(([department, data]) => ({
      department,
      ...data,
    }));
  }

  async getRequisitionsByFuelType(): Promise<{ fuelType: string; count: number; totalLiters: number }[]> {
    const requisitions = Array.from(this.fuelRequisitions.values());
    const fuelTypeMap = new Map<string, { count: number; totalLiters: number }>();

    requisitions.forEach(req => {
      const current = fuelTypeMap.get(req.fuelType) || { count: 0, totalLiters: 0 };
      current.count += 1;
      if (req.status === "approved" || req.status === "fulfilled") {
        current.totalLiters += parseFloat(req.quantity);
      }
      fuelTypeMap.set(req.fuelType, current);
    });

    return Array.from(fuelTypeMap.entries()).map(([fuelType, data]) => ({
      fuelType,
      ...data,
    }));
  }
}

export const storage = new MemStorage();
