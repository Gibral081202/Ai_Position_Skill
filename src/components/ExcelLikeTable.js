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
        education: { justification: '', recommendation: '' },
        experience: { justification: '', recommendation: '' },
        skills: { 
          justification: '', 
          recommendation: '',
          hardSkills: [],
          hardSkillsRatings: {},
          softSkills: [],
          softSkillsRatings: {}
        }
      },
      safetyTraining: [],
      technicalTools: [],
      technicalToolsRatings: {}
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
        console.log('Assessment received:', assessment); // Debug log
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
                  education: {
                    justification: assessment.assessments?.Education?.justification || '',
                    recommendation: assessment.assessments?.Education?.recommendation || ''
                  },
                  experience: {
                    justification: assessment.assessments?.Experience?.justification || '',
                    recommendation: assessment.assessments?.Experience?.recommendation || ''
                  },
                  skills: {
                    justification: assessment.assessments?.Skills?.justification || '',
                    recommendation: assessment.assessments?.Skills?.recommendation || '',
                    hardSkills: assessment.assessments?.Skills?.hardSkills || [],
                    hardSkillsRatings: assessment.assessments?.Skills?.hardSkillsRatings || {},
                    softSkills: assessment.assessments?.Skills?.softSkills || [],
                    softSkillsRatings: assessment.assessments?.Skills?.softSkillsRatings || {}
                  }
                },
                safetyTraining: assessment.assessments?.Certifications?.requiredCertifications || [],
                technicalTools: assessment.assessments?.['Technical Tools']?.requiredTools || [],
                technicalToolsRatings: assessment.assessments?.['Technical Tools']?.toolRatings || {}
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
        education: { justification: '', recommendation: '' },
        experience: { justification: '', recommendation: '' },
        skills: { 
          justification: '', 
          recommendation: '',
          hardSkills: [],
          hardSkillsRatings: {},
          softSkills: [],
          softSkillsRatings: {}
        }
      },
      safetyTraining: [],
      technicalTools: [],
      technicalToolsRatings: {}
    }]);
  };

  const renderChips = (items, className = '') => {
    if (!Array.isArray(items) || items.length === 0) return '';
    return (
      <div className="excel-chip-container">
        {items.map((item, index) => (
          <span key={index} className={`excel-chip ${className}`}>
            {item}
          </span>
        ))}
      </div>
    );
  };

  const renderSkillsWithRatings = (skills, ratings, className = '') => {
    if (!Array.isArray(skills) || skills.length === 0) return '';
    console.log('Skills:', skills, 'Ratings:', ratings); // Debug log
    return (
      <div className="excel-chip-container">
        {skills.map((skill, index) => {
          const rating = ratings && ratings[skill] ? ratings[skill] : null;
          return (
            <div key={index} className="skill-item" style={{ marginBottom: '4px', width: '100%' }}>
              <span className={`excel-chip ${className}`}>
                {skill}
                {rating && (
                  <span className="skill-rating"> ({rating}/10)</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderToolsWithRatings = (tools, ratings) => {
    if (!Array.isArray(tools) || tools.length === 0) return '';
    console.log('Tools:', tools, 'Tool Ratings:', ratings); // Debug log
    return (
      <div className="excel-chip-container">
        {tools.map((tool, index) => {
          const rating = ratings && ratings[tool] ? ratings[tool] : null;
          return (
            <div key={index} className="tool-item" style={{ marginBottom: '4px', width: '100%' }}>
              <span className="excel-chip">
                {tool}
                {rating && (
                  <span className="tool-rating"> ({rating}/10)</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    );
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

      <div className="excel-table-wrapper">
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
                      <Box display="flex" justifyContent="center" alignItems="center" height="80px">
                        <CircularProgress size={20} />
                      </Box>
                    ) : (
                      <>
                        <div style={{ marginBottom: '8px' }}>
                          {row.overallAssessment && (
                            <span className={`excel-status ${row.overallAssessment ? 'complete' : 'incomplete'}`}>
                              {row.overallAssessment ? 'Generated' : 'Pending'}
                            </span>
                          )}
                        </div>
                        <button
                          className="excel-button generate-button"
                          onClick={() => generateAssessment(row.id)}
                          disabled={!row.positionTitle || !row.positionLevel || loading[row.id]}
                        >
                          Generate Assessment
                        </button>
                        {row.overallAssessment && (
                          <div className="assessment-text">
                            {row.overallAssessment}
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
                    {(row.assessments.education.justification || row.assessments.education.recommendation) && (
                      <>
                        {row.assessments.education.justification && (
                          <div className="assessment-text">
                            <strong>Reason:</strong> {row.assessments.education.justification}
                          </div>
                        )}
                        {row.assessments.education.recommendation && (
                          <div className="assessment-text">
                            <strong>Recommendation:</strong> {row.assessments.education.recommendation}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </td>
                <td className="col-experience">
                  <div className="excel-data-cell">
                    {(row.assessments.experience.justification || row.assessments.experience.recommendation) && (
                      <>
                        {row.assessments.experience.justification && (
                          <div className="assessment-text">
                            <strong>Reason:</strong> {row.assessments.experience.justification}
                          </div>
                        )}
                        {row.assessments.experience.recommendation && (
                          <div className="assessment-text">
                            <strong>Recommendation:</strong> {row.assessments.experience.recommendation}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </td>
                <td className="col-hard-skills">
                  <div className="excel-data-cell">
                    {renderSkillsWithRatings(row.assessments.skills.hardSkills, row.assessments.skills.hardSkillsRatings)}
                  </div>
                </td>
                <td className="col-soft-skills">
                  <div className="excel-data-cell">
                    {renderSkillsWithRatings(row.assessments.skills.softSkills, row.assessments.skills.softSkillsRatings)}
                  </div>
                </td>
                <td className="col-safety-training">
                  <div className="excel-data-cell">
                    {renderChips(row.safetyTraining)}
                  </div>
                </td>
                <td className="col-technical-tools">
                  <div className="excel-data-cell">
                    {renderToolsWithRatings(row.technicalTools, row.technicalToolsRatings)}
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
          2. Click "Generate Assessment" in the Overall Assessment column to get AI-powered qualification recommendations
          <br />
          3. The system will automatically populate all qualification categories and requirements
          <br />
          4. Use "Add New Position" to compare multiple positions side by side
        </Typography>
      </div>

      <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '4px', border: '1px solid #b3d9ff' }}>
        <Typography variant="body2" color="text.primary">
          <strong>Rating Scale Explanation (1-10):</strong>
          <br />
          • <strong>1-2:</strong> Basic/Beginner level - Minimal proficiency required
          <br />
          • <strong>3-4:</strong> Novice level - Some knowledge or training needed
          <br />
          • <strong>5-6:</strong> Intermediate level - Solid understanding and practical experience
          <br />
          • <strong>7-8:</strong> Advanced level - High proficiency and expertise required
          <br />
          • <strong>9-10:</strong> Expert level - Mastery and specialized knowledge essential
          <br />
          <br />
          <em>Note: Ratings are applied to individual Hard Skills, Soft Skills, and Technical Tools to indicate the required proficiency level for the position.</em>
        </Typography>
      </div>
    </div>
  );
};

export default ExcelLikeTable;
