const XLSX = require('xlsx');
const DatabaseManager = require('./src/services/databaseManager');
const path = require('path');
const fs = require('fs');

/**
 * Complete Excel to Database Importer
 * Reads ENTIRE Excel file and imports ALL data to database
 * Clears existing data first if requested
 */
class ExcelToDatabaseImporter {
  constructor() {
    this.db = new DatabaseManager();
    this.importStats = {
      totalProcessed: 0,
      totalInserted: 0,
      totalUpdated: 0,
      totalSkipped: 0,
      errors: []
    };
  }

  /**
   * Main import function - processes the entire Excel file
   * @param {string} filePath - Path to Excel file
   * @param {boolean} clearExisting - Whether to clear existing data first
   */
  async importExcelToDatabase(filePath, clearExisting = true) {
    console.log('🚀 Starting Complete Excel to Database Import');
    console.log('===============================================');
    
    try {
      // Connect to database
      console.log('\n1️⃣ Connecting to database...');
      await this.db.connect();
      
      // Create table if not exists
      console.log('\n2️⃣ Setting up database table...');
      await this.db.createOrganizationTable();
      
      // Clear existing data if requested
      if (clearExisting) {
        console.log('\n3️⃣ Clearing existing data...');
        await this.clearExistingData();
      }
      
      // Read and validate Excel file
      console.log('\n4️⃣ Reading Excel file...');
      const excelData = await this.readExcelFile(filePath);
      
      // Map Excel columns to database fields
      console.log('\n5️⃣ Mapping Excel columns...');
      const mappedData = this.mapExcelToDatabase(excelData);
      
      // Import all data to database
      console.log('\n6️⃣ Importing ALL data to database...');
      await this.importAllDataToDatabase(mappedData);
      
      // Verify import
      console.log('\n7️⃣ Verifying import...');
      await this.verifyImport();
      
      console.log('\n✅ Import completed successfully!');
      console.log('=================================');
      console.log(`📊 Final Statistics:`);
      console.log(`   📝 Total Processed: ${this.importStats.totalProcessed}`);
      console.log(`   ➕ Total Inserted: ${this.importStats.totalInserted}`);
      console.log(`   🔄 Total Updated: ${this.importStats.totalUpdated}`);
      console.log(`   ⏭️ Total Skipped: ${this.importStats.totalSkipped}`);
      if (this.importStats.errors.length > 0) {
        console.log(`   ❌ Errors: ${this.importStats.errors.length}`);
      }
      
      return {
        success: true,
        stats: this.importStats
      };
      
    } catch (error) {
      console.error('\n❌ Import failed:', error.message);
      console.error('Stack trace:', error.stack);
      return {
        success: false,
        error: error.message,
        stats: this.importStats
      };
    } finally {
      await this.db.disconnect();
    }
  }

  /**
   * Clear all existing data from organizational_units table
   */
  async clearExistingData() {
    try {
      const result = await this.db.executeQuery('SELECT COUNT(*) as count FROM organizational_units');
      const existingCount = result.recordset[0].count;
      
      if (existingCount > 0) {
        console.log(`   🗑️ Found ${existingCount} existing records - clearing...`);
        await this.db.executeQuery('DELETE FROM organizational_units');
        console.log(`   ✅ Cleared ${existingCount} existing records`);
      } else {
        console.log('   ℹ️ No existing data to clear');
      }
    } catch (error) {
      throw new Error(`Failed to clear existing data: ${error.message}`);
    }
  }

  /**
   * Read and parse Excel file completely
   * @param {string} filePath - Path to Excel file
   */
  async readExcelFile(filePath) {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`Excel file not found: ${filePath}`);
      }
      
      const fileStats = fs.statSync(filePath);
      console.log(`   📁 File: ${path.basename(filePath)}`);
      console.log(`   📊 Size: ${Math.round(fileStats.size / 1024 / 1024 * 100) / 100} MB`);
      
      // Read workbook
      const workbook = XLSX.read(fs.readFileSync(filePath), { type: 'buffer' });
      
      // Get first worksheet
      const sheetName = workbook.SheetNames[0];
      console.log(`   📋 Reading sheet: ${sheetName}`);
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON with headers - READ EVERYTHING
      const rawData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '',
        blankrows: false,
        range: 0 // Start from first row
      });

      if (rawData.length < 2) {
        throw new Error('Excel file must contain at least a header row and one data row');
      }

      console.log(`   ✅ Successfully read ${rawData.length - 1} data rows from Excel`);
      
      return {
        headers: rawData[0],
        dataRows: rawData.slice(1)
      };
      
    } catch (error) {
      throw new Error(`Failed to read Excel file: ${error.message}`);
    }
  }

  /**
   * Map Excel columns to database fields with flexible header matching
   * @param {Object} excelData - Excel data with headers and rows
   */
  mapExcelToDatabase(excelData) {
    const { headers, dataRows } = excelData;
    
    console.log(`   📋 Excel headers found: ${headers.join(', ')}`);
    
    // Map column indices - flexible matching for all possible columns
    const columnMap = this.createColumnMapping(headers);
    console.log(`   🗺️ Column mapping:`, columnMap);
    
    // Convert rows to database objects
    const mappedData = [];
    const skippedRows = [];
    
    dataRows.forEach((row, index) => {
      try {
        // Skip completely empty rows
        if (!row || row.length === 0 || row.every(cell => !cell || cell.toString().trim() === '')) {
          return;
        }
        
        const mappedRow = {
          // Core fields (required)
          objectDescription: this.getColumnValue(row, columnMap.objectDescription),
          objectAbbr: this.getColumnValue(row, columnMap.objectAbbr),
          objectType: this.getColumnValue(row, columnMap.objectType),
          objectId: this.getColumnValue(row, columnMap.objectId),
          
          // Status and dates
          statusObject: this.getColumnValue(row, columnMap.statusObject),
          startDate: this.getColumnValue(row, columnMap.startDate),
          endDate: this.getColumnValue(row, columnMap.endDate),
          
          // Parent relationship fields
          parentRelationshipId: this.getColumnValue(row, columnMap.parentRelationshipId),
          parentRelationshipText: this.getColumnValue(row, columnMap.parentRelationshipText),
          parentRelationshipObjId: this.getColumnValue(row, columnMap.parentRelationshipObjId),
          parentRelationshipObjText: this.getColumnValue(row, columnMap.parentRelationshipObjText),
          
          // Relationship fields
          relationshipId: this.getColumnValue(row, columnMap.relationshipId),
          relationshipText: this.getColumnValue(row, columnMap.relationshipText),
          relationshipObj: this.getColumnValue(row, columnMap.relationshipObj),
          relationshipObjText: this.getColumnValue(row, columnMap.relationshipObjText),
          
          // Superior relationship fields
          relIdSup: this.getColumnValue(row, columnMap.relIdSup),
          relTextSup: this.getColumnValue(row, columnMap.relTextSup),
          relObjSup: this.getColumnValue(row, columnMap.relObjSup),
          relObjTextSup: this.getColumnValue(row, columnMap.relObjTextSup),
          
          // Cost center fields
          costCenterId: this.getColumnValue(row, columnMap.costCenterId),
          costCenterText: this.getColumnValue(row, columnMap.costCenterText),
          
          // Vacant status
          vacantStatus: this.getColumnValue(row, columnMap.vacantStatus),
          
          // Metadata
          rowIndex: index + 2 // +2 because we start from row 1 and skip header
        };
        
        // Validate required fields
        if (!mappedRow.objectId || mappedRow.objectId.trim() === '') {
          skippedRows.push(`Row ${index + 2}: Missing Object ID`);
          return;
        }
        
        mappedData.push(mappedRow);
        
      } catch (error) {
        const errorMsg = `Row ${index + 2}: ${error.message}`;
        skippedRows.push(errorMsg);
        this.importStats.errors.push(errorMsg);
      }
    });
    
    if (skippedRows.length > 0) {
      console.log(`   ⚠️ Skipped ${skippedRows.length} rows with issues:`);
      skippedRows.slice(0, 10).forEach(skip => console.log(`      - ${skip}`));
      if (skippedRows.length > 10) {
        console.log(`      ... and ${skippedRows.length - 10} more`);
      }
    }
    
    console.log(`   ✅ Successfully mapped ${mappedData.length} rows for database import`);
    this.importStats.totalProcessed = mappedData.length;
    
    return mappedData;
  }

  /**
   * Create flexible column mapping for all possible Excel column variations
   * @param {Array} headers - Excel headers
   */
  createColumnMapping(headers) {
    const columnMap = {};
    
    headers.forEach((header, index) => {
      const normalizedHeader = header.toString().toLowerCase().trim();
      
      // Object Description mapping
      if (normalizedHeader === 'object description') {
        columnMap.objectDescription = index;
      }
      // Object Abbreviation mapping
      else if (normalizedHeader === 'object abbr.' || normalizedHeader === 'object abbr') {
        columnMap.objectAbbr = index;
      }
      // Object Type mapping  
      else if (normalizedHeader === 'object type') {
        columnMap.objectType = index;
      }
      // Object ID mapping
      else if (normalizedHeader === 'object id') {
        columnMap.objectId = index;
      }
      // Status Object mapping
      else if (normalizedHeader === 'status (object)' || normalizedHeader === 'status object') {
        columnMap.statusObject = index;
      }
      // Start Date mapping
      else if (normalizedHeader === 'start date') {
        columnMap.startDate = index;
      }
      // End Date mapping
      else if (normalizedHeader === 'end date') {
        columnMap.endDate = index;
      }
      // Parent Relationship ID mapping
      else if (normalizedHeader === 'parent relationship id') {
        columnMap.parentRelationshipId = index;
      }
      // Parent Relationship Text mapping
      else if (normalizedHeader === 'parent relationship (text)' || normalizedHeader === 'parent relationship text') {
        columnMap.parentRelationshipText = index;
      }
      // Parent Relationship Object ID mapping
      else if (normalizedHeader === 'parent relationship obj id') {
        columnMap.parentRelationshipObjId = index;
      }
      // Parent Relationship Object Text mapping
      else if (normalizedHeader === 'parent relationship obj (text)' || normalizedHeader === 'parent relationship obj text') {
        columnMap.parentRelationshipObjText = index;
      }
      // Relationship ID mapping
      else if (normalizedHeader === 'relationship id') {
        columnMap.relationshipId = index;
      }
      // Relationship Text mapping
      else if (normalizedHeader === 'relationship (text)' || normalizedHeader === 'relationship text') {
        columnMap.relationshipText = index;
      }
      // Relationship Object mapping
      else if (normalizedHeader === 'relationship obj') {
        columnMap.relationshipObj = index;
      }
      // Relationship Object Text mapping
      else if (normalizedHeader === 'relationship obj (text)' || normalizedHeader === 'relationship obj text') {
        columnMap.relationshipObjText = index;
      }
      // Superior Relationship fields
      else if (normalizedHeader === 'rel id sup') {
        columnMap.relIdSup = index;
      }
      else if (normalizedHeader === 'rel text sup') {
        columnMap.relTextSup = index;
      }
      else if (normalizedHeader === 'rel obj sup') {
        columnMap.relObjSup = index;
      }
      else if (normalizedHeader === 'rel obj text sup') {
        columnMap.relObjTextSup = index;
      }
      // Cost Center fields
      else if (normalizedHeader === 'cost center id') {
        columnMap.costCenterId = index;
      }
      else if (normalizedHeader === 'cost center text') {
        columnMap.costCenterText = index;
      }
      // Vacant Status mapping
      else if (normalizedHeader === 'vacant status') {
        columnMap.vacantStatus = index;
      }
    });
    
    // Validate required columns exist
    const requiredFields = ['objectId', 'objectDescription', 'objectType'];
    const missingFields = requiredFields.filter(field => columnMap[field] === undefined);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required columns: ${missingFields.join(', ')}. Available headers: ${headers.join(', ')}`);
    }
    
    return columnMap;
  }

  /**
   * Get column value safely with null/undefined handling
   * @param {Array} row - Excel row data
   * @param {number} columnIndex - Column index
   */
  getColumnValue(row, columnIndex) {
    if (columnIndex === undefined || row[columnIndex] === undefined || row[columnIndex] === null) {
      return null;
    }
    const value = row[columnIndex].toString().trim();
    return value === '' ? null : value;
  }

  /**
   * Import all mapped data to database using batch processing
   * @param {Array} mappedData - Mapped data array
   */
  async importAllDataToDatabase(mappedData) {
    try {
      console.log(`   📊 Starting batch import of ${mappedData.length} records...`);
      
      // Use smaller batch size for very large datasets
      const batchSize = mappedData.length > 50000 ? 100 : 500;
      console.log(`   📦 Using batch size: ${batchSize} records per batch`);
      
      // Use batch insert from DatabaseManager
      const insertedCount = await this.db.batchInsertOrganizationalData(mappedData, batchSize);
      
      this.importStats.totalInserted = insertedCount;
      
      console.log(`   ✅ Successfully imported ${insertedCount} records to database`);
      
    } catch (error) {
      throw new Error(`Database import failed: ${error.message}`);
    }
  }

  /**
   * Verify the import by checking database statistics
   */
  async verifyImport() {
    try {
      const stats = await this.db.getTableStats();
      
      console.log(`   📊 Database verification:`);
      console.log(`      📁 Total records: ${stats.total_records}`);
      console.log(`      🏢 Organizations (O): ${stats.organizations}`);
      console.log(`      👥 Positions (S): ${stats.positions}`);
      console.log(`      ✅ Active records: ${stats.active_records}`);
      console.log(`      📅 First record: ${stats.first_record}`);
      console.log(`      📅 Last record: ${stats.last_record}`);
      
      if (stats.total_records !== this.importStats.totalInserted) {
        console.log(`   ⚠️ Warning: Expected ${this.importStats.totalInserted} but found ${stats.total_records} in database`);
      } else {
        console.log(`   ✅ Verification passed: All ${stats.total_records} records confirmed in database`);
      }
      
    } catch (error) {
      console.error(`   ❌ Verification failed: ${error.message}`);
    }
  }
}

/**
 * Command-line interface for running the importer
 */
async function runImporter() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📚 Excel to Database Importer Usage:');
    console.log('====================================');
    console.log('');
    console.log('node excel-to-database-importer.js <excel-file-path> [--keep-existing]');
    console.log('');
    console.log('Arguments:');
    console.log('  <excel-file-path>   Path to the Excel file to import');
    console.log('  --keep-existing     Don\'t clear existing data before import');
    console.log('');
    console.log('Examples:');
    console.log('  node excel-to-database-importer.js "EXPORT all OU(AutoRecovered).xlsx"');
    console.log('  node excel-to-database-importer.js "./data/org_data.xlsx" --keep-existing');
    console.log('');
    process.exit(0);
  }
  
  const excelFilePath = args[0];
  const keepExisting = args.includes('--keep-existing');
  const clearExisting = !keepExisting;
  
  console.log(`📁 Excel file: ${excelFilePath}`);
  console.log(`🗑️ Clear existing data: ${clearExisting ? 'Yes' : 'No'}`);
  console.log('');
  
  const importer = new ExcelToDatabaseImporter();
  const result = await importer.importExcelToDatabase(excelFilePath, clearExisting);
  
  if (result.success) {
    console.log('\n🎉 Import completed successfully!');
    process.exit(0);
  } else {
    console.log('\n💥 Import failed!');
    process.exit(1);
  }
}

// Export for programmatic use
module.exports = ExcelToDatabaseImporter;

// Run if called directly
if (require.main === module) {
  runImporter().catch(error => {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  });
}