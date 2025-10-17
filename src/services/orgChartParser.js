// Organizational Chart Parser Service
// Transforms flat Excel/CSV data into hierarchical JSON structure
const XLSX = require('xlsx');

/**
 * Parses organizational structure data from Excel/CSV and builds hierarchical JSON
 * @param {Buffer} fileBuffer - The uploaded file buffer
 * @param {string} fileType - File type (xlsx, xls, csv)
 * @returns {Object} - Hierarchical organization structure
 */
function parseOrganizationalData(fileBuffer, fileType) {
  try {
    console.log('🔄 Starting organizational data parsing...');
    
    // Read the workbook from buffer
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    
    // Get the first worksheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON with headers - limit initial processing for memory efficiency
    const rawData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: '',
      blankrows: false,
      range: 0 // Start from first row
    });

    if (rawData.length < 2) {
      throw new Error('File must contain at least a header row and one data row');
    }

    // Memory protection for very large files
    const MAX_INITIAL_ROWS = 100000;
    if (rawData.length > MAX_INITIAL_ROWS) {
      console.log(`📊 Large file detected: ${rawData.length - 1} rows. Processing in chunks for memory efficiency...`);
    } else {
      console.log(`📊 Processing ${rawData.length - 1} rows of organizational data...`);
    }

    // Extract headers (first row) and data (remaining rows)
    const headers = rawData[0];
    const dataRows = rawData.slice(1);

    // Map column indices (flexible header matching)
    const columnMap = mapColumns(headers);
    console.log('📋 Column mapping:', columnMap);

    // Convert rows to structured objects
    const organizationData = dataRows
      .filter(row => row && row.length > 0 && row.some(cell => cell && cell.toString().trim() !== ''))
      .map((row, index) => {
        try {
          return {
            objectId: getColumnValue(row, columnMap.objectId),
            objectDescription: getColumnValue(row, columnMap.objectDescription),
            objectType: getColumnValue(row, columnMap.objectType),
            parentId: getColumnValue(row, columnMap.parentId),
            relationshipText: getColumnValue(row, columnMap.relationshipText),
            relationshipObjText: getColumnValue(row, columnMap.relationshipObjText),
            rowIndex: index + 2 // +2 because we start from row 1 and skip header
          };
        } catch (error) {
          console.warn(`⚠️  Warning: Skipping row ${index + 2} due to parsing error:`, error.message);
          return null;
        }
      })
      .filter(item => item !== null);

    console.log(`✅ Successfully parsed ${organizationData.length} valid records`);

    // Build hierarchical structure
    const hierarchicalData = buildHierarchy(organizationData);
    
    return {
      success: true,
      data: hierarchicalData,
      metadata: {
        totalRecords: organizationData.length,
        rootNodes: hierarchicalData.length,
        processedAt: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('❌ Error parsing organizational data:', error);
    throw new Error(`Failed to parse organizational data: ${error.message}`);
  }
}

/**
 * Maps column headers to standardized field names (case-insensitive, flexible matching)
 */
function mapColumns(headers) {
  const columnMap = {};
  
  headers.forEach((header, index) => {
    const normalizedHeader = header.toString().toLowerCase().trim();
    
    // Object ID mapping
    if (normalizedHeader.includes('object id') || normalizedHeader.includes('objectid')) {
      columnMap.objectId = index;
    }
    // Object Description mapping
    else if (normalizedHeader.includes('object description') || normalizedHeader.includes('description')) {
      columnMap.objectDescription = index;
    }
    // Object Type mapping  
    else if (normalizedHeader.includes('object type') || normalizedHeader.includes('type')) {
      columnMap.objectType = index;
    }
    // Parent Relationship Object ID mapping
    else if (normalizedHeader.includes('parent relationship obj id') || 
             normalizedHeader.includes('parent') && normalizedHeader.includes('id')) {
      columnMap.parentId = index;
    }
    // Relationship Text mapping
    else if (normalizedHeader.includes('relationship (text)') || 
             normalizedHeader.includes('relationship text')) {
      columnMap.relationshipText = index;
    }
    // Relationship Object Text mapping
    else if (normalizedHeader.includes('relationship obj (text)') || 
             normalizedHeader.includes('relationship obj text')) {
      columnMap.relationshipObjText = index;
    }
  });

  // Validate required columns
  const requiredFields = ['objectId', 'objectDescription', 'objectType', 'parentId'];
  const missingFields = requiredFields.filter(field => columnMap[field] === undefined);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required columns: ${missingFields.join(', ')}. Available headers: ${headers.join(', ')}`);
  }

  return columnMap;
}

/**
 * Safely gets column value with null/undefined handling
 */
function getColumnValue(row, columnIndex) {
  if (columnIndex === undefined || row[columnIndex] === undefined) {
    return '';
  }
  return row[columnIndex].toString().trim();
}

/**
 * Builds hierarchical structure from flat organizational data (Full detail mode)
 * @param {Array} organizationData - Array of organizational records
 * @returns {Array} - Root nodes of the hierarchy
 */
function buildHierarchy(organizationData) {
  console.log('🏗️  Building hierarchical structure...');

  // Process ALL data for complete visualization (user requested full detail)
  console.log(`📊 Processing complete dataset: ${organizationData.length} records for full organizational view`);

  // Create lookup maps - separate for orgs and positions for efficiency
  const orgMap = new Map();
  const positionsMap = new Map(); // Map parent ID -> array of positions
  
  // First pass: separate organizations from positions
  const organizations = [];
  const positions = [];
  
  organizationData.forEach((record, index) => {
    if (index % 10000 === 0) {
      console.log(`📊 Processing record ${index}/${organizationData.length}`);
    }
    
    if (record.objectType === 'O') {
      organizations.push(record);
      orgMap.set(record.objectId, {
        ...record,
        children: [],
        positions: []
      });
    } else if (record.objectType === 'S') {
      positions.push(record);
      
      // Group positions by parent ID
      if (!positionsMap.has(record.parentId)) {
        positionsMap.set(record.parentId, []);
      }
      positionsMap.get(record.parentId).push({
        id: record.objectId,
        name: record.objectDescription,
        holder: record.relationshipObjText || 'Vacant',
        relationshipText: record.relationshipText
      });
    }
  });

  console.log(`📍 Separated ${organizations.length} organizations and ${positions.length} positions`);

  // Assign ALL positions to their organizational parents (no limits for full view)
  positionsMap.forEach((positionList, parentId) => {
    const parent = orgMap.get(parentId);
    if (parent) {
      parent.positions = positionList; // Include ALL positions
    } else {
      console.warn(`⚠️  ${positionList.length} positions have no organizational parent: ${parentId}`);
    }
  });

  const rootNodes = [];
  const orphanNodes = [];
  const processedNodes = new Set(); // Prevent circular references

  // Build hierarchy for ALL organizations
  organizations.forEach((record, index) => {
    if (index % 5000 === 0) {
      console.log(`🔗 Building hierarchy: ${index}/${organizations.length}`);
    }
    
    const currentNode = orgMap.get(record.objectId);
    if (!currentNode || processedNodes.has(record.objectId)) return;

    // Prevent circular references
    if (record.parentId === record.objectId) {
      // Self-referencing node - treat as root
      currentNode.manager = record.relationshipObjText || '';
      currentNode.relationshipText = record.relationshipText || '';
      rootNodes.push(currentNode);
      processedNodes.add(record.objectId);
      return;
    }

    if (record.parentId && record.parentId !== record.objectId) {
      const parent = orgMap.get(record.parentId);
      if (parent && parent.objectId !== record.objectId) {
        // Add manager information
        currentNode.manager = record.relationshipObjText || '';
        currentNode.relationshipText = record.relationshipText || '';
        
        // Check for circular reference before adding
        if (!isCircularReference(record.objectId, record.parentId, orgMap)) {
          parent.children.push(currentNode);
          processedNodes.add(record.objectId);
        } else {
          console.warn(`🔄 Circular reference detected: ${record.objectId} -> ${record.parentId}`);
          orphanNodes.push(currentNode);
        }
      } else {
        orphanNodes.push(currentNode);
      }
    } else {
      // Root node
      currentNode.manager = record.relationshipObjText || '';
      currentNode.relationshipText = record.relationshipText || '';
      rootNodes.push(currentNode);
      processedNodes.add(record.objectId);
    }
  });

  // Include ALL orphan nodes as separate trees
  console.log(`📊 Including all ${orphanNodes.length} orphan nodes as separate organizational trees`);
  rootNodes.push(...orphanNodes);

  console.log(`✅ Complete hierarchy built: ${rootNodes.length} root nodes with full organizational detail`);
  
  // Return FULL hierarchy with unlimited depth
  return rootNodes.map(node => cleanHierarchyNode(node, 0, 50)); // Increased max depth to 50 levels
}

/**
 * Check for circular references in hierarchy
 */
function isCircularReference(nodeId, parentId, orgMap, visited = new Set()) {
  if (visited.has(parentId) || parentId === nodeId) {
    return true;
  }
  
  visited.add(parentId);
  const parent = orgMap.get(parentId);
  if (parent && parent.parentId) {
    return isCircularReference(nodeId, parent.parentId, orgMap, visited);
  }
  
  return false;
}

/**
 * Creates a simplified summary hierarchy for very large datasets
 * @param {Array} rootNodes - Array of root organizational nodes
 * @returns {Array} - Simplified hierarchy with summary data
 */
function createSummaryHierarchy(rootNodes) {
  console.log(`📋 Creating summary hierarchy for large dataset`);
  
  const summaryNodes = rootNodes.slice(0, 10).map(node => {
    // Count total children and positions recursively
    const stats = calculateNodeStats(node);
    
    return {
      id: node.objectId,
      name: node.objectDescription,
      type: node.objectType,
      manager: node.manager || '',
      relationshipText: node.relationshipText || '',
      positions: node.positions.slice(0, 5), // Show only first 5 positions
      children: [], // Don't include children in summary view
      isLargeDataset: true,
      stats: {
        totalOrganizations: stats.totalOrgs,
        totalPositions: stats.totalPositions,
        directChildren: (node.children || []).length,
        directPositions: (node.positions || []).length
      }
    };
  });

  // Add a special informational node
  summaryNodes.push({
    id: 'large_dataset_info',
    name: `📊 Large Dataset Summary View`,
    type: 'info',
    manager: '',
    relationshipText: '',
    positions: [{
      id: 'info_1',
      name: `Showing top ${summaryNodes.length - 1} root organizations`,
      holder: '',
      relationshipText: 'info'
    }, {
      id: 'info_2', 
      name: `Use filters or department-specific exports for detailed view`,
      holder: '',
      relationshipText: 'info'
    }],
    children: [],
    isLargeDataset: true,
    stats: {
      totalOrganizations: 0,
      totalPositions: 0,
      directChildren: 0,
      directPositions: 0
    }
  });

  return summaryNodes;
}

/**
 * Calculates statistics for a node and all its children
 */
function calculateNodeStats(node, visited = new Set()) {
  if (visited.has(node.objectId)) {
    return { totalOrgs: 0, totalPositions: 0 };
  }
  
  visited.add(node.objectId);
  
  let totalOrgs = 1; // Count this node
  let totalPositions = (node.positions || []).length;
  
  // Recursively count children (but limit depth to prevent infinite loops)
  if (node.children && visited.size < 1000) {
    node.children.forEach(child => {
      const childStats = calculateNodeStats(child, visited);
      totalOrgs += childStats.totalOrgs;
      totalPositions += childStats.totalPositions;
    });
  }
  
  return { totalOrgs, totalPositions };
}

/**
 * Cleans and formats a hierarchy node for frontend consumption (Full detail mode)
 */
function cleanHierarchyNode(node, currentDepth = 0, maxDepth = 50) {
  // Allow deep hierarchy for complete organizational view
  if (currentDepth >= maxDepth) {
    return {
      id: node.objectId,
      name: node.objectDescription + ' (Max depth reached)',
      type: node.objectType,
      manager: node.manager || '',
      relationshipText: node.relationshipText || '',
      positions: node.positions || [],
      children: []
    };
  }

  // Include ALL positions for complete view (no limits)
  const positions = node.positions || [];

  // Include ALL children for complete organizational structure
  const children = node.children || [];
  
  return {
    id: node.objectId,
    name: node.objectDescription,
    type: node.objectType,
    manager: node.manager || '',
    relationshipText: node.relationshipText || '',
    positions: positions, // All positions included
    children: children.map(child => cleanHierarchyNode(child, currentDepth + 1, maxDepth)) // All children included
  };
}

/**
 * Validates uploaded file format and size
 */
function validateFile(file) {
  const allowedTypes = ['xlsx', 'xls', 'csv'];
  const maxSize = 50 * 1024 * 1024; // 50MB

  if (!file) {
    throw new Error('No file provided');
  }

  if (file.size > maxSize) {
    throw new Error('File size too large. Maximum size is 50MB');
  }

  // Get file extension
  const fileName = file.originalname || file.name || '';
  const fileExt = fileName.toLowerCase().split('.').pop();
  
  if (!allowedTypes.includes(fileExt)) {
    throw new Error(`Unsupported file type. Allowed types: ${allowedTypes.join(', ')}`);
  }

  return fileExt;
}

/**
 * Converts flat CSV text to organizational hierarchy
 * @param {string} csvText - Raw CSV text content
 * @returns {Object} - Hierarchical organization structure
 */
function parseCSVText(csvText) {
  try {
    console.log('🔄 Parsing CSV text input...');
    
    // Create a temporary workbook from CSV text
    const workbook = XLSX.read(csvText, { type: 'string' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to buffer format for consistent processing
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'csv' });
    
    return parseOrganizationalData(buffer, 'csv');
  } catch (error) {
    console.error('❌ Error parsing CSV text:', error);
    throw new Error(`Failed to parse CSV text: ${error.message}`);
  }
}

module.exports = {
  parseOrganizationalData,
  parseCSVText,
  validateFile
};