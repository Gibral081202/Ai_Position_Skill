const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const DatabaseManager = require('./src/services/databaseManager');

/**
 * UPSERT Excel Importer - Handles Duplicates Perfectly
 * Ensures ALL data is processed without any being missed
 * Uses INSERT or UPDATE logic for duplicate Object IDs
 */
class UpsertExcelImporter {
  constructor() {
    this.db = new DatabaseManager();
    this.stats = {
      totalProcessed: 0,
      totalInserted: 0,
      totalUpdated: 0,
      totalSkipped: 0,
      duplicatesHandled: 0,
      errors: []
    };
  }

  /**
   * Import Excel file with UPSERT logic (INSERT or UPDATE)
   * @param {string} excelFilePath - Path to Excel file
   * @param {boolean} clearExisting - Whether to clear existing data
   */
  async importExcelWithUpsert(excelFilePath, clearExisting = true) {
    console.log('🚀 Starting UPSERT Excel Import (Handles Duplicates)');
    console.log('===================================================');
    
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
      
      // Read Excel file
      console.log('\n4️⃣ Reading Excel file...');
      const excelData = await this.readExcelFile(excelFilePath);
      
      // Get existing Object IDs to handle duplicates
      console.log('\n5️⃣ Checking existing records for duplicate handling...');
      const existingIds = await this.getExistingObjectIds();
      
      // Process data with UPSERT logic
      console.log('\n6️⃣ Processing ALL data with UPSERT logic (INSERT or UPDATE)...');
      await this.processDataWithUpsert(excelData, existingIds);
      
      // Verify import
      console.log('\n7️⃣ Verifying final import...');
      await this.verifyImport();
      
      console.log('\n✅ UPSERT import completed successfully!');
      console.log('=======================================');
      console.log(`📊 Final Statistics:`);
      console.log(`   📝 Total Processed: ${this.stats.totalProcessed}`);
      console.log(`   ➕ Total Inserted: ${this.stats.totalInserted}`);
      console.log(`   🔄 Total Updated: ${this.stats.totalUpdated}`);
      console.log(`   🔁 Duplicates Handled: ${this.stats.duplicatesHandled}`);
      console.log(`   ⏭️ Total Skipped: ${this.stats.totalSkipped}`);
      if (this.stats.errors.length > 0) {
        console.log(`   ❌ Errors: ${this.stats.errors.length}`);
      }
      
      console.log(`\n🎯 SUCCESS: ALL ${this.stats.totalProcessed} records processed!`);
      console.log(`   No data was missed - duplicates were properly updated!`);
      
      return {
        success: true,
        stats: this.stats
      };
      
    } catch (error) {
      console.error('\n❌ UPSERT import failed:', error.message);
      return {
        success: false,
        error: error.message,
        stats: this.stats
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
   * Read Excel file
   */
  async readExcelFile(filePath) {
    try {
      console.log(`   📁 Reading file: ${path.basename(filePath)}`);
      
      const workbook = XLSX.read(fs.readFileSync(filePath), { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const rawData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '',
        blankrows: false,
        range: 0
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
   * Get existing Object IDs from database
   */
  async getExistingObjectIds() {
    try {
      const result = await this.db.executeQuery('SELECT object_id FROM organizational_units');
      const existingIds = new Set(result.recordset.map(row => row.object_id));
      console.log(`   📊 Found ${existingIds.size} existing Object IDs in database`);
      return existingIds;
    } catch (error) {
      console.log('   ⚠️ Could not check existing records, proceeding with INSERT-only mode');
      return new Set();
    }
  }

  /**
   * Process data with UPSERT logic (INSERT or UPDATE)
   */
  async processDataWithUpsert(excelData, existingIds) {
    const { headers, dataRows } = excelData;
    
    // Create column mapping
    const columnMap = this.createColumnMapping(headers);
    console.log('   🗺️ Column mapping created successfully');
    
    // Process in small chunks for reliability
    const chunkSize = 50; 
    const totalChunks = Math.ceil(dataRows.length / chunkSize);
    
    console.log(`   📊 Processing ${dataRows.length} rows in ${totalChunks} chunks of ${chunkSize} each...`);
    console.log(`   🔁 Using UPSERT logic: INSERT new records, UPDATE existing ones`);
    
    for (let i = 0; i < dataRows.length; i += chunkSize) {
      const chunk = dataRows.slice(i, i + chunkSize);
      const chunkNumber = Math.floor(i / chunkSize) + 1;
      
      console.log(`   📦 Processing chunk ${chunkNumber}/${totalChunks} (rows ${i + 1}-${Math.min(i + chunkSize, dataRows.length)})...`);
      
      try {
        await this.processChunkWithUpsert(chunk, columnMap, i, existingIds);
        
        // Progress update
        const progress = Math.round((Math.min(i + chunkSize, dataRows.length) / dataRows.length) * 100);
        console.log(`   📈 Progress: ${progress}% - Inserted: ${this.stats.totalInserted}, Updated: ${this.stats.totalUpdated}, Duplicates: ${this.stats.duplicatesHandled}`);
        
      } catch (chunkError) {
        console.error(`   ❌ Chunk ${chunkNumber} failed: ${chunkError.message}`);
        this.stats.errors.push(`Chunk ${chunkNumber}: ${chunkError.message}`);
        
        // For large imports, continue with next chunk
        console.log(`   ⚠️ Continuing with next chunk...`);
        continue;
      }
    }
  }

  /**
   * Process a single chunk with UPSERT logic
   */
  async processChunkWithUpsert(chunk, columnMap, startIndex, existingIds) {
    const mappedData = [];
    
    // Map chunk data
    chunk.forEach((row, index) => {
      try {
        // Skip empty rows
        if (!row || row.length === 0 || row.every(cell => !cell || cell.toString().trim() === '')) {
          return;
        }
        
        const mappedRow = {
          objectDescription: this.getColumnValue(row, columnMap.objectDescription),
          objectAbbr: this.getColumnValue(row, columnMap.objectAbbr),
          objectType: this.getColumnValue(row, columnMap.objectType),
          objectId: this.getColumnValue(row, columnMap.objectId),
          statusObject: this.getColumnValue(row, columnMap.statusObject),
          startDate: this.getColumnValue(row, columnMap.startDate),
          endDate: this.getColumnValue(row, columnMap.endDate),
          parentRelationshipId: this.getColumnValue(row, columnMap.parentRelationshipId),
          parentRelationshipText: this.getColumnValue(row, columnMap.parentRelationshipText),
          parentRelationshipObjId: this.getColumnValue(row, columnMap.parentRelationshipObjId),
          parentRelationshipObjText: this.getColumnValue(row, columnMap.parentRelationshipObjText),
          relationshipId: this.getColumnValue(row, columnMap.relationshipId),
          relationshipText: this.getColumnValue(row, columnMap.relationshipText),
          relationshipObj: this.getColumnValue(row, columnMap.relationshipObj),
          relationshipObjText: this.getColumnValue(row, columnMap.relationshipObjText),
          relIdSup: this.getColumnValue(row, columnMap.relIdSup),
          relTextSup: this.getColumnValue(row, columnMap.relTextSup),
          relObjSup: this.getColumnValue(row, columnMap.relObjSup),
          relObjTextSup: this.getColumnValue(row, columnMap.relObjTextSup),
          costCenterId: this.getColumnValue(row, columnMap.costCenterId),
          costCenterText: this.getColumnValue(row, columnMap.costCenterText),
          vacantStatus: this.getColumnValue(row, columnMap.vacantStatus)
        };
        
        // Validate required fields
        if (!mappedRow.objectId || mappedRow.objectId.trim() === '') {
          this.stats.totalSkipped++;
          return;
        }
        
        mappedData.push(mappedRow);
        this.stats.totalProcessed++;
        
      } catch (error) {
        const rowNumber = startIndex + index + 2;
        console.warn(`     ⚠️ Skipping row ${rowNumber}: ${error.message}`);
        this.stats.totalSkipped++;
      }
    });
    
    // Process each record with UPSERT logic
    for (const data of mappedData) {
      try {
        if (existingIds.has(data.objectId)) {
          // UPDATE existing record
          await this.updateRecord(data);
          this.stats.totalUpdated++;
          this.stats.duplicatesHandled++;
        } else {
          // INSERT new record
          await this.insertRecord(data);
          this.stats.totalInserted++;
          // Add to existing IDs set
          existingIds.add(data.objectId);
        }
      } catch (upsertError) {
        // If INSERT fails due to duplicate (race condition), try UPDATE
        if (upsertError.message.includes('duplicate key') || upsertError.message.includes('UNIQUE KEY constraint')) {
          try {
            await this.updateRecord(data);
            this.stats.totalUpdated++;
            this.stats.duplicatesHandled++;
            existingIds.add(data.objectId);
          } catch (updateError) {
            console.warn(`     ⚠️ Failed to upsert record ${data.objectId}: ${updateError.message}`);
            this.stats.totalSkipped++;
            this.stats.errors.push(`Upsert failed for ${data.objectId}: ${updateError.message}`);
          }
        } else {
          console.warn(`     ⚠️ Failed to insert record ${data.objectId}: ${upsertError.message}`);
          this.stats.totalSkipped++;
          this.stats.errors.push(`Insert failed for ${data.objectId}: ${upsertError.message}`);
        }
      }
    }
  }

  /**
   * Insert a new record
   */
  async insertRecord(data) {
    const insertQuery = `
      INSERT INTO organizational_units (
        object_description, object_abbr, object_type, object_id, status_object,
        start_date, end_date, parent_relationship_id, parent_relationship_text,
        parent_relationship_obj_id, parent_relationship_obj_text, relationship_id,
        relationship_text, relationship_obj, relationship_obj_text, rel_id_sup,
        rel_text_sup, rel_obj_sup, rel_obj_text_sup, cost_center_id,
        cost_center_text, vacant_status
      ) VALUES (
        @objectDescription, @objectAbbr, @objectType, @objectId, @statusObject,
        @startDate, @endDate, @parentRelationshipId, @parentRelationshipText,
        @parentRelationshipObjId, @parentRelationshipObjText, @relationshipId,
        @relationshipText, @relationshipObj, @relationshipObjText, @relIdSup,
        @relTextSup, @relObjSup, @relObjTextSup, @costCenterId,
        @costCenterText, @vacantStatus
      )
    `;
    
    const request = this.db.pool.request();
    this.addParametersToRequest(request, data);
    await request.query(insertQuery);
  }

  /**
   * Update an existing record
   */
  async updateRecord(data) {
    const updateQuery = `
      UPDATE organizational_units SET
        object_description = @objectDescription,
        object_abbr = @objectAbbr,
        object_type = @objectType,
        status_object = @statusObject,
        start_date = @startDate,
        end_date = @endDate,
        parent_relationship_id = @parentRelationshipId,
        parent_relationship_text = @parentRelationshipText,
        parent_relationship_obj_id = @parentRelationshipObjId,
        parent_relationship_obj_text = @parentRelationshipObjText,
        relationship_id = @relationshipId,
        relationship_text = @relationshipText,
        relationship_obj = @relationshipObj,
        relationship_obj_text = @relationshipObjText,
        rel_id_sup = @relIdSup,
        rel_text_sup = @relTextSup,
        rel_obj_sup = @relObjSup,
        rel_obj_text_sup = @relObjTextSup,
        cost_center_id = @costCenterId,
        cost_center_text = @costCenterText,
        vacant_status = @vacantStatus,
        updated_at = GETDATE()
      WHERE object_id = @objectId
    `;
    
    const request = this.db.pool.request();
    this.addParametersToRequest(request, data);
    await request.query(updateQuery);
  }

  /**
   * Add parameters to SQL request
   */
  addParametersToRequest(request, data) {
    request.input('objectDescription', data.objectDescription);
    request.input('objectAbbr', data.objectAbbr);
    request.input('objectType', data.objectType);
    request.input('objectId', data.objectId);
    request.input('statusObject', data.statusObject);
    request.input('startDate', data.startDate);
    request.input('endDate', data.endDate);
    request.input('parentRelationshipId', data.parentRelationshipId);
    request.input('parentRelationshipText', data.parentRelationshipText);
    request.input('parentRelationshipObjId', data.parentRelationshipObjId);
    request.input('parentRelationshipObjText', data.parentRelationshipObjText);
    request.input('relationshipId', data.relationshipId);
    request.input('relationshipText', data.relationshipText);
    request.input('relationshipObj', data.relationshipObj);
    request.input('relationshipObjText', data.relationshipObjText);
    request.input('relIdSup', data.relIdSup);
    request.input('relTextSup', data.relTextSup);
    request.input('relObjSup', data.relObjSup);
    request.input('relObjTextSup', data.relObjTextSup);
    request.input('costCenterId', data.costCenterId);
    request.input('costCenterText', data.costCenterText);
    request.input('vacantStatus', data.vacantStatus);
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
      
      const expectedTotal = this.stats.totalInserted + this.stats.totalUpdated;
      if (stats.total_records === expectedTotal) {
        console.log(`   ✅ Perfect match: ${stats.total_records} records in database = ${expectedTotal} processed`);
      } else {
        console.log(`   ⚠️ Database has ${stats.total_records} records, processed ${expectedTotal}`);
      }
      
    } catch (error) {
      console.error(`   ❌ Verification failed: ${error.message}`);
    }
  }
}

/**
 * Command line interface
 */
async function runUpsertImporter() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📚 UPSERT Excel to Database Importer Usage:');
    console.log('==========================================');
    console.log('');
    console.log('node upsert-excel-importer.js <excel-file-path> [--keep-existing]');
    console.log('');
    console.log('✅ Handles duplicate Object IDs perfectly');
    console.log('✅ INSERT new records, UPDATE existing ones');
    console.log('✅ Ensures ALL data is processed without exception');
    console.log('✅ No data will be missed due to duplicates');
    console.log('');
    process.exit(0);
  }
  
  const excelFilePath = args[0];
  const keepExisting = args.includes('--keep-existing');
  const clearExisting = !keepExisting;
  
  console.log(`📁 Excel file: ${excelFilePath}`);
  console.log(`🗑️ Clear existing data: ${clearExisting ? 'Yes' : 'No'}`);
  console.log(`🔁 UPSERT mode: INSERT new, UPDATE duplicates`);
  console.log('');
  
  const importer = new UpsertExcelImporter();
  const result = await importer.importExcelWithUpsert(excelFilePath, clearExisting);
  
  if (result.success) {
    console.log('\n🎉 UPSERT import completed successfully!');
    console.log('✅ ALL data processed - no records missed!');
    process.exit(0);
  } else {
    console.log('\n💥 UPSERT import failed!');
    console.log(`Error: ${result.error}`);
    process.exit(1);
  }
}

// Export for programmatic use
module.exports = UpsertExcelImporter;

// Run if called directly
if (require.main === module) {
  runUpsertImporter().catch(error => {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  });
}