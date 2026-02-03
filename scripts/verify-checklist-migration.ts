
import 'dotenv/config';
import { DatabaseStorage } from "../server/db-storage";

async function verify() {
  console.log("Verifying checklist migration...");
  
  const storage = new DatabaseStorage();
  
  // Explicitly call initialization to see logs and ensure it runs
  await storage.initializeChecklistTemplates();

  const templates = await storage.getChecklistTemplates();
  console.log(`Found ${templates.length} templates.`);
  
  if (templates.length > 0) {
    console.log("Template 0:", templates[0]);
    const items = await storage.getChecklistTemplateItems(templates[0].id);
    console.log(`Template 0 has ${items.length} items.`);
    if (items.length > 0) {
      console.log("Item 0:", items[0]);
    }
  } else {
    console.log("No templates found. Migration might not have run or no legacy config found.");
  }
  
  process.exit(0);
}

verify().catch(console.error);
