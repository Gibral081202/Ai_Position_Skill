const OrganizationalFlowchartService = require('./src/services/orgFlowchartService');

async function testHierarchy() {
  console.log('🧪 Testing Fixed Organizational Hierarchy...\n');

  const service = new OrganizationalFlowchartService();
  
  try {
    const result = await service.getOrganizationalHierarchy(true); // Force refresh
    
    if (result.success) {
      console.log(`✅ Success! Hierarchy loaded with:`);
      console.log(`   📊 Total Organizations: ${result.metadata.totalOrganizations}`);
      console.log(`   👥 Total Positions: ${result.metadata.totalPositions}`);
      console.log(`   🏛️  Root Nodes: ${result.metadata.rootNodes}`);
      console.log(`   📏 Max Depth: ${result.metadata.maxDepth}`);
      
      console.log(`\n🏛️  ROOT ORGANIZATIONS (${result.data.rootNodes.length}):`);
      result.data.rootNodes.forEach((root, index) => {
        console.log(`   ${index + 1}. ${root.objectId}: ${root.name}`);
        console.log(`      👥 Direct Children: ${root.children ? root.children.length : 0}`);
        console.log(`      🎯 Direct Positions: ${root.positions ? root.positions.length : 0}`);
        
        // Show first few children if they exist
        if (root.children && root.children.length > 0) {
          console.log(`      📂 Sample Children:`);
          root.children.slice(0, 5).forEach(child => {
            console.log(`         - ${child.objectId}: ${child.name}`);
          });
          if (root.children.length > 5) {
            console.log(`         ... and ${root.children.length - 5} more`);
          }
        }
        console.log('');
      });
      
      // Verify the specific organizations from your image are properly nested
      console.log(`\n🔍 SEARCHING FOR ORGANIZATIONS FROM YOUR IMAGE:`);
      
      const searchTerms = ['TAX', 'BRANCH CILACAP', 'POS KOVA', 'POS MAENANG', 'POS SIDAREJA', 'REMEDIAL'];
      
      const searchInHierarchy = (nodes, term, depth = 0) => {
        const results = [];
        for (const node of nodes) {
          if (node.name.toLowerCase().includes(term.toLowerCase())) {
            results.push({
              id: node.objectId,
              name: node.name,
              level: node.level || depth,
              parentName: node.parentId ? 'Has Parent' : 'Root'
            });
          }
          if (node.children) {
            results.push(...searchInHierarchy(node.children, term, depth + 1));
          }
        }
        return results;
      };
      
      searchTerms.forEach(term => {
        const matches = searchInHierarchy(result.data.rootNodes, term);
        if (matches.length > 0) {
          console.log(`   🎯 "${term}" found ${matches.length} matches:`);
          matches.forEach(match => {
            console.log(`      - Level ${match.level}: ${match.id} - ${match.name} (${match.parentName})`);
          });
        } else {
          console.log(`   ⚠️  "${term}" not found`);
        }
        console.log('');
      });
      
    } else {
      console.error('❌ Failed to load hierarchy:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error testing hierarchy:', error.message);
  }
}

testHierarchy();