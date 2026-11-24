/* Ayudas de e2e de la spec 002 (no es un archivo de tests). T1: datos de la base 0f6b12d (huella de estilos,
   orden de tabulación y recorrido de CLS). Las demás ayudas del plan se añaden en sus tareas. */
import { expect } from '@playwright/test';
import { animationsDone, heroEntranceDone, open } from './motion.js';

/* Propiedades calculadas que no entran en la huella porque no se repiten entre dos ejecuciones de la base
   (plan: «si alguna propiedad no se repite, se excluye con un comentario»). Vacía: en las dos pasadas de T1
   todas se repitieron. */
export const FINGERPRINT_EXCLUDED = [];

/* Ruta estable de un elemento: etiqueta e índice entre los hijos de su padre, desde <html>. No usa clases
   (cambian con el script y con el estado), así que la misma ruta señala el mismo nodo con y sin JS. Se pasa
   como texto a page.evaluate (funciona también sin JS). */
export const FINGERPRINT_PATH_FN = `(el) => {
  const parts = [];
  for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
    parts.push(n.tagName.toLowerCase() + [...n.parentElement.children].indexOf(n));
  }
  return parts.reverse().join('>') || 'html';
}`;

/* Huella FNV-1a (32 bits) de todas las propiedades calculadas estándar (sin las `--*` ni las excluidas) de
   cada nodo de `root` y sus descendientes, y de su ::before y ::after cuando se generan (content distinto de
   none). Clave: la ruta del elemento, con el sufijo del pseudo-elemento. Sin root: <html>, <body> y todo el
   body. */
export async function styleFingerprint(page, root = null) {
  return page.evaluate(
    ({ pathSrc, excluded, rootSel }) => {
      const path = new Function(`return ${pathSrc}`)();
      const skip = new Set(excluded);
      const fnv = (s) => {
        let h = 0x811c9dc5;
        for (let i = 0; i < s.length; i += 1) {
          h ^= s.charCodeAt(i);
          h = Math.imul(h, 0x01000193);
        }
        return (h >>> 0).toString(16).padStart(8, '0');
      };
      const serialize = (cs) => {
        const parts = [];
        for (let i = 0; i < cs.length; i += 1) {
          const p = cs[i];
          if (!p.startsWith('--') && !skip.has(p)) parts.push(`${p}:${cs.getPropertyValue(p)}`);
        }
        return parts.join(';');
      };
      const scope = rootSel ? document.querySelector(rootSel) : null;
      const nodes = scope
        ? [scope, ...scope.querySelectorAll('*')]
        : [document.documentElement, document.body, ...document.body.querySelectorAll('*')];
      const out = {};
      for (const el of nodes) {
        const key = path(el);
        out[key] = fnv(serialize(window.getComputedStyle(el)));
        for (const pseudo of ['::before', '::after']) {
          const cs = window.getComputedStyle(el, pseudo);
          if (cs.content !== 'none' && cs.content !== 'normal') out[key + pseudo] = fnv(serialize(cs));
        }
      }
      return out;
    },
    { pathSrc: FINGERPRINT_PATH_FN, excluded: FINGERPRINT_EXCLUDED, rootSel: root },
  );
}

/* Diferencias entre dos huellas: claves que faltan, que sobran y que cambian. */
export function fingerprintDiff(base, now) {
  const missing = Object.keys(base).filter((k) => !(k in now));
  const extra = Object.keys(now).filter((k) => !(k in base));
  const changed = Object.keys(base).filter((k) => k in now && now[k] !== base[k]);
  return { missing, extra, changed };
}

/* Orden de tabulación desde el principio del documento: cada Tab, el elemento enfocado con su etiqueta y su
   ruta. Termina al volver a uno ya visto o cuando el foco sale del documento (body). */
export async function tabOrder(page) {
  const order = [];
  for (let i = 0; i < 60; i += 1) {
    await page.keyboard.press('Tab');
    const item = await page.evaluate((pathSrc) => {
      const path = new Function(`return ${pathSrc}`)();
      const el = document.activeElement;
      if (!el || el === document.body || el === document.documentElement) return null;
      const label = (el.getAttribute('aria-label') || el.textContent).trim().replace(/\s+/g, ' ');
      return { label, path: path(el) };
    }, FINGERPRINT_PATH_FN);
    if (!item || order.some((o) => o.path === item.path)) break;
    order.push(item);
  }
  return order;
}

/* Cancela la navegación y el desplazamiento de los enlaces (listener de click en captura). Los botones
   siguen funcionando. */
export async function noFollow(page) {
  await page.evaluate(() => {
    window.addEventListener(
      'click',
      (event) => {
        if (event.target.closest?.('a[href]')) event.preventDefault();
      },
      true,
    );
  });
}

/* Pulsables del recorrido de CLS, en el orden del documento y con el menú cerrado: todos los enlaces y
   botones de la página fuera del menú (el enlace de salto incluido) y, en escritorio, las filas de servicios. */
const ROUTE = {
  escritorio: 'a[href]:not([data-menu] *), button:not([data-menu] *), .service',
  movil: 'a[href]:not([data-menu] *), button:not([data-menu] *)',
};

/* Recorrido de CLS de la spec (requisito de estabilidad) sobre una página nueva. Se cuentan todas las
   entradas de desplazamiento de diseño desde la carga, también las de `hadRecentInput`.
   - El enlace de salto se enfoca con Tab (está fuera de la pantalla hasta recibir el foco); después de
     pasar por él se le quita el foco, porque al estar fijo arriba a la izquierda taparía la marca.
   - Cada pulsable se lleva a la vista con scrollIntoView instantáneo (centrado).
   - escritorio: el puntero llega en 5 pasos y espera 400 ms; también por las filas de servicios.
   - movil: un toque en cada pulsable, con su navegación y su desplazamiento cancelados (noFollow).
   - «Menú» se pulsa o se toca para abrir y otra vez para cerrar, esperando sus animaciones.
   Devuelve el CLS (suma de todas las entradas), las entradas y los errores de la página. */
export async function clsRoute(page, profile) {
  await page.addInitScript(() => {
    window.__cls = [];
    new window.PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        window.__cls.push({
          value: e.value,
          recent: e.hadRecentInput,
          sources: e.sources.map((s) => s.node?.className || s.node?.nodeName || '?'),
        });
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  const errors = await open(page);
  await heroEntranceDone(page);
  await noFollow(page);

  const touch = profile === 'movil';
  const targets = page.locator(ROUTE[profile]);
  const count = await targets.count();
  const visited = [];

  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();

  for (let i = 0; i < count; i += 1) {
    const target = targets.nth(i);
    const info = await target.evaluate((el) => {
      el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
      return { skip: el.matches('.skip-link'), toggle: el.matches('[data-menu-toggle]'), label: el.textContent.trim().replace(/\s+/g, ' ') };
    });
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    const box = await target.boundingBox();
    if (!box) {
      // No se pinta en este perfil (p. ej. display: none): no es pulsable aquí
      visited.push(`(sin caja) ${info.label}`);
      continue;
    }
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    // El punto pulsado es el propio elemento (nada lo tapa): si no, el recorrido no sería el de la spec
    expect(await target.evaluate((el, [px, py]) => el.contains(document.elementFromPoint(px, py)), [x, y]), `${info.label}: alcanzable`).toBe(true);

    const act = async () => (touch ? page.touchscreen.tap(x, y) : page.mouse.click(x, y));
    if (touch) await page.touchscreen.tap(x, y);
    else await page.mouse.move(x, y, { steps: 5 });
    await page.waitForTimeout(400);

    if (info.toggle) {
      // En escritorio el puntero ya está encima: se pulsa; en móvil el primer toque ya lo ha abierto
      if (!touch) await act();
      await expect(target).toHaveAttribute('aria-expanded', 'true');
      await animationsDone(page);
      await act();
      await expect(target).toHaveAttribute('aria-expanded', 'false');
      await animationsDone(page);
    }
    if (info.skip) await target.evaluate((el) => el.blur());
    visited.push(info.label);
  }

  await animationsDone(page);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const shifts = await page.evaluate(() => window.__cls);
  return { cls: shifts.reduce((sum, s) => sum + s.value, 0), shifts, visited, errors };
}

/* ---------- T5 en adelante: medidas del punto y tiempos por fotograma ---------- */

/* Página abierta con la entrada del hero terminada y las microinteracciones activas (html.fx). */
export async function openFx(page, path = '/') {
  const errors = await open(page, path);
  await trackMoves(page);
  await heroEntranceDone(page);
  await expect(page.locator('html')).toHaveClass(/(^|\s)fx(\s|$)/);
  await animationsDone(page);
  return errors;
}

/* Estado del punto: existencia, visibilidad, centro (posición actual, también a mitad de transición), cajas
   y opacidades del disco y del aro, y fondo del aro. */
export async function dotState(page) {
  return page.evaluate(() => {
    const dot = document.querySelector('.cursor');
    if (!dot) return { exists: false };
    const [disc, ring] = dot.children;
    const r = dot.getBoundingClientRect();
    const cs = window.getComputedStyle(dot);
    const d = window.getComputedStyle(disc);
    const g = window.getComputedStyle(ring);
    const dr = disc.getBoundingClientRect();
    const rr = ring.getBoundingClientRect();
    return {
      exists: true,
      visible: cs.display !== 'none' && Number(cs.opacity) > 0.99 && !dot.classList.contains('is-off'),
      opacity: Number(cs.opacity),
      ring: dot.classList.contains('is-ring'),
      x: r.left,
      y: r.top,
      disc: { w: disc.offsetWidth, h: disc.offsetHeight, shown: dr.width, opacity: Number(d.opacity), bg: d.backgroundColor, border: d.borderTopColor },
      ringBox: { w: ring.offsetWidth, h: ring.offsetHeight, shown: rr.width, opacity: Number(g.opacity), bg: g.backgroundColor, border: g.borderTopColor, borderWidth: parseFloat(g.borderTopWidth), shadow: g.boxShadow },
      pointerEvents: cs.pointerEvents,
      ariaHidden: dot.getAttribute('aria-hidden'),
      tabindex: dot.getAttribute('tabindex'),
      zIndex: cs.zIndex,
    };
  });
}

/* Cada pointermove que recibe la página es el instante de referencia de untilFrame: los tiempos de la spec
   cuentan desde que el puntero llega, no desde que Playwright empieza a moverlo. */
export async function trackMoves(page) {
  await page.evaluate(() => {
    // Contador de fotogramas (solo en los tests): la latencia del sistema se cuenta en fotogramas
    window.__frame = 0;
    const tick = () => {
      window.__frame += 1;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    window.addEventListener(
      'pointermove',
      () => {
        window.__t0 = window.performance.now();
        window.__f0 = window.__frame;
      },
      true,
    );
    // Registro de cada cambio de forma del punto (fotograma e instante en que el sistema aplica la clase),
    // armado antes de cualquier acción: la medida no depende de cuándo empieza a mirar el test
    window.__shapes = [];
    window.__moves = [];
    new window.MutationObserver((records) => {
      for (const r of records) {
        if (!r.target.classList?.contains('cursor')) continue;
        const at = { f: window.__frame, t: window.performance.now() };
        if (r.attributeName === 'class') window.__shapes.push({ ring: r.target.classList.contains('is-ring'), ...at });
        else window.__moves.push({ transform: r.target.style.transform, ...at });
      }
    }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
  });
}

/* Fotogramas desde la referencia hasta que el sistema escribe la posición (x, y) del punto; null si no. */
export async function placedFrames(page, x, y) {
  return page.evaluate(
    ([px, py]) => {
      const hit = window.__moves.find((m) => m.t >= window.__t0 && m.transform.startsWith(`translate3d(${px}px, ${py}px`));
      return hit ? hit.f - window.__f0 : null;
    },
    [x, y],
  );
}

/* Fotogramas desde la referencia (último pointermove o markNow) hasta el primer cambio registrado del punto a
   la forma pedida (aro o disco); null si no lo hubo. */
export async function shapeFrames(page, ring) {
  return page.evaluate((want) => {
    const hit = window.__shapes.find((s) => s.t >= window.__t0 && s.ring === want);
    return hit ? hit.f - window.__f0 : null;
  }, ring);
}

/* Fotogramas desde la referencia (último pointermove o markNow) hasta el primero en que se cumple `src`, y
   el tiempo real transcurrido; Infinity si no se cumple en `ms`. */
export async function framesUntil(page, src, arg = null, ms = 1500) {
  return page.evaluate(
    async ({ src, arg, ms }) => {
      const fn = new Function('arg', src);
      const start = window.performance.now();
      for (;;) {
        if (fn(arg)) return { frames: window.__frame - (window.__f0 ?? window.__frame), ms: window.performance.now() - (window.__t0 ?? start) };
        if (window.performance.now() - start > ms) return { frames: Infinity, ms: Infinity };
        await new Promise((r) => requestAnimationFrame(r));
      }
    },
    { src, arg, ms },
  );
}

/* Marca el instante de referencia dentro de la página (antes de la acción que se va a medir). */
export async function markNow(page) {
  await page.evaluate(() => {
    window.__t0 = window.performance.now();
    window.__f0 = window.__frame;
  });
}

/* Milisegundos desde la referencia (markNow o el último pointermove) hasta el primer fotograma en que se
   cumple `src` (cuerpo de una función que recibe `arg` y devuelve un booleano), o Infinity si no se cumple
   en los `ms` siguientes a la llamada. */
export async function untilFrame(page, src, arg = null, ms = 1500) {
  return page.evaluate(
    async ({ src, arg, ms }) => {
      const fn = new Function('arg', src);
      const start = window.performance.now();
      const t0 = window.__t0 ?? start;
      for (;;) {
        if (fn(arg)) return window.performance.now() - t0;
        if (window.performance.now() - start > ms) return Infinity;
        await new Promise((r) => requestAnimationFrame(r));
      }
    },
    { src, arg, ms },
  );
}

/* Registra, fotograma a fotograma durante `ms`, el valor de `src` (cuerpo de una función con `arg`). */
export async function recordFrames(page, src, arg = null, ms = 400) {
  return page.evaluate(
    async ({ src, arg, ms }) => {
      const fn = new Function('arg', src);
      const out = [];
      const t0 = window.performance.now();
      while (window.performance.now() - t0 < ms) {
        out.push(fn(arg));
        await new Promise((r) => requestAnimationFrame(r));
      }
      return out;
    },
    { src, arg, ms },
  );
}

/* Centro de un elemento en la ventana (después de llevarlo a la vista sin animación). */
export async function centerOf(page, selector, nth = 0) {
  const el = page.locator(selector).nth(nth);
  await el.evaluate((n) => n.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const b = await el.boundingBox();
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}
