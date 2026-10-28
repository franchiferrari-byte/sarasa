// ============================================================
//  LUCAS FRANCHI — Worker de Cloudflare para vistas previas
//  A los bots (WhatsApp, Facebook, etc.) les devuelve en
//  propiedad.html las meta OG con título, precio, datos y foto.
//  Las personas pasan directo a GitHub Pages.
//
//  Este archivo es una copia del código que corre en Cloudflare:
//  para publicarlo, pegarlo en el editor del Worker y tocar Deploy.
// ============================================================

const SUPABASE_URL = 'https://tvlvubhglniddcrhdujz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Xyvw1C334qa5flHK17_qOQ_EjH5Ep6u';

const SITE     = 'https://www.lucasfranchi.com.ar';
const FALLBACK = 'https://www.lucasfranchi.com.ar/img/logo.jpeg';
const DESC_MAX = 200;

function isBot(ua) {
  if (!ua) return false;
  ua = ua.toLowerCase();
  return (
    ua.includes('whatsapp')  ||
    ua.includes('facebook')  ||
    ua.includes('telegram')  ||
    ua.includes('twitter')   ||
    ua.includes('linkedin')  ||
    ua.includes('discord')   ||
    ua.includes('slack')     ||
    ua.includes('googlebot') ||
    ua.includes('bingbot')   ||
    ua.includes('iframely')  ||
    ua.includes('embedly')
  );
}

function formatPrecio(precio, moneda) {
  if (!precio) return 'Precio a consultar';
  const n = Number(precio).toLocaleString('es-AR');
  return (moneda === 'ARS' ? '$ ' : 'USD ') + n;
}

// Corta en la última palabra completa que entra y agrega "…"
function cortar(texto, max) {
  if (texto.length <= max) return texto;
  const corte = texto.slice(0, max - 1);
  const espacio = corte.lastIndexOf(' ');
  return (espacio > max * 0.6 ? corte.slice(0, espacio) : corte).replace(/[\s,.;:–—-]+$/, '') + '…';
}

// Resumen de la descripción sin el encabezado "LUCAS FRANCHI INMOBILIARIA VENDE:",
// sin la línea que repite el título y sin la firma final
function resumenDescripcion(descripcion, titulo) {
  const normal = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
  const tituloN = normal(titulo || '');
  const lineas = String(descripcion || '').split('\n').map(l => l.trim()).filter(l => {
    if (!l) return false;
    const n = normal(l);
    if (/inmobil\w*.*(vende|alquila)|(vende|alquila).*inmobil\w*/i.test(l) && l.length < 60) return false;
    if (/^lucas franchi/i.test(l) && /mat/i.test(l)) return false;
    if (/^mat\.?\s*(ccpim)?\s*\d+$/i.test(l)) return false;
    if (/^lucas franchi\.?$/i.test(l)) return false;
    if (tituloN && (n === tituloN || n.startsWith(tituloN))) return false;
    return true;
  });
  return lineas.join(' ').replace(/^#+\s*|\s#+\s/g, ' ').replace(/[\p{Extended_Pictographic}\uFE0F•▪]/gu, '').replace(/\s+/g, ' ').trim();
}

// "Venta · Lote / Terreno · Rawson, Godoy Cruz · 383 m² · 3 dorm. · 2 baños. Excelente lote..."
function armarDescripcion(p) {
  const tipo = p.tipo_propiedad || 'Propiedad';
  const lugar = [p.zona, p.ciudad].filter(Boolean).join(', ') || 'Mendoza';
  const sup = p.sup_cubierta || p.sup_total;
  const esVivienda = !/lote|terreno|local|oficina|galp/i.test(tipo);

  const datos = [p.tipo_operacion || 'Venta', tipo, lugar];
  if (sup) datos.push(Number(sup).toLocaleString('es-AR') + ' m²');
  if (esVivienda && p.dormitorios) datos.push(p.dormitorios + ' dorm.');
  if (esVivienda && p.banos) datos.push(p.banos + (p.banos == 1 ? ' baño' : ' baños'));

  const encabezado = datos.join(' · ').replace(/\.?$/, '.');
  const resumen = resumenDescripcion(p.descripcion, p.titulo);
  return cortar(resumen ? encabezado + ' ' + resumen : encabezado, DESC_MAX);
}

function buildHTML(titulo, desc, img, canon) {
  // Escapar caracteres que rompen atributos HTML
  const e = s => String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${e(titulo)}</title>
<meta name="description" content="${e(desc)}">
<meta property="og:type"        content="website">
<meta property="og:url"         content="${e(canon)}">
<meta property="og:title"       content="${e(titulo)}">
<meta property="og:description" content="${e(desc)}">
<meta property="og:image"       content="${e(img)}">
<meta property="og:image:width"  content="1200">
<meta property="og:image:height" content="630">
<meta property="og:site_name"   content="Lucas Franchi Inmobiliaria">
<meta property="og:locale"      content="es_AR">
<meta name="twitter:card"        content="summary_large_image">
<meta name="twitter:title"       content="${e(titulo)}">
<meta name="twitter:description" content="${e(desc)}">
<meta name="twitter:image"       content="${e(img)}">
<meta http-equiv="refresh" content="0;url=${e(canon)}">
</head>
<body></body>
</html>`;
}

export default {
  async fetch(req) {
    const url = new URL(req.url);

    // Solo interceptar /propiedad.html
    if (!url.pathname.endsWith('/propiedad.html')) {
      return fetch(req);
    }

    // Usuarios reales: pasar directo a GitHub Pages
    if (!isBot(req.headers.get('user-agent'))) {
      return fetch(req);
    }

    // --- A partir de acá: es un bot ---
    const slug = url.searchParams.get('slug');
    const id   = url.searchParams.get('id');
    const canon = slug
      ? `${SITE}/propiedad.html?slug=${encodeURIComponent(slug)}`
      : id
        ? `${SITE}/propiedad.html?id=${encodeURIComponent(id)}`
        : `${SITE}/propiedad.html`;

    // Si no hay slug ni id, devolver HTML genérico (nunca pasar a GitHub Pages)
    if (!slug && !id) {
      return new Response(
        buildHTML('Lucas Franchi Inmobiliaria', 'Propiedades en Mendoza', FALLBACK, SITE),
        { headers: { 'content-type': 'text/html; charset=UTF-8' } }
      );
    }

    try {
      const filtro = slug
        ? `slug=eq.${encodeURIComponent(slug)}`
        : `id=eq.${encodeURIComponent(id)}`;
      const campos = 'titulo,descripcion,slug,ciudad,zona,tipo_propiedad,tipo_operacion,precio,moneda,dormitorios,banos,sup_cubierta,sup_total,propiedades_fotos(url,orden,es_principal)';
      const apiURL = `${SUPABASE_URL}/rest/v1/propiedades?${filtro}&select=${campos}&limit=1`;

      // Con las claves nuevas (sb_publishable_...) alcanza con el header apikey
      const r = await fetch(apiURL, {
        headers: { apikey: SUPABASE_KEY }
      });

      let data = null;
      try { data = await r.json(); } catch (e) { data = null; }
      const p = Array.isArray(data) ? data[0] : null;

      if (!p) {
        // No se encontró la propiedad (o falló la consulta): vista genérica, sin cachear
        return new Response(
          buildHTML('Lucas Franchi Inmobiliaria', 'Propiedades en Mendoza', FALLBACK, canon),
          { headers: { 'content-type': 'text/html; charset=UTF-8', 'cache-control': 'no-store' } }
        );
      }

      // Ordenar fotos: principal primero, luego por orden
      const fotos = (p.propiedades_fotos || []).sort((a, b) => {
        if (a.es_principal && !b.es_principal) return -1;
        if (!a.es_principal && b.es_principal) return 1;
        return (a.orden || 0) - (b.orden || 0);
      });

      const rawImg = fotos[0]?.url || FALLBACK;
      // Forzar 1200x630 JPG via Cloudinary — WhatsApp requiere dimensiones exactas
      const img = rawImg.includes('res.cloudinary.com')
        ? rawImg.replace('/image/upload/', '/image/upload/w_1200,h_630,c_fill,f_jpg,q_85/')
        : rawImg;
      // El precio va en el título: es lo primero que se lee en WhatsApp
      const titulo = `${(p.titulo || "").trim()} | ${formatPrecio(p.precio, p.moneda)}`;
      const desc   = armarDescripcion(p);

      return new Response(
        buildHTML(titulo, desc, img, canon),
        {
          headers: {
            'content-type': 'text/html; charset=UTF-8',
            'cache-control': 'public, max-age=3600'
          }
        }
      );

    } catch (err) {
      // Error inesperado: vista genérica, sin cachear
      return new Response(
        buildHTML('Lucas Franchi Inmobiliaria', 'Propiedades en Mendoza', FALLBACK, canon),
        { headers: { 'content-type': 'text/html; charset=UTF-8', 'cache-control': 'no-store' } }
      );
    }
  }
};
