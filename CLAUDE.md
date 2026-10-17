# Sitio Lucas Franchi Inmobiliaria

Sitio web de Lucas Franchi, Corredor Inmobiliario (Mat. 1740), Mendoza.
Dominio: https://www.lucasfranchi.com.ar

## Cómo funciona

- Sitio **estático** (HTML + CSS + JS, sin build ni dependencias locales), publicado con **GitHub Pages** desde la rama `main`. El dominio lo define el archivo `CNAME`.
- **Datos:** Supabase (tablas `propiedades`, `propiedades_fotos`, `visitas`). La seguridad depende de las reglas RLS configuradas en Supabase.
- **Fotos:** Cloudinary, con un preset sin firmar.
- **Mapas:** Leaflet + geocodificación con Nominatim (OpenStreetMap).
- **Analytics:** Google Analytics (gtag `G-T5YCECGL58`).

## Estructura

| Ruta | Qué es |
|---|---|
| `index.html` | Inicio, con las propiedades destacadas |
| `propiedades.html` | Listado con filtros |
| `propiedad.html` | Ficha de una propiedad (`?slug=` o `?id=`) |
| `mapa.html` | Mapa de propiedades |
| `admin/login.html` | Login del admin (Supabase Auth) |
| `admin/panel.html` | Panel para crear y editar propiedades y subir fotos |
| `admin/estadisticas.html` | Estadísticas de visitas |
| `js/config.js` | Configuración **pública** (Supabase, Cloudinary, contacto) y función `esc()` |
| `js/propiedades.js` | Lógica pública de listado y tarjetas |
| `css/estilos.css` | Estilos de todo el sitio |

## Reglas de trabajo

- **Cada push a `main` publica el sitio en vivo.** Antes de cada push, confirmar con el usuario.
- **Cuenta de GitHub:** este repo usa solo la cuenta `franchiferrari-byte`, configurada a nivel del repo en `.git/config`. No tiene relación con la cuenta `Digitalprop` (la principal de `gh` en esta Mac): no cambiarla ni usarla acá.
- **Nunca** poner en `js/config.js` (ni en ningún archivo) la clave `service_role`/secret de Supabase ni contraseñas: todo lo de este repo es público.
- Todo dato que venga de la base y se inserte en HTML pasa por `esc()` para evitar XSS.
- Las páginas de `admin/` llevan `noindex, nofollow`.
- Textos del sitio en español rioplatense (voseo).
- No hay entorno de prueba: para ver cambios en local, abrir los HTML con un servidor estático (por ejemplo `python3 -m http.server`) desde la raíz del repo. Ojo: el sitio local lee la base de Supabase **real**.

## Pendientes conocidos

- `admin/login.html`: el script de Google Analytics está entre `</head>` y `<body>`.
- Dominio inconsistente: `CNAME` usa `www.`; `sitemap.xml`, `robots.txt` y los canonical usan la versión sin `www`.
- `supabase-js@2` se carga sin versión exacta.
- `sitemap.xml`: fechas de abril 2026, e incluye `propiedad.html` sin parámetros.
