import { pgTable, text, serial, integer, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  active: text("active").notNull().default("true"),
  createdAt: text("created_at").notNull().default("now()"),
  updatedAt: text("updated_at").notNull().default("now()"),
});

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

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  plate: text("plate").notNull().unique(),
  model: text("model").notNull(),
  brand: text("brand").notNull(),
  year: integer("year").notNull(),
  fuelType: text("fuel_type").notNull(),
  mileage: decimal("mileage").default("0"),
  status: text("status").notNull().default("active"),
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
  justification: text("justification"),
  requiredDate: text("required_date"),
  priority: text("priority").notNull().default("media"),
  status: text("status").notNull().default("pending"),
  approverId: integer("approver_id"),
  approvedDate: text("approved_date"),
  rejectionReason: text("rejection_reason"),
  createdAt: text("created_at").notNull().default("now()"),
  updatedAt: text("updated_at").notNull().default("now()"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertUserManagementSchema = createInsertSchema(users, {
  username: z.string().min(1, "Nome de usuário é obrigatório"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  email: z.string().email("Email inválido").optional(),
  fullName: z.string().min(1, "Nome completo é obrigatório").optional(),
  departmentId: z.number().optional(),
  phone: z.string().optional(),
  position: z.string().optional(),
  role: z.enum(["admin", "manager", "employee"]).default("employee"),
  hireDate: z.string().optional(),
}).omit({
  id: true,
  active: true,
  createdAt: true,
  updatedAt: true,
});

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
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
  name: z.string().min(1, "Nome é obrigatório"),
  cnpj: z.string().min(14, "CNPJ é obrigatório"),
  responsavel: z.string().min(1, "Responsável é obrigatório"),
}).omit({
  id: true,
  active: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVehicleSchema = createInsertSchema(vehicles, {
  plate: z.string().min(1, "Placa é obrigatória"),
  model: z.string().min(1, "Modelo é obrigatório"),
  brand: z.string().min(1, "Marca é obrigatória"),
  year: z.number().min(1900, "Ano inválido").max(new Date().getFullYear() + 1, "Ano inválido"),
  fuelType: z.enum(["gasolina", "etanol", "diesel", "diesel_s10"], {
    errorMap: () => ({ message: "Tipo de combustível inválido" }),
  }),
  mileage: z.string().refine((val) => parseFloat(val) >= 0, {
    message: "Quilometragem deve ser maior ou igual a 0",
  }).optional(),
}).omit({
  id: true,
  status: true,
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
  fuelType: z.enum(["gasolina", "etanol", "diesel", "diesel_s10"], {
    errorMap: () => ({ message: "Tipo de combustível inválido" }),
  }),
  quantity: z.string().optional().refine((val) => !val || parseFloat(val) > 0, {
    message: "Quantidade deve ser maior que 0 quando especificada",
  }),
}).omit({
  id: true,
  departmentId: true,
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

export const insertDepartmentSchema = createInsertSchema(departments, {
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
}).omit({
  id: true,
  active: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
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
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Department = typeof departments.$inferSelect;