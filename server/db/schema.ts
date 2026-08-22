import { pgTable, unique, serial, varchar, text, timestamp, foreignKey, integer, numeric, date, boolean, check } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const facilities = pgTable("facilities", {
	id: serial().primaryKey().notNull(),
	facilityCode: varchar("facility_code", { length: 50 }).notNull(),
	facilityName: varchar("facility_name", { length: 255 }).notNull(),
	facilityAddress: text("facility_address"),
	facilityNumber: varchar("facility_number", { length: 50 }),
	facilityEmail: varchar("facility_email", { length: 255 }),
	facilitiesStatus: varchar("facilities_status", { length: 50 }).default('active'),
	contractState: varchar("contract_state", { length: 50 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	unique("facilities_facility_code_key").on(table.facilityCode),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id", { length: 50 }).notNull(),
	googleId: varchar("google_id", { length: 100 }),
	userName: varchar("user_name", { length: 100 }).notNull(),
	userEmail: varchar("user_email", { length: 255 }).notNull(),
	facilityCode: varchar("facility_code", { length: 50 }),
	userRole: varchar("user_role", { length: 50 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	password: varchar({ length: 255 }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.facilityCode],
			foreignColumns: [facilities.facilityCode],
			name: "users_facility_code_fkey"
		}),
	unique("users_user_id_key").on(table.userId),
	unique("users_google_id_key").on(table.googleId),
	unique("users_user_email_key").on(table.userEmail),
]);

export const inspectionItems = pgTable("inspection_items", {
	id: serial().primaryKey().notNull(),
	facilityCode: varchar("facility_code", { length: 50 }),
	equipmentType: varchar("equipment_type", { length: 100 }),
	equipmentModel: varchar("equipment_model", { length: 100 }),
	inspectionItemId: varchar("inspection_item_id", { length: 50 }).notNull(),
	inspectionItem: varchar("inspection_item", { length: 255 }).notNull(),
	inspectionItemDescription: text("inspection_item_description"),
	inspectionComponentType: varchar("inspection_component_type", { length: 50 }),
	inspectionSortNumber: integer("inspection_sort_number"),
	inspectionItemCategory: text("inspection_item_category").notNull(),
	inspectionType: text("inspection_type").notNull(),
	min: numeric(),
	max: numeric(),
	suffix: varchar({ length: 255 }),
	lowerlimit: numeric(),
	upperlimit: numeric(),
}, (table) => [
	foreignKey({
			columns: [table.facilityCode],
			foreignColumns: [facilities.facilityCode],
			name: "inspection_items_facility_code_fkey"
		}),
	unique("inspection_items_inspection_item_id_key").on(table.inspectionItemId),
]);

export const inspectionResults = pgTable("inspection_results", {
	id: serial().primaryKey().notNull(),
	resultId: varchar("result_id", { length: 100 }).notNull(),
	inspectionItemId: varchar("inspection_item_id", { length: 50 }),
	equipmentSerialNumber: varchar("equipment_serial_number", { length: 100 }),
	equipmentId: varchar("equipment_id", { length: 50 }),
	inspectionDate: timestamp("inspection_date", { mode: 'string' }).notNull(),
	userId: varchar("user_id", { length: 50 }),
	facilityCode: varchar("facility_code", { length: 50 }),
	result: varchar({ length: 50 }).notNull(),
	resultNotes: text("result_notes"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.facilityCode],
			foreignColumns: [facilities.facilityCode],
			name: "inspection_results_facility_code_fkey"
		}),
	foreignKey({
			columns: [table.inspectionItemId],
			foreignColumns: [inspectionItems.inspectionItemId],
			name: "inspection_results_inspection_item_id_fkey"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.userId],
			name: "inspection_results_user_id_fkey"
		}),
	foreignKey({
			columns: [table.equipmentId, table.facilityCode],
			foreignColumns: [equipmentLedger.equipmentId, equipmentLedger.facilityCode],
			name: "inspection_results_equipment_id_fkey"
		}),
	unique("inspection_results_result_id_key").on(table.resultId),
]);

export const invitations = pgTable("invitations", {
	id: serial().primaryKey().notNull(),
	inviteCode: varchar("invite_code", { length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	facilityCode: varchar("facility_code", { length: 50 }).notNull(),
	userRole: varchar("user_role", { length: 50 }).default('general'),
	invitedByUserId: varchar("invited_by_user_id", { length: 50 }),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	unique("invitations_invite_code_key").on(table.inviteCode),
]);

export const equipmentLedger = pgTable("equipment_ledger", {
	id: serial().primaryKey().notNull(),
	equipmentId: varchar("equipment_id", { length: 50 }).notNull(),
	equipmentName: varchar("equipment_name", { length: 255 }).notNull(),
	equipmentModel: varchar("equipment_model", { length: 100 }),
	equipmentManufacturer: varchar("equipment_manufacturer", { length: 100 }),
	equipmentSerialNumber: varchar("equipment_serial_number", { length: 100 }),
	equipmentType: varchar("equipment_type", { length: 100 }),
	facilityCode: varchar("facility_code", { length: 50 }),
	acquisitionDate: date("acquisition_date"),
	equipmentStatus: varchar("equipment_status", { length: 50 }).default('active'),
	equipmentNotes: text("equipment_notes"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	equipmentMaintenanceContract: varchar("equipment_maintenance_contract", { length: 255 }),
	equipmentStorageLocation: varchar("equipment_storage_location", { length: 255 }),
	loanStatus: varchar("loan_status", { length: 50 }).default('active'),
}, (table) => [
	foreignKey({
			columns: [table.facilityCode],
			foreignColumns: [facilities.facilityCode],
			name: "equipment_ledger_facility_code_fkey"
		}),
	unique("equipment_ledger_equipment_id_facility_code_key").on(table.equipmentId, table.facilityCode),
]);

export const userNotifications = pgTable("user_notifications", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id", { length: 50 }),
	announcementId: integer("announcement_id"),
	isViewed: boolean("is_viewed").default(false),
	viewedAt: timestamp("viewed_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.userId],
			name: "user_notifications_user_id_fkey"
		}),
]);

export const announcements = pgTable("announcements", {
	id: serial().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	message: text().notNull(),
	importanceLevel: varchar("importance_level", { length: 50 }).default('normal').notNull(),
	isActive: boolean("is_active").default(true),
	startsAt: timestamp("starts_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	audience: varchar({ length: 50 }).default('all').notNull(),
});

export const issues = pgTable("issues", {
	issueId: varchar("issue_id", { length: 50 }).primaryKey().notNull(),
	reportedDate: timestamp("reported_date", { mode: 'string' }).notNull(),
	reporter: varchar({ length: 255 }).notNull(),
	facilityCode: varchar("facility_code", { length: 50 }).notNull(),
	equipmentId: varchar("equipment_id", { length: 50 }).notNull(),
	location: varchar({ length: 255 }),
	description: text().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.facilityCode],
			foreignColumns: [facilities.facilityCode],
			name: "fk_facility_code"
		}),
	foreignKey({
			columns: [table.facilityCode, table.equipmentId],
			foreignColumns: [equipmentLedger.equipmentId, equipmentLedger.facilityCode],
			name: "fk_equipment_id"
		}),
]);

export const employees = pgTable("employees", {
	id: serial().primaryKey().notNull(),
	facilityCode: varchar("facility_code", { length: 50 }).notNull(),
	employeeCode: integer("employee_code").notNull(),
	department: varchar({ length: 100 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.facilityCode],
			foreignColumns: [facilities.facilityCode],
			name: "employees_facility_code_fkey"
		}),
	unique("employees_facility_code_employee_code_key").on(table.facilityCode, table.employeeCode),
	check("employees_employee_code_check", sql`employee_code > 0`),
]);

export const equipmentLoans = pgTable("equipment_loans", {
	id: serial().primaryKey().notNull(),
	facilityCode: varchar("facility_code", { length: 50 }).notNull(),
	equipmentId: varchar("equipment_id", { length: 50 }).notNull(),
	loanLocation: varchar("loan_location", { length: 255 }).notNull(),
	loanDate: timestamp("loan_date", { mode: 'string' }).notNull(),
	loanedBy: integer("loaned_by").notNull(),
	returnDate: timestamp("return_date", { mode: 'string' }),
	returnedBy: integer("returned_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	returnLocation: varchar("return_location", { length: 255 }).default(sql`NULL`),
}, (table) => [
	foreignKey({
			columns: [table.facilityCode],
			foreignColumns: [facilities.facilityCode],
			name: "equipment_loans_facility_code_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.facilityCode, table.equipmentId],
			foreignColumns: [equipmentLedger.equipmentId, equipmentLedger.facilityCode],
			name: "equipment_loans_equipment_id_fkey"
		}),
]);
