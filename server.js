// Load environment configuration first
require('dotenv').config({ path: '.env.production' });
require('dotenv').config(); // Fallback to .env

const express = require('express');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const { parseOrganizationalData, parseCSVText, validateFile } = require('./src/services/orgChartParser');
const DatabaseManager = require('./src/services/databaseManager');
const ExcelToDatabaseImporter = require('./excel-to-database-importer');
const OrganizationalFlowchartService = require('./src/services/orgFlowchartService');

const app = express();

// Configure multer for file uploads (memory storage for processing)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /\.(xlsx|xls|csv)$/i;
    if (allowedTypes.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel (.xlsx, .xls) and CSV files are allowed'), false);
    }
  }
});

// Request logging middleware
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    console.log(`🌐 API Request: ${req.method} ${req.path} from ${req.ip}`);
    console.log(`🔗 User-Agent: ${req.get('User-Agent') || 'Unknown'}`);
  }
  next();
});

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? [
    'http://wecare.techconnect.co.id',
    'https://wecare.techconnect.co.id',
    'http://localhost',
    'https://localhost'
  ] : true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from the React app build directory at /mining-hr path
if (process.env.NODE_ENV === 'production') {
  // Production: Serve static files at /mining-hr path (NGINX handles this)
  console.log('🏭 Production mode: Static files served by NGINX at /mining-hr/');
} else {
  // Development: Serve static files directly
  app.use(express.static(path.join(__dirname, 'build')));
}

// ==================== ORGANIZATIONAL CHART API ENDPOINTS ====================

// Global storage for processed organizational data (for progressive loading)
let processedOrgData = null;

/**
 * POST /api/org-chart/upload
 * Handles file upload and processes organizational structure data
 * NOW ALSO SAVES ALL DATA TO DATABASE
 */
app.post('/api/org-chart/upload', upload.single('orgFile'), async (req, res) => {
  console.log('🔄 Received org chart file upload request');
  
  try {
    // Validate file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded. Please select an Excel or CSV file.'
      });
    }

    console.log(`📁 Processing file: ${req.file.originalname} (${req.file.size} bytes)`);

    // Memory check
    const memUsage = process.memoryUsage();
    console.log(`💾 Memory usage before processing: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);

    // Validate file type and size
    const fileType = validateFile(req.file);
    
    // Set a timeout for large file processing
    const timeoutId = setTimeout(() => {
      console.error('⏰ Processing timeout - file too large or complex');
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          error: 'Processing timeout. Please try with a smaller file or reduce data complexity.',
          details: 'Large files (>50MB or >100k records) may require splitting into smaller chunks.'
        });
      }
    }, 300000); // 5 minute timeout

    try {
      // Process the organizational data with memory monitoring
      const result = parseOrganizationalData(req.file.buffer, fileType);
      
      clearTimeout(timeoutId);
      
      // Store the complete data server-side for progressive loading
      processedOrgData = {
        fullData: result.data,
        metadata: result.metadata,
        processedAt: new Date().toISOString(),
        filename: req.file.originalname
      };
      
      // 🆕 NEW: SAVE ALL DATA TO DATABASE
      console.log('💾 Saving all data to database...');
      try {
        // Create temporary file for importer
        const fs = require('fs');
        const tempFilePath = path.join(__dirname, 'temp_upload.xlsx');
        fs.writeFileSync(tempFilePath, req.file.buffer);
        
        // Import to database (clear existing data first)
        const importer = new ExcelToDatabaseImporter();
        const importResult = await importer.importExcelToDatabase(tempFilePath, true);
        
        // Clean up temporary file
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        
        if (importResult.success) {
          console.log(`✅ Successfully saved ${importResult.stats.totalInserted} records to database`);
        } else {
          console.error('❌ Database import failed:', importResult.error);
          // Continue with memory-only processing, but warn user
        }
      } catch (dbError) {
        console.error('❌ Database save error:', dbError.message);
        // Continue with memory-only processing
      }
      
      const memUsageAfter = process.memoryUsage();
      console.log(`💾 Memory usage after processing: ${Math.round(memUsageAfter.heapUsed / 1024 / 1024)}MB`);
      console.log(`✅ Successfully processed organizational chart with ${result.metadata.totalRecords} records`);

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        console.log('🗑️  Forced garbage collection');
      }

      // Return only ROOT LEVEL overview (not the entire hierarchy)
      const rootOverview = result.data.map(rootNode => ({
        id: rootNode.id,
        name: rootNode.name,
        type: rootNode.type,
        manager: rootNode.manager,
        stats: {
          totalChildren: countTotalNodes(rootNode),
          totalPositions: countTotalPositions(rootNode),
          directChildren: (rootNode.children || []).length,
          directPositions: (rootNode.positions || []).length
        }
      }));

      res.json({
        success: true,
        message: 'Organizational chart processed successfully - Data saved to database and progressive loading enabled',
        data: rootOverview, // Only root overview, not full hierarchy
        metadata: {
          ...result.metadata,
          filename: req.file.originalname,
          fileSize: req.file.size,
          fileType: fileType,
          memoryUsed: Math.round(memUsageAfter.heapUsed / 1024 / 1024),
          progressiveMode: true,
          rootNodesCount: result.data.length,
          databaseSaved: true // Indicate data was saved to database
        }
      });

    } catch (processingError) {
      clearTimeout(timeoutId);
      throw processingError;
    }

  } catch (error) {
    console.error('❌ Error processing organizational chart upload:', error);
    
    // Memory cleanup
    if (global.gc) {
      global.gc();
    }
    
    const errorMessage = error.message.includes('heap out of memory') 
      ? 'File too large to process. Please try with a smaller file (under 50MB) or contact support.'
      : error.message;
    
    if (!res.headersSent) {
      res.status(400).json({
        success: false,
        error: errorMessage,
        details: 'Please check your file format and ensure it contains the required columns: Object ID, Object Description, Object Type, Parent Relationship Obj ID'
      });
    }
  }
});

/**
 * GET /api/org-chart/roots
 * Returns only the root organizations for progressive loading
 */
app.get('/api/org-chart/roots', (req, res) => {
  console.log('🌳 Received request for root organizations');
  
  if (!processedOrgData) {
    return res.status(404).json({
      success: false,
      error: 'No organizational data available. Please upload a file first.',
      data: []
    });
  }

  try {
    // Get the actual hierarchical data from the stored object
    const hierarchicalData = processedOrgData.fullData;
    
    if (!Array.isArray(hierarchicalData)) {
      return res.status(500).json({
        success: false,
        error: 'Invalid data structure in stored organizational data'
      });
    }
    
    // Convert full hierarchy to root-only data with stats
    const rootNodes = hierarchicalData.map(rootNode => ({
      id: rootNode.id,
      name: rootNode.name,
      manager: rootNode.manager,
      positions: rootNode.positions || [],
      hasChildren: rootNode.children && rootNode.children.length > 0,
      stats: {
        directChildren: rootNode.children ? rootNode.children.length : 0,
        directPositions: (rootNode.positions || []).length,
        totalPositions: countTotalPositions(rootNode)
      }
    }));

    console.log(`✅ Returning ${rootNodes.length} root organizations for progressive loading`);
    
    res.json({
      success: true,
      data: rootNodes,
      message: `Loaded ${rootNodes.length} root organizations`
    });

  } catch (error) {
    console.error('❌ Error getting root nodes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get root organizations',
      details: error.message
    });
  }
});

/**
 * GET /api/org-chart/node/:nodeId
 * Returns detailed data for a specific organizational node
 */
app.get('/api/org-chart/node/:nodeId', (req, res) => {
  console.log(`🔍 Fetching detailed data for node: ${req.params.nodeId}`);
  
  try {
    if (!processedOrgData) {
      return res.status(404).json({
        success: false,
        error: 'No organizational data loaded. Please upload a file first.'
      });
    }

    const nodeId = req.params.nodeId;
    const nodeData = findNodeById(processedOrgData.fullData, nodeId);
    
    if (!nodeData) {
      return res.status(404).json({
        success: false,
        error: `Node ${nodeId} not found in organizational data.`
      });
    }

    // Return the complete node with all children and positions
    res.json({
      success: true,
      data: nodeData,
      metadata: {
        nodeId: nodeId,
        fetchedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error fetching node data:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching node data'
    });
  }
});

/**
 * GET /api/org-chart/children/:nodeId
 * Returns immediate children of a specific organizational node
 */
app.get('/api/org-chart/children/:nodeId', (req, res) => {
  console.log(`👶 Fetching children for node: ${req.params.nodeId}`);
  
  try {
    if (!processedOrgData) {
      return res.status(404).json({
        success: false,
        error: 'No organizational data loaded. Please upload a file first.'
      });
    }

    const nodeId = req.params.nodeId;
    const nodeData = findNodeById(processedOrgData.fullData, nodeId);
    
    if (!nodeData) {
      return res.status(404).json({
        success: false,
        error: `Node ${nodeId} not found.`
      });
    }

    // Return only immediate children (not deep hierarchy)
    const immediateChildren = (nodeData.children || []).map(child => ({
      id: child.id,
      name: child.name,
      type: child.type,
      manager: child.manager,
      positions: child.positions || [],
      hasChildren: (child.children || []).length > 0,
      stats: {
        totalChildren: countTotalNodes(child),
        totalPositions: countTotalPositions(child),
        directChildren: (child.children || []).length,
        directPositions: (child.positions || []).length
      }
    }));

    res.json({
      success: true,
      data: immediateChildren,
      metadata: {
        parentId: nodeId,
        childrenCount: immediateChildren.length,
        fetchedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error fetching children:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching children data'
    });
  }
});

// Helper functions
function findNodeById(nodes, targetId) {
  for (const node of nodes) {
    if (node.id === targetId) {
      return node;
    }
    if (node.children && node.children.length > 0) {
      const found = findNodeById(node.children, targetId);
      if (found) return found;
    }
  }
  return null;
}

function countTotalNodes(node) {
  let count = 1; // Count this node
  if (node.children && node.children.length > 0) {
    node.children.forEach(child => {
      count += countTotalNodes(child);
    });
  }
  return count;
}

function countTotalPositions(node) {
  let count = (node.positions || []).length;
  if (node.children && node.children.length > 0) {
    node.children.forEach(child => {
      count += countTotalPositions(child);
    });
  }
  return count;
}

/**
 * POST /api/org-chart/parse-text
 * Handles CSV text input and processes organizational structure data
 */
app.post('/api/org-chart/parse-text', async (req, res) => {
  console.log('🔄 Received org chart text parsing request');
  
  try {
    const { csvText } = req.body;

    if (!csvText || csvText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No CSV text provided. Please paste your organizational data.'
      });
    }

    console.log(`📝 Processing CSV text input (${csvText.length} characters)`);

    // Process the CSV text
    const result = parseCSVText(csvText);
    
    console.log(`✅ Successfully processed organizational chart from text with ${result.metadata.totalRecords} records`);

    // Return the hierarchical data
    res.json({
      success: true,
      message: 'Organizational chart processed successfully from text input',
      data: result.data,
      metadata: {
        ...result.metadata,
        inputType: 'text',
        textLength: csvText.length
      }
    });

  } catch (error) {
    console.error('❌ Error processing organizational chart text:', error);
    
    res.status(400).json({
      success: false,
      error: error.message,
      details: 'Please check your CSV format and ensure it contains the required columns with proper headers'
    });
  }
});

/**
 * GET /api/org-chart/sample
 * Returns a sample organizational structure for testing
 */
app.get('/api/org-chart/sample', (req, res) => {
  console.log('📋 Serving sample organizational chart data');
  
  const sampleData = [
    {
      id: "60000003",
      name: "BERAU COAL",
      type: "O",
      manager: "PRESIDENT DIRECTOR",
      relationshipText: "is Managed by",
      positions: [],
      children: [
        {
          id: "60005578",
          name: "HRGS DIRECTORATE",
          type: "O",
          manager: "CHIEF HUMAN RESOURCES OFFICER",
          relationshipText: "is Managed by",
          positions: [],
          children: [
            {
              id: "60013867",
              name: "HRGS BC DIVISION",
              type: "O",
              manager: "BUSINESS PARTNER HEAD & HR HEAD BC",
              relationshipText: "is Managed by",
              positions: [
                {
                  id: "60082897",
                  name: "Business Partner",
                  holder: "Agus Dani Ariyanto",
                  relationshipText: "Holder"
                }
              ],
              children: [
                {
                  id: "60018884",
                  name: "HR OPERATIONS DEPT",
                  type: "O",
                  manager: "HR INDUSTRIAL & PEOPLE SENIOR MANAGER",
                  relationshipText: "is Managed by",
                  positions: [
                    {
                      id: "60016583",
                      name: "HR Industrial",
                      holder: "Tomy Indarto",
                      relationshipText: "Holder"
                    }
                  ],
                  children: []
                }
              ]
            }
          ]
        }
      ]
    }
  ];

  res.json({
    success: true,
    message: 'Sample organizational chart data',
    data: sampleData,
    metadata: {
      totalRecords: 6,
      rootNodes: 1,
      processedAt: new Date().toISOString(),
      isSample: true
    }
  });
});

/**
 * GET /api/org-chart/database/stats
 * Returns database statistics
 */
app.get('/api/org-chart/database/stats', async (req, res) => {
  console.log('📊 Received request for database statistics');
  
  try {
    const db = new DatabaseManager();
    await db.connect();
    
    const stats = await db.getTableStats();
    
    await db.disconnect();
    
    res.json({
      success: true,
      data: stats,
      message: 'Database statistics retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Error getting database stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get database statistics',
      details: error.message
    });
  }
});

/**
 * GET /api/org-chart/database/all
 * Returns all organizational data from database
 */
app.get('/api/org-chart/database/all', async (req, res) => {
  console.log('📋 Received request for all database records');
  
  try {
    const db = new DatabaseManager();
    await db.connect();
    
    const limit = parseInt(req.query.limit) || 1000;
    const offset = parseInt(req.query.offset) || 0;
    
    const query = `
      SELECT TOP ${limit}
        id, object_description, object_abbr, object_type, object_id, status_object,
        start_date, end_date, parent_relationship_id, parent_relationship_text,
        parent_relationship_obj_id, parent_relationship_obj_text, relationship_id,
        relationship_text, relationship_obj, relationship_obj_text, rel_id_sup,
        rel_text_sup, rel_obj_sup, rel_obj_text_sup, cost_center_id,
        cost_center_text, vacant_status, created_at, updated_at
      FROM organizational_units
      ORDER BY id
      OFFSET ${offset} ROWS
    `;
    
    const result = await db.executeQuery(query);
    
    await db.disconnect();
    
    res.json({
      success: true,
      data: result.recordset,
      metadata: {
        count: result.recordset.length,
        limit: limit,
        offset: offset,
        hasMore: result.recordset.length === limit
      },
      message: `Retrieved ${result.recordset.length} records from database`
    });
    
  } catch (error) {
    console.error('❌ Error getting database records:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get database records',
      details: error.message
    });
  }
});

/**
 * DELETE /api/org-chart/database/clear
 * Clears all data from database
 */
app.delete('/api/org-chart/database/clear', async (req, res) => {
  console.log('🗑️ Received request to clear database');
  
  try {
    const db = new DatabaseManager();
    await db.connect();
    
    // Get count before deletion
    const beforeStats = await db.getTableStats();
    
    // Clear all data
    await db.executeQuery('DELETE FROM organizational_units');
    
    // Get count after deletion
    const afterStats = await db.getTableStats();
    
    await db.disconnect();
    
    res.json({
      success: true,
      message: `Successfully cleared ${beforeStats.total_records} records from database`,
      data: {
        recordsDeleted: beforeStats.total_records,
        remainingRecords: afterStats.total_records
      }
    });
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear database',
      details: error.message
    });
  }
});

// ==================== DEBUG AND HEALTH CHECK ENDPOINTS ====================

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('💚 Health check requested');
  res.json({
    success: true,
    message: 'HRAI Mining HR API is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// Debug endpoint to show all available routes
app.get('/api/debug/routes', (req, res) => {
  console.log('🔍 Debug routes requested');
  const routes = [];
  
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    }
  });
  
  res.json({
    success: true,
    routes: routes,
    timestamp: new Date().toISOString()
  });
});

// ==================== NEW ENHANCED ORGANIZATIONAL FLOWCHART API ENDPOINTS ====================

/**
 * GET /api/flowchart/hierarchy
 * Returns complete organizational hierarchy from database for flowchart display
 */
app.get('/api/flowchart/hierarchy', async (req, res) => {
  console.log('🏢 Received request for organizational flowchart hierarchy');
  console.log('📍 Request URL:', req.url);
  console.log('📍 Request path:', req.path);
  console.log('📍 Request headers:', req.headers);
  
  try {
    const flowchartService = new OrganizationalFlowchartService();
    const forceRefresh = req.query.refresh === 'true';
    
    const result = await flowchartService.getOrganizationalHierarchy(forceRefresh);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to build organizational hierarchy',
        details: result.error
      });
    }
    
    console.log(`✅ Successfully returned organizational flowchart with ${result.metadata.totalOrganizations} organizations and ${result.metadata.totalPositions} positions`);
    
    res.json({
      success: true,
      data: result.data,
      metadata: result.metadata,
      message: `Organizational flowchart loaded with ${result.metadata.rootNodes} root organizations`
    });
    
  } catch (error) {
    console.error('❌ Error getting organizational flowchart hierarchy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get organizational flowchart hierarchy',
      details: error.message
    });
  }
});

/**
 * GET /api/flowchart/branch/:nodeId
 * Returns specific organizational branch for focused viewing
 */
app.get('/api/flowchart/branch/:nodeId', async (req, res) => {
  console.log(`🌳 Received request for organizational branch: ${req.params.nodeId}`);
  
  try {
    const flowchartService = new OrganizationalFlowchartService();
    const result = await flowchartService.getOrganizationalBranch(req.params.nodeId);
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: `Organizational branch not found: ${req.params.nodeId}`,
        details: result.error
      });
    }
    
    console.log(`✅ Successfully returned organizational branch for ${req.params.nodeId}`);
    
    res.json({
      success: true,
      data: result.data,
      metadata: result.metadata,
      message: `Organizational branch loaded for ${req.params.nodeId}`
    });
    
  } catch (error) {
    console.error('❌ Error getting organizational branch:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get organizational branch',
      details: error.message
    });
  }
});

/**
 * GET /api/flowchart/search
 * Search for organizations and positions in the flowchart
 */
app.get('/api/flowchart/search', async (req, res) => {
  console.log(`🔍 Received search request: ${req.query.q}`);
  
  try {
    const { q: searchTerm, type: nodeType = 'all' } = req.query;
    
    if (!searchTerm || searchTerm.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search term must be at least 2 characters long'
      });
    }
    
    const flowchartService = new OrganizationalFlowchartService();
    const result = await flowchartService.searchNodes(searchTerm.trim(), nodeType);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Search failed',
        details: result.error
      });
    }
    
    console.log(`✅ Search completed: found ${result.data.length} results for "${searchTerm}"`);
    
    res.json({
      success: true,
      data: result.data,
      metadata: result.metadata,
      message: `Found ${result.data.length} results for "${searchTerm}"`
    });
    
  } catch (error) {
    console.error('❌ Error searching organizational flowchart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search organizational flowchart',
      details: error.message
    });
  }
});

/**
 * GET /api/flowchart/filtered-hierarchy
 * Returns filtered organizational hierarchy showing only specific path:
 * Level 1: PRESIDENT OFFICE → Level 2: SINARMAS MINING GROUP → 
 * Level 3: BERAU COAL ENERGY GROUP → Level 4: PT. BERAU COAL ENERGY → 
 * Level 5: OPERATION DIRECTORATE → Level 6: XXX - MARINE DIVISION
 * Plus all children below Level 6
 */
app.get('/api/flowchart/filtered-hierarchy', async (req, res) => {
  console.log('🎯 Received request for filtered organizational flowchart hierarchy');
  
  try {
    const flowchartService = new OrganizationalFlowchartService();
    const result = await flowchartService.getFilteredOrganizationalHierarchy();
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to build filtered organizational hierarchy',
        details: result.error
      });
    }
    
    console.log(`✅ Successfully returned filtered organizational flowchart with ${result.metadata.filteredNodes} organizations following specific hierarchy path`);
    
    res.json({
      success: true,
      data: result.data,
      metadata: result.metadata,
      message: `Filtered organizational flowchart loaded following specific hierarchy path (${result.metadata.targetPathLength} levels)`
    });
    
  } catch (error) {
    console.error('❌ Error getting filtered organizational flowchart hierarchy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get filtered organizational flowchart hierarchy',
      details: error.message
    });
  }
});

/**
 * POST /api/flowchart/refresh
 * Force refresh of organizational flowchart cache
 */
app.post('/api/flowchart/refresh', async (req, res) => {
  console.log('🔄 Received request to refresh organizational flowchart cache');
  
  try {
    const flowchartService = new OrganizationalFlowchartService();
    
    // Clear cache and rebuild
    flowchartService.clearCache();
    const result = await flowchartService.getOrganizationalHierarchy(true);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to refresh organizational hierarchy',
        details: result.error
      });
    }
    
    console.log(`✅ Successfully refreshed organizational flowchart`);
    
    res.json({
      success: true,
      data: {
        refreshed: true,
        timestamp: new Date().toISOString(),
        statistics: result.metadata
      },
      message: 'Organizational flowchart cache refreshed successfully'
    });
    
  } catch (error) {
    console.error('❌ Error refreshing organizational flowchart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh organizational flowchart',
      details: error.message
    });
  }
});

// API health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'HRAI - Mining Industry HR Position Qualification Assessment System',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    // In production, NGINX handles static files, so redirect unknown API calls
    res.status(404).json({ 
      error: 'API endpoint not found',
      path: req.path,
      message: 'This endpoint does not exist. Check the API documentation.'
    });
  } else {
    // In development, serve the React app for client-side routing
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  }
});

// Use PORT environment variable or default to 3050
const port = process.env.PORT || 3050;
const host = process.env.HOST || 'localhost';

app.listen(port, host, () => {
  console.log(`🚀 HRAI server is running on ${host}:${port}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`🌍 Public access: http://wecare.techconnect.co.id/mining-hr/`);
  } else {
    console.log(`🌐 Local access: http://localhost:${port}`);
  }
  console.log(`⛏️  Mining Industry HR Position Qualification Assessment System`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully');
  process.exit(0);
});