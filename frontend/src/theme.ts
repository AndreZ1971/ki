// theme.ts - MUI Theme Configuration für ARI
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3b82f6', // --color-info
      light: '#60a5fa',
      dark: '#2563eb',
    },
    secondary: {
      main: '#8b5cf6', // --color-purple
      light: '#a78bfa',
      dark: '#7c3aed',
    },
    success: {
      main: '#10b981', // --color-success
    },
    warning: {
      main: '#f59e0b', // --color-warning
    },
    error: {
      main: '#ef4444', // --color-error
    },
    background: {
      default: 'transparent', // Nutzt gradient aus CSS
      paper: 'rgba(255, 255, 255, 0.1)', // --glass-bg-primary
    },
    text: {
      primary: 'rgba(255, 255, 255, 0.95)', // --text-primary
      secondary: 'rgba(255, 255, 255, 0.85)', // --text-secondary
    },
  },
  typography: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif",
    h1: {
      fontSize: '2.25rem',
      fontWeight: 700,
      color: 'rgba(255, 255, 255, 0.95)',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 700,
      color: 'rgba(255, 255, 255, 0.95)',
    },
    body2: {
      color: 'rgba(255, 255, 255, 0.85)',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.3)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#3b82f6',
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        contained: {
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          '&:hover': {
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          backdropFilter: 'blur(10px)',
        },
      },
    },
  },
});

export default theme;
