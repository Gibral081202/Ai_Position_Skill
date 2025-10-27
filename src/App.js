import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import { Assessment } from '@mui/icons-material';
import './excel-theme.css';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3 }}>
          <Typography variant="h4" color="error" gutterBottom>
            ⚠️ Something went wrong
          </Typography>
          <Typography variant="body1" gutterBottom>
            The application encountered an error. Please check the console for details.
          </Typography>
          <details style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f5f5f5', padding: '10px', marginTop: '10px' }}>
            <summary>Error Details</summary>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo.componentStack}
          </details>
        </Box>
      );
    }

    return this.props.children;
  }
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f8f9fa',
    },
  },
  typography: {
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
    h4: {
      fontWeight: 600,
    },
  },
});

// Lazy load the ExcelLikeTable component
const ExcelLikeTable = React.lazy(() => import('./components/ExcelLikeTable'));

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      {/* Navigation Bar */}
      <AppBar position="static" elevation={2}>
        <Toolbar>
          <Assessment sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            HRAI - Mining Industry HR Position Assessment System
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ minHeight: 'calc(100vh - 64px)' }}>
        <ErrorBoundary>
          <React.Suspense fallback={
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
              <Typography variant="h6">Loading application...</Typography>
            </Box>
          }>
            <ExcelLikeTable />
          </React.Suspense>
        </ErrorBoundary>
      </Box>
    </ThemeProvider>
  );
}

export default App;
