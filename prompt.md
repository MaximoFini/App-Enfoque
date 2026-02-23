# 🗺️ Roadmap de Mejoras — App Enfoque

> Ordenado por fases de menor a mayor complejidad y dependencia entre ítems.

---

## ✅ Fase 1 — UI Rápida y Limpieza Visual

> Cambios de interfaz sin lógica compleja. Ideal para arrancar con momentum.

---

### 1.1 — Sacar los botones Día/Semana/Mes del Calendario

En `src/components/calendar/CalendarGrid.tsx`, eliminar el grupo de botones de vista (Día, Semana, Mes) del header. Solo existe la vista semanal, así que esos botones son dead UI. Asegurate de no romper nada relacionado con `viewMode` en el store `calendarStoreNew.ts`.

---

### 1.2 — Eliminar el Header (Top Bar) y ajustar el layout

En `src/components/layout/MainLayout.tsx`, eliminar el componente `<Header />` y su import. En `src/components/layout/Header.tsx` podés borrar el archivo también. Asegurate de que el contenido principal (`<main>`) ocupe el espacio que quedó libre, expandiéndose hacia arriba. Verificá en todas las páginas que el layout no quede roto.

---

### 1.3 — Página de error 404 amigable

Crear una página `src/pages/NotFound.tsx` con diseño consistente al resto de la app (fondo oscuro, tipografía del sistema, colores del tema). Que tenga un mensaje claro, un ícono de Material Symbols, y un botón que redirija a `/calendario`. Registrar la ruta en `src/App.tsx` con `<Route path="*" element={<NotFound />} />`.

---

### 1.4 — No requerir categoría al crear una tarea

En `src/components/tasks/TaskModal.tsx`, la validación actual en `handleSave` tiene `if (!title.trim() || !categoryId) return;`. Eliminá la condición `|| !categoryId`. El campo de categoría debe volverse opcional en el formulario. En el store `tasksStore.ts`, la función `addTask` ya acepta `category_id: null`, así que no debería requerir cambios en backend.

---

## 🔧 Fase 2 — Fixes de Lógica Existente

> Bugs y comportamientos incorrectos que ya tienen parte de la infraestructura, solo falta cerrarlos.

---

### 2.1 — Agregar subtareas a tareas ya creadas

En `src/components/tasks/TaskModal.tsx`, el bloque de subtareas está envuelto en `{!isEditing && (...)}`. Eliminá esa condición para que el formulario de subtareas también se muestre en modo edición. Además, al abrir el modal en modo edición, el `useEffect` actual hace `setSubtasks([])`. Modificalo para que haga un fetch de las subtareas existentes desde Supabase filtrando por `parent_task_id === editingTask.id`. Al guardar en `handleSave`, si hay subtareas nuevas, insertarlas con `addTask` usando `parent_task_id` del task editado.

---

### 2.2 — Mostrar subtareas siempre (sin necesidad de expandir)

En `src/components/tasks/TaskItem.tsx`, el bloque que renderiza las subtareas está condicionado a `task.isExpanded`. Eliminar esa condición para que las subtareas siempre se rendericen. Si hay un botón o toggle de expand/collapse, removelo también para simplificar la UI.

---

### 2.3 — Fix del botón Pausar/Continuar en Pomodoro

En `src/pages/Pomodoro.tsx`, el botón principal del timer actualmente muestra `{isRunning ? "Pausar" : "Iniciar"}`. Cuando el timer está pausado (`status === "paused"` en `globalTimerStore`), el texto debe ser **"Continuar"** y debe llamar a `resume()` en lugar de `start()`. Revisá que `usePomodoroTimer` ya expone `resume` (sí lo hace). Actualizá el handler del botón para que distinga entre los tres estados: `idle` → "Iniciar" / llama `start`, `paused` → "Continuar" / llama `resume`, `running` → "Pausar" / llama `pause`.

---

### 2.4 — Fix del botón Pausar/Continuar en Enfoque

Mismo problema que 2.3 pero en `/enfoque`. Revisá `src/pages/Enfoque.tsx` — ahí ya existe lógica separada para `status === "paused"` que muestra "Continuar", pero verificar que el timer global (`globalTimerStore`) preserve correctamente el tiempo restante al pausar/reanudar sin reiniciarlo. La lógica de `pause()` y `resume()` en `globalTimerStore.ts` ya usa `pausedRemainingMs` correctamente, así que probablemente el fix sea solo en la UI del Pomodoro (punto 2.3).

---

### 2.5 — Guardar conteo de distracciones en la base de datos

El `distractionsCount` se registra en `globalTimerStore` pero en `focusStore.ts` la función `saveSession` ya lo inserta en la tabla `focus_sessions` con el campo `distractions_count`. El problema es que el store de enfoque (`useFocusTimer`) toma `distractionsCount` de `globalTimer.distractionsCount`, pero `saveSession` lo lee de `state.distractionsCount` del `focusStore` local, que puede estar desincronizado. Sincronizar ambos: antes de llamar `saveSession`, actualizar `focusStore` con el valor actual de `globalTimer.distractionsCount`. Verificar en Supabase que la columna `distractions_count` se esté poblando correctamente después del fix.

---

### 2.6 — Verificar y corregir la sumatoria de tiempo total en Pomodoro

Revisar que `totalWorkMs` en `globalTimerStore.ts` se acumule correctamente. Actualmente, en `_tick()`, cuando el timer termina en modo `work`, se suma `pomodoroConfig.workDurationMs` a `totalWorkMs`. El problema potencial: si el usuario pausa antes de que termine el ciclo, ese tiempo parcial **no se acumula**. Implementar la acumulación del tiempo parcial al pausar: en la función `pause()`, si `activeTimer === "pomodoro"` y `pomodoroMode === "work"`, calcular el tiempo transcurrido (`workDurationMs - remaining`) y sumarlo a `totalWorkMs`. Verificar que el display en `Pomodoro.tsx` refleje el valor correcto en tiempo real.

---

## 🎨 Fase 3 — Mejoras de UX con Nueva Lógica

> Features que requieren lógica nueva pero acotada.

---

### 3.1 — Color del bloque en calendario según categoría (y Deep/Shallow)

En `src/components/calendar/BlockModal.tsx`, actualmente el selector de color solo aparece cuando `type === "other"`. Modificar el comportamiento así:
- Si `type === "deep-work"` → usar color fijo violeta (`#8B5CF6`), sin selector.
- Si `type === "shallow-work"` → usar color fijo verde (`#10B981`), sin selector.
- Si `type === "other"` y hay una `categoryId` seleccionada → usar el `color` de esa categoría (disponible en el array `categories` del store). Si no hay categoría seleccionada, mostrar el selector manual de colores.

Eliminar el selector de colores cuando el tipo sea Deep o Shallow. En `handleSubmit`, asignar el color correcto según esta lógica antes de llamar a `addBlock` o `updateBlock`.

---

### 3.2 — Permitir crear tareas desde tarde de un día a madrugada del siguiente

En `src/components/calendar/BlockModal.tsx`, en la validación de tiempo, actualmente puede estar bloqueando casos donde `endTime < startTime` (interpretado como inválido). Modificar la lógica para que si `endTime <= startTime`, se asuma que el bloque termina al día siguiente. Ajustar el cálculo de `endDateTime` en `calendarStoreNew.ts` función `timeBlockToDbBlock` para sumar un día a la fecha de fin cuando corresponda.

---

### 3.3 — Aviso sonoro al terminar sesión de Enfoque (Deep/Shallow)

Cuando el timer de enfoque llega a 0 en `globalTimerStore.ts` (bloque `if (state.activeTimer === "focus")`), disparar un sonido suave. Usar la Web Audio API para generar un tono suave (sin archivos externos): crear un oscilador con `AudioContext`, tipo `sine`, frecuencia ~440Hz, con fade-out suave de ~2 segundos. Encapsular esto en un helper `src/utils/playEndSound.ts` y llamarlo tanto al terminar el timer de focus como el de pomodoro.

---

## 🚀 Fase 4 — Features Complejas

> Requieren coordinación entre múltiples componentes o lógica de estado nueva.

---

### 4.1 — Modal de registro de bloque al finalizar sesión de Enfoque

Cuando una sesión de Deep Work o Shallow Work termina (el timer llega a 0 en `globalTimerStore`, `activeTimer === "focus"`), abrir automáticamente el `BlockModal` del calendario pre-completado con:
- `startTime`: hora actual menos la duración real de la sesión (`timeElapsedMs` convertido a HH:mm)
- `endTime`: hora actual
- `type`: según `focusConfig.focusType` ("deep" → "deep-work", "shallow" → "shallow-work")
- Campo para nombre de la actividad (title)
- Campo para categoría

Para implementarlo: agregar un estado global o un evento (puede ser un Zustand store simple `focusCompletionStore`) que indique que hay una sesión pendiente de registrar. En el layout principal (`MainLayout.tsx`), escuchar ese estado y renderizar el `BlockModal` cuando corresponda, pasándole los valores pre-completados como props.

---

### 4.2 — Server-Side Rendering (SSR)

Migrar el proyecto de Vite SPA a un framework con SSR. Las opciones según el stack actual (React + TypeScript + Supabase) son:

**Opción recomendada: Next.js App Router**
1. Crear un nuevo proyecto Next.js con `npx create-next-app@latest` usando TypeScript y Tailwind.
2. Migrar páginas de `src/pages/` a `app/` con la convención de Next.js.
3. Migrar componentes de `src/components/` directamente (son compatibles).
4. Migrar stores de Zustand (son compatibles, pero los stores con `persist` deben inicializarse solo en cliente con `'use client'`).
5. Configurar Supabase SSR con `@supabase/ssr` para manejar la sesión del servidor.
6. Convertir las páginas de contenido estático/semi-estático a Server Components.
7. Mantener los componentes interactivos (timers, modales, formularios) como Client Components.

---

## 📋 Resumen por Fase

| Fase | Ítems | Complejidad |
|------|-------|-------------|
| Fase 1 — UI Rápida | 1.1, 1.2, 1.3, 1.4 | 🟢 Baja |
| Fase 2 — Fixes de Lógica | 2.1, 2.2, 2.3, 2.4, 2.5, 2.6 | 🟡 Media |
| Fase 3 — UX Nueva | 3.1, 3.2, 3.3 | 🟡 Media-Alta |
| Fase 4 — Features Complejas | 4.1, 4.2 | 🔴 Alta |