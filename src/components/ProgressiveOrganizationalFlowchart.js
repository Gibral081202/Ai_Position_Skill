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

import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  MiniMap,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import './organizational-chart-styles.css';

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

// Enhanced edge types for professional organizational chart visualization
const edgeTypes = {
  // Add any custom edge types here if needed in the future
};

// Main Progressive Organizational Flowchart Component
const ProgressiveOrganizationalFlowchart = ({ onPersonSelect, onExpandScroll }) => {
  const [hierarchyData, setHierarchyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState(new Set()); // Track expanded nodes
  const [viewportState, setViewportState] = useState({ x: 0, y: 0, zoom: 1 }); // Preserve viewport
  
  // 🎯 ReactFlow instance for focused viewport control
  const { fitView, setViewport, getViewport, getNodes } = useReactFlow();
  
  // Accordion behavior state - track which node is actively expanded per level
  const [accordionState, setAccordionState] = useState(new Map()); // Map of level -> activeNodeId
  const [hiddenSiblings, setHiddenSiblings] = useState(new Set()); // Track nodes hidden by accordion behavior
  
  // Always use full view - no more filtering
  const useFilteredView = false;
  
  // Use ref to ensure hierarchy data is always accessible
  const hierarchyDataRef = useRef(null);

  // 🎯 Helper function: Focus viewport on specific parent node and its children with validation
  const focusOnExpandedArea = useCallback((parentNodeId, childrenIds = []) => {
    try {
      const allNodes = getNodes();
      const parentNode = allNodes.find(node => node.data.objectId === parentNodeId);
      
      if (!parentNode) {
        console.warn(`⚠️ Parent node ${parentNodeId} not found for focused zoom`);
        return;
      }

      // First, validate that all child nodes exist and have valid positions
      // Note: Some children might be hidden by accordion behavior, so only check existing ones
      const existingChildren = childrenIds.filter(childId => {
        const childNode = allNodes.find(node => node.id === `child-${childId}`);
        return childNode; // Node exists in the flow
      });
      
      const invalidChildren = existingChildren.filter(childId => {
        const childNode = allNodes.find(node => node.id === `child-${childId}`);
        return !childNode.position || 
               isNaN(childNode.position.x) || isNaN(childNode.position.y);
      });

      if (invalidChildren.length > 0) {
        console.warn(`⚠️ Cannot focus - ${invalidChildren.length} child nodes lack valid positions:`, invalidChildren);
        return;
      }
      
      console.log(`✅ Found ${existingChildren.length}/${childrenIds.length} children in ReactFlow (${childrenIds.length - existingChildren.length} may be hidden by accordion)`);

      // If no children exist in the flow, just focus on the parent
      if (existingChildren.length === 0) {
        console.log(`🎯 No children in flow - focusing on parent node only`);
        // Update childrenIds to empty array to focus just on parent
        childrenIds = [];
      } else {
        // Update to only include existing children
        childrenIds = existingChildren;
      }

      // Validate parent node position
      if (!parentNode.position || 
          typeof parentNode.position.x !== 'number' || 
          typeof parentNode.position.y !== 'number' ||
          isNaN(parentNode.position.x) || 
          isNaN(parentNode.position.y)) {
        console.warn(`⚠️ Parent node ${parentNodeId} has invalid position:`, parentNode.position);
        return;
      }

      // Get actual ReactFlow container dimensions with validation
      const flowContainer = document.querySelector('.react-flow__viewport')?.parentElement;
      const containerWidth = flowContainer?.clientWidth || 1200;
      const containerHeight = flowContainer?.clientHeight || 700;

      // Validate container dimensions
      if (isNaN(containerWidth) || isNaN(containerHeight) || containerWidth <= 0 || containerHeight <= 0) {
        console.warn(`⚠️ Invalid container dimensions: ${containerWidth}x${containerHeight}`);
        return;
      }

      console.log(`📏 Container dimensions: ${containerWidth}x${containerHeight}`);

      // Get parent node position and dimensions (use actual measured dimensions if available)
      const parentBounds = {
        x: parentNode.position.x,
        y: parentNode.position.y,
        width: parentNode.measured?.width || 320, // Use measured width or fallback
        height: parentNode.measured?.height || 180 // Use measured height or fallback
      };

      console.log(`👨‍💼 Parent node bounds:`, parentBounds);

      // Calculate bounding box including all children
      let minX = parentBounds.x;
      let maxX = parentBounds.x + parentBounds.width;
      let minY = parentBounds.y;
      let maxY = parentBounds.y + parentBounds.height;

      // Include children in bounding box with validation
      const childNodes = [];
      childrenIds.forEach(childId => {
        const childNode = allNodes.find(node => node.id === `child-${childId}`);
        if (childNode && 
            childNode.position && 
            typeof childNode.position.x === 'number' && 
            typeof childNode.position.y === 'number' &&
            !isNaN(childNode.position.x) && 
            !isNaN(childNode.position.y)) {
          
          const childWidth = childNode.measured?.width || 320;
          const childHeight = childNode.measured?.height || 180;
          
          // Validate child dimensions
          if (!isNaN(childWidth) && !isNaN(childHeight) && childWidth > 0 && childHeight > 0) {
            minX = Math.min(minX, childNode.position.x);
            maxX = Math.max(maxX, childNode.position.x + childWidth);
            minY = Math.min(minY, childNode.position.y);
            maxY = Math.max(maxY, childNode.position.y + childHeight);
            
            childNodes.push(childNode);
          } else {
            console.warn(`⚠️ Invalid child dimensions for ${childId}:`, { childWidth, childHeight });
          }
        } else {
          console.warn(`⚠️ Invalid child position for ${childId}:`, childNode?.position);
        }
      });

      console.log(`👶 Found ${childNodes.length} child nodes with valid positions`);

      // Validate boundary values before creating focus area
      if (!isFinite(minX) || !isFinite(maxX) || !isFinite(minY) || !isFinite(maxY)) {
        console.warn('⚠️ Invalid boundary values for focus area:', { minX, maxX, minY, maxY });
        return;
      }

      // 🎯 ENHANCED: Aggressive zoom strategy to match target image behavior
      // Add moderate padding around the focused area for tight focus
      const padding = 50; // Reduced padding for tighter focus
      const focusArea = {
        x: minX - padding,
        y: minY - padding,
        width: (maxX - minX) + (2 * padding),
        height: (maxY - minY) + (2 * padding)
      };

      // Validate focus area dimensions
      if (isNaN(focusArea.x) || isNaN(focusArea.y) || 
          isNaN(focusArea.width) || isNaN(focusArea.height) ||
          focusArea.width <= 0 || focusArea.height <= 0) {
        console.warn(`⚠️ Invalid focus area:`, focusArea);
        return;
      }

      console.log(`🎯 Focus area:`, focusArea);

      // 🎯 ENHANCED: Aggressive zoom calculation for prominent display
      // Calculate base zoom to fit the focus area
      const baseZoomX = containerWidth / focusArea.width;
      const baseZoomY = containerHeight / focusArea.height;
      
      // Validate zoom calculations
      if (isNaN(baseZoomX) || isNaN(baseZoomY) || baseZoomX <= 0 || baseZoomY <= 0) {
        console.warn(`⚠️ Invalid zoom calculations:`, { baseZoomX, baseZoomY });
        return;
      }
      
      // Use the smaller base zoom to ensure everything fits
      let baseZoom = Math.min(baseZoomX, baseZoomY);
      
      // 🚀 ENHANCED: More aggressive zoom strategy for prominent node display
      let optimalZoom;
      
      if (childrenIds.length === 0) {
        // 📍 Single node focus: Use higher zoom for prominence
        optimalZoom = Math.min(baseZoom * 1.2, 1.8); // Allow up to 1.8x for single nodes
      } else if (childrenIds.length <= 3) {
        // 👥 Small group: Use moderate aggressive zoom
        optimalZoom = Math.min(baseZoom * 1.1, 1.4); // Allow up to 1.4x for small groups
      } else {
        // 🏢 Large group: Use standard zoom but ensure minimum visibility
        optimalZoom = Math.min(baseZoom, 1.2); // Allow up to 1.2x for large groups
      }
      
      // 🎯 Ensure minimum zoom for readability but allow higher zoom for prominence
      optimalZoom = Math.max(0.5, optimalZoom); // Minimum 0.5x, no upper limit constraint
      
      console.log(`🔍 Enhanced zoom: ${optimalZoom} (base: ${baseZoom}, children: ${childrenIds.length})`);

      // Calculate the center point of the focus area with validation
      const focusCenterX = focusArea.x + (focusArea.width / 2);
      const focusCenterY = focusArea.y + (focusArea.height / 2);

      // Validate calculated values
      if (isNaN(focusCenterX) || isNaN(focusCenterY) || isNaN(optimalZoom)) {
        console.warn(`⚠️ Invalid calculated values:`, { 
          focusCenterX, focusCenterY, optimalZoom, focusArea 
        });
        return;
      }

      // Calculate viewport position to center the focus area
      const newViewport = {
        x: (containerWidth / 2) - (focusCenterX * optimalZoom),
        y: (containerHeight / 2) - (focusCenterY * optimalZoom),
        zoom: optimalZoom
      };

      // Validate final viewport values
      if (isNaN(newViewport.x) || isNaN(newViewport.y) || isNaN(newViewport.zoom)) {
        console.warn(`⚠️ Invalid viewport values:`, newViewport);
        return;
      }

      console.log(`🎯 ENHANCED VIEWPORT:`, {
        parentNode: parentNodeId,
        childrenCount: childrenIds.length,
        containerDimensions: { width: containerWidth, height: containerHeight },
        focusArea,
        focusCenter: { x: focusCenterX, y: focusCenterY },
        newViewport,
        zoomLevel: `${(optimalZoom * 100).toFixed(1)}%`
      });

      // 🚀 Apply the focused viewport with smooth, prominent animation
      try {
        setViewport(newViewport, { duration: 1000 }); // Longer animation for dramatic effect
        console.log(`✅ Successfully applied enhanced zoom focus - Level: ${(optimalZoom * 100).toFixed(1)}%`);
      } catch (viewportError) {
        console.error('❌ Error setting viewport:', viewportError);
        // Fallback: try without animation
        try {
          setViewport(newViewport, { duration: 0 });
          console.log(`✅ Applied enhanced zoom focus (fallback) - Level: ${(optimalZoom * 100).toFixed(1)}%`);
        } catch (fallbackError) {
          console.error('❌ Viewport fallback also failed:', fallbackError);
        }
      }

    } catch (error) {
      console.error('Error focusing on expanded area:', error);
    }
  }, [getNodes, setViewport]);
  
  // ReactFlow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // FIXED: Consistent spacing constants for clean layout
  const LAYOUT_CONSTANTS = {
    NODE_WIDTH: 320,
    NODE_HEIGHT: 180,
    HORIZONTAL_GAP: 100, // Increased from 80 to 100 for better horizontal spacing
    VERTICAL_GAP: 350    // Increased from 200 to 350 for better vertical spacing between levels
  };

  // Helper function: Clean, predictable layout with consistent spacing
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
    
    // FIXED: Predictable positioning with consistent spacing
    Object.keys(levelGroups).forEach(level => {
      const levelNodes = levelGroups[level];
      const levelNum = parseInt(level);
      
      // FIXED: Simple, predictable Y positioning
      const y = levelNum * LAYOUT_CONSTANTS.VERTICAL_GAP;
      
      if (levelNum === 0) {
        // Root node centered
        levelNodes.forEach(node => {
          node.position = { x: 0, y };
        });
      } else {
        // FIXED: Better horizontal distribution with consistent gaps
        const totalWidth = (levelNodes.length * LAYOUT_CONSTANTS.NODE_WIDTH) + 
                          ((levelNodes.length - 1) * LAYOUT_CONSTANTS.HORIZONTAL_GAP);
        const startX = -(totalWidth / 2) + (LAYOUT_CONSTANTS.NODE_WIDTH / 2);
        
        levelNodes.forEach((node, index) => {
          const x = startX + (index * (LAYOUT_CONSTANTS.NODE_WIDTH + LAYOUT_CONSTANTS.HORIZONTAL_GAP));
          node.position = { x, y };
        });
      }
    });
    
    console.log(`✅ Organized ${organizedNodes.length} nodes with consistent spacing`);
    return organizedNodes;
  };

  // Helper function: Get enhanced hierarchical edge styling based on level
  const getHierarchicalEdgeStyle = (level) => {
    const styles = [
      { 
        color: '#0d47a1', // Level 0: Deep Blue
        width: 4,
        type: 'straight',
        animated: false,
        dashArray: undefined,
        opacity: 1.0
      },
      { 
        color: '#1b5e20', // Level 1: Deep Green
        width: 3.5,
        type: 'smoothstep',
        animated: false,
        dashArray: undefined,
        opacity: 0.95
      },
      { 
        color: '#e65100', // Level 2: Deep Orange
        width: 3,
        type: 'smoothstep',
        animated: false,
        dashArray: undefined,
        opacity: 0.9
      },
      { 
        color: '#4a148c', // Level 3: Deep Purple
        width: 2.5,
        type: 'smoothstep',
        animated: false,
        dashArray: '8,4',
        opacity: 0.85
      },
      { 
        color: '#b71c1c', // Level 4: Deep Red
        width: 2,
        type: 'smoothstep',
        animated: true,
        dashArray: '6,3',
        opacity: 0.8
      },
      { 
        color: '#263238', // Level 5+: Dark Blue Grey
        width: 1.5,
        type: 'smoothstep',
        animated: true,
        dashArray: '4,2',
        opacity: 0.75
      }
    ];
    return styles[Math.min(level, styles.length - 1)];
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
      
      // FIXED: Simple, predictable child positioning
      const parentLevel = parentNode.data.level || 0;
      const parentX = parentNode.position.x;
      const parentY = parentNode.position.y;
      
      // Use consistent spacing constants
      const totalWidth = (children.length * LAYOUT_CONSTANTS.NODE_WIDTH) + 
                        ((children.length - 1) * LAYOUT_CONSTANTS.HORIZONTAL_GAP);
      const startX = parentX - (totalWidth / 2) + (LAYOUT_CONSTANTS.NODE_WIDTH / 2);
      const childY = parentY + LAYOUT_CONSTANTS.VERTICAL_GAP;

      children.forEach((child, index) => {
        const childId = `child-${child.objectId}`;
        const x = startX + (index * (LAYOUT_CONSTANTS.NODE_WIDTH + LAYOUT_CONSTANTS.HORIZONTAL_GAP));
        
        // Create child node with consistent positioning
        newNodes.push({
          id: childId,
          type: 'progressiveOrg',
          position: { x, y: childY },
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
      
      console.log(`✅ Added ${newNodes.length} children with consistent positioning for node ${parentNodeId}`);
      
      // FIXED: Don't reorganize all nodes - just return with new children
      return [...prevNodes, ...newNodes];
    });

    // Add edges with proper hierarchical connections and duplicate prevention
    setTimeout(() => {
      setEdges(prevEdges => {
        const newEdges = [];
        const existingEdgeIds = new Set(prevEdges.map(edge => edge.id));
        
        // Find the parent node from current nodes state
        setNodes(currentNodes => {
          const parentNodeFromCurrent = currentNodes.find(n => n.data.objectId === parentNodeId);
          if (!parentNodeFromCurrent) return currentNodes;

          children.forEach((child) => {
            const childId = `child-${child.objectId}`;
            const edgeId = `edge-${parentNodeFromCurrent.id}-${childId}`;
            
            // FIXED: Only add edge if it doesn't already exist
            if (!existingEdgeIds.has(edgeId)) {
              newEdges.push({
                id: edgeId,
                source: parentNodeFromCurrent.id,
                target: childId,
                type: 'straight',
                animated: false,
                markerEnd: {
                  type: MarkerType.ArrowClosed,
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
            }
          });
          
          return currentNodes; // Return unchanged nodes
        });

        return [...prevEdges, ...newEdges];
      });
    }, 100); // Small delay to ensure nodes are added first
  };

  // Helper function: Get all sibling nodes at the same level with the same parent
  const getSiblingNodes = useCallback((targetNodeId, currentNodes, hierarchyData) => {
    const targetNode = currentNodes.find(node => node.data.objectId === targetNodeId);
    if (!targetNode) return [];

    const targetLevel = targetNode.data.level;
    const targetParentId = targetNode.data.parentNodeId;

    return currentNodes.filter(node => 
      node.data.level === targetLevel && 
      node.data.parentNodeId === targetParentId &&
      node.data.objectId !== targetNodeId
    );
  }, []);

  // Helper function: Apply accordion behavior - hide siblings when expanding
  const applyAccordionBehavior = useCallback((expandingNodeId, shouldExpand) => {
    setNodes(prevNodes => {
      const expandingNode = prevNodes.find(node => node.data.objectId === expandingNodeId);
      if (!expandingNode) return prevNodes;

      const level = expandingNode.data.level;
      
      // Don't apply accordion behavior to Level 0 (PRESIDENT OFFICE) - it should always be visible
      if (level === 0) {
        console.log(`🎵 Accordion: Skipping Level 0 node (${expandingNode.data.name}) - always visible`);
        return prevNodes;
      }

      const siblings = getSiblingNodes(expandingNodeId, prevNodes, hierarchyDataRef.current);

      if (shouldExpand) {
        // Hide all siblings when expanding this node
        const siblingIds = siblings.map(sibling => sibling.data.objectId);
        
        setHiddenSiblings(prev => {
          const newSet = new Set(prev);
          siblingIds.forEach(id => newSet.add(id));
          return newSet;
        });

        setAccordionState(prev => {
          const newMap = new Map(prev);
          newMap.set(level, expandingNodeId);
          return newMap;
        });

        console.log(`🎵 Accordion: Expanding ${expandingNode.data.name}, hiding ${siblingIds.length} siblings at level ${level}`, { siblingIds });
      } else {
        // Show all siblings when collapsing this node
        const siblingIds = siblings.map(sibling => sibling.data.objectId);
        
        setHiddenSiblings(prev => {
          const newSet = new Set(prev);
          siblingIds.forEach(id => newSet.delete(id));
          return newSet;
        });

        setAccordionState(prev => {
          const newMap = new Map(prev);
          newMap.delete(level);
          return newMap;
        });

        console.log(`🎵 Accordion: Collapsing ${expandingNode.data.name}, showing ${siblingIds.length} siblings at level ${level}`, { siblingIds });
      }

      return prevNodes;
    });
  }, [getSiblingNodes]);

  // Handle expand/collapse of individual nodes - Load children on demand
  const handleNodeExpandCollapse = useCallback(async (nodeId, shouldExpand) => {
    console.log(`🔄 ${shouldExpand ? 'Expanding' : 'Collapsing'} node: ${nodeId}`);
    
    // Check if hierarchy data is available (use state first, then ref as fallback)
    let currentHierarchyData = hierarchyData || hierarchyDataRef.current;
    
    if (!currentHierarchyData || !currentHierarchyData.rootNodes) {
      console.error('❌ Hierarchy data not available for node expansion');
      console.log('🔍 Current hierarchyData:', hierarchyData);
      console.log('🔍 Ref hierarchyData:', hierarchyDataRef.current);
      
      // Try to reload data if it's missing
      console.log('🔧 Attempting to reload hierarchy data...');
      try {
        await loadTopLevelOnly();
        // After reload, use the most current data
        currentHierarchyData = hierarchyDataRef.current || hierarchyData;
        if (!currentHierarchyData || !currentHierarchyData.rootNodes) {
          setError('Failed to load organizational data. Please refresh the page.');
          return;
        }
      } catch (error) {
        console.error('Failed to reload hierarchy data:', error);
        setError('Organizational data not loaded. Please refresh the page.');
        return;
      }
    }
    
    try {
      if (shouldExpand) {
        // Load children for this specific node from the hierarchy
        const nodeData = findNodeInHierarchy(currentHierarchyData.rootNodes, nodeId);
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
        
        // FIXED: Comprehensive edge cleanup when collapsing nodes
        setEdges(prevEdges => {
          const nodesToRemove = new Set();
          
          // Find all descendant nodes that will be removed
          const findDescendants = (nodeId, currentNodes) => {
            currentNodes.forEach(node => {
              if (node.data.parentNodeId === nodeId) {
                nodesToRemove.add(node.id);
                nodesToRemove.add(`child-${node.data.objectId}`); // Also add child-prefixed version
                findDescendants(node.data.objectId, currentNodes); // Recursive
              }
            });
          };
          
          findDescendants(nodeId, nodes);
          
          // Remove edges that connect to or from removed nodes
          const filteredEdges = prevEdges.filter(edge => {
            const sourceRemoved = nodesToRemove.has(edge.source);
            const targetRemoved = nodesToRemove.has(edge.target);
            return !sourceRemoved && !targetRemoved;
          });
          
          console.log(`🔗 Removed ${prevEdges.length - filteredEdges.length} edges during collapse`);
          return filteredEdges;
        });
        
        setExpandedNodes(prev => {
          const newSet = new Set(prev);
          newSet.delete(nodeId);
          return newSet;
        });
      }

      // Apply accordion behavior - hide/show siblings based on expand/collapse
      applyAccordionBehavior(nodeId, shouldExpand);

      // Update parent node's expanded state
      setNodes(prevNodes => 
        prevNodes.map(node => 
          node.data.objectId === nodeId 
            ? { ...node, data: { ...node.data, isExpanded: shouldExpand } }
            : node
        )
      );

      // 🎯 FOCUSED ZOOM ON PARENT AND NEW CHILDREN
      if (shouldExpand) {
        // 🎯 ENHANCED: More aggressive and reliable focus timing for dramatic zoom effect
        setTimeout(() => {
          const nodeData = findNodeInHierarchy(currentHierarchyData.rootNodes, nodeId);
          const childrenIds = nodeData?.children?.map(child => child.objectId) || [];
          
          console.log('🎯 ENHANCED: Focusing view on expanded node with dramatic zoom:', {
            parentId: nodeId,
            childrenIds: childrenIds,
            timestamp: new Date().toISOString()
          });
          
          // 🚀 Enhanced retry mechanism for reliable dramatic focus
          const attemptFocus = (attempt = 1) => {
            try {
              // Get currently visible nodes (not hidden by accordion)
              const currentNodes = getNodes();
              const rawNodes = nodes; // Also check raw nodes from state
              
              console.log(`🔍 ENHANCED: Attempt ${attempt} - ReactFlow nodes: ${currentNodes.length}`);
              
              // Filter children to only include those that are actually visible (not hidden)
              const visibleChildrenIds = childrenIds.filter(childId => 
                !hiddenSiblings.has(childId.replace('child-', ''))
              );
              
              console.log(`👁️ ENHANCED: ${visibleChildrenIds.length}/${childrenIds.length} children visible for dramatic zoom`);
              
              // Check positions only for visible children
              const childrenWithPositions = visibleChildrenIds.filter(childId => {
                const childNode = currentNodes.find(node => node.id === `child-${childId}`) ||
                                 rawNodes.find(node => node.id === `child-${childId}`);
                return childNode && childNode.position && 
                       !isNaN(childNode.position.x) && !isNaN(childNode.position.y);
              });

              console.log(`🔍 ENHANCED: ${childrenWithPositions.length}/${visibleChildrenIds.length} positioned for dramatic zoom`);

              // 🎯 Apply dramatic focus more aggressively - even with no children for single node focus
              if (visibleChildrenIds.length === 0 || childrenWithPositions.length === visibleChildrenIds.length) {
                console.log(`🚀 ENHANCED: Applying dramatic zoom focus NOW!`);
                focusOnExpandedArea(nodeId, visibleChildrenIds);
              } else {
                console.warn(`⏳ ENHANCED: Retrying dramatic focus (${childrenWithPositions.length}/${visibleChildrenIds.length})`);
                if (attempt < 6) { // More attempts for reliability
                  setTimeout(() => attemptFocus(attempt + 1), 200); // Faster retry
                }
              }
            } catch (error) {
              console.warn(`ENHANCED Focus attempt ${attempt} failed:`, error);
              if (attempt < 6) {
                setTimeout(() => attemptFocus(attempt + 1), 200);
              }
            }
          };
          
          attemptFocus();
        }, 300); // Reduced delay for more responsive zoom
        
        // Keep the original scroll callback if provided
        if (onExpandScroll) {
          setTimeout(() => {
            console.log('🚀 Additional scroll callback for expanded level:', nodeId);
            onExpandScroll();
          }, 1200); // Delayed to happen after focused zoom
        }
      }

    } catch (error) {
      console.error('Error expanding/collapsing node:', error);
      setError(`Failed to ${shouldExpand ? 'expand' : 'collapse'} node: ${error.message}`);
    }
  }, [focusOnExpandedArea, onExpandScroll]); // Include focusOnExpandedArea in dependencies

  // Initial load on component mount only - always load full hierarchy
  useEffect(() => {
    if (!hierarchyData) {
      loadTopLevelOnly();
    }
  }, []); // Only run once on mount

  // Sync ref with state and update nodes only when needed
  useEffect(() => {
    if (hierarchyData) {
      hierarchyDataRef.current = hierarchyData; // Keep ref in sync
      
      // Only convert to nodes if we don't have nodes yet
      if (hierarchyData.rootNodes && hierarchyData.rootNodes.length > 0 && nodes.length === 0) {
        console.log('🔄 Initial setup - converting hierarchy to nodes');
        const { nodes: flowNodes, edges: flowEdges } = convertRootNodesToFlowChart(hierarchyData.rootNodes);
        setNodes(flowNodes);
        setEdges(flowEdges);
      }
    }
  }, [hierarchyData]); // Run when hierarchyData changes to keep ref in sync

  // 🎯 AUTO FIT-TO-VIEW ON INITIAL LOAD with validation
  useEffect(() => {
    if (nodes.length > 0 && !loading && hierarchyData) {
      // Small delay to ensure DOM is fully rendered
      const timer = setTimeout(() => {
        console.log('🚀 Auto-fitting view to initial hierarchy on load');
        
        // Validate that nodes have proper positions and dimensions
        const validNodes = nodes.filter(node => 
          node.position && 
          typeof node.position.x === 'number' && 
          typeof node.position.y === 'number' &&
          !isNaN(node.position.x) && 
          !isNaN(node.position.y)
        );
        
        if (validNodes.length === 0) {
          console.warn('⚠️ Cannot fit view: No nodes with valid positions found');
          return;
        }
        
        console.log(`✅ Found ${validNodes.length}/${nodes.length} nodes with valid positions`);
        
        // Use a more conservative fitView to prevent NaN errors
        try {
          fitView({
            padding: 0.1,
            includeHiddenNodes: false,
            minZoom: 0.1,  // Lower minimum to prevent calculation errors
            maxZoom: 2.0,  // Higher maximum for safety
            duration: 800,
            nodes: validNodes  // Only fit to valid nodes
          });
        } catch (error) {
          console.error('❌ FitView error:', error);
          // Fallback: try without animation
          try {
            fitView({
              padding: 0.1,
              includeHiddenNodes: false,
              minZoom: 0.1,
              maxZoom: 2.0,
              duration: 0,  // No animation
              nodes: validNodes
            });
          } catch (fallbackError) {
            console.error('❌ FitView fallback also failed:', fallbackError);
          }
        }
      }, 200); // Increased delay to ensure better DOM rendering
      
      return () => clearTimeout(timer);
    }
  }, [nodes.length, loading, hierarchyData, fitView]); // Trigger when initial nodes are loaded

  // Load organizational hierarchy - now supports both filtered and full view
  const loadTopLevelOnly = async () => {
    setLoading(true);
    setError(null);
    // Don't reset hierarchy data to preserve expanded state
    // setHierarchyData(null); // ❌ This was causing the reset

    try {
      // Always load full organizational hierarchy
      const endpoint = '/api/flowchart/hierarchy';
      console.log(`📡 Loading full organizational hierarchy from: ${endpoint}`);
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server responded with ${response.status}: ${errorText || 'Unknown error'}`);
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Invalid response from server');
      }

      console.log(`📊 Full organizational hierarchy loaded:`, result);
      
      // Validate the data structure
      if (!result.data.rootNodes || !Array.isArray(result.data.rootNodes)) {
        throw new Error('Invalid hierarchy data structure: missing rootNodes array');
      }

      console.log('🔍 Checking if data update is needed...');
      console.log('  - Current nodes count:', nodes.length);
      console.log('  - Current expanded nodes:', Array.from(expandedNodes));
      
      // Always ensure we have hierarchy data - don't let it become null
      const hasExistingData = hierarchyData && hierarchyData.rootNodes && hierarchyData.rootNodes.length > 0;
      const isDataDifferent = !hasExistingData || JSON.stringify(hierarchyData) !== JSON.stringify(result.data);
      
      if (isDataDifferent) {
        console.log('🔄 New or different data detected - updating hierarchy');
        setHierarchyData(result.data);
        hierarchyDataRef.current = result.data; // Also update ref for immediate access
        
        // Convert to nodes immediately if we have no nodes yet OR if this is a refresh (hierarchyData was null)
        // FIXED: Use setTimeout to avoid racing with expand operations
        setTimeout(() => {
          setNodes(currentNodes => {
            const isRefresh = !hierarchyData; // If hierarchyData was null, this is a refresh
            if (currentNodes.length === 0 || isRefresh) {
              console.log(isRefresh ? '🔄 Refresh detected - resetting to initial view' : '🔄 No existing nodes - converting new hierarchy data to nodes');
              const { nodes: flowNodes, edges: flowEdges } = convertRootNodesToFlowChart(result.data.rootNodes);
              setEdges(flowEdges);
              return flowNodes;
            } else {
              console.log('✅ Existing nodes preserved - view state maintained');
              return currentNodes;
            }
          });
        }, 100); // Small delay to let expand operations complete
      } else {
        console.log('✅ Data unchanged - preserving current view state');
        // Still ensure hierarchyData is set even if unchanged
        if (!hierarchyData) {
          console.log('🔧 Ensuring hierarchy data is set despite no changes');
          setHierarchyData(result.data);
          hierarchyDataRef.current = result.data;
        }
      }

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
    
    // FIXED: Use consistent spacing constants
    const { NODE_WIDTH, NODE_HEIGHT, HORIZONTAL_GAP, VERTICAL_GAP } = LAYOUT_CONSTANTS;
    
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
      
      // FIXED: Consistent horizontal distribution
      const totalLevel2Width = (allChildren.length * NODE_WIDTH) + ((allChildren.length - 1) * HORIZONTAL_GAP);
      const level2StartX = -(totalLevel2Width / 2) + (NODE_WIDTH / 2);
      
      allChildren.forEach((child, childIndex) => {
        const childNodeId = `child-${child.objectId}`;
        const childX = level2StartX + (childIndex * (NODE_WIDTH + HORIZONTAL_GAP));
        const parentNodeId = `root-${child.parentId}`;
        
        flowNodes.push({
          id: childNodeId,
          type: 'progressiveOrg',
          position: { x: childX, y: VERTICAL_GAP }, // Consistent spacing
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

        // FIXED: Edge creation with duplicate prevention
        const existingEdgeIds = new Set(flowEdges.map(edge => edge.id));
        const edgeId = `edge-${parentNodeId}-${childNodeId}`;
        
        if (!existingEdgeIds.has(edgeId)) {
          flowEdges.push({
            id: edgeId,
            source: parentNodeId,
            target: childNodeId,
            type: 'straight',
            animated: false,
            markerEnd: {
              type: MarkerType.ArrowClosed,
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
        }
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

  // Handle refresh with complete cleanup
  const handleRefresh = () => {
    setExpandedNodes(new Set());
    setHiddenSiblings(new Set()); // Reset accordion state
    setAccordionState(new Map()); // Reset accordion state
    
    // Clear all nodes and edges to reset to initial state
    setNodes([]);
    setEdges([]);
    
    // Reset hierarchy data to force fresh conversion
    setHierarchyData(null);
    
    loadTopLevelOnly();
  };

  // Filter nodes based on accordion behavior - hide siblings when a node is expanded
  const visibleNodes = React.useMemo(() => {
    const filtered = nodes.filter(node => !hiddenSiblings.has(node.data.objectId));
    
    // Debug logging to track node filtering
    if (nodes.length !== filtered.length) {
      console.log(`👁️ Node filtering: ${nodes.length} total → ${filtered.length} visible (${nodes.length - filtered.length} hidden)`);
      console.log(`Hidden siblings:`, Array.from(hiddenSiblings));
    }
    
    return filtered;
  }, [nodes, hiddenSiblings]);

  // FIXED: Enhanced edge filtering with deduplication - only show connections between visible nodes
  const visibleEdges = React.useMemo(() => {
    const visibleNodeIds = new Set(visibleNodes.map(node => node.id));
    
    // First, deduplicate edges by ID
    const uniqueEdges = edges.reduce((acc, edge) => {
      acc.set(edge.id, edge);
      return acc;
    }, new Map());
    
    const deduplicatedEdges = Array.from(uniqueEdges.values());
    
    const filteredEdges = deduplicatedEdges.filter(edge => {
      // Both source and target must be visible
      const sourceVisible = visibleNodeIds.has(edge.source);
      const targetVisible = visibleNodeIds.has(edge.target);
      const edgeVisible = sourceVisible && targetVisible;
      
      // Debug: Log when edges are filtered out
      if (!edgeVisible && (sourceVisible || targetVisible)) {
        console.log(`🔗 Filtering edge ${edge.id}: source(${edge.source}):${sourceVisible}, target(${edge.target}):${targetVisible}`);
      }
      
      return edgeVisible;
    });
    
    // Debug logging to track edge filtering and deduplication
    if (edges.length !== deduplicatedEdges.length) {
      console.log(`🔗 Deduplicated ${edges.length - deduplicatedEdges.length} duplicate edges`);
    }
    if (deduplicatedEdges.length !== filteredEdges.length) {
      console.log(`🔗 Edge filtering: ${deduplicatedEdges.length} total → ${filteredEdges.length} visible (${deduplicatedEdges.length - filteredEdges.length} hidden)`);
      
      // Show which edges were filtered out
      const hiddenEdges = deduplicatedEdges.filter(edge => !filteredEdges.includes(edge));
      console.log(`Hidden edges:`, hiddenEdges.map(e => ({ id: e.id, source: e.source, target: e.target })));
    }
    
    return filteredEdges;
  }, [edges, visibleNodes]);

  return (
    <Box sx={{ width: '100%', height: '800px' }}>
      {/* Header Controls */}
      <Box sx={{ p: 2, backgroundColor: '#f8f9fa', borderRadius: 1, mb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <AccountTreeIcon color="primary" sx={{ fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              🚀 Full Organizational Chart
            </Typography>
            {hierarchyData && (
              <Chip 
                label={`${hierarchyData.statistics.totalOrganizations} Orgs • ${hierarchyData.statistics.totalPositions} Positions`}
                color="primary"
                size="small"
              />
            )}
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
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

            {/* REMOVED: Auto-organize button to prevent layout interference */}

            {/* Refresh */}
            <IconButton onClick={handleRefresh} disabled={loading} title="Refresh Full Organizational Chart">
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Hierarchy Connection Lines Legend */}
        <Box sx={{ mt: 1, p: 1.5, backgroundColor: '#f5f5f5', borderRadius: 1, border: '1px solid #e0e0e0' }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', fontSize: '13px' }}>
              📊 Hierarchy Connection Lines Guide:
            </Typography>
          </Box>
          <Grid container spacing={1} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box 
                  sx={{ 
                    width: 30, 
                    height: 4, 
                    backgroundColor: '#0d47a1', 
                    borderRadius: 2,
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      right: -6,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 0,
                      height: 0,
                      borderLeft: '6px solid #0d47a1',
                      borderTop: '3px solid transparent',
                      borderBottom: '3px solid transparent'
                    }
                  }} 
                />
                <Typography variant="caption" sx={{ fontSize: '10px', fontWeight: 'bold' }}>
                  CEO → Divisions
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box 
                  sx={{ 
                    width: 30, 
                    height: 3.5, 
                    backgroundColor: '#1b5e20', 
                    borderRadius: 2,
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      right: -6,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 0,
                      height: 0,
                      borderLeft: '6px solid #1b5e20',
                      borderTop: '3px solid transparent',
                      borderBottom: '3px solid transparent'
                    }
                  }} 
                />
                <Typography variant="caption" sx={{ fontSize: '10px', fontWeight: 'bold' }}>
                  Division → Dept
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box 
                  sx={{ 
                    width: 30, 
                    height: 3, 
                    backgroundColor: '#e65100', 
                    borderRadius: 2,
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      right: -6,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 0,
                      height: 0,
                      borderLeft: '6px solid #e65100',
                      borderTop: '3px solid transparent',
                      borderBottom: '3px solid transparent'
                    }
                  }} 
                />
                <Typography variant="caption" sx={{ fontSize: '10px', fontWeight: 'bold' }}>
                  Dept → Sub-Dept
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box 
                  sx={{ 
                    width: 30, 
                    height: 2.5, 
                    backgroundColor: '#4a148c', 
                    borderRadius: 2,
                    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.3) 4px, rgba(255,255,255,0.3) 8px)',
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      right: -6,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 0,
                      height: 0,
                      borderLeft: '6px solid #4a148c',
                      borderTop: '3px solid transparent',
                      borderBottom: '3px solid transparent'
                    }
                  }} 
                />
                <Typography variant="caption" sx={{ fontSize: '10px', fontWeight: 'bold' }}>
                  Level 3+ (Dashed)
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box 
                  sx={{ 
                    width: 30, 
                    height: 2, 
                    backgroundColor: '#b71c1c', 
                    borderRadius: 2,
                    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.4) 3px, rgba(255,255,255,0.4) 6px)',
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      right: -6,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 0,
                      height: 0,
                      borderLeft: '6px solid #b71c1c',
                      borderTop: '2px solid transparent',
                      borderBottom: '2px solid transparent'
                    }
                  }} 
                />
                <Typography variant="caption" sx={{ fontSize: '10px', fontWeight: 'bold' }}>
                  Level 4+ (Animated)
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" sx={{ fontSize: '10px', fontStyle: 'italic', color: '#666' }}>
                💡 Thicker lines = Higher hierarchy
              </Typography>
            </Grid>
          </Grid>
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
            key={`flowchart-${visibleNodes.length}-${visibleEdges.length}-${Array.from(hiddenSiblings).join(',')}`} // Force re-render when visibility changes
            nodes={visibleNodes}
            edges={visibleEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onMove={(event, viewport) => setViewportState(viewport)}
            defaultViewport={viewportState.zoom === 1 ? { x: 0, y: 30, zoom: 0.75 } : viewportState} // Preserve viewport or use initial
            fitView={false} // Let us control fit-view manually
            fitViewOptions={{
              padding: 0.1,
              includeHiddenNodes: false,
              minZoom: 0.3,
              maxZoom: 1.2,
              duration: 800
            }}
            attributionPosition="bottom-left"
            minZoom={0.3}
            maxZoom={2}
            elementsSelectable={true}
            nodesConnectable={false}
            nodesDraggable={true}
            edgesUpdatable={false}
            edgesFocusable={true}
            selectNodesOnDrag={false}
            panOnDrag={true}
            zoomOnScroll={true}
            zoomOnPinch={true}
            preventScrolling={false}
            nodeOrigin={[0.5, 0]}
            defaultEdgeOptions={{
              type: 'straight',
              animated: false,
              style: { 
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
                strokeWidth: 2,
                stroke: '#1976d2'
              }
            }}
            connectionLineStyle={{ strokeWidth: 2, stroke: '#1976d2' }}
            snapToGrid={true}
            snapGrid={[20, 20]}
          >
            <Background 
              color="#e3f2fd" 
              gap={20} 
              size={1} 
              variant="lines"
              style={{ opacity: 0.3 }}
            />
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
const ProgressiveOrganizationalFlowchartWrapper = ({ onPersonSelect, onExpandScroll }) => (
  <ReactFlowProvider>
    <ProgressiveOrganizationalFlowchart onPersonSelect={onPersonSelect} onExpandScroll={onExpandScroll} />
  </ReactFlowProvider>
);

export default ProgressiveOrganizationalFlowchartWrapper;