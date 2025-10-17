import React, { useState, useCallback, useMemo } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  List, 
  ListItem, 
  ListItemText, 
  Chip,
  Divider
} from '@mui/material';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Business Unit Node Component
const BusinessUnitNode = ({ data }) => {
  const handlePersonnelClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('=== PERSONNEL BUTTON CLICKED ===');
    console.log('Event:', e);
    console.log('Data:', data);
    console.log('onClick function:', data.onClick);
    
    if (data.onClick) {
      console.log('Executing onClick function...');
      data.onClick(data);
    } else {
      console.log('ERROR: No onClick function found');
    }
  };

  const handlePersonnelKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      console.log('Personnel link activated via keyboard:', data);
      if (data.onClick) {
        data.onClick(data);
      }
    }
  };

  const handleMouseDown = (e) => {
    console.log('Mouse down on personnel button');
    e.stopPropagation();
    e.preventDefault();
  };

  const handleButtonMouseUp = (e) => {
    console.log('Mouse up on personnel button');
    e.stopPropagation();
    e.preventDefault();
  };

  const isClickable = data.clickable !== false && data.onClick;

  const presidentStyle = {
    padding: '24px 32px',
    borderRadius: '12px',
    backgroundColor: '#1976d2',
    color: 'white',
    minWidth: '280px',
    textAlign: 'center',
    boxShadow: '0 8px 24px rgba(25, 118, 210, 0.3)',
    fontWeight: 'bold',
    cursor: 'default',
    transition: 'all 0.3s ease',
    border: '3px solid #1565c0',
    userSelect: 'none'
  };

  const divisionStyle = {
    padding: '20px 24px 16px 24px', // Reduced bottom padding
    borderRadius: '10px',
    border: '3px solid #1976d2',
    backgroundColor: '#ffffff',
    color: '#1976d2',
    minWidth: '240px',
    textAlign: 'center',
    boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
    cursor: 'default',
    transition: 'all 0.3s ease',
    userSelect: 'none'
  };

  const personnelLinkStyle = {
    fontSize: '10px',
    padding: '6px 12px',
    backgroundColor: '#1976d2',
    color: 'white',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'inline-block',
    fontWeight: '500',
    textDecoration: 'none',
    border: 'none',
    outline: 'none'
  };

  const personnelLinkHoverStyle = {
    ...personnelLinkStyle,
    backgroundColor: '#1565c0',
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
  };

  return (
    <div 
      style={data.type === 'president' ? presidentStyle : divisionStyle}
      role="presentation"
      aria-label={data.name}
    >
      {/* Add connection handles */}
      {data.type === 'president' && (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="president-bottom"
            style={{ background: '#1976d2', border: '2px solid #fff' }}
          />
        </>
      )}
      
      {data.type === 'division' && (
        <>
          <Handle
            type="target"
            position={Position.Top}
            id="division-top"
            style={{ background: '#1976d2', border: '2px solid #fff' }}
          />
        </>
      )}
      
      <div style={{ 
        fontSize: data.type === 'president' ? '18px' : '15px', 
        fontWeight: 'bold', 
        marginBottom: '8px',
        lineHeight: '1.3'
      }}>
        {data.name}
      </div>
      <div style={{ 
        fontSize: '12px', 
        opacity: 0.8,
        fontWeight: '500'
      }}>
        {data.id}
      </div>
      {data.type === 'division' && isClickable && (
        <div 
          style={{ 
            marginTop: '12px',
            pointerEvents: 'auto' // Ensure this div can receive pointer events
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            style={personnelLinkStyle}
            onClick={handlePersonnelClick}
            onMouseDown={handleMouseDown}
            onMouseUp={handleButtonMouseUp}
            onKeyDown={handlePersonnelKeyDown}
            onMouseEnter={(e) => {
              Object.assign(e.target.style, personnelLinkHoverStyle);
            }}
            onMouseLeave={(e) => {
              Object.assign(e.target.style, personnelLinkStyle);
            }}
            aria-label={`View personnel for ${data.name}`}
            type="button"
          >
            Click to view personnel
          </button>
        </div>
      )}
    </div>
  );
};

// Personnel Dialog Component
const PersonnelDialog = ({ open, onClose, businessUnit, onPersonSelect }) => {
  const handlePersonClick = (person) => {
    if (onPersonSelect) {
      onPersonSelect({
        name: person.name,
        positionTitle: person.title,
        positionLevel: person.level
      });
    }
    onClose();
  };

  if (!businessUnit) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      disableEnforceFocus={false}
      disableAutoFocus={false}
      disableRestoreFocus={false}
      PaperProps={{
        sx: { borderRadius: 3, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }
      }}
      container={() => document.body}
    >
      <DialogTitle sx={{ 
        backgroundColor: '#1976d2', 
        color: 'white', 
        textAlign: 'center',
        pb: 2
      }}>
        <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
          {businessUnit.name}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
          {businessUnit.id}
        </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        {businessUnit.leader && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ color: '#1976d2', mb: 2, fontWeight: 'bold' }}>
              Division Leader
            </Typography>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 2, 
                cursor: 'pointer', 
                transition: 'all 0.2s',
                '&:hover': { 
                  elevation: 4,
                  transform: 'translateY(-2px)',
                  backgroundColor: '#f8f9fa'
                }
              }}
              onClick={() => handlePersonClick(businessUnit.leader)}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                {businessUnit.leader.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {businessUnit.leader.title}
              </Typography>
              <Chip 
                label={businessUnit.leader.level} 
                size="small" 
                color="primary" 
                variant="outlined"
                sx={{ mt: 1 }}
              />
            </Paper>
          </Box>
        )}

        {businessUnit.team && businessUnit.team.length > 0 && (
          <Box>
            <Typography variant="h6" sx={{ color: '#1976d2', mb: 2, fontWeight: 'bold' }}>
              Team Members ({businessUnit.team.length})
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 2 }}>
              {businessUnit.team.map((member, index) => (
                <Paper 
                  key={index}
                  elevation={1} 
                  sx={{ 
                    p: 2, 
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { 
                      elevation: 3,
                      transform: 'translateY(-2px)',
                      backgroundColor: '#f8f9fa'
                    }
                  }}
                  onClick={() => handlePersonClick(member)}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    {member.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>
                    {member.title}
                  </Typography>
                  <Chip 
                    label={member.level} 
                    size="small" 
                    color="secondary" 
                    variant="outlined"
                    sx={{ mt: 1, fontSize: '10px' }}
                  />
                </Paper>
              ))}
            </Box>
          </Box>
        )}

        {/* Show message when no personnel data */}
        {!businessUnit.leader && (!businessUnit.team || businessUnit.team.length === 0) && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No personnel data available for this business unit.
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
        <Button onClick={onClose} variant="outlined" color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Define custom node types
const nodeTypes = {
  businessUnit: BusinessUnitNode,
};

const OrgChart = ({ onPersonSelect }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState(null);

  // Business unit data
  const businessUnits = useMemo(() => ({
    president: {
      id: 'BUSPRO000001',
      name: 'President Office',
      note: 'Business unit under Corporate Shared Services'
    },
    payroll: {
      id: 'DIVPROPAY035',
      name: 'Payroll President Office Division',
      leader: { 
        name: 'Elinar Kamal', 
        title: 'President Director', 
        level: 'Executive' 
      },
      team: [
        { name: 'Virayanty', title: 'Executive Payroll Senior Specialist', level: 'Senior Professional' },
        { name: 'Sim Deviana', title: 'Payroll Senior Specialist', level: 'Senior Professional' },
        { name: 'Erny Kar', title: 'Executive Payroll Senior Specialist', level: 'Senior Professional' },
        { name: 'Lusiana Chandra Waty', title: 'Payroll Senior Specialist', level: 'Senior Professional' }
      ]
    },
    communication: {
      id: 'DIVPROCOMM09',
      name: 'Corporate Communication PO Division',
      leader: { 
        name: 'Ani Mintjeriana', 
        title: 'Head of Corporate Communication PO', 
        level: 'Senior Management' 
      },
      team: []
    }
  }), []);

  const handleBusinessUnitClick = useCallback((data) => {
    console.log('Business unit clicked:', data); // Debug log
    const businessUnit = businessUnits[data.unitKey];
    if (businessUnit) {
      console.log('Opening dialog for:', businessUnit); // Debug log
      setSelectedBusinessUnit(businessUnit);
      setDialogOpen(true);
    } else {
      console.log('No business unit found for:', data.unitKey);
    }
  }, [businessUnits]);

  // Define nodes - only business units
  const initialNodes = useMemo(() => {
    console.log('Creating nodes with handleBusinessUnitClick:', handleBusinessUnitClick); // Debug log
    return [
      // President Office
      {
        id: 'president',
        type: 'businessUnit',
        position: { x: 400, y: 50 },
        data: { 
          name: 'President Office',
          id: 'BUSPRO000001',
          type: 'president',
          unitKey: 'president',
          clickable: false,
          onClick: null
        },
        draggable: false,
      },
      
      // Divisions
      {
        id: 'payroll-div',
        type: 'businessUnit',
        position: { x: 200, y: 250 },
        data: { 
          name: 'Payroll President Office Division',
          id: 'DIVPROPAY035',
          type: 'division',
          unitKey: 'payroll',
          clickable: true,
          onClick: handleBusinessUnitClick
        },
        draggable: false,
      },
      {
        id: 'comm-div',
        type: 'businessUnit', 
        position: { x: 600, y: 250 },
        data: { 
          name: 'Corporate Communication PO Division',
          id: 'DIVPROCOMM09',
          type: 'division',
          unitKey: 'communication',
          clickable: true,
          onClick: handleBusinessUnitClick
        },
        draggable: false,
      },
    ];
  }, [handleBusinessUnitClick]);

  // Define edges with improved connecting lines and proper handle references
  const initialEdges = useMemo(() => [
    {
      id: 'president-payroll',
      source: 'president',
      target: 'payroll-div',
      sourceHandle: 'president-bottom',
      targetHandle: 'division-top',
      type: 'smoothstep',
      markerEnd: { 
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: '#1976d2'
      },
      style: { 
        stroke: '#1976d2', 
        strokeWidth: 5,
        strokeDasharray: '0'
      },
      animated: false,
    },
    {
      id: 'president-comm',
      source: 'president',
      target: 'comm-div',
      sourceHandle: 'president-bottom',
      targetHandle: 'division-top',
      type: 'smoothstep', 
      markerEnd: { 
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: '#1976d2'
      },
      style: { 
        stroke: '#1976d2', 
        strokeWidth: 5,
        strokeDasharray: '0'
      },
      animated: false,
    }
  ], []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <>
      <Paper elevation={3} sx={{ mb: 3 }}>
        <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0', backgroundColor: '#f8f9fa' }}>
          <Typography variant="h5" color="primary" sx={{ textAlign: 'center', fontWeight: 'bold' }}>
            📊 Organizational Structure Chart
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
            President Office Business Units • Click on divisions to view personnel details
          </Typography>
        </Box>
        
        <div 
          style={{ height: '500px', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.6}
            maxZoom={1.4}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            preventScrolling={false}
            zoomOnScroll={true}
            panOnScroll={false}
            panOnDrag={false}
            selectNodesOnDrag={false}
            onPaneClick={(e) => {
              console.log('Pane clicked, target:', e.target);
              console.log('Event type:', e.type);
            }}
          >
            <Background 
              variant="dots" 
              gap={30} 
              size={2} 
              color="#ffffff"
              style={{ opacity: 0.3 }}
            />
            <Controls 
              showInteractive={false}
              style={{
                backgroundColor: '#1976d2',
                border: 'none',
                borderRadius: '8px'
              }}
            />
          </ReactFlow>
        </div>
      </Paper>

      <PersonnelDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        businessUnit={selectedBusinessUnit}
        onPersonSelect={onPersonSelect}
      />
    </>
  );
};

export default OrgChart;
