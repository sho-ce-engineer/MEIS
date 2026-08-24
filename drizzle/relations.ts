import { relations } from 'drizzle-orm/relations';
import {
  facilities,
  users,
  inspectionItems,
  inspectionResults,
  equipmentLedger,
  userNotifications,
  issues,
  employees,
  equipmentLoans,
} from '../server/db/schema';

export const usersRelations = relations(users, ({ one, many }) => ({
  facility: one(facilities, {
    fields: [users.facilityCode],
    references: [facilities.facilityCode],
  }),
  inspectionResults: many(inspectionResults),
  userNotifications: many(userNotifications),
}));

export const facilitiesRelations = relations(facilities, ({ many }) => ({
  users: many(users),
  inspectionItems: many(inspectionItems),
  inspectionResults: many(inspectionResults),
  equipmentLedgers: many(equipmentLedger),
  issues: many(issues),
  employees: many(employees),
  equipmentLoans: many(equipmentLoans),
}));

export const inspectionItemsRelations = relations(
  inspectionItems,
  ({ one, many }) => ({
    facility: one(facilities, {
      fields: [inspectionItems.facilityCode],
      references: [facilities.facilityCode],
    }),
    inspectionResults: many(inspectionResults),
  }),
);

export const inspectionResultsRelations = relations(
  inspectionResults,
  ({ one }) => ({
    facility: one(facilities, {
      fields: [inspectionResults.facilityCode],
      references: [facilities.facilityCode],
    }),
    inspectionItem: one(inspectionItems, {
      fields: [inspectionResults.inspectionItemId],
      references: [inspectionItems.inspectionItemId],
    }),
    user: one(users, {
      fields: [inspectionResults.userId],
      references: [users.userId],
    }),
    equipmentLedger: one(equipmentLedger, {
      fields: [inspectionResults.equipmentId],
      references: [equipmentLedger.equipmentId],
    }),
  }),
);

export const equipmentLedgerRelations = relations(
  equipmentLedger,
  ({ one, many }) => ({
    inspectionResults: many(inspectionResults),
    facility: one(facilities, {
      fields: [equipmentLedger.facilityCode],
      references: [facilities.facilityCode],
    }),
    issues: many(issues),
    equipmentLoans: many(equipmentLoans),
  }),
);

export const userNotificationsRelations = relations(
  userNotifications,
  ({ one }) => ({
    user: one(users, {
      fields: [userNotifications.userId],
      references: [users.userId],
    }),
  }),
);

export const issuesRelations = relations(issues, ({ one }) => ({
  facility: one(facilities, {
    fields: [issues.facilityCode],
    references: [facilities.facilityCode],
  }),
  equipmentLedger: one(equipmentLedger, {
    fields: [issues.facilityCode],
    references: [equipmentLedger.equipmentId],
  }),
}));

export const employeesRelations = relations(employees, ({ one }) => ({
  facility: one(facilities, {
    fields: [employees.facilityCode],
    references: [facilities.facilityCode],
  }),
}));

export const equipmentLoansRelations = relations(equipmentLoans, ({ one }) => ({
  facility: one(facilities, {
    fields: [equipmentLoans.facilityCode],
    references: [facilities.facilityCode],
  }),
  equipmentLedger: one(equipmentLedger, {
    fields: [equipmentLoans.facilityCode],
    references: [equipmentLedger.equipmentId],
  }),
}));
