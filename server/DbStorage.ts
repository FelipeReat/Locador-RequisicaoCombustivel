import { eq, and } from 'drizzle-orm';
import { db } from './db';
import { users, fuelRequisitions, vehicles, suppliers, type User, type InsertUser, type UpdateUserProfile, type ChangePassword, type FuelRequisition, type InsertFuelRequisition, type UpdateFuelRequisitionStatus, type Department, type InsertDepartment, type Vehicle, type InsertVehicle, type InsertUserManagement, type Supplier, type InsertSupplier } from "@shared/schema";
import { IStorage } from './storage';

export class DbStorage implements IStorage {
  // Usuários
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: number, updates: Partial<InsertUserManagement>): Promise<User | undefined> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id });
    return result.length > 0;
  }

  async updateUserProfile(id: number, profile: UpdateUserProfile): Promise<User | undefined> {
    const result = await db.update(users).set(profile).where(eq(users.id, id)).returning();
    return result[0];
  }

  async changePassword(id: number, currentPassword: string, newPassword: string): Promise<boolean> {
    // Verifica se a senha atual está correta
    const user = await this.getUser(id);
    if (!user || user.password !== currentPassword) {
      return false;
    }

    // Atualiza a senha
    const result = await db.update(users)
      .set({ password: newPassword })
      .where(eq(users.id, id))
      .returning({ id: users.id });
    
    return result.length > 0;
  }

  async getCurrentUser(): Promise<User | undefined> {
    // Simulação - em um sistema real, isso seria baseado na sessão do usuário
    return await this.getUser(1);
  }

  // Departamentos
  async getDepartments(): Promise<Department[]> {
    return await db.select().from(departments);
  }

  async getDepartment(id: number): Promise<Department | undefined> {
    const result = await db.select().from(departments).where(eq(departments.id, id));
    return result[0];
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    const now = new Date().toISOString();
    const departmentWithTimestamps = {
      ...department,
      active: "true",
      createdAt: now,
      updatedAt: now,
    };
    const result = await db.insert(departments).values(departmentWithTimestamps).returning();
    return result[0];
  }

  async updateDepartment(id: number, updates: Partial<InsertDepartment>): Promise<Department | undefined> {
    const now = new Date().toISOString();
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: now,
    };
    const result = await db.update(departments).set(updatesWithTimestamp).where(eq(departments.id, id)).returning();
    return result[0];
  }

  async deleteDepartment(id: number): Promise<boolean> {
    // Verificar se existem usuários associados a este departamento
    const usersInDepartment = await db.select().from(users).where(eq(users.departmentId, id));
    if (usersInDepartment.length > 0) {
      throw new Error("Não é possível excluir um departamento que possui usuários associados");
    }

    const result = await db.delete(departments).where(eq(departments.id, id)).returning({ id: departments.id });
    return result.length > 0;
  }

  // Veículos
  async getVehicles(): Promise<Vehicle[]> {
    return await db.select().from(vehicles);
  }

  async getVehicle(id: number): Promise<Vehicle | undefined> {
    const result = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return result[0];
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const result = await db.insert(vehicles).values(vehicle).returning();
    return result[0];
  }

  async updateVehicle(id: number, updates: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const result = await db.update(vehicles).set(updates).where(eq(vehicles.id, id)).returning();
    return result[0];
  }

  async deleteVehicle(id: number): Promise<boolean> {
    const result = await db.delete(vehicles).where(eq(vehicles.id, id)).returning({ id: vehicles.id });
    return result.length > 0;
  }

  // Requisições de Combustível
  async getFuelRequisitions(): Promise<FuelRequisition[]> {
    return await db.select().from(fuelRequisitions);
  }

  async getFuelRequisition(id: number): Promise<FuelRequisition | undefined> {
    const result = await db.select().from(fuelRequisitions).where(eq(fuelRequisitions.id, id));
    return result[0];
  }

  async createFuelRequisition(requisition: InsertFuelRequisition): Promise<FuelRequisition> {
    const result = await db.insert(fuelRequisitions).values(requisition).returning();
    return result[0];
  }

  async updateFuelRequisition(id: number, updates: Partial<FuelRequisition>): Promise<FuelRequisition | undefined> {
    const result = await db.update(fuelRequisitions).set(updates).where(eq(fuelRequisitions.id, id)).returning();
    return result[0];
  }

  async updateFuelRequisitionStatus(id: number, statusUpdate: UpdateFuelRequisitionStatus): Promise<FuelRequisition | undefined> {
    const { status, approverId, rejectionReason } = statusUpdate;
    const updates: Partial<FuelRequisition> = {
      status,
      approverId,
      rejectionReason,
      approvedDate: status === 'approved' ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString()
    };

    return await this.updateFuelRequisition(id, updates);
  }

  async deleteFuelRequisition(id: number): Promise<boolean> {
    const result = await db.delete(fuelRequisitions).where(eq(fuelRequisitions.id, id)).returning({ id: fuelRequisitions.id });
    return result.length > 0;
  }

  // Fornecedores
  async getSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers);
  }

  async getSupplier(id: number): Promise<Supplier | undefined> {
    const result = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return result[0];
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const result = await db.insert(suppliers).values(supplier).returning();
    return result[0];
  }

  async updateSupplier(id: number, updates: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const result = await db.update(suppliers).set(updates).where(eq(suppliers.id, id)).returning();
    return result[0];
  }

  async deleteSupplier(id: number): Promise<boolean> {
    const result = await db.delete(suppliers).where(eq(suppliers.id, id)).returning({ id: suppliers.id });
    return result.length > 0;
  }

  // Análises
  async getRequisitionStats(): Promise<{
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    totalLiters: number;
  }> {
    const requisitions = await this.getFuelRequisitions();
    
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
    // Esta implementação precisaria de uma consulta mais complexa com JOIN
    // Para simplificar, estamos usando uma abordagem similar à MemStorage
    const requisitions = await this.getFuelRequisitions();
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
    const requisitions = await this.getFuelRequisitions();
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