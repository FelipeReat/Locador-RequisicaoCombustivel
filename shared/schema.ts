import { pgTable, text, serial, integer, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const fuelRequisitions = pgTable("fuel_requisitions", {
  id: serial("id").primaryKey(),
  requester: text("requester").notNull(),
  department: text("department").notNull(),
  fuelType: text("fuel_type").notNull(),
  quantity: decimal("quantity").notNull(),
  justification: text("justification").notNull(),
  requiredDate: text("required_date").notNull(),
  priority: text("priority").notNull().default("media"),
  status: text("status").notNull().default("pending"),
  approver: text("approver"),
  approvedDate: text("approved_date"),
  rejectionReason: text("rejection_reason"),
  createdAt: text("created_at").notNull().default("now()"),
  updatedAt: text("updated_at").notNull().default("now()"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertFuelRequisitionSchema = createInsertSchema(fuelRequisitions, {
  requester: z.string().min(1, "Nome do solicitante é obrigatório"),
  department: z.enum(["logistica", "manutencao", "transporte", "operacoes"], {
    errorMap: () => ({ message: "Departamento inválido" }),
  }),
  fuelType: z.enum(["gasolina", "etanol", "diesel", "diesel_s10"], {
    errorMap: () => ({ message: "Tipo de combustível inválido" }),
  }),
  quantity: z.string().refine((val) => parseFloat(val) > 0, {
    message: "Quantidade deve ser maior que 0",
  }),
  justification: z.string().min(10, "Justificativa deve ter pelo menos 10 caracteres"),
  requiredDate: z.string().min(1, "Data necessária é obrigatória"),
  priority: z.enum(["baixa", "media", "alta", "urgente"]).default("media"),
}).omit({
  id: true,
  status: true,
  approver: true,
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
export type User = typeof users.$inferSelect;
export type InsertFuelRequisition = z.infer<typeof insertFuelRequisitionSchema>;
export type FuelRequisition = typeof fuelRequisitions.$inferSelect;
export type UpdateFuelRequisitionStatus = z.infer<typeof updateFuelRequisitionStatusSchema>;
