require('dotenv').config({ path: '.env.local' });
const sql = require('mssql');

// Database configuration from .env.local
const dbConfig = {
  server: process.env.DATABASE_HOST || '127.0.0.1',
  port: parseInt(process.env.DATABASE_PORT) || 1435,
  database: process.env.DATABASE_NAME || 'organization_chart',
  user: process.env.DATABASE_USER || 'sqlvendor1',
  password: process.env.DATABASE_PASSWORD || '1U~xO`2Un-gGqmPj',
  pool: {
    max: parseInt(process.env.DATABASE_POOL_SIZE) || 5,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  options: {
    encrypt: false, // Set to true for Azure SQL Database
    trustServerCertificate: true, // For local development
    connectTimeout: parseInt(process.env.QUERY_TIMEOUT) * 1000 || 60000,
    requestTimeout: parseInt(process.env.QUERY_TIMEOUT) * 1000 || 300000, // 5 minutes
  }
};

class DatabaseManager {
  constructor() {
    this.pool = null;
  }

  async connect() {
    try {
      console.log('🔌 Connecting to SQL Server database...');
      console.log(`📍 Server: ${dbConfig.server}:${dbConfig.port}`);
      console.log(`🗄️  Database: ${dbConfig.database}`);
      
      this.pool = await sql.connect(dbConfig);
      console.log('✅ Database connection established successfully');
      return this.pool;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.pool) {
        await this.pool.close();
        console.log('🔌 Database connection closed');
      }
    } catch (error) {
      console.error('❌ Error closing database connection:', error.message);
    }
  }

  async executeQuery(query, params = []) {
    try {
      if (!this.pool) {
        await this.connect();
      }
      
      const request = this.pool.request();
      
      // Add parameters if provided
      params.forEach((param, index) => {
        request.input(`param${index}`, param);
      });
      
      const result = await request.query(query);
      return result;
    } catch (error) {
      console.error('❌ Query execution failed:', error.message);
      throw error;
    }
  }

  async createOrganizationTable() {
    const createTableQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='organizational_units' AND xtype='U')
      BEGIN
        CREATE TABLE organizational_units (
          id BIGINT IDENTITY(1,1) PRIMARY KEY,
          object_description NVARCHAR(500) NULL,
          object_abbr NVARCHAR(100) NULL,
          object_type NVARCHAR(10) NULL,
          object_id NVARCHAR(50) NOT NULL UNIQUE,
          status_object NVARCHAR(50) NULL,
          start_date NVARCHAR(20) NULL,
          end_date NVARCHAR(20) NULL,
          parent_relationship_id NVARCHAR(50) NULL,
          parent_relationship_text NVARCHAR(100) NULL,
          parent_relationship_obj_id NVARCHAR(50) NULL,
          parent_relationship_obj_text NVARCHAR(500) NULL,
          relationship_id NVARCHAR(50) NULL,
          relationship_text NVARCHAR(100) NULL,
          relationship_obj NVARCHAR(50) NULL,
          relationship_obj_text NVARCHAR(500) NULL,
          rel_id_sup NVARCHAR(50) NULL,
          rel_text_sup NVARCHAR(100) NULL,
          rel_obj_sup NVARCHAR(50) NULL,
          rel_obj_text_sup NVARCHAR(500) NULL,
          cost_center_id NVARCHAR(50) NULL,
          cost_center_text NVARCHAR(200) NULL,
          vacant_status NVARCHAR(10) NULL,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE()
        );
        
        -- Create indexes for performance
        CREATE INDEX IX_organizational_units_object_id ON organizational_units(object_id);
        CREATE INDEX IX_organizational_units_object_type ON organizational_units(object_type);
        CREATE INDEX IX_organizational_units_parent_id ON organizational_units(parent_relationship_obj_id);
        CREATE INDEX IX_organizational_units_status ON organizational_units(status_object);
        
        PRINT '✅ Created organizational_units table successfully';
      END
      ELSE
      BEGIN
        PRINT '⚠️  Table organizational_units already exists';
      END
    `;

    try {
      await this.executeQuery(createTableQuery);
      console.log('📋 Table creation/verification completed');
    } catch (error) {
      console.error('❌ Failed to create table:', error.message);
      throw error;
    }
  }

  async insertOrganizationalData(data) {
    const insertQuery = `
      INSERT INTO organizational_units (
        object_description, object_abbr, object_type, object_id, status_object,
        start_date, end_date, parent_relationship_id, parent_relationship_text,
        parent_relationship_obj_id, parent_relationship_obj_text, relationship_id,
        relationship_text, relationship_obj, relationship_obj_text, rel_id_sup,
        rel_text_sup, rel_obj_sup, rel_obj_text_sup, cost_center_id,
        cost_center_text, vacant_status
      ) VALUES (
        @param0, @param1, @param2, @param3, @param4, @param5, @param6, @param7,
        @param8, @param9, @param10, @param11, @param12, @param13, @param14,
        @param15, @param16, @param17, @param18, @param19, @param20, @param21
      )
    `;

    try {
      if (!this.pool) {
        await this.connect();
      }

      const request = this.pool.request();
      
      // Map all 22 columns from Excel to parameters
      request.input('param0', sql.NVarChar(500), data.objectDescription || null);
      request.input('param1', sql.NVarChar(100), data.objectAbbr || null);
      request.input('param2', sql.NVarChar(10), data.objectType || null);
      request.input('param3', sql.NVarChar(50), data.objectId);
      request.input('param4', sql.NVarChar(50), data.statusObject || null);
      request.input('param5', sql.NVarChar(20), data.startDate || null);
      request.input('param6', sql.NVarChar(20), data.endDate || null);
      request.input('param7', sql.NVarChar(50), data.parentRelationshipId || null);
      request.input('param8', sql.NVarChar(100), data.parentRelationshipText || null);
      request.input('param9', sql.NVarChar(50), data.parentRelationshipObjId || null);
      request.input('param10', sql.NVarChar(500), data.parentRelationshipObjText || null);
      request.input('param11', sql.NVarChar(50), data.relationshipId || null);
      request.input('param12', sql.NVarChar(100), data.relationshipText || null);
      request.input('param13', sql.NVarChar(50), data.relationshipObj || null);
      request.input('param14', sql.NVarChar(500), data.relationshipObjText || null);
      request.input('param15', sql.NVarChar(50), data.relIdSup || null);
      request.input('param16', sql.NVarChar(100), data.relTextSup || null);
      request.input('param17', sql.NVarChar(50), data.relObjSup || null);
      request.input('param18', sql.NVarChar(500), data.relObjTextSup || null);
      request.input('param19', sql.NVarChar(50), data.costCenterId || null);
      request.input('param20', sql.NVarChar(200), data.costCenterText || null);
      request.input('param21', sql.NVarChar(10), data.vacantStatus || null);

      const result = await request.query(insertQuery);
      return result;
    } catch (error) {
      console.error('❌ Failed to insert data:', error.message);
      throw error;
    }
  }

  async batchInsertOrganizationalData(dataArray, batchSize = 100) {
    console.log(`📊 Starting batch insert of ${dataArray.length} records...`);
    
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    const startTime = new Date();
    
    // For large datasets, use insert-only approach for better performance
    const isLargeDataset = dataArray.length > 10000;
    
    if (isLargeDataset) {
      console.log('📈 Large dataset detected - using optimized insert-only approach');
    }
    
    // First, get existing object IDs only if it's not a large dataset
    console.log('🔍 Checking existing records...');
    const existingIds = new Set();
    
    if (!isLargeDataset) {
      try {
        const request = this.pool.request();
        const result = await request.query('SELECT object_id FROM organizational_units');
        result.recordset.forEach(row => existingIds.add(row.object_id));
        console.log(`📊 Found ${existingIds.size} existing records`);
      } catch (error) {
        console.log('⚠️ Could not check existing records, proceeding with insert-only approach');
      }
    }
    
    for (let i = 0; i < dataArray.length; i += batchSize) {
      const batch = dataArray.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(dataArray.length / batchSize);
      
      console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} records)...`);
      
      try {
        // Create a transaction for the batch with longer timeout
        const transaction = new sql.Transaction(this.pool);
        transaction.config.requestTimeout = 120000; // 2 minutes per batch
        await transaction.begin();
        
        try {
          if (isLargeDataset) {
            // For large datasets, use bulk insert with ignore duplicates
            const insertValues = batch.map((data, index) => {
              const baseIndex = index * 22;
              return `(
                @p${baseIndex}, @p${baseIndex + 1}, @p${baseIndex + 2}, @p${baseIndex + 3}, @p${baseIndex + 4},
                @p${baseIndex + 5}, @p${baseIndex + 6}, @p${baseIndex + 7}, @p${baseIndex + 8}, @p${baseIndex + 9},
                @p${baseIndex + 10}, @p${baseIndex + 11}, @p${baseIndex + 12}, @p${baseIndex + 13}, @p${baseIndex + 14},
                @p${baseIndex + 15}, @p${baseIndex + 16}, @p${baseIndex + 17}, @p${baseIndex + 18}, @p${baseIndex + 19},
                @p${baseIndex + 20}, @p${baseIndex + 21}
              )`;
            }).join(', ');
            
            // Use INSERT with error handling for duplicates
            const insertQuery = `
              INSERT INTO organizational_units (
                object_description, object_abbr, object_type, object_id, status_object,
                start_date, end_date, parent_relationship_id, parent_relationship_text,
                parent_relationship_obj_id, parent_relationship_obj_text, relationship_id,
                relationship_text, relationship_obj, relationship_obj_text, rel_id_sup,
                rel_text_sup, rel_obj_sup, rel_obj_text_sup, cost_center_id,
                cost_center_text, vacant_status
              ) VALUES ${insertValues}
            `;
            
            const request = new sql.Request(transaction);
            batch.forEach((data, index) => {
              const baseIndex = index * 22;
              request.input(`p${baseIndex}`, sql.NVarChar(500), data.objectDescription || null);
              request.input(`p${baseIndex + 1}`, sql.NVarChar(100), data.objectAbbr || null);
              request.input(`p${baseIndex + 2}`, sql.NVarChar(10), data.objectType || null);
              request.input(`p${baseIndex + 3}`, sql.NVarChar(50), data.objectId);
              request.input(`p${baseIndex + 4}`, sql.NVarChar(50), data.statusObject || null);
              request.input(`p${baseIndex + 5}`, sql.NVarChar(20), data.startDate || null);
              request.input(`p${baseIndex + 6}`, sql.NVarChar(20), data.endDate || null);
              request.input(`p${baseIndex + 7}`, sql.NVarChar(50), data.parentRelationshipId || null);
              request.input(`p${baseIndex + 8}`, sql.NVarChar(100), data.parentRelationshipText || null);
              request.input(`p${baseIndex + 9}`, sql.NVarChar(50), data.parentRelationshipObjId || null);
              request.input(`p${baseIndex + 10}`, sql.NVarChar(500), data.parentRelationshipObjText || null);
              request.input(`p${baseIndex + 11}`, sql.NVarChar(50), data.relationshipId || null);
              request.input(`p${baseIndex + 12}`, sql.NVarChar(100), data.relationshipText || null);
              request.input(`p${baseIndex + 13}`, sql.NVarChar(50), data.relationshipObj || null);
              request.input(`p${baseIndex + 14}`, sql.NVarChar(500), data.relationshipObjText || null);
              request.input(`p${baseIndex + 15}`, sql.NVarChar(50), data.relIdSup || null);
              request.input(`p${baseIndex + 16}`, sql.NVarChar(100), data.relTextSup || null);
              request.input(`p${baseIndex + 17}`, sql.NVarChar(50), data.relObjSup || null);
              request.input(`p${baseIndex + 18}`, sql.NVarChar(500), data.relObjTextSup || null);
              request.input(`p${baseIndex + 19}`, sql.NVarChar(50), data.costCenterId || null);
              request.input(`p${baseIndex + 20}`, sql.NVarChar(200), data.costCenterText || null);
              request.input(`p${baseIndex + 21}`, sql.NVarChar(10), data.vacantStatus || null);
            });
            
            await request.query(insertQuery);
            totalInserted += batch.length;
          } else {
            // For smaller datasets, use upsert logic
            const toInsert = [];
            const toUpdate = [];
            
            batch.forEach(data => {
              if (existingIds.has(data.objectId)) {
                toUpdate.push(data);
              } else {
                toInsert.push(data);
              }
            });
            
            // Bulk insert new records
            if (toInsert.length > 0) {
              const insertValues = toInsert.map((data, index) => {
                const baseIndex = index * 22;
                return `(
                  @p${baseIndex}, @p${baseIndex + 1}, @p${baseIndex + 2}, @p${baseIndex + 3}, @p${baseIndex + 4},
                  @p${baseIndex + 5}, @p${baseIndex + 6}, @p${baseIndex + 7}, @p${baseIndex + 8}, @p${baseIndex + 9},
                  @p${baseIndex + 10}, @p${baseIndex + 11}, @p${baseIndex + 12}, @p${baseIndex + 13}, @p${baseIndex + 14},
                  @p${baseIndex + 15}, @p${baseIndex + 16}, @p${baseIndex + 17}, @p${baseIndex + 18}, @p${baseIndex + 19},
                  @p${baseIndex + 20}, @p${baseIndex + 21}
                )`;
              }).join(', ');
              
              const insertQuery = `
                INSERT INTO organizational_units (
                  object_description, object_abbr, object_type, object_id, status_object,
                  start_date, end_date, parent_relationship_id, parent_relationship_text,
                  parent_relationship_obj_id, parent_relationship_obj_text, relationship_id,
                  relationship_text, relationship_obj, relationship_obj_text, rel_id_sup,
                  rel_text_sup, rel_obj_sup, rel_obj_text_sup, cost_center_id,
                  cost_center_text, vacant_status
                ) VALUES ${insertValues}
              `;
              
              const request = new sql.Request(transaction);
              toInsert.forEach((data, index) => {
                const baseIndex = index * 22;
                request.input(`p${baseIndex}`, sql.NVarChar(500), data.objectDescription || null);
                request.input(`p${baseIndex + 1}`, sql.NVarChar(100), data.objectAbbr || null);
                request.input(`p${baseIndex + 2}`, sql.NVarChar(10), data.objectType || null);
                request.input(`p${baseIndex + 3}`, sql.NVarChar(50), data.objectId);
                request.input(`p${baseIndex + 4}`, sql.NVarChar(50), data.statusObject || null);
                request.input(`p${baseIndex + 5}`, sql.NVarChar(20), data.startDate || null);
                request.input(`p${baseIndex + 6}`, sql.NVarChar(20), data.endDate || null);
                request.input(`p${baseIndex + 7}`, sql.NVarChar(50), data.parentRelationshipId || null);
                request.input(`p${baseIndex + 8}`, sql.NVarChar(100), data.parentRelationshipText || null);
                request.input(`p${baseIndex + 9}`, sql.NVarChar(50), data.parentRelationshipObjId || null);
                request.input(`p${baseIndex + 10}`, sql.NVarChar(500), data.parentRelationshipObjText || null);
                request.input(`p${baseIndex + 11}`, sql.NVarChar(50), data.relationshipId || null);
                request.input(`p${baseIndex + 12}`, sql.NVarChar(100), data.relationshipText || null);
                request.input(`p${baseIndex + 13}`, sql.NVarChar(50), data.relationshipObj || null);
                request.input(`p${baseIndex + 14}`, sql.NVarChar(500), data.relationshipObjText || null);
                request.input(`p${baseIndex + 15}`, sql.NVarChar(50), data.relIdSup || null);
                request.input(`p${baseIndex + 16}`, sql.NVarChar(100), data.relTextSup || null);
                request.input(`p${baseIndex + 17}`, sql.NVarChar(50), data.relObjSup || null);
                request.input(`p${baseIndex + 18}`, sql.NVarChar(500), data.relObjTextSup || null);
                request.input(`p${baseIndex + 19}`, sql.NVarChar(50), data.costCenterId || null);
                request.input(`p${baseIndex + 20}`, sql.NVarChar(200), data.costCenterText || null);
                request.input(`p${baseIndex + 21}`, sql.NVarChar(10), data.vacantStatus || null);
              });
              
              await request.query(insertQuery);
              totalInserted += toInsert.length;
              
              // Add new IDs to existing set
              toInsert.forEach(data => existingIds.add(data.objectId));
            }
            
            // Bulk update existing records
            if (toUpdate.length > 0) {
              for (const data of toUpdate) {
                const request = new sql.Request(transaction);
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
                
                request.input('objectId', sql.NVarChar(50), data.objectId);
                request.input('objectDescription', sql.NVarChar(500), data.objectDescription || null);
                request.input('objectAbbr', sql.NVarChar(100), data.objectAbbr || null);
                request.input('objectType', sql.NVarChar(10), data.objectType || null);
                request.input('statusObject', sql.NVarChar(50), data.statusObject || null);
                request.input('startDate', sql.NVarChar(20), data.startDate || null);
                request.input('endDate', sql.NVarChar(20), data.endDate || null);
                request.input('parentRelationshipId', sql.NVarChar(50), data.parentRelationshipId || null);
                request.input('parentRelationshipText', sql.NVarChar(100), data.parentRelationshipText || null);
                request.input('parentRelationshipObjId', sql.NVarChar(50), data.parentRelationshipObjId || null);
                request.input('parentRelationshipObjText', sql.NVarChar(500), data.parentRelationshipObjText || null);
                request.input('relationshipId', sql.NVarChar(50), data.relationshipId || null);
                request.input('relationshipText', sql.NVarChar(100), data.relationshipText || null);
                request.input('relationshipObj', sql.NVarChar(50), data.relationshipObj || null);
                request.input('relationshipObjText', sql.NVarChar(500), data.relationshipObjText || null);
                request.input('relIdSup', sql.NVarChar(50), data.relIdSup || null);
                request.input('relTextSup', sql.NVarChar(100), data.relTextSup || null);
                request.input('relObjSup', sql.NVarChar(50), data.relObjSup || null);
                request.input('relObjTextSup', sql.NVarChar(500), data.relObjTextSup || null);
                request.input('costCenterId', sql.NVarChar(50), data.costCenterId || null);
                request.input('costCenterText', sql.NVarChar(200), data.costCenterText || null);
                request.input('vacantStatus', sql.NVarChar(10), data.vacantStatus || null);
                
                await request.query(updateQuery);
                totalUpdated++;
              }
            }
          }
          
          await transaction.commit();
          
          const totalProcessed = totalInserted + totalUpdated + totalSkipped;
          const progress = Math.round((totalProcessed / dataArray.length) * 100);
          const elapsed = Math.round((new Date() - startTime) / 1000);
          console.log(`📈 Progress: ${totalProcessed}/${dataArray.length} (${progress}%) - Inserted: ${totalInserted}, Updated: ${totalUpdated}, Elapsed: ${elapsed}s`);
          
        } catch (batchError) {
          await transaction.rollback();
          throw batchError;
        }
        
      } catch (error) {
        console.error(`❌ Batch ${batchNumber} failed:`, error.message);
        
        // For large datasets, try to continue with next batch if it's a duplicate key error
        if (isLargeDataset && error.message.includes('duplicate key')) {
          console.log(`⚠️ Skipping batch ${batchNumber} due to duplicates, continuing...`);
          totalSkipped += batch.length;
          continue;
        }
        
        throw error;
      }
    }
    
    const endTime = new Date();
    const duration = (endTime - startTime) / 1000;
    console.log(`✅ Successfully processed ${totalInserted + totalUpdated + totalSkipped} records in ${duration.toFixed(2)} seconds`);
    console.log(`   📝 Inserted: ${totalInserted}`);
    console.log(`   🔄 Updated: ${totalUpdated}`);  
    console.log(`   ⏭️ Skipped: ${totalSkipped}`);
    
    return totalInserted + totalUpdated;
  }

  async getTableStats() {
    const query = `
      SELECT 
        COUNT(*) as total_records,
        COUNT(CASE WHEN object_type = 'O' THEN 1 END) as organizations,
        COUNT(CASE WHEN object_type = 'S' THEN 1 END) as positions,
        COUNT(CASE WHEN status_object = 'Active' THEN 1 END) as active_records,
        MIN(created_at) as first_record,
        MAX(created_at) as last_record
      FROM organizational_units
    `;
    
    try {
      const result = await this.executeQuery(query);
      return result.recordset[0];
    } catch (error) {
      console.error('❌ Failed to get table stats:', error.message);
      throw error;
    }
  }
}

module.exports = DatabaseManager;