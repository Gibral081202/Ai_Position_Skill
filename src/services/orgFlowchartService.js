/**
 * Enhanced Organizational Flowchart Service
 * Reads data directly from SQL database and builds proper hierarchical structure
 * Differentiates between Organizations (O) and Positions (S) with color coding
 * Shows employee names, positions, levels and creates true org chart flowchart
 */

const DatabaseManager = require('./databaseManager');

class OrganizationalFlowchartService {
  constructor() {
    this.db = new DatabaseManager();
    this.cache = {
      fullHierarchy: null,
      lastUpdated: null,
      cacheDuration: 5 * 60 * 1000 // 5 minutes
    };
  }

  /**
   * Get complete organizational hierarchy from database
   * @param {boolean} forceRefresh - Force refresh from database
   * @returns {Object} Complete organizational flowchart data
   */
  async getOrganizationalHierarchy(forceRefresh = false) {
    console.log('🏢 Building organizational flowchart from database...');

    // Check cache first
    if (!forceRefresh && this.cache.fullHierarchy && this.isValidCache()) {
      console.log('✅ Using cached organizational hierarchy');
      return {
        success: true,
        data: this.cache.fullHierarchy,
        source: 'cache',
        metadata: {
          cached: true,
          lastUpdated: this.cache.lastUpdated,
          totalNodes: this.countTotalNodes(this.cache.fullHierarchy)
        }
      };
    }

    try {
      await this.db.connect();

      // Get all organizational data from database
      const query = `
        SELECT 
          id, object_description, object_abbr, object_type, object_id, 
          status_object, parent_relationship_obj_id, parent_relationship_obj_text,
          relationship_text, relationship_obj_text, rel_obj_text_sup, cost_center_text, vacant_status,
          created_at, updated_at
        FROM organizational_units
        WHERE object_id IS NOT NULL 
          AND object_description IS NOT NULL
          AND object_type IN ('O', 'S')
        ORDER BY object_type, object_id
      `;

      const result = await this.db.executeQuery(query);
      const rawData = result.recordset;

      console.log(`📊 Retrieved ${rawData.length} organizational records from database`);

      if (rawData.length === 0) {
        throw new Error('No organizational data found in database');
      }

      // Build hierarchical structure
      const hierarchy = await this.buildFlowchartHierarchy(rawData);

      // Cache the result
      this.cache.fullHierarchy = hierarchy;
      this.cache.lastUpdated = new Date();

      console.log(`✅ Successfully built organizational flowchart with ${hierarchy.rootNodes.length} root organizations`);

      return {
        success: true,
        data: hierarchy,
        source: 'database',
        metadata: {
          totalRecords: rawData.length,
          totalOrganizations: hierarchy.statistics.totalOrganizations,
          totalPositions: hierarchy.statistics.totalPositions,
          rootNodes: hierarchy.rootNodes.length,
          maxDepth: hierarchy.statistics.maxDepth,
          processedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Error building organizational flowchart:', error);
      throw new Error(`Failed to build organizational flowchart: ${error.message}`);
    } finally {
      await this.db.disconnect();
    }
  }

  /**
   * Build hierarchical flowchart structure from flat database records
   * @param {Array} rawData - Raw database records
   * @returns {Object} Hierarchical flowchart structure
   */
  async buildFlowchartHierarchy(rawData) {
    console.log('🔧 Building hierarchical flowchart structure...');

    // Separate Organizations and Positions
    const organizations = [];
    const positions = [];
    const orgMap = new Map();
    const positionsByParent = new Map();

    // First pass: Categorize and map data
    rawData.forEach(record => {
      const cleanRecord = this.cleanRecord(record);
      
      if (record.object_type === 'O') {
        // Organization record
        organizations.push(cleanRecord);
        orgMap.set(record.object_id, {
          ...cleanRecord,
          children: [],
          positions: [],
          nodeType: 'organization'
        });
      } else if (record.object_type === 'S') {
        // Position record
        positions.push(cleanRecord);
        
        const parentId = record.parent_relationship_obj_id;
        if (parentId) {
          if (!positionsByParent.has(parentId)) {
            positionsByParent.set(parentId, []);
          }
          
          // ✅ FIX: Use relationship_obj_text for staff names, leave blank if null
          // relationship_obj_text contains actual person names for position records
          const actualHolder = record.relationship_obj_text && record.relationship_obj_text.trim() !== '' 
            ? record.relationship_obj_text.trim()
            : ''; // Leave blank if null/empty
            
          positionsByParent.get(parentId).push({
            ...cleanRecord,
            nodeType: 'position',
            holder: actualHolder,
            positionLevel: this.extractPositionLevel(record),
            department: record.cost_center_text || 'Unknown Department'
          });
        }
      }
    });

    console.log(`📍 Separated ${organizations.length} organizations and ${positions.length} positions`);

    // Second pass: Attach positions to their parent organizations
    positionsByParent.forEach((positionList, parentId) => {
      const parentOrg = orgMap.get(parentId);
      if (parentOrg) {
        parentOrg.positions = positionList;
      }
    });

    // Third pass: Build organizational hierarchy
    const rootNodes = [];
    const processedNodes = new Set();

    // FIRST, identify and process TRUE ROOT organizations (only those without valid parents)
    organizations.forEach(org => {
      const node = orgMap.get(org.objectId);
      if (!node || processedNodes.has(org.objectId)) return;

      // TRUE ROOT: Only organizations with no parent, empty parent, or self-referencing parent
      if (!org.parentId || org.parentId === org.objectId || org.parentId.trim() === '' || org.parentId === 'null') {
        node.level = 0;
        node.manager = org.manager || 'Chief Executive';
        rootNodes.push(node);
        processedNodes.add(org.objectId);
        console.log(`🏛️  TRUE ROOT found: ${org.objectId} - ${org.name}`);
      }
    });

    // SECOND, process child organizations in multiple passes to handle deep hierarchies
    let remainingOrgs = organizations.filter(org => !processedNodes.has(org.objectId));
    let passCount = 0;
    const maxPasses = 10; // Prevent infinite loops

    while (remainingOrgs.length > 0 && passCount < maxPasses) {
      passCount++;
      const orgCountBefore = remainingOrgs.length;

      remainingOrgs = remainingOrgs.filter(org => {
        const node = orgMap.get(org.objectId);
        if (!node || processedNodes.has(org.objectId)) return false;

        // Try to find parent in processed nodes
        const parent = orgMap.get(org.parentId);
        if (parent && processedNodes.has(org.parentId) && !this.wouldCreateCircularReference(org.objectId, org.parentId, orgMap)) {
          // Parent found and processed - attach as child
          node.level = (parent.level || 0) + 1;
          node.manager = org.manager || 'Department Manager';
          parent.children.push(node);
          processedNodes.add(org.objectId);
          console.log(`🔗 Level ${node.level}: ${org.objectId} -> ${org.parentId}`);
          return false; // Remove from remaining list
        }

        return true; // Keep in remaining list for next pass
      });

      // If no progress made in this pass, break to avoid infinite loop
      if (remainingOrgs.length === orgCountBefore) {
        console.warn(`⚠️  Pass ${passCount}: No progress made. ${remainingOrgs.length} organizations remain orphaned.`);
        
        // Log remaining orphaned organizations for debugging
        if (remainingOrgs.length <= 10) {
          remainingOrgs.forEach(org => {
            console.warn(`   Orphaned: ${org.objectId} (${org.name}) -> Parent: ${org.parentId}`);
          });
        } else {
          console.warn(`   ${remainingOrgs.length} orphaned organizations (showing first 5):`);
          remainingOrgs.slice(0, 5).forEach(org => {
            console.warn(`   Orphaned: ${org.objectId} (${org.name}) -> Parent: ${org.parentId}`);
          });
        }
        break;
      }

      console.log(`✅ Pass ${passCount}: Processed ${orgCountBefore - remainingOrgs.length} organizations, ${remainingOrgs.length} remaining`);
    }

    // Fourth pass: Add positions as actual hierarchy nodes (not just properties)
    positions.forEach(position => {
      const parentId = position.parentId;
      const parentOrg = orgMap.get(parentId);
      
      if (parentOrg) {
        // Create position node as actual child in hierarchy
        const positionNode = {
          id: position.id,
          objectId: position.objectId,
          name: position.name,
          abbreviation: position.abbreviation,
          type: position.type,
          objectType: position.type, // 'S' for position
          status: position.status,
          parentId: position.parentId,
          level: (parentOrg.level || 0) + 1,
          nodeType: 'position',
          holder: position.relationship_obj_text && position.relationship_obj_text.trim() !== '' ? position.relationship_obj_text.trim() : '',
          positionLevel: this.extractPositionLevel(position),
          department: position.costCenter || 'Unknown Department',
          children: [], // Positions can also have children (sub-positions)
          positions: [] // For consistency
        };
        
        // Add position as child to its parent organization
        parentOrg.children.push(positionNode);
        
        console.log(`📌 Added position "${position.name}" under "${parentOrg.name}"`);
      } else {
        console.warn(`⚠️ Position "${position.name}" has no valid parent organization (${parentId})`);
      }
    });

    // Calculate statistics
    const statistics = this.calculateStatistics(rootNodes);

    console.log(`✅ Hierarchy built: ${rootNodes.length} root nodes, max depth: ${statistics.maxDepth}`);

    return {
      rootNodes: rootNodes,
      statistics: statistics,
      organizationMap: orgMap,
      positionsByParent: positionsByParent,
      metadata: {
        totalOrganizations: organizations.length,
        totalPositions: positions.length,
        processedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Clean and standardize a database record
   * @param {Object} record - Raw database record
   * @returns {Object} Cleaned record
   */
  cleanRecord(record) {
    return {
      id: record.id,
      objectId: record.object_id,
      name: record.object_description || 'Unnamed Unit',
      abbreviation: record.object_abbr || '',
      type: record.object_type,
      status: record.status_object || 'Unknown',
      parentId: record.parent_relationship_obj_id || null,
      manager: record.parent_relationship_obj_text || '',
      relationshipText: record.relationship_text || '',
      relationshipObjText: record.relationship_obj_text || '', // ✅ Added for staff names
      costCenter: record.cost_center_text || '',
      vacant: record.vacant_status === 'Yes' || record.vacant_status === 'Vacant',
      createdAt: record.created_at,
      updatedAt: record.updated_at
    };
  }

  /**
   * Extract position level from record data
   * @param {Object} record - Database record
   * @returns {string} Position level
   */
  extractPositionLevel(record) {
    // Try to extract level from various fields
    const description = record.object_description || '';
    const manager = record.parent_relationship_obj_text || '';
    const relationship = record.relationship_text || '';

    // Look for common level indicators
    const levelPatterns = [
      /level\s*(\d+)/i,
      /l(\d+)/i,
      /grade\s*(\d+)/i,
      /(junior|senior|lead|chief|director|manager|supervisor|coordinator|analyst|specialist)/i
    ];

    for (let pattern of levelPatterns) {
      const match = description.match(pattern) || manager.match(pattern) || relationship.match(pattern);
      if (match) {
        if (match[1]) return `Level ${match[1]}`;
        return this.mapTitleToLevel(match[1] || match[0]);
      }
    }

    // Default level based on object type and name
    if (description.toLowerCase().includes('manager') || description.toLowerCase().includes('head')) {
      return 'Management Level';
    } else if (description.toLowerCase().includes('senior')) {
      return 'Senior Level';  
    } else if (description.toLowerCase().includes('junior')) {
      return 'Junior Level';
    }

    return 'Staff Level';
  }

  /**
   * Map job title to level category
   * @param {string} title - Job title
   * @returns {string} Level category
   */
  mapTitleToLevel(title) {
    const titleLower = title.toLowerCase();
    
    if (['chief', 'director', 'vice president', 'president'].some(t => titleLower.includes(t))) {
      return 'Executive Level';
    } else if (['manager', 'head', 'superintendent'].some(t => titleLower.includes(t))) {
      return 'Management Level';
    } else if (['supervisor', 'lead', 'coordinator'].some(t => titleLower.includes(t))) {
      return 'Supervisory Level';
    } else if (['senior', 'principal', 'specialist'].some(t => titleLower.includes(t))) {
      return 'Senior Level';
    } else if (['junior', 'trainee', 'assistant'].some(t => titleLower.includes(t))) {
      return 'Junior Level';
    }
    
    return 'Staff Level';
  }

  /**
   * Check if adding a child would create circular reference
   * @param {string} childId - Child node ID
   * @param {string} parentId - Parent node ID  
   * @param {Map} orgMap - Organization map
   * @returns {boolean} True if would create circular reference
   */
  wouldCreateCircularReference(childId, parentId, orgMap) {
    const visited = new Set();
    let current = parentId;
    
    while (current && !visited.has(current)) {
      if (current === childId) return true;
      visited.add(current);
      
      const node = orgMap.get(current);
      current = node ? node.parentId : null;
    }
    
    return false;
  }

  /**
   * Calculate hierarchy statistics
   * @param {Array} rootNodes - Root nodes of hierarchy
   * @returns {Object} Statistics object
   */
  calculateStatistics(rootNodes) {
    let totalOrganizations = 0;
    let totalPositions = 0;
    let maxDepth = 0;

    const traverse = (node, depth = 0) => {
      totalOrganizations++;
      totalPositions += (node.positions || []).length;
      maxDepth = Math.max(maxDepth, depth);

      if (node.children) {
        node.children.forEach(child => traverse(child, depth + 1));
      }
    };

    rootNodes.forEach(root => traverse(root));

    return {
      totalOrganizations,
      totalPositions,
      maxDepth,
      rootCount: rootNodes.length
    };
  }

  /**
   * Count total nodes in hierarchy
   * @param {Object} hierarchy - Hierarchy object
   * @returns {number} Total node count
   */
  countTotalNodes(hierarchy) {
    if (!hierarchy || !hierarchy.rootNodes) return 0;
    
    const count = (node) => {
      let total = 1;
      if (node.children) {
        total += node.children.reduce((sum, child) => sum + count(child), 0);
      }
      return total;
    };

    return hierarchy.rootNodes.reduce((sum, root) => sum + count(root), 0);
  }

  /**
   * Check if cache is still valid
   * @returns {boolean} True if cache is valid
   */
  isValidCache() {
    if (!this.cache.lastUpdated) return false;
    const now = new Date();
    return (now - this.cache.lastUpdated) < this.cache.cacheDuration;
  }

  /**
   * Get specific organizational branch
   * @param {string} rootNodeId - ID of root node to get branch for
   * @returns {Object} Specific organizational branch
   */
  async getOrganizationalBranch(rootNodeId) {
    const hierarchy = await this.getOrganizationalHierarchy();
    
    if (!hierarchy.success) {
      throw new Error('Failed to get organizational hierarchy');
    }

    const findNode = (nodes, targetId) => {
      for (let node of nodes) {
        if (node.objectId === targetId) return node;
        if (node.children) {
          const found = findNode(node.children, targetId);
          if (found) return found;
        }
      }
      return null;
    };

    const branch = findNode(hierarchy.data.rootNodes, rootNodeId);
    if (!branch) {
      throw new Error(`Organizational branch not found: ${rootNodeId}`);
    }

    return {
      success: true,
      data: branch,
      metadata: {
        branchId: rootNodeId,
        nodeCount: this.countTotalNodes({ rootNodes: [branch] }),
        extractedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Search for organizations or positions by name
   * @param {string} searchTerm - Search term
   * @param {string} nodeType - 'organization', 'position', or 'all'
   * @returns {Array} Search results
   */
  async searchNodes(searchTerm, nodeType = 'all') {
    const hierarchy = await this.getOrganizationalHierarchy();
    
    if (!hierarchy.success) {
      throw new Error('Failed to get organizational hierarchy');
    }

    const results = [];
    const searchLower = searchTerm.toLowerCase();

    const search = (node, path = []) => {
      const currentPath = [...path, { id: node.objectId, name: node.name }];
      
      // Check organization name
      if ((nodeType === 'all' || nodeType === 'organization') && 
          node.nodeType === 'organization' &&
          node.name.toLowerCase().includes(searchLower)) {
        results.push({
          type: 'organization',
          id: node.objectId,
          name: node.name,
          manager: node.manager,
          level: node.level,
          path: currentPath.slice(0, -1), // Exclude self from path
          fullPath: currentPath.map(p => p.name).join(' → ')
        });
      }

      // Check positions
      if ((nodeType === 'all' || nodeType === 'position') && node.positions) {
        node.positions.forEach(position => {
          if (position.name.toLowerCase().includes(searchLower) ||
              position.holder.toLowerCase().includes(searchLower)) {
            results.push({
              type: 'position',
              id: position.objectId,
              name: position.name,
              holder: position.holder,
              level: position.positionLevel,
              department: position.department,
              parentOrg: node.name,
              path: currentPath,
              fullPath: [...currentPath, { name: position.name }].map(p => p.name).join(' → ')
            });
          }
        });
      }

      // Recursively search children
      if (node.children) {
        node.children.forEach(child => search(child, currentPath));
      }
    };

    hierarchy.data.rootNodes.forEach(root => search(root));

    return {
      success: true,
      data: results,
      metadata: {
        searchTerm,
        nodeType,
        resultCount: results.length,
        searchedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Get filtered organizational hierarchy showing only the specific path:
   * Level 1: PRESIDENT OFFICE → Level 2: SINARMAS MINING GROUP → 
   * Level 3: BERAU COAL ENERGY GROUP → Level 4: PT. BERAU COAL ENERGY → 
   * Level 5: OPERATION DIRECTORATE → Level 6: XXX - MARINE DIVISION
   * Plus all children below Level 6
   * @returns {Object} Filtered organizational hierarchy
   */
  async getFilteredOrganizationalHierarchy() {
    console.log('🎯 Building filtered organizational flowchart for specific hierarchy path...');

    try {
      // Get the full hierarchy first
      const fullHierarchy = await this.getOrganizationalHierarchy();
      if (!fullHierarchy.success) {
        throw new Error('Failed to get full hierarchy');
      }

      // Define the target organizational path with actual IDs from database
      const targetPath = [
        { id: '60020523', name: 'PRESIDENT OFFICE', level: 0 },
        { id: '60032963', name: 'SINARMAS MINING GROUP', level: 1 },
        // Note: BERAU COAL ENERGY GROUP might be represented as PT. BERAU COAL ENERGY in the data
        { id: '60005084', name: 'PT. BERAU COAL ENERGY', level: 2 },
        { id: '60005199', name: 'OPERATION DIRECTORATE', level: 3 },
        { id: '60005200', name: 'XXX - MARINE DIVISION - BCE', level: 4 }
      ];

      console.log('🔍 Target path:', targetPath);

      // Build the filtered hierarchy following the specific path
      const filteredHierarchy = this.buildFilteredHierarchy(fullHierarchy.data.rootNodes, targetPath);

      const statistics = this.calculateStatistics(filteredHierarchy.rootNodes);

      console.log(`✅ Filtered hierarchy built with ${filteredHierarchy.rootNodes.length} root nodes following the specific path`);

      return {
        success: true,
        data: {
          rootNodes: filteredHierarchy.rootNodes,
          statistics: statistics,
          filterApplied: true,
          targetPath: targetPath,
          metadata: {
            totalOrganizations: statistics.totalOrganizations,
            totalPositions: statistics.totalPositions,
            maxDepth: statistics.maxDepth,
            processedAt: new Date().toISOString(),
            filterType: 'specific-hierarchy-path'
          }
        },
        metadata: {
          filterApplied: true,
          targetPathLength: targetPath.length,
          filteredNodes: statistics.totalOrganizations,
          processedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Error building filtered organizational flowchart:', error);
      throw new Error(`Failed to build filtered organizational flowchart: ${error.message}`);
    }
  }

  /**
   * Build filtered hierarchy following the specific organizational path
   * @param {Array} rootNodes - Full hierarchy root nodes
   * @param {Array} targetPath - Target organizational path to follow
   * @returns {Object} Filtered hierarchy structure
   */
  buildFilteredHierarchy(rootNodes, targetPath) {
    console.log('🔧 Building filtered hierarchy structure...');

    const filteredRootNodes = [];

    // Helper function to find a node by ID in the hierarchy
    const findNodeById = (nodes, targetId) => {
      for (const node of nodes) {
        if (node.objectId === targetId) {
          return node;
        }
        if (node.children && node.children.length > 0) {
          const found = findNodeById(node.children, targetId);
          if (found) return found;
        }
      }
      return null;
    };

    // Helper function to deep clone a node without children
    const cloneNodeWithoutChildren = (node) => {
      return {
        ...node,
        children: [],
        positions: node.positions ? [...node.positions] : []
      };
    };

    // Helper function to include ALL children below a certain level
    const includeAllChildrenBelow = (node, currentLevel, includeFromLevel) => {
      const clonedNode = cloneNodeWithoutChildren(node);
      clonedNode.level = currentLevel;

      if (node.children && node.children.length > 0) {
        if (currentLevel >= includeFromLevel) {
          // Include ALL children and their descendants
          clonedNode.children = node.children.map(child => 
            includeAllChildrenBelow(child, currentLevel + 1, includeFromLevel)
          );
        } else {
          // We're still following the specific path, don't include all children yet
          clonedNode.children = [];
        }
      }

      console.log(`📋 ${currentLevel >= includeFromLevel ? 'Including all children' : 'Following path'} for level ${currentLevel}: ${clonedNode.name}`);
      return clonedNode;
    };

    // Start with the first node in target path (PRESIDENT OFFICE)
    const presidendOffice = findNodeById(rootNodes, targetPath[0].id);
    if (!presidendOffice) {
      console.warn(`⚠️ PRESIDENT OFFICE not found (ID: ${targetPath[0].id})`);
      return { rootNodes: [] };
    }

    // Create the filtered root node
    const filteredPresidentOffice = cloneNodeWithoutChildren(presidendOffice);
    filteredPresidentOffice.level = 0;

    // Follow the target path step by step
    let currentNode = filteredPresidentOffice;
    let currentSourceNode = presidendOffice;

    for (let pathIndex = 1; pathIndex < targetPath.length; pathIndex++) {
      const targetStep = targetPath[pathIndex];
      
      console.log(`🎯 Looking for path step ${pathIndex}: ${targetStep.name} (ID: ${targetStep.id})`);
      
      // Find the target child in the current source node
      const targetChild = currentSourceNode.children ? 
        currentSourceNode.children.find(child => child.objectId === targetStep.id) : null;
      
      if (!targetChild) {
        console.warn(`⚠️ Target child not found in path: ${targetStep.name} (ID: ${targetStep.id})`);
        // Try to find it anywhere in the hierarchy
        const foundAnywhere = findNodeById(rootNodes, targetStep.id);
        if (foundAnywhere) {
          console.log(`🔍 Found ${targetStep.name} elsewhere in hierarchy, adding to current level`);
          const clonedChild = cloneNodeWithoutChildren(foundAnywhere);
          clonedChild.level = pathIndex;
          currentNode.children.push(clonedChild);
          currentNode = clonedChild;
          currentSourceNode = foundAnywhere;
        } else {
          console.warn(`❌ ${targetStep.name} not found anywhere in hierarchy`);
          break;
        }
        continue;
      }

      // Create the child node following the path
      let clonedChild;
      
      if (pathIndex >= 4) { // Level 5 and below (XXX - MARINE DIVISION is level 4, so include all from level 4)
        // Include ALL children and descendants from this level onwards
        clonedChild = includeAllChildrenBelow(targetChild, pathIndex, pathIndex);
        console.log(`📊 Including all children from level ${pathIndex} onwards for ${targetStep.name}`);
      } else {
        // Still following the specific path
        clonedChild = cloneNodeWithoutChildren(targetChild);
        clonedChild.level = pathIndex;
        console.log(`➡️ Following path to level ${pathIndex}: ${targetStep.name}`);
      }

      currentNode.children.push(clonedChild);
      currentNode = clonedChild;
      currentSourceNode = targetChild;
    }

    // If we reached the XXX - MARINE DIVISION level, include ALL its children and descendants
    if (currentSourceNode && currentSourceNode.children && currentSourceNode.children.length > 0) {
      console.log(`🌳 Adding ALL children and descendants below ${currentSourceNode.name}`);
      currentNode.children = currentSourceNode.children.map(child => 
        includeAllChildrenBelow(child, (currentNode.level || 0) + 1, 0) // Include all from level 0 (which means include everything)
      );
    }

    filteredRootNodes.push(filteredPresidentOffice);

    return { rootNodes: filteredRootNodes };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.fullHierarchy = null;
    this.cache.lastUpdated = null;
    console.log('🗑️ Organizational flowchart cache cleared');
  }
}

module.exports = OrganizationalFlowchartService;