# Auditoría FleetGuard

Fecha: 2026-10-08. Producto: seguimiento de vencimientos DOT para flotas pequeñas (1–100 camiones, EE. UU.).

## 1. Hallazgos críticos (corregidos o pendientes)

| # | Hallazgo | Estado |
|---|----------|--------|
| 1 | **IDOR en `PATCH /api/documents/:id`**: se podía asociar un documento a un vehículo/conductor de *otra* empresa y leer sus datos. | Corregido |
| 2 | **`/api/cron/reminders` abierto** si `CRON_SECRET` estaba vacío (cualquiera disparaba envíos de email). | Corregido: falla cerrado (503) |
| 3 | Sin límite de intentos en login/registro (fuerza bruta). | Corregido: 20 intentos / 15 min por IP |
| 4 | Errores 500 devolvían `err.message` (fuga de detalles internos). | Corregido |
| 5 | `parseInt/parseFloat` sin validar → NaN → 500 de Prisma. | Corregido |
| 6 | Emails con título del documento sin escapar (HTML injection). | Corregido |
| 7 | Archivos subidos no se borraban del disco al borrar/reemplazar el documento (privacidad). | Corregido |
| 8 | **Sin recuperación de contraseña**: un cliente que olvida la clave se pierde para siempre. | Corregido (token firmado, 1 h, un solo uso, sin cambios de BD) |
| 9 | **Rutas heredadas de otro producto** (`/api/analyze`, `/api/translate`, `/api/ai-chat`) sin autenticación: gastan tu cuota de Groq y `analyze` hace fetch a dominios arbitrarios (SSRF). Además `/dashboard`, `/onboarding`, Supabase, Lexora, `Untitled`, `backend/auth-backend`, `backend/generated_backend`, `public/fondo-1.jpg` (1,9 MB). | **Pendiente: requiere tu OK para borrar** |
| 10 | `backend/uploads/*.png` está versionado en git (dato de usuario). | Pendiente: `git rm --cached` |
| 11 | JWT de 30 días en `localStorage` (riesgo si hay XSS). | Pendiente: migrar a cookie httpOnly |
| 12 | `npm run lint`: 81 errores, casi todos en el código heredado. | Se resuelve con #9 |

## 2. Negocio y conversión

- **Oferta contradictoria**: la landing decía "14-day trial", el registro "Free forever", los términos "14-day trial", el backend "el producto es gratis". Unificado a **"Free to start · $29/mo"**.
- **No se cobra a nadie de forma verificable**: el enlace de checkout era fijo, sin vincular la compra con la cuenta y no existía webhook. Añadido: email precargado en el checkout y `POST /api/billing/webhook` (firma HMAC) que actualiza `subscriptionStatus`. **Aún no se limita ninguna función por plan**; decide el modelo (ver §4).
- **Promesa falsa**: la landing prometía medical card, MVR, drug & alcohol, IFTA, IRP, UCR, pero la app solo tenía 9 tipos genéricos. Añadidos tipos DOT y una lista de **inicio rápido con vigencia automática** (CDL 48 m, medical card 24 m, inspección anual 12 m, MCS-150 24 m, etc.): se elige el documento, se pone la fecha de emisión y el vencimiento se calcula solo. Reduce el mayor freno de activación (la carga de datos).
- **Activación**: el dashboard vacío ahora muestra un checklist de 3 pasos.
- **Captación**: nueva herramienta gratuita `/tools/dot-compliance-calendar` (USDOT → fecha MCS-150, UCR, IFTA, 2290 para 24 meses, descargable a Google/Outlook/Apple con alertas). Captura leads en `POST /api/leads`.
- SEO: JSON-LD `SoftwareApplication`, sitemap con la herramienta, `robots` sin indexar login/registro.

## 3. Cómo conseguir clientes (plan de 90 días)

**Cliente ideal**: carrier de 1–25 camiones con autoridad propia, sobre todo *new entrants* (primer año con DOT). Dolor: auditoría de nuevo ingresante, multas, primas del seguro.

1. **SEO de cola larga con herramientas** (coste casi cero, compone): una página por consulta que la gente busca. Ya está MCS-150/UCR/IFTA/2290. Siguientes: "DOT medical card expiration tracker", "driver qualification file checklist", "new entrant safety audit checklist" (PDF descargable a cambio de email), "annual vehicle inspection requirement".
2. **Outbound a new entrants**: FMCSA publica datos de registros nuevos (DOT numbers recientes). Email/DM corto: "Tu auditoría de nuevo ingresante llega en X meses; esto te deja los archivos listos". Es el segmento con dolor inminente y mejor conversión.
3. **Canales de confianza**: grupos de Facebook y Reddit de owner-operators, YouTube de dispatchers, y sobre todo **socios con acceso al cliente**: agentes de seguros de trucking, servicios de apertura de autoridad (MC/DOT), dispatchers y factoring. Ofréceles enlace de referido (20–30 % recurrente) o plan white-label.
4. **Oferta de entrada**: el onboarding "white-glove" (cargamos tus documentos) es tu mejor gancho; hoy es de pago ($149). Úsalo gratis para los primeros 20 clientes a cambio de testimonio y caso de estudio.
5. **Prueba social real**: de momento no hay ninguna en la landing. Consigue 3–5 testimonios con nombre y flota y ponlos sobre el hero. No inventes cifras.
6. **Producto como canal de retención**: los emails de recordatorio son tu contacto más frecuente; cada uno debe llevar a renovar y subir el nuevo documento (ya enlaza al documento).
7. **Pago**: Google Ads solo cuando la conversión visitante→registro y registro→pago esté medida (instalar analítica: hoy no hay ninguna).

## 4. Decisiones de producto que te tocan

- **Modelo de precio**: $29 plano e ilimitado deja dinero sobre la mesa en flotas de 30–100 camiones y compite mal contra "gratis" (hojas de cálculo). Recomendación: gratis hasta 3 vehículos + $29 hasta 25 + $79 hasta 100; descuento anual (2 meses gratis). Requiere aplicar límites usando `subscriptionStatus` (ya se actualiza con el webhook).
- **Recordatorios a conductores** (su email ya existe en la ficha) y a varios destinatarios: gran diferenciador, necesita opt-in.
- **Resumen semanal por email** y envío de **SMS** (los camioneros leen SMS, no email).
- **App móvil/PWA** con foto del documento → OCR de la fecha.
- Medir: instalar analítica (Plausible/PostHog) y un embudo visita → registro → primer documento → pago.

## 5. Despliegue: acciones manuales

```bash
cd backend && npx prisma db push   # crea la tabla Lead
```

Variables nuevas (ver `backend/.env.fleetguard.example`): `CRON_SECRET` (obligatoria si usas el endpoint), `LEMONSQUEEZY_WEBHOOK_SECRET`, `CONTACT_TO_EMAIL`. Configura en Lemon Squeezy el webhook a `https://<api>/api/billing/webhook`. En producción define siempre `FRONTEND_URL` y `RESEND_API_KEY`, y `ENABLE_INTERNAL_CRON=1` (sin esto no se envía ningún recordatorio).
