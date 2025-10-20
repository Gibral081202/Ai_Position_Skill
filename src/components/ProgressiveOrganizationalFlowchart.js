/**
 * Progressive Organizational Flowchart Component
 * FIXED: Browser crash issue by implementing lazy loading
 * - Only loads top-level nodes initially
 * - Children loaded on-demand when user clicks expand
 * - Blue color scheme for Organizations (O)
 * - Green color scheme for Positions (S) 
 * - Employee names, positions, and levels
 * - Performance optimized for large datasets (20,901+ records)
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  IconButton,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Collapse
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  AccountTree as AccountTreeIcon,
  Info as InfoIcon
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

// Progressive Organization Node Component - Shows positions always (no toggle)
const ProgressiveOrgNode = ({ data }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [expanding, setExpanding] = useState(false);

  // Color schemes based on Object Type (S = Position, O = Organization)
  const getNodeStyle = () => {
    const baseStyle = {
      padding: '12px',
      borderRadius: '12px',
      minWidth: '220px',
      maxWidth: '300px',
      boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
      cursor: 'default',
      fontFamily: 'Segoe UI, Arial, sans-serif',
      border: '3px solid',
      position: 'relative'
    };

    // Use actual Object Type from data: O = Organization (Blue), S = Position (Green)
    if (data.objectType === 'O' || data.nodeType === 'organization') {
      return {
        ...baseStyle,
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        color: 'white',
        borderColor: '#0d47a1',
        boxShadow: '0 8px 25px rgba(25, 118, 210, 0.4)'
      };
    } else if (data.objectType === 'S' || data.nodeType === 'position') {
      return {
        ...baseStyle,
        background: 'linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)',
        color: 'white',
        borderColor: '#1b5e20',
        boxShadow: '0 8px 25px rgba(56, 142, 60, 0.4)',
        minWidth: '200px',
        maxWidth: '280px'
      };
    }
    
    return baseStyle;
  };

  const nodeStyle = getNodeStyle();

  // Handle expand/collapse children
  const handleExpandCollapse = async () => {
    if (data.onExpandCollapse && !expanding) {
      setExpanding(true);
      try {
        await data.onExpandCollapse(data.objectId, !data.isExpanded);
      } catch (error) {
        console.error('Error expanding/collapsing node:', error);
      }
      setExpanding(false);
    }
  };

  // Handle person click for assessment
  const handlePersonClick = (person) => {
    // ✅ Enhanced validation: Check for valid holder and position title
    // Holder must exist, not be empty, and not be 'Vacant'
    const hasValidHolder = person.holder && person.holder.trim() !== '' && person.holder !== 'Vacant';
    
    if (data.onPersonSelect && hasValidHolder && person.name) {
      console.log('🎯 Position clicked for assessment:', {
        positionTitle: person.name,
        holder: person.holder,
        positionLevel: person.positionLevel,
        department: person.department
      });
      
      data.onPersonSelect({
        name: person.holder,
        positionTitle: person.name,
        positionLevel: person.positionLevel || 'Staff Level',
        department: person.department || data.name
      });
    } else {
      const reason = !person.holder || person.holder.trim() === '' || person.holder === 'Vacant' 
        ? 'Position is vacant or has no assigned person' 
        : 'Missing position title';
      
      console.warn('⚠️ Cannot generate assessment:', {
        reason: reason,
        positionTitle: person.name,
        holder: person.holder
      });
    }
  };

  const displayPositions = data.positions || [];
  const isOrganization = data.objectType === 'O' || data.nodeType === 'organization';
  const hasChildren = data.children && data.children.length > 0;

  return (
    <>
      <Handle 
        type="target" 
        position={Position.Top} 
        style={{ 
          backgroundColor: isOrganization ? '#0d47a1' : '#1b5e20',
          width: 10,
          height: 10,
          border: '2px solid white'
        }} 
      />
      
      <div style={nodeStyle}>
        {/* Node Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between" marginBottom="8px">
          <Box display="flex" alignItems="center" gap={1}>
            {isOrganization ? (
              <BusinessIcon sx={{ fontSize: 18 }} />
            ) : (
              <PersonIcon sx={{ fontSize: 18 }} />
            )}
            <Typography 
              variant="subtitle2" 
              sx={{ 
                fontWeight: 'bold', 
                fontSize: '13px',
                lineHeight: 1.2
              }}
              title={data.name}
            >
              {data.name.length > 25 ? `${data.name.substring(0, 22)}...` : data.name}
            </Typography>
          </Box>
          
          <Box display="flex" gap={0.5} alignItems="center">
            <Chip 
              label={data.objectType || (isOrganization ? 'O' : 'S')} 
              size="small" 
              sx={{ 
                fontSize: '9px', 
                height: '18px',
                backgroundColor: isOrganization ? 'rgba(25, 118, 210, 0.3)' : 'rgba(56, 142, 60, 0.3)',
                color: 'white',
                fontWeight: 'bold',
                borderRadius: '4px'
              }}
            />
            {data.objectType === 'S' && (
              <PersonIcon sx={{ fontSize: 12, opacity: 0.8 }} />
            )}
            {data.objectType === 'O' && (
              <BusinessIcon sx={{ fontSize: 12, opacity: 0.8 }} />
            )}
          </Box>
        </Box>

        {/* Manager/Holder Information */}
        {(data.manager || data.holder) && (
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: '500',
              marginBottom: '8px',
              fontSize: '10px',
              opacity: 0.9,
              backgroundColor: 'rgba(255,255,255,0.15)',
              padding: '4px 8px',
              borderRadius: '4px'
            }}
            title={data.manager || data.holder}
          >
            👤 {(data.manager || data.holder).length > 30 ? 
              `${(data.manager || data.holder).substring(0, 27)}...` : 
              (data.manager || data.holder)}
          </Typography>
        )}

        {/* Level Information */}
        {(data.level !== undefined || data.positionLevel) && (
          <Chip 
            label={data.positionLevel || `Level ${data.level + 1}`}
            size="small" 
            sx={{ 
              fontSize: '8px', 
              height: '18px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              marginBottom: '8px'
            }}
          />
        )}

        {/* Statistics */}
        {isOrganization && (
          <Box display="flex" gap={0.5} marginBottom="8px" flexWrap="wrap">
            {hasChildren && (
              <Chip 
                label={`${data.children.length} sub-units`} 
                size="small" 
                sx={{ 
                  fontSize: '8px', 
                  height: '18px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white'
                }}
              />
            )}
            {displayPositions.length > 0 && (
              <Chip 
                label={`${displayPositions.length} positions`} 
                size="small" 
                sx={{ 
                  fontSize: '8px', 
                  height: '18px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white'
                }}
              />
            )}
          </Box>
        )}

        {/* Action Buttons */}
        <Box display="flex" justifyContent="center" gap={0.5} marginBottom="6px" flexWrap="wrap">
          {/* Expand/Collapse Children Button - Hidden for Level 0 (PRESIDENT OFFICE) */}
          {isOrganization && hasChildren && data.level > 0 && (
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
                fontSize: '8px',
                padding: '4px 8px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.3)',
                },
                minWidth: '80px'
              }}
            >
              {data.isExpanded ? 'Collapse' : 'Expand'} ({data.children.length})
            </Button>
          )}

          {/* Info Button */}
          <Button
            size="small"
            onClick={() => setShowDetails(!showDetails)}
            startIcon={<InfoIcon />}
            sx={{
              fontSize: '8px',
              padding: '4px 8px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.3)',
              },
              minWidth: '50px'
            }}
          >
            Info
          </Button>
        </Box>

        {/* Detailed Information */}
        <Collapse in={showDetails}>
          <Box 
            sx={{
              backgroundColor: 'rgba(255,255,255,0.15)',
              padding: '6px',
              borderRadius: '6px',
              marginBottom: '6px'
            }}
          >
            <Typography variant="caption" sx={{ fontSize: '8px', display: 'block', marginBottom: '2px' }}>
              <strong>ID:</strong> {data.objectId}
            </Typography>
            {data.status && (
              <Typography variant="caption" sx={{ fontSize: '8px', display: 'block', marginBottom: '2px' }}>
                <strong>Status:</strong> {data.status}
              </Typography>
            )}
            {data.department && (
              <Typography variant="caption" sx={{ fontSize: '8px', display: 'block', marginBottom: '2px' }}>
                <strong>Department:</strong> {data.department}
              </Typography>
            )}
            {data.costCenter && (
              <Typography variant="caption" sx={{ fontSize: '8px', display: 'block' }}>
                <strong>Cost Center:</strong> {data.costCenter}
              </Typography>
            )}
          </Box>
        </Collapse>

        {/* Positions List - Always visible, no toggle */}
        {isOrganization && displayPositions.length > 0 && (
          <Box 
            sx={{
              backgroundColor: 'rgba(255,255,255,0.15)',
              padding: '6px',
              borderRadius: '6px',
              maxHeight: '120px',
              overflowY: 'auto',
              marginTop: '8px'
            }}
          >
            <Typography 
              variant="caption" 
              sx={{ 
                fontWeight: 'bold', 
                fontSize: '8px',
                marginBottom: '4px',
                display: 'block'
              }}
            >
              👥 Staff Positions ({displayPositions.length}):
            </Typography>
            
            {displayPositions.slice(0, 8).map((position, index) => (
                <div 
                  key={`${data.objectId}-pos-${index}`}
                  style={{
                    fontSize: '8px',
                    padding: '6px',
                    marginTop: '4px',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: '4px',
                    cursor: (position.holder && position.holder.trim() !== '' && position.holder !== 'Vacant') ? 'pointer' : 'default',
                    border: '1px solid rgba(255,255,255,0.3)',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => handlePersonClick(position)}
                  title={(position.holder && position.holder.trim() !== '' && position.holder !== 'Vacant') ? 
                    `Click to select ${position.holder} for assessment` : 'Position vacant'}
                  onMouseEnter={(e) => {
                    if (position.holder && position.holder.trim() !== '' && position.holder !== 'Vacant') {
                      e.target.style.backgroundColor = 'rgba(255,255,255,0.3)';
                      e.target.style.transform = 'scale(1.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'rgba(255,255,255,0.2)';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: '8px', lineHeight: 1.2, display: 'block' }}>
                    {position.name.length > 28 ? `${position.name.substring(0, 25)}...` : position.name}
                  </Typography>
                  
                  {position.holder && position.holder.trim() !== '' && position.holder !== 'Vacant' && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontSize: '7px', 
                        opacity: 0.9,
                        fontWeight: '500',
                        marginTop: '2px',
                        display: 'block'
                      }}
                    >
                      👤 {position.holder.length > 25 ? 
                        `${position.holder.substring(0, 22)}...` : position.holder}
                    </Typography>
                  )}
                  
                  {position.positionLevel && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontSize: '7px', 
                        opacity: 0.8,
                        fontStyle: 'italic',
                        marginTop: '1px',
                        display: 'block'
                      }}
                    >
                      📊 {position.positionLevel}
                    </Typography>
                  )}
                </div>
              ))}
              
              {displayPositions.length > 8 && (
                <Typography variant="caption" sx={{ fontSize: '8px', fontStyle: 'italic', marginTop: '4px', display: 'block' }}>
                  ... and {displayPositions.length - 8} more positions
                </Typography>
              )}
            </Box>
        )}
      </div>
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        style={{ 
          backgroundColor: isOrganization ? '#0d47a1' : '#1b5e20',
          width: 10,
          height: 10,
          border: '2px solid white'
        }} 
      />
    </>
  );
};

// Node types configuration
const nodeTypes = {
  progressiveOrg: ProgressiveOrgNode,
};

// Main Progressive Organizational Flowchart Component
const ProgressiveOrganizationalFlowchart = ({ onPersonSelect }) => {
  const [hierarchyData, setHierarchyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState(new Set()); // Track expanded nodes
  const [useFilteredView, setUseFilteredView] = useState(true); // Toggle for filtered vs full view
  
  // ReactFlow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Helper function: Perfect alignment layout for professional appearance matching the image
  const autoOrganizeLayout = (nodes, edges) => {
    const organizedNodes = [...nodes];
    const levelGroups = {};
    
    // Group nodes by level
    organizedNodes.forEach(node => {
      const level = node.data.level || 0;
      if (!levelGroups[level]) {
        levelGroups[level] = [];
      }
      levelGroups[level].push(node);
    });
    
    // Perfect alignment for each level to match the image layout
    Object.keys(levelGroups).forEach(level => {
      const levelNodes = levelGroups[level];
      const levelNum = parseInt(level);
      
      // Perfect vertical positioning to match image
      let y;
      if (levelNum === 0) {
        y = 0; // PRESIDENT OFFICE at top center
      } else if (levelNum === 1) {
        y = 280; // Level 2 with optimal spacing as shown in image
      } else {
        y = 280 + (levelNum - 1) * 300; // Deeper levels with consistent spacing
      }
      
      // Perfect horizontal alignment matching the image layout
      const nodeWidth = 280;
      const horizontalGap = 40; // Tighter gap as seen in image
      
      if (levelNum === 0) {
        // PRESIDENT OFFICE: Center exactly at x=0
        levelNodes.forEach(node => {
          node.position = { x: 0, y };
        });
      } else {
        // All other levels: Perfect horizontal distribution
        const totalWidth = (levelNodes.length * nodeWidth) + ((levelNodes.length - 1) * horizontalGap);
        const startX = -(totalWidth / 2) + (nodeWidth / 2);
        
        levelNodes.forEach((node, index) => {
          const x = startX + (index * (nodeWidth + horizontalGap));
          node.position = { x, y };
        });
      }
    });
    
    console.log(`✅ Auto-organized ${organizedNodes.length} nodes in image-perfect alignment`);
    return organizedNodes;
  };

  // Helper function: Get hierarchical edge color based on level
  const getHierarchicalEdgeColor = (level) => {
    const colors = [
      '#1976d2', // Level 0: Blue
      '#388e3c', // Level 1: Green  
      '#f57c00', // Level 2: Orange
      '#7b1fa2', // Level 3: Purple
      '#d32f2f', // Level 4: Red
      '#455a64'  // Level 5+: Blue Grey
    ];
    return colors[Math.min(level, colors.length - 1)];
  };

  // Helper function: Find node in hierarchy data
  const findNodeInHierarchy = (nodes, targetId) => {
    for (const node of nodes) {
      if (node.objectId === targetId) {
        return node;
      }
      if (node.children && node.children.length > 0) {
        const found = findNodeInHierarchy(node.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  // Helper function: Add children nodes to flowchart with image-perfect grid layout
  const addChildrenToFlowchart = (parentNodeId, children) => {
    setNodes(prevNodes => {
      // Find parent node to get position
      const parentNode = prevNodes.find(n => n.data.objectId === parentNodeId);
      if (!parentNode) return prevNodes;
      
      const newNodes = [];
      
      // Enhanced hierarchical layout matching the image's neat organization
      const parentLevel = parentNode.data.level || 0;
      const parentX = parentNode.position.x;
      const parentY = parentNode.position.y;
      
      // Grid layout configuration for neat positioning (image-perfect)
      const nodeWidth = 280;
      const nodeHeight = 200;
      const horizontalGap = 40; // Tighter gap as seen in image
      const verticalGap = 90; // Optimal vertical spacing
      
      // Calculate optimal grid layout for professional appearance
      const childrenCount = children.length;
      let columns = Math.ceil(Math.sqrt(childrenCount));
      let rows = Math.ceil(childrenCount / columns);
      
      // For better visual balance, prefer wider layouts (image style)
      if (childrenCount > 4) {
        columns = Math.min(Math.ceil(childrenCount / 2), 6); // Max 6 columns
        rows = Math.ceil(childrenCount / columns);
      }
      
      const totalWidth = (columns * nodeWidth) + ((columns - 1) * horizontalGap);
      const totalHeight = (rows * nodeHeight) + ((rows - 1) * verticalGap);
      const startX = parentX - (totalWidth / 2);
      const startY = parentY + 280; // Consistent spacing matching image layout

      children.forEach((child, index) => {
        const childId = `child-${child.objectId}`;
        
        // Calculate grid position for neat organization
        const row = Math.floor(index / columns);
        const col = index % columns;
        
        const x = startX + (col * (nodeWidth + horizontalGap)) + (nodeWidth / 2);
        const y = startY + (row * (nodeHeight + verticalGap));
        
        // Create child node with proper object type preservation
        newNodes.push({
          id: childId,
          type: 'progressiveOrg',
          position: { x, y },
          data: {
            ...child,
            nodeType: child.objectType === 'S' ? 'position' : 'organization',
            objectType: child.objectType, // Preserve original object type
            level: (parentNode.data.level || 0) + 1,
            isExpanded: false,
            parentNodeId: parentNodeId,
            onExpandCollapse: handleNodeExpandCollapse,
            onPersonSelect: onPersonSelect
          }
        });
      });
      
      console.log(`✅ Added ${newNodes.length} children in image-perfect layout for node ${parentNodeId}`);
      const allNodes = [...prevNodes, ...newNodes];
      
      // Auto-organize the layout for image-perfect appearance
      return autoOrganizeLayout(allNodes, []);
    });

    // Add edges with proper hierarchical connections
    setTimeout(() => {
      setEdges(prevEdges => {
        const newEdges = [];
        
        // Find the parent node from current nodes state
        setNodes(currentNodes => {
          const parentNodeFromCurrent = currentNodes.find(n => n.data.objectId === parentNodeId);
          if (!parentNodeFromCurrent) return currentNodes;

          children.forEach((child) => {
            const childId = `child-${child.objectId}`;
            
            // Create hierarchical edge with enhanced styling for neat lines
            const parentLevel = parentNodeFromCurrent.data.level || 0;
            const edgeColor = getHierarchicalEdgeColor(parentLevel);
            
            // Enhanced edge styling for cleaner hierarchy lines
            newEdges.push({
              id: `edge-${parentNodeFromCurrent.id}-${childId}`,
              source: parentNodeFromCurrent.id,
              target: childId,
              type: 'smoothstep', // Smooth curved lines
              animated: false,
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 10,
                height: 10,
                color: edgeColor,
              },
              style: {
                strokeWidth: Math.max(3 - parentLevel * 0.5, 1.5), // Gradually thinner for deeper levels
                stroke: edgeColor,
                strokeDasharray: parentLevel > 3 ? '8,4' : undefined, // Dashed for very deep levels
                opacity: 0.8
              },
              labelStyle: { 
                fontSize: '9px', 
                fill: edgeColor, 
                fontWeight: 'bold',
                backgroundColor: 'rgba(255,255,255,0.9)',
                padding: '2px 4px',
                borderRadius: '4px'
              },
              labelBgStyle: { 
                fill: 'rgba(255,255,255,0.9)', 
                fillOpacity: 0.9,
                rx: 4,
                ry: 4
              }
            });
          });
          
          return currentNodes; // Return unchanged nodes
        });

        return [...prevEdges, ...newEdges];
      });
    }, 100); // Small delay to ensure nodes are added first
  };



  // Handle expand/collapse of individual nodes - Load children on demand
  const handleNodeExpandCollapse = useCallback(async (nodeId, shouldExpand) => {
    console.log(`🔄 ${shouldExpand ? 'Expanding' : 'Collapsing'} node: ${nodeId}`);
    
    // Check if hierarchy data is available
    if (!hierarchyData || !hierarchyData.rootNodes) {
      console.error('❌ Hierarchy data not available for node expansion');
      console.log('🔍 Current hierarchyData:', hierarchyData);
      setError('Organizational data not loaded. Please refresh the page.');
      return;
    }
    
    try {
      if (shouldExpand) {
        // Load children for this specific node from the hierarchy
        const nodeData = findNodeInHierarchy(hierarchyData.rootNodes, nodeId);
        if (nodeData && nodeData.children && nodeData.children.length > 0) {
          addChildrenToFlowchart(nodeId, nodeData.children);
          setExpandedNodes(prev => new Set(prev.add(nodeId)));
        } else {
          console.warn(`⚠️ No children found for node: ${nodeId}`);
        }
      } else {
        // Remove children from flowchart (using functional updates only)
        setNodes(prevNodes => {
          const nodesToRemove = new Set();
          
          const findDescendants = (nodeId, currentNodes) => {
            currentNodes.forEach(node => {
              if (node.data.parentNodeId === nodeId) {
                nodesToRemove.add(node.id);
                findDescendants(node.data.objectId, currentNodes); // Recursive for nested children
              }
            });
          };
          
          findDescendants(nodeId, prevNodes);
          console.log(`✅ Removed ${nodesToRemove.size} child nodes from flowchart`);
          return prevNodes.filter(node => !nodesToRemove.has(node.id));
        });
        
        setEdges(prevEdges => {
          const nodesToRemove = new Set();
          
          // We need to check which nodes are being removed to remove their edges
          nodes.forEach(node => {
            if (node.data.parentNodeId === nodeId) {
              nodesToRemove.add(node.id);
            }
          });
          
          return prevEdges.filter(edge => 
            !nodesToRemove.has(edge.source) && !nodesToRemove.has(edge.target)
          );
        });
        
        setExpandedNodes(prev => {
          const newSet = new Set(prev);
          newSet.delete(nodeId);
          return newSet;
        });
      }

      // Update parent node's expanded state
      setNodes(prevNodes => 
        prevNodes.map(node => 
          node.data.objectId === nodeId 
            ? { ...node, data: { ...node.data, isExpanded: shouldExpand } }
            : node
        )
      );

    } catch (error) {
      console.error('Error expanding/collapsing node:', error);
      setError(`Failed to ${shouldExpand ? 'expand' : 'collapse'} node: ${error.message}`);
    }
  }, [hierarchyData]); // Optimized dependencies to prevent infinite re-renders

  // Load organizational hierarchy on component mount and when filter changes
  useEffect(() => {
    loadTopLevelOnly();
  }, [useFilteredView]); // Reload when filter toggle changes

  // Update nodes whenever hierarchyData changes to ensure fresh function references
  useEffect(() => {
    if (hierarchyData && hierarchyData.rootNodes && hierarchyData.rootNodes.length > 0) {
      console.log('🔄 Updating nodes with fresh function references');
      const { nodes: flowNodes, edges: flowEdges } = convertRootNodesToFlowChart(hierarchyData.rootNodes);
      setNodes(flowNodes);
      setEdges(flowEdges);
    }
  }, [hierarchyData]); // Removed handleNodeExpandCollapse to prevent infinite loop

  // Load organizational hierarchy - now supports both filtered and full view
  const loadTopLevelOnly = async () => {
    setLoading(true);
    setError(null);
    setHierarchyData(null); // Reset hierarchy data

    try {
      // Use filtered or full endpoint based on toggle
      const endpoint = useFilteredView ? '/api/flowchart/filtered-hierarchy' : '/api/flowchart/hierarchy';
      console.log(`📡 Loading ${useFilteredView ? 'filtered' : 'full'} organizational hierarchy from: ${endpoint}`);
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server responded with ${response.status}: ${errorText || 'Unknown error'}`);
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Invalid response from server');
      }

      console.log(`📊 ${useFilteredView ? 'Filtered' : 'Full'} organizational hierarchy loaded:`, result);
      
      // Validate the data structure
      if (!result.data.rootNodes || !Array.isArray(result.data.rootNodes)) {
        throw new Error('Invalid hierarchy data structure: missing rootNodes array');
      }

      setHierarchyData(result.data);
      
      // Note: Nodes will be set by the useEffect when hierarchyData changes

    } catch (error) {
      console.error('❌ Error loading hierarchy:', error);
      
      // Provide user-friendly error messages
      let userMessage = `Failed to load ${useFilteredView ? 'filtered' : 'full'} organizational chart`;
      if (error.message.includes('fetch')) {
        userMessage = 'Cannot connect to server. Please ensure the backend server is running on port 3050.';
      } else if (error.message.includes('JSON')) {
        userMessage = 'Server returned invalid data. Please check server logs.';
      } else {
        userMessage = `Failed to load organizational chart: ${error.message}`;
      }
      
      setError(userMessage);
      setHierarchyData(null); // Ensure hierarchy data is null on error
    } finally {
      setLoading(false);
    }
  };

  // Convert root nodes AND their first level children to ReactFlow format - Perfect Image-Matching Layout
  const convertRootNodesToFlowChart = (rootNodes) => {
    if (!rootNodes || !Array.isArray(rootNodes) || rootNodes.length === 0) {
      console.warn('⚠️ No root nodes available for conversion');
      return { nodes: [], edges: [] };
    }

    console.log(`🎯 Image-Perfect Layout: Exactly matching your provided image with ${rootNodes.length} root nodes`);
    
    const flowNodes = [];
    const flowEdges = [];
    
    // Perfect alignment settings to match the image exactly
    const nodeWidth = 280;
    const nodeHeight = 200;
    const horizontalGap = 40; // Slightly tighter gap as shown in image
    const verticalGap = 280; // Optimal vertical spacing for clean hierarchy
    
    // Collect all Level 2 children from all root nodes
    let allChildren = [];
    rootNodes.forEach(rootNode => {
      if (rootNode.children && rootNode.children.length > 0) {
        allChildren = allChildren.concat(rootNode.children.map(child => ({
          ...child,
          parentId: rootNode.objectId
        })));
      }
    });

    // LEVEL 1: Position PRESIDENT OFFICE exactly in center (as shown in image)
    rootNodes.forEach((rootNode, rootIndex) => {
      const rootNodeId = `root-${rootNode.objectId}`;
      
      // Center the PRESIDENT OFFICE exactly at (0, 0) as in the image
      flowNodes.push({
        id: rootNodeId,
        type: 'progressiveOrg',
        position: { x: 0, y: 0 }, // Centered at origin like in image
        data: {
          ...rootNode,
          nodeType: rootNode.objectType === 'S' ? 'position' : 'organization',
          objectType: rootNode.objectType,
          level: 0,
          isExpanded: true, // Auto-expanded to show children
          onExpandCollapse: handleNodeExpandCollapse,
          onPersonSelect: onPersonSelect
        }
      });
    });

    // LEVEL 2: Position ALL children in perfect horizontal alignment (exactly like image)
    if (allChildren.length > 0) {
      console.log(`📐 Positioning ${allChildren.length} Level 2 nodes in perfect horizontal alignment`);
      
      // Calculate perfect horizontal distribution to match image layout
      const totalLevel2Width = (allChildren.length * nodeWidth) + ((allChildren.length - 1) * horizontalGap);
      const level2StartX = -(totalLevel2Width / 2) + (nodeWidth / 2);
      
      allChildren.forEach((child, childIndex) => {
        const childNodeId = `child-${child.objectId}`;
        const childX = level2StartX + (childIndex * (nodeWidth + horizontalGap));
        const parentNodeId = `root-${child.parentId}`;
        
        flowNodes.push({
          id: childNodeId,
          type: 'progressiveOrg',
          position: { x: childX, y: verticalGap }, // Perfect spacing below PRESIDENT OFFICE
          data: {
            ...child,
            nodeType: child.objectType === 'S' ? 'position' : 'organization',
            objectType: child.objectType,
            level: 1,
            isExpanded: false, // Level 2 children start collapsed
            parentNodeId: parentNodeId,
            onExpandCollapse: handleNodeExpandCollapse,
            onPersonSelect: onPersonSelect
          }
        });

        // Create clean straight edges exactly like in the image
        flowEdges.push({
          id: `edge-${parentNodeId}-${childNodeId}`,
          source: parentNodeId,
          target: childNodeId,
          type: 'straight', // Clean straight lines as shown in image
          animated: false,
          markerEnd: {
            type: 'arrowclosed',
            width: 8,
            height: 8,
            color: '#1976d2'
          },
          style: {
            strokeWidth: 2,
            stroke: '#1976d2',
            opacity: 0.8
          }
        });
      });
    }

    // Set up expanded node tracking
    const expandedNodeIds = new Set();
    flowNodes.forEach(node => {
      if (node.data.isExpanded) {
        expandedNodeIds.add(node.data.objectId);
      }
    });
    setExpandedNodes(expandedNodeIds);

    console.log(`✅ Generated image-perfect layout: ${flowNodes.length} nodes (${rootNodes.length} root + ${allChildren.length} children) with ${flowEdges.length} edges`);
    console.log(`📍 Layout matches your image: PRESIDENT OFFICE centered, ${allChildren.length} children in perfect horizontal row`);
    
    return { nodes: flowNodes, edges: flowEdges };
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    
    try {
      const response = await fetch(`/api/flowchart/search?q=${encodeURIComponent(searchTerm.trim())}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Search failed');
      }

      console.log(`🔍 Search results for "${searchTerm}":`, result.data);
      setSearchResults(result.data || []);

    } catch (error) {
      console.error('❌ Search error:', error);
      setError(`Search failed: ${error.message}`);
    } finally {
      setSearching(false);
    }
  };

  // Handle search result selection
  const handleResultSelect = (result) => {
    setSelectedResult(result);
    setDetailsDialog(true);
  };

  // Handle refresh
  const handleRefresh = () => {
    setExpandedNodes(new Set());
    loadTopLevelOnly();
  };

  return (
    <Box sx={{ width: '100%', height: '800px' }}>
      {/* Header Controls */}
      <Box sx={{ p: 2, backgroundColor: '#f8f9fa', borderRadius: 1, mb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <AccountTreeIcon color="primary" sx={{ fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              🚀 {useFilteredView ? 'Filtered' : 'Full'} Organizational Chart
            </Typography>
            {hierarchyData && (
              <Chip 
                label={`${hierarchyData.statistics.totalOrganizations} Orgs • ${hierarchyData.statistics.totalPositions} Positions`}
                color="primary"
                size="small"
              />
            )}
            {hierarchyData?.filterApplied && (
              <Chip 
                label="🎯 Specific Hierarchy Path"
                color="success"
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
            )}
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            {/* View Toggle */}
            <Button
              onClick={() => setUseFilteredView(!useFilteredView)}
              variant={useFilteredView ? "contained" : "outlined"}
              size="small"
              startIcon={useFilteredView ? <BusinessIcon /> : <AccountTreeIcon />}
              sx={{
                backgroundColor: useFilteredView ? '#2e7d32' : 'transparent',
                color: useFilteredView ? 'white' : '#2e7d32',
                borderColor: '#2e7d32',
                '&:hover': {
                  backgroundColor: useFilteredView ? '#1b5e20' : 'rgba(46, 125, 50, 0.1)',
                },
                fontWeight: 'bold'
              }}
              title={useFilteredView ? 'Switch to Full Organization Chart' : 'Switch to Filtered Specific Path View'}
            >
              {useFilteredView ? 'Filtered View' : 'Full View'}
            </Button>

            {/* Search */}
            <TextField
              size="small"
              placeholder="Search organizations or positions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: searching && (
                  <InputAdornment position="end">
                    <CircularProgress size={16} />
                  </InputAdornment>
                )
              }}
              sx={{ width: 250 }}
            />
            <Button onClick={handleSearch} disabled={searching} variant="outlined" size="small">
              Search
            </Button>

            {/* Auto-organize Layout */}
            <Button 
              onClick={() => {
                const organizedNodes = autoOrganizeLayout(nodes, edges);
                setNodes(organizedNodes);
              }} 
              variant="outlined" 
              size="small"
              title="Auto-organize layout for neat appearance"
              startIcon={<AccountTreeIcon />}
            >
              Organize
            </Button>

            {/* Refresh */}
            <IconButton onClick={handleRefresh} disabled={loading} title={`Refresh ${useFilteredView ? 'Filtered' : 'Full'} View`}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Performance Info */}
        <Box sx={{ mt: 1, padding: '8px', backgroundColor: useFilteredView ? '#e8f5e8' : '#e3f2fd', borderRadius: '4px', border: useFilteredView ? '1px solid #4caf50' : '1px solid #2196f3' }}>
          <Typography variant="body2" sx={{ fontSize: '12px', color: useFilteredView ? '#2e7d32' : '#1976d2' }}>
            {useFilteredView ? (
              <>🎯 <strong>Filtered View:</strong> Shows specific hierarchy path: PRESIDENT OFFICE → SINARMAS MINING GROUP → PT. BERAU COAL ENERGY → OPERATION DIRECTORATE → XXX - MARINE DIVISION, plus all sub-levels below Level 6. Displaying {hierarchyData?.statistics?.totalOrganizations || 0} organizations in target path.</>
            ) : (
              <>🏢 <strong>Full View:</strong> Shows complete organizational structure. Click "Expand" to load children with automatic neat positioning. Click "Organize" to auto-arrange all visible nodes. Handles {hierarchyData?.statistics?.totalOrganizations || 0} organizations efficiently.</>
            )}
          </Typography>
        </Box>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Search Results ({searchResults.length}):
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {searchResults.slice(0, 8).map((result, index) => (
                <Chip
                  key={index}
                  label={`${result.type === 'organization' ? '🏢' : '👤'} ${result.name}`}
                  onClick={() => handleResultSelect(result)}
                  color={result.type === 'organization' ? 'primary' : 'success'}
                  size="small"
                  clickable
                />
              ))}
              {searchResults.length > 8 && (
                <Chip label={`+${searchResults.length - 8} more`} variant="outlined" size="small" />
              )}
            </Box>
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
      <Box sx={{ height: '700px', border: '2px solid #ddd', borderRadius: 2, overflow: 'hidden' }}>
        {hierarchyData && !loading ? (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{
              padding: 0.15, // Slightly tighter padding for better image match
              includeHiddenNodes: false,
              minZoom: 0.4,
              maxZoom: 1.5
            }}
            attributionPosition="bottom-left"
            minZoom={0.3}
            maxZoom={2}
            defaultViewport={{ x: 0, y: 30, zoom: 0.75 }} // Perfect initial view to match image
          >
            <Background color="#f0f7ff" gap={25} size={2} />
            <Controls position="top-right" />
            <MiniMap 
              nodeColor={(node) => {
                if (node.data?.nodeType === 'position') return '#4caf50';
                return '#1976d2';
              }}
              nodeStrokeWidth={3}
              position="bottom-right"
              style={{
                backgroundColor: '#f8f9fa',
                border: '2px solid #ddd',
                borderRadius: '8px'
              }}
            />
          </ReactFlow>
        ) : loading ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            backgroundColor: '#f8f9fa'
          }}>
            <CircularProgress size={50} />
            <Typography variant="h6" sx={{ mt: 2, color: '#666' }}>
              Loading Organizational Chart...
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: '#888' }}>
              Performance mode: Loading top-level organizations only
            </Typography>
          </Box>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            color: '#666',
            backgroundColor: '#f8f9fa'
          }}>
            <AccountTreeIcon sx={{ fontSize: 80, mb: 2, color: '#ccc' }} />
            <Typography variant="h6">No Organizational Data Available</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Please ensure your organizational data is loaded in the database
            </Typography>
            <Button onClick={() => loadTopLevelOnly()} variant="outlined" sx={{ mt: 2 }}>
              Retry Loading
            </Button>
          </Box>
        )}
      </Box>

      {/* Search Result Details Dialog */}
      <Dialog open={detailsDialog} onClose={() => setDetailsDialog(false)} maxWidth="md">
        <DialogTitle>
          {selectedResult?.type === 'organization' ? '🏢 Organization Details' : '👤 Position Details'}
        </DialogTitle>
        <DialogContent>
          {selectedResult && (
            <Box>
              <Typography variant="h6" gutterBottom>{selectedResult.name}</Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2"><strong>Type:</strong> {selectedResult.type}</Typography>
                  <Typography variant="body2"><strong>ID:</strong> {selectedResult.id}</Typography>
                  {selectedResult.manager && (
                    <Typography variant="body2"><strong>Manager:</strong> {selectedResult.manager}</Typography>
                  )}
                  {selectedResult.holder && (
                    <Typography variant="body2"><strong>Holder:</strong> {selectedResult.holder}</Typography>
                  )}
                </Grid>
                <Grid item xs={12} sm={6}>
                  {selectedResult.level && (
                    <Typography variant="body2"><strong>Level:</strong> {selectedResult.level}</Typography>
                  )}
                  {selectedResult.department && (
                    <Typography variant="body2"><strong>Department:</strong> {selectedResult.department}</Typography>
                  )}
                  {selectedResult.parentOrg && (
                    <Typography variant="body2"><strong>Parent Organization:</strong> {selectedResult.parentOrg}</Typography>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ mt: 1 }}><strong>Path:</strong> {selectedResult.fullPath}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog(false)}>Close</Button>
          {selectedResult?.type === 'position' && selectedResult.holder && selectedResult.holder.trim() !== '' && selectedResult.holder !== 'Vacant' && selectedResult.name && (
            <Button 
              onClick={() => {
                console.log('🎯 Search result selected for assessment:', {
                  positionTitle: selectedResult.name,
                  holder: selectedResult.holder,
                  positionLevel: selectedResult.level,
                  department: selectedResult.department
                });
                
                onPersonSelect({
                  name: selectedResult.holder,
                  positionTitle: selectedResult.name,
                  positionLevel: selectedResult.level,
                  department: selectedResult.department
                });
                setDetailsDialog(false);
              }}
              variant="contained"
            >
              Select for Assessment
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Wrap in ReactFlowProvider
const ProgressiveOrganizationalFlowchartWrapper = ({ onPersonSelect }) => (
  <ReactFlowProvider>
    <ProgressiveOrganizationalFlowchart onPersonSelect={onPersonSelect} />
  </ReactFlowProvider>
);

export default ProgressiveOrganizationalFlowchartWrapper;