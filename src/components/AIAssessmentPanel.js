import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  LinearProgress,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon
} from '@mui/icons-material';

const AIAssessmentPanel = ({ positionData, assessmentData, insightsData, isLoading, onGetAssessment, onGetInsights }) => {
  const [expanded, setExpanded] = useState(false);

  const getRatingColor = (rating) => {
    if (rating >= 8) return 'success';
    if (rating >= 6) return 'warning';
    return 'error';
  };

  const getRiskColor = (riskLevel) => {
    const level = (riskLevel || '').toString().toLowerCase();
    if (level.includes('rendah') || level === 'low') return 'success';
    if (level.includes('sedang') || level === 'medium') return 'warning';
    if (level.includes('tinggi') || level === 'high') return 'error';
    return 'info';
  };

  const renderRiskLegend = () => (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
      <Chip label="Rendah: Persyaratan standar, mudah diisi" color="success" size="small" />
      <Chip label="Sedang: Memerlukan seleksi yang teliti" color="warning" size="small" />
      <Chip label="Tinggi: Persyaratan sangat ketat" color="error" size="small" />
    </Box>
  );

  const renderAssessmentCard = (category, data) => (
    <Card key={category} sx={{ mb: 2, border: '1px solid', borderColor: 'divider' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h3">
            {category}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Chip
              label={`${data.rating}/10`}
              color={getRatingColor(data.rating)}
              size="small"
              sx={{ fontWeight: 'bold' }}
            />
          </Box>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <LinearProgress
            variant="determinate"
            value={Math.max(0, Math.min(100, (Number(data.rating) || 0) * 10))}
            sx={{ height: 10, borderRadius: 5, backgroundColor: 'action.hover',
              '& .MuiLinearProgress-bar': {
                backgroundColor: getRatingColor(data.rating) === 'success' ? 'success.main' : getRatingColor(data.rating) === 'warning' ? 'warning.main' : 'error.main'
              }
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">Rendah</Typography>
            <Typography variant="caption" color="text.secondary">Tinggi</Typography>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          <strong>Alasan:</strong> {data.justification}
        </Typography>
        
        <Typography variant="body2" color="primary" sx={{ fontStyle: 'italic', mb: 1 }}>
          <strong>Rekomendasi:</strong> {data.recommendation}
        </Typography>

        {/* Skills - Hard Skills and Soft Skills */}
        {category === 'Skills' && (data.hardSkills || data.softSkills) && (
          <Box sx={{ mt: 2 }}>
            {data.hardSkills && data.hardSkills.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Hard Skills:</strong>
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {data.hardSkills.map((skill, index) => (
                    <Chip
                      key={index}
                      label={`• ${skill}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontSize: '0.75rem' }}
                    />
                  ))}
                </Box>
              </Box>
            )}
            {data.softSkills && data.softSkills.length > 0 && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Soft Skills:</strong>
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {data.softSkills.map((skill, index) => (
                    <Chip
                      key={index}
                      label={`• ${skill}`}
                      size="small"
                      color="secondary"
                      variant="outlined"
                      sx={{ fontSize: '0.75rem' }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* Certifications */}
        {category === 'Certifications' && data.requiredCertifications && data.requiredCertifications.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>Sertifikasi yang Diperlukan:</strong>
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {data.requiredCertifications.map((cert, index) => (
                <Chip
                  key={index}
                  label={`• ${cert}`}
                  size="small"
                  color="warning"
                  variant="outlined"
                  sx={{ fontSize: '0.75rem' }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Technical Tools */}
        {category === 'Technical Tools' && data.requiredTools && data.requiredTools.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>Tools yang Harus Dikuasai:</strong>
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {data.requiredTools.map((tool, index) => (
                <Chip
                  key={index}
                  label={`• ${tool}`}
                  size="small"
                  color="info"
                  variant="outlined"
                  sx={{ fontSize: '0.75rem' }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Fallback for other categories with requiredQualifications */}
        {!['Skills', 'Certifications', 'Technical Tools'].includes(category) && data.requiredQualifications && data.requiredQualifications.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>Kualifikasi yang Diperlukan:</strong>
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {data.requiredQualifications.map((qual, index) => (
                <Chip
                  key={index}
                  label={qual}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ fontSize: '0.75rem' }}
                />
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <PsychologyIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h5" component="h2" color="primary">
          Penilaian Posisi Tambang Bertenaga AI
        </Typography>
      </Box>

      {!assessmentData && !isLoading && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <InfoIcon sx={{ mr: 1 }} />
          Dapatkan penilaian bertenaga AI untuk kualifikasi posisi tambang Anda guna memastikan persyaratan yang optimal.
        </Alert>
      )}

      {isLoading && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <CircularProgress size={20} sx={{ mr: 2 }} />
          <Typography>Menganalisis persyaratan posisi tambang...</Typography>
        </Box>
      )}

      {assessmentData && (
        <>
          {/* Mock Data Notification */}
          {assessmentData.isMockData && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Offline Mode:</strong> Using offline assessment data due to API limitations. 
                Results remain accurate based on mining industry standards.
              </Typography>
            </Alert>
          )}
          
          {/* Overall Assessment */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Overall Assessment
            </Typography>
            <Alert 
              severity={getRiskColor(assessmentData.riskLevel)} 
              icon={assessmentData.riskLevel?.toLowerCase() === 'high' ? <WarningIcon /> : <CheckCircleIcon />}
              sx={{ mb: 2 }}
            >
              <Typography variant="body2">
                <strong>Risk Level:</strong> {assessmentData.riskLevel}
              </Typography>
            </Alert>
            {renderRiskLegend()}
            <Typography variant="body1" color="text.secondary">
              {assessmentData.overallAssessment}
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Overall Qualification Recommendations */}
          {assessmentData.recommendedQualifications && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Overall Qualification Recommendations
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Card sx={{ border: '2px solid', borderColor: 'error.main' }}>
                    <CardContent>
                      <Typography variant="subtitle1" color="error" gutterBottom>
                        <strong>Essential</strong>
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {assessmentData.recommendedQualifications.essential?.map((qual, index) => (
                          <Chip
                            key={index}
                            label={qual}
                            size="small"
                            color="error"
                            variant="filled"
                            sx={{ fontSize: '0.75rem' }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card sx={{ border: '2px solid', borderColor: 'warning.main' }}>
                    <CardContent>
                      <Typography variant="subtitle1" color="warning.main" gutterBottom>
                        <strong>Preferred</strong>
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {assessmentData.recommendedQualifications.preferred?.map((qual, index) => (
                          <Chip
                            key={index}
                            label={qual}
                            size="small"
                            color="warning"
                            variant="filled"
                            sx={{ fontSize: '0.75rem' }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card sx={{ border: '2px solid', borderColor: 'success.main' }}>
                    <CardContent>
                      <Typography variant="subtitle1" color="success.main" gutterBottom>
                        <strong>Nice to Have</strong>
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {assessmentData.recommendedQualifications.niceToHave?.map((qual, index) => (
                          <Chip
                            key={index}
                            label={qual}
                            size="small"
                            color="success"
                            variant="filled"
                            sx={{ fontSize: '0.75rem' }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          {/* Rating Scale Explanation */}
          <Box sx={{ mb: 3 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                <strong>Panduan Skala Penilaian (1-10):</strong>
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography variant="body2">• <strong>1-3:</strong> Persyaratan minimal (level pemula, kualifikasi dasar sudah cukup)</Typography>
                <Typography variant="body2">• <strong>4-6:</strong> Persyaratan sedang (kualifikasi standar diharapkan)</Typography>
                <Typography variant="body2">• <strong>7-8:</strong> Persyaratan tinggi (kualifikasi lanjutan lebih disukai)</Typography>
                <Typography variant="body2">• <strong>9-10:</strong> Persyaratan kritis (kualifikasi spesialis/ahli sangat penting)</Typography>
              </Box>
            </Alert>
          </Box>

          {/* Category Assessments */}
          <Typography variant="h6" gutterBottom>
            Penilaian Kategori Kualifikasi
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(assessmentData.assessments || {}).map(([category, data]) => (
              <Grid item xs={12} md={6} key={category}>
                {renderAssessmentCard(category, data)}
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, mt: 3, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<AssessmentIcon />}
          onClick={onGetAssessment}
          disabled={isLoading || !positionData.positionName || !positionData.positionLevel}
        >
          {assessmentData ? 'Re-assess Position' : 'Get AI Assessment'}
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<TrendingUpIcon />}
          onClick={onGetInsights}
          disabled={isLoading || !positionData.positionName}
        >
          Get Market Insights
        </Button>
      </Box>

      {/* Market Insights */}
      {insightsData && (
        <>
          {/* Mock Data Notification for Insights */}
          {insightsData.isMockData && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Offline Mode:</strong> Using offline insights data due to API limitations. 
                Information remains relevant based on mining industry trends.
              </Typography>
            </Alert>
          )}
          
          <Accordion 
            expanded={expanded} 
            onChange={() => setExpanded(!expanded)}
            sx={{ mt: 3 }}
          >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <TrendingUpIcon sx={{ mr: 1 }} />
              Mining Market Insights & Recommendations
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom color="primary">
                  Market Analysis
                </Typography>
                <Typography variant="body2" paragraph>
                  {insightsData.marketAnalysis}
                </Typography>
                
                <Typography variant="subtitle1" gutterBottom color="primary">
                  Salary Range
                </Typography>
                <Typography variant="body2" paragraph>
                  {insightsData.salaryRange}
                </Typography>
                
                <Typography variant="subtitle1" gutterBottom color="primary">
                  Recruitment Strategy
                </Typography>
                <Typography variant="body2" paragraph>
                  {insightsData.recruitmentStrategy}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom color="primary">
                  Mining Industry Challenges
                </Typography>
                <Typography variant="body2" paragraph>
                  {insightsData.hiringChallenges}
                </Typography>
                
                <Typography variant="subtitle1" gutterBottom color="primary">
                  Industry Trends
                </Typography>
                <Typography variant="body2" paragraph>
                  {insightsData.industryTrends}
                </Typography>
                
                <Typography variant="subtitle1" gutterBottom color="primary">
                  Alternative Qualifications
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {insightsData.alternativeQualifications?.map((qual, index) => (
                    <Chip key={index} label={qual} size="small" variant="outlined" />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
        </>
      )}
    </Paper>
  );
};

export default AIAssessmentPanel;
