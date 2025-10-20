const DatabaseManager = require('./src/services/databaseManager');

async function testDatabaseSetup() {
  console.log('🧪 Testing Database Connection & Setup');
  console.log('=====================================');
  
  const db = new DatabaseManager();
  
  try {
    // Test connection
    console.log('\n1️⃣ Testing database connection...');
    await db.connect();
    
    // Test basic query
    console.log('\n2️⃣ Testing basic query...');
    const versionResult = await db.executeQuery('SELECT @@VERSION as sql_version, DB_NAME() as current_db');
    console.log(`✅ SQL Server Version: ${versionResult.recordset[0].sql_version.split('\n')[0]}`);
    console.log(`✅ Current Database: ${versionResult.recordset[0].current_db}`);
    
    // Test table creation
    console.log('\n3️⃣ Creating organizational_units table...');
    await db.createOrganizationTable();
    
    // Check table structure
    console.log('\n4️⃣ Verifying table structure...');
    const tableInfoQuery = `
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        CHARACTER_MAXIMUM_LENGTH,
        IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'organizational_units'
      ORDER BY ORDINAL_POSITION
    `;
    
    const tableInfo = await db.executeQuery(tableInfoQuery);
    
    if (tableInfo.recordset.length > 0) {
      console.log('✅ Table structure:');
      tableInfo.recordset.forEach(col => {
        const length = col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : '';
        const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
        console.log(`   📋 ${col.COLUMN_NAME}: ${col.DATA_TYPE}${length} ${nullable}`);
      });
    } else {
      console.error('❌ Table was not created properly');
      return false;
    }
    
    // Test indexes
    console.log('\n5️⃣ Checking indexes...');
    const indexQuery = `
      SELECT 
        i.name AS index_name,
        c.name AS column_name
      FROM sys.indexes i
      INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
      INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
      WHERE i.object_id = OBJECT_ID('organizational_units')
      AND i.type > 0
      ORDER BY i.name, ic.key_ordinal
    `;
    
    const indexes = await db.executeQuery(indexQuery);
    console.log('✅ Indexes created:');
    indexes.recordset.forEach(idx => {
      console.log(`   🔍 ${idx.index_name} on ${idx.column_name}`);
    });
    
    // Test sample insert
    console.log('\n6️⃣ Testing sample data insert...');
    const sampleData = {
      objectDescription: 'TEST - Sample Organization Unit',
      objectAbbr: 'TEST-OU',
      objectType: 'O',
      objectId: 'TEST-001',
      statusObject: 'Active',
      startDate: '2024-01-01',
      endDate: null,
      parentRelationshipId: null,
      parentRelationshipText: null,
      parentRelationshipObjId: null,
      parentRelationshipObjText: null,
      relationshipId: null,
      relationshipText: null,
      relationshipObj: null,
      relationshipObjText: null,
      relIdSup: null,
      relTextSup: null,
      relObjSup: null,
      relObjTextSup: null,
      costCenterId: 'CC-001',
      costCenterText: 'Test Cost Center',
      vacantStatus: 'N'
    };
    
    await db.insertOrganizationalData(sampleData);
    console.log('✅ Sample data inserted successfully');
    
    // Verify the insert
    const verifyQuery = "SELECT * FROM organizational_units WHERE object_id = 'TEST-001'";
    const verifyResult = await db.executeQuery(verifyQuery);
    
    if (verifyResult.recordset.length > 0) {
      console.log('✅ Sample data verified in database');
      const record = verifyResult.recordset[0];
      console.log(`   📋 ID: ${record.id}`);
      console.log(`   📋 Description: ${record.object_description}`);
      console.log(`   📋 Type: ${record.object_type}`);
      console.log(`   📋 Object ID: ${record.object_id}`);
      console.log(`   📋 Created: ${record.created_at}`);
    }
    
    // Clean up test data
    console.log('\n7️⃣ Cleaning up test data...');
    await db.executeQuery("DELETE FROM organizational_units WHERE object_id = 'TEST-001'");
    console.log('✅ Test data cleaned up');
    
    // Get final stats
    const stats = await db.getTableStats();
    console.log('\n📊 Current Database Stats:');
    console.log(`   📁 Total records: ${stats.total_records}`);
    console.log(`   🏢 Organizations (O): ${stats.organizations}`);
    console.log(`   👥 Positions (S): ${stats.positions}`);
    console.log(`   ✅ Active records: ${stats.active_records}`);
    
    console.log('\n🎉 All tests passed! Database is ready for Excel import.');
    return true;
    
  } catch (error) {
    console.error('\n❌ Database test failed:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  } finally {
    await db.disconnect();
  }
}

// Run the test
if (require.main === module) {
  testDatabaseSetup().then(success => {
    if (success) {
      console.log('\n✨ You can now run the Excel import with: node excel-importer.js');
    } else {
      console.log('\n💥 Please fix the database issues before importing Excel data.');
    }
    process.exit(success ? 0 : 1);
  });
}

module.exports = testDatabaseSetup;