import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Card,
  CardContent,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Collapse
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CloudUpload as UploadIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  AccountTree as AccountTreeIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
  ReactFlowProvider,
  MiniMap
} from 'reactflow';
import 'reactflow/dist/style.css';

// Custom FlowChart Node Component for Organizational Units
const FlowChartOrgNode = ({ data }) => {
  const [showPositions, setShowPositions] = useState(true);
  const [expanding, setExpanding] = useState(false);

  const nodeStyle = {
    padding: '8px',
    borderRadius: '6px',
    border: data.type === 'root' ? '2px solid #1976d2' : '1px solid #1976d2',
    backgroundColor: data.type === 'root' ? '#1976d2' : '#ffffff',
    color: data.type === 'root' ? 'white' : '#1976d2',
    minWidth: '250px',
    maxWidth: '320px',
    boxShadow: data.type === 'root' 
      ? '0 4px 12px rgba(25, 118, 210, 0.3)'
      : '0 2px 8px rgba(0,0,0,0.1)',
    cursor: 'default',
    fontFamily: 'Segoe UI, Arial, sans-serif'
  };

  const positionStyle = {
    fontSize: '9px',
    padding: '6px 8px',
    marginTop: '3px',
    backgroundColor: data.type === 'root' ? 'rgba(255,255,255,0.25)' : '#f8f9fa',
    borderRadius: '4px',
    border: `1px solid ${data.type === 'root' ? 'rgba(255,255,255,0.4)' : '#e0e7ff'}`,
    color: data.type === 'root' ? 'white' : '#333',
    minHeight: '35px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  };

  // Handle expand children
  const handleExpand = async () => {
    if (data.onExpand && !data.isExpanded && !expanding) {
      setExpanding(true);
      try {
        await data.onExpand();
      } catch (error) {
        console.error('Error expanding node:', error);
      }
      setExpanding(false);
    }
  };

  // Handle person click for assessment
  const handlePersonClick = (position) => {
    if (data.onPersonSelect && position.holder && position.holder !== 'Vacant') {
      data.onPersonSelect({
        name: position.holder,
        positionTitle: position.name || position.title,
        positionLevel: position.level || 'Unknown Level'
      });
    }
  };

  // Display ALL positions with complete people data as requested by user
  const displayPositions = data.positions || [];
  const positionsToShow = displayPositions; // Show ALL positions and people data

  return (
    <>
      <Handle 
        type="target" 
        position={Position.Top} 
        style={{ 
          backgroundColor: '#1976d2',
          width: 6,
          height: 6,
          border: '2px solid white'
        }} 
      />
      
      <div style={nodeStyle}>
        <Box display="flex" alignItems="center" justifyContent="space-between" marginBottom="6px">
          <Typography 
            variant="h6" 
            style={{ 
              fontWeight: 'bold', 
              fontSize: data.type === 'root' ? '11px' : '10px',
              lineHeight: '1.1',
              flex: 1
            }}
          >
            {data.name}
          </Typography>
          
          {/* Level indicator */}
          <Chip 
            label={`L${data.level + 1}`} 
            size="small" 
            sx={{ 
              fontSize: '8px', 
              height: '16px',
              backgroundColor: data.type === 'root' ? 'rgba(255,255,255,0.2)' : '#e3f2fd',
              color: data.type === 'root' ? 'white' : '#1976d2'
            }}
          />
          
          {/* Expand button for nodes with children */}
          {data.hasChildren && (
            <IconButton
              size="small"
              onClick={handleExpand}
              disabled={expanding || data.isExpanded}
              style={{
                padding: '2px',
                color: data.type === 'root' ? 'white' : '#1976d2',
                marginLeft: '4px'
              }}
            >
              {expanding ? (
                <CircularProgress size={12} style={{ color: data.type === 'root' ? 'white' : '#1976d2' }} />
              ) : data.isExpanded ? (
                <ExpandLessIcon fontSize="small" />
              ) : (
                <ExpandMoreIcon fontSize="small" />
              )}
            </IconButton>
          )}
        </Box>
        
        {data.manager && (
          <Typography 
            variant="body2" 
            style={{ 
              fontWeight: '400',
              marginBottom: '4px',
              fontSize: '8px',
              opacity: 0.8
            }}
          >
            👤 {data.manager}
          </Typography>
        )}

        {/* Statistics */}
        <Box display="flex" gap={0.5} marginBottom="6px">
          {data.stats && (
            <>
              <Chip 
                label={`${data.stats.directPositions || 0}👥`} 
                size="small" 
                sx={{ 
                  fontSize: '8px', 
                  height: '16px',
                  backgroundColor: data.type === 'root' ? 'rgba(255,255,255,0.15)' : '#f0f7ff',
                  color: data.type === 'root' ? 'white' : '#1976d2'
                }}
              />
              {data.stats.directChildren > 0 && (
                <Chip 
                  label={`${data.stats.directChildren}🏢`} 
                  size="small" 
                  sx={{ 
                    fontSize: '8px', 
                    height: '16px',
                    backgroundColor: data.type === 'root' ? 'rgba(255,255,255,0.15)' : '#fff3e0',
                    color: data.type === 'root' ? 'white' : '#f57c00'
                  }}
                />
              )}
            </>
          )}
        </Box>

        {/* All Positions & People Data */}
        {positionsToShow.length > 0 && (
          <Box sx={{ maxHeight: '200px', overflowY: 'auto', '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: data.type === 'root' ? 'rgba(255,255,255,0.5)' : '#1976d2', borderRadius: '2px' } }}>
            <Typography 
              variant="caption" 
              style={{ 
                fontWeight: '600', 
                fontSize: '8px',
                opacity: 0.8,
                marginBottom: '3px',
                display: 'block',
                color: data.type === 'root' ? 'white' : '#1976d2'
              }}
            >
              All Positions & People:
            </Typography>
            
            <Box>
              {positionsToShow.map((position, index) => (
                <div 
                  key={`${data.name}-position-${position.id}-${index}`} 
                  style={{
                    ...positionStyle,
                    cursor: position.holder && position.holder !== 'Vacant' ? 'pointer' : 'default'
                  }}
                  onClick={() => handlePersonClick(position)}
                  title={position.holder && position.holder !== 'Vacant' ? 'Click to select for assessment' : ''}
                >
                  <Typography variant="caption" style={{ fontWeight: '600', fontSize: '8px', lineHeight: '1.2' }}>
                    {position.name.length > 30 ? position.name.substring(0, 27) + '...' : position.name}
                  </Typography>
                  {position.holder && position.holder !== 'Vacant' && (
                    <Typography 
                      variant="caption" 
                      style={{ 
                        display: 'block', 
                        fontSize: '7px', 
                        opacity: 0.9,
                        color: 'inherit',
                        fontWeight: '500',
                        marginTop: '1px'
                      }}
                    >
                      👤 {position.holder.length > 20 ? position.holder.substring(0, 17) + '...' : position.holder}
                    </Typography>
                  )}
                </div>
              ))}
              
              {/* Show total positions count */}
              {displayPositions.length > 0 && (
                <Typography 
                  variant="caption" 
                  style={{ 
                    fontSize: '7px',
                    opacity: 0.7,
                    fontStyle: 'italic',
                    display: 'block',
                    textAlign: 'center',
                    marginTop: '3px',
                    fontWeight: '500'
                  }}
                >
                  Total: {displayPositions.length} positions
                </Typography>
              )}
            </Box>
          </Box>
        )}

        {/* Expand hint for nodes with children */}
        {data.hasChildren && !data.isExpanded && (
          <Typography 
            variant="caption" 
            style={{ 
              fontSize: '6px',
              opacity: 0.6,
              fontStyle: 'italic',
              display: 'block',
              textAlign: 'center',
              marginTop: '4px'
            }}
          >
            ⬇ {data.stats?.directChildren || 0} depts
          </Typography>
        )}
      </div>
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        style={{ 
          backgroundColor: '#1976d2',
          width: 6,
          height: 6,
          border: '2px solid white'
        }} 
      />
    </>
  );
};

// Node types configuration
const nodeTypes = {
  flowchartOrg: FlowChartOrgNode,
};

const FlowChartOrgStructure = ({ onPersonSelect }) => {
  const [orgData, setOrgData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loadedNodes, setLoadedNodes] = useState(new Set());
  const [currentLevelsShown, setCurrentLevelsShown] = useState(2); // Start with 2 levels as requested by user
  
  // ReactFlow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // File upload handler
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('orgFile', file);

    try {
      const response = await fetch('/api/org-chart/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload file');
      }

      console.log('📁 File processed successfully:', result);
      
      // Load root nodes for progressive flowchart display
      await loadRootNodesForFlowchart();

    } catch (error) {
      console.error('❌ Upload error:', error);
      setError(`Upload failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Load root organizational nodes for flowchart
  const loadRootNodesForFlowchart = async () => {
    try {
      const response = await fetch('/api/org-chart/roots');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load organizational data');
      }

      console.log('🌳 Root nodes loaded for flowchart:', result);
      
      // Convert to ReactFlow format with initial 2 levels showing all position data
      const { nodes: flowNodes, edges: flowEdges } = await convertToFlowChart(result.data, 2);
      setNodes(flowNodes);
      setEdges(flowEdges);
      setOrgData(result.data);
      setCurrentLevelsShown(2);

    } catch (error) {
      console.error('❌ Error loading root nodes:', error);
      setError(`Failed to load data: ${error.message}`);
    }
  };

  // Convert organizational data to ReactFlow flowchart format
  const convertToFlowChart = async (rootData, maxLevels = 5) => {
    const flowNodes = [];
    const flowEdges = [];
    let nodeIdCounter = 0;

    // Calculate layout positions - OPTIMIZED for showing all position data
    const rootSpacing = 900; // Horizontal spacing between root organizations (increased for wider nodes)
    const levelSpacing = 400; // Vertical spacing between levels (increased for taller nodes)
    const siblingSpacing = 550; // Horizontal spacing between siblings (increased for wider nodes)

    console.log(`🎯 Converting to flowchart with max ${maxLevels} levels showing ALL position data...`);

    // Process each root organization
    for (let rootIndex = 0; rootIndex < rootData.length; rootIndex++) {
      const rootNode = rootData[rootIndex];
      const rootX = rootIndex * rootSpacing;
      
      await processNodeForFlowChart(
        rootNode, 
        0, // level
        null, // parentId
        rootX, // x position
        0, // y position
        flowNodes, 
        flowEdges, 
        maxLevels,
        rootIndex,
        levelSpacing, // Pass levelSpacing
        siblingSpacing // Pass siblingSpacing
      );
    }

    return { nodes: flowNodes, edges: flowEdges };
  };

  // Process a single node for flowchart layout
  const processNodeForFlowChart = async (node, level, parentId, x, y, nodes, edges, maxLevels, rootIndex, levelSpacing, siblingSpacing) => {
    if (level >= maxLevels) return;

    const nodeId = `${rootIndex}-${node.id}-${level}`;
    
    // Create the flowchart node
    nodes.push({
      id: nodeId,
      type: 'flowchartOrg',
      position: { x, y },
      data: {
        name: node.name,
        manager: node.manager,
        positions: node.positions || [],
        type: level === 0 ? 'root' : 'department',
        level: level,
        hasChildren: node.hasChildren,
        isExpanded: level < 1, // Auto-expand only first level
        stats: node.stats,
        onExpand: node.hasChildren ? () => loadNodeChildren(node.id, nodeId, level) : null,
        onPersonSelect: onPersonSelect
      }
    });

    // Create edge to parent
    if (parentId) {
      edges.push({
        id: `edge-${parentId}-${nodeId}`,
        source: parentId,
        target: nodeId,
        type: 'smoothstep',
        animated: false,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 12,
          height: 12,
          color: '#1976d2',
        },
        style: {
          strokeWidth: 2,
          stroke: '#1976d2',
        }
      });
    }

    // If this node has children and we haven't reached max levels, load them
    if (node.hasChildren && level < maxLevels - 1) {
      try {
        // Load children from API
        const response = await fetch(`/api/org-chart/children/${node.id}`);
        const result = await response.json();

        if (response.ok && result.data) {
          const children = result.data;
          const childrenCount = children.length;
          
          // Calculate child positions
          const childY = y + levelSpacing;
          const totalChildWidth = (childrenCount - 1) * siblingSpacing;
          const startX = x - totalChildWidth / 2;

          // Process each child
          for (let i = 0; i < children.length; i++) {
            const child = children[i];
            const childX = startX + (i * siblingSpacing);
            
            await processNodeForFlowChart(
              child,
              level + 1,
              nodeId,
              childX,
              childY,
              nodes,
              edges,
              maxLevels,
              rootIndex,
              levelSpacing, // Pass levelSpacing
              siblingSpacing // Pass siblingSpacing
            );
          }
        }
      } catch (error) {
        console.error(`❌ Error loading children for node ${node.id}:`, error);
      }
    }
  };

  // Load children for a specific node (for expand functionality)
  const loadNodeChildren = async (originalNodeId, flowNodeId, currentLevel) => {
    console.log(`🔄 Loading children for node: ${originalNodeId}`);
    
    try {
      const response = await fetch(`/api/org-chart/children/${originalNodeId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load children');
      }

      // Mark node as expanded
      setNodes(prevNodes => 
        prevNodes.map(node => 
          node.id === flowNodeId 
            ? { ...node, data: { ...node.data, isExpanded: true } }
            : node
        )
      );

      setLoadedNodes(prev => new Set(prev.add(originalNodeId)));
      
      console.log(`✅ Loaded ${result.data.length} children for node ${originalNodeId}`);

    } catch (error) {
      console.error('Error loading node children:', error);
      setError(`Failed to load children: ${error.message}`);
    }
  };

  // Load next 2 levels
  const loadNext2Levels = async () => {
    console.log('🔄 Loading next 2 levels with full position data...');
    setLoading(true);
    
    try {
      const newMaxLevels = currentLevelsShown + 2;
      const { nodes: newNodes, edges: newEdges } = await convertToFlowChart(orgData, newMaxLevels);
      
      setNodes(newNodes);
      setEdges(newEdges);
      setCurrentLevelsShown(newMaxLevels);
      
      console.log(`✅ Now showing ${newMaxLevels} levels with complete position data`);
      
    } catch (error) {
      console.error('❌ Error loading next 2 levels:', error);
      setError(`Failed to load additional levels: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%', height: '800px' }}>
      {/* Header */}
      <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1, mb: 1 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <AccountTreeIcon color="primary" />
          Organizational Structure Flowchart
        </Typography>
        
        {!orgData && (
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="body2">
              Upload an organizational chart file to view the flowchart (2 levels with all position & people data). Click on any person to populate the assessment form.
            </Typography>
            
            <input
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              id="flowchart-file-upload"
              type="file"
              onChange={handleFileUpload}
              disabled={loading}
            />
            <label htmlFor="flowchart-file-upload">
              <Button
                variant="contained"
                component="span"
                startIcon={loading ? <CircularProgress size={16} /> : <UploadIcon />}
                disabled={loading}
                size="small"
              >
                {loading ? 'Processing...' : 'Upload'}
              </Button>
            </label>
          </Box>
        )}

        {orgData && (
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="body2">
              Showing {currentLevelsShown} levels | Complete position & people data
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ExpandMoreIcon />}
              onClick={loadNext2Levels}
              disabled={loading}
            >
              Load Next 2 Levels
            </Button>
            <IconButton size="small" onClick={loadRootNodesForFlowchart} title="Refresh">
              <RefreshIcon />
            </IconButton>
          </Box>
        )}
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Flowchart Display */}
      <Box sx={{ height: '750px', border: '1px solid #ddd', borderRadius: 1 }}>
        {orgData && !loading ? (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
          >
            <Background color="#f0f7ff" gap={20} />
            <Controls position="top-right" />
            <MiniMap 
              nodeColor="#1976d2"
              nodeStrokeWidth={3}
              position="bottom-right"
              style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #ddd'
              }}
            />
          </ReactFlow>
        ) : loading ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%' 
          }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ mt: 1 }}>
              {selectedFile ? 'Processing organizational data...' : 'Loading flowchart...'}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            color: '#666'
          }}>
            <AccountTreeIcon sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="body1">No organizational data loaded</Typography>
            <Typography variant="body2">Upload a file to view the flowchart</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

// Wrap in ReactFlowProvider
const FlowChartOrgStructureWrapper = ({ onPersonSelect }) => (
  <ReactFlowProvider>
    <FlowChartOrgStructure onPersonSelect={onPersonSelect} />
  </ReactFlowProvider>
);

export default FlowChartOrgStructureWrapper;