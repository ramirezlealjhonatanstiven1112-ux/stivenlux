# DNS de stivenlux.com antes del cambio (2026-11-24, panel de Hostinger)

Nameservers: `ns1.dns-parking.com`, `ns2.dns-parking.com`. Sin DNSSEC (RDAP). Sin MX, TXT, AAAA ni CAA.

| Tipo | Nombre | Contenido | TTL |
|---|---|---|---|
| CNAME | www | stivenlux.com | 300 |
| A | legal | 187.124.66.163 | 3600 |
| A | api | 187.124.66.163 | 3600 |
| A | @ | 187.124.66.163 | 14400 |

La IP no responde en 80 ni 443. La cuenta de Hostinger abierta no muestra VPS ni correo. Los últimos certificados públicos
vistos para `api` y `legal` son de 2026-06.

Para volver atrás: poner en Hostinger los nameservers de arriba y, si faltan, estos cuatro registros.
