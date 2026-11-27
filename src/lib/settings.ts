import "server-only";
import { prisma } from "./prisma";

export type AppSettings = {
  /** false = the company keeps no parts stock (everything is bought by / through the garage) */
  inventoryEnabled: boolean;
  /** outside-garage jobs need an invoice number before they can be closed */
  requireInvoiceForExternal: boolean;
};

export const DEFAULT_SETTINGS: AppSettings = { inventoryEnabled: true, requireInvoiceForExternal: true };

/** Company-wide settings (a single row; defaults until an admin saves them) */
export async function getAppSettings(): Promise<AppSettings> {
  const row = await prisma.appSetting.findUnique({ where: { id: 1 } });
  return row ? { inventoryEnabled: row.inventoryEnabled, requireInvoiceForExternal: row.requireInvoiceForExternal } : DEFAULT_SETTINGS;
}
