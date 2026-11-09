---
name: ahorro
description: Reglas de Stiven Lux para gastar menos tokens sin perder calidad. Voz breve en los informes de subagentes y en los mensajes de estado, formato fijo de informe, cuándo retomar o crear subagentes, cómo leer salidas largas y cómo evitar vueltas en las pruebas. Cárgala al empezar cada sesión y antes de cada encargo a un subagente.
---

# Ahorro de tokens en Stiven Lux

Adaptada de las skills `caveman` y `cavecrew` (Apache-2.0, © 2026 Julius Brussee). Ver `NOTICE.md`.

Objetivo: menos tokens con la misma calidad. Si una regla de ahorro choca con la claridad, la seguridad o una regla de `CLAUDE.md`, gana la otra.

## 1. Voz breve, solo donde no hace daño
**Se aplica a:** informes de subagentes, mensajes de estado del coordinador ("estoy con X") y notas entre agentes.
**Al dueño:** cuando pregunte qué hacer, pasos cortos y numerados (comando + qué debe ver), sin párrafos; explicación larga solo si pide "explícame bien".
**No se aplica a:** preguntas y opciones, avisos de seguridad o de acciones irreversibles, y todo lo que se guarda (specs, planes, código, comentarios, commits, `MEMORY.md`, textos de la app).

- Lo importante primero. Sin saludos, rodeos, "voy a…" ni cierres de cortesía.
- Una idea por frase. Nunca quitar "no", "nunca", "solo" ni "excepto". Números, rutas, comandos y errores, exactos.
- Sin texto entre llamadas rutinarias a herramientas: una línea al empezar, una por cambio de fase y una al final.
- Tablas sí, cuando condensan. Sin emojis decorativos.
- Lo que pide la app (recuadro final, resumen al terminar, preguntas) se da siempre.

## 2. Informe de un subagente (formato fijo, 25 líneas como máximo)
```
Hecho: <tarea> · <RF> · commit <hash> (o "sin commit")
Archivos: <rutas>
Pruebas: test <n> en verde · lint ok · typecheck ok · e2e <resultado o "no ejecutado">
Desvíos del plan: <lista corta o "ninguno">
No comprobado: <lista o "nada">
Para el dueño o el coordinador: <decisiones, riesgos o pasos manuales, o "nada">
```
"Desvíos" y "No comprobado" nunca se recortan: son lo que más errores ha evitado. El reviewer mantiene su veredicto y su lista `archivo:línea`, pero sin prosa de relleno.

## 3. Delegar a subagentes
- Encargo autosuficiente y corto: fase, tarea, decisiones del dueño, reglas que aplican y qué leer (secciones concretas, no documentos enteros; nunca documentos de investigación enteros).
- Cada vuelta con `SendMessage` reenvía todo el historial del agente. Retómalo solo si sigue en la misma zona del trabajo y no pasa de unos 150k tokens. Si no, agente nuevo con un resumen de 5–10 líneas.
- Implementer nuevo cada 2–3 tareas. Arreglos de 1–2 líneas: agente nuevo con encargo mínimo (`archivo:línea`, qué cambiar, cómo comprobarlo).
- No parar un agente a mano (se pierde su trabajo). No lanzar dos que editen los mismos archivos.
- Al retomar tras un reinicio: "no releas lo que ya tienes".
- Una sola revisión de QA por spec y un solo reviewer en la validación, salvo un cambio grande.
- No retomar a un agente solo para preguntarle algo que se resuelve con `git log`, `git diff` o leyendo un archivo.

## 4. Leer sin inundar el contexto
- Consola del navegador: solo errores y con filtro (`onlyErrors`, `pattern`). Los mensajes viejos de la pestaña se acumulan.
- Registros del servidor: `level: error` o las últimas líneas.
- Terminal: las últimas 40–100 líneas; busca el resumen final (passed / failed).
- Archivos grandes: `Grep` o un rango de líneas, no el archivo entero.
- Navegador: `get_page_text` o `javascript_tool` que devuelvan solo lo necesario. Capturas a escala 0.5 y solo si importa lo visual.
- Fallo de e2e: lee con `grep` el informe del fallo (Playwright: `error-context.md`) y el código implicado. No adivines.

## 5. Menos vueltas
- Llamadas independientes, en paralelo en el mismo mensaje.
- Preguntas al dueño que no dependen entre sí: juntas en una sola llamada (4 como máximo).
- e2e que no se pueden ejecutar al escribirlas (p. ej. sin credenciales): antes de entregarlas, comprueba cada selector contra el código real (rol `button` o `link`, texto exacto con `exact: true`, contenedor `main`, diálogo o `aside`) y espera a que la página esté hidratada.
- Al repetir pruebas, solo el archivo que falló (salvo que dependa de otros).
- No esperar con `sleep`: tareas en segundo plano y sus avisos.

## 6. Sesiones
- Cada spec en una conversación nueva. El contexto vive en `MEMORY.md`, `CLAUDE.md` y `specs/`.
- Al empezar: `MEMORY.md` y la spec activa. No releas specs cerradas salvo que la tarea las cite.

## Lo que nunca se recorta
La seguridad y los datos del dueño, las aprobaciones del flujo SDD, la revisión de QA y la validación, el apartado "No comprobado" y las explicaciones que el dueño pida.
