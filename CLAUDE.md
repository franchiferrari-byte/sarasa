# Sitio Lucas Franchi Inmobiliaria

Sitio web de Lucas Franchi, Corredor Inmobiliario (Mat. 1740), Mendoza.
Dominio: https://www.lucasfranchi.com.ar

## Cómo funciona

- Sitio **estático** (HTML + CSS + JS, sin build ni dependencias locales), publicado con **GitHub Pages** desde la rama `main`. El dominio lo define el archivo `CNAME`.
- **Datos:** Supabase (tablas `propiedades`, `propiedades_fotos`, `visitas`). La seguridad depende de las reglas RLS: el público solo lee lo activo e inserta visitas validadas; escribir requiere `es_admin()`, que compara `auth.uid()` con el UUID del único admin. El registro de usuarios está cerrado.
- **Fotos:** Cloudinary, con un preset sin firmar (`lucasfranchi_fotos`) restringido: carpeta `propiedades`, sin overwrite, public ID aleatorio, solo jpg/jpeg/png/webp/heic y fotos limitadas a 2000 px (incoming `c_limit,w_2000,h_2000,q_auto`).
- **Mapas:** Leaflet + geocodificación con Nominatim (OpenStreetMap).
- **Analytics:** Google Analytics (gtag `G-T5YCECGL58`).
- **Vistas previas al compartir (WhatsApp, Facebook):** un Worker de Cloudflare detecta a los bots y les devuelve en `propiedad.html` las meta OG con título, descripción y la primera foto (Cloudinary 1200×630). Hay una copia en `cloudflare/worker-og.js` (no se publica en el sitio); lo que corre es lo que está en el panel de Cloudflare, así que al cambiarlo hay que pegarlo ahí y tocar Deploy.
- **Ficha de Google:** "Inmobiliaria Lucas Franchi", San Martín 4316, Luján de Cuyo (`https://maps.google.com/?cid=2027162128960109837`). Lucas no quiere la dirección de la oficina en el sitio (ni en el schema): solo la localidad. Las opiniones de `index.html#opiniones` están copiadas a mano: actualizar el texto y el total ("10 opiniones") cuando haya nuevas.

## Estructura

| Ruta | Qué es |
|---|---|
| `index.html` | Inicio, con las propiedades destacadas |
| `propiedades.html` | Listado con filtros |
| `propiedad.html` | Ficha de una propiedad (`?slug=` o `?id=`) |
| `mapa.html` | Mapa de propiedades |
| `privacidad.html` | Política de privacidad (Ley 25.326, cookies de GA, derechos, leyenda AAIP) |
| `seguridad.html` | Seguridad y aviso legal (quién publica, info orientativa, prevención de estafas) |
| `admin/login.html` | Login del admin (Supabase Auth) |
| `admin/panel.html` | Panel para crear y editar propiedades y subir fotos |
| `admin/estadisticas.html` | Estadísticas de visitas |
| `js/config.js` | Configuración **pública** (Supabase, Cloudinary, contacto) y función `esc()` |
| `js/propiedades.js` | Lógica pública de listado y tarjetas |
| `js/animaciones.js` | Animaciones públicas (aparición al scrollear, nav, contadores) y año del © (`.anio-actual`). No va en `admin/` |
| `img/marca.svg` | Isotipo (techo dorado sobre azul del sitio) usado en nav y footer. `img/logo.jpeg` es el logo completo (OG, schema, Quiénes somos, admin) |
| `css/estilos.css` | Estilos de todo el sitio. La capa de diseño moderno está al final ("MODERNIZACIÓN VISUAL") |

## Reglas de trabajo

- **Cada push a `main` publica el sitio en vivo.** Antes de cada push, confirmar con el usuario.
- **Cuenta de GitHub:** este repo usa solo la cuenta `franchiferrari-byte`, configurada a nivel del repo en `.git/config`. No tiene relación con la cuenta `Digitalprop` (la principal de `gh` en esta Mac): no cambiarla ni usarla acá.
- **Nunca** poner en `js/config.js` (ni en ningún archivo) la clave `service_role`/secret de Supabase ni contraseñas: todo lo de este repo es público.
- Todo dato que venga de la base y se inserte en HTML pasa por `esc()` para evitar XSS.
- Las páginas de `admin/` llevan `noindex, nofollow`.
- Textos del sitio en español rioplatense (voseo).
- No hay entorno de prueba: para ver cambios en local, abrir los HTML con un servidor estático (por ejemplo `python3 -m http.server`) desde la raíz del repo. Ojo: el sitio local lee la base de Supabase **real**.

## Seguridad en el código

- Las librerías externas van con versión exacta y `integrity` (SRI). Si se cambia una versión, recalcular el hash: `curl -sL <url> | openssl dgst -sha384 -binary | openssl base64 -A`.
- Las páginas de `admin/` tienen una CSP en `<meta>`. Si se agrega un servicio externo nuevo al panel, sumarlo ahí.
- `_config.yml` excluye `CLAUDE.md` del sitio publicado.

## Caché

- Los HTML cargan `css/estilos.css`, `js/propiedades.js` y `js/animaciones.js` con `?v=N`. Al cambiar alguno de esos archivos, subir el número en **todos** los HTML (incluido `admin/`) para que los visitantes no vean la versión vieja.
