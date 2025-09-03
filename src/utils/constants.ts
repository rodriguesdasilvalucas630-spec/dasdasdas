// Application Constants
export const APP_CONFIG = {
  name: 'Vote Scout Pro',
  description: 'Sistema Profissional de Pesquisas Eleitorais',
  version: '1.0.0',
  author: 'Vote Scout Pro Team'
};

// API Configuration
export const API_CONFIG = {
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000 // 1 second
};

// GPS Configuration
export const GPS_CONFIG = {
  enableHighAccuracy: true,
  timeout: 15000, // 15 seconds
  maximumAge: 300000, // 5 minutes
  requiredAccuracy: 100 // meters
};

// Interview Configuration
export const INTERVIEW_CONFIG = {
  minDuration: 5, // minutes
  maxDuration: 60, // minutes
  autoSaveInterval: 30000, // 30 seconds
  offlineStorageLimit: 100 // max interviews stored offline
};

// Notification Configuration
export const NOTIFICATION_CONFIG = {
  defaultDuration: 5000, // 5 seconds
  maxNotifications: 5,
  priorities: {
    low: 3,
    medium: 2,
    high: 1
  }
};

// Research Configuration
export const RESEARCH_CONFIG = {
  defaultMarginError: 3,
  defaultConfidenceLevel: 95,
  defaultExpectedProportion: 50,
  maxRegions: 20,
  maxQuestionsPerResearch: 50
};

// Map Configuration
export const MAP_CONFIG = {
  defaultCenter: {
    lat: -23.550520,
    lng: -46.633309
  },
  defaultZoom: 11,
  maxZoom: 18,
  minZoom: 8
};

// File Upload Configuration
export const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  maxFiles: 5
};

// Validation Rules
export const VALIDATION_RULES = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
  cpf: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false
  }
};

// Error Messages
export const ERROR_MESSAGES = {
  network: 'Erro de conexão. Verifique sua internet.',
  unauthorized: 'Acesso não autorizado.',
  forbidden: 'Você não tem permissão para esta ação.',
  notFound: 'Recurso não encontrado.',
  validation: 'Dados inválidos fornecidos.',
  server: 'Erro interno do servidor.',
  timeout: 'Operação expirou. Tente novamente.',
  offline: 'Você está offline. Dados serão sincronizados quando voltar online.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  login: 'Login realizado com sucesso!',
  logout: 'Logout realizado com sucesso!',
  save: 'Dados salvos com sucesso!',
  delete: 'Item removido com sucesso!',
  update: 'Dados atualizados com sucesso!',
  sync: 'Sincronização concluída!',
  interview: 'Entrevista enviada com sucesso!'
};