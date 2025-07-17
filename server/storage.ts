import { users, fuelRequisitions, departments, vehicles, type User, type InsertUser, type UpdateUserProfile, type ChangePassword, type FuelRequisition, type InsertFuelRequisition, type UpdateFuelRequisitionStatus, type Department, type InsertDepartment, type Vehicle, type InsertVehicle, type InsertUserManagement } from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUserManagement>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  updateUserProfile(id: number, profile: UpdateUserProfile): Promise<User | undefined>;
  changePassword(id: number, currentPassword: string, newPassword: string): Promise<boolean>;
  getCurrentUser(): Promise<User | undefined>;
  
  // Departments
  getDepartments(): Promise<Department[]>;
  getDepartment(id: number): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, updates: Partial<InsertDepartment>): Promise<Department | undefined>;
  deleteDepartment(id: number): Promise<boolean>;
  
  // Vehicles
  getVehicles(): Promise<Vehicle[]>;
  getVehicle(id: number): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, updates: Partial<InsertVehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: number): Promise<boolean>;
  
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
  private departments: Map<number, Department>;
  private vehicles: Map<number, Vehicle>;
  private fuelRequisitions: Map<number, FuelRequisition>;
  private currentUserId: number;
  private currentDepartmentId: number;
  private currentVehicleId: number;
  private currentRequisitionId: number;

  constructor() {
    this.users = new Map();
    this.departments = new Map();
    this.vehicles = new Map();
    this.fuelRequisitions = new Map();
    this.currentUserId = 1;
    this.currentDepartmentId = 1;
    this.currentVehicleId = 1;
    this.currentRequisitionId = 1;
    
    // Add sample data for demonstration
    this.addSampleData();
  }
  
  private addSampleData() {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    // Sample departments
    const sampleDepartments: Department[] = [
      {
        id: 1,
        name: "Administração",
        description: "Departamento administrativo",
        managerId: 1,
        budget: "50000.00",
        active: "true",
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
      {
        id: 2,
        name: "Logística",
        description: "Departamento de logística e transporte",
        managerId: null,
        budget: "75000.00",
        active: "true",
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
      {
        id: 3,
        name: "Manutenção",
        description: "Departamento de manutenção de veículos",
        managerId: null,
        budget: "30000.00",
        active: "true",
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      }
    ];

    sampleDepartments.forEach(dept => this.departments.set(dept.id, dept));
    this.currentDepartmentId = 4;

    // Sample user
    const sampleUser: User = {
      id: 1,
      username: "joao.silva",
      password: "123456",
      email: "joao.silva@empresa.com",
      fullName: "João Silva",
      departmentId: 1,
      phone: "(11) 99999-9999",
      position: "Gerente de Operações",
      role: "admin",
      active: "true",
      hireDate: yesterday.toISOString(),
      createdAt: yesterday.toISOString(),
      updatedAt: yesterday.toISOString(),
    };
    
    this.users.set(1, sampleUser);
    this.currentUserId = 2;

    // Sample vehicles
    const sampleVehicles: Vehicle[] = [
      {
        id: 1,
        plate: "ABC-1234",
        model: "Sprinter",
        brand: "Mercedes",
        year: 2020,
        fuelType: "diesel",
        departmentId: 2,
        mileage: "50000",
        status: "active",
        lastMaintenance: yesterday.toISOString(),
        nextMaintenance: null,
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
      {
        id: 2,
        plate: "XYZ-5678",
        model: "HB20",
        brand: "Hyundai",
        year: 2019,
        fuelType: "gasolina",
        departmentId: 1,
        mileage: "30000",
        status: "active",
        lastMaintenance: yesterday.toISOString(),
        nextMaintenance: null,
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      }
    ];

    sampleVehicles.forEach(vehicle => this.vehicles.set(vehicle.id, vehicle));
    this.currentVehicleId = 3;
    
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

  async createUser(insertUser: InsertUser | InsertUserManagement): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date().toISOString();
    const user: User = { 
      ...insertUser, 
      id,
      email: insertUser.email || null,
      fullName: insertUser.fullName || null,
      departmentId: insertUser.departmentId || null,
      phone: insertUser.phone || null,
      position: insertUser.position || null,
      role: insertUser.role || "employee",
      active: insertUser.active || "true",
      hireDate: insertUser.hireDate || null,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserProfile(id: number, profile: UpdateUserProfile): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = {
      ...user,
      ...profile,
      updatedAt: new Date().toISOString(),
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async changePassword(id: number, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = this.users.get(id);
    if (!user || user.password !== currentPassword) return false;

    const updatedUser = {
      ...user,
      password: newPassword,
      updatedAt: new Date().toISOString(),
    };
    this.users.set(id, updatedUser);
    return true;
  }

  async getCurrentUser(): Promise<User | undefined> {
    // In a real app, this would get the current authenticated user
    // For demo purposes, return the sample user
    return this.users.get(1);
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUser(id: number, updates: Partial<InsertUserManagement>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  // Department methods
  async getDepartments(): Promise<Department[]> {
    return Array.from(this.departments.values());
  }

  async getDepartment(id: number): Promise<Department | undefined> {
    return this.departments.get(id);
  }

  async createDepartment(departmentData: InsertDepartment): Promise<Department> {
    const department: Department = {
      id: this.currentDepartmentId++,
      ...departmentData,
      active: "true",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.departments.set(department.id, department);
    return department;
  }

  async updateDepartment(id: number, updates: Partial<InsertDepartment>): Promise<Department | undefined> {
    const department = this.departments.get(id);
    if (!department) return undefined;

    const updatedDepartment = {
      ...department,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.departments.set(id, updatedDepartment);
    return updatedDepartment;
  }

  async deleteDepartment(id: number): Promise<boolean> {
    return this.departments.delete(id);
  }

  // Vehicle methods
  async getVehicles(): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values());
  }

  async getVehicle(id: number): Promise<Vehicle | undefined> {
    return this.vehicles.get(id);
  }

  async createVehicle(vehicleData: InsertVehicle): Promise<Vehicle> {
    const vehicle: Vehicle = {
      id: this.currentVehicleId++,
      ...vehicleData,
      status: "active",
      lastMaintenance: null,
      nextMaintenance: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.vehicles.set(vehicle.id, vehicle);
    return vehicle;
  }

  async updateVehicle(id: number, updates: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const vehicle = this.vehicles.get(id);
    if (!vehicle) return undefined;

    const updatedVehicle = {
      ...vehicle,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.vehicles.set(id, updatedVehicle);
    return updatedVehicle;
  }

  async deleteVehicle(id: number): Promise<boolean> {
    return this.vehicles.delete(id);
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
