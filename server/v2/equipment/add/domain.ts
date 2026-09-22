import { z } from 'zod';

export const addEquipmentRequestSchema = z.object({
  equipment_id: z.string().min(1),
  equipment_name: z.string().min(1),
  equipment_model: z.string().optional(),
  equipment_manufacturer: z.string().optional(),
  equipment_serial_number: z.string().optional(),
  equipment_type: z.string().optional(),
  acquisition_date: z.string().nullable().optional(),
  equipment_status: z.string().optional(),
  equipment_notes: z.string().optional(),
  equipment_maintenance_contract: z.string().optional(),
  equipment_storage_location: z.string().optional(),
});
