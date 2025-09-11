// Google Gemini API Service - Mining Industry Focus
import { API_CONFIG, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../config/apiConfig';

// API Configuration
const API_KEY = API_CONFIG.API_KEY;
const API_URL = API_CONFIG.API_URL;
const MODEL_NAME = API_CONFIG.MODEL_NAME;

let requestCount = 0;
let lastRequestTime = 0;
const RATE_LIMIT_DELAY = API_CONFIG.RATE_LIMIT_DELAY;
const MAX_RETRIES = API_CONFIG.MAX_RETRIES;

// Rate limiting utility
const rateLimit = () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    const delay = RATE_LIMIT_DELAY - timeSinceLastRequest;
    return new Promise(resolve => setTimeout(resolve, delay));
  }
  
  lastRequestTime = now;
  return Promise.resolve();
};

// Retry with exponential backoff
const retryWithBackoff = async (fn, maxRetries = MAX_RETRIES) => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isConnectionError = error.message?.includes('fetch') || 
                               error.message?.includes('network') ||
                               error.message?.includes('ECONNREFUSED') ||
                               error.message?.includes('Failed to fetch') ||
                               error.status === 429;
      
      if (isConnectionError && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
        console.log(`Gemini API call failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }
};

// Call Gemini API
const callGeminiAPI = async (prompt) => {
  const response = await fetch(`${API_URL}?key=${API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 2048,
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  
  // Gemini returns response in candidates array
  if (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
    return data.candidates[0].content.parts[0].text;
  }
  
  throw new Error('Invalid response format from Gemini API');
};

// Mock data generators (fallback when API fails) - Mining Industry Focus
const generateMockAssessment = (positionData) => {
  const { positionName, positionLevel, industry = 'Mining' } = positionData;
  
  // Generate ratings based on position title and level
  const getTitleCategory = (title) => {
    const titleMappings = {
      // Entry Level titles
      'Mining Helper': 'entry', 'General Laborer': 'entry', 'Mining Trainee': 'entry', 'Surface Laborer': 'entry', 'Underground Helper': 'entry',
      
      // Equipment Operations titles
      'Drill Operator': 'operator', 'Excavator Operator': 'operator', 'Loader Operator': 'operator', 'Haul Truck Driver': 'operator', 'Crusher Operator': 'operator', 'Conveyor Operator': 'operator',
      
      // Technical Support titles
      'Mine Technician': 'technician', 'Maintenance Technician': 'technician', 'Electrical Technician': 'technician', 'Mechanical Technician': 'technician', 'Instrumentation Technician': 'technician', 'Survey Technician': 'technician',
      
      // Safety & Quality titles
      'Safety Officer': 'safety', 'Mine Safety Inspector': 'safety', 'Quality Control Technician': 'safety', 'Environmental Technician': 'safety', 'Emergency Response Coordinator': 'safety',
      
      // Supervision titles
      'Shift Supervisor': 'supervisor', 'Mine Supervisor': 'supervisor', 'Production Supervisor': 'supervisor', 'Maintenance Supervisor': 'supervisor', 'Safety Supervisor': 'supervisor', 'Team Leader': 'supervisor',
      
      // Engineering titles
      'Mining Engineer': 'engineer', 'Geological Engineer': 'engineer', 'Mechanical Engineer': 'engineer', 'Electrical Engineer': 'engineer', 'Environmental Engineer': 'engineer', 'Safety Engineer': 'engineer',
      
      // Geology & Exploration titles
      'Geologist': 'geologist', 'Exploration Geologist': 'geologist', 'Mine Geologist': 'geologist', 'Resource Geologist': 'geologist', 'Senior Geologist': 'senior_geologist', 'Chief Geologist': 'senior_geologist',
      
      // Specialized Roles titles
      'Blaster': 'specialist', 'Surveyor': 'specialist', 'Mine Planner': 'specialist', 'Metallurgist': 'specialist', 'Process Engineer': 'specialist', 'Ventilation Engineer': 'specialist',
      
      // Management titles
      'Mine Manager': 'manager', 'Operations Manager': 'manager', 'Production Manager': 'manager', 'Maintenance Manager': 'manager', 'Safety Manager': 'manager', 'General Foreman': 'manager',
      
      // Senior Management titles
      'General Manager': 'senior_manager', 'Site Manager': 'senior_manager', 'Regional Manager': 'senior_manager', 'Operations Director': 'senior_manager', 'Mining Director': 'senior_manager',
      
      // Executive titles
      'Vice President Mining': 'executive', 'Chief Operating Officer': 'executive', 'Chief Executive Officer': 'executive', 'Managing Director': 'executive'
    };
    
    return titleMappings[title] || 'technician';
  };

  const titleCategory = getTitleCategory(positionName);
  
  // Base ratings by title category
  const baseRatingsByCategory = {
    'entry': { education: 3, experience: 2, skills: 4, certifications: 3, safetyTraining: 8, technicalTools: 3 },
    'operator': { education: 5, experience: 4, skills: 6, certifications: 6, safetyTraining: 9, technicalTools: 7 },
    'technician': { education: 6, experience: 5, skills: 7, certifications: 7, safetyTraining: 9, technicalTools: 8 },
    'safety': { education: 7, experience: 5, skills: 8, certifications: 9, safetyTraining: 10, technicalTools: 6 },
    'supervisor': { education: 7, experience: 7, skills: 8, certifications: 7, safetyTraining: 9, technicalTools: 7 },
    'engineer': { education: 9, experience: 6, skills: 8, certifications: 8, safetyTraining: 8, technicalTools: 9 },
    'geologist': { education: 9, experience: 6, skills: 8, certifications: 7, safetyTraining: 7, technicalTools: 8 },
    'senior_geologist': { education: 10, experience: 9, skills: 9, certifications: 8, safetyTraining: 7, technicalTools: 9 },
    'specialist': { education: 8, experience: 7, skills: 8, certifications: 8, safetyTraining: 8, technicalTools: 9 },
    'manager': { education: 8, experience: 9, skills: 9, certifications: 8, safetyTraining: 8, technicalTools: 7 },
    'senior_manager': { education: 9, experience: 10, skills: 10, certifications: 9, safetyTraining: 8, technicalTools: 8 },
    'executive': { education: 9, experience: 10, skills: 10, certifications: 8, safetyTraining: 7, technicalTools: 7 }
  };

  const ratings = baseRatingsByCategory[titleCategory] || baseRatingsByCategory['technician'];

  // Generate skills lists based on position category
  const getSkillsForCategory = (category) => {
    const skillsMap = {
      'entry': {
        hardSkills: [
          'Keselamatan Kerja Dasar', 'Penggunaan APD', 'Prosedur Operasional Standar', 
          'Pengenalan Alat Tambang', 'Sistem Komunikasi Radio', 'Dasar-dasar Geologi', 
          'Pemahaman SOP Tambang', 'Identifikasi Bahaya', 'Prosedur Evakuasi Darurat', 
          'Penggunaan Peralatan K3', 'Dasar Survei Tambang', 'Pembacaan Peta Tambang',
          'Pengoperasian Alat Sederhana', 'Pemeliharaan Alat Dasar', 'Dokumentasi Kerja'
        ],
        softSkills: [
          'Disiplin', 'Kerjasama Tim', 'Komunikasi Dasar', 'Kepatuhan Terhadap Instruksi',
          'Tanggung Jawab', 'Kedisiplinan Waktu', 'Adaptabilitas', 'Kesabaran',
          'Ketekunan', 'Ketelitian', 'Semangat Belajar', 'Rasa Hormat',
          'Kerjasama Lintas Shift', 'Komunikasi Antar Departemen', 'Etika Kerja'
        ]
      },
      'operator': {
        hardSkills: [
          'Operasi Alat Berat', 'Pemeliharaan Mesin', 'Membaca Blueprint', 'Sistem Hidrolik',
          'Operasi Excavator', 'Operasi Dump Truck', 'Operasi Crusher', 'Operasi Conveyor',
          'Sistem Kontrol SCADA', 'Diagnostik Mesin', 'Perawatan Preventif', 'Troubleshooting Alat',
          'Operasi Crane', 'Sistem Pneumatik', 'Pembacaan Instrumen'
        ],
        softSkills: [
          'Perhatian Detail', 'Koordinasi Tangan-Mata', 'Kemampuan Konsentrasi', 'Manajemen Waktu',
          'Kesabaran Operasional', 'Respons Cepat Darurat', 'Komunikasi Tim', 'Disiplin Operasi',
          'Analisis Situasi', 'Pengambilan Keputusan Cepat', 'Kestabilan Emosi', 'Fokus Jangka Panjang',
          'Koordinasi dengan Pengawas', 'Laporan Status', 'Kesiapsiagaan'
        ]
      },
      'technician': {
        hardSkills: [
          'Troubleshooting', 'Pemeliharaan Preventif', 'Sistem Elektrik', 'Welding', 'CAD',
          'PLC Programming', 'Sistem Instrumentasi', 'Analisis Vibration', 'Motor Control',
          'Sistem Kontrol Otomatis', 'Kalibrasi Instrumen', 'Electrical Troubleshooting', 
          'Mechanical Repair', 'Hydraulic System', 'Pneumatic System'
        ],
        softSkills: [
          'Pemecahan Masalah', 'Komunikasi Teknis', 'Kerja Mandiri', 'Analisis',
          'Berpikir Sistematis', 'Dokumentasi Teknis', 'Transfer Knowledge', 'Mentoring Junior',
          'Koordinasi Tim Teknis', 'Manajemen Inventory', 'Perencanaan Kerja', 'Quality Control',
          'Continuous Improvement', 'Inovasi Teknis', 'Safety Leadership'
        ]
      },
      'safety': {
        hardSkills: [
          'Risk Assessment', 'Audit Keselamatan', 'Emergency Response', 'Investigasi Kecelakaan',
          'OHSAS 18001', 'NEBOSH Certification', 'JSA Development', 'HAZOP Analysis',
          'Safety Training Design', 'Incident Management', 'Safety Compliance', 'Environmental Safety',
          'Mine Rescue Operations', 'Fire Prevention', 'Gas Detection Systems'
        ],
        softSkills: [
          'Kepemimpinan', 'Komunikasi Persuasif', 'Pengambilan Keputusan', 'Manajemen Krisis',
          'Diplomasi', 'Coaching Safety', 'Influencing Skills', 'Public Speaking',
          'Change Management', 'Cultural Transformation', 'Conflict Resolution', 'Stakeholder Engagement',
          'Team Building', 'Motivasi Tim', 'Authority Management'
        ]
      },
      'supervisor': {
        hardSkills: [
          'Manajemen Produksi', 'Perencanaan Shift', 'Budget Management', 'KPI Monitoring',
          'Schedule Optimization', 'Resource Planning', 'Cost Control', 'Quality Management',
          'Performance Analysis', 'Workflow Management', 'Inventory Control', 'Maintenance Planning',
          'Safety Management', 'Team Coordination', 'Production Reporting'
        ],
        softSkills: [
          'Kepemimpinan Tim', 'Komunikasi Efektif', 'Negosiasi', 'Manajemen Konflik',
          'Coaching dan Mentoring', 'Performance Management', 'Decision Making', 'Delegation',
          'Motivasi Tim', 'Change Leadership', 'Stakeholder Management', 'Emotional Intelligence',
          'Cross-functional Collaboration', 'Strategic Thinking', 'Results Orientation'
        ]
      },
      'engineer': {
        hardSkills: [
          'Design Engineering', 'Project Management', 'Technical Analysis', 'Process Optimization',
          'Mine Planning', 'Resource Modeling', 'Feasibility Studies', 'Technical Writing',
          'Software Proficiency', 'Data Analysis', 'Statistical Analysis', 'Simulation Modeling',
          'Equipment Selection', 'Process Design', 'Cost Engineering'
        ],
        softSkills: [
          'Pemikiran Kritis', 'Inovasi', 'Presentasi', 'Manajemen Stakeholder',
          'Problem Solving Complex', 'Strategic Planning', 'Technical Communication', 'Research Skills',
          'Analytical Thinking', 'Creative Solutions', 'Cross-functional Leadership', 'Mentoring',
          'Change Management', 'Continuous Learning', 'Global Perspective'
        ]
      },
      'geologist': {
        hardSkills: [
          'Geological Mapping', 'Core Logging', 'Resource Estimation', 'Geostatistics',
          'Structural Geology', 'Mineralogy', 'Geochemical Analysis', 'Drilling Programs',
          'Grade Control', 'Ore Reserve Calculation', 'Geological Modeling', 'Field Sampling',
          'Laboratory Analysis', 'Geophysical Interpretation', 'Exploration Planning'
        ],
        softSkills: [
          'Analisis Data', 'Penelitian', 'Reporting', 'Kerja Lapangan',
          'Attention to Detail', 'Scientific Writing', 'Data Interpretation', 'Field Leadership',
          'Cross-disciplinary Collaboration', 'Presentation Skills', 'Client Relations', 'Team Coordination',
          'Problem Solving', 'Critical Analysis', 'Continuous Learning'
        ]
      },
      'manager': {
        hardSkills: [
          'Strategic Planning', 'Financial Management', 'Operations Management', 'Regulatory Compliance',
          'Business Development', 'Contract Negotiation', 'Risk Management', 'Change Management',
          'Performance Management', 'Budget Planning', 'Investment Analysis', 'Market Analysis',
          'Stakeholder Management', 'Corporate Governance', 'Legal Compliance'
        ],
        softSkills: [
          'Visi Strategis', 'Pengembangan Tim', 'Negosiasi Tingkat Tinggi', 'Change Management',
          'Executive Leadership', 'Strategic Communication', 'Board Presentations', 'Crisis Management',
          'Cultural Transformation', 'Global Leadership', 'Innovation Leadership', 'Succession Planning',
          'Organizational Development', 'Investor Relations', 'Industry Networking'
        ]
      }
    };
    return skillsMap[category] || skillsMap['technician'];
  };

  // Generate certifications based on position category
  const getCertificationsForCategory = (category) => {
    const certsMap = {
      'entry': [
        'Sertifikat K3 Umum', 'Training Orientasi Tambang', 'Sertifikat P3K', 'Basic Safety Training',
        'MSHA Part 46 Training', 'Confined Space Training', 'First Aid Certificate', 'Fire Safety Training',
        'Chemical Hazard Awareness', 'Personal Protective Equipment Training', 'Emergency Response Training',
        'Environmental Awareness', 'Basic Computer Skills Certificate', 'Heavy Equipment Safety', 'Mine Induction Training'
      ],
      'operator': [
        'SIO Alat Berat', 'Sertifikat Operator Crane', 'MSHA Training', 'Heavy Equipment License',
        'Forklift Operator Certificate', 'Mobile Equipment Certificate', 'Explosive Transport License',
        'GPS System Certification', 'SCADA Operation Certificate', 'Fleet Management System Training',
        'Maintenance Technician Level 1', 'Radio Communication License', 'Safety Observer Certificate',
        'Equipment Inspection Certificate', 'Hydraulic System Training'
      ],
      'technician': [
        'Sertifikat Teknik Mesin', 'Welding Certificate', 'Electrical Safety', 'PLC Programming Certificate',
        'Instrumentation Technician', 'Mechanical Technician License', 'Electrical Technician License',
        'Maintenance Planning Certificate', 'Quality Control Certificate', 'Calibration Technician',
        'Vibration Analysis Certificate', 'Motor Control Certificate', 'Industrial Automation Certificate',
        'Safety System Technician', 'Process Control Technician'
      ],
      'safety': [
        'NEBOSH', 'OHSAS 18001 Lead Auditor', 'Emergency Response Team', 'Mine Safety Manager Certificate',
        'MSHA Manager Certificate', 'Risk Assessment Specialist', 'Incident Investigation Certificate',
        'JSA Facilitator Certificate', 'Safety Training Instructor', 'Environmental Auditor',
        'Fire Prevention Certificate', 'Gas Detection Specialist', 'Confined Space Supervisor',
        'Safety Management System Auditor', 'Occupational Health Certificate'
      ],
      'supervisor': [
        'Supervisory Management', 'ISO 45001', 'Mine Rescue Certificate', 'Production Supervisor Certificate',
        'Leadership Development Certificate', 'Team Management Certificate', 'Performance Management Training',
        'Budget Management Certificate', 'Quality Management ISO 9001', 'Environmental Management ISO 14001',
        'Project Management Certificate', 'Conflict Resolution Certificate', 'Communication Skills Certificate',
        'Change Management Certificate', 'Strategic Planning Certificate'
      ],
      'engineer': [
        'Professional Engineer (PE)', 'Project Management Professional (PMP)', 'MSHA Manager Certificate',
        'Mining Engineer License', 'Professional Mining Engineer', 'Chartered Engineer', 'Six Sigma Green Belt',
        'Lean Manufacturing Certificate', 'Design Engineering Certificate', 'Process Optimization Certificate',
        'Environmental Engineering Certificate', 'Geotechnical Engineering Certificate', 'Structural Engineering License',
        'Technical Writing Certificate', 'Research and Development Certificate'
      ],
      'geologist': [
        'Professional Geologist', 'JORC Competent Person', 'GIS Certification', 'Certified Professional Geologist',
        'Resource Estimation Certificate', 'Geostatistics Certificate', 'Geological Mapping Certificate',
        'Core Logging Certificate', 'Exploration Geologist Certificate', 'Grade Control Certificate',
        'Geochemistry Certificate', 'Structural Geology Certificate', 'Mineralogy Certificate',
        'Geophysics Certificate', 'Environmental Geology Certificate'
      ],
      'manager': [
        'MBA', 'Executive Leadership', 'Mine Manager Certificate', 'Advanced Management Program',
        'Strategic Leadership Certificate', 'Financial Management Certificate', 'Operations Management Certificate',
        'Change Management Certification', 'Corporate Governance Certificate', 'Risk Management Professional',
        'Investment Analysis Certificate', 'Business Development Certificate', 'Contract Management Certificate',
        'Stakeholder Management Certificate', 'International Business Certificate'
      ]
    };
    return certsMap[category] || certsMap['technician'];
  };

  // Generate technical tools based on position category
  const getToolsForCategory = (category) => {
    const toolsMap = {
      'entry': [
        'Microsoft Office', 'Sistem Radio Komunikasi', 'Peralatan K3 Dasar', 'GPS Navigation',
        'Basic Computer Skills', 'Email Communication', 'Time Tracking Systems', 'Digital Camera',
        'Basic Surveying Tools', 'Safety Equipment', 'Communication Devices', 'Mobile Applications',
        'Digital Forms', 'Barcode Scanners', 'Simple Database Entry'
      ],
      'operator': [
        'SCADA System', 'GPS Navigation', 'Fleet Management System', 'Diagnostic Tools',
        'Mobile Equipment Management', 'Radio Communication Systems', 'Digital Displays',
        'Condition Monitoring Systems', 'Maintenance Management Software', 'Production Tracking Systems',
        'Safety Monitoring Systems', 'Fuel Management Systems', 'Load Management Systems',
        'Equipment Control Panels', 'Telematics Systems'
      ],
      'technician': [
        'AutoCAD', 'CMMS Software', 'Multimeter', 'PLC Programming', 'Electrical Testing Equipment',
        'Mechanical Tools', 'Welding Equipment', 'Diagnostic Software', 'Calibration Equipment',
        'Vibration Analysis Tools', 'Thermal Imaging Cameras', 'Oscilloscopes', 'Power Quality Analyzers',
        'Motor Testing Equipment', 'Hydraulic Test Equipment'
      ],
      'safety': [
        'Risk Assessment Software', 'Incident Management System', 'Gas Detection Equipment',
        'Safety Management Software', 'Training Management Systems', 'Audit Management Tools',
        'JSA Software', 'Permit to Work Systems', 'Emergency Response Systems', 'Safety Monitoring Equipment',
        'Environmental Monitoring Tools', 'Personal Monitoring Devices', 'Safety Communication Systems',
        'Inspection Management Software', 'Compliance Management Systems'
      ],
      'supervisor': [
        'Production Planning Software', 'ERP Systems', 'KPI Dashboard', 'Shift Management Tools',
        'Resource Planning Systems', 'Budget Management Software', 'Performance Monitoring Tools',
        'Quality Management Systems', 'Inventory Management Systems', 'Maintenance Planning Software',
        'Workforce Management Systems', 'Communication Platforms', 'Reporting Tools',
        'Document Management Systems', 'Project Management Software'
      ],
      'engineer': [
        'Surpac', 'Vulcan 3D', 'MineSight', 'MATLAB', 'Primavera P6', 'AutoCAD', 'SolidWorks',
        'Leapfrog Geo', 'Whittle', 'GEMS', 'Datamine', 'Studio 5D', 'Deswik', 'Micromine',
        'ArcGIS', 'Python Programming', 'R Statistical Software', 'Tableau', 'Power BI'
      ],
      'geologist': [
        'Leapfrog Geo', 'Micromine', 'ArcGIS', 'Geostatistical Software', 'Vulcan 3D',
        'Surpac', 'GEMS', 'MineSight', 'Datamine', 'RockWorks', 'GOCAD', 'Petrel',
        'GeoSoft Oasis Montaj', 'MapInfo', 'Global Mapper', 'QGIS', 'GeoPandas',
        'Statistical Analysis Software', 'Database Management Systems'
      ],
      'manager': [
        'Business Intelligence Tools', 'Financial Planning Software', 'Strategic Planning Tools',
        'Enterprise Resource Planning', 'Customer Relationship Management', 'Project Portfolio Management',
        'Risk Management Software', 'Performance Management Systems', 'Business Process Management',
        'Document Management Systems', 'Communication Platforms', 'Collaboration Tools',
        'Data Analytics Platforms', 'Forecasting Software', 'Investment Analysis Tools'
      ]
    };
    return toolsMap[category] || toolsMap['technician'];
  };

  const skills = getSkillsForCategory(titleCategory);
  const certifications = getCertificationsForCategory(titleCategory);
  const tools = getToolsForCategory(titleCategory);

  // Generate individual ratings for skills and tools
  const generateSkillRatings = (skillList, baseRating) => {
    const ratings = {};
    skillList.forEach((skill, index) => {
      // Create more varied and realistic ratings
      let rating;
      if (titleCategory === 'entry') {
        rating = Math.max(1, Math.min(6, baseRating + Math.floor(Math.random() * 3) - 1));
      } else if (titleCategory === 'operator' || titleCategory === 'technician') {
        rating = Math.max(3, Math.min(8, baseRating + Math.floor(Math.random() * 3) - 1));
      } else if (titleCategory === 'engineer' || titleCategory === 'geologist') {
        rating = Math.max(5, Math.min(9, baseRating + Math.floor(Math.random() * 3) - 1));
      } else if (titleCategory === 'manager' || titleCategory === 'senior_manager') {
        rating = Math.max(6, Math.min(10, baseRating + Math.floor(Math.random() * 3) - 1));
      } else {
        rating = Math.max(1, Math.min(10, baseRating + Math.floor(Math.random() * 3) - 1));
      }
      ratings[skill] = rating;
    });
    return ratings;
  };

  const generateToolRatings = (toolList, baseRating) => {
    const ratings = {};
    toolList.forEach((tool, index) => {
      // Create more varied and realistic ratings
      let rating;
      if (titleCategory === 'entry') {
        rating = Math.max(1, Math.min(5, baseRating + Math.floor(Math.random() * 3) - 1));
      } else if (titleCategory === 'operator' || titleCategory === 'technician') {
        rating = Math.max(4, Math.min(8, baseRating + Math.floor(Math.random() * 3) - 1));
      } else if (titleCategory === 'engineer' || titleCategory === 'geologist') {
        rating = Math.max(6, Math.min(10, baseRating + Math.floor(Math.random() * 3) - 1));
      } else if (titleCategory === 'manager' || titleCategory === 'senior_manager') {
        rating = Math.max(5, Math.min(9, baseRating + Math.floor(Math.random() * 3) - 1));
      } else {
        rating = Math.max(1, Math.min(10, baseRating + Math.floor(Math.random() * 3) - 1));
      }
      ratings[tool] = rating;
    });
    return ratings;
  };

  const hardSkillsRatings = generateSkillRatings(skills.hardSkills, ratings.skills);
  const softSkillsRatings = generateSkillRatings(skills.softSkills, Math.max(1, ratings.skills - 1)); // Soft skills slightly lower
  const toolRatings = generateToolRatings(tools, ratings.technicalTools);

  // Generate comprehensive qualifications based on position category and ratings
  const getQualificationsForCategory = (category, ratings) => {
    const qualificationsMap = {
      'entry': {
        essential: [
          ratings.education >= 6 ? "Diploma (D3) dalam Teknik Pertambangan" : "SMA/SMK Teknik",
          ratings.experience >= 3 ? "3 tahun pengalaman sebagai teknisi tambang" : "Pengalaman kerja dasar industri",
          "Sertifikat K3 Tambang", "Training Orientasi Tambang", "Sertifikat P3K",
          "Basic Safety Training", "Kemampuan Menggunakan APD", "Pemahaman SOP Tambang",
          "Kondisi Fisik Sehat", "Tidak Buta Warna", "Kemampuan Komunikasi Dasar",
          "Kemauan Belajar Tinggi", "Disiplin Kerja", "Kemampuan Kerja Tim",
          "Kesiapan Kerja Shift"
        ],
        preferred: [
          "Pengalaman di Industri Berat", "Sertifikat Operator Alat Ringan", "Kemampuan Computer Dasar",
          "Pengalaman Maintenance", "Sertifikat Welding Dasar", "Training K3 Lanjutan",
          "Pengalaman Kerja Lapangan", "Kemampuan Baca Gambar Teknik", "Sertifikat Driver License",
          "Basic English", "Pengalaman Konstruksi", "Training Environmental Awareness",
          "Kemampuan Problem Solving", "Inisiatif Kerja", "Adaptasi Teknologi Baru"
        ],
        niceToHave: [
          "Pengalaman Multi-site", "Sertifikat MSHA", "Kemampuan Bahasa Asing",
          "Pengalaman International", "Leadership Potential", "Technical Writing Skills",
          "Digital Literacy", "Cross-training Experience", "Mentoring Skills",
          "Innovation Mindset", "Sustainability Awareness", "Cultural Adaptability",
          "Emergency Response Training", "Quality Management Understanding", "Continuous Learning Attitude"
        ]
      },
      'operator': {
        essential: [
          "Diploma (D3) Teknik Mesin/Elektro", "5 tahun pengalaman operator alat berat",
          "SIO (Surat Izin Operator) Alat Berat", "Sertifikat K3 Operator", "MSHA Training",
          "Kemampuan Operasi Excavator/Loader", "Pemahaman Sistem Hidrolik", "Maintenance Preventif",
          "Kemampuan Baca Blueprint", "Radio Communication License", "Heavy Equipment License",
          "Kondisi Fisik Prima", "Kemampuan Kerja Shift", "Perhatian Detail Tinggi",
          "Respons Cepat Situasi Darurat"
        ],
        preferred: [
          "Pengalaman Multi-equipment", "Sertifikat Crane Operator", "GPS System Training",
          "SCADA Operation Certificate", "Fleet Management Experience", "Diagnostic Skills",
          "Supervisor Experience", "Training and Mentoring Skills", "Quality Control Understanding",
          "Performance Optimization Skills", "Safety Leadership", "Team Coordination",
          "Technical Documentation", "Continuous Improvement Mindset", "Cross-functional Collaboration"
        ],
        niceToHave: [
          "International Mining Experience", "Advanced Technology Training", "Remote Operation Skills",
          "Automation System Understanding", "IoT Equipment Experience", "Predictive Maintenance Knowledge",
          "Digital Twin Technology", "Advanced Safety Systems", "Environmental Technology",
          "Sustainability Practices", "Innovation in Operations", "Change Management",
          "Cultural Diversity Experience", "Language Skills", "Leadership Development"
        ]
      },
      'technician': {
        essential: [
          "Diploma (D3) Teknik Mesin/Elektro", "5 tahun pengalaman maintenance industri",
          "Sertifikat Teknisi Mesin/Elektro", "PLC Programming Certificate", "Welding Certificate",
          "Electrical Safety Training", "Mechanical System Understanding", "Troubleshooting Skills",
          "CMMS Software Proficiency", "AutoCAD Basic", "Instrumentation Knowledge",
          "Calibration Skills", "Quality Control Understanding", "Safety System Knowledge",
          "Technical Documentation Skills"
        ],
        preferred: [
          "Bachelor Degree Teknik", "Advanced PLC Programming", "SCADA System Experience",
          "Vibration Analysis Certificate", "Predictive Maintenance Skills", "Project Management",
          "Training and Development Skills", "Lean Manufacturing Knowledge", "Six Sigma Training",
          "Advanced Troubleshooting", "System Integration", "Performance Optimization",
          "Mentor and Coaching Skills", "Cross-functional Collaboration", "Innovation Mindset"
        ],
        niceToHave: [
          "Master Degree atau Professional Certification", "International Experience", "Automation Expertise",
          "IoT and Industry 4.0 Knowledge", "Artificial Intelligence Applications", "Digital Transformation",
          "Sustainability Engineering", "Environmental Technology", "Advanced Materials Knowledge",
          "Research and Development", "Patent Development", "Innovation Leadership",
          "Global Technology Trends", "Future Technology Adoption", "Change Leadership"
        ]
      },
      'engineer': {
        essential: [
          "Bachelor Degree Teknik Pertambangan", "Professional Engineer (PE) License", "7 tahun pengalaman engineering",
          "Project Management Professional (PMP)", "Mining Software Proficiency", "Design Engineering Skills",
          "Technical Analysis Capability", "Feasibility Study Experience", "Regulatory Compliance Knowledge",
          "Safety Engineering Understanding", "Environmental Engineering", "Cost Engineering",
          "Resource Estimation", "Mine Planning", "Process Optimization"
        ],
        preferred: [
          "Master Degree Engineering", "International Project Experience", "Advanced Mining Software",
          "Research and Development", "Innovation Leadership", "Team Management", "Stakeholder Management",
          "Business Development", "Strategic Planning", "Change Management", "Mentoring and Coaching",
          "Technical Writing and Presentation", "Cross-cultural Communication", "Global Mining Standards",
          "Sustainability Engineering"
        ],
        niceToHave: [
          "PhD atau Advanced Research", "International Recognition", "Mining Industry Awards",
          "Board Advisory Experience", "Startup/Innovation Experience", "Digital Transformation Leadership",
          "Artificial Intelligence in Mining", "Automation and Robotics", "Sustainable Mining Practices",
          "Future Mining Technologies", "Investment and Venture Capital", "Global Mining Networks",
          "Policy and Regulation Development", "Industry Thought Leadership", "Academic Collaboration"
        ]
      },
      'manager': {
        essential: [
          "Bachelor Degree Business/Engineering", "10+ tahun pengalaman manajemen", "MBA atau Management Degree",
          "Mine Manager Certificate", "Strategic Planning Experience", "Financial Management Skills",
          "Operations Management", "Team Leadership", "Stakeholder Management", "Risk Management",
          "Performance Management", "Budget Management", "Regulatory Compliance", "Change Management",
          "Business Development"
        ],
        preferred: [
          "Advanced Management Program", "International Management Experience", "Multi-site Operations",
          "Board Management Experience", "Investment Analysis", "Merger & Acquisition", "Corporate Strategy",
          "Innovation Leadership", "Digital Transformation", "Sustainability Leadership", "Crisis Management",
          "Investor Relations", "Public Speaking", "Industry Association Leadership", "Executive Coaching"
        ],
        niceToHave: [
          "CEO/COO Experience", "International Board Positions", "Industry Recognition Awards",
          "Government Advisory Roles", "Academic Collaboration", "Venture Capital Experience",
          "Startup Investment", "Global Mining Networks", "Policy Development", "Thought Leadership",
          "Future Industry Shaping", "Technology Disruption Leadership", "Sustainable Development Goals",
          "Global ESG Leadership", "Innovation Ecosystem Building"
        ]
      }
    };
    return qualificationsMap[category] || qualificationsMap['technician'];
  };

  const qualifications = getQualificationsForCategory(titleCategory, ratings);

  // Generate risk level
  const avgRating = Object.values(ratings).reduce((a, b) => a + b, 0) / 6;
  let riskLevel = 'Medium';
  if (avgRating >= 8) riskLevel = 'High';
  if (avgRating <= 5) riskLevel = 'Low';

  return {
    assessments: {
      Education: {
        justification: `${positionName} positions in mining typically require ${ratings.education >= 8 ? 'advanced' : ratings.education >= 6 ? 'standard' : 'basic'} educational qualifications with focus on mining engineering or related technical fields.`,
        recommendation: ratings.education >= 8 ? "Bachelor's degree in Mining Engineering, Geology, or related field; Master's preferred for senior roles" : ratings.education >= 6 ? "Bachelor's degree in relevant engineering or technical field" : "High school diploma or trade certification adequate"
      },
      Experience: {
        justification: `${positionName} roles require ${ratings.experience >= 8 ? 'extensive' : ratings.experience >= 6 ? 'moderate' : 'minimal'} mining industry experience with knowledge of mining operations and safety protocols.`,
        recommendation: ratings.experience >= 8 ? "10+ years mining experience with 5+ years in leadership" : ratings.experience >= 6 ? "3-7 years relevant mining experience" : "0-2 years experience, entry-level position with training provided"
      },
      Skills: {
        justification: `${positionName} positions demand ${ratings.skills >= 8 ? 'highly developed' : ratings.skills >= 6 ? 'well-developed' : 'basic'} technical and leadership skills specific to mining operations.`,
        recommendation: ratings.skills >= 8 ? "Advanced leadership, strategic planning, and technical problem-solving skills" : ratings.skills >= 6 ? "Strong communication, teamwork, and operational skills" : "Basic technical and safety awareness skills required",
        hardSkills: skills.hardSkills,
        hardSkillsRatings: hardSkillsRatings,
        softSkills: skills.softSkills,
        softSkillsRatings: softSkillsRatings
      },
      'Safety Training': {
        justification: `Mining industry ${ratings.safetyTraining >= 8 ? 'mandates extensive' : ratings.safetyTraining >= 6 ? 'requires comprehensive' : 'benefits from basic'} safety training and certifications for all personnel.`,
        recommendation: ratings.safetyTraining >= 8 ? "MSHA certification, first aid, confined space, and hazmat training required" : ratings.safetyTraining >= 6 ? "Basic MSHA training and safety certifications required" : "Basic safety orientation and ongoing training provided"
      },
      Certifications: {
        justification: `Mining operations ${ratings.certifications >= 7 ? 'highly value' : ratings.certifications >= 5 ? 'value' : 'may consider'} professional mining certifications and licenses for this position level.`,
        recommendation: ratings.certifications >= 7 ? "Professional Engineer (PE) license, mining certifications preferred" : ratings.certifications >= 5 ? "Relevant technical certifications beneficial" : "Certifications optional but valued for career growth",
        requiredCertifications: certifications
      },
      'Technical Tools': {
        justification: `Mining positions ${ratings.technicalTools >= 8 ? 'heavily rely on' : ratings.technicalTools >= 6 ? 'require proficiency in' : 'may use'} specialized mining software and equipment.`,
        recommendation: ratings.technicalTools >= 8 ? "Advanced proficiency in mining software (AutoCAD, Surpac, Vulcan), GIS systems" : ratings.technicalTools >= 6 ? "Proficiency in industry-standard mining software and systems" : "Basic computer skills, willingness to learn mining software",
        requiredTools: tools,
        toolRatings: toolRatings
      }
    },
    overallAssessment: `${positionName} position in mining requires a balanced combination of qualifications with particular emphasis on ${Object.entries(ratings).sort((a, b) => b[1] - a[1])[0][0].toLowerCase()} and mining industry safety standards.`,
    riskLevel: riskLevel,
    recommendedQualifications: {
      essential: qualifications.essential,
      preferred: qualifications.preferred,
      niceToHave: qualifications.niceToHave
    },
    isMockData: true // Flag to indicate this is mock data
  };
};

const generateMockInsights = (positionData) => {
  const { positionName, positionLevel, industry = 'Mining' } = positionData;
  
  const insights = {
    marketAnalysis: `The market for ${positionName} positions in the mining industry is ${
      ['Engineer', 'Senior Engineer', 'Geologist', 'Safety Engineer'].includes(positionLevel) ? 'highly competitive' : 
      ['Helper', 'Laborer', 'Trainee'].includes(positionLevel) ? 'moderately competitive' : 'competitive'
    }. Demand is ${
      ['Director', 'General Manager', 'Vice President', 'CEO'].includes(positionLevel) ? 'strong for experienced leaders' : 
      'steady with growth in automation and safety focus'
    } in the mining sector.`,
    
    salaryRange: `${positionLevel} positions in mining typically earn ${
      ['Director', 'General Manager', 'Vice President', 'CEO'].includes(positionLevel) ? '$150,000-$300,000+' : 
      ['Manager', 'Operations Manager', 'Department Manager', 'Site Manager', 'Regional Manager'].includes(positionLevel) ? '$100,000-$200,000' :
      ['Engineer', 'Senior Engineer', 'Geologist', 'Safety Engineer', 'Chief Geologist', 'Principal Engineer', 'Senior Specialist'].includes(positionLevel) ? '$80,000-$150,000' :
      ['Superintendent'].includes(positionLevel) ? '$90,000-$160,000' :
      ['Supervisor', 'Team Leader', 'Shift Supervisor', 'Foreman'].includes(positionLevel) ? '$60,000-$100,000' :
      ['Technician', 'Maintenance Technician', 'Safety Officer', 'Quality Control'].includes(positionLevel) ? '$45,000-$75,000' :
      ['Operator', 'Driver', 'Equipment Operator', 'Plant Operator'].includes(positionLevel) ? '$40,000-$65,000' : '$35,000-$55,000'
    } annually, plus mining industry benefits and bonuses.`,
    
    recruitmentStrategy: `Focus on ${
      ['Director', 'General Manager', 'Vice President', 'CEO'].includes(positionLevel) ? 'executive search firms and mining industry networks' : 
      ['Engineer', 'Manager', 'Senior Engineer', 'Geologist'].includes(positionLevel) ? 'mining professional associations and specialized recruiters' : 
      'mining job boards, trade schools, and industry apprenticeships'
    }. Consider ${['Engineer', 'Senior Engineer', 'Geologist'].includes(positionLevel) ? 'passive candidate engagement' : 'active recruitment from mining communities'}.`,
    
    hiringChallenges: `Key challenges include ${
      ['Engineer', 'Senior Engineer', 'Geologist', 'Safety Engineer'].includes(positionLevel) ? 'finding candidates with both technical expertise and mining-specific experience' : 
      ['Director', 'General Manager', 'Vice President', 'CEO'].includes(positionLevel) ? 'identifying leaders with proven mining industry track records' : 
      'attracting candidates willing to work in remote mining locations and shift schedules'
    }. Safety training requirements and location constraints can limit candidate pools.`,
    
    alternativeQualifications: [
      `${['Engineer', 'Geologist'].includes(positionLevel) ? 'Military engineering experience' : 'Related industrial experience'} as alternative to mining experience`,
      `Heavy construction or oil & gas industry background as transferable skills`,
      `${['Helper', 'Laborer', 'Trainee'].includes(positionLevel) ? 'Apprenticeship programs' : 'Relevant certifications'} to supplement formal education`,
      `${['Operator', 'Driver'].includes(positionLevel) ? 'Equipment operation experience' : 'Project management background'} from related industries`
    ],
    
    industryTrends: `Current trends in mining include ${
      'increased automation, environmental sustainability, and digital mining technologies'
    }. ${
      ['Engineer', 'Senior Engineer', 'Geologist'].includes(positionLevel) ? 'Technical innovation leadership is increasingly valued' : 
      'Adaptability to new technologies and safety protocols is essential'
    }.`,
    isMockData: true // Flag to indicate this is mock data
  };

  return insights;
};

export const generateSkillsAndToolsOptions = async () => {
  try {
    // Apply rate limiting
    await rateLimit();
    
    // Try real API with retry logic
    const result = await retryWithBackoff(async () => {
      const prompt = `You are an expert mining industry HR consultant. Generate comprehensive lists of skills and tools for mining positions. Return ONLY valid JSON without any additional text. All text content must be in Indonesian language.

{
  "technicalSkills": {
    "required": [string],
    "preferred": [string],
    "additional": [string]
  },
  "softSkills": {
    "required": [string],
    "preferred": [string], 
    "additional": [string]
  },
  "technicalTools": {
    "required": [string],
    "preferred": [string],
    "additional": [string]
  }
}

Please provide exactly 10-15 items for each category (required, preferred, additional) across all three skill types:

TECHNICAL SKILLS:
- Required: Essential technical/hard skills needed across most mining positions (10-15 items)
- Preferred: Advanced technical skills that are highly valuable (10-15 items)
- Additional: Specialized or emerging technical skills (10-15 items)

SOFT SKILLS:
- Required: Core interpersonal/professional skills needed in mining (10-15 items)
- Preferred: Advanced soft skills for leadership and collaboration (10-15 items)
- Additional: Specialized soft skills for modern mining environments (10-15 items)

TECHNICAL TOOLS:
- Required: Essential software/equipment/systems used in mining (10-15 items)
- Preferred: Advanced tools and specialized software (10-15 items)
- Additional: Emerging technologies and specialized equipment (10-15 items)

Focus on mining industry specifics including safety, operations, geology, engineering, management, and emerging digital technologies. Use Indonesian language for all skill and tool names where appropriate, with English terms for software/technical tools where commonly used.`;

      const response = await callGeminiAPI(prompt);
      
      try {
        // Extract JSON from response if it contains extra text
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : response;
        const parsed = JSON.parse(jsonString);
        parsed.isMockData = false;
        return parsed;
      } catch (parseError) {
        console.error('Failed to parse skills options JSON:', parseError);
        throw new Error('Invalid response format from API');
      }
    });

    return result;

  } catch (error) {
    console.error('Error generating skills and tools options:', error);
    
    // Fallback to predefined comprehensive lists
    const fallbackOptions = {
      technicalSkills: {
        required: [
          'Perencanaan dan Desain Tambang',
          'Penilaian Geologis',
          'Protokol dan Prosedur Keselamatan',
          'Operasi Peralatan',
          'Mekanika Batuan',
          'Penanganan Bahan Peledak',
          'Sistem Ventilasi',
          'Kepatuhan Lingkungan',
          'Kontrol Kualitas',
          'Penjadwalan Produksi',
          'Analisis Biaya',
          'Manajemen Risiko',
          'Estimasi Sumber Daya',
          'Analisis Data',
          'Manajemen Proyek'
        ],
        preferred: [
          'Teknik Survei Lanjutan',
          'Kalkulasi Cadangan Bijih',
          'Pengolahan Mineral',
          'Hidrogeologi',
          'Teknik Geoteknik',
          'Perencanaan Penutupan Tambang',
          'Praktik Berkelanjutan',
          'Standar Tambang Internasional',
          'Manajemen Keselamatan Lanjutan',
          'Sistem Otomasi',
          'Teknologi Operasi Jarak Jauh',
          'Pemodelan Keuangan',
          'Kepatuhan Regulasi',
          'Respons Darurat',
          'Pelatihan dan Pengembangan'
        ],
        additional: [
          'Penelitian dan Pengembangan',
          'Manajemen Inovasi',
          'Teknologi Digital Twin',
          'Aplikasi Kecerdasan Buatan',
          'Operasi Drone',
          'Pemodelan 3D',
          'Pelatihan Virtual Reality',
          'Blockchain untuk Supply Chain',
          'Implementasi IoT',
          'Machine Learning',
          'Pemeliharaan Prediktif',
          'Ilmu Material Lanjutan',
          'Integrasi Energi Terbarukan',
          'Pengurangan Jejak Karbon',
          'Prinsip Ekonomi Sirkular'
        ]
      },
      softSkills: {
        required: [
          'Keterampilan Komunikasi',
          'Pemecahan Masalah',
          'Berpikir Kritis',
          'Kerja Tim',
          'Kepemimpinan',
          'Manajemen Waktu',
          'Adaptabilitas',
          'Pengambilan Keputusan',
          'Perhatian terhadap Detail',
          'Bekerja di Bawah Tekanan',
          'Resolusi Konflik',
          'Layanan Pelanggan',
          'Keandalan',
          'Inisiatif',
          'Kesadaran Keselamatan'
        ],
        preferred: [
          'Perencanaan Strategis',
          'Mentoring dan Coaching',
          'Komunikasi Lintas Budaya',
          'Keterampilan Negosiasi',
          'Berbicara di Depan Umum',
          'Manajemen Stakeholder',
          'Manajemen Perubahan',
          'Kecerdasan Emosional',
          'Pemecahan Masalah Kreatif',
          'Berpikir Analitis',
          'Delegasi',
          'Manajemen Kinerja',
          'Networking',
          'Kesadaran Budaya',
          'Manajemen Stres'
        ],
        additional: [
          'Kepemimpinan Inovasi',
          'Literasi Digital',
          'Pola Pikir Global',
          'Berpikir Kewirausahaan',
          'Design Thinking',
          'Systems Thinking',
          'Keterampilan Siap Masa Depan',
          'Pola Pikir Berkelanjutan',
          'Pengambilan Keputusan Etis',
          'Diversitas dan Inklusi',
          'Metodologi Agile',
          'Pembelajaran Berkelanjutan',
          'Komunikasi Digital',
          'Kolaborasi Jarak Jauh',
          'Pengambilan Keputusan Berbasis Data'
        ]
      },
      technicalTools: {
        required: [
          'AutoCAD',
          'Surpac',
          'MineSight',
          'Vulcan',
          'Deswik',
          'Microsoft Office Suite',
          'Sistem Manajemen Keselamatan',
          'Sistem GPS/GIS',
          'Peralatan Survei',
          'Software Core Logging',
          'Sistem Pelacakan Produksi',
          'Sistem Manajemen Pemeliharaan',
          'Alat Monitoring Lingkungan',
          'Software Kontrol Kualitas',
          'Alat Manajemen Proyek'
        ],
        preferred: [
          'Leapfrog Geo',
          'GEMS',
          'Whittle',
          'Studio 5D',
          'Datamine',
          'ArcGIS',
          'Pemrograman Python',
          'R Statistical Software',
          'MATLAB',
          'Tableau',
          'Power BI',
          'SAP',
          'Oracle Database',
          'SQL',
          'Excel/VBA Lanjutan'
        ],
        additional: [
          'Platform Machine Learning',
          'Alat Kecerdasan Buatan',
          'Software Kontrol Drone',
          'Platform IoT',
          'Cloud Computing (AWS/Azure)',
          'Platform Blockchain',
          'Software Virtual Reality',
          'Alat Augmented Reality',
          'Software 3D Printing',
          'Software Simulasi',
          'Analitik Big Data',
          'Aplikasi Mobile',
          'Alat Web Development',
          'Platform Digital Twin',
          'Software Analitik Prediktif'
        ]
      },
      isMockData: true
    };

    return fallbackOptions;
  }
};

export const assessPositionQualifications = async (positionData) => {
  try {
    // Apply rate limiting
    await rateLimit();
    
    // Try real API with retry logic
    const result = await retryWithBackoff(async () => {
      const prompt = `You are an expert mining industry HR consultant. Return ONLY valid JSON without any additional text. All text content must be in Indonesian language.

{
  "assessments": {
    "Education": {"justification": string, "recommendation": string},
    "Experience": {"justification": string, "recommendation": string},
    "Skills": {
      "justification": string, 
      "recommendation": string,
      "hardSkills": [string],
      "hardSkillsRatings": {skillName: number},
      "softSkills": [string],
      "softSkillsRatings": {skillName: number}
    },
    "Safety Training": {"justification": string, "recommendation": string},
    "Certifications": {
      "justification": string, 
      "recommendation": string,
      "requiredCertifications": [string]
    },
    "Technical Tools": {
      "justification": string, 
      "recommendation": string,
      "requiredTools": [string],
      "toolRatings": {toolName: number}
    }
  },
  "overallAssessment": string,
  "riskLevel": string,
  "recommendedQualifications": {
    "essential": [string],
    "preferred": [string], 
    "niceToHave": [string]
  }
}

Position Details:
- Position Title: ${positionData.positionName}
- Position Level: ${positionData.positionLevel}
- Industry: Mining

Rating Scale (1-10):
- 1-2: Basic/Beginner level - Minimal proficiency required
- 3-4: Novice level - Some knowledge or training needed
- 5-6: Intermediate level - Solid understanding and practical experience
- 7-8: Advanced level - High proficiency and expertise required
- 9-10: Expert level - Mastery and specialized knowledge essential

For Skills category, provide:
- hardSkills: List of specific technical/hard skills required (e.g., "Operasi Alat Berat", "Welding", "AutoCAD")
- hardSkillsRatings: Object with each hard skill as key and rating (1-10) as value
- softSkills: List of interpersonal/soft skills needed (e.g., "Kepemimpinan", "Komunikasi", "Manajemen Waktu")
- softSkillsRatings: Object with each soft skill as key and rating (1-10) as value

For Technical Tools category, provide:
- requiredTools: List of specific software/tools/equipment (e.g., "Surpac", "AutoCAD", "SCADA System")
- toolRatings: Object with each tool as key and required proficiency rating (1-10) as value

For Certifications category, provide:
- requiredCertifications: List of specific certificates needed (e.g., "MSHA Certificate", "SIO Alat Berat", "Welding Certificate")

Please provide detailed ratings for each individual skill and tool specific to mining industry requirements, with justifications and recommendations in Indonesian. Consider mining safety standards, industry regulations, and typical career progression paths. Use "Rendah", "Sedang", or "Tinggi" for riskLevel.`;

      const response = await callGeminiAPI(prompt);
      
      try {
        // Extract JSON from response if it contains extra text
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : response;
        const parsed = JSON.parse(jsonString);
        parsed.isMockData = false;
        return parsed;
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        throw new Error('Invalid response format from API');
      }
    });

    return result;

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    
    // Check if it's a connection error or API limit
    const isConnectionError = error.message?.includes('fetch') || 
                             error.message?.includes('network') ||
                             error.message?.includes('ECONNREFUSED') ||
                             error.message?.includes('Failed to fetch') ||
                             error.status === 429;
    
    if (isConnectionError) {
      console.log('Gemini API unavailable, falling back to mock data');
      
      // Return mock data with a delay to simulate processing
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.MOCK_DATA_DELAY));
      return generateMockAssessment(positionData);
    }
    
    // For other errors, also fall back to mock data
    console.log('API error, falling back to mock data');
    await new Promise(resolve => setTimeout(resolve, API_CONFIG.MOCK_DATA_DELAY));
    return generateMockAssessment(positionData);
  }
};

export const getQualificationInsights = async (positionData) => {
  try {
    // Apply rate limiting
    await rateLimit();
    
    // Try real API with retry logic
    const result = await retryWithBackoff(async () => {
      const prompt = `You are a mining industry market analyst. Return ONLY valid JSON without any additional text. All text content must be in Indonesian language.

{
  "marketAnalysis": string,
  "salaryRange": string,
  "recruitmentStrategy": string,
  "hiringChallenges": string,
  "alternativeQualifications": [string],
  "industryTrends": string
}

Position: ${positionData.positionName}
Level: ${positionData.positionLevel}
Industry: Mining

Provide comprehensive mining industry insights in Indonesian including current market conditions, competitive salary ranges, effective recruitment approaches, common hiring challenges, alternative qualification paths, and relevant industry trends affecting this position.`;

      const response = await callGeminiAPI(prompt);
      
      try {
        // Extract JSON from response if it contains extra text
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : response;
        const parsed = JSON.parse(jsonString);
        parsed.isMockData = false;
        return parsed;
      } catch (parseError) {
        console.error('Failed to parse insights JSON:', parseError);
        throw new Error('Invalid response format from API');
      }
    });

    return result;

  } catch (error) {
    console.error('Error getting insights:', error);
    
    // Check if it's a connection error or API limit
    const isConnectionError = error.message?.includes('fetch') || 
                             error.message?.includes('network') ||
                             error.message?.includes('ECONNREFUSED') ||
                             error.message?.includes('Failed to fetch') ||
                             error.status === 429;
    
    if (isConnectionError) {
      console.log('Gemini API unavailable, falling back to mock insights');
      
      // Return mock data with a delay to simulate processing
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.MOCK_DATA_DELAY));
      return generateMockInsights(positionData);
    }
    
    // For other errors, also fall back to mock data
    console.log('API error, falling back to mock insights');
    await new Promise(resolve => setTimeout(resolve, API_CONFIG.MOCK_DATA_DELAY));
    return generateMockInsights(positionData);
  }
};
