import { pgTable, serial, text, integer, unique, index, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const auditLog = pgTable("audit_log", {
	id: serial().primaryKey().notNull(),
	tableName: text("table_name").notNull(),
	recordId: text("record_id").notNull(),
	action: text().notNull(),
	oldValues: text("old_values"),
	newValues: text("new_values"),
	userId: integer("user_id"),
	timestamp: text().default('now()').notNull(),
	description: text(),
});

export const companies = pgTable("companies", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	cnpj: text().notNull(),
	fullName: text("full_name").notNull(),
	contact: text().notNull(),
	phone: text().notNull(),
	email: text().notNull(),
	active: text().default('true').notNull(),
	createdAt: text("created_at").default('now()').notNull(),
	updatedAt: text("updated_at").default('now()').notNull(),
}, (table) => [
	unique("companies_cnpj_unique").on(table.cnpj),
]);

export const dataBackups = pgTable("data_backups", {
	id: serial().primaryKey().notNull(),
	tableName: text("table_name").notNull(),
	backupData: text("backup_data").notNull(),
	backupDate: text("backup_date").default('now()').notNull(),
	description: text(),
});

export const fuelRecords = pgTable("fuel_records", {
	id: serial().primaryKey().notNull(),
	vehicleId: integer("vehicle_id").notNull(),
	currentMileage: text("current_mileage").notNull(),
	previousMileage: text("previous_mileage").notNull(),
	distanceTraveled: text("distance_traveled").notNull(),
	fuelType: text("fuel_type").notNull(),
	litersRefueled: text("liters_refueled").notNull(),
	pricePerLiter: text("price_per_liter").notNull(),
	totalCost: text("total_cost").notNull(),
	operatorId: integer("operator_id").notNull(),
	fuelStation: text("fuel_station"),
	notes: text(),
	recordDate: text("record_date").notNull(),
	createdAt: text("created_at").default('now()').notNull(),
	updatedAt: text("updated_at").default('now()').notNull(),
});

export const fuelRequisitions = pgTable("fuel_requisitions", {
	id: serial().primaryKey().notNull(),
	requesterId: integer("requester_id").notNull(),
	supplierId: integer("supplier_id").notNull(),
	client: text().notNull(),
	vehicleId: integer("vehicle_id").notNull(),
	kmAtual: text("km_atual").notNull(),
	kmAnterior: text("km_anterior").notNull(),
	kmRodado: text("km_rodado").notNull(),
	tanqueCheio: text("tanque_cheio").default('false').notNull(),
	fuelType: text("fuel_type").notNull(),
	quantity: text(),
	pricePerLiter: text("price_per_liter"),
	fiscalCoupon: text("fiscal_coupon"),
	justification: text(),
	requiredDate: text("required_date"),
	priority: text().default('media').notNull(),
	status: text().default('pending').notNull(),
	approverId: integer("approver_id"),
	approvedDate: text("approved_date"),
	rejectionReason: text("rejection_reason"),
	createdAt: text("created_at").default('now()').notNull(),
	updatedAt: text("updated_at").default('now()').notNull(),
	purchaseOrderGenerated: text("purchase_order_generated").default('false'),
	discount: text(),
});

export const suppliers = pgTable("suppliers", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	fantasia: text().notNull(),
	cnpj: text().notNull(),
	responsavel: text().notNull(),
	email: text(),
	phone: text(),
	address: text(),
	active: text().default('true').notNull(),
	createdAt: text("created_at").default('now()').notNull(),
	updatedAt: text("updated_at").default('now()').notNull(),
}, (table) => [
	unique("suppliers_cnpj_unique").on(table.cnpj),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	username: text().notNull(),
	password: text().notNull(),
	email: text(),
	fullName: text("full_name"),
	departmentId: integer("department_id"),
	phone: text(),
	position: text(),
	role: text().default('employee').notNull(),
	active: text().default('true').notNull(),
	hireDate: text("hire_date"),
	createdAt: text("created_at").default('now()').notNull(),
	updatedAt: text("updated_at").default('now()').notNull(),
}, (table) => [
	unique("users_username_unique").on(table.username),
]);

export const checklistTemplateItems = pgTable("checklist_template_items", {
	id: serial().primaryKey().notNull(),
	checklistTemplateId: integer("checklist_template_id").notNull(),
	key: text().notNull(),
	label: text().notNull(),
	defaultChecked: boolean("default_checked").default(false).notNull(),
	column: integer().default(1).notNull(),
	order: integer().default(0).notNull(),
	criticality: integer().default(0).notNull(),
	group: text().notNull(),
	active: boolean().default(true).notNull(),
	createdAt: text("created_at").default('now()').notNull(),
	updatedAt: text("updated_at").default('now()').notNull(),
}, (table) => [
	index("criticality_idx").using("btree", table.criticality.asc().nullsLast().op("int4_ops")),
]);

export const appSettings = pgTable("app_settings", {
	key: text().primaryKey().notNull(),
	value: text().notNull(),
	updatedAt: text("updated_at").default('now()').notNull(),
});

export const checklistTemplates = pgTable("checklist_templates", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	groups: text().array().default(["Geral", "Mecânica", "Elétrica", "Segurança", "Documentação", "Limpeza", "Acessórios"]).notNull(),
	active: boolean().default(true).notNull(),
	createdAt: text("created_at").default('now()').notNull(),
	updatedAt: text("updated_at").default('now()').notNull(),
}, (table) => [
	unique("checklist_templates_name_unique").on(table.name),
]);

export const vehicleTypes = pgTable("vehicle_types", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	active: boolean().default(true).notNull(),
	checklistTemplateId: integer("checklist_template_id"),
	createdAt: text("created_at").default('now()').notNull(),
	updatedAt: text("updated_at").default('now()').notNull(),
}, (table) => [
	unique("vehicle_types_name_unique").on(table.name),
]);

export const vehicleChecklists = pgTable("vehicle_checklists", {
	id: serial().primaryKey().notNull(),
	vehicleId: integer("vehicle_id").notNull(),
	userId: integer("user_id").notNull(),
	kmInitial: text("km_initial").notNull(),
	kmFinal: text("km_final"),
	fuelLevelStart: text("fuel_level_start").notNull(),
	fuelLevelEnd: text("fuel_level_end"),
	status: text().default('open').notNull(),
	startDate: text("start_date").notNull(),
	endDate: text("end_date"),
	createdAt: text("created_at").default('now()').notNull(),
	updatedAt: text("updated_at").default('now()').notNull(),
	inspectionStart: text("inspection_start"),
	inspectionEnd: text("inspection_end"),
	checklistTemplateId: integer("checklist_template_id"),
});

export const vehicles = pgTable("vehicles", {
	id: serial().primaryKey().notNull(),
	plate: text().notNull(),
	model: text().notNull(),
	brand: text().notNull(),
	year: integer().notNull(),
	fuelType: text("fuel_type").notNull(),
	mileage: text().default('0'),
	status: text().default('active').notNull(),
	lastMaintenance: text("last_maintenance"),
	nextMaintenance: text("next_maintenance"),
	createdAt: text("created_at").default('now()').notNull(),
	updatedAt: text("updated_at").default('now()').notNull(),
	companyId: integer("company_id"),
	vehicleTypeId: integer("vehicle_type_id"),
}, (table) => [
	unique("vehicles_plate_unique").on(table.plate),
]);

export const userVehicleFavorites = pgTable("user_vehicle_favorites", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	vehicleId: integer("vehicle_id").notNull(),
	createdAt: text("created_at").default('now()').notNull(),
});
