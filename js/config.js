// ============================================================
//  LUCAS FRANCHI INMOBILIARIA — Configuración PÚBLICA
//  Este archivo se publica junto con el sitio: SOLO van datos públicos.
//  NUNCA pongas acá la clave service_role / secret ni contraseñas.
// ============================================================

const CONFIG = {

  // SUPABASE — Settings → API
  // La clave anon/publishable es pública por diseño: la protegen las reglas RLS
  SUPABASE_URL: 'https://tvlvubhglniddcrhdujz.supabase.co',
  SUPABASE_KEY: 'sb_publishable_Xyvw1C334qa5flHK17_qOQ_EjH5Ep6u',

  // CLOUDINARY — Dashboard (nombre de la nube y preset sin firmar: públicos por diseño)
  CLOUDINARY_CLOUD: 'dbduyd6ke',
  CLOUDINARY_PRESET: 'lucasfranchi_fotos',

  // CONTACTO
  WHATSAPP: '5492612096351',
  INSTAGRAM: 'https://www.instagram.com/lucasfranchiccpim/',
  FACEBOOK: 'https://www.facebook.com/lucasfranchiccpim',
  EMAIL: 'info@lucasfranchi.com.ar',
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
