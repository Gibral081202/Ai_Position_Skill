import React, { useState, useEffect } from 'react';
import { 
  CircularProgress, 
  Box, 
  Typography, 
  Alert,
  FormControl,
  Select,
  MenuItem,
  ListSubheader
} from '@mui/material';
import { assessPositionQualifications } from '../services/geminiService';
import '../excel-theme.css';

const ExcelLikeTable = () => {
  const [rows, setRows] = useState([
    {
      id: 1,
      positionTitle: '',
      positionLevel: '',
      industry: 'Mining',
      overallAssessment: '',
      qualifications: {
        essential: [],
        preferred: [],
        niceToHave: []
      },
      assessments: {
        education: { rating: '', justification: '', recommendation: '' },
        experience: { rating: '', justification: '', recommendation: '' },
        skills: { 
          rating: '', 
          justification: '', 
          recommendation: '',
          hardSkills: [],
          softSkills: []
        }
      },
      safetyTraining: [],
      technicalTools: []
    }
  ]);

  const [loading, setLoading] = useState({});

  // Predefined options - Mining Industry Focus
  const positionTitles = [
    { category: 'Entry Level', titles: ['Mining Helper', 'General Laborer', 'Mining Trainee', 'Surface Laborer', 'Underground Helper'] },
    { category: 'Equipment Operations', titles: ['Drill Operator', 'Excavator Operator', 'Loader Operator', 'Haul Truck Driver', 'Crusher Operator', 'Conveyor Operator'] },
    { category: 'Technical Support', titles: ['Mine Technician', 'Maintenance Technician', 'Electrical Technician', 'Mechanical Technician', 'Instrumentation Technician', 'Survey Technician'] },
    { category: 'Safety & Quality', titles: ['Safety Officer', 'Mine Safety Inspector', 'Quality Control Technician', 'Environmental Technician', 'Emergency Response Coordinator'] },
    { category: 'Supervision', titles: ['Shift Supervisor', 'Mine Supervisor', 'Production Supervisor', 'Maintenance Supervisor', 'Safety Supervisor', 'Team Leader'] },
    { category: 'Engineering', titles: ['Mining Engineer', 'Geological Engineer', 'Mechanical Engineer', 'Electrical Engineer', 'Environmental Engineer', 'Safety Engineer'] },
    { category: 'Geology & Exploration', titles: ['Geologist', 'Exploration Geologist', 'Mine Geologist', 'Resource Geologist', 'Senior Geologist', 'Chief Geologist'] },
    { category: 'Specialized Roles', titles: ['Blaster', 'Surveyor', 'Mine Planner', 'Metallurgist', 'Process Engineer', 'Ventilation Engineer'] },
    { category: 'Management', titles: ['Mine Manager', 'Operations Manager', 'Production Manager', 'Maintenance Manager', 'Safety Manager', 'General Foreman'] },
    { category: 'Senior Management', titles: ['General Manager', 'Site Manager', 'Regional Manager', 'Operations Director', 'Mining Director'] },
    { category: 'Executive', titles: ['Vice President Mining', 'Chief Operating Officer', 'Chief Executive Officer', 'Managing Director'] }
  ];

  const positionLevels = [
    { category: 'Entry Level', positions: ['Helper', 'Laborer', 'Trainee'] },
    { category: 'Operational', positions: ['Operator', 'Driver', 'Equipment Operator', 'Plant Operator'] },
    { category: 'Technical', positions: ['Technician', 'Maintenance Technician', 'Safety Officer', 'Quality Control'] },
    { category: 'Supervisory', positions: ['Supervisor', 'Team Leader', 'Shift Supervisor', 'Foreman'] },
    { category: 'Professional', positions: ['Engineer', 'Geologist', 'Environmental Specialist', 'Safety Engineer'] },
    { category: 'Senior Professional', positions: ['Senior Engineer', 'Chief Geologist', 'Principal Engineer', 'Senior Specialist'] },
    { category: 'Management', positions: ['Superintendent', 'Manager', 'Operations Manager', 'Department Manager'] },
    { category: 'Senior Management', positions: ['General Manager', 'Site Manager', 'Regional Manager'] },
    { category: 'Executive', positions: ['Director', 'Vice President', 'CEO'] }
  ];

  const handleInputChange = (rowId, field, value) => {
    setRows(prev => prev.map(row => 
      row.id === rowId 
        ? { ...row, [field]: value }
        : row
    ));
  };

  const generateAssessment = async (rowId) => {
    const row = rows.find(r => r.id === rowId);
    if (!row.positionTitle || !row.positionLevel) return;

    setLoading(prev => ({ ...prev, [rowId]: true }));

    try {
      const formData = {
        positionName: row.positionTitle,
        positionLevel: row.positionLevel,
        industry: row.industry
      };

      const assessment = await assessPositionQualifications(formData);
      
      if (assessment) {
        setRows(prev => prev.map(r => 
          r.id === rowId 
            ? {
                ...r,
                overallAssessment: assessment.overallAssessment || '',
                qualifications: {
                  essential: assessment.recommendedQualifications?.essential || [],
                  preferred: assessment.recommendedQualifications?.preferred || [],
                  niceToHave: assessment.recommendedQualifications?.niceToHave || []
                },
                assessments: {
                  education: assessment.assessments?.Education || { rating: '', justification: '', recommendation: '' },
                  experience: assessment.assessments?.Experience || { rating: '', justification: '', recommendation: '' },
                  skills: assessment.assessments?.Skills || { 
                    rating: '', 
                    justification: '', 
                    recommendation: '',
                    hardSkills: [],
                    softSkills: []
                  }
                },
                safetyTraining: assessment.assessments?.Certifications?.requiredCertifications || [],
                technicalTools: assessment.assessments?.['Technical Tools']?.requiredTools || []
              }
            : r
        ));
      }
    } catch (error) {
      console.error('Assessment error:', error);
    } finally {
      setLoading(prev => ({ ...prev, [rowId]: false }));
    }
  };

  const addNewRow = () => {
    const newId = Math.max(...rows.map(r => r.id)) + 1;
    setRows(prev => [...prev, {
      id: newId,
      positionTitle: '',
      positionLevel: '',
      industry: 'Mining',
      overallAssessment: '',
      qualifications: {
        essential: [],
        preferred: [],
        niceToHave: []
      },
      assessments: {
        education: { rating: '', justification: '', recommendation: '' },
        experience: { rating: '', justification: '', recommendation: '' },
        skills: { 
          rating: '', 
          justification: '', 
          recommendation: '',
          hardSkills: [],
          softSkills: []
        }
      },
      safetyTraining: [],
      technicalTools: []
    }]);
  };

  const renderChips = (items, className = '') => {
    if (!Array.isArray(items) || items.length === 0) return '';
    return items.map((item, index) => (
      <span key={index} className={`excel-chip ${className}`}>
        {item}
      </span>
    ));
  };

  const renderSelect = (rowId, field, value, options) => {
    return (
      <FormControl fullWidth size="small">
        <Select
          value={value}
          onChange={(e) => handleInputChange(rowId, field, e.target.value)}
          className="excel-select"
          displayEmpty
          sx={{ 
            fontSize: '12px',
            '& .MuiSelect-select': { padding: '2px 4px' },
            '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
            '&:hover .MuiOutlinedInput-notchedOutline': { border: 'none' },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: '2px solid #0078d4' }
          }}
        >
          <MenuItem value="">
            <em>Select {field.replace(/([A-Z])/g, ' $1').toLowerCase()}</em>
          </MenuItem>
          {options.map((optionGroup) => [
            <ListSubheader key={optionGroup.category} sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '11px' }}>
              {optionGroup.category}
            </ListSubheader>,
            ...(optionGroup.titles || optionGroup.positions).map((option) => (
              <MenuItem key={option} value={option} sx={{ pl: 4, fontSize: '12px' }}>
                {option}
              </MenuItem>
            ))
          ])}
        </Select>
      </FormControl>
    );
  };

  return (
    <div className="excel-container">
      <div className="excel-title">
        Mining Position Qualification Assessment - Excel View
      </div>

      <div className="excel-action-buttons">
        <button className="excel-button" onClick={addNewRow}>
          Add New Position
        </button>
        <button 
          className="excel-button secondary" 
          onClick={() => setRows([rows[0]])}
        >
          Clear All
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="excel-table">
          <thead>
            <tr>
              <th rowSpan="2" className="col-position-title">Position Title</th>
              <th rowSpan="2" className="col-position-level">Position Level</th>
              <th rowSpan="2" className="col-industry">Industry</th>
              <th rowSpan="2" className="col-overall-assessment">Overall Assessment</th>
              <th colSpan="3" className="excel-group-header">Overall Qualification Recommendations</th>
              <th colSpan="4" className="excel-group-header">Qualification Category Assessment</th>
              <th rowSpan="2" className="col-safety-training">Safety Training & Certifications</th>
              <th rowSpan="2" className="col-technical-tools">Technical Tools</th>
            </tr>
            <tr>
              <th className="col-essential">Essential</th>
              <th className="col-preferred">Preferred</th>
              <th className="col-nice-to-have">Nice to Have</th>
              <th className="col-education">Education</th>
              <th className="col-experience">Experience</th>
              <th className="col-hard-skills">Hard Skills</th>
              <th className="col-soft-skills">Soft Skills</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="col-position-title">
                  {renderSelect(row.id, 'positionTitle', row.positionTitle, positionTitles)}
                </td>
                <td className="col-position-level">
                  {renderSelect(row.id, 'positionLevel', row.positionLevel, positionLevels)}
                </td>
                <td className="col-industry">
                  <input
                    type="text"
                    className="excel-input"
                    value={row.industry}
                    onChange={(e) => handleInputChange(row.id, 'industry', e.target.value)}
                    placeholder="Mining"
                  />
                </td>
                <td className="col-overall-assessment">
                  <div className="excel-data-cell">
                    {loading[row.id] ? (
                      <Box display="flex" justifyContent="center" alignItems="center" height="40px">
                        <CircularProgress size={16} />
                      </Box>
                    ) : (
                      <>
                        <div style={{ marginBottom: '5px' }}>
                          {row.overallAssessment && (
                            <span className={`excel-status ${row.overallAssessment ? 'complete' : 'incomplete'}`}>
                              {row.overallAssessment ? 'Generated' : 'Pending'}
                            </span>
                          )}
                        </div>
                        <button
                          className="excel-button"
                          onClick={() => generateAssessment(row.id)}
                          disabled={!row.positionTitle || !row.positionLevel || loading[row.id]}
                          style={{ fontSize: '10px', padding: '4px 8px' }}
                        >
                          Generate
                        </button>
                        {row.overallAssessment && (
                          <div style={{ marginTop: '5px', fontSize: '10px', color: '#666' }}>
                            {row.overallAssessment.substring(0, 100)}...
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </td>
                <td className="col-essential">
                  <div className="excel-data-cell">
                    {renderChips(row.qualifications.essential, 'essential')}
                  </div>
                </td>
                <td className="col-preferred">
                  <div className="excel-data-cell">
                    {renderChips(row.qualifications.preferred, 'preferred')}
                  </div>
                </td>
                <td className="col-nice-to-have">
                  <div className="excel-data-cell">
                    {renderChips(row.qualifications.niceToHave, 'nice-to-have')}
                  </div>
                </td>
                <td className="col-education">
                  <div className="excel-data-cell">
                    {row.assessments.education.rating && (
                      <>
                        <div><strong>Rating:</strong> {row.assessments.education.rating}/10</div>
                        <div style={{ fontSize: '9px', marginTop: '2px' }}>
                          {row.assessments.education.recommendation?.substring(0, 80)}...
                        </div>
                      </>
                    )}
                  </div>
                </td>
                <td className="col-experience">
                  <div className="excel-data-cell">
                    {row.assessments.experience.rating && (
                      <>
                        <div><strong>Rating:</strong> {row.assessments.experience.rating}/10</div>
                        <div style={{ fontSize: '9px', marginTop: '2px' }}>
                          {row.assessments.experience.recommendation?.substring(0, 80)}...
                        </div>
                      </>
                    )}
                  </div>
                </td>
                <td className="col-hard-skills">
                  <div className="excel-data-cell">
                    {renderChips(row.assessments.skills.hardSkills)}
                  </div>
                </td>
                <td className="col-soft-skills">
                  <div className="excel-data-cell">
                    {renderChips(row.assessments.skills.softSkills)}
                  </div>
                </td>
                <td className="col-safety-training">
                  <div className="excel-data-cell">
                    {renderChips(row.safetyTraining)}
                  </div>
                </td>
                <td className="col-technical-tools">
                  <div className="excel-data-cell">
                    {renderChips(row.technicalTools)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <Typography variant="body2" color="text.secondary">
          <strong>Instructions:</strong>
          <br />
          1. Select a Position Title and Position Level from the dropdown menus
          <br />
          2. Click "Generate" in the Overall Assessment column to get AI-powered qualification recommendations
          <br />
          3. The system will automatically populate all qualification categories and requirements
          <br />
          4. Use "Add New Position" to compare multiple positions side by side
        </Typography>
      </div>
    </div>
  );
};

export default ExcelLikeTable;
