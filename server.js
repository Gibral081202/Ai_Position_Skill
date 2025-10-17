const express = require('express');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const { parseOrganizationalData, parseCSVText, validateFile } = require('./src/services/orgChartParser');

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

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'build')));

// ==================== ORGANIZATIONAL CHART API ENDPOINTS ====================

// Global storage for processed organizational data (for progressive loading)
let processedOrgData = null;

/**
 * POST /api/org-chart/upload
 * Handles file upload and processes organizational structure data
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
        message: 'Organizational chart processed successfully - Progressive loading enabled',
        data: rootOverview, // Only root overview, not full hierarchy
        metadata: {
          ...result.metadata,
          filename: req.file.originalname,
          fileSize: req.file.size,
          fileType: fileType,
          memoryUsed: Math.round(memUsageAfter.heapUsed / 1024 / 1024),
          progressiveMode: true,
          rootNodesCount: result.data.length
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
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Use PORT environment variable or default to 3050
const port = process.env.PORT || 3050;

app.listen(port, () => {
  console.log(`🚀 HRAI server is running on port ${port}`);
  console.log(`🌐 Access the application at: http://localhost:${port}`);
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