import 'dotenv/config';
import { db } from "../db";
import { appSettings, checklistTemplates, checklistTemplateItems, auditLog } from "@shared/schema";
import { eq } from "drizzle-orm";

async function migrateLegacyChecklists() {
  console.log("Starting legacy checklist migration...");

  try {
    // 1. Fetch legacy configuration
    const legacySetting = await db.query.appSettings.findFirst({
      where: eq(appSettings.key, "obs_config"),
    });

    if (!legacySetting) {
      console.log("No legacy configuration found (obs_config). Skipping migration.");
      process.exit(0);
      return;
    }

    let legacyConfig: any[];
    try {
      legacyConfig = JSON.parse(legacySetting.value);
    } catch (e) {
      console.error("Failed to parse legacy configuration JSON:", e);
      process.exit(1);
      return;
    }

    if (!Array.isArray(legacyConfig) || legacyConfig.length === 0) {
      console.log("Legacy configuration is empty or invalid format. Skipping.");
      process.exit(0);
      return;
    }

    console.log(`Found ${legacyConfig.length} legacy items to migrate.`);

    // 2. Start Transaction
    await db.transaction(async (tx: any) => {
      // Check if migration already happened (optional, but good safety)
      // We can check if a template with a specific name exists
      const existingTemplate = await tx.query.checklistTemplates.findFirst({
        where: eq(checklistTemplates.name, "Padrão (Migrado)"),
      });

      if (existingTemplate) {
        console.log("Migration seems to have already run (template 'Padrão (Migrado)' exists).");
        return;
      }

      // 3. Create Template
      const [newTemplate] = await tx.insert(checklistTemplates).values({
        name: "Padrão (Migrado)",
        description: "Template migrado automaticamente das configurações globais (obs_config)",
        active: true,
      }).returning();

      console.log(`Created new template: ${newTemplate.name} (ID: ${newTemplate.id})`);

      // 4. Create Items
      let orderCounter = 1;
      for (const item of legacyConfig) {
        // Validation: Ensure basic fields exist
        const key = item.key || `legacy_item_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const label = item.label || "Item sem nome";
        
        await tx.insert(checklistTemplateItems).values({
          checklistTemplateId: newTemplate.id,
          key: key,
          label: label,
          group: "Geral", // Default group for legacy items
          defaultChecked: !!item.defaultChecked,
          column: 1,
          order: orderCounter++,
          criticality: 0, // Default to low
          active: true,
        });
      }

      console.log(`Migrated ${orderCounter - 1} items.`);

      // 5. Audit Log
      await tx.insert(auditLog).values({
        tableName: "checklist_templates",
        recordId: String(newTemplate.id),
        action: "MIGRATE",
        oldValues: JSON.stringify(legacyConfig),
        newValues: JSON.stringify({ templateId: newTemplate.id, itemCount: orderCounter - 1 }),
        description: "Migração automática de checklist legado",
        timestamp: new Date().toISOString(),
      });

      // 6. Mark legacy setting as migrated (Rename key to avoid re-use but keep backup)
      await tx.update(appSettings)
        .set({ key: "obs_config_migrated_" + Date.now() })
        .where(eq(appSettings.key, "obs_config"));
        
      console.log("Legacy setting renamed to prevent future use.");
    });

    console.log("Migration completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrateLegacyChecklists();
