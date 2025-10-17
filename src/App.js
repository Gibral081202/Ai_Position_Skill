import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import { Assessment } from '@mui/icons-material';
import ExcelLikeTable from './components/ExcelLikeTable';
import './excel-theme.css';

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
        <ExcelLikeTable />
      </Box>
    </ThemeProvider>
  );
}

export default App;
