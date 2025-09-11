// Ollama API Service - Using Gemma 2:2B model
import { API_CONFIG, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../config/apiConfig';

// API Configuration
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
                               error.message?.includes('Failed to fetch');
      
      if (isConnectionError && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
        console.log(`Ollama connection failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }
};

// Call Ollama API
const callOllamaAPI = async (prompt) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      prompt: prompt,
      stream: false,
      // Request strict JSON output from the model to simplify parsing
      format: 'json',
      options: {
        temperature: 0.7,
        top_p: 0.9,
        num_predict: 2048
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  
  // Ollama returns response with generated text
  if (data && data.response) {
    return data.response;
  }
  
  throw new Error('Invalid response format from Ollama API');
};

// Mock data generators (fallback when API fails)
const generateMockAssessment = (positionData) => {
  const { positionName, positionLevel, industry, qualifications } = positionData;
  
  // Generate ratings based on position level and industry
  const baseRatings = {
    'Level Pemula': { education: 6, experience: 3, skills: 5, certifications: 2, languages: 4, technicalTools: 5 },
    'Junior': { education: 7, experience: 5, skills: 6, certifications: 3, languages: 4, technicalTools: 6 },
    'Level Menengah': { education: 8, experience: 7, skills: 8, certifications: 5, languages: 5, technicalTools: 7 },
    'Senior': { education: 8, experience: 9, skills: 9, certifications: 6, languages: 6, technicalTools: 8 },
    'Lead': { education: 8, experience: 9, skills: 9, certifications: 7, languages: 6, technicalTools: 8 },
    'Manager': { education: 8, experience: 9, skills: 9, certifications: 7, languages: 6, technicalTools: 7 },
    'Direktur': { education: 9, experience: 10, skills: 10, certifications: 8, languages: 7, technicalTools: 8 },
    'Eksekutif': { education: 9, experience: 10, skills: 10, certifications: 9, languages: 8, technicalTools: 8 },
    'C-Level': { education: 10, experience: 10, skills: 10, certifications: 10, languages: 9, technicalTools: 9 }
  };

  const ratings = baseRatings[positionLevel] || baseRatings['Level Menengah'];
  
  // Adjust based on industry
  const industryAdjustments = {
    'Teknologi': { technicalTools: 2, certifications: 1 },
    'Kesehatan': { certifications: 2, education: 1 },
    'Keuangan': { certifications: 1, experience: 1 },
    'Pendidikan': { education: 1, certifications: 1 },
    'Manufaktur': { technicalTools: 1, experience: 1 },
    'Konsultan': { skills: 1, languages: 1 },
    'Pemerintah': { certifications: 1, education: 1 }
  };

  const adjustments = industryAdjustments[industry] || {};
  Object.keys(adjustments).forEach(key => {
    if (ratings[key]) {
      ratings[key] = Math.min(10, Math.max(1, ratings[key] + adjustments[key]));
    }
  });

  // Generate risk level
  const avgRating = Object.values(ratings).reduce((a, b) => a + b, 0) / 6;
  let riskLevel = 'Sedang';
  if (avgRating >= 8) riskLevel = 'Tinggi';
  if (avgRating <= 5) riskLevel = 'Rendah';

  return {
    assessments: {
      Pendidikan: {
        rating: ratings.education,
        justification: `Posisi ${positionLevel} di industri ${industry} biasanya memerlukan kualifikasi pendidikan ${ratings.education >= 8 ? 'tingkat lanjut' : ratings.education >= 6 ? 'standar' : 'dasar'}.`,
        recommendation: ratings.education >= 8 ? "Gelar S2 atau lebih tinggi lebih disukai" : ratings.education >= 6 ? "Gelar S1 diperlukan" : "Ijazah SMA atau setara dapat diterima"
      },
      Pengalaman: {
        rating: ratings.experience,
        justification: `Peran ${positionLevel} memerlukan pengalaman industri ${ratings.experience >= 8 ? 'yang ekstensif' : ratings.experience >= 6 ? 'yang moderat' : 'yang minimal'}.`,
        recommendation: ratings.experience >= 8 ? "8+ tahun pengalaman relevan" : ratings.experience >= 6 ? "3-5 tahun pengalaman" : "0-2 tahun pengalaman dapat diterima"
      },
      Keterampilan: {
        rating: ratings.skills,
        justification: `Posisi ${positionLevel} menuntut keterampilan dan kompetensi ${ratings.skills >= 8 ? 'yang sangat berkembang' : ratings.skills >= 6 ? 'yang berkembang baik' : 'dasar'}.`,
        recommendation: ratings.skills >= 8 ? "Keterampilan lanjut dalam kepemimpinan dan pemikiran strategis" : ratings.skills >= 6 ? "Keterampilan komunikasi dan pemecahan masalah yang kuat" : "Keterampilan profesional dasar diperlukan"
      },
      Sertifikasi: {
        rating: ratings.certifications,
        justification: `Industri ${industry} ${ratings.certifications >= 7 ? 'sangat menghargai' : ratings.certifications >= 5 ? 'menghargai' : 'dapat mempertimbangkan'} sertifikasi profesional.`,
        recommendation: ratings.certifications >= 7 ? "Sertifikasi khusus industri sangat disukai" : ratings.certifications >= 5 ? "Sertifikasi relevan bermanfaat" : "Sertifikasi opsional tetapi dihargai"
      },
      Bahasa: {
        rating: ratings.languages,
        justification: `Sektor ${industry} ${ratings.languages >= 7 ? 'memerlukan' : ratings.languages >= 5 ? 'mendapat manfaat dari' : 'dapat menggunakan'} kemampuan multibahasa.`,
        recommendation: ratings.languages >= 7 ? "Kefasihan dalam beberapa bahasa diperlukan" : ratings.languages >= 5 ? "Kemampuan bilingual lebih disukai" : "Kemahiran bahasa Indonesia diperlukan"
      },
      'Perangkat Lunak/Alat': {
        rating: ratings.technicalTools,
        justification: `Posisi di industri ${industry} ${ratings.technicalTools >= 8 ? 'sangat bergantung pada' : ratings.technicalTools >= 6 ? 'memerlukan kemahiran dalam' : 'dapat menggunakan'} alat dan perangkat lunak teknis.`,
        recommendation: ratings.technicalTools >= 8 ? "Keterampilan teknis lanjut dan kemahiran alat diperlukan" : ratings.technicalTools >= 6 ? "Kemahiran dalam alat standar industri" : "Keterampilan teknis dasar cukup"
      }
    },
    overallAssessment: `Posisi ${positionLevel} di industri ${industry} memerlukan kombinasi kualifikasi yang seimbang dengan penekanan pada persyaratan ${Object.entries(ratings).sort((a, b) => b[1] - a[1])[0][0].toLowerCase()}.`,
    riskLevel: riskLevel,
    isMockData: true // Flag to indicate this is mock data
  };
};

const generateMockInsights = (positionData) => {
  const { positionName, positionLevel, industry, qualifications } = positionData;
  const safeQualifications = Array.isArray(qualifications) ? qualifications : [];
  
  const insights = {
    marketAnalysis: `Pasar untuk posisi ${positionName} di industri ${industry} ${positionLevel === 'Senior' || positionLevel === 'Lead' ? 'sangat kompetitif' : positionLevel === 'Level Pemula' ? 'cukup kompetitif' : 'kompetitif'}. Permintaan ${positionLevel === 'Senior' || positionLevel === 'Lead' ? 'kuat' : 'stabil'} dengan persyaratan kualifikasi ${safeQualifications.length > 8 ? 'tinggi' : safeQualifications.length > 5 ? 'sedang' : 'standar'}.`,
    
    salaryRange: `Posisi ${positionLevel} di industri ${industry} biasanya mendapatkan gaji ${positionLevel === 'Senior' || positionLevel === 'Lead' ? 'Rp 80.000.000-Rp 150.000.000' : positionLevel === 'Level Menengah' ? 'Rp 60.000.000-Rp 100.000.000' : 'Rp 40.000.000-Rp 70.000.000'} per tahun, tergantung pada pengalaman dan kualifikasi.`,
    
    recruitmentStrategy: `Fokus pada ${positionLevel === 'Senior' || positionLevel === 'Lead' ? 'firma pencarian eksekutif dan jaringan profesional' : positionLevel === 'Level Menengah' ? 'papan kerja dan asosiasi profesional' : 'rekrutmen universitas dan platform level pemula'}. Pertimbangkan ${safeQualifications.length > 8 ? 'pendekatan langsung ke kandidat pasif' : 'keterlibatan kandidat aktif'}.`,
    
    hiringChallenges: `Tantangan utama meliputi ${positionLevel === 'Senior' || positionLevel === 'Lead' ? 'menemukan kandidat dengan pengalaman dan keterampilan kepemimpinan yang cukup' : positionLevel === 'Level Menengah' ? 'menyeimbangkan persyaratan pengalaman dengan ekspektasi gaji' : 'menarik kandidat berkualifikasi di pasar yang kompetitif'}. ${qualifications.length > 8 ? 'Persyaratan kualifikasi tinggi dapat membatasi kumpulan kandidat.' : 'Persyaratan standar seharusnya memberikan kumpulan kandidat yang memadai.'}`,
    
    alternativeQualifications: [
      `${positionLevel === 'Senior' ? 'Pengalaman kepemimpinan' : 'Mata kuliah relevan'} sebagai pengganti pendidikan formal`,
      `${industry === 'Teknologi' ? 'Sertifikasi bootcamp' : 'Pelatihan industri'} sebagai alternatif pendidikan tradisional`,
      `${positionLevel === 'Level Pemula' ? 'Pengalaman magang' : 'Portfolio proyek'} untuk mendemonstrasikan keterampilan`,
      `${industry === 'Kesehatan' ? 'Pengalaman klinis' : 'Pengalaman praktis'} sebagai pengganti sertifikasi`
    ],
    
    industryTrends: `Tren saat ini di industri ${industry} meliputi ${industry === 'Teknologi' ? 'peningkatan fokus pada keterampilan AI/ML dan kemampuan kerja jarak jauh' : industry === 'Kesehatan' ? 'penekanan pada pengalaman kesehatan digital dan telemedicine' : industry === 'Keuangan' ? 'permintaan yang meningkat untuk keterampilan fintech dan analisis data' : 'keterampilan transformasi digital dan otomatisasi'}. ${positionLevel === 'Senior' || positionLevel === 'Lead' ? 'Kepemimpinan dalam manajemen perubahan semakin dihargai.' : 'Adaptabilitas terhadap teknologi baru sangat penting.'}`,
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
      const safeQualifications = Array.isArray(positionData.qualifications) ? positionData.qualifications : [];
      const prompt = `Anda adalah konsultan HR ahli. Gunakan Bahasa Indonesia. Kembalikan HANYA JSON valid tanpa teks lain.
{
  "assessments": {
    "Pendidikan": {"rating": number, "justification": string, "recommendation": string},
    "Pengalaman": {"rating": number, "justification": string, "recommendation": string},
    "Keterampilan": {"rating": number, "justification": string, "recommendation": string},
    "Sertifikasi": {"rating": number, "justification": string, "recommendation": string},
    "Bahasa": {"rating": number, "justification": string, "recommendation": string},
    "Perangkat Lunak/Alat": {"rating": number, "justification": string, "recommendation": string}
  },
  "overallAssessment": string,
  "riskLevel": string
}

Detail Posisi:
- Nama Posisi: ${positionData.positionName}
- Level Posisi: ${positionData.positionLevel}
- Industri: ${positionData.industry}
- Kualifikasi yang Dipilih: ${safeQualifications.join(', ')}
`;

      const response = await callOllamaAPI(prompt);
      
      try {
        const parsed = JSON.parse(response);
        parsed.isMockData = false;
        return parsed;
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        throw new Error('Invalid response format from API');
      }
    });

    return result;

  } catch (error) {
    console.error('Error calling Ollama API:', error);
    
    // Check if it's a connection error
    const isConnectionError = error.message?.includes('fetch') || 
                             error.message?.includes('network') ||
                             error.message?.includes('ECONNREFUSED') ||
                             error.message?.includes('Failed to fetch');
    
    if (isConnectionError) {
      console.log('Ollama not running, falling back to mock data');
      
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
      const safeQualifications = Array.isArray(positionData.qualifications) ? positionData.qualifications : [];
      const prompt = `Gunakan Bahasa Indonesia. Kembalikan HANYA JSON valid tanpa teks lain.
{
  "marketAnalysis": string,
  "salaryRange": string,
  "recruitmentStrategy": string,
  "hiringChallenges": string,
  "alternativeQualifications": [string],
  "industryTrends": string
}

Posisi: ${positionData.positionName}
Level: ${positionData.positionLevel}
Industri: ${positionData.industry}
Kualifikasi yang Dipilih: ${safeQualifications.join(', ')}
`;

      const response = await callOllamaAPI(prompt);
      
      try {
        const parsed = JSON.parse(response);
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
    
    // Check if it's a connection error
    const isConnectionError = error.message?.includes('fetch') || 
                             error.message?.includes('network') ||
                             error.message?.includes('ECONNREFUSED') ||
                             error.message?.includes('Failed to fetch');
    
    if (isConnectionError) {
      console.log('Ollama not running, falling back to mock insights');
      
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
