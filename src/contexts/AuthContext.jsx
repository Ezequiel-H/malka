import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

axios.defaults.baseURL = API_URL;

const normalizePhone = (v) => String(v ?? '').replace(/\s/g, '').trim();

const formatAuthError = (error, fallback) => {
  const d = error?.response?.data;
  if (!d) return fallback;
  if (typeof d.message === 'string' && d.message.trim()) return d.message.trim();
  if (Array.isArray(d.errors)) {
    const parts = d.errors.map((e) => e?.msg || e?.message).filter(Boolean);
    if (parts.length) return parts.join(' ');
  }
  const raw = error?.response?.data && JSON.stringify(error.response.data);
  if (raw && /duplicate key|E11000/i.test(raw)) {
    return 'Ya existe una cuenta con ese email, teléfono o DNI.';
  }
  return fallback;
};

const clearSession = () => {
  localStorage.removeItem('token');
  delete axios.defaults.headers.common['Authorization'];
};

// Add request interceptor to include token from localStorage on every request
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 errors globally
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear it and redirect to login
      clearSession();
      // Only redirect if we're not already on login/register page
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get('/auth/me');
      const updatedUser = response.data.user;
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Error fetching user:', error);
      clearSession();
      return null;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post('/auth/login', { email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        message: formatAuthError(error, 'Error al iniciar sesión')
      };
    }
  };

  const register = async (userData) => {
    const dniNorm = String(userData.dni ?? '')
      .replace(/ /g, '')
      .trim();
    const telefonoNorm = normalizePhone(userData.telefono);
    const tags = Array.isArray(userData.tags) ? userData.tags : [];

    const registerPayload = {
      ...userData,
      dni: dniNorm,
      telefono: telefonoNorm,
      tags
    };

    const profilePayload = {
      email: registerPayload.email,
      nombre: registerPayload.nombre,
      apellido: registerPayload.apellido,
      dni: dniNorm,
      telefono: telefonoNorm,
      restriccionesAlimentarias: registerPayload.restriccionesAlimentarias,
      comoSeEntero: registerPayload.comoSeEntero,
      tags
    };

    try {
      const response = await axios.post('/auth/register', registerPayload);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);

      const syncOnboardingProfile = async () => {
        const clientError = (status) =>
          status === 400 || status === 409 || status === 422;

        try {
          const r = await axios.post('/users/onboarding', profilePayload);
          return { ok: true, user: r.data?.user ?? null };
        } catch (first) {
          const st = first.response?.status;
          if (clientError(st)) {
            return { ok: false, error: first };
          }
          if (st !== 404) {
            console.warn('POST /users/onboarding:', first);
          }
          try {
            const r = await axios.patch('/users/me', profilePayload);
            return { ok: true, user: r.data?.user ?? null };
          } catch (second) {
            const st2 = second.response?.status;
            if (clientError(st2)) {
              return { ok: false, error: second };
            }
            if (st2 === 404) {
              return { ok: true, user: null };
            }
            console.error('No se pudo guardar el perfil de onboarding:', first, second);
            return { ok: true, user: null };
          }
        }
      };

      const synced = await syncOnboardingProfile();
      if (!synced.ok) {
        clearSession();
        setUser(null);
        return {
          success: false,
          message: formatAuthError(
            synced.error,
            'No se pudo completar el registro. El email, teléfono o DNI podrían estar en uso.'
          )
        };
      }

      if (synced.user) {
        setUser(synced.user);
      } else {
        await fetchUser();
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: formatAuthError(error, 'Error al registrar usuario')
      };
    }
  };

  const logout = () => {
    clearSession();
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }));
  };

  /** Actualiza solo los tags públicos del usuario actual (participante). */
  const updateMyTags = async (tags) => {
    try {
      const response = await axios.patch('/users/me', { tags });
      const next = response.data.user;
      if (next) {
        setUser(next);
      } else {
        setUser(prev => (prev ? { ...prev, tags } : prev));
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al actualizar tus intereses'
      };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    fetchUser,
    updateMyTags
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

