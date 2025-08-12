import { users, fuelRequisitions, vehicles, suppliers, companies, type User, type InsertUser, type UpdateUserProfile, type ChangePassword, type FuelRequisition, type InsertFuelRequisition, type UpdateFuelRequisitionStatus, type Vehicle, type InsertVehicle, type InsertUserManagement, type Supplier, type InsertSupplier, type Company, type InsertCompany, type LoginUser } from "@shared/schema";

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
  resetAllPasswords(newPassword: string, excludeUsernames?: string[]): Promise<number>;
  getCurrentUser(): Promise<User | undefined>;
  authenticateUser(credentials: LoginUser): Promise<User | null>;

  // Suppliers
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: number): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, updates: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: number): Promise<boolean>;

  // Companies
  getCompanies(): Promise<Company[]>;
  getCompany(id: number): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, updates: Partial<InsertCompany>): Promise<Company | undefined>;
  deleteCompany(id: number): Promise<boolean>;

  // Vehicles
  getVehicles(): Promise<Vehicle[]>;
  getVehicle(id: number): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, updates: Partial<InsertVehicle>): Promise<Vehicle | undefined>;
  updateVehicleStatus(id: number, status: string): Promise<Vehicle | undefined>;
  deleteVehicle(id: number): Promise<boolean>;

  // Fuel Requisitions
  getFuelRequisitions(): Promise<FuelRequisition[]>;
  getFuelRequisition(id: number): Promise<FuelRequisition | undefined>;
  createFuelRequisition(requisition: InsertFuelRequisition): Promise<FuelRequisition>;
  updateFuelRequisition(id: number, updates: Partial<FuelRequisition>): Promise<FuelRequisition | undefined>;
  updateVehicleMileage(id: number, mileage: string): Promise<boolean>;
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
  getFuelEfficiencyStats(): Promise<{ vehiclePlate: string; vehicleModel: string; totalKmRodado: number; totalLiters: number; kmPerLiter: number }[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private fuelRequisitions: Map<number, FuelRequisition>;
  private suppliers: Map<number, Supplier>;
  private companies: Map<number, Company>;
  private vehicles: Map<number, Vehicle>;
  private currentUserId: number;
  private currentRequisitionId: number;
  private currentSupplierId: number;
  private currentCompanyId: number;
  private currentVehicleId: number;
  private loggedInUserId: number | null = null;

  constructor() {
    this.users = new Map();
    this.fuelRequisitions = new Map();
    this.suppliers = new Map();
    this.companies = new Map();
    this.vehicles = new Map();
    this.currentUserId = 1;
    this.currentRequisitionId = 1;
    this.currentSupplierId = 1;
    this.currentCompanyId = 1;
    this.currentVehicleId = 1;

    // Add sample data for demonstration
    this.addSampleData();
  }

  private addSampleData() {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Sample suppliers
    const sampleSuppliers = [
      {
        id: 1,
        name: "TRANSDIESEL COMERCIO DE DERIVADOS DE PETROLEO LTDA",
        fantasia: "TRANSDIESEL",
        cnpj: "18.001.964/0001-10",
        responsavel: "CARLOS",
        email: null,
        phone: "(92) 3233-0634",
        address: "RUA DAS FLORES, 123",
        active: "true",
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
      {
        id: 2,
        name: "D DA C SAMPAIO COMERCIO DE COMBUSTIVEIS LTDA",
        fantasia: "POSTO NOVO ALEIXO",
        cnpj: "10.272.444/0001-59",
        responsavel: "CARLOS",
        email: null,
        phone: "(92) 9883-8218",
        address: "AV. NOVO ALEIXO, 456",
        active: "true",
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
      {
        id: 3,
        name: "A L X COMERCIO DE COMBUSTIVEIS LTDA",
        fantasia: "POSTO NOSSA SENHORA APARECIDA",
        cnpj: "13.191.900/0002-96",
        responsavel: "NILDA",
        email: null,
        phone: "(92) 98838-2180",
        address: "RUA NOSSA SENHORA APARECIDA, 789",
        active: "true",
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
    ];

    // Sample companies
    const sampleCompanies = [
      {
        id: 1,
        name: "BBM Serviços",
        cnpj: "13.844.973/0001-59",
        fullName: "BBM Serviços, Aluguel de Máquinas e Tecnologia LTDA",
        contact: "Bruno Rodrigues Derzi",
        phone: "(92) 3233-0634",
        email: "bruno.derzi@blomaq.com.br",
        active: "true",
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
      {
        id: 2,
        name: "J.B Andaimes",
        cnpj: "09.518.795/0001-07",
        fullName: "J. B. ANDAIMES - LOCADORA DE EQUIPAMENTOS PARA CONSTRUCAO CIVIL LTDA",
        contact: "Bruno Rodrigues Derzi",
        phone: "(92) 3233-0634",
        email: "bruno.derzi@blomaq.com.br",
        active: "true",
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
    ];

    sampleSuppliers.forEach(supplier => this.suppliers.set(supplier.id, supplier));
    this.currentSupplierId = 4;

    sampleCompanies.forEach(company => this.companies.set(company.id, company));
    this.currentCompanyId = 3;

    // Sample user
    const sampleUser: User = {
      id: 1,
      username: "admin",
      password: "admin123",
      email: "admin@blomaq.com.br",
      fullName: "Administrator",
      departmentId: 1,
      phone: "(85) 99999-9999",
      position: "Administrador do Sistema",
      role: "admin",
      active: "true",
      hireDate: yesterday.toISOString(),
      createdAt: yesterday.toISOString(),
      updatedAt: yesterday.toISOString(),
    };

    // Sample users
    const sampleUsers: User[] = [
      {
        id: 1,
        username: "admin",
        password: "admin123",
        email: "admin@blomaq.com.br",
        fullName: "Administrador do Sistema",
        departmentId: null,
        phone: "(11) 99999-9999",
        position: "Administrador",
        role: "admin",
        active: "true",
        hireDate: null,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
      {
        id: 2,
        username: "alexandre.serrao",
        password: "blomaq123",
        email: "apaiva@blomaq.com.br",
        fullName: "Alexandre Serrão de Souza",
        departmentId: null,
        phone: "(92) 99460-3483",
        position: "Almoxarifado",
        role: "employee",
        active: "true",
        hireDate: yesterday.toISOString(),
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
      {
        id: 3,
        username: "breno.derzi",
        password: "blomaq123",
        email: "breno.derzi@blomaq.com.br",
        fullName: "Wenderson Breno Grante Souza",
        departmentId: 2,
        phone: "(92) 99283-3418",
        position: "Coordenador Operacional",
        role: "manager",
        active: "true",
        hireDate: yesterday.toISOString(),
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
      {
        id: 4,
        username: "bruno.derzi",
        password: "blomaq123",
        email: "bruno.derzi@blomaq.com.br",
        fullName: "Bruno Rodrigues Derzi",
        departmentId: 3,
        phone: "(92) 99284-3060",
        position: "Diretor Executivo",
        role: "admin",
        active: "true",
        hireDate: yesterday.toISOString(),
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
      {
        id: 5,
        username: "david.medeiros",
        password: "blomaq123",
        email: "david.medeiros@blomaq.com.br",
        fullName: "David Medeiros de Souza",
        departmentId: 5,
        phone: "(92) 99183-5073",
        position: "Analista Operacional",
        role: "employee",
        active: "true",
        hireDate: yesterday.toISOString(),
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
      {
        id: 6,
        username: "wesley.fernandes",
        password: "blomaq123",
        email: "wfernandes@blomaq.com.br",
        fullName: "Wesley Fernandes da Gama",
        departmentId: 1,
        phone: "(92) 99199-4477",
        position: "Supervisor Operacional",
        role: "employee",
        active: "true",
        hireDate: yesterday.toISOString(),
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
      {
        id: 7,
        username: "rafael.dourado",
        password: "blomaq123",
        email: "rdourado@blomaq.com.br",
        fullName: "Rafael da Anunciação Dourado",
        departmentId: 1,
        phone: "(92) 92412-385",
        position: "Almoxarifado",
        role: "employee",
        active: "true",
        hireDate: yesterday.toISOString(),
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
    ];

    const daeneUser: User = {
      id: 8,
      username: "daene.lobato",
      password: "blomaq123",
      email: "daene.lobato@blomaq.com.br",
      fullName: "Daene Chaves Lobato",
      departmentId: null,
      phone: "92 98527-5909",
      position: "Gerente Operacional",
      role: "manager",
      active: "true",
      hireDate: yesterday.toISOString(),
      createdAt: yesterday.toISOString(),
      updatedAt: yesterday.toISOString(),
    };

    const andreaUser: User = {
      id: 9,
      username: "andrea.luniere",
      password: "blomaq123",
      email: "aluniere@blomaq.com.br",
      fullName: "Andréa Silva Luniére",
      departmentId: null,
      phone: "92 99421-3621",
      position: "Supervisora Operacional",
      role: "manager",
      active: "true",
      hireDate: yesterday.toISOString(),
      createdAt: yesterday.toISOString(),
      updatedAt: yesterday.toISOString(),
    };

    sampleUsers.forEach(user => this.users.set(user.id, user));
    this.users.set(daeneUser.id, daeneUser);
    this.users.set(andreaUser.id, andreaUser);
    this.currentUserId = 10;

    // Sample vehicles from provided images
    const sampleVehicles = [
      // Primeira imagem
      { id: 1, plate: "OAE-8506", model: "HONDA CG 125 CARGO KS", brand: "Honda", year: 2020, fuelType: "gasolina", mileage: "0", status: "active", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { id: 2, plate: "QZQ-1B85", model: "HONDA CG 160 CARGO", brand: "Honda", year: 2021, fuelType: "gasolina", mileage: "0", status: "active", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { id: 3, plate: "QZQ-1B75", model: "HONDA CG 160 CARGO", brand: "Honda", year: 2021, fuelType: "gasolina", mileage: "0", status: "active", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { id: 4, plate: "TAC-7I79", model: "HONDA/CG 160 CARGO", brand: "Honda", year: 2020, fuelType: "gasolina", mileage: "0", status: "active", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { id: 5, plate: "QZW-9C01", model: "HYUNDAI HB20S", brand: "Hyundai", year: 2018, fuelType: "gasolina", mileage: "0", status: "active", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { id: 6, plate: "QZR-0E86", model: "HYUNDAI HD 80", brand: "Hyundai", year: 2019, fuelType: "diesel", mileage: "0", status: "active", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { id: 7, plate: "QZJ-6D66", model: "HYUNDAI HD 80", brand: "Hyundai", year: 2019, fuelType: "diesel", mileage: "0", status: "active", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { id: 8, plate: "OAK-2560", model: "HYUNDAI HR HD", brand: "Hyundai", year: 2017, fuelType: "diesel", mileage: "0", status: "active", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { id: 9, plate: "QZL-5G28", model: "HYUNDAI HR HDB", brand: "Hyundai", year: 2018, fuelType: "diesel", mileage: "0", status: "active", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { id: 10, plate: "TAC-7I87", model: "HYUNDAI/HR HBD 4WD", brand: "Hyundai", year: 2020, fuelType: "diesel", mileage: "0", status: "active", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { id: 11, plate: "TSC-5I44", model: "JEEP", brand: "Jeep", year: 2015, fuelType: "gasolina", mileage: "0", status: "active", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { id: 12, plate: "QZX-2I14", model: "JEEP COMMANDER", brand: "Jeep", year: 2016, fuelType: "gasolina", mileage: "0", status: "active", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { id: 13, plate: "NA0-0002", model: "NÃO APLICÁVEL", brand: "Diversos", year: 2020, fuelType: "diesel", mileage: "0", status: "inactive", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { id: 14, plate: "QZA-9A00", model: "NISSAN FRONTIER", brand: "Nissan", year: 2018, fuelType: "diesel", mileage: "0", status: "active", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { id: 15, plate: "33RTS", model: "PEMT TESOURA DIESEL JLG 33RTS 13M", brand: "JLG", year: 2015, fuelType: "diesel", mileage: "0", status: "maintenance", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { id: 16, plate: "TAE-3I55", model: "POLO", brand: "Volkswagen", year: 2019, fuelType: "gasolina", mileage: "0", status: "active", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },

      // Segunda imagem
      { id: 17, plate: "NOY-8355", model: "RENAULT SANDERO", brand: "Renault", year: 2017, fuelType: "gasolina", mileage: "0", status: "active", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { id: 18, plate: "QZT-2D80", model: "SAVEIRO", brand: "Volkswagen", year: 2020, fuelType: "gasolina", mileage: "0", status: "active", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { id: 19, plate: "STZ-3H82", model: "T-CROSS", brand: "Volkswagen", year: 2021, fuelType: "gasolina", mileage: "0", status: "active", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { id: 20, plate: "QZY-9J96", model: "TOYOTA COROLLA XEI 2.0", brand: "Toyota", year: 2018, fuelType: "gasolina", mileage: "0", status: "active", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { id: 21, plate: "QZN-7A75", model: "VW NIVUS", brand: "Volkswagen", year: 2021, fuelType: "gasolina", mileage: "0", status: "active", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { id: 22, plate: "QZK-7H62", model: "VW NIVUS", brand: "Volkswagen", year: 2021, fuelType: "gasolina", mileage: "0", status: "active", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { id: 23, plate: "QZP-9B52", model: "VW NIVUS", brand: "Volkswagen", year: 2021, fuelType: "gasolina", mileage: "0", status: "active", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { id: 24, plate: "TAC-9D81", model: "VW POLO", brand: "Volkswagen", year: 2019, fuelType: "gasolina", mileage: "0", status: "active", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { id: 25, plate: "QZF-7E10", model: "VW POLO TRACK", brand: "Volkswagen", year: 2020, fuelType: "gasolina", mileage: "0", status: "active", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { id: 26, plate: "QZO-0B20", model: "VW SAVEIRO", brand: "Volkswagen", year: 2020, fuelType: "gasolina", mileage: "0", status: "active", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { id: 27, plate: "QZK-9I70", model: "VW VIRTUS", brand: "Volkswagen", year: 2021, fuelType: "gasolina", mileage: "0", status: "active", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { id: 28, plate: "QZF-9I38", model: "VW/GOL 1.0L MC4", brand: "Volkswagen", year: 2016, fuelType: "gasolina", mileage: "0", status: "active", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { id: 29, plate: "TAA-6I29", model: "VW/SAVEIRO CS RB MF", brand: "Volkswagen", year: 2019, fuelType: "gasolina", mileage: "0", status: "active", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },

      // Terceira imagem - veículos adicionais
      { id: 30, plate: "QZV-8J59", model: "CHEVROLET MONTANA", brand: "Chevrolet", year: 2018, fuelType: "gasolina", mileage: "0", status: "active", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { id: 31, plate: "SHO-1C26", model: "CHEVROLET TRACKER", brand: "Chevrolet", year: 2019, fuelType: "gasolina", mileage: "0", status: "active", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { id: 32, plate: "QZV-8C10", model: "FIAT FASTBACK", brand: "Fiat", year: 2022, fuelType: "gasolina", mileage: "0", status: "active", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { id: 33, plate: "STL-9J75", model: "FIAT MOBI", brand: "Fiat", year: 2020, fuelType: "gasolina", mileage: "0", status: "active", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { id: 34, plate: "QZD-3F61", model: "FIAT STRADA", brand: "Fiat", year: 2021, fuelType: "gasolina", mileage: "0", status: "active", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { id: 35, plate: "RUJ-7D62", model: "FIAT STRADA", brand: "Fiat", year: 2021, fuelType: "gasolina", mileage: "0", status: "active", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { id: 36, plate: "RUJ-7D54", model: "FIAT STRADA", brand: "Fiat", year: 2021, fuelType: "gasolina", mileage: "0", status: "active", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { id: 37, plate: "PHX-9G24", model: "FIAT TORO", brand: "Fiat", year: 2020, fuelType: "diesel", mileage: "0", status: "active", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { id: 38, plate: "QZU-4A71", model: "FIAT TORO", brand: "Fiat", year: 2020, fuelType: "diesel", mileage: "0", status: "active", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { id: 39, plate: "PHZ-5D93", model: "FORD KA", brand: "Ford", year: 2018, fuelType: "gasolina", mileage: "0", status: "active", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { id: 40, plate: "PHZ-5D63", model: "FORD KA", brand: "Ford", year: 2018, fuelType: "gasolina", mileage: "0", status: "active", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { id: 41, plate: "TSE-7A86", model: "GEEP RENEGADE", brand: "Jeep", year: 2017, fuelType: "gasolina", mileage: "0", status: "active", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
      { id: 42, plate: "NUK-2F38", model: "HONDA CG 125 CARGO ES", brand: "Honda", year: 2020, fuelType: "gasolina", mileage: "0", status: "active", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
    ];

    sampleVehicles.forEach(vehicle => this.vehicles.set(vehicle.id, {
      ...vehicle,
      lastMaintenance: null,
      nextMaintenance: null,
      mileage: vehicle.mileage || "0"
    }));
    this.currentVehicleId = 43;

    // Sample requisitions with new schema structure
    const sampleRequisitions = [
      {
        id: 1,
        requesterId: 1,
        supplierId: 1,
        client: "Logística Express",
        vehicleId: 1,
        kmAtual: "50100",
        kmAnterior: "50000",
        kmRodado: "100",
        tanqueCheio: "false",
        fuelType: "diesel",
        quantity: "500",
        pricePerLiter: null,
        fiscalCoupon: null,
        justification: "Abastecimento da frota de caminhões para entregas da semana",
        requiredDate: tomorrow.toISOString().split('T')[0],
        priority: "alta",
        status: "pending",
        approverId: null,
        approvedDate: null,
        rejectionReason: null,
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
      {
        id: 2,
        requesterId: 1,
        supplierId: 2,
        client: "Manutenção Corp",
        vehicleId: 2,
        kmAtual: "30200",
        kmAnterior: "30000",
        kmRodado: "200",
        tanqueCheio: "false",
        fuelType: "gasolina",
        quantity: "200",
        pricePerLiter: null,
        fiscalCoupon: null,
        justification: "Combustível para geradores durante manutenção preventiva",
        requiredDate: now.toISOString().split('T')[0],
        priority: "media",
        status: "approved",
        approverId: 1,
        approvedDate: now.toISOString(),
        rejectionReason: null,
        createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: 3,
        requesterId: 1,
        supplierId: 1,
        client: "Transporte Ltda",
        vehicleId: 1,
        kmAtual: "50300",
        kmAnterior: "50200",
        kmRodado: "100",
        tanqueCheio: "false",
        fuelType: "etanol",
        quantity: "300",
        pricePerLiter: null,
        fiscalCoupon: null,
        justification: "Abastecimento dos veículos administrativos",
        requiredDate: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: "baixa",
        status: "fulfilled",
        approverId: 1,
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
      id,
      username: insertUser.username,
      password: insertUser.password,
      email: ('email' in insertUser) ? (insertUser.email || null) : null,
      fullName: ('fullName' in insertUser) ? insertUser.fullName || null : null,
      departmentId: ('departmentId' in insertUser) ? insertUser.departmentId || null : null,
      phone: ('phone' in insertUser) ? insertUser.phone || null : null,
      position: ('position' in insertUser) ? (insertUser.position || null) : null,
      role: ('role' in insertUser) ? insertUser.role || "employee" : "employee",
      active: "true",
      hireDate: ('hireDate' in insertUser && typeof insertUser.hireDate === 'string') ? (insertUser.hireDate || null) : null,
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

  async resetAllPasswords(newPassword: string, excludeUsernames: string[] = []): Promise<number> {
    let count = 0;
    const now = new Date().toISOString();

    console.log(`[STORAGE] Starting password reset for ${this.users.size} users`);
    console.log(`[STORAGE] New password: ${newPassword}`);
    console.log(`[STORAGE] Excluding usernames:`, excludeUsernames);

    for (const [id, user] of Array.from(this.users.entries())) {
      if (!excludeUsernames.includes(user.username)) {
        console.log(`[STORAGE] Resetting password for user: ${user.username}`);
        const updatedUser = {
          ...user,
          password: newPassword,
          updatedAt: now,
        };
        this.users.set(id, updatedUser);
        count++;
      } else {
        console.log(`[STORAGE] Skipping user: ${user.username} (excluded)`);
      }
    }

    console.log(`[STORAGE] Password reset complete. ${count} passwords updated.`);
    return count;
  }

  async getCurrentUser(): Promise<User | undefined> {
    // Return the currently logged in user, or null if no one is logged in
    if (this.loggedInUserId === null) {
      return undefined;
    }
    return this.users.get(this.loggedInUserId);
  }

  // Method to set the current logged in user
  setCurrentUser(userId: number): void {
    this.loggedInUserId = userId;
  }

  // Method to logout current user
  logoutCurrentUser(): void {
    this.loggedInUserId = null;
  }

  async authenticateUser(credentials: LoginUser): Promise<User | null> {
    // Find user by username
    const user = Array.from(this.users.values()).find(u => u.username === credentials.username);

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    if (user.password !== credentials.password) {
      throw new Error('INVALID_PASSWORD');
    }

    // Set this user as the currently logged in user
    this.setCurrentUser(user.id);

    // Return user without password for security
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
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
    if (this.users.has(id)) {
      this.users.delete(id);
      return true;
    }
    return false;
  }

  async getSuppliers(): Promise<Supplier[]> {
    return Array.from(this.suppliers.values());
  }

  async getSupplier(id: number): Promise<Supplier | undefined> {
    return this.suppliers.get(id);
  }

  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    const id = this.currentSupplierId++;
    const now = new Date().toISOString();
    const supplier: Supplier = {
      id,
      name: insertSupplier.name,
      fantasia: insertSupplier.fantasia,
      cnpj: insertSupplier.cnpj,
      responsavel: insertSupplier.responsavel,
      email: null,
      phone: insertSupplier.phone || null,
      address: insertSupplier.address || null,
      active: "true",
      createdAt: now,
      updatedAt: now,
    };
    this.suppliers.set(id, supplier);
    return supplier;
  }

  async updateSupplier(id: number, updates: Partial<Supplier>): Promise<Supplier | undefined> {
    const supplier = this.suppliers.get(id);
    if (!supplier) return undefined;

    const updatedSupplier = {
      ...supplier,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.suppliers.set(id, updatedSupplier);
    return updatedSupplier;
  }

  async deleteSupplier(id: number): Promise<boolean> {
    return this.suppliers.delete(id);
  }

  // Company methods
  async getCompanies(): Promise<Company[]> {
    return Array.from(this.companies.values());
  }

  async getCompany(id: number): Promise<Company | undefined> {
    return this.companies.get(id);
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const id = this.currentCompanyId++;
    const now = new Date().toISOString();
    const company: Company = {
      ...insertCompany,
      id,
      active: "true",
      createdAt: now,
      updatedAt: now,
    };
    this.companies.set(id, company);
    return company;
  }

  async updateCompany(id: number, updates: Partial<InsertCompany>): Promise<Company | undefined> {
    const company = this.companies.get(id);
    if (!company) return undefined;

    const updatedCompany = {
      ...company,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.companies.set(id, updatedCompany);
    return updatedCompany;
  }

  async deleteCompany(id: number): Promise<boolean> {
    return this.companies.delete(id);
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
      brand: vehicleData.brand,
      fuelType: vehicleData.fuelType,
      plate: vehicleData.plate,
      model: vehicleData.model,
      year: vehicleData.year,
      mileage: "0",
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
      mileage: updates.mileage ?? vehicle.mileage,
      updatedAt: new Date().toISOString(),
    };
    this.vehicles.set(id, updatedVehicle);
    return updatedVehicle;
  }

  async updateVehicleStatus(id: number, status: string): Promise<Vehicle | undefined> {
    const vehicle = this.vehicles.get(id);
    if (!vehicle) return undefined;

    const updatedVehicle = {
      ...vehicle,
      status,
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
      id,
      requesterId: insertRequisition.requesterId,
      supplierId: insertRequisition.supplierId,
      client: insertRequisition.client,
      vehicleId: insertRequisition.vehicleId,
      kmAtual: insertRequisition.kmAtual,
      kmAnterior: insertRequisition.kmAnterior,
      kmRodado: insertRequisition.kmRodado,
      tanqueCheio: insertRequisition.tanqueCheio,
      fuelType: insertRequisition.fuelType,
      quantity: insertRequisition.quantity || null,
      pricePerLiter: insertRequisition.pricePerLiter || null,
      fiscalCoupon: insertRequisition.fiscalCoupon || null,
      justification: insertRequisition.justification || null,
      requiredDate: insertRequisition.requiredDate || null,
      priority: insertRequisition.priority || "media",
      status: "pending",
      approverId: null,
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
      updates.approverId = statusUpdate.approver ? 1 : null;
      updates.approvedDate = new Date().toISOString();
      updates.rejectionReason = null;
    } else if (statusUpdate.status === "rejected") {
      updates.approverId = statusUpdate.approver ? 1 : null;
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



  async updateVehicleMileage(id: number, mileage: string): Promise<boolean> {
    const vehicle = this.vehicles.get(id);
    if (!vehicle) return false;

    const updatedVehicle = {
      ...vehicle,
      mileage,
      updatedAt: new Date().toISOString(),
    };
    this.vehicles.set(id, updatedVehicle);
    return true;
  }

  async deleteFuelRequisition(id: number): Promise<boolean> {
    return this.fuelRequisitions.delete(id);
  }

  async getRequisitionStats(): Promise<{
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    fulfilledRequests: number;
    totalLiters: number;
  }> {
    const requisitions = Array.from(this.fuelRequisitions.values());

    return {
      totalRequests: requisitions.length,
      pendingRequests: requisitions.filter(r => r.status === "pending").length,
      approvedRequests: requisitions.filter(r => r.status === "approved").length,
      rejectedRequests: requisitions.filter(r => r.status === "rejected").length,
      fulfilledRequests: requisitions.filter(r => r.status === "fulfilled").length,
      totalLiters: requisitions
        .filter(r => r.status === "approved" || r.status === "fulfilled")
        .reduce((sum, r) => sum + parseFloat(r.quantity || "0"), 0),
    };
  }

  async getRequisitionsByDepartment(): Promise<{ department: string; count: number; totalLiters: number }[]> {
    const requisitions = Array.from(this.fuelRequisitions.values());
    const departmentMap = new Map<string, { count: number; totalLiters: number }>();

    requisitions.forEach(req => {
      const department = `Dept${req.requesterId}`;
      const current = departmentMap.get(department) || { count: 0, totalLiters: 0 };
      current.count += 1;
      if (req.status === "approved" || req.status === "fulfilled") {
        current.totalLiters += parseFloat(req.quantity || "0");
      }
      departmentMap.set(department, current);
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
        current.totalLiters += parseFloat(req.quantity || "0");
      }
      fuelTypeMap.set(req.fuelType, current);
    });

    return Array.from(fuelTypeMap.entries()).map(([fuelType, data]) => ({
      fuelType,
      ...data,
    }));
  }

  async getFuelEfficiencyStats(): Promise<{ vehiclePlate: string; vehicleModel: string; totalKmRodado: number; totalLiters: number; kmPerLiter: number }[]> {
    const requisitions = Array.from(this.fuelRequisitions.values()).filter(
      req => req.status === "approved" || req.status === "fulfilled"
    );
    const vehicles = Array.from(this.vehicles.values());
    const vehicleMap = new Map<number, { totalKmRodado: number; totalLiters: number; plate: string; model: string }>();

    requisitions.forEach(req => {
      if (!req.quantity || !req.kmRodado) return;
      
      const vehicle = vehicles.find(v => v.id === req.vehicleId);
      if (!vehicle) return;

      const current = vehicleMap.get(req.vehicleId) || { 
        totalKmRodado: 0, 
        totalLiters: 0, 
        plate: vehicle.plate,
        model: vehicle.model 
      };
      
      current.totalKmRodado += parseFloat(req.kmRodado);
      current.totalLiters += parseFloat(req.quantity);
      vehicleMap.set(req.vehicleId, current);
    });

    return Array.from(vehicleMap.values())
      .filter(data => data.totalLiters > 0)
      .map(data => ({
        vehiclePlate: data.plate,
        vehicleModel: data.model,
        totalKmRodado: data.totalKmRodado,
        totalLiters: data.totalLiters,
        kmPerLiter: parseFloat((data.totalKmRodado / data.totalLiters).toFixed(2))
      }))
      .sort((a, b) => b.kmPerLiter - a.kmPerLiter);
  }

  // Data cleanup methods
  async cleanupRequisitions(): Promise<number> {
    const count = this.fuelRequisitions.size;
    this.fuelRequisitions.clear();
    this.currentRequisitionId = 1;
    return count;
  }

  async cleanupVehicles(): Promise<number> {
    const count = this.vehicles.size;
    this.vehicles.clear();
    this.currentVehicleId = 1;
    return count;
  }

  async cleanupSuppliers(): Promise<number> {
    const count = this.suppliers.size;
    this.suppliers.clear();
    this.currentSupplierId = 1;
    return count;
  }

  async cleanupCompanies(): Promise<number> {
    const count = this.companies.size;
    this.companies.clear();
    this.currentCompanyId = 1;
    return count;
  }
}

export const storage = new MemStorage();