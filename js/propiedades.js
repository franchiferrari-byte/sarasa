// ============================================================
//  LUCAS FRANCHI — Lógica pública de propiedades
// ============================================================

const DB = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

function formatPrecio(precio, moneda) {
  if (!precio) return 'Consultar';
  if (moneda === 'ARS') return '$ ' + Number(precio).toLocaleString('es-AR');
  return 'USD ' + Number(precio).toLocaleString('es-AR');
}

function badgeClass(op) {
  if (!op) return '';
  const o = op.toLowerCase();
  if (o === 'alquiler') return 'alquiler';
  return '';
}

function renderCard(p) {
  const fotos = (p.propiedades_fotos || []).sort((a, b) => {
    if (a.es_principal) return -1;
    if (b.es_principal) return 1;
    return a.orden - b.orden;
  });
  const foto = fotos.length > 0
    ? `<img src="${fotos[0].url}" alt="${p.titulo}" loading="lazy" style="width:100%;height:100%;object-fit:cover;object-position:center;display:block;" />`
    : `<div class="sin-foto">Sin foto</div>`;
  // Usar slug para la URL si existe, sino fallback al id
  const href = p.slug
    ? `propiedad.html?slug=${p.slug}`
    : `propiedad.html?id=${p.id}`;
  return `
    <a class="prop-card" href="${href}">
      <div class="prop-card-img">
        ${foto}
        <span class="prop-badge ${badgeClass(p.tipo_operacion)}">${p.tipo_operacion || 'Venta'}</span>
        <button class="prop-fav" onclick="event.preventDefault()">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" stroke-width="2"/></svg>
        </button>
      </div>
      <div class="prop-card-body">
        <div class="prop-zona">
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" stroke-width="2"/></svg>
          ${p.ciudad || ''} ${p.zona ? '· ' + p.zona : ''}
        </div>
        <div class="prop-titulo">${p.titulo}</div>
        <div class="prop-precio">${formatPrecio(p.precio, p.moneda)}</div>
        <div class="prop-specs">
          ${p.dormitorios ? `<span class="prop-spec"><strong>${p.dormitorios}</strong> dorm.</span>` : ''}
          ${p.banos ? `<span class="prop-spec"><strong>${p.banos}</strong> baños</span>` : ''}
          ${p.sup_cubierta ? `<span class="prop-spec"><strong>${p.sup_cubierta}</strong> m²</span>` : ''}
        </div>
        <div class="prop-ver">Ver detalles →</div>
      </div>
    </a>`;
}

async function cargarDestacadas() {
  const grilla = document.getElementById('grilla-destacadas');
  if (!grilla) return;
  try {
    let { data } = await DB
      .from('propiedades')
      .select('*, propiedades_fotos(url, orden, es_principal)')
      .eq('activa', true).eq('destacada', true)
      .order('created_at', { ascending: false }).limit(6);
    if (!data || data.length === 0) {
      const res = await DB.from('propiedades')
        .select('*, propiedades_fotos(url, orden, es_principal)')
        .eq('activa', true).order('created_at', { ascending: false }).limit(6);
      data = res.data;
    }
    grilla.innerHTML = data && data.length > 0
      ? data.map(renderCard).join('')
      : '<p style="color:var(--gris-texto);padding:40px;text-align:center;grid-column:1/-1;">No hay propiedades cargadas aún.</p>';
  } catch(e) {
    grilla.innerHTML = `<p style="color:#c62828;padding:40px;text-align:center;grid-column:1/-1;">Error: ${e.message}</p>`;
  }
}

async function cargarPropiedades(filtros = {}) {
  const grilla = document.getElementById('grilla-propiedades');
  if (!grilla) return;
  grilla.innerHTML = '<div class="loading"><span>Buscando propiedades...</span></div>';
  try {
    let query = DB.from('propiedades')
      .select('*, propiedades_fotos(url, orden, es_principal)')
      .eq('activa', true).order('created_at', { ascending: false });
    if (filtros.operacion) query = query.ilike('tipo_operacion', '%' + filtros.operacion + '%');
    if (filtros.ciudad) {
      if (filtros.ciudad === 'Mendoza') {
        query = query.or('ciudad.ilike.%Mendoza%,ciudad.ilike.%Capital%');
      } else {
        query = query.ilike('ciudad', '%' + filtros.ciudad + '%');
      }
    }
    if (filtros.precio) query = query.lte('precio', Number(filtros.precio));
    const { data, error } = await query;
    if (error) throw error;

    // Filtrar tipo en JS para manejar alias correctamente
    let resultado = data || [];
    if (filtros.tipo) {
      const t = filtros.tipo.toLowerCase();
      resultado = resultado.filter(p => {
        const pt = (p.tipo_propiedad || '').toLowerCase();
        if (t === 'lote / terreno') return pt.includes('lote') || pt.includes('terreno') || pt.includes('rural');
        if (t === 'local / oficina') return pt.includes('local') || pt.includes('oficina');
        if (t === 'duplex') return pt.includes('duplex') || pt.includes('dúplex');
        return pt.includes(t);
      });
    }
    const contEl = document.getElementById('resultado-count');
    if (contEl) contEl.textContent = resultado.length;
    grilla.innerHTML = resultado.length > 0
      ? resultado.map(renderCard).join('')
      : '<p style="color:var(--gris-texto);padding:40px;text-align:center;grid-column:1/-1;">No se encontraron propiedades.</p>';
  } catch(e) {
    grilla.innerHTML = `<p style="color:#c62828;padding:40px;text-align:center;grid-column:1/-1;">Error: ${e.message}</p>`;
  }
}

async function cargarFicha(identificador) {
  // Busca por slug si se pasó uno, sino por UUID
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');

  let query = DB.from('propiedades')
    .select('*, propiedades_fotos(url, orden, es_principal)');

  if (slug) {
    query = query.eq('slug', slug);
  } else {
    query = query.eq('id', identificador);
  }

  const { data: p, error } = await query.single();

  if (error || !p) {
    document.body.innerHTML = '<p style="text-align:center;padding:60px;color:var(--azul);">Propiedad no encontrada.</p>';
    return;
  }
  const fotos = (p.propiedades_fotos || []).sort((a, b) => {
    if (a.es_principal) return -1;
    if (b.es_principal) return 1;
    return a.orden - b.orden;
  });
  document.title = p.titulo + ' — Lucas Franchi Inmobiliaria';
  document.getElementById('bc-titulo').textContent = p.titulo;
  const mainImg = document.getElementById('foto-principal');
  const thumbsEl = document.getElementById('galeria-thumbs');
  if (fotos.length > 0) {
    mainImg.style.backgroundImage = `url('${fotos[0].url}')`;
    thumbsEl.innerHTML = fotos.map((f, i) => `
      <img src="${f.url}" alt="Foto ${i+1}" class="${i===0?'activa':''}"
        onclick="cambiarFoto('${f.url}', this)" loading="lazy" />`).join('');
  } else {
    document.querySelector('.galeria-principal').innerHTML =
      '<div style="height:100%;display:flex;align-items:center;justify-content:center;color:var(--gris-texto);">Sin fotos disponibles</div>';
  }
  document.getElementById('ficha-titulo').textContent = p.titulo;
  document.getElementById('ficha-zona').innerHTML = `
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" stroke-width="2"/></svg>
    ${[p.zona, p.ciudad, 'Mendoza'].filter(Boolean).join(' · ')}`;
  document.getElementById('ficha-desc').textContent = p.descripcion || '';
  document.getElementById('info-precio').textContent = formatPrecio(p.precio, p.moneda);
  document.getElementById('info-operacion').textContent = p.tipo_operacion || 'Venta';
  const specs = [
    { val: p.dormitorios, label: 'Dormitorios' },
    { val: p.banos, label: 'Baños' },
    { val: p.cocheras, label: 'Cocheras' },
    { val: p.sup_cubierta ? p.sup_cubierta + ' m²' : null, label: 'Sup. cubierta' },
    { val: p.sup_total ? p.sup_total + ' m²' : null, label: 'Sup. total' },
    { val: p.antiguedad ? p.antiguedad + ' años' : null, label: 'Antigüedad' },
  ].filter(s => s.val);
  document.getElementById('ficha-specs').innerHTML = specs.map(s =>
    `<div class="ficha-spec"><strong>${s.val}</strong><span>${s.label}</span></div>`).join('');
  document.getElementById('info-detalles').innerHTML = [
    p.tipo_propiedad ? `<div class="detalle-item"><p>Tipo</p><strong>${p.tipo_propiedad}</strong></div>` : '',
    p.sup_cubierta   ? `<div class="detalle-item"><p>Sup. cubierta</p><strong>${p.sup_cubierta} m²</strong></div>` : '',
    p.sup_total      ? `<div class="detalle-item"><p>Sup. total</p><strong>${p.sup_total} m²</strong></div>` : '',
    p.antiguedad     ? `<div class="detalle-item"><p>Antigüedad</p><strong>${p.antiguedad} años</strong></div>` : '',
    p.apta_credito   ? `<div class="detalle-item"><p>Apta crédito</p><strong>Sí</strong></div>` : '',
    p.ciudad         ? `<div class="detalle-item"><p>Ciudad</p><strong>${p.ciudad}</strong></div>` : '',
  ].join('');
  const msg = encodeURIComponent(`Hola Lucas! Me interesa la propiedad: ${p.titulo}`);
  document.getElementById('btn-wsp').href = `https://wa.me/${CONFIG.WHATSAPP}?text=${msg}`;
  document.getElementById('btn-email').href = `mailto:${CONFIG.EMAIL}?subject=Consulta: ${p.titulo}`;
  // QR siempre visible — apunta a la URL de esta publicación
  if (typeof QRCode !== 'undefined') {
    new QRCode(document.getElementById('qr-canvas-compartir'), {
      text: window.location.href,
      width: 160,
      height: 160,
      colorDark: '#0f2244',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
  }
  if (typeof actualizarSEO === 'function') actualizarSEO(p, fotos);
  if (typeof mostrarMapaPropiedad === 'function') mostrarMapaPropiedad(p.lat, p.lng, p.titulo);

  // ── Tracking: GA4 event + visita en Supabase ──────────────────────────────
  // GA4: evento personalizado con nombre y slug de la propiedad
  if (typeof gtag === 'function') {
    gtag('event', 'ver_propiedad', {
      propiedad_titulo: p.titulo,
      propiedad_slug:   p.slug || p.id,
      propiedad_ciudad: p.ciudad || '',
      propiedad_tipo:   p.tipo_operacion || '',
    });
  }
  // Supabase: registrar visita (sin bloquear render, sin mostrar errores al usuario)
  try {
    await DB.from('visitas').insert({
      propiedad_id:    p.id,
      propiedad_titulo: p.titulo,
      propiedad_slug:  p.slug || null,
      ciudad:          p.ciudad || null,
      tipo_operacion:  p.tipo_operacion || null,
      referrer:        document.referrer || null,
      user_agent:      navigator.userAgent || null,
    });
  } catch (_) { /* silencioso */ }
  // ─────────────────────────────────────────────────────────────────────────

  // Tour 360
  const tourWrap = document.getElementById('tour360-wrap');
  if (tourWrap && p.tour_360) {
    document.getElementById('tour360-iframe').src = p.tour_360;
    tourWrap.style.display = 'block';
  }

  return fotos;
}

function cambiarFoto(url, el) {
  document.getElementById('foto-principal').style.backgroundImage = `url('${url}')`;
  document.querySelectorAll('.galeria-thumbs img').forEach(i => {
    i.classList.remove('activa');
    i.style.borderColor = 'transparent';
    i.style.opacity = '0.65';
  });
  el.classList.add('activa');
  el.style.borderColor = 'var(--dorado)';
  el.style.opacity = '1';
}
