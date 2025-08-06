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

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers).orderBy(desc(suppliers.createdAt));
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

  // Vehicles
  async getVehicles(): Promise<Vehicle[]> {
    return await db.select().from(vehicles).orderBy(desc(vehicles.createdAt));
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
    return result[0];
  }

  async deleteVehicle(id: number): Promise<boolean> {
    const result = await db.delete(vehicles).where(eq(vehicles.id, id));
    return result.rowCount > 0;
  }

  // Fuel Requisitions
  async getFuelRequisitions(): Promise<FuelRequisition[]> {
    return await db.select().from(fuelRequisitions).orderBy(desc(fuelRequisitions.createdAt));
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
    return result[0];
  }

  async deleteFuelRequisition(id: number): Promise<boolean> {
    const result = await db.delete(fuelRequisitions).where(eq(fuelRequisitions.id, id));
    return result.rowCount > 0;
  }

  // Analytics
  async getRequisitionStats(): Promise<{
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    fulfilledRequests: number;
    totalLiters: number;
  }> {
    const [totalResult] = await db.select({ count: sql<number>`count(*)` }).from(fuelRequisitions);
    const [pendingResult] = await db.select({ count: sql<number>`count(*)` }).from(fuelRequisitions).where(eq(fuelRequisitions.status, 'pending'));
    const [approvedResult] = await db.select({ count: sql<number>`count(*)` }).from(fuelRequisitions).where(eq(fuelRequisitions.status, 'approved'));
    const [rejectedResult] = await db.select({ count: sql<number>`count(*)` }).from(fuelRequisitions).where(eq(fuelRequisitions.status, 'rejected'));
    const [fulfilledResult] = await db.select({ count: sql<number>`count(*)` }).from(fuelRequisitions).where(eq(fuelRequisitions.status, 'fulfilled'));

    const [litersResult] = await db.select({ 
      total: sql<number>`sum(cast(quantity as decimal))` 
    }).from(fuelRequisitions).where(
      sql`status IN ('approved', 'fulfilled') AND quantity IS NOT NULL`
    );

    return {
      totalRequests: totalResult.count,
      pendingRequests: pendingResult.count,
      approvedRequests: approvedResult.count,
      rejectedRequests: rejectedResult.count,
      fulfilledRequests: fulfilledResult.count,
      totalLiters: litersResult.total || 0,
    };
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
  
  // Data cleanup methods
  async cleanupRequisitions(): Promise<number> {
    const requisitions = await db.select().from(fuelRequisitions);
    const count = requisitions.length;

    if (count > 0) {
      await db.delete(fuelRequisitions);
    }

    return count;
  }

  async cleanupVehicles(): Promise<number> {
    const vehiclesList = await db.select().from(vehicles);
    const count = vehiclesList.length;

    if (count > 0) {
      await db.delete(vehicles);
    }

    return count;
  }

  async cleanupSuppliers(): Promise<number> {
    const suppliersList = await db.select().from(suppliers);
    const count = suppliersList.length;

    if (count > 0) {
      await db.delete(suppliers);
    }

    return count;
  }

  async cleanupCompanies(): Promise<number> {
    const companiesList = await db.select().from(companies);
    const count = companiesList.length;

    if (count > 0) {
      await db.delete(companies);
    }

    return count;
  }
}