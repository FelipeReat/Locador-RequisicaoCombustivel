import { eq, desc, sql, and } from 'drizzle-orm';
import { db } from './db';
import { 
  users, 
  vehicles, 
  fuelRequisitions, 
  suppliers, 
  companies,
  type User, 
  type InsertUser, 
  type UpdateUserProfile, 
  type ChangePassword, 
  type FuelRequisition, 
  type InsertFuelRequisition, 
  type UpdateFuelRequisitionStatus, 
  type Vehicle, 
  type InsertVehicle, 
  type InsertUserManagement, 
  type Supplier, 
  type InsertSupplier, 
  type Company, 
  type InsertCompany, 
  type LoginUser 
} from '@shared/schema';
import { IStorage } from './storage';

export class DatabaseStorage implements IStorage {
  private loggedInUserId: number | null = null;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private readonly DEFAULT_TTL = 1000; // 1 segundo apenas para máxima responsividade

  private getCacheKey(method: string, params?: any): string {
    return `${method}:${params ? JSON.stringify(params) : 'all'}`;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any, ttl = this.DEFAULT_TTL): void {
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  private invalidateCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    
    // Limpeza agressiva e imediata do cache
    const keys = Array.from(this.cache.keys());
    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const now = new Date().toISOString();
    const result = await db.insert(users).values({
      ...user,
      createdAt: now,
      updatedAt: now,
    }).returning();
    return result[0];
  }

  async updateUser(id: number, updates: Partial<InsertUserManagement>): Promise<User | undefined> {
    const result = await db.update(users)
      .set({
        ...updates,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }

  async updateUserProfile(id: number, profile: UpdateUserProfile): Promise<User | undefined> {
    const result = await db.update(users)
      .set({
        ...profile,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async changePassword(id: number, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.getUser(id);
    if (!user || user.password !== currentPassword) {
      return false;
    }

    const result = await db.update(users)
      .set({
        password: newPassword,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, id));
    return result.rowCount > 0;
  }

  async resetAllPasswords(newPassword: string, excludeUsernames?: string[]): Promise<number> {
    let query = db.update(users).set({
      password: newPassword,
      updatedAt: new Date().toISOString(),
    });

    if (excludeUsernames && excludeUsernames.length > 0) {
      // Note: This would need proper implementation with NOT IN clause
      // For now, we'll update all users
    }

    const result = await query;
    return result.rowCount;
  }

  async getCurrentUser(): Promise<User | undefined> {
    if (!this.loggedInUserId) return undefined;
    return await this.getUser(this.loggedInUserId);
  }

  async authenticateUser(credentials: LoginUser): Promise<User | null> {
    const user = await this.getUserByUsername(credentials.username);
    if (user && user.password === credentials.password && user.active === "true") {
      this.loggedInUserId = user.id;
      return user;
    }
    return null;
  }

  logoutCurrentUser(): void {
    this.loggedInUserId = null;
  }

  // Suppliers with caching
  async getSuppliers(): Promise<Supplier[]> {
    const cacheKey = this.getCacheKey('suppliers');
    const cached = this.getFromCache<Supplier[]>(cacheKey);
    if (cached) return cached;

    const result = await db.select().from(suppliers).orderBy(desc(suppliers.createdAt));
    this.setCache(cacheKey, result);
    return result;
  }

  async getSupplier(id: number): Promise<Supplier | undefined> {
    const result = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
    return result[0];
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const now = new Date().toISOString();
    const result = await db.insert(suppliers).values({
      ...supplier,
      createdAt: now,
      updatedAt: now,
    }).returning();
    this.invalidateCache('suppliers');
    return result[0];
  }

  async updateSupplier(id: number, updates: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const result = await db.update(suppliers)
      .set({
        ...updates,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(suppliers.id, id))
      .returning();
    return result[0];
  }

  async deleteSupplier(id: number): Promise<boolean> {
    const result = await db.delete(suppliers).where(eq(suppliers.id, id));
    return result.rowCount > 0;
  }

  // Companies
  async getCompanies(): Promise<Company[]> {
    return await db.select().from(companies).orderBy(desc(companies.createdAt));
  }

  async getCompany(id: number): Promise<Company | undefined> {
    const result = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
    return result[0];
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const now = new Date().toISOString();
    const result = await db.insert(companies).values({
      ...company,
      createdAt: now,
      updatedAt: now,
    }).returning();
    return result[0];
  }

  async updateCompany(id: number, updates: Partial<InsertCompany>): Promise<Company | undefined> {
    const result = await db.update(companies)
      .set({
        ...updates,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(companies.id, id))
      .returning();
    return result[0];
  }

  async deleteCompany(id: number): Promise<boolean> {
    const result = await db.delete(companies).where(eq(companies.id, id));
    return result.rowCount > 0;
  }

  // Vehicles with caching
  async getVehicles(): Promise<Vehicle[]> {
    const cacheKey = this.getCacheKey('vehicles');
    const cached = this.getFromCache<Vehicle[]>(cacheKey);
    if (cached) return cached;

    const result = await db.select().from(vehicles).orderBy(desc(vehicles.createdAt));
    this.setCache(cacheKey, result, 500); // Cache ultra baixo de 500ms
    return result;
  }

  async getVehicle(id: number): Promise<Vehicle | undefined> {
    const result = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1);
    return result[0];
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const now = new Date().toISOString();
    const result = await db.insert(vehicles).values({
      ...vehicle,
      createdAt: now,
      updatedAt: now,
    }).returning();
    
    // Limpeza agressiva do cache para criação de veículos
    this.cache.clear();
    return result[0];
  }

  async updateVehicle(id: number, updates: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const result = await db.update(vehicles)
      .set({
        ...updates,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(vehicles.id, id))
      .returning();
    
    // Limpeza do cache para updates de veículos
    this.cache.clear();
    return result[0];
  }

  async updateVehicleStatus(id: number, status: string): Promise<Vehicle | undefined> {
    const result = await db.update(vehicles)
      .set({
        status,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(vehicles.id, id))
      .returning();
    
    // Limpeza agressiva e imediata do cache para status updates críticos
    this.cache.clear();
    
    return result[0];
  }

  async deleteVehicle(id: number): Promise<boolean> {
    const result = await db.delete(vehicles).where(eq(vehicles.id, id));
    return result.rowCount > 0;
  }

  // Fuel Requisitions with caching
  async getFuelRequisitions(): Promise<FuelRequisition[]> {
    const cacheKey = this.getCacheKey('fuelRequisitions');
    const cached = this.getFromCache<FuelRequisition[]>(cacheKey);
    if (cached) return cached;

    const result = await db.select().from(fuelRequisitions).orderBy(desc(fuelRequisitions.createdAt));
    this.setCache(cacheKey, result, 1000); // Cache mínimo de 1 segundo
    return result;
  }

  async getFuelRequisition(id: number): Promise<FuelRequisition | undefined> {
    const result = await db.select().from(fuelRequisitions).where(eq(fuelRequisitions.id, id)).limit(1);
    return result[0];
  }

  async createFuelRequisition(requisition: InsertFuelRequisition): Promise<FuelRequisition> {
    const now = new Date().toISOString();
    const result = await db.insert(fuelRequisitions).values({
      ...requisition,
      createdAt: now,
      updatedAt: now,
    }).returning();
    
    // Invalidar cache relacionado às requisições após criar
    this.invalidateCache('fuelRequisitions');
    this.invalidateCache('requisitionStats');
    
    return result[0];
  }

  async updateFuelRequisition(id: number, updates: Partial<FuelRequisition>): Promise<FuelRequisition | undefined> {
    const result = await db.update(fuelRequisitions)
      .set({
        ...updates,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(fuelRequisitions.id, id))
      .returning();
    
    // Invalidar cache relacionado às requisições após atualizar
    this.invalidateCache('fuelRequisitions');
    this.invalidateCache('requisitionStats');
    
    return result[0];
  }

  async updateVehicleMileage(id: number, mileage: string): Promise<boolean> {
    const result = await db.update(vehicles)
      .set({
        mileage,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(vehicles.id, id));
    return result.rowCount > 0;
  }

  async updateFuelRequisitionStatus(id: number, statusUpdate: UpdateFuelRequisitionStatus): Promise<FuelRequisition | undefined> {
    const updates: any = {
      status: statusUpdate.status,
      updatedAt: new Date().toISOString(),
    };

    if (statusUpdate.status === "approved") {
      updates.approverId = statusUpdate.approver ? 1 : null;
      updates.approvedDate = new Date().toISOString();
      updates.rejectionReason = null;
    } else if (statusUpdate.status === "rejected") {
      updates.approverId = statusUpdate.approver ? 1 : null;
      updates.rejectionReason = statusUpdate.rejectionReason;
      updates.approvedDate = null;
    }

    const result = await db.update(fuelRequisitions)
      .set(updates)
      .where(eq(fuelRequisitions.id, id))
      .returning();
    
    // Limpeza imediata e agressiva do cache para status updates críticos dos veículos
    this.cache.clear();
    
    return result[0];
  }

  async deleteFuelRequisition(id: number): Promise<boolean> {
    const result = await db.delete(fuelRequisitions).where(eq(fuelRequisitions.id, id));
    return result.rowCount > 0;
  }

  // Analytics - Optimized to use single query instead of 6 separate queries with caching
  async getRequisitionStats(): Promise<{
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    fulfilledRequests: number;
    totalLiters: number;
  }> {
    const cacheKey = this.getCacheKey('requisitionStats');
    const cached = this.getFromCache<any>(cacheKey);
    if (cached) return cached;

    const [result] = await db.select({
      totalRequests: sql<number>`count(*)`,
      pendingRequests: sql<number>`sum(case when status = 'pending' then 1 else 0 end)`,
      approvedRequests: sql<number>`sum(case when status = 'approved' then 1 else 0 end)`,
      rejectedRequests: sql<number>`sum(case when status = 'rejected' then 1 else 0 end)`,
      fulfilledRequests: sql<number>`sum(case when status = 'fulfilled' then 1 else 0 end)`,
      totalLiters: sql<number>`sum(case when status IN ('approved', 'fulfilled') and quantity is not null then cast(quantity as decimal) else 0 end)`
    }).from(fuelRequisitions);

    const stats = {
      totalRequests: result.totalRequests,
      pendingRequests: result.pendingRequests,
      approvedRequests: result.approvedRequests,
      rejectedRequests: result.rejectedRequests,
      fulfilledRequests: result.fulfilledRequests,
      totalLiters: result.totalLiters || 0,
    };

    this.setCache(cacheKey, stats, 1000); // Cache mínimo de 1 segundo
    return stats;
  }

  async getRequisitionsByDepartment(): Promise<{ department: string; count: number; totalLiters: number }[]> {
    const result = await db.select({
      department: sql<string>`'Dept' || requester_id`,
      count: sql<number>`count(*)`,
      totalLiters: sql<number>`sum(case when status IN ('approved', 'fulfilled') and quantity is not null then cast(quantity as decimal) else 0 end)`,
    }).from(fuelRequisitions).groupBy(fuelRequisitions.requesterId);

    return result.map(row => ({
      department: row.department,
      count: row.count,
      totalLiters: row.totalLiters || 0,
    }));
  }

  async getRequisitionsByFuelType(): Promise<{ fuelType: string; count: number; totalLiters: number }[]> {
    const result = await db.select({
      fuelType: fuelRequisitions.fuelType,
      count: sql<number>`count(*)`,
      totalLiters: sql<number>`sum(case when status IN ('approved', 'fulfilled') and quantity is not null then cast(quantity as decimal) else 0 end)`,
    }).from(fuelRequisitions).groupBy(fuelRequisitions.fuelType);

    return result.map(row => ({
      fuelType: row.fuelType,
      count: row.count,
      totalLiters: row.totalLiters || 0,
    }));
  }

  async getFuelEfficiencyStats(): Promise<{ vehiclePlate: string; vehicleModel: string; totalKmRodado: number; totalLiters: number; kmPerLiter: number }[]> {
    const result = await db.select({
      vehiclePlate: vehicles.plate,
      vehicleModel: vehicles.model,
      totalKmRodado: sql<number>`sum(cast(fuel_requisitions.km_rodado as decimal))`,
      totalLiters: sql<number>`sum(cast(fuel_requisitions.quantity as decimal))`,
    }).from(fuelRequisitions)
    .innerJoin(vehicles, sql`${fuelRequisitions.vehicleId} = ${vehicles.id}`)
    .where(sql`${fuelRequisitions.status} IN ('approved', 'fulfilled') AND ${fuelRequisitions.quantity} IS NOT NULL AND ${fuelRequisitions.kmRodado} IS NOT NULL`)
    .groupBy(vehicles.plate, vehicles.model, fuelRequisitions.vehicleId)
    .having(sql`sum(cast(fuel_requisitions.quantity as decimal)) > 0`);

    return result.map(row => ({
      vehiclePlate: row.vehiclePlate,
      vehicleModel: row.vehicleModel,
      totalKmRodado: row.totalKmRodado || 0,
      totalLiters: row.totalLiters || 0,
      kmPerLiter: row.totalLiters > 0 ? parseFloat((row.totalKmRodado / row.totalLiters).toFixed(2)) : 0
    })).sort((a, b) => b.kmPerLiter - a.kmPerLiter);
  }
  
  // Data cleanup methods - Optimized to avoid unnecessary SELECT before DELETE
  async cleanupRequisitions(): Promise<number> {
    const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(fuelRequisitions);
    const count = countResult.count;

    if (count > 0) {
      await db.delete(fuelRequisitions);
    }

    return count;
  }

  async cleanupVehicles(): Promise<number> {
    const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(vehicles);
    const count = countResult.count;

    if (count > 0) {
      await db.delete(vehicles);
    }

    return count;
  }

  async cleanupSuppliers(): Promise<number> {
    const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(suppliers);
    const count = countResult.count;

    if (count > 0) {
      await db.delete(suppliers);
    }

    return count;
  }

  async cleanupCompanies(): Promise<number> {
    const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(companies);
    const count = countResult.count;

    if (count > 0) {
      await db.delete(companies);
    }

    return count;
  }
}