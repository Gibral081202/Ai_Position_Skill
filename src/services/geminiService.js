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
        hardSkills: ['Keselamatan Kerja Dasar', 'Penggunaan APD', 'Prosedur Operasional Standar'],
        softSkills: ['Disiplin', 'Kerjasama Tim', 'Komunikasi Dasar', 'Kepatuhan Terhadap Instruksi']
      },
      'operator': {
        hardSkills: ['Operasi Alat Berat', 'Pemeliharaan Mesin', 'Membaca Blueprint', 'Sistem Hidrolik'],
        softSkills: ['Perhatian Detail', 'Koordinasi Tangan-Mata', 'Kemampuan Konsentrasi', 'Manajemen Waktu']
      },
      'technician': {
        hardSkills: ['Troubleshooting', 'Pemeliharaan Preventif', 'Sistem Elektrik', 'Welding', 'CAD'],
        softSkills: ['Pemecahan Masalah', 'Komunikasi Teknis', 'Kerja Mandiri', 'Analisis']
      },
      'safety': {
        hardSkills: ['Risk Assessment', 'Audit Keselamatan', 'Emergency Response', 'Investigasi Kecelakaan'],
        softSkills: ['Kepemimpinan', 'Komunikasi Persuasif', 'Pengambilan Keputusan', 'Manajemen Krisis']
      },
      'supervisor': {
        hardSkills: ['Manajemen Produksi', 'Perencanaan Shift', 'Budget Management', 'KPI Monitoring'],
        softSkills: ['Kepemimpinan Tim', 'Komunikasi Efektif', 'Negosiasi', 'Manajemen Konflik']
      },
      'engineer': {
        hardSkills: ['Design Engineering', 'Project Management', 'Technical Analysis', 'Process Optimization'],
        softSkills: ['Pemikiran Kritis', 'Inovasi', 'Presentasi', 'Manajemen Stakeholder']
      },
      'geologist': {
        hardSkills: ['Geological Mapping', 'Core Logging', 'Resource Estimation', 'Geostatistics'],
        softSkills: ['Analisis Data', 'Penelitian', 'Reporting', 'Kerja Lapangan']
      },
      'manager': {
        hardSkills: ['Strategic Planning', 'Financial Management', 'Operations Management', 'Regulatory Compliance'],
        softSkills: ['Visi Strategis', 'Pengembangan Tim', 'Negosiasi Tingkat Tinggi', 'Change Management']
      }
    };
    return skillsMap[category] || skillsMap['technician'];
  };

  // Generate certifications based on position category
  const getCertificationsForCategory = (category) => {
    const certsMap = {
      'entry': ['Sertifikat K3 Umum', 'Training Orientasi Tambang'],
      'operator': ['SIO Alat Berat', 'Sertifikat Operator Crane', 'MSHA Training'],
      'technician': ['Sertifikat Teknik Mesin', 'Welding Certificate', 'Electrical Safety'],
      'safety': ['NEBOSH', 'OHSAS 18001 Lead Auditor', 'Emergency Response Team'],
      'supervisor': ['Supervisory Management', 'ISO 45001', 'Mine Rescue Certificate'],
      'engineer': ['Professional Engineer (PE)', 'Project Management Professional (PMP)', 'MSHA Manager Certificate'],
      'geologist': ['Professional Geologist', 'JORC Competent Person', 'GIS Certification'],
      'manager': ['MBA', 'Executive Leadership', 'Mine Manager Certificate']
    };
    return certsMap[category] || certsMap['technician'];
  };

  // Generate technical tools based on position category
  const getToolsForCategory = (category) => {
    const toolsMap = {
      'entry': ['Microsoft Office', 'Sistem Radio Komunikasi', 'Peralatan K3 Dasar'],
      'operator': ['SCADA System', 'GPS Navigation', 'Fleet Management System', 'Diagnostic Tools'],
      'technician': ['AutoCAD', 'CMMS Software', 'Multimeter', 'PLC Programming'],
      'safety': ['Risk Assessment Software', 'Incident Management System', 'Gas Detection Equipment'],
      'supervisor': ['Production Planning Software', 'ERP Systems', 'KPI Dashboard', 'Shift Management Tools'],
      'engineer': ['Surpac', 'Vulcan 3D', 'MineSight', 'MATLAB', 'Primavera P6'],
      'geologist': ['Leapfrog Geo', 'Micromine', 'ArcGIS', 'Geostatistical Software'],
      'manager': ['Business Intelligence Tools', 'Financial Planning Software', 'Strategic Planning Tools']
    };
    return toolsMap[category] || toolsMap['technician'];
  };

  const skills = getSkillsForCategory(titleCategory);
  const certifications = getCertificationsForCategory(titleCategory);
  const tools = getToolsForCategory(titleCategory);

  // Generate risk level
  const avgRating = Object.values(ratings).reduce((a, b) => a + b, 0) / 6;
  let riskLevel = 'Medium';
  if (avgRating >= 8) riskLevel = 'High';
  if (avgRating <= 5) riskLevel = 'Low';

  return {
    assessments: {
      Education: {
        rating: ratings.education,
        justification: `${positionName} positions in mining typically require ${ratings.education >= 8 ? 'advanced' : ratings.education >= 6 ? 'standard' : 'basic'} educational qualifications with focus on mining engineering or related technical fields.`,
        recommendation: ratings.education >= 8 ? "Bachelor's degree in Mining Engineering, Geology, or related field; Master's preferred for senior roles" : ratings.education >= 6 ? "Bachelor's degree in relevant engineering or technical field" : "High school diploma or trade certification adequate"
      },
      Experience: {
        rating: ratings.experience,
        justification: `${positionName} roles require ${ratings.experience >= 8 ? 'extensive' : ratings.experience >= 6 ? 'moderate' : 'minimal'} mining industry experience with knowledge of mining operations and safety protocols.`,
        recommendation: ratings.experience >= 8 ? "10+ years mining experience with 5+ years in leadership" : ratings.experience >= 6 ? "3-7 years relevant mining experience" : "0-2 years experience, entry-level position with training provided"
      },
      Skills: {
        rating: ratings.skills,
        justification: `${positionName} positions demand ${ratings.skills >= 8 ? 'highly developed' : ratings.skills >= 6 ? 'well-developed' : 'basic'} technical and leadership skills specific to mining operations.`,
        recommendation: ratings.skills >= 8 ? "Advanced leadership, strategic planning, and technical problem-solving skills" : ratings.skills >= 6 ? "Strong communication, teamwork, and operational skills" : "Basic technical and safety awareness skills required",
        hardSkills: skills.hardSkills,
        softSkills: skills.softSkills
      },
      'Safety Training': {
        rating: ratings.safetyTraining,
        justification: `Mining industry ${ratings.safetyTraining >= 8 ? 'mandates extensive' : ratings.safetyTraining >= 6 ? 'requires comprehensive' : 'benefits from basic'} safety training and certifications for all personnel.`,
        recommendation: ratings.safetyTraining >= 8 ? "MSHA certification, first aid, confined space, and hazmat training required" : ratings.safetyTraining >= 6 ? "Basic MSHA training and safety certifications required" : "Basic safety orientation and ongoing training provided"
      },
      Certifications: {
        rating: ratings.certifications,
        justification: `Mining operations ${ratings.certifications >= 7 ? 'highly value' : ratings.certifications >= 5 ? 'value' : 'may consider'} professional mining certifications and licenses for this position level.`,
        recommendation: ratings.certifications >= 7 ? "Professional Engineer (PE) license, mining certifications preferred" : ratings.certifications >= 5 ? "Relevant technical certifications beneficial" : "Certifications optional but valued for career growth",
        requiredCertifications: certifications
      },
      'Technical Tools': {
        rating: ratings.technicalTools,
        justification: `Mining positions ${ratings.technicalTools >= 8 ? 'heavily rely on' : ratings.technicalTools >= 6 ? 'require proficiency in' : 'may use'} specialized mining software and equipment.`,
        recommendation: ratings.technicalTools >= 8 ? "Advanced proficiency in mining software (AutoCAD, Surpac, Vulcan), GIS systems" : ratings.technicalTools >= 6 ? "Proficiency in industry-standard mining software and systems" : "Basic computer skills, willingness to learn mining software",
        requiredTools: tools
      }
    },
    overallAssessment: `${positionName} position in mining requires a balanced combination of qualifications with particular emphasis on ${Object.entries(ratings).sort((a, b) => b[1] - a[1])[0][0].toLowerCase()} and mining industry safety standards.`,
    riskLevel: riskLevel,
    recommendedQualifications: {
      essential: [
        ratings.safetyTraining >= 8 ? "MSHA Certification" : "Basic Safety Training",
        ratings.education >= 8 ? "Mining Engineering Degree" : "Technical Education",
        ratings.experience >= 6 ? "Mining Industry Experience" : "Technical Experience"
      ],
      preferred: [
        "Professional Certifications",
        "Mining Software Proficiency", 
        "Leadership Experience"
      ],
      niceToHave: [
        "Multi-site Experience",
        "International Mining Experience",
        "Additional Safety Certifications"
      ]
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

export const assessPositionQualifications = async (positionData) => {
  try {
    // Apply rate limiting
    await rateLimit();
    
    // Try real API with retry logic
    const result = await retryWithBackoff(async () => {
      const prompt = `You are an expert mining industry HR consultant. Return ONLY valid JSON without any additional text. All text content must be in Indonesian language.

{
  "assessments": {
    "Education": {"rating": number, "justification": string, "recommendation": string},
    "Experience": {"rating": number, "justification": string, "recommendation": string},
    "Skills": {
      "rating": number, 
      "justification": string, 
      "recommendation": string,
      "hardSkills": [string],
      "softSkills": [string]
    },
    "Safety Training": {"rating": number, "justification": string, "recommendation": string},
    "Certifications": {
      "rating": number, 
      "justification": string, 
      "recommendation": string,
      "requiredCertifications": [string]
    },
    "Technical Tools": {
      "rating": number, 
      "justification": string, 
      "recommendation": string,
      "requiredTools": [string]
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
- 1-3: Minimal requirements (entry level, basic qualifications sufficient)
- 4-6: Moderate requirements (standard qualifications expected)
- 7-8: High requirements (advanced qualifications preferred)
- 9-10: Critical requirements (specialized/expert qualifications essential)

For Skills category, provide:
- hardSkills: List of specific technical/hard skills required (e.g., "Operasi Alat Berat", "Welding", "AutoCAD")
- softSkills: List of interpersonal/soft skills needed (e.g., "Kepemimpinan", "Komunikasi", "Manajemen Waktu")

For Certifications category, provide:
- requiredCertifications: List of specific certificates needed (e.g., "MSHA Certificate", "SIO Alat Berat", "Welding Certificate")

For Technical Tools category, provide:
- requiredTools: List of specific software/tools/equipment (e.g., "Surpac", "AutoCAD", "SCADA System")

Please provide ratings (1-10) for each qualification category specific to mining industry requirements, with justifications and recommendations in Indonesian. Consider mining safety standards, industry regulations, and typical career progression paths. Use "Rendah", "Sedang", or "Tinggi" for riskLevel.`;

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
