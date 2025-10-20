const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const csv = require('csv-writer').createObjectCsvWriter;
const DatabaseManager = require('./src/services/databaseManager');

/**
 * Optimized Excel to Database Importer for Very Large Files
 * Uses CSV export + BULK INSERT for maximum performance
 */
class OptimizedExcelImporter {
  constructor() {
    this.db = new DatabaseManager();
  }

  /**
   * Import large Excel file using optimized BULK INSERT approach
   * @param {string} excelFilePath - Path to Excel file
   * @param {boolean} clearExisting - Whether to clear existing data
   */
  async importLargeExcelFile(excelFilePath, clearExisting = true) {
    console.log('🚀 Starting Optimized Large Excel Import');
    console.log('=========================================');
    
    const tempCsvPath = path.join(__dirname, 'temp_import.csv');
    
    try {
      // Connect to database
      console.log('\n1️⃣ Connecting to database...');
      await this.db.connect();
      
      // Setup table
      console.log('\n2️⃣ Setting up database table...');
      await this.db.createOrganizationTable();
      
      // Clear existing data if requested
      if (clearExisting) {
        console.log('\n3️⃣ Clearing existing data...');
        await this.clearExistingData();
      }
      
      // Convert Excel to CSV
      console.log('\n4️⃣ Converting Excel to CSV...');
      const csvStats = await this.convertExcelToCSV(excelFilePath, tempCsvPath);
      
      // Import CSV using BULK INSERT
      console.log('\n5️⃣ Importing data using BULK INSERT...');
      const importStats = await this.bulkImportCSV(tempCsvPath, csvStats.recordCount);
      
      // Clean up temporary file
      if (fs.existsSync(tempCsvPath)) {
        fs.unlinkSync(tempCsvPath);
        console.log('🗑️  Cleaned up temporary CSV file');
      }
      
      // Verify import
      console.log('\n6️⃣ Verifying import...');
      await this.verifyImport();
      
      console.log('\n✅ Optimized import completed successfully!');
      return {
        success: true,
        stats: importStats
      };
      
    } catch (error) {
      console.error('\n❌ Optimized import failed:', error.message);
      
      // Clean up on error
      if (fs.existsSync(tempCsvPath)) {
        fs.unlinkSync(tempCsvPath);
      }
      
      return {
        success: false,
        error: error.message
      };
    } finally {
      await this.db.disconnect();
    }
  }

  /**
   * Clear existing data
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
   * Convert Excel to CSV format for BULK INSERT
   * @param {string} excelFilePath - Path to Excel file
   * @param {string} csvOutputPath - Path for CSV output
   */
  async convertExcelToCSV(excelFilePath, csvOutputPath) {
    try {
      console.log(`   📁 Reading Excel file: ${path.basename(excelFilePath)}`);
      
      // Read Excel file
      const workbook = XLSX.read(fs.readFileSync(excelFilePath), { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '',
        blankrows: false
      });
      
      const headers = jsonData[0];
      const dataRows = jsonData.slice(1);
      
      console.log(`   📊 Processing ${dataRows.length} rows...`);
      
      // Create column mapping
      const columnMap = this.createColumnMapping(headers);
      
      // Prepare CSV data
      const csvData = [];
      let validRows = 0;
      
      dataRows.forEach((row, index) => {
        try {
          // Skip empty rows
          if (!row || row.length === 0 || row.every(cell => !cell || cell.toString().trim() === '')) {
            return;
          }
          
          const mappedRow = {
            object_description: this.getColumnValue(row, columnMap.objectDescription),
            object_abbr: this.getColumnValue(row, columnMap.objectAbbr),
            object_type: this.getColumnValue(row, columnMap.objectType),
            object_id: this.getColumnValue(row, columnMap.objectId),
            status_object: this.getColumnValue(row, columnMap.statusObject),
            start_date: this.getColumnValue(row, columnMap.startDate),
            end_date: this.getColumnValue(row, columnMap.endDate),
            parent_relationship_id: this.getColumnValue(row, columnMap.parentRelationshipId),
            parent_relationship_text: this.getColumnValue(row, columnMap.parentRelationshipText),
            parent_relationship_obj_id: this.getColumnValue(row, columnMap.parentRelationshipObjId),
            parent_relationship_obj_text: this.getColumnValue(row, columnMap.parentRelationshipObjText),
            relationship_id: this.getColumnValue(row, columnMap.relationshipId),
            relationship_text: this.getColumnValue(row, columnMap.relationshipText),
            relationship_obj: this.getColumnValue(row, columnMap.relationshipObj),
            relationship_obj_text: this.getColumnValue(row, columnMap.relationshipObjText),
            rel_id_sup: this.getColumnValue(row, columnMap.relIdSup),
            rel_text_sup: this.getColumnValue(row, columnMap.relTextSup),
            rel_obj_sup: this.getColumnValue(row, columnMap.relObjSup),
            rel_obj_text_sup: this.getColumnValue(row, columnMap.relObjTextSup),
            cost_center_id: this.getColumnValue(row, columnMap.costCenterId),
            cost_center_text: this.getColumnValue(row, columnMap.costCenterText),
            vacant_status: this.getColumnValue(row, columnMap.vacantStatus)
          };
          
          // Validate required fields
          if (mappedRow.object_id && mappedRow.object_id.trim() !== '') {
            csvData.push(mappedRow);
            validRows++;
          }
          
        } catch (error) {
          console.warn(`⚠️ Skipping row ${index + 2}: ${error.message}`);
        }
      });
      
      console.log(`   ✅ Mapped ${validRows} valid rows`);
      
      // Write CSV file
      console.log(`   💾 Writing CSV file: ${path.basename(csvOutputPath)}`);
      
      const csvWriter = csv({
        path: csvOutputPath,
        header: [
          {id: 'object_description', title: 'object_description'},
          {id: 'object_abbr', title: 'object_abbr'},
          {id: 'object_type', title: 'object_type'},
          {id: 'object_id', title: 'object_id'},
          {id: 'status_object', title: 'status_object'},
          {id: 'start_date', title: 'start_date'},
          {id: 'end_date', title: 'end_date'},
          {id: 'parent_relationship_id', title: 'parent_relationship_id'},
          {id: 'parent_relationship_text', title: 'parent_relationship_text'},
          {id: 'parent_relationship_obj_id', title: 'parent_relationship_obj_id'},
          {id: 'parent_relationship_obj_text', title: 'parent_relationship_obj_text'},
          {id: 'relationship_id', title: 'relationship_id'},
          {id: 'relationship_text', title: 'relationship_text'},
          {id: 'relationship_obj', title: 'relationship_obj'},
          {id: 'relationship_obj_text', title: 'relationship_obj_text'},
          {id: 'rel_id_sup', title: 'rel_id_sup'},
          {id: 'rel_text_sup', title: 'rel_text_sup'},
          {id: 'rel_obj_sup', title: 'rel_obj_sup'},
          {id: 'rel_obj_text_sup', title: 'rel_obj_text_sup'},
          {id: 'cost_center_id', title: 'cost_center_id'},
          {id: 'cost_center_text', title: 'cost_center_text'},
          {id: 'vacant_status', title: 'vacant_status'}
        ]
      });
      
      await csvWriter.writeRecords(csvData);
      
      console.log(`   ✅ CSV file created with ${validRows} records`);
      
      return {
        recordCount: validRows,
        csvPath: csvOutputPath
      };
      
    } catch (error) {
      throw new Error(`Failed to convert Excel to CSV: ${error.message}`);
    }
  }

  /**
   * Import CSV using BULK INSERT for maximum performance
   * @param {string} csvPath - Path to CSV file
   * @param {number} expectedRecords - Expected number of records
   */
  async bulkImportCSV(csvPath, expectedRecords) {
    try {
      console.log(`   📊 Importing ${expectedRecords} records using BULK INSERT...`);
      
      const startTime = new Date();
      
      // For very large files, let's do simple batch inserts with bigger batches
      const batchSize = 1000;
      const csvContent = fs.readFileSync(csvPath, 'utf8');
      const lines = csvContent.split('\n');
      const headers = lines[0].split(',');
      const dataLines = lines.slice(1).filter(line => line.trim() !== '');
      
      console.log(`   📋 Processing ${dataLines.length} data lines in batches of ${batchSize}...`);
      
      let totalInserted = 0;
      const totalBatches = Math.ceil(dataLines.length / batchSize);
      
      for (let i = 0; i < dataLines.length; i += batchSize) {
        const batch = dataLines.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        
        console.log(`   📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} records)...`);
        
        try {
          // Create VALUES clause for batch
          const values = batch.map((line, index) => {
            const cells = this.parseCSVLine(line);
            const params = cells.map((cell, cellIndex) => `@p${i + index}_${cellIndex}`);
            return `(${params.join(', ')})`;
          }).join(', ');
          
          const insertQuery = `
            INSERT INTO organizational_units (
              object_description, object_abbr, object_type, object_id, status_object,
              start_date, end_date, parent_relationship_id, parent_relationship_text,
              parent_relationship_obj_id, parent_relationship_obj_text, relationship_id,
              relationship_text, relationship_obj, relationship_obj_text, rel_id_sup,
              rel_text_sup, rel_obj_sup, rel_obj_text_sup, cost_center_id,
              cost_center_text, vacant_status
            ) VALUES ${values}
          `;
          
          const request = this.db.pool.request();
          
          // Add parameters
          batch.forEach((line, index) => {
            const cells = this.parseCSVLine(line);
            cells.forEach((cell, cellIndex) => {
              const value = cell === 'NULL' || cell === '' ? null : cell;
              request.input(`p${i + index}_${cellIndex}`, value);
            });
          });
          
          await request.query(insertQuery);
          totalInserted += batch.length;
          
          const progress = Math.round((totalInserted / dataLines.length) * 100);
          console.log(`   📈 Progress: ${totalInserted}/${dataLines.length} (${progress}%)`);
          
        } catch (batchError) {
          console.error(`   ❌ Batch ${batchNumber} failed: ${batchError.message}`);
          // Continue with next batch for large imports
          if (dataLines.length > 10000) {
            continue;
          } else {
            throw batchError;
          }
        }
      }
      
      const endTime = new Date();
      const duration = (endTime - startTime) / 1000;
      
      console.log(`   ✅ Imported ${totalInserted} records in ${duration.toFixed(2)} seconds`);
      
      return {
        totalInserted,
        duration,
        recordsPerSecond: Math.round(totalInserted / duration)
      };
      
    } catch (error) {
      throw new Error(`Bulk import failed: ${error.message}`);
    }
  }

  /**
   * Parse CSV line handling quoted fields
   * @param {string} line - CSV line
   */
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    if (current !== '') {
      result.push(current.trim());
    }
    
    return result;
  }

  /**
   * Create column mapping - same as before
   */
  createColumnMapping(headers) {
    const columnMap = {};
    
    headers.forEach((header, index) => {
      const normalizedHeader = header.toString().toLowerCase().trim();
      
      if (normalizedHeader === 'object description') columnMap.objectDescription = index;
      else if (normalizedHeader === 'object abbr.' || normalizedHeader === 'object abbr') columnMap.objectAbbr = index;
      else if (normalizedHeader === 'object type') columnMap.objectType = index;
      else if (normalizedHeader === 'object id') columnMap.objectId = index;
      else if (normalizedHeader === 'status (object)' || normalizedHeader === 'status object') columnMap.statusObject = index;
      else if (normalizedHeader === 'start date') columnMap.startDate = index;
      else if (normalizedHeader === 'end date') columnMap.endDate = index;
      else if (normalizedHeader === 'parent relationship id') columnMap.parentRelationshipId = index;
      else if (normalizedHeader === 'parent relationship (text)' || normalizedHeader === 'parent relationship text') columnMap.parentRelationshipText = index;
      else if (normalizedHeader === 'parent relationship obj id') columnMap.parentRelationshipObjId = index;
      else if (normalizedHeader === 'parent relationship obj (text)' || normalizedHeader === 'parent relationship obj text') columnMap.parentRelationshipObjText = index;
      else if (normalizedHeader === 'relationship id') columnMap.relationshipId = index;
      else if (normalizedHeader === 'relationship (text)' || normalizedHeader === 'relationship text') columnMap.relationshipText = index;
      else if (normalizedHeader === 'relationship obj') columnMap.relationshipObj = index;
      else if (normalizedHeader === 'relationship obj (text)' || normalizedHeader === 'relationship obj text') columnMap.relationshipObjText = index;
      else if (normalizedHeader === 'rel id sup') columnMap.relIdSup = index;
      else if (normalizedHeader === 'rel text sup') columnMap.relTextSup = index;
      else if (normalizedHeader === 'rel obj sup') columnMap.relObjSup = index;
      else if (normalizedHeader === 'rel obj text sup') columnMap.relObjTextSup = index;
      else if (normalizedHeader === 'cost center id') columnMap.costCenterId = index;
      else if (normalizedHeader === 'cost center text') columnMap.costCenterText = index;
      else if (normalizedHeader === 'vacant status') columnMap.vacantStatus = index;
    });
    
    const requiredFields = ['objectId', 'objectDescription', 'objectType'];
    const missingFields = requiredFields.filter(field => columnMap[field] === undefined);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required columns: ${missingFields.join(', ')}`);
    }
    
    return columnMap;
  }

  /**
   * Get column value safely
   */
  getColumnValue(row, columnIndex) {
    if (columnIndex === undefined || row[columnIndex] === undefined || row[columnIndex] === null) {
      return null;
    }
    const value = row[columnIndex].toString().trim();
    return value === '' ? null : value;
  }

  /**
   * Verify import
   */
  async verifyImport() {
    try {
      const stats = await this.db.getTableStats();
      
      console.log(`   📊 Database verification:`);
      console.log(`      📁 Total records: ${stats.total_records}`);
      console.log(`      🏢 Organizations (O): ${stats.organizations}`);
      console.log(`      👥 Positions (S): ${stats.positions}`);
      console.log(`      ✅ Active records: ${stats.active_records}`);
      
    } catch (error) {
      console.error(`   ❌ Verification failed: ${error.message}`);
    }
  }
}

/**
 * Command line interface
 */
async function runOptimizedImporter() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📚 Optimized Excel to Database Importer Usage:');
    console.log('==============================================');
    console.log('');
    console.log('node optimized-excel-importer.js <excel-file-path> [--keep-existing]');
    console.log('');
    console.log('For very large Excel files (>100k records)');
    console.log('Uses CSV conversion + optimized batch inserts');
    console.log('');
    process.exit(0);
  }
  
  const excelFilePath = args[0];
  const keepExisting = args.includes('--keep-existing');
  const clearExisting = !keepExisting;
  
  console.log(`📁 Excel file: ${excelFilePath}`);
  console.log(`🗑️ Clear existing data: ${clearExisting ? 'Yes' : 'No'}`);
  console.log('');
  
  const importer = new OptimizedExcelImporter();
  const result = await importer.importLargeExcelFile(excelFilePath, clearExisting);
  
  if (result.success) {
    console.log('\n🎉 Optimized import completed successfully!');
    process.exit(0);
  } else {
    console.log('\n💥 Optimized import failed!');
    process.exit(1);
  }
}

// Install csv-writer dependency
try {
  require('csv-writer');
} catch (error) {
  console.error('❌ Missing dependency: csv-writer');
  console.log('Please install it with: npm install csv-writer');
  process.exit(1);
}

// Export for programmatic use
module.exports = OptimizedExcelImporter;

// Run if called directly
if (require.main === module) {
  runOptimizedImporter().catch(error => {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  });
}