/**
 * Enhanced Organizational Flowchart Component
 * Displays true organizational structure with:
 * - Blue color scheme for Organizations (O)
 * - Green color scheme for Positions (S) 
 * - Employee names, positions, and levels
 * - Interactive expand/collapse functionality
 * - Hierarchical flowchart layout
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Paper,
  Collapse,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  AccountTree as AccountTreeIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as CenterIcon,
  Info as InfoIcon,
  LocationOn as LocationIcon
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

// Enhanced Organization Node Component with proper color coding
const EnhancedOrgNode = ({ data }) => {
  const [showDetails, setShowDetails] = useState(false);

  // Color schemes based on node type
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

    if (data.nodeType === 'organization') {
      // Organizations (O) - Blue theme with gradient
      return {
        ...baseStyle,
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        color: 'white',
        borderColor: '#0d47a1',
        boxShadow: '0 8px 25px rgba(25, 118, 210, 0.4)'
      };
    } else if (data.nodeType === 'position') {
      // Positions (S) - Green theme with gradient
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

  // Handle person click for assessment
  const handlePersonClick = (person) => {
    if (data.onPersonSelect && person.holder && person.holder !== 'Vacant') {
      data.onPersonSelect({
        name: person.holder,
        positionTitle: person.name,
        positionLevel: person.positionLevel || 'Staff Level',
        department: person.department || data.name
      });
    }
  };

  // Handle details toggle
  const handleDetailsToggle = () => {
    setShowDetails(!showDetails);
  };

  const displayPositions = data.positions || [];
  const isOrganization = data.nodeType === 'organization';

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
            >
              {data.name.length > 25 ? `${data.name.substring(0, 22)}...` : data.name}
            </Typography>
          </Box>
          
          <Chip 
            label={isOrganization ? 'ORG' : 'POS'} 
            size="small" 
            sx={{ 
              fontSize: '9px', 
              height: '20px',
              backgroundColor: 'rgba(255,255,255,0.25)',
              color: 'white',
              fontWeight: 'bold'
            }}
          />
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

        {/* Statistics for Organizations */}
        {isOrganization && (data.children?.length > 0 || displayPositions.length > 0) && (
          <Box display="flex" gap={0.5} marginBottom="8px" flexWrap="wrap">
            {data.children?.length > 0 && (
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
        <Box display="flex" justifyContent="center" gap={0.5} marginBottom="6px">
          {/* Details Button */}
          <Button
            size="small"
            onClick={handleDetailsToggle}
            startIcon={showDetails ? <ExpandLessIcon /> : <InfoIcon />}
            sx={{
              fontSize: '8px',
              padding: '4px 8px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.3)',
              }
            }}
          >
            {showDetails ? 'Hide' : 'Info'}
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

        {/* Positions List for Organizations - Always visible */}
        {isOrganization && displayPositions.length > 0 && (
            <Box 
              sx={{
                backgroundColor: 'rgba(255,255,255,0.15)',
                padding: '6px',
                borderRadius: '6px',
                maxHeight: '150px',
                overflowY: 'auto'
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
                Staff Positions:
              </Typography>
              
              {displayPositions.map((position, index) => (
                <div 
                  key={`${data.objectId}-pos-${index}`}
                  style={{
                    fontSize: '8px',
                    padding: '6px',
                    marginTop: '4px',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: '4px',
                    cursor: position.holder && position.holder !== 'Vacant' ? 'pointer' : 'default',
                    border: '1px solid rgba(255,255,255,0.3)',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => handlePersonClick(position)}
                  title={position.holder && position.holder !== 'Vacant' ? 
                    'Click to select for assessment' : 'Position vacant'}
                  onMouseEnter={(e) => {
                    if (position.holder && position.holder !== 'Vacant') {
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
                  
                  {position.holder && position.holder !== 'Vacant' && (
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
  enhancedOrg: EnhancedOrgNode,
};

// Main Organizational Flowchart Component
const OrganizationalFlowchart = ({ onPersonSelect }) => {
  const [hierarchyData, setHierarchyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [detailsDialog, setDetailsDialog] = useState(false);
  
  // ReactFlow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Load organizational hierarchy on component mount
  useEffect(() => {
    loadHierarchy();
  }, []);

  // Load hierarchy from API
  const loadHierarchy = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      const url = forceRefresh ? '/api/flowchart/hierarchy?refresh=true' : '/api/flowchart/hierarchy';
      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load organizational hierarchy');
      }

      console.log('📊 Organizational hierarchy loaded:', result);
      
      setHierarchyData(result.data);
      
      // Convert to ReactFlow format
      const { nodes: flowNodes, edges: flowEdges } = convertHierarchyToFlowChart(result.data.rootNodes);
      setNodes(flowNodes);
      setEdges(flowEdges);

    } catch (error) {
      console.error('❌ Error loading hierarchy:', error);
      setError(`Failed to load organizational chart: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Convert hierarchy to ReactFlow format
  const convertHierarchyToFlowChart = (rootNodes) => {
    const flowNodes = [];
    const flowEdges = [];
    let nodeCounter = 0;

    const processNode = (node, level = 0, parentX = 0, siblingIndex = 0, totalSiblings = 1) => {
      const nodeId = `node-${nodeCounter++}`;
      
      // Calculate positions for proper hierarchical layout
      const levelSpacing = 250;
      const siblingSpacing = 280;
      const x = parentX + (siblingIndex - (totalSiblings - 1) / 2) * siblingSpacing;
      const y = level * levelSpacing;
      
      // Create organization node
      flowNodes.push({
        id: nodeId,
        type: 'enhancedOrg',
        position: { x, y },
        data: {
          ...node,
          nodeType: 'organization',
          onPersonSelect: onPersonSelect
        }
      });

      // Create position nodes if they exist
      if (node.positions && node.positions.length > 0 && level < 3) {
        node.positions.forEach((position, posIndex) => {
          const posNodeId = `pos-${nodeCounter++}`;
          const posX = x + (posIndex - (node.positions.length - 1) / 2) * 150;
          const posY = y + 120;

          flowNodes.push({
            id: posNodeId,
            type: 'enhancedOrg',
            position: { x: posX, y: posY },
            data: {
              ...position,
              nodeType: 'position',
              onPersonSelect: onPersonSelect
            }
          });

          // Create edge from organization to position
          flowEdges.push({
            id: `edge-${nodeId}-${posNodeId}`,
            source: nodeId,
            target: posNodeId,
            type: 'smoothstep',
            animated: false,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 12,
              height: 12,
              color: '#4caf50',
            },
            style: {
              strokeWidth: 2,
              stroke: '#4caf50',
              strokeDasharray: '5,5'
            }
          });
        });
      }

      // Process children organizations
      if (node.children && node.children.length > 0) {
        node.children.forEach((child, childIndex) => {
          const childNodeId = processNode(child, level + 1, x, childIndex, node.children.length);
          
          // Create edge from parent to child
          flowEdges.push({
            id: `edge-${nodeId}-${childNodeId}`,
            source: nodeId,
            target: childNodeId,
            type: 'smoothstep',
            animated: false,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 15,
              height: 15,
              color: '#1976d2',
            },
            style: {
              strokeWidth: 3,
              stroke: '#1976d2',
            }
          });
        });
      }

      return nodeId;
    };

    // Process all root nodes
    rootNodes.forEach((rootNode, index) => {
      processNode(rootNode, 0, index * 400, index, rootNodes.length);
    });

    console.log(`✅ Generated ${flowNodes.length} nodes and ${flowEdges.length} edges`);
    
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
    loadHierarchy(true);
  };

  return (
    <Box sx={{ width: '100%', height: '800px' }}>
      {/* Header Controls */}
      <Box sx={{ p: 2, backgroundColor: '#f8f9fa', borderRadius: 1, mb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <AccountTreeIcon color="primary" sx={{ fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Organizational Structure Flowchart
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

            {/* Refresh */}
            <IconButton onClick={handleRefresh} disabled={loading} title="Refresh Hierarchy">
              <RefreshIcon />
            </IconButton>
          </Box>
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
            attributionPosition="bottom-left"
            minZoom={0.1}
            maxZoom={2}
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
              Building Organizational Flowchart...
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: '#888' }}>
              Loading from database and creating hierarchical structure
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
            <Button onClick={() => loadHierarchy(true)} variant="outlined" sx={{ mt: 2 }}>
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
          {selectedResult?.type === 'position' && selectedResult.holder && selectedResult.holder !== 'Vacant' && (
            <Button 
              onClick={() => {
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
const OrganizationalFlowchartWrapper = ({ onPersonSelect }) => (
  <ReactFlowProvider>
    <OrganizationalFlowchart onPersonSelect={onPersonSelect} />
  </ReactFlowProvider>
);

export default OrganizationalFlowchartWrapper;