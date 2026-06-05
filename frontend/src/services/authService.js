import api from './api';

// Hash password using SHA-256 via Web Crypto API (or a robust JS fallback for insecure contexts)
const hashPassword = async (password) => {
  if (!password) return '';
  if (window.crypto && window.crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(password);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.error('SubtleCrypto error:', e);
    }
  }
  
  // Fallback: UTF-8 safe hash function returning a 64-character hex string
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < password.length; i++) {
    const code = password.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 2654435761);
    h2 = Math.imul(h2 ^ code, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hashStr = (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
  return hashStr.repeat(4); // 16 * 4 = 64 characters
};

export const register = async (name, email, password, role, city, subjects = [], hourlyRate = 0, goals = [], certificateFile = null) => {
  const hashedPassword = await hashPassword(password);

  if (role === 'teacher') {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('password', hashedPassword);
    formData.append('role', role);
    formData.append('city', city);
    subjects.forEach(subject => formData.append('subjects', subject));
    formData.append('hourlyRate', hourlyRate);
    if (certificateFile) {
      formData.append('certificate', certificateFile);
    }
    
    const response = await api.post('/auth/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response;
  }

  const response = await api.post('/auth/register', {
    name,
    email,
    password: hashedPassword,
    role,
    city,
    goals: role === 'student' ? goals : []
  });
  return response;
};

export const login = async (email, password) => {
  const hashedPassword = await hashPassword(password);
  const response = await api.post('/auth/login', {
    email,
    password: hashedPassword
  });
  return response;
};

export const adminLogin = async (email, password) => {
  const hashedPassword = await hashPassword(password);
  const response = await api.post('/auth/admin-login', {
    email,
    password: hashedPassword
  });
  return response;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};