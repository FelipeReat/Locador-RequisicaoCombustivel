import { eq, desc, sql, and, gte, lte } from 'drizzle-orm';
import { db } from './db';
import bcrypt from 'bcryptjs';
import { sendPasswordChangeNotification } from './email-service';
import { 
  users, 
  fuelRequisitions, 
  suppliers, 
  vehicles, 
  companies,
  fuelRecords,
  vehicleChecklists,
  appSettings,
  auditLog,
  dataBackups,
  userVehicleFavorites,
  vehicleTypes,
  checklistTemplates,
  checklistTemplateItems,
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
  type LoginUser,
  type FuelRecord,
  type InsertFuelRecord,
  type AuditLog,
  type DataBackup,
  type VehicleType,
  type InsertVehicleType,
  type ChecklistTemplate,
  type InsertChecklistTemplate,
  type ChecklistTemplateItem,
  type InsertChecklistTemplateItem
} from '@shared/schema';
import { IStorage, type VehicleChecklist, type FuelLevel } from './storage';

function safeParseJSON(text: any): any {
  try {
    if (typeof text === 'string') return JSON.parse(text);
    return text || {};
  } catch {
    return {};
  }
}

export class DatabaseStorage implements IStorage {
  // Remove the shared loggedInUserId - this was causing session conflicts
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private readonly DEFAULT_TTL = 1000; // 1 segundo apenas para máxima responsividade

  constructor() {
    this.initializeChecklistTemplates();
  }

  // Sistema de auditoria para rastrear todas as alterações
  private async logAudit(
    tableName: string,
    recordId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    oldValues: any = null,
    newValues: any = null,
    userId?: number,
    description?: string
  ): Promise<void> {
    try {
      await db.insert(auditLog).values({
        tableName,
        recordId,
        action,
        oldValues: oldValues ? JSON.stringify(oldValues) : null,
        newValues: newValues ? JSON.stringify(newValues) : null,
        userId,
        timestamp: new Date().toISOString(),
        description,
      });
    } catch (error) {
      console.error('Erro ao registrar auditoria:', error);
    }
  }

  // Sistema de backup automático
  private async createBackup(tableName: string, description?: string): Promise<void> {
    try {
      let data: any[] = [];
      
      switch (tableName) {
        case 'users':
          data = await db.select().from(users);
          break;
        case 'vehicles':
          data = await db.select().from(vehicles);
          break;
        case 'suppliers':
          data = await db.select().from(suppliers);
          break;
        case 'companies':
          data = await db.select().from(companies);
          break;
        case 'fuel_requisitions':
          data = await db.select().from(fuelRequisitions);
          break;
        case 'fuel_records':
          data = await db.select().from(fuelRecords);
          break;
      }

      await db.insert(dataBackups).values({
        tableName,
        backupData: JSON.stringify(data),
        backupDate: new Date().toISOString(),
        description: description || `Backup automático de ${tableName}`,
      });
    } catch (error) {
      console.error('Erro ao criar backup:', error);
    }
  }

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
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const result = await db.insert(users).values({
      ...user,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    }).returning();

    // Auditoria: registrar criação de usuário
    await this.logAudit('users', result[0].id.toString(), 'CREATE', null, result[0]);
    
    // Backup automático após alteração crítica
    await this.createBackup('users', `Usuário ${result[0].username} criado`);
    
    return result[0];
  }

  async updateUser(id: number, updates: Partial<InsertUserManagement>): Promise<User | undefined> {
    // Buscar valores antigos antes da atualização
    const oldUser = await this.getUser(id);
    
    let passwordUpdates = {};
    if (updates.password) {
      passwordUpdates = { password: await bcrypt.hash(updates.password, 10) };
    }

    const result = await db.update(users)
      .set({
        ...updates,
        ...passwordUpdates,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, id))
      .returning();

    // Auditoria: registrar atualização de usuário
    if (oldUser && result[0]) {
      await this.logAudit('users', id.toString(), 'UPDATE', oldUser, result[0], undefined, 
        `Usuário ${result[0].username} atualizado`);
      
      // Backup após alteração crítica
      await this.createBackup('users', `Usuário ${result[0].username} atualizado`);
    }

    // Limpeza agressiva do cache para edições de usuários
    this.cache.clear();
    return result[0];
  }

  async updateUserActive(id: number, active: string): Promise<User | undefined> {
    const result = await db.update(users)
      .set({
        active,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, id))
      .returning();

    // Limpeza agressiva do cache para alterações de status
    this.cache.clear();
    return result[0];
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    // Limpeza agressiva do cache após exclusão
    this.cache.clear();
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

    // Limpeza do cache para atualizações de perfil
    this.cache.clear();
    return result[0];
  }

  async changePassword(id: number, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.getUser(id);
    if (!user) {
      return false;
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return false;
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    const result = await db.update(users)
      .set({
        password: hashedNewPassword,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, id));
    return result.rowCount > 0;
  }

  async adminSetPassword(id: number, newPassword: string, adminId: number): Promise<boolean> {
    const user = await this.getUser(id);
    if (!user) {
      return false;
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    const result = await db.update(users)
      .set({
        password: hashedNewPassword,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, id))
      .returning();

    if (result.length > 0) {
      // Registrar auditoria
      await this.logAudit(
        'users',
        id.toString(),
        'UPDATE',
        { password: '***' },
        { password: '***' },
        adminId,
        `Senha do usuário ${user.username} alterada pelo administrador`
      );

      // Enviar e-mail de notificação
      if (user.email) {
        await sendPasswordChangeNotification(user.email, user.username);
      }
      
      return true;
    }

    return false;
  }

  async resetAllPasswords(newPassword: string, excludeUsernames?: string[]): Promise<number> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    let query = db.update(users).set({
      password: hashedPassword,
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
    // This method should now receive user ID from session context
    // For now, return undefined to prevent session conflicts
    return undefined;
  }

  async authenticateUser(credentials: LoginUser): Promise<User | null> {
    const user = await this.getUserByUsername(credentials.username);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Check if password is plain text (legacy migration)
    if (!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
      if (user.password === credentials.password) {
        // Migration: encrypt password using updateUser which already handles hashing
        await this.updateUser(user.id, { password: credentials.password });
        
        if (user.active !== 'true') {
          throw new Error('Usuário inativo');
        }
        return { ...user, password: '' };
      }
    }

    const isValid = await bcrypt.compare(credentials.password, user.password);
    if (!isValid) {
      throw new Error('Senha incorreta');
    }

    if (user.active !== 'true') {
      throw new Error('Usuário inativo');
    }

    // Clear cache to ensure fresh data but don't store user ID globally
    this.invalidateCache();
    
    return { ...user, password: '' }; // Don't return password in response
  }

  logoutCurrentUser(): void {
    // Clear cache on logout to prevent data leakage
    this.invalidateCache();
  }

  // Mark purchase order as generated
  async markPurchaseOrderGenerated(id: number, generated: boolean): Promise<FuelRequisition | null> {
    try {
      const result = await db
        .update(fuelRequisitions)
        .set({ 
          purchaseOrderGenerated: generated ? "true" : "false",
          updatedAt: new Date().toISOString()
        })
        .where(eq(fuelRequisitions.id, id))
        .returning();

      this.invalidateCache('fuelRequisitions');
      return result[0] || null;
    } catch (error) {
      console.error('Error marking purchase order as generated:', error);
      return null;
    }
  }

  // Suppliers with caching
  async getSuppliers(): Promise<Supplier[]> {
    const cacheKey = this.getCacheKey('suppliers');
    const cached = this.getFromCache<Supplier[]>(cacheKey);
    if (cached) return cached;

    const result = await db.select().from(suppliers).orderBy(desc(suppliers.createdAt));
    this.setCache(cacheKey, result, 500); // Cache ultra baixo de 500ms
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

    // Auditoria: registrar criação de fornecedor
    await this.logAudit('suppliers', result[0].id.toString(), 'CREATE', null, result[0], undefined,
      `Fornecedor ${result[0].name} criado`);
    
    // Backup automático após criação
    await this.createBackup('suppliers', `Fornecedor ${result[0].name} criado`);

    // Limpeza agressiva do cache para criação de fornecedores
    this.cache.clear();
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

    // Limpeza agressiva do cache para edições de fornecedores
    this.cache.clear();
    return result[0];
  }

  async deleteSupplier(id: number): Promise<boolean> {
    const result = await db.delete(suppliers).where(eq(suppliers.id, id));
    return result.rowCount > 0;
  }

  // Companies with caching otimizado
  async getCompanies(): Promise<Company[]> {
    const cacheKey = this.getCacheKey('companies');
    const cached = this.getFromCache<Company[]>(cacheKey);
    if (cached) return cached;

    const result = await db.select().from(companies).orderBy(desc(companies.createdAt));
    this.setCache(cacheKey, result, 500); // Cache ultra baixo de 500ms
    return result;
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

    // Auditoria: registrar criação de empresa
    await this.logAudit('companies', result[0].id.toString(), 'CREATE', null, result[0], undefined,
      `Empresa ${result[0].name} criada`);
    
    // Backup automático após criação
    await this.createBackup('companies', `Empresa ${result[0].name} criada`);

    // Limpeza agressiva do cache para criação de empresas
    this.cache.clear();
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

    // Limpeza agressiva do cache para edições de empresas
    this.cache.clear();
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

    // Auditoria: registrar criação de veículo
    await this.logAudit('vehicles', result[0].id.toString(), 'CREATE', null, result[0], undefined,
      `Veículo ${result[0].plate} - ${result[0].model} criado`);
    
    // Backup automático após criação
    await this.createBackup('vehicles', `Veículo ${result[0].plate} criado`);

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
    const [deleted] = await db.delete(vehicles).where(eq(vehicles.id, id)).returning();
    
    if (deleted) {
      await this.logAudit('vehicles', String(id), 'DELETE', deleted);
    }
    
    return !!deleted;
  }

  // Vehicle Types
  async getVehicleTypes(): Promise<VehicleType[]> {
    return await db.select().from(vehicleTypes).orderBy(desc(vehicleTypes.updatedAt));
  }

  async getVehicleType(id: number): Promise<VehicleType | undefined> {
    const [vehicleType] = await db.select().from(vehicleTypes).where(eq(vehicleTypes.id, id));
    return vehicleType;
  }

  async createVehicleType(vehicleType: InsertVehicleType): Promise<VehicleType> {
    const [newVehicleType] = await db.insert(vehicleTypes).values(vehicleType).returning();
    await this.logAudit('vehicle_types', String(newVehicleType.id), 'CREATE', null, newVehicleType);
    return newVehicleType;
  }

  async updateVehicleType(id: number, updates: Partial<InsertVehicleType>): Promise<VehicleType | undefined> {
    const [current] = await db.select().from(vehicleTypes).where(eq(vehicleTypes.id, id));
    if (!current) return undefined;

    const [updated] = await db
      .update(vehicleTypes)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(vehicleTypes.id, id))
      .returning();

    if (updated) {
      await this.logAudit('vehicle_types', String(id), 'UPDATE', current, updated);
    }
    return updated;
  }

  async deleteVehicleType(id: number): Promise<boolean> {
    // Check constraints before deleting if needed, but for logical delete (active=false) we use toggle
    // This method is for hard delete
    const [deleted] = await db.delete(vehicleTypes).where(eq(vehicleTypes.id, id)).returning();
    if (deleted) {
      await this.logAudit('vehicle_types', String(id), 'DELETE', deleted);
    }
    return !!deleted;
  }

  async toggleVehicleTypeStatus(id: number, active: boolean): Promise<VehicleType | undefined> {
    const [current] = await db.select().from(vehicleTypes).where(eq(vehicleTypes.id, id));
    if (!current) return undefined;

    const [updated] = await db
      .update(vehicleTypes)
      .set({ active, updatedAt: new Date().toISOString() })
      .where(eq(vehicleTypes.id, id))
      .returning();

    if (updated) {
      await this.logAudit('vehicle_types', String(id), 'UPDATE', { active: current.active }, { active: updated.active }, undefined, `Status alterado para ${active}`);
    }
    return updated;
  }

  // Fuel Requisitions without caching (temporarily disabled to fix display issue)
  async getFuelRequisitions(): Promise<FuelRequisition[]> {
    // Limpar cache completamente para garantir dados atualizados
    this.invalidateCache('fuelRequisitions');
    
    const result = await db.select().from(fuelRequisitions).orderBy(desc(fuelRequisitions.createdAt));
    console.log(`DatabaseStorage: Fetched ${result.length} fuel requisitions from database`);
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

    return result.map((row: { department: string; count: number; totalLiters: number }) => ({
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

    return result.map((row: { fuelType: string; count: number; totalLiters: number }) => ({
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

    return result.map((row: { vehiclePlate: string; vehicleModel: string; totalKmRodado: number; totalLiters: number }) => ({
      vehiclePlate: row.vehiclePlate,
      vehicleModel: row.vehicleModel,
      totalKmRodado: row.totalKmRodado || 0,
      totalLiters: row.totalLiters || 0,
      kmPerLiter: row.totalLiters > 0 ? parseFloat((row.totalKmRodado / row.totalLiters).toFixed(2)) : 0
    })).sort((a: { kmPerLiter: number }, b: { kmPerLiter: number }) => b.kmPerLiter - a.kmPerLiter);
  }

  // Data cleanup methods - Optimized to avoid unnecessary SELECT before DELETE
  async cleanupRequisitions(): Promise<number> {
    const result = await db.delete(fuelRequisitions);
    return result.rowCount || 0;
  }

  async cleanupVehicles(): Promise<number> {
    const result = await db.delete(vehicles);
    return result.rowCount || 0;
  }

  async cleanupSuppliers(): Promise<number> {
    const result = await db.delete(suppliers);
    return result.rowCount || 0;
  }

  async cleanupCompanies(): Promise<number> {
    const result = await db.delete(companies);
    return result.rowCount || 0;
  }

  // Fuel Records Methods
  async getFuelRecords(): Promise<FuelRecord[]> {
    try {
      const records = await db.select().from(fuelRecords).orderBy(desc(fuelRecords.recordDate));
      return records;
    } catch (error) {
      console.error('Error fetching fuel records:', error);
      return [];
    }
  }

  // ====== Vehicle Checklists (DB implementation) ======
  async getOpenChecklists(): Promise<VehicleChecklist[]> {
    const rows = await db.select().from(vehicleChecklists).where(eq(vehicleChecklists.status, 'open'));
    return rows as unknown as VehicleChecklist[];
  }

  async getClosedChecklists(): Promise<VehicleChecklist[]> {
    const rows = await db.select().from(vehicleChecklists).where(eq(vehicleChecklists.status, 'closed'));
    return rows as unknown as VehicleChecklist[];
  }

  async createExitChecklist(payload: { vehicleId: number; userId: number; kmInitial: number; fuelLevelStart: FuelLevel; startDate?: string; inspectionStart?: string; checklistTemplateId?: number }): Promise<VehicleChecklist> {
    const vehicleRow = await db.select().from(vehicles).where(eq(vehicles.id, payload.vehicleId)).limit(1);
    const vehicle = vehicleRow[0];
    if (!vehicle) throw new Error('Veículo não encontrado');
    if (vehicle.status !== 'active') throw new Error('Veículo inativo');

    const existingOpen = await db.select().from(vehicleChecklists)
      .where(and(eq(vehicleChecklists.vehicleId, payload.vehicleId), eq(vehicleChecklists.status, 'open')))
      .limit(1);
    if (existingOpen[0]) throw new Error('Já existe uma saída aberta para este veículo');

    const now = new Date().toISOString();
    const created = await db.insert(vehicleChecklists).values({
      vehicleId: payload.vehicleId,
      userId: payload.userId,
      checklistTemplateId: payload.checklistTemplateId,
      kmInitial: String(payload.kmInitial),
      fuelLevelStart: payload.fuelLevelStart,
      inspectionStart: payload.inspectionStart || null,
      status: 'open',
      startDate: payload.startDate || now,
      createdAt: now,
      updatedAt: now,
    }).returning();

    return created[0] as unknown as VehicleChecklist;
  }

  async closeReturnChecklist(id: number, payload: { kmFinal: number; fuelLevelEnd: FuelLevel; endDate?: string; inspectionEnd?: string }): Promise<VehicleChecklist | undefined> {
    const row = await db.select().from(vehicleChecklists).where(eq(vehicleChecklists.id, id)).limit(1);
    const checklist = row[0];
    if (!checklist) return undefined;
    if (checklist.status !== 'open') throw new Error('Checklist já fechado');
    if (payload.kmFinal < parseFloat(checklist.kmInitial)) throw new Error('Km final deve ser maior ou igual ao km inicial');

    const now = new Date().toISOString();
    const updated = await db.update(vehicleChecklists)
      .set({
        kmFinal: String(payload.kmFinal),
        fuelLevelEnd: payload.fuelLevelEnd,
        endDate: payload.endDate || now,
        status: 'closed',
        inspectionEnd: payload.inspectionEnd || null,
        updatedAt: now,
      })
      .where(eq(vehicleChecklists.id, id))
      .returning();

    return updated[0] as unknown as VehicleChecklist;
  }

  async approveChecklist(id: number, approver: { userId: number; name: string; date?: string }): Promise<VehicleChecklist | undefined> {
    const row = await db.select().from(vehicleChecklists).where(eq(vehicleChecklists.id, id)).limit(1);
    const checklist = row[0] as any;
    if (!checklist) return undefined;
    if (checklist.status !== 'closed') throw new Error('Checklist ainda não possui entrada registrada');
    const endObj = checklist.inspectionEnd ? safeParseJSON(checklist.inspectionEnd) : {};
    endObj.approvedByUserId = approver.userId;
    endObj.approvedByName = approver.name;
    endObj.approvedAt = approver.date || new Date().toISOString();
    const now = new Date().toISOString();
    const updated = await db.update(vehicleChecklists)
      .set({
        inspectionEnd: JSON.stringify(endObj),
        updatedAt: now,
      })
      .where(eq(vehicleChecklists.id, id))
      .returning();
    return updated[0] as unknown as VehicleChecklist;
  }
  async deleteChecklist(id: number): Promise<boolean> {
    // Capture old values for audit
    const existing = await db.select().from(vehicleChecklists).where(eq(vehicleChecklists.id, id)).limit(1);
    if (!existing[0]) return false;

    const deleted = await db.delete(vehicleChecklists)
      .where(eq(vehicleChecklists.id, id))
      .returning();

    // Audit log for deletion
    try {
      await db.insert(auditLog).values({
        tableName: 'vehicle_checklists',
        recordId: String(id),
        action: 'DELETE',
        oldValues: JSON.stringify(existing[0]),
        newValues: null,
        userId: undefined,
        timestamp: new Date().toISOString(),
        description: 'Checklist de veículo excluído',
      });
    } catch {}

    return (deleted?.length || 0) > 0;
  }

  async getChecklistAnalytics(): Promise<{ completenessRate: number; openCount: number; closedCount: number; avgKmPerTrip: number; activeVehiclesWithOpen: number; dailyTrend: { date: string; count: number }[] }> {
    const all = await db.select().from(vehicleChecklists) as unknown as VehicleChecklist[];
    const openCount = all.filter((c: VehicleChecklist) => c.status === 'open').length;
    const closed = all.filter((c: VehicleChecklist) => c.status === 'closed');
    const closedCount = closed.length;
    const total = all.length;
    const completenessRate = total === 0 ? 0 : parseFloat(((closedCount / total) * 100).toFixed(1));
    const avgKmPerTrip = closedCount === 0
      ? 0
      : Math.round(
          (closed.reduce((sum: number, c: VehicleChecklist) => {
            const kmFinal = Number((c as any).kmFinal ?? 0);
            const kmInitial = Number((c as any).kmInitial ?? 0);
            return sum + (kmFinal - kmInitial);
          }, 0) / closedCount) * 100
        ) / 100;
    const activeOpenVehicles = new Set(all.filter((c: VehicleChecklist) => c.status === 'open').map((c: VehicleChecklist) => c.vehicleId)).size;
    const trendMap = new Map<string, number>();
    all.forEach((c: VehicleChecklist) => {
      const dateKey = (c.endDate || c.startDate).slice(0, 10);
      trendMap.set(dateKey, (trendMap.get(dateKey) || 0) + 1);
    });
    const dailyTrend = Array.from(trendMap.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count }));

    return { completenessRate, openCount, closedCount, avgKmPerTrip, activeVehiclesWithOpen: activeOpenVehicles, dailyTrend };
  }

  async getFuelRecord(id: number): Promise<FuelRecord | undefined> {
    try {
      const result = await db.select().from(fuelRecords).where(eq(fuelRecords.id, id));
      return result[0];
    } catch (error) {
      console.error('Error fetching fuel record:', error);
      return undefined;
    }
  }

  async createFuelRecord(record: InsertFuelRecord): Promise<FuelRecord> {
    try {
      const totalCost = (parseFloat(record.litersRefueled) * parseFloat(record.pricePerLiter)).toFixed(2);

      const result = await db.insert(fuelRecords).values({
        ...record,
        fuelStation: record.fuelStation || null,
        notes: record.notes || null,
        totalCost,
      }).returning();

      return result[0];
    } catch (error) {
      console.error('Error creating fuel record:', error);
      throw new Error('Erro ao criar registro de combustível');
    }
  }

  async updateFuelRecord(id: number, updates: Partial<InsertFuelRecord>): Promise<FuelRecord | undefined> {
    try {
      // Recalculate total cost if price or liters changed
      let updateData: any = { ...updates };
      if (updates.litersRefueled && updates.pricePerLiter) {
        updateData.totalCost = (parseFloat(updates.litersRefueled) * parseFloat(updates.pricePerLiter)).toFixed(2);
      }

      const result = await db.update(fuelRecords)
        .set(updateData)
        .where(eq(fuelRecords.id, id))
        .returning();

      return result[0];
    } catch (error) {
      console.error('Error updating fuel record:', error);
      return undefined;
    }
  }

  async deleteFuelRecord(id: number): Promise<boolean> {
    try {
      const result = await db.delete(fuelRecords).where(eq(fuelRecords.id, id));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error deleting fuel record:', error);
      return false;
    }
  }

  async getFuelRecordsByVehicle(vehicleId: number): Promise<FuelRecord[]> {
    try {
      const records = await db.select()
        .from(fuelRecords)
        .where(eq(fuelRecords.vehicleId, vehicleId))
        .orderBy(desc(fuelRecords.recordDate));
      return records;
    } catch (error) {
      console.error('Error fetching fuel records by vehicle:', error);
      return [];
    }
  }

  async getMonthlyFuelReport(year: number, month: number): Promise<{
    vehicleId: number;
    vehiclePlate: string;
    vehicleModel: string;
    totalKm: number;
    totalLiters: number;
    averageKmPerLiter: number;
    totalCost: number;
  }[]> {
    try {
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const records = await db.select()
        .from(fuelRecords)
        .where(
          and(
            gte(fuelRecords.recordDate, startDate),
            lte(fuelRecords.recordDate, endDate)
          )
        );

      const vehicleData = await db.select().from(vehicles) as unknown as Vehicle[];
      const vehicleMap = new Map<number, Vehicle>(vehicleData.map((v: Vehicle) => [v.id, v]));

      const reportMap = new Map<number, {
        vehiclePlate: string;
        vehicleModel: string;
        totalKm: number;
        totalLiters: number;
        totalCost: number;
      }>();

      records.forEach((record: FuelRecord) => {
        const vehicle = vehicleMap.get(record.vehicleId);
        if (!vehicle) return;

        const current = reportMap.get(record.vehicleId) || {
          vehiclePlate: vehicle.plate,
          vehicleModel: vehicle.model,
          totalKm: 0,
          totalLiters: 0,
          totalCost: 0,
        };

        current.totalKm += parseFloat(record.distanceTraveled);
        current.totalLiters += parseFloat(record.litersRefueled);
        current.totalCost += parseFloat(record.totalCost);

        reportMap.set(record.vehicleId, current);
      });

      return Array.from(reportMap.entries()).map(([vehicleId, data]: [number, { vehiclePlate: string; vehicleModel: string; totalKm: number; totalLiters: number; totalCost: number }]) => ({
        vehicleId,
        ...data,
        averageKmPerLiter: data.totalLiters > 0 ? data.totalKm / data.totalLiters : 0,
      }));
    } catch (error) {
      console.error('Error generating monthly fuel report:', error);
      return [];
    }
  }

  async cleanupFuelRecords(): Promise<number> {
    try {
      const result = await db.delete(fuelRecords);
      return result.rowCount || 0;
    } catch (error) {
      console.error('Error cleaning up fuel records:', error);
      return 0;
    }
  }

  async getFuelRecordsByMonth(year: number, month: number): Promise<FuelRecord[]> {
    try {
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];
      
      const records = await db.select()
        .from(fuelRecords)
        .where(and(
          gte(fuelRecords.recordDate, startDate),
          lte(fuelRecords.recordDate, endDate)
        ))
        .orderBy(desc(fuelRecords.recordDate));
      
      return records;
    } catch (error) {
      console.error('Error fetching fuel records by month:', error);
      return [];
    }
  }

  // Métodos para auditoria e backup - GARANTEM PERSISTÊNCIA PERMANENTE
  async getAuditLog(limit: number = 100): Promise<AuditLog[]> {
    try {
      return await db.select().from(auditLog).orderBy(desc(auditLog.timestamp)).limit(limit);
    } catch (error) {
      console.error('Erro ao buscar auditoria:', error);
      return [];
    }
  }

  async getAuditLogByTable(tableName: string, limit: number = 50): Promise<AuditLog[]> {
    try {
      return await db.select().from(auditLog)
        .where(eq(auditLog.tableName, tableName))
        .orderBy(desc(auditLog.timestamp))
        .limit(limit);
    } catch (error) {
      console.error('Erro ao buscar auditoria por tabela:', error);
      return [];
    }
  }

  async getDataBackups(limit: number = 10): Promise<DataBackup[]> {
    try {
      return await db.select().from(dataBackups).orderBy(desc(dataBackups.backupDate)).limit(limit);
    } catch (error) {
      console.error('Erro ao buscar backups:', error);
      return [];
    }
  }

  async getBackupsByTable(tableName: string, limit: number = 5): Promise<DataBackup[]> {
    try {
      return await db.select().from(dataBackups)
        .where(eq(dataBackups.tableName, tableName))
        .orderBy(desc(dataBackups.backupDate))
        .limit(limit);
    } catch (error) {
      console.error('Erro ao buscar backups por tabela:', error);
      return [];
    }
  }

  // Método para criar backup manual de todas as tabelas críticas
  async createFullSystemBackup(description?: string): Promise<void> {
    const tables = ['users', 'vehicles', 'suppliers', 'companies', 'fuel_requisitions', 'fuel_records'];
    const backupPromises = tables.map(table => 
      this.createBackup(table, description || 'Backup completo do sistema')
    );
    
    try {
      await Promise.all(backupPromises);
      console.log('Backup completo do sistema criado com sucesso');
    } catch (error) {
      console.error('Erro ao criar backup completo:', error);
    }
  }

  // Checklist Templates
  async getChecklistTemplates(): Promise<ChecklistTemplate[]> {
    return await db.select().from(checklistTemplates).orderBy(checklistTemplates.name);
  }

  async getChecklistTemplate(id: number): Promise<ChecklistTemplate | undefined> {
    const [template] = await db.select().from(checklistTemplates).where(eq(checklistTemplates.id, id));
    return template;
  }

  async createChecklistTemplate(template: InsertChecklistTemplate): Promise<ChecklistTemplate> {
    const [newTemplate] = await db.insert(checklistTemplates).values(template).returning();
    return newTemplate;
  }

  async updateChecklistTemplate(id: number, updates: Partial<ChecklistTemplate>): Promise<ChecklistTemplate | undefined> {
    const [updated] = await db
      .update(checklistTemplates)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(checklistTemplates.id, id))
      .returning();
    return updated;
  }

  async deleteChecklistTemplate(id: number): Promise<boolean> {
    // First delete items
    await db.delete(checklistTemplateItems).where(eq(checklistTemplateItems.checklistTemplateId, id));
    // Then delete template
    const [deleted] = await db.delete(checklistTemplates).where(eq(checklistTemplates.id, id)).returning();
    return !!deleted;
  }

  // Checklist Template Items
  async getChecklistTemplateItems(templateId: number): Promise<ChecklistTemplateItem[]> {
    return await db
      .select()
      .from(checklistTemplateItems)
      .where(eq(checklistTemplateItems.checklistTemplateId, templateId))
      .orderBy(checklistTemplateItems.order);
  }

  async createChecklistTemplateItem(item: InsertChecklistTemplateItem): Promise<ChecklistTemplateItem> {
    // Get max order to append
    const [maxOrder] = await db
      .select({ maxOrder: sql<number>`max(${checklistTemplateItems.order})` })
      .from(checklistTemplateItems)
      .where(eq(checklistTemplateItems.checklistTemplateId, item.checklistTemplateId));
    
    const nextOrder = (maxOrder?.maxOrder || 0) + 1;

    const [newItem] = await db.insert(checklistTemplateItems).values({
      ...item,
      order: nextOrder
    }).returning();
    return newItem;
  }

  async updateChecklistTemplateItem(id: number, updates: Partial<ChecklistTemplateItem>): Promise<ChecklistTemplateItem | undefined> {
    const [updated] = await db
      .update(checklistTemplateItems)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(checklistTemplateItems.id, id))
      .returning();
    return updated;
  }

  async deleteChecklistTemplateItem(id: number): Promise<boolean> {
    const [deleted] = await db.delete(checklistTemplateItems).where(eq(checklistTemplateItems.id, id)).returning();
    return !!deleted;
  }

  async reorderChecklistTemplateItems(templateId: number, itemIds: number[]): Promise<boolean> {
    try {
      await db.transaction(async (tx: any) => {
        for (let i = 0; i < itemIds.length; i++) {
          await tx
            .update(checklistTemplateItems)
            .set({ order: i + 1, updatedAt: new Date().toISOString() })
            .where(and(
              eq(checklistTemplateItems.id, itemIds[i]),
              eq(checklistTemplateItems.checklistTemplateId, templateId)
            ));
        }
      });
      return true;
    } catch (error) {
      console.error('Error reordering checklist items:', error);
      return false;
    }
  }

  async initializeChecklistTemplates(): Promise<void> {
    try {
      const templates = await this.getChecklistTemplates();
      if (templates.length > 0) return;

      // Check for legacy config
      const legacyConfig = await this.getSetting('obs_config');
      if (legacyConfig && Array.isArray(legacyConfig)) {
        console.log('Migrating legacy checklist config to templates...');
        
        // Create default template
        const template = await this.createChecklistTemplate({
          name: 'Padrão (Migrado)',
          description: 'Template migrado automaticamente das configurações globais',
        });

        // Add items
        for (const item of legacyConfig) {
           await this.createChecklistTemplateItem({
             checklistTemplateId: template.id,
             key: item.key || `item_${Date.now()}_${Math.random()}`,
             label: item.label || 'Item sem nome',
             group: 'Geral', 
             defaultChecked: item.defaultChecked || false,
             column: 1,
             criticality: 0
           });
        }
        console.log('Migration completed.');
      }
    } catch (error) {
      console.error('Error initializing checklist templates:', error);
    }
  }

  // Settings
  async getSetting(key: string): Promise<any> {
    try {
      const [setting] = await db.select().from(appSettings).where(eq(appSettings.key, key));
      return setting ? JSON.parse(setting.value) : null;
    } catch (error) {
      console.error(`Error getting setting ${key}:`, error);
      return null;
    }
  }

  async saveSetting(key: string, value: any): Promise<void> {
    try {
      const stringValue = JSON.stringify(value);
      
      // Check if exists
      const [existing] = await db.select().from(appSettings).where(eq(appSettings.key, key));
      
      if (existing) {
        await db.update(appSettings)
          .set({ value: stringValue, updatedAt: new Date().toISOString() })
          .where(eq(appSettings.key, key));
      } else {
        await db.insert(appSettings)
          .values({ key, value: stringValue, updatedAt: new Date().toISOString() });
      }
    } catch (error) {
      console.error(`Error saving setting ${key}:`, error);
      throw error;
    }
  }

  // Favorites
  async getUserFavorites(userId: number): Promise<number[]> {
    try {
      const favorites = await db.select({ vehicleId: userVehicleFavorites.vehicleId })
        .from(userVehicleFavorites)
        .where(eq(userVehicleFavorites.userId, userId));
      
      return favorites.map((f: { vehicleId: number }) => f.vehicleId);
    } catch (error) {
      console.error(`Error getting favorites for user ${userId}:`, error);
      return [];
    }
  }

  async toggleUserFavorite(userId: number, vehicleId: number): Promise<boolean> {
    try {
      const [existing] = await db.select()
        .from(userVehicleFavorites)
        .where(and(
          eq(userVehicleFavorites.userId, userId),
          eq(userVehicleFavorites.vehicleId, vehicleId)
        ));

      if (existing) {
        await db.delete(userVehicleFavorites)
          .where(eq(userVehicleFavorites.id, existing.id));
        return false; // Not favorite anymore
      } else {
        await db.insert(userVehicleFavorites)
          .values({ userId, vehicleId });
        return true; // Is favorite now
      }
    } catch (error) {
      console.error(`Error toggling favorite for user ${userId} vehicle ${vehicleId}:`, error);
      throw error;
    }
  }
}
