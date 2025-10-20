const DatabaseManager = require('./src/services/databaseManager');

async function analyzeHierarchy() {
  const db = new DatabaseManager();
  try {
    await db.connect();
    console.log('🔍 Analyzing organizational hierarchy structure...\n');

    // 1. Find root organizations (no parent or parent equals self)
    const rootQuery = `
      SELECT object_id, object_description, parent_relationship_obj_id 
      FROM organizational_units 
      WHERE object_type = 'O' 
      AND (parent_relationship_obj_id IS NULL 
           OR parent_relationship_obj_id = '' 
           OR parent_relationship_obj_id = object_id)
      ORDER BY object_description
    `;
    const rootResult = await db.executeQuery(rootQuery);
    console.log(`📍 ROOT ORGANIZATIONS (${rootResult.recordset.length}):`);
    rootResult.recordset.forEach(r => {
      console.log(`  - ${r.object_id}: ${r.object_description}`);
    });

    // 2. Check for "PRESIDENT OFFICE" specifically
    const presidentQuery = `
      SELECT object_id, object_description, parent_relationship_obj_id, parent_relationship_obj_text
      FROM organizational_units 
      WHERE object_type = 'O' 
      AND (object_description LIKE '%PRESIDENT%' OR object_id LIKE '%PRESIDENT%')
      ORDER BY object_description
    `;
    const presidentResult = await db.executeQuery(presidentQuery);
    console.log(`\n🏛️  PRESIDENT/OFFICE ORGANIZATIONS (${presidentResult.recordset.length}):`);
    presidentResult.recordset.forEach(r => {
      console.log(`  - ${r.object_id}: ${r.object_description} | Parent: ${r.parent_relationship_obj_id} (${r.parent_relationship_obj_text})`);
    });

    // 3. Check organizations that should be under President Office
    const childrenQuery = `
      SELECT TOP 10 object_id, object_description, parent_relationship_obj_id, parent_relationship_obj_text
      FROM organizational_units 
      WHERE object_type = 'O' 
      AND parent_relationship_obj_id IS NOT NULL 
      AND parent_relationship_obj_id != '' 
      AND parent_relationship_obj_id != object_id
      ORDER BY object_description
    `;
    const childrenResult = await db.executeQuery(childrenQuery);
    console.log(`\n👥 SAMPLE CHILD ORGANIZATIONS (Top 10 of ${childrenResult.recordset.length}):`);
    childrenResult.recordset.forEach(r => {
      console.log(`  - ${r.object_id}: ${r.object_description}`);
      console.log(`    Parent: ${r.parent_relationship_obj_id} (${r.parent_relationship_obj_text})`);
    });

    // 4. Check specific organizations from your image
    const specificQuery = `
      SELECT object_id, object_description, parent_relationship_obj_id, parent_relationship_obj_text
      FROM organizational_units 
      WHERE object_type = 'O' 
      AND (object_description LIKE '%TAX%CUSTOMS%' 
           OR object_description LIKE '%BRANCH%' 
           OR object_description LIKE '%POS KOVA%'
           OR object_description LIKE '%POS MAENANG%'
           OR object_description LIKE '%POS SIDAREJA%'
           OR object_description LIKE '%REMEDIAL%')
      ORDER BY object_description
    `;
    const specificResult = await db.executeQuery(specificQuery);
    console.log(`\n🎯 ORGANIZATIONS FROM YOUR IMAGE (${specificResult.recordset.length}):`);
    specificResult.recordset.forEach(r => {
      console.log(`  - ${r.object_id}: ${r.object_description}`);
      console.log(`    Parent: ${r.parent_relationship_obj_id} (${r.parent_relationship_obj_text})`);
    });

    await db.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

analyzeHierarchy();