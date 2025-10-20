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
  const [expanding, setExpanding] = useState(false);

  // Different styles for Organizations (O) and Positions (S)
  const getNodeStyle = () => {
    const baseStyle = {
      padding: '10px',
      borderRadius: '8px',
      minWidth: '200px',
      maxWidth: '280px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      cursor: 'default',
      fontFamily: 'Segoe UI, Arial, sans-serif',
      border: '2px solid'
    };

    if (data.type === 'root') {
      // Top-level organizations - Blue theme
      return {
        ...baseStyle,
        backgroundColor: '#1976d2',
        color: 'white',
        borderColor: '#1565c0',
        boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)'
      };
    } else if (data.nodeType === 'organization') {
      // Sub-organizations (Object Type O) - Light blue theme
      return {
        ...baseStyle,
        backgroundColor: '#e3f2fd',
        color: '#1976d2',
        borderColor: '#1976d2'
      };
    } else if (data.nodeType === 'position') {
      // Positions (Object Type S) - Green theme
      return {
        ...baseStyle,
        backgroundColor: '#e8f5e8',
        color: '#2e7d32',
        borderColor: '#4caf50',
        minWidth: '180px',
        maxWidth: '250px'
      };
    }
    
    return baseStyle;
  };

  const nodeStyle = getNodeStyle();

  const headerStyle = {
    fontSize: data.type === 'root' ? '14px' : (data.nodeType === 'position' ? '11px' : '12px'),
    fontWeight: 'bold',
    lineHeight: '1.2',
    marginBottom: '8px'
  };

  // Handle expand/collapse children
  const handleExpandCollapse = async () => {
    if (data.onExpandCollapse && !expanding) {
      setExpanding(true);
      try {
        await data.onExpandCollapse(data.id, !data.isExpanded);
      } catch (error) {
        console.error('Error expanding/collapsing node:', error);
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

  const displayPositions = data.positions || [];

  return (
    <>
      <Handle 
        type="target" 
        position={Position.Top} 
        style={{ 
          backgroundColor: data.nodeType === 'position' ? '#4caf50' : '#1976d2',
          width: 8,
          height: 8,
          border: '2px solid white'
        }} 
      />
      
      <div style={nodeStyle}>
        {/* Header with expand/collapse button */}
        <Box display="flex" alignItems="center" justifyContent="space-between" marginBottom="6px">
          <Typography style={headerStyle}>
            {data.name}
          </Typography>
          
          {/* Level and Type indicators */}
          <Box display="flex" gap={0.5}>
            <Chip 
              label={data.nodeType === 'position' ? 'POS' : 'ORG'} 
              size="small" 
              sx={{ 
                fontSize: '8px', 
                height: '18px',
                backgroundColor: data.nodeType === 'position' ? '#c8e6c9' : (data.type === 'root' ? 'rgba(255,255,255,0.2)' : '#bbdefb'),
                color: data.nodeType === 'position' ? '#2e7d32' : (data.type === 'root' ? 'white' : '#1976d2')
              }}
            />
            
            {data.level !== undefined && (
              <Chip 
                label={`L${data.level + 1}`} 
                size="small" 
                sx={{ 
                  fontSize: '8px', 
                  height: '18px',
                  backgroundColor: data.type === 'root' ? 'rgba(255,255,255,0.2)' : '#f5f5f5',
                  color: data.type === 'root' ? 'white' : '#666'
                }}
              />
            )}
          </Box>
        </Box>
        
        {/* Manager information */}
        {data.manager && (
          <Typography 
            variant="body2" 
            style={{ 
              fontWeight: '400',
              marginBottom: '8px',
              fontSize: '9px',
              opacity: 0.9
            }}
          >
            👤 {data.manager}
          </Typography>
        )}

        {/* Statistics */}
        {data.stats && (
          <Box display="flex" gap={0.5} marginBottom="8px" flexWrap="wrap">
            {data.stats.directPositions > 0 && (
              <Chip 
                label={`${data.stats.directPositions} positions`} 
                size="small" 
                sx={{ 
                  fontSize: '8px', 
                  height: '18px',
                  backgroundColor: data.type === 'root' ? 'rgba(255,255,255,0.15)' : (data.nodeType === 'position' ? '#c8e6c9' : '#f0f7ff'),
                  color: data.type === 'root' ? 'white' : (data.nodeType === 'position' ? '#2e7d32' : '#1976d2')
                }}
              />
            )}
            {data.stats.directChildren > 0 && (
              <Chip 
                label={`${data.stats.directChildren} units`} 
                size="small" 
                sx={{ 
                  fontSize: '8px', 
                  height: '18px',
                  backgroundColor: data.type === 'root' ? 'rgba(255,255,255,0.15)' : '#fff3e0',
                  color: data.type === 'root' ? 'white' : '#f57c00'
                }}
              />
            )}
          </Box>
        )}

        {/* Expand/Collapse Children Button */}
        {data.hasChildren && (
          <Box display="flex" justifyContent="center" marginBottom="8px">
            <Button
              size="small"
              onClick={handleExpandCollapse}
              disabled={expanding}
              startIcon={expanding ? (
                <CircularProgress size={12} style={{ color: 'inherit' }} />
              ) : data.isExpanded ? (
                <ExpandLessIcon fontSize="small" />
              ) : (
                <ExpandMoreIcon fontSize="small" />
              )}
              sx={{
                fontSize: '9px',
                padding: '4px 8px',
                backgroundColor: data.type === 'root' ? 'rgba(255,255,255,0.2)' : (data.nodeType === 'position' ? '#c8e6c9' : '#e3f2fd'),
                color: 'inherit',
                '&:hover': {
                  backgroundColor: data.type === 'root' ? 'rgba(255,255,255,0.3)' : (data.nodeType === 'position' ? '#a5d6a7' : '#bbdefb'),
                }
              }}
            >
              {data.isExpanded ? 'Collapse' : 'Expand'} ({data.stats?.directChildren || 0})
            </Button>
          </Box>
        )}

        {/* Positions List - Always visible */}
        {displayPositions.length > 0 && (
            <Box>
              <Typography 
                variant="caption" 
                style={{ 
                  fontWeight: '600', 
                  fontSize: '8px',
                  opacity: 0.8,
                  marginBottom: '4px',
                  display: 'block'
                }}
              >
                Positions:
              </Typography>
              
              <Box sx={{ maxHeight: '120px', overflowY: 'auto' }}>
                {displayPositions.map((position, index) => (
                  <div 
                    key={`${data.id}-position-${position.id}-${index}`} 
                    style={{
                      fontSize: '8px',
                      padding: '4px 6px',
                      marginTop: '2px',
                      backgroundColor: data.type === 'root' ? 'rgba(255,255,255,0.25)' : '#f8f9fa',
                      borderRadius: '4px',
                      border: `1px solid ${data.type === 'root' ? 'rgba(255,255,255,0.4)' : '#e0e7ff'}`,
                      cursor: position.holder && position.holder !== 'Vacant' ? 'pointer' : 'default',
                      minHeight: '28px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}
                    onClick={() => handlePersonClick(position)}
                    title={position.holder && position.holder !== 'Vacant' ? 'Click to select for assessment' : ''}
                  >
                    <Typography variant="caption" style={{ fontWeight: '600', fontSize: '8px', lineHeight: '1.1' }}>
                      {position.name.length > 25 ? position.name.substring(0, 22) + '...' : position.name}
                    </Typography>
                    {position.holder && position.holder !== 'Vacant' && (
                      <Typography 
                        variant="caption" 
                        style={{ 
                          fontSize: '7px', 
                          opacity: 0.9,
                          fontWeight: '500',
                          marginTop: '1px'
                        }}
                      >
                        👤 {position.holder.length > 20 ? position.holder.substring(0, 17) + '...' : position.holder}
                      </Typography>
                    )}
                  </div>
                ))}
              </Box>
            </Box>
          )}
      </div>
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        style={{ 
          backgroundColor: data.nodeType === 'position' ? '#4caf50' : '#1976d2',
          width: 8,
          height: 8,
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
  const [expandedNodes, setExpandedNodes] = useState(new Set()); // Track expanded nodes
  
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
      const response = await fetch('/mining-hr/api/org-chart/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload file');
      }

      console.log('📁 File processed successfully:', result);
      
      // Load only top-level nodes initially
      await loadTopLevelNodesOnly();

    } catch (error) {
      console.error('❌ Upload error:', error);
      setError(`Upload failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Load only top-level organizational nodes
  const loadTopLevelNodesOnly = async () => {
    try {
      const response = await fetch('/mining-hr/api/org-chart/roots');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load organizational data');
      }

      console.log('🌳 Top-level nodes loaded:', result);
      
      // Convert to ReactFlow format - ONLY TOP LEVEL
      const { nodes: flowNodes, edges: flowEdges } = convertTopLevelToFlowChart(result.data);
      setNodes(flowNodes);
      setEdges(flowEdges);
      setOrgData(result.data);
      setExpandedNodes(new Set());

    } catch (error) {
      console.error('❌ Error loading top-level nodes:', error);
      setError(`Failed to load data: ${error.message}`);
    }
  };

  // Convert top-level organizational data to ReactFlow format
  const convertTopLevelToFlowChart = (rootData) => {
    const flowNodes = [];
    const flowEdges = [];

    // Calculate positions for top-level nodes only
    const rootSpacing = 400; // Horizontal spacing between root organizations
    const startX = -(rootData.length - 1) * rootSpacing / 2; // Center align

    console.log(`🎯 Displaying ${rootData.length} top-level organizations only`);

    // Process each root organization - NO CHILDREN INITIALLY
    rootData.forEach((rootNode, index) => {
      const nodeId = `root-${rootNode.id}`;
      const x = startX + (index * rootSpacing);
      
      flowNodes.push({
        id: nodeId,
        type: 'flowchartOrg',
        position: { x, y: 0 },
        data: {
          id: rootNode.id,
          name: rootNode.name,
          manager: rootNode.manager,
          positions: rootNode.positions || [],
          type: 'root',
          nodeType: 'organization',
          level: 0,
          hasChildren: rootNode.hasChildren,
          isExpanded: false, // Start collapsed
          stats: rootNode.stats,
          onExpandCollapse: handleNodeExpandCollapse,
          onPersonSelect: onPersonSelect
        }
      });
    });

    return { nodes: flowNodes, edges: flowEdges };
  };

  // Handle expand/collapse of individual nodes
  const handleNodeExpandCollapse = async (nodeId, shouldExpand) => {
    console.log(`🔄 ${shouldExpand ? 'Expanding' : 'Collapsing'} node: ${nodeId}`);
    
    try {
      if (shouldExpand) {
        // Load children for this node
        const response = await fetch(`/mining-hr/api/org-chart/children/${nodeId}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to load children');
        }

        // Add children to the flowchart
        const parentNode = nodes.find(n => n.data.id === nodeId);
        if (parentNode && result.data) {
          addChildrenToFlowchart(parentNode, result.data);
          setExpandedNodes(prev => new Set(prev.add(nodeId)));
        }
      } else {
        // Remove children from flowchart
        removeChildrenFromFlowchart(nodeId);
        setExpandedNodes(prev => {
          const newSet = new Set(prev);
          newSet.delete(nodeId);
          return newSet;
        });
      }

      // Update parent node's expanded state
      setNodes(prevNodes => 
        prevNodes.map(node => 
          node.data.id === nodeId 
            ? { ...node, data: { ...node.data, isExpanded: shouldExpand } }
            : node
        )
      );

    } catch (error) {
      console.error('Error expanding/collapsing node:', error);
      setError(`Failed to ${shouldExpand ? 'expand' : 'collapse'} node: ${error.message}`);
    }
  };

  // Add children nodes to flowchart
  const addChildrenToFlowchart = (parentNode, children) => {
    const newNodes = [];
    const newEdges = [];
    
    // Calculate layout for children
    const childSpacing = 250;
    const levelSpacing = 200;
    const parentX = parentNode.position.x;
    const parentY = parentNode.position.y;
    const childY = parentY + levelSpacing;
    
    // Center children under parent
    const totalWidth = (children.length - 1) * childSpacing;
    const startX = parentX - totalWidth / 2;

    children.forEach((child, index) => {
      const childId = `${parentNode.data.id}-child-${child.id}`;
      const x = startX + (index * childSpacing);
      
      // Create child node
      newNodes.push({
        id: childId,
        type: 'flowchartOrg',
        position: { x, y: childY },
        data: {
          id: child.id,
          name: child.name,
          manager: child.manager,
          positions: child.positions || [],
          type: 'child',
          nodeType: 'organization',
          level: parentNode.data.level + 1,
          hasChildren: child.hasChildren,
          isExpanded: false,
          stats: child.stats,
          onExpandCollapse: handleNodeExpandCollapse,
          onPersonSelect: onPersonSelect,
          parentId: parentNode.data.id
        }
      });

      // Create edge to parent
      newEdges.push({
        id: `edge-${parentNode.id}-${childId}`,
        source: parentNode.id,
        target: childId,
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
    });

    // Add new nodes and edges
    setNodes(prevNodes => [...prevNodes, ...newNodes]);
    setEdges(prevEdges => [...prevEdges, ...newEdges]);
  };

  // Remove children nodes from flowchart
  const removeChildrenFromFlowchart = (parentNodeId) => {
    setNodes(prevNodes => 
      prevNodes.filter(node => node.data.parentId !== parentNodeId)
    );
    setEdges(prevEdges => 
      prevEdges.filter(edge => 
        !prevNodes.some(node => 
          node.data.parentId === parentNodeId && (node.id === edge.source || node.id === edge.target)
        )
      )
    );
  };

  return (
    <Box sx={{ width: '100%', height: '700px' }}>
      {/* Header */}
      <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1, mb: 1 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <AccountTreeIcon color="primary" />
          Organizational Structure - Expandable Flowchart
        </Typography>
        
        {!orgData && (
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="body2">
              Upload an organizational chart file. Only top-level organizations will be shown initially. 
              Click expand buttons to view sub-organizations and positions.
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
              Top-level view loaded | Use expand/collapse buttons on each organization
            </Typography>
            <IconButton size="small" onClick={loadTopLevelNodesOnly} title="Reset to top-level view">
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
      <Box sx={{ height: '650px', border: '1px solid #ddd', borderRadius: 1 }}>
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
              nodeColor={(node) => {
                if (node.data?.nodeType === 'position') return '#4caf50';
                return node.data?.type === 'root' ? '#1976d2' : '#1976d2';
              }}
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