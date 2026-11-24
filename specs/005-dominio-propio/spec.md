# Spec 005 — Dominio propio: stivenlux.com en Cloudflare Pages

Estado: IMPLEMENTADA y VALIDADA (2026-11-24); aprobada por el usuario el mismo día

## Objetivo
Que la web de Stiven Lux viva solo en `https://stivenlux.com`, alojada en Cloudflare Pages (plan gratuito), y que los
buscadores y los enlaces compartidos usen esa dirección.

## Diagnóstico (2026-11-24, solo lectura)
- Dominio registrado en Hostinger (vence 2027-02-25). DNS en Hostinger (`ns1/ns2.dns-parking.com`).
- `A stivenlux.com` → `187.124.66.163`, que no responde. `www` → CNAME a `stivenlux.com`. Sin MX ni TXT visibles: no
  se ve correo. El usuario dice que solo compró el dominio.
- Hoy publica Vercel (`stivenlux.vercel.app`): cada push a `claude/admiring-einstein-ruy4my` sale a producción.

## Requisitos
- RF-1: CUANDO se visita `https://stivenlux.com`, EL SISTEMA muestra la web actual y sus tres demos, con HTTPS válido.
- RF-2: CUANDO se visita `www`, `http://` o la dirección `.pages.dev` de producción, EL SISTEMA redirige a
  `https://stivenlux.com`.
- RF-3: EL SISTEMA declara en la portada `canonical` y `og:url` con `https://stivenlux.com/`. Las demos siguen con
  `noindex`.
- RF-4: EL SISTEMA ofrece `og:image` (1200×630) propia, sin datos inventados.
- RF-5: CUANDO el dominio funcione en Cloudflare, `stivenlux.vercel.app` deja de publicarse (solo queda el dominio).

## Cómo
- Cloudflare Pages conectado al repositorio de GitHub: rama de producción actual, `npm run build`, salida `dist`,
  Node ≥ 20.
- Para usar el dominio raíz en Pages, la zona se gestiona en Cloudflare: en Hostinger se cambian los **nameservers** por
  los que dé Cloudflare. El dominio sigue comprado y renovándose en Hostinger. Puede tardar horas (hasta 24–48).
- Antes: copiar los registros DNS actuales, para poder volver atrás, y mirar en Hostinger que no haya DNSSEC, correo ni
  otro servicio activos.
- Confirmar los pasos con la documentación vigente de Cloudflare al empezar (no comprobados en este borrador).
- Cuentas, contraseñas, códigos y permisos (Cloudflare, Hostinger, GitHub): los hace el usuario, con pasos guiados.

## Riesgos
- Durante la propagación, unos visitantes verán la dirección vieja (que hoy no responde) y otros la nueva. Vercel se
  mantiene hasta comprobar el dominio.
- Mientras Vercel y Cloudflare estén conectados, cada push publica en los dos sitios.

## Fuera de alcance
Correo `@stivenlux.com`, cambio de registrador, analítica y videos de Higgsfield.

## Terminado
`stivenlux.com`, `www` y `http://` llevan a `https://stivenlux.com`, Vercel ya no publica, la puerta pasa y el usuario lo
comprueba en su móvil.

## Decisiones
1. Alojamiento: Cloudflare Pages, no Vercel (usuario). `187.124.66.163`: no sabe qué es; solo compró el dominio.
2. Es un solo dominio: `stivenlux.com` (usuario).
3. Solo queda el dominio: se retira `stivenlux.vercel.app` (usuario). Cómo: desconectar GitHub y quitar los dominios del
   proyecto de Vercel; borrar el proyecto es permanente y se pregunta aparte (recomendación).
4. `og:image`: sí (usuario).
5. Correo con el dominio: ahora no (usuario).

## Tareas
- [x] T1. El usuario crea o abre Cloudflare y conecta GitHub; proyecto en Pages probado en su dirección `.pages.dev`.
- [x] T2. Zona en Cloudflare y nameservers en Hostinger (usuario, guiado). Dominio, HTTPS y redirecciones (RF-1, 2).
- [x] T3. `canonical`, `og:url` y `og:image` con sus tests (RF-3, 4). Revisión visual del usuario.
- [x] T4. Puerta, un @reviewer, commit y publicación, con permiso. Prueba en el móvil del usuario.
- [x] T5. Retirar Vercel (RF-5), con permiso.
