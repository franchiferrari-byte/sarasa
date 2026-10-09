// ============================================================
//  LUCAS FRANCHI INMOBILIARIA — Configuración PÚBLICA
//  Este archivo se publica junto con el sitio: SOLO van datos públicos.
//  NUNCA pongas acá la clave service_role / secret ni contraseñas.
// ============================================================

const CONFIG = {

  // SUPABASE — Settings → API
  // La clave anon/publishable es pública por diseño: la protegen las reglas RLS
  SUPABASE_URL: 'https://tvlvubhglniddcrhdujz.supabase.co',
  SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2bHZ1YmhnbG5pZGRjcmhkdWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MzEwNjEsImV4cCI6MjA5MTAwNzA2MX0.o6z8J8ziK2rPKPFggZ-xPYwsh5rNUtmaUn_c9jIsKMk',

  // CLOUDINARY — Dashboard (nombre de la nube y preset sin firmar: públicos por diseño)
  CLOUDINARY_CLOUD: 'dbduyd6ke',
  CLOUDINARY_PRESET: 'lucasfranchi_fotos',

  // CONTACTO
  WHATSAPP: '5492612096351',
  INSTAGRAM: 'https://www.instagram.com/lucasfranchiccpim/',
  FACEBOOK: 'https://www.facebook.com/lucasfranchiccpim',
  EMAIL: 'lucas@lucasfranchi.com.ar',
};

// Escapa texto para insertarlo de forma segura dentro de HTML (evita XSS)
function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
