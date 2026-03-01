// src/pages/auth/Login.tsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSession } from '../../context/AuthContext';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, Lock } from '@mui/icons-material';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, setPassword, needsPasswordSetup, isLoading, error: sessionError } = useSession();

  const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
  const redirectTarget = fromPath && fromPath !== '/login' ? fromPath : '/';

  // Setup Form State
  const [setupPassword, setSetupPassword] = useState('');
  const [setupPasswordConfirm, setSetupPasswordConfirm] = useState('');
  const [setupShowPassword, setSetupShowPassword] = useState(false);
  
  // Login Form State
  const [loginPassword, setLoginPassword] = useState('');
  const [loginShowPassword, setLoginShowPassword] = useState(false);
  
  // UI State
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Setup Flow: Setze initiales Passwort
   */
  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const trimmedPassword = setupPassword.trim();
      const trimmedConfirm = setupPasswordConfirm.trim();

      if (!trimmedPassword || !trimmedConfirm) {
        throw new Error('Both password fields required');
      }

      if (trimmedPassword.length < 8 || trimmedPassword.length > 16) {
        throw new Error('Password must be between 8 and 16 characters');
      }

      if (!/[A-Z]/.test(trimmedPassword)) {
        throw new Error('Password must contain uppercase letters');
      }

      if (!/[a-z]/.test(trimmedPassword)) {
        throw new Error('Password must contain lowercase letters');
      }

      if (!/[0-9]/.test(trimmedPassword)) {
        throw new Error('Password must contain numbers');
      }

      if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(trimmedPassword)) {
        throw new Error('Password must contain special characters');
      }

      await setPassword(trimmedPassword, trimmedConfirm);
      navigate(redirectTarget, { replace: true });
    } catch (err: any) {
      setError(err.message || t('auth.setupError', 'Failed to set password'));
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Login Flow: Mit Passwort anmelden
   */
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (!loginPassword) {
        throw new Error('Password required');
      }

      await login(loginPassword);
      navigate(redirectTarget, { replace: true });
    } catch (err: any) {
      setError(err.message || t('auth.loginError', 'Login failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = error || sessionError;

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={6}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              backgroundColor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 2,
            }}
          >
            <Lock sx={{ fontSize: 40, color: 'white' }} />
          </Box>

          <Typography component="h1" variant="h4" gutterBottom>
            A.R.I.
          </Typography>

          {displayError && (
            <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
              {displayError}
            </Alert>
          )}

          {needsPasswordSetup ? (
            // SETUP FLOW: Set initial password
            <>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                Set your password
              </Typography>

              <Box component="form" onSubmit={handleSetupSubmit} sx={{ mt: 3, width: '100%' }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type={setupShowPassword ? 'text' : 'password'}
                  id="setup-password"
                  autoFocus
                  value={setupPassword}
                  onChange={(e) => setSetupPassword(e.target.value)}
                  disabled={isSubmitting || isLoading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setSetupShowPassword(!setupShowPassword)}
                          edge="end"
                        >
                          {setupShowPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="passwordConfirm"
                  label="Confirm Password"
                  type={setupShowPassword ? 'text' : 'password'}
                  id="setup-password-confirm"
                  value={setupPasswordConfirm}
                  onChange={(e) => setSetupPasswordConfirm(e.target.value)}
                  disabled={isSubmitting || isLoading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock />
                      </InputAdornment>
                    ),
                  }}
                />

                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                  Requirements:
                  <br />• Between 8 and 16 characters
                  <br />• Uppercase letters
                  <br />• Lowercase letters
                  <br />• Numbers
                  <br />• Special characters (!@#$%^&*...)
                </Typography>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2, height: 48 }}
                  disabled={isSubmitting || isLoading || !setupPassword || !setupPasswordConfirm}
                >
                  {isSubmitting || isLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Set Password'
                  )}
                </Button>
              </Box>
            </>
          ) : (
            // LOGIN FLOW: Normal login
            <>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                Enter your password
              </Typography>

              <Box component="form" onSubmit={handleLoginSubmit} sx={{ mt: 3, width: '100%' }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type={loginShowPassword ? 'text' : 'password'}
                  id="login-password"
                  autoFocus
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  disabled={isSubmitting || isLoading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setLoginShowPassword(!loginShowPassword)}
                          edge="end"
                        >
                          {loginShowPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2, height: 48 }}
                  disabled={isSubmitting || isLoading || !loginPassword}
                >
                  {isSubmitting || isLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Login'
                  )}
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
