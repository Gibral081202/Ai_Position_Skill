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
import * as XLSX from 'xlsx';
import { assessPositionQualifications, generateSkillsAndToolsOptions } from '../services/geminiService';
import '../excel-theme.css';
import ProgressiveOrganizationalFlowchart from './ProgressiveOrganizationalFlowchart';

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
  const [skillsAndToolsOptions, setSkillsAndToolsOptions] = useState(null);
  const [generatingOptions, setGeneratingOptions] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRowId, setSelectedRowId] = useState(rows[0]?.id || 1);

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

  // Handler for person selection from the enhanced database-driven flowchart
  const handlePersonSelectFromFlowchart = async ({ name, positionTitle, positionLevel, department }) => {
    console.log('🎯 Staff member clicked:', { name, positionTitle, positionLevel, department });
    
    // Create a new row automatically when a staff member is clicked
    const newId = Math.max(...rows.map(r => r.id)) + 1;
    
    // Add new row with the selected person's data
    const newRow = {
      id: newId,
      positionTitle: positionTitle || '',
      positionLevel: positionLevel || 'Staff Level',
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
      technicalToolsRatings: {},
      // Store additional info
      staffName: name,
      department: department || ''
    };

    console.log('✅ Created new row with position data:', {
      positionTitle: newRow.positionTitle,
      positionLevel: newRow.positionLevel,
      staffName: newRow.staffName
    });

    // Add the new row and set it as selected
    setRows(prev => {
      const updatedRows = [...prev, newRow];
      
      // Generate assessment automatically for the new row after state update
      setTimeout(() => {
        console.log('🔄 Starting automatic assessment generation...');
        console.log('📋 Position data for assessment:', { positionTitle, positionLevel });
        // Call generateAssessment with a more reliable approach
        if (positionTitle && positionLevel) {
          generateAssessmentForNewRow(newId, positionTitle, positionLevel);
        } else {
          console.warn('⚠️ Missing position data:', { positionTitle, positionLevel });
        }
      }, 300); // Increased delay to ensure state update
      
      return updatedRows;
    });
    setSelectedRowId(newId);

    console.log('✅ Added new row for staff member:', name, 'Position:', positionTitle, 'Level:', positionLevel);
  };

  const generateAssessment = async (rowId) => {
    const row = rows.find(r => r.id === rowId);
    if (!row.positionTitle || !row.positionLevel) return;

    setLoading(prev => ({ ...prev, [rowId]: true }));
    setError(null);

    try {
      const formData = {
        positionName: row.positionTitle,
        positionLevel: row.positionLevel,
        industry: row.industry
      };

      const assessment = await assessPositionQualifications(formData);
      
      if (assessment) {
        console.log('📊 ASSESSMENT RECEIVED:', assessment.dataSource === 'GEMINI_API' ? '✅ FROM GEMINI API' : '⚠️ UNKNOWN SOURCE');
        console.log('Assessment data:', assessment);
        console.log('Skills data:', assessment.assessments?.Skills);
        console.log('Technical Tools data:', assessment.assessments?.['Technical Tools']);
        console.log('Certifications data:', assessment.assessments?.Certifications);
        
        // 🎯 FIXED: Extract data directly from Gemini API root structure
        console.log('🔍 Extracting skills data from Gemini API response (original generateAssessment)...');
        
        // Extract Hard Skills and Soft Skills directly from root level (as returned by Gemini API)
        const hardSkills = assessment.hardSkills || assessment.assessments?.Skills?.hardSkills || [];
        const hardSkillsRatings = assessment.hardSkillsRatings || assessment.assessments?.Skills?.hardSkillsRatings || {};
        const softSkills = assessment.softSkills || assessment.assessments?.Skills?.softSkills || [];
        const softSkillsRatings = assessment.softSkillsRatings || assessment.assessments?.Skills?.softSkillsRatings || {};
        
        // Extract Safety Training/Certifications directly from root level (as returned by Gemini API)
        const safetyTraining = assessment.requiredCertifications || 
                             assessment.assessments?.Certifications?.requiredCertifications || 
                             assessment.assessments?.['Safety Training']?.requiredCertifications ||
                             [];
        
        // Extract Technical Tools from the correct API structure
        const technicalTools = assessment.technicalTools || 
                              assessment.assessments?.['Technical Tools']?.requiredTools || [];
        const technicalToolsRatings = assessment.technicalToolsRatings || 
                                    assessment.assessments?.['Technical Tools']?.toolRatings || {};
        
        console.log('✅ Successfully extracted from Gemini API (original function):');
        console.log('  - Hard Skills Count:', hardSkills.length);
        console.log('  - Soft Skills Count:', softSkills.length);
        console.log('  - Safety Training Count:', safetyTraining.length);
        console.log('  - Technical Tools Count:', technicalTools.length);
        
        // If any category is empty, log a warning but don't generate fallback data
        if (hardSkills.length === 0) console.warn('⚠️ No hard skills received from Gemini API (original function)');
        if (softSkills.length === 0) console.warn('⚠️ No soft skills received from Gemini API (original function)');
        if (safetyTraining.length === 0) console.warn('⚠️ No safety training/certifications received from Gemini API (original function)');
        if (technicalTools.length === 0) console.warn('⚠️ No technical tools received from Gemini API (original function)');
        
        setRows(prev => prev.map(r => 
          r.id === rowId 
            ? {
                ...r,
                overallAssessment: assessment.overallAssessment || '',
                qualifications: {
                  essential: assessment.recommendedQualifications?.essential || assessment.qualifications?.essential || [],
                  preferred: assessment.recommendedQualifications?.preferred || assessment.qualifications?.preferred || [],
                  niceToHave: assessment.recommendedQualifications?.niceToHave || assessment.qualifications?.niceToHave || []
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
                    hardSkills: hardSkills,
                    hardSkillsRatings: hardSkillsRatings,
                    softSkills: softSkills,
                    softSkillsRatings: softSkillsRatings
                  },
                  certifications: {
                    justification: assessment.assessments?.Certifications?.justification || '',
                    recommendation: assessment.assessments?.Certifications?.recommendation || ''
                  },
                  safetyTraining: {
                    justification: assessment.assessments?.['Safety Training']?.justification || '',
                    recommendation: assessment.assessments?.['Safety Training']?.recommendation || ''
                  },
                  technicalTools: {
                    justification: assessment.assessments?.['Technical Tools']?.justification || '',
                    recommendation: assessment.assessments?.['Technical Tools']?.recommendation || ''
                  }
                },
                safetyTraining: safetyTraining,
                technicalTools: technicalTools,
                technicalToolsRatings: technicalToolsRatings
              }
            : r
        ));
      }
    } catch (error) {
      console.error('Assessment error:', error);
      setError('Failed to get assessment from Gemini API. Please check your API key/quotas and try again.');
    } finally {
      setLoading(prev => ({ ...prev, [rowId]: false }));
    }
  };

  // Generate assessment for newly created row (doesn't depend on state lookup)
  const generateAssessmentForNewRow = async (rowId, positionTitle, positionLevel) => {
    console.log('🚀 Generating assessment for new row:', { rowId, positionTitle, positionLevel });
    
    if (!positionTitle || !positionLevel) {
      console.warn('⚠️ Missing position data, skipping assessment generation');
      return;
    }

    setLoading(prev => ({ ...prev, [rowId]: true }));
    setError(null);

    try {
      const formData = {
        positionName: positionTitle,
        positionLevel: positionLevel,
        industry: 'Mining'
      };

      const assessment = await assessPositionQualifications(formData);
      
      if (assessment) {
        console.log('📊 ASSESSMENT RECEIVED FOR NEW ROW:', assessment.dataSource === 'GEMINI_API' ? '✅ FROM GEMINI API' : '⚠️ UNKNOWN SOURCE');
        console.log('📋 Full assessment data structure:', JSON.stringify(assessment, null, 2));
        console.log('🔍 Checking specific data paths:');
        console.log('  - overallAssessment:', assessment.overallAssessment);
        console.log('  - recommendedQualifications:', assessment.recommendedQualifications);
        console.log('  - qualifications:', assessment.qualifications);
        console.log('  - assessments.Skills:', assessment.assessments?.Skills);
        console.log('  - assessments.Skills.hardSkills:', assessment.assessments?.Skills?.hardSkills);
        console.log('  - assessments.Skills.softSkills:', assessment.assessments?.Skills?.softSkills);
        console.log('  - assessments.Certifications:', assessment.assessments?.Certifications);
        console.log('  - assessments.Technical Tools:', assessment.assessments?.['Technical Tools']);
        
        // 🎯 FIXED: Extract data directly from Gemini API root structure
        console.log('🔍 Extracting skills data from Gemini API response...');
        
        // Extract Hard Skills and Soft Skills directly from root level (as returned by Gemini API)
        const hardSkills = assessment.hardSkills || assessment.assessments?.Skills?.hardSkills || [];
        const hardSkillsRatings = assessment.hardSkillsRatings || assessment.assessments?.Skills?.hardSkillsRatings || {};
        const softSkills = assessment.softSkills || assessment.assessments?.Skills?.softSkills || [];
        const softSkillsRatings = assessment.softSkillsRatings || assessment.assessments?.Skills?.softSkillsRatings || {};
        
        // Extract Safety Training/Certifications directly from root level (as returned by Gemini API)
        const safetyTraining = assessment.requiredCertifications || 
                             assessment.assessments?.Certifications?.requiredCertifications || 
                             assessment.assessments?.['Safety Training']?.requiredCertifications ||
                             [];
        
        // Extract Technical Tools from the correct API structure
        const technicalTools = assessment.technicalTools || 
                              assessment.assessments?.['Technical Tools']?.requiredTools || [];
        const technicalToolsRatings = assessment.technicalToolsRatings || 
                                    assessment.assessments?.['Technical Tools']?.toolRatings || {};
        
        console.log('✅ Successfully extracted from Gemini API:');
        console.log('  - Hard Skills Count:', hardSkills.length);
        console.log('  - Soft Skills Count:', softSkills.length);
        console.log('  - Safety Training Count:', safetyTraining.length);
        console.log('  - Technical Tools Count:', technicalTools.length);
        
        // If any category is empty, log a warning but don't generate fallback data
        if (hardSkills.length === 0) console.warn('⚠️ No hard skills received from Gemini API');
        if (softSkills.length === 0) console.warn('⚠️ No soft skills received from Gemini API');
        if (safetyTraining.length === 0) console.warn('⚠️ No safety training/certifications received from Gemini API');
        if (technicalTools.length === 0) console.warn('⚠️ No technical tools received from Gemini API');

        console.log('📊 Extracted data for mapping:');
        console.log('  - hardSkills:', hardSkills);
        console.log('  - hardSkillsRatings:', hardSkillsRatings);
        console.log('  - softSkills:', softSkills);
        console.log('  - softSkillsRatings:', softSkillsRatings);
        console.log('  - safetyTraining:', safetyTraining);
        console.log('  - technicalTools:', technicalTools);
        console.log('  - technicalToolsRatings:', technicalToolsRatings);
        
        setRows(prev => prev.map(r => 
          r.id === rowId 
            ? {
                ...r,
                overallAssessment: assessment.overallAssessment || '',
                qualifications: {
                  essential: assessment.recommendedQualifications?.essential || assessment.qualifications?.essential || [],
                  preferred: assessment.recommendedQualifications?.preferred || assessment.qualifications?.preferred || [],
                  niceToHave: assessment.recommendedQualifications?.niceToHave || assessment.qualifications?.niceToHave || []
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
                    hardSkills: hardSkills,
                    hardSkillsRatings: hardSkillsRatings,
                    softSkills: softSkills,
                    softSkillsRatings: softSkillsRatings
                  },
                  certifications: {
                    justification: assessment.assessments?.Certifications?.justification || '',
                    recommendation: assessment.assessments?.Certifications?.recommendation || ''
                  },
                  safetyTraining: {
                    justification: assessment.assessments?.['Safety Training']?.justification || '',
                    recommendation: assessment.assessments?.['Safety Training']?.recommendation || ''
                  },
                  technicalTools: {
                    justification: assessment.assessments?.['Technical Tools']?.justification || '',
                    recommendation: assessment.assessments?.['Technical Tools']?.recommendation || ''
                  }
                },
                safetyTraining: safetyTraining,
                technicalTools: technicalTools,
                technicalToolsRatings: technicalToolsRatings
              }
            : r
        ));
        
        console.log('✅ Assessment data mapped to row successfully');
      } else {
        console.warn('⚠️ No assessment data received from API');
      }
    } catch (error) {
      console.error('Assessment error for new row:', error);
      setError('Failed to get assessment from Gemini API. Please check your API key/quotas and try again.');
    } finally {
      setLoading(prev => ({ ...prev, [rowId]: false }));
    }
  };

  // Generate Skills and Tools Options using LLM
  const generateOptions = async () => {
    setGeneratingOptions(true);
    setError(null);
    try {
      const options = await generateSkillsAndToolsOptions();
      setSkillsAndToolsOptions(options);
      console.log('Generated Skills and Tools Options:', options);
    } catch (error) {
      console.error('Error generating options:', error);
      setError('Failed to generate skills and tools via Gemini API.');
    } finally {
      setGeneratingOptions(false);
    }
  };

  // Check if table has meaningful data for export
  const hasDataForExport = () => {
    return rows.some(row => 
      row.positionTitle || 
      row.positionLevel || 
      row.overallAssessment ||
      row.qualifications.essential.length > 0 ||
      row.qualifications.preferred.length > 0 ||
      row.qualifications.niceToHave.length > 0 ||
      row.assessments.education.justification ||
      row.assessments.education.recommendation ||
      row.assessments.experience.justification ||
      row.assessments.experience.recommendation ||
      row.assessments.skills.hardSkills.length > 0 ||
      row.assessments.skills.softSkills.length > 0 ||
      row.safetyTraining.length > 0 ||
      row.technicalTools.length > 0
    );
  };

  const exportToExcel = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Mining_Position_Assessment_${timestamp}.xlsx`;

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    
    // Prepare data for Excel
    const excelData = [];
    
    // Headers
    const headers = [
      'Position Title',
      'Position Level',
      'Industry',
      'Overall Assessment',
      'Essential Qualifications',
      'Preferred Qualifications',
      'Nice to Have',
      'Education Requirements',
      'Education Recommendations',
      'Experience Requirements',
      'Experience Recommendations',
      'Hard Skills',
      'Hard Skills Ratings',
      'Soft Skills',
      'Soft Skills Ratings',
      'Safety Training',
      'Technical Tools',
      'Technical Tools Ratings'
    ];
    excelData.push(headers);

    // Data rows
    rows.forEach(row => {
      const hardSkillsWithRatings = row.assessments.skills.hardSkills.map(skill => {
        const rating = row.assessments.skills.hardSkillsRatings?.[skill];
        return rating ? `${skill} (${rating}/10)` : skill;
      }).join('; ');

      const softSkillsWithRatings = row.assessments.skills.softSkills.map(skill => {
        const rating = row.assessments.skills.softSkillsRatings?.[skill];
        return rating ? `${skill} (${rating}/10)` : skill;
      }).join('; ');

      const toolsWithRatings = row.technicalTools.map(tool => {
        const rating = row.technicalToolsRatings?.[tool];
        return rating ? `${tool} (${rating}/10)` : tool;
      }).join('; ');

      const rowData = [
        row.positionTitle || '',
        row.positionLevel || '',
        row.industry || '',
        row.overallAssessment || '',
        row.qualifications.essential.join('; ') || '',
        row.qualifications.preferred.join('; ') || '',
        row.qualifications.niceToHave.join('; ') || '',
        row.assessments.education.justification || '',
        row.assessments.education.recommendation || '',
        row.assessments.experience.justification || '',
        row.assessments.experience.recommendation || '',
        row.assessments.skills.hardSkills.join('; ') || '',
        hardSkillsWithRatings,
        row.assessments.skills.softSkills.join('; ') || '',
        softSkillsWithRatings,
        row.safetyTraining.join('; ') || '',
        row.technicalTools.join('; ') || '',
        toolsWithRatings
      ];
      excelData.push(rowData);
    });

    // Create worksheet from data
    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    
    // Set column widths for better readability
    const columnWidths = [
      { wch: 20 }, // Position Title
      { wch: 15 }, // Position Level
      { wch: 10 }, // Industry
      { wch: 30 }, // Overall Assessment
      { wch: 25 }, // Essential Qualifications
      { wch: 25 }, // Preferred Qualifications
      { wch: 25 }, // Nice to Have
      { wch: 25 }, // Education Requirements
      { wch: 25 }, // Education Recommendations
      { wch: 25 }, // Experience Requirements
      { wch: 25 }, // Experience Recommendations
      { wch: 25 }, // Hard Skills
      { wch: 30 }, // Hard Skills Ratings
      { wch: 25 }, // Soft Skills
      { wch: 30 }, // Soft Skills Ratings
      { wch: 25 }, // Safety Training
      { wch: 25 }, // Technical Tools
      { wch: 30 }  // Technical Tools Ratings
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Position Assessment');

    // Add a second sheet with rating scale explanation
    const ratingData = [
      ['Rating Scale (1-10)'],
      ['Rating', 'Description'],
      ['1-2', 'Basic/Beginner level - Minimal proficiency required'],
      ['3-4', 'Novice level - Some knowledge or training needed'],
      ['5-6', 'Intermediate level - Solid understanding and practical experience'],
      ['7-8', 'Advanced level - High proficiency and expertise required'],
      ['9-10', 'Expert level - Mastery and specialized knowledge essential'],
      [''],
      ['Note: Ratings are applied to individual Hard Skills, Soft Skills, and Technical Tools']
    ];
    
    const ratingSheet = XLSX.utils.aoa_to_sheet(ratingData);
    ratingSheet['!cols'] = [{ wch: 15 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(workbook, ratingSheet, 'Rating Scale');

    // Write and download the file
    XLSX.writeFile(workbook, filename);
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
    // Get all available values from the options
    const allAvailableValues = options.flatMap(optionGroup => 
      optionGroup.titles || optionGroup.positions || []
    );
    
    // Check if current value is in the available options
    const isValueInOptions = !value || allAvailableValues.includes(value);
    
    return (
      <FormControl fullWidth size="small">
        <Select
          value={isValueInOptions ? value : ''} // Use empty string if value is not in options
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
          
          {/* Show custom value that's not in options */}
          {!isValueInOptions && value && (
            <MenuItem value={value} sx={{ backgroundColor: '#fff3cd', fontStyle: 'italic', fontSize: '12px' }}>
              {value} (Custom Value)
            </MenuItem>
          )}
          
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
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <div className="excel-title">
        Mining Position Qualification Assessment - Excel View
      </div>

        {/* Organizational Structure Flowchart - Enhanced Database-Driven Version */}
        <div style={{ marginTop: '12px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: '12px',
            padding: '8px 12px',
            backgroundColor: '#e3f2fd',
            borderRadius: '6px',
            border: '1px solid #1976d2'
          }}>
            <Typography variant="subtitle1" style={{ fontWeight: 'bold', color: '#1976d2' }}>
              📊 Organizational Structure Flowchart
            </Typography>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Typography variant="caption" style={{ color: '#666', marginRight: '8px' }}>
                Organizational Chart:
              </Typography>
              <div style={{ 
                backgroundColor: '#1976d2',
                color: 'white',
                fontSize: '12px',
                padding: '4px 8px',
                borderRadius: '4px'
              }}>
                🏢 Enhanced Database View
              </div>
            </div>
          </div>

          {/* Enhanced Database-Driven Flowchart */}
          <div style={{ 
            border: '2px solid #1976d2', 
            borderRadius: '8px', 
            overflow: 'hidden',
            backgroundColor: '#f8f9fa'
          }}>
            <ProgressiveOrganizationalFlowchart onPersonSelect={handlePersonSelectFromFlowchart} />
          </div>
          
          {/* Information Panel */}
          <div style={{ 
            marginTop: '8px', 
            padding: '12px', 
            backgroundColor: '#e8f5e8', 
            borderRadius: '6px',
            border: '1px solid #4caf50'
          }}>
            <Typography variant="body2" style={{ fontSize: '12px', lineHeight: '1.4' }}>
              <strong>🎯 Organizational Chart Features:</strong>
              <br />
              • 🏢 <span style={{ color: '#1976d2', fontWeight: 'bold' }}>Blue nodes</span> = Organizations (O) - 20,901 units from your database
              <br />
              • 👤 <span style={{ color: '#4caf50', fontWeight: 'bold' }}>Green nodes</span> = Positions (S) - with employee names and levels
              <br />
              • 🔍 Search functionality across all organizational data
              <br />
              • 🎮 Interactive expand/collapse, zoom, and pan controls
              <br />
              • 📊 Click any employee name to auto-fill position assessment form
            </Typography>
          </div>
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
        <button 
          className="excel-button" 
          onClick={generateOptions}
          disabled={generatingOptions}
          style={{ 
            backgroundColor: generatingOptions ? '#6c757d' : '#28a745',
            cursor: generatingOptions ? 'not-allowed' : 'pointer'
          }}
        >
          {generatingOptions ? (
            <>
              <CircularProgress size={16} color="inherit" style={{ marginRight: '8px' }} />
              Generating...
            </>
          ) : (
            'Mass Processing'
          )}
        </button>
        <button 
          className="excel-button" 
          onClick={exportToExcel}
          disabled={!hasDataForExport()}
          style={{ 
            backgroundColor: hasDataForExport() ? '#17a2b8' : '#6c757d',
            cursor: hasDataForExport() ? 'pointer' : 'not-allowed'
          }}
        >
          Export to Excel
        </button>
        <button 
          className="excel-button"
          style={{ 
            backgroundColor: '#f39c12',
            cursor: 'pointer'
          }}
        >
          Export to SAP
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
                  {row.staffName ? (
                    // Show actual position title for staff-clicked rows
                    <div>
                      <div className="excel-input-readonly" style={{ 
                        padding: '8px', 
                        backgroundColor: '#e8f4f8', 
                        border: '1px solid #b3d9ff', 
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#1976d2'
                      }}>
                        {row.positionTitle || 'Position from Org Chart'}
                      </div>
                      <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                        👤 {row.staffName}
                      </div>
                    </div>
                  ) : (
                    // Show dropdown for manually created rows
                    renderSelect(row.id, 'positionTitle', row.positionTitle, positionTitles)
                  )}
                  <div style={{ marginTop: 6 }}>
                    <button
                      className={`excel-button small ${selectedRowId === row.id ? 'selected' : ''}`}
                      onClick={() => setSelectedRowId(row.id)}
                      title="Select this row to receive OrgChart clicks"
                    >
                      {selectedRowId === row.id ? 'Selected' : 'Select Row'}
                    </button>
                  </div>
                </td>
                <td className="col-position-level">
                  {row.staffName ? (
                    // Show actual position level for staff-clicked rows
                    <div className="excel-input-readonly" style={{ 
                      padding: '8px', 
                      backgroundColor: '#e8f4f8', 
                      border: '1px solid #b3d9ff', 
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: '#1976d2'
                    }}>
                      {row.positionLevel || 'Level from Org Chart'}
                    </div>
                  ) : (
                    // Show dropdown for manually created rows
                    renderSelect(row.id, 'positionLevel', row.positionLevel, positionLevels)
                  )}
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

      {/* Generated Skills and Tools Options Display */}
      {skillsAndToolsOptions && (
        <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f0f8ff', borderRadius: '8px', border: '2px solid #4caf50' }}>
          <Typography variant="h6" color="primary" style={{ marginBottom: '15px' }}>
            🤖 AI-Generated Skills and Tools Options
          </Typography>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {/* Technical Skills */}
            <div>
              <Typography variant="subtitle1" style={{ fontWeight: 'bold', color: '#1976d2', marginBottom: '10px' }}>
                Technical Skills
              </Typography>
              
              <div style={{ marginBottom: '15px' }}>
                <Typography variant="subtitle2" style={{ fontWeight: 'bold', color: '#2e7d32' }}>Required:</Typography>
                <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                  {skillsAndToolsOptions.technicalSkills.required.map((skill, index) => (
                    <li key={index} style={{ fontSize: '14px', marginBottom: '2px' }}>{skill}</li>
                  ))}
                </ul>
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <Typography variant="subtitle2" style={{ fontWeight: 'bold', color: '#f57c00' }}>Preferred:</Typography>
                <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                  {skillsAndToolsOptions.technicalSkills.preferred.map((skill, index) => (
                    <li key={index} style={{ fontSize: '14px', marginBottom: '2px' }}>{skill}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <Typography variant="subtitle2" style={{ fontWeight: 'bold', color: '#9c27b0' }}>Additional Options:</Typography>
                <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                  {skillsAndToolsOptions.technicalSkills.additional.map((skill, index) => (
                    <li key={index} style={{ fontSize: '14px', marginBottom: '2px' }}>{skill}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Soft Skills */}
            <div>
              <Typography variant="subtitle1" style={{ fontWeight: 'bold', color: '#1976d2', marginBottom: '10px' }}>
                Soft Skills
              </Typography>
              
              <div style={{ marginBottom: '15px' }}>
                <Typography variant="subtitle2" style={{ fontWeight: 'bold', color: '#2e7d32' }}>Required:</Typography>
                <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                  {skillsAndToolsOptions.softSkills.required.map((skill, index) => (
                    <li key={index} style={{ fontSize: '14px', marginBottom: '2px' }}>{skill}</li>
                  ))}
                </ul>
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <Typography variant="subtitle2" style={{ fontWeight: 'bold', color: '#f57c00' }}>Preferred:</Typography>
                <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                  {skillsAndToolsOptions.softSkills.preferred.map((skill, index) => (
                    <li key={index} style={{ fontSize: '14px', marginBottom: '2px' }}>{skill}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <Typography variant="subtitle2" style={{ fontWeight: 'bold', color: '#9c27b0' }}>Additional Options:</Typography>
                <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                  {skillsAndToolsOptions.softSkills.additional.map((skill, index) => (
                    <li key={index} style={{ fontSize: '14px', marginBottom: '2px' }}>{skill}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Technical Tools */}
            <div>
              <Typography variant="subtitle1" style={{ fontWeight: 'bold', color: '#1976d2', marginBottom: '10px' }}>
                Technical Tools
              </Typography>
              
              <div style={{ marginBottom: '15px' }}>
                <Typography variant="subtitle2" style={{ fontWeight: 'bold', color: '#2e7d32' }}>Required:</Typography>
                <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                  {skillsAndToolsOptions.technicalTools.required.map((tool, index) => (
                    <li key={index} style={{ fontSize: '14px', marginBottom: '2px' }}>{tool}</li>
                  ))}
                </ul>
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <Typography variant="subtitle2" style={{ fontWeight: 'bold', color: '#f57c00' }}>Preferred:</Typography>
                <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                  {skillsAndToolsOptions.technicalTools.preferred.map((tool, index) => (
                    <li key={index} style={{ fontSize: '14px', marginBottom: '2px' }}>{tool}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <Typography variant="subtitle2" style={{ fontWeight: 'bold', color: '#9c27b0' }}>Additional Options:</Typography>
                <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                  {skillsAndToolsOptions.technicalTools.additional.map((tool, index) => (
                    <li key={index} style={{ fontSize: '14px', marginBottom: '2px' }}>{tool}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fff3e0', borderRadius: '4px' }}>
            <Typography variant="caption" style={{ fontStyle: 'italic' }}>
              {skillsAndToolsOptions.isMockData ? 
                '⚠️ This data was generated using fallback options (API unavailable)' : 
                '✅ This data was generated using AI-powered analysis'
              }
            </Typography>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelLikeTable;
