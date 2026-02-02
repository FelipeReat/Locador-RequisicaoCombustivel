import { pgTable, text, serial, integer, timestamp, decimal, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  fullName: text("full_name"),
  departmentId: integer("department_id"),
  phone: text("phone"),
  position: text("position"),
  role: text("role").notNull().default("employee"),
  active: text("active").notNull().default("true"),
  hireDate: text("hire_date"),
  createdAt: text("created_at").notNull().default("now()"),
  updatedAt: text("updated_at").notNull().default("now()"),
});

export const vehicleTypes = pgTable("vehicle_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  active: boolean("active").notNull().default(true),
  createdAt: text("created_at").notNull().default("now()"),
  updatedAt: text("updated_at").notNull().default("now()"),
});

export const insertVehicleTypeSchema = createInsertSchema(vehicleTypes, {
  name: z.string().min(1, "Nome do tipo é obrigatório"),
  description: z.string().optional(),
}).omit({
  id: true,
  active: true,
  createdAt: true,
  updatedAt: true,
});

export type VehicleType = typeof vehicleTypes.$inferSelect;
export type InsertVehicleType = z.infer<typeof insertVehicleTypeSchema>;

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  plate: text("plate").notNull().unique(),
  model: text("model").notNull(),
  brand: text("brand").notNull(),
  year: integer("year").notNull(),
  fuelType: text("fuel_type").notNull(),
  mileage: text("mileage").default("0"),
  status: text("status").notNull().default("active"),
  companyId: integer("company_id"),
  vehicleTypeId: integer("vehicle_type_id"),
  lastMaintenance: text("last_maintenance"),
  nextMaintenance: text("next_maintenance"),
  createdAt: text("created_at").notNull().default("now()"),
  updatedAt: text("updated_at").notNull().default("now()"),
});

export const fuelRequisitions = pgTable("fuel_requisitions", {
  id: serial("id").primaryKey(),
  requesterId: integer("requester_id").notNull(),
  supplierId: integer("supplier_id").notNull(),
  client: text("client").notNull(),
  vehicleId: integer("vehicle_id").notNull(),
  kmAtual: text("km_atual").notNull(),
  kmAnterior: text("km_anterior").notNull(),
  kmRodado: text("km_rodado").notNull(),
  tanqueCheio: text("tanque_cheio").notNull().default("false"),
  fuelType: text("fuel_type").notNull(),
  quantity: text("quantity"),
  pricePerLiter: text("price_per_liter"),
  discount: text("discount"),
  fiscalCoupon: text("fiscal_coupon"),
  justification: text("justification"),
  requiredDate: text("required_date"),
  priority: text("priority").notNull().default("media"),
  status: text("status").notNull().default("pending"),
  approverId: integer("approver_id"),
  approvedDate: text("approved_date"),
  rejectionReason: text("rejection_reason"),
  purchaseOrderGenerated: text("purchase_order_generated").default("false"),
  createdAt: text("created_at").notNull().default("now()"),
  updatedAt: text("updated_at").notNull().default("now()"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Login schema for authentication
export const loginSchema = z.object({
  username: z.string().min(1, "Nome de usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export const insertUserManagementSchema = createInsertSchema(users, {
  username: z.string().min(1, "Nome de usuário é obrigatório"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  email: z.string().email("Email inválido").optional(),
  fullName: z.string().min(1, "Nome completo é obrigatório").optional(),
  departmentId: z.number().optional(),
  phone: z.string().optional(),
  position: z.string().optional(),
  role: z.enum(["admin", "manager", "employee", "driver"]).default("employee"),
}).omit({
  id: true,
  active: true,
  hireDate: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserManagementWithoutPasswordSchema = insertUserManagementSchema.omit({
  password: true,
});

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  fantasia: text("fantasia").notNull(),
  cnpj: text("cnpj").notNull().unique(),
  responsavel: text("responsavel").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  active: text("active").notNull().default("true"),
  createdAt: text("created_at").notNull().default("now()"),
  updatedAt: text("updated_at").notNull().default("now()"),
});

export const updateUserProfileSchema = createInsertSchema(users, {
  email: z.string().email("Email inválido").optional(),
  fullName: z.string().min(1, "Nome completo é obrigatório"),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos").optional(),
  position: z.string().min(1, "Cargo é obrigatório").optional(),
}).pick({
  email: true,
  fullName: true,
  phone: true,
  position: true,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Senha atual é obrigatória"),
  newPassword: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export const insertSupplierSchema = createInsertSchema(suppliers, {
  name: z.string().min(1, "Nome empresarial é obrigatório"),
  fantasia: z.string().min(1, "Nome fantasia é obrigatório"),
  cnpj: z.string().min(14, "CNPJ é obrigatório"),
  responsavel: z.string().min(1, "Responsável é obrigatório"),
}).omit({
  id: true,
  active: true,
  email: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVehicleSchema = createInsertSchema(vehicles, {
  plate: z.string().min(1, "Placa é obrigatória"),
  model: z.string().min(1, "Modelo é obrigatório"),
  brand: z.string().min(1, "Marca é obrigatória"),
  year: z.number().min(1900, "Ano inválido").max(new Date().getFullYear() + 1, "Ano inválido"),
  fuelType: z.enum(["gasolina", "etanol", "diesel", "diesel_s10", "flex"], {
    errorMap: () => ({ message: "Tipo de combustível inválido" }),
  }),
  mileage: z.string().optional(),
  companyId: z.number().nullable(),
  vehicleTypeId: z.number().nullable().optional(),
}).omit({
  id: true,
  status: true,
  lastMaintenance: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFuelRequisitionSchema = createInsertSchema(fuelRequisitions, {
  requesterId: z.number().min(1, "Responsável é obrigatório"),
  supplierId: z.number().min(1, "Fornecedor é obrigatório"),
  client: z.string().min(1, "Cliente é obrigatório"),
  vehicleId: z.number().min(1, "Veículo é obrigatório"),
  kmAtual: z.string().refine((val) => parseFloat(val) >= 0, {
    message: "KM atual deve ser maior ou igual a 0",
  }),
  kmAnterior: z.string().refine((val) => parseFloat(val) >= 0, {
    message: "KM anterior deve ser maior ou igual a 0",
  }),
  kmRodado: z.string().refine((val) => parseFloat(val) >= 0, {
    message: "KM rodado deve ser maior ou igual a 0",
  }),
  tanqueCheio: z.enum(["true", "false"]).default("false"),
  fuelType: z.enum(["gasolina", "etanol", "diesel", "diesel_s10", "flex"], {
    errorMap: () => ({ message: "Tipo de combustível inválido" }),
  }),
  quantity: z.string().optional().refine((val) => !val || parseFloat(val) > 0, {
    message: "Quantidade deve ser maior que 0 quando especificada",
  }),
}).omit({
  id: true,
  status: true,
  approverId: true,
  approvedDate: true,
  rejectionReason: true,
  createdAt: true,
  updatedAt: true,
});

export const updateFuelRequisitionStatusSchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "fulfilled"]),
  approver: z.string().optional(),
  rejectionReason: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginSchema>;
export type User = typeof users.$inferSelect;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
export type ChangePassword = z.infer<typeof changePasswordSchema>;
export type InsertUserManagement = z.infer<typeof insertUserManagementSchema>;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;
export type InsertFuelRequisition = z.infer<typeof insertFuelRequisitionSchema>;
export type FuelRequisition = typeof fuelRequisitions.$inferSelect;
export type UpdateFuelRequisitionStatus = z.infer<typeof updateFuelRequisitionStatusSchema>;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliers.$inferSelect;
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cnpj: text("cnpj").notNull().unique(),
  fullName: text("full_name").notNull(),
  contact: text("contact").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  active: text("active").notNull().default("true"),
  createdAt: text("created_at").notNull().default("now()"),
  updatedAt: text("updated_at").notNull().default("now()"),
});

export const insertCompanySchema = createInsertSchema(companies, {
  name: z.string().min(1, "Nome é obrigatório"),
  cnpj: z.string().min(14, "CNPJ é obrigatório"),
  fullName: z.string().min(1, "Nome empresarial é obrigatório"),
  contact: z.string().min(1, "Contato é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  email: z.string().email("Email inválido"),
}).omit({
  id: true,
  active: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;

// New fuel records table for vehicle check-in system
export const fuelRecords = pgTable("fuel_records", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull(),
  currentMileage: text("current_mileage").notNull(), // Quilometragem atual
  previousMileage: text("previous_mileage").notNull(), // Quilometragem anterior
  distanceTraveled: text("distance_traveled").notNull(), // Quilometragem rodada entre abastecimentos
  fuelType: text("fuel_type").notNull(),
  litersRefueled: text("liters_refueled").notNull(), // Litros abastecidos
  pricePerLiter: text("price_per_liter").notNull(), // Valor por litro
  totalCost: text("total_cost").notNull(),
  operatorId: integer("operator_id").notNull(),
  fuelStation: text("fuel_station"), // Posto de combustível
  notes: text("notes"), // Observações
  recordDate: text("record_date").notNull(),
  createdAt: text("created_at").notNull().default("now()"),
  updatedAt: text("updated_at").notNull().default("now()"),
});

export const insertFuelRecordSchema = createInsertSchema(fuelRecords, {
  vehicleId: z.number().min(1, "Veículo é obrigatório"),
  currentMileage: z.string().refine((val) => parseFloat(val) >= 0, {
    message: "Quilometragem atual deve ser maior ou igual a 0",
  }),
  previousMileage: z.string().refine((val) => parseFloat(val) >= 0, {
    message: "Quilometragem anterior deve ser maior ou igual a 0",
  }),
  distanceTraveled: z.string().refine((val) => parseFloat(val) >= 0, {
    message: "Distância rodada deve ser maior ou igual a 0",
  }),
  fuelType: z.enum(["gasolina", "etanol", "diesel", "diesel_s10", "flex"], {
    errorMap: () => ({ message: "Tipo de combustível inválido" }),
  }),
  litersRefueled: z.string().refine((val) => parseFloat(val) > 0, {
    message: "Litros abastecidos deve ser maior que 0",
  }),
  pricePerLiter: z.string().refine((val) => parseFloat(val) > 0, {
    message: "Preço por litro deve ser maior que 0",
  }),
  operatorId: z.number().min(1, "Operador é obrigatório"),
  recordDate: z.string().min(1, "Data do registro é obrigatória"),
}).omit({
  id: true,
  totalCost: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertFuelRecord = z.infer<typeof insertFuelRecordSchema>;
export type FuelRecord = typeof fuelRecords.$inferSelect;

// Sistema de auditoria para rastrear todas as alterações
export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  tableName: text("table_name").notNull(), // Nome da tabela afetada
  recordId: text("record_id").notNull(), // ID do registro afetado
  action: text("action").notNull(), // CREATE, UPDATE, DELETE
  oldValues: text("old_values"), // Valores anteriores (JSON)
  newValues: text("new_values"), // Valores novos (JSON)
  userId: integer("user_id"), // Usuário que fez a alteração
  timestamp: text("timestamp").notNull().default("now()"),
  description: text("description"), // Descrição da alteração
});

export type AuditLog = typeof auditLog.$inferSelect;

// Sistema de backup de dados críticos
export const dataBackups = pgTable("data_backups", {
  id: serial("id").primaryKey(),
  tableName: text("table_name").notNull(),
  backupData: text("backup_data").notNull(), // JSON com todos os dados
  backupDate: text("backup_date").notNull().default("now()"),
  description: text("description"),
});

export type DataBackup = typeof dataBackups.$inferSelect;

// Checklists de veículos (saída/retorno)
export const vehicleChecklists = pgTable("vehicle_checklists", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull(),
  userId: integer("user_id").notNull(),
  kmInitial: text("km_initial").notNull(),
  kmFinal: text("km_final"),
  fuelLevelStart: text("fuel_level_start").notNull(),
  fuelLevelEnd: text("fuel_level_end"),
  inspectionStart: text("inspection_start"),
  inspectionEnd: text("inspection_end"),
  status: text("status").notNull().default("open"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  createdAt: text("created_at").notNull().default("now()"),
  updatedAt: text("updated_at").notNull().default("now()"),
});

export type VehicleChecklist = typeof vehicleChecklists.$inferSelect;

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(), // JSON stringified
  updatedAt: text("updated_at").notNull().default("now()"),
});

export type AppSetting = typeof appSettings.$inferSelect;

export const userVehicleFavorites = pgTable("user_vehicle_favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  vehicleId: integer("vehicle_id").notNull(),
  createdAt: text("created_at").notNull().default("now()"),
});

export const insertUserVehicleFavoriteSchema = createInsertSchema(userVehicleFavorites, {
  userId: z.number().min(1),
  vehicleId: z.number().min(1),
}).omit({
  id: true,
  createdAt: true,
});

export type UserVehicleFavorite = typeof userVehicleFavorites.$inferSelect;
export type InsertUserVehicleFavorite = z.infer<typeof insertUserVehicleFavoriteSchema>;
