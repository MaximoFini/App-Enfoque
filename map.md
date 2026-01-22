# Especificación Completa - Aplicación de Productividad

## 1. Stack Tecnológico

### Frontend

- **Framework**: React 18+ con TypeScript
- **Build Tool**: Vite
- **Estilos**: Tailwind CSS
- **Gestión de Estado**: Zustand
- **Manipulación de Fechas**: date-fns
- **Drag & Drop**: @dnd-kit/core
- **UI Components**: Radix UI o Headless UI
- **Iconos**: Lucide React
- **Routing**: React Router v6

### Backend

- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Cliente**: @supabase/supabase-js

### Deployment

- **Hosting**: Vercel o Netlify
- **Backend**: Supabase Cloud

---

## Fase 2. Sistema de Autenticación

### Funcionalidades de Login

- **Registro de usuarios**: Email + Password
- **Login**: Email + Password
- **Recuperación de contraseña**: Reset por email
- **Sesión persistente**: Mantener usuario logueado
- **Logout**: Cerrar sesión

### Flujo de Autenticación

1. Usuario ingresa a la app
2. Si no está autenticado → Pantalla de Login/Register
3. Si está autenticado → Redirigir a /calendario
4. Todas las rutas protegidas requieren autenticación
5. Los datos son específicos por usuario (row-level security)

### Páginas de Auth

- `/login` - Formulario de login
- `/register` - Formulario de registro
- `/reset-password` - Recuperar contraseña

---

## Fase 3.1 Módulo: /calendario

### Funcionalidades Principales

#### Inserción de Bloques

- **Campos del formulario**:
  - Título (texto)
  - Tipo de trabajo: Deep Work | Shallow Work | Otro
  - Categoría (selector dinámico desde BD)
  - Duración (inicio y fin)
  - Color (solo si tipo = "Otro", 6 opciones predefinidas)

#### Visualización Tipo Google Calendar

- Vista semanal por defecto
- Columnas: días de la semana
- Filas: horas del día (considera desde 00.00hs hasta 24.00hs, sin mostrar las 00 ni las 24, estilo google calendar)
- Línea roja indicando hora actual (actualización en tiempo real)
- Mes y año visibles en header
- Navegación: botones `<` `>` para cambiar semanas

#### Interacciones con Bloques

1. **Crear bloque**: Click en celda vacía → Modal de creación
2. **Editar bloque**: Click en bloque existente → Modal de edición
3. **Copiar/Pegar**: Ctrl+C en bloque, Ctrl+V en otra celda
4. **Arrastrar bloque**: Click sostenido + mover mouse → cambiar horario
5. **Redimensionar**: Hover en borde inferior → cursor resize → arrastrar arriba/abajo
   - Borde superior siempre fijo
   - Ajuste en intervalos de 15 minutos

#### Sistema de Colores

- **Deep Work**: Violeta (#8B5CF6 o similar)
- **Shallow Work**: Verde (#10B981 o similar)
- **Otro**: 6 colores a elegir
  - Azul (#3B82F6)
  - Rojo (#EF4444)
  - Amarillo (#F59E0B)
  - Rosa (#EC4899)
  - Naranja (#F97316)
  - Gris (#6B7280)

#### Granularidad de Tiempo

- Permitir bloques que empiecen/terminen en :00, :15, :30, :45
- Ejemplo válido: 15:15 - 16:45

---

## Fase 3.2 Módulo: /calendario

#### Inserción de Bloques

- **Campos del formulario**:
  - Título (texto)
  - Tipo de trabajo: Deep Work | Shallow Work | Otro
  - Categoría (selector dinámico desde BD)
  - Duración (inicio y fin)
  - Color (solo si tipo = "Otro", 6 opciones predefinidas)

---

## Fase 4. Módulo: /pomodoro

### Funcionalidades del Temporizador

#### Configuración

- **Duración Pomodoro**: 15-90 minutos (ajustable solo cuando está pausado)
- **Duración Descanso**: 5-20 minutos (ajustable solo cuando está pausado)
- **Modo por defecto**: 25 min Pomodoro / 5 min Descanso

#### Comportamiento Autoplay

1. Usuario inicia Pomodoro (25 min)
2. Al llegar a 0:00 → Automáticamente cambia a Descanso (5 min)
3. Descanso termina → Automáticamente vuelve a Pomodoro (25 min)
4. Ciclo continuo hasta que usuario pause

#### Controles

- **Botón Play/Pause**: Iniciar o detener temporizador
- **Botón Guardar**: Solo visible cuando pausado y hay tiempo acumulado

#### Variables a Trackear

- `tiempoTotalPomodoro`: Suma de todos los minutos en modo Pomodoro (excluyendo breaks)
- `estadoActual`: "pomodoro" | "break" | "pausado"

#### Visualización

- Temporizador grande central (formato MM:SS)
- Indicador del modo actual: "Pomodoro" o "Descanso"
- Barra de progreso circular
- Contador de pomodoros completados en la sesión en minutos

---

## 5. Conexión Pomodoro ↔ Calendario

### Flujo de Guardado

1. Usuario trabaja con Pomodoro
2. Acumula tiempo (ej: 21 minutos netos de Pomodoro)
3. Usuario pausa el temporizador
4. Aparece botón **"Guardar en Calendario"**
5. Al hacer click:
   - Se calcula hora de inicio = hora_actual - tiempo_total_pomodoro
   - Se aplica **redondeo de 15 minutos**
   - Se crea bloque en /calendario con:
     - **Título**: "Estudio"
     - **Tipo**: "Otro"
     - **Categoría**: "Estudio" (debe existir en BD)
     - **Inicio**: hora_redondeada
     - **Fin**: hora_actual (también redondeada)

### Lógica de Redondeo (Intervalos de 15 min)

```
Regla: Redondear al cuarto de hora más cercano

Ejemplos:
14:44 → 14:45
14:43 → 14:45
14:42 → 14:30
14:38 → 14:45
14:37 → 14:30
14:33 → 14:30
14:31 → 14:30

Fórmula:
- Si minutos >= 38 y <= 52 → redondear a :45
- Si minutos >= 53 o <= 7 → redondear a :00
- Si minutos >= 8 y <= 22 → redondear a :15
- Si minutos >= 23 y <= 37 → redondear a :30
```

### Ejemplo Completo

- Hora actual: 15:00
- Tiempo Pomodoro acumulado: 21 minutos
- Cálculo inicio: 15:00 - 21 min = 14:39
- Redondeo: 14:39 → **14:45**
- Bloque creado: 14:45 - 15:00 (Estudio, Otro)

---

## 6. Módulo: /enfoque

### Selección Inicial

1. **Tipo de sesión**: Deep Work | Shallow Work
2. **Duración**: Selector de minutos (15-180 min)
3. **Botón Comenzar**: Inicia el temporizador

### Temporizador para deep work y shallow work

- Diseño visual idéntico a /pomodoro
- Cuenta regresiva desde duración elegida hasta 0
- Botones: Play/Pause, Reset
- **NO hay autoplay**: Al llegar a 0 se detiene

### Cuando el usuario selecciona Deep Work

### Registro de Distracciones (solo Deep Work)

#### Interfaz

- **Botón "Registrar Distracción"**: Solo visible durante sesiones de Deep Work activas
- Contador visual: "Distracciones: X"
- Click en botón → incrementa contador

#### Guardado en BD

Al finalizar sesión (llegar a 0 o pausar y guardar):

- Guardar registro con:
  - `user_id`
  - `tipo`: "deep"
  - `duracion`: minutos de la sesión
  - `distracciones`: cantidad registrada
  - `fecha`: timestamp

### Estadísticas de Distracciones cuando el trabajo es Deep Work

#### Cálculo Semanal

- **Periodo**: Lunes 00:00 - Domingo 23:59
- **Datos a sumar**:
  - Total horas Deep Work en la semana
  - Total distracciones en la semana
- **Fórmula**: `promedio = total_distracciones / total_horas`
- **Formato**: X.XX distracciones/hora (2 decimales)

#### Comparación entre Semanas

- Mostrar grafico de barras comparando las semanas de a 4
- Permitir navegar de a meses (4 semanas) de la misma manera que se hace en el calendario
- Ejemplo:

#### Visualización de la comparacion entre semanas

- Zona debajo del temporizador
- Card con estadísticas
- Gráfico de barras simple: últimas 4 semanas con navegacion

### Cuando el usuario selecciona Shallow Work

#### Guardado en BD

Al finalizar sesión (llegar a 0 o pausar y guardar):

- Guardar registro con:
  - `user_id`
  - `tipo`: "shallow"
  - `duracion`: minutos de la sesión
  - `distracciones`: cantidad registrada
  - `fecha`: timestamp

---

## 7. Módulo: /tareas

### Estructura Visual

- Layout de columnas por Categoría (como Google Tasks)
- Tienen que poder verse 3 categorias sin necesidad de hacer scroll horizontal
- Scroll horizontal si hay mas de 3 categorias mostrandose
- Filtros superiores: Toggle on/off para mostrar/ocultar columnas

### Funcionalidades de Tareas

#### Campos de Tarea

- **Título**: Texto principal
- **Categoría**: Asociada a columna
- **Prioridad**: Alta | Media | Baja
- **Fecha límite**: DatePicker
- **Completada**: Checkbox
- **Subtareas**: Array infinito (recursivo)

#### Visualización de Subtareas

- Indentación visual (16px por nivel)
- Icono de expandir/colapsar si tiene subtareas
- Ejemplo:
  ```
  □ Tarea principal
    □ Subtarea nivel 1
      □ Subtarea nivel 2
        □ Subtarea nivel 3
  ```

#### Tareas Completadas

- Al marcar como completada → mover al final de la columna
- Sección colapsable "Completadas (X)"
- Mantienen su categoría

#### Interacciones

1. **Crear tarea**: Botón "+" en cada columna → Modal
2. **Editar tarea**: Click en tarea → Modal completo
3. **Crear subtarea**: Botón en modal o menú contextual
4. **Completar tarea**: Click en checkbox
5. **Eliminar tarea**: Botón en modal (con confirmación)
6. **Reordenar**: Drag & drop dentro de columna

### Modal de Crear/Editar

- Título (input grande)
- Categoría (select)
- Prioridad (3 botones: Alta/Media/Baja)
- Fecha límite (date picker)
- Lista de subtareas (con + para agregar)
- Botones: Guardar | Cancelar | Eliminar (solo en edición)

---

## 8. Navegación y Layout

### Estructura de Rutas

```
/ (redirect a /calendario si autenticado, sino a /login)
/login
/register
/reset-password

/calendario (protegida)
/pomodoro (protegida)
/enfoque (protegida)
/tareas (protegida)
```

### Layout Principal (después de login)

- **Sidebar izquierdo** (fixed):
  - Logo/Nombre app
  - Links: Calendario, Pomodoro, Enfoque, Tareas
  - Botón Logout (abajo)
- **Contenido principal** (scroll):
  - Header con título de sección
  - Contenido dinámico según ruta

---

## 9. Estructura de Base de Datos (Supabase)

### Tabla: `users`

- Generada automáticamente por Supabase Auth
- Campos principales: `id`, `email`, `created_at`

### Tabla: `categories`

| Campo      | Tipo        | Descripción                    |
| ---------- | ----------- | ------------------------------ |
| id         | UUID        | Primary Key                    |
| user_id    | UUID        | Foreign Key → auth.users       |
| name       | TEXT        | Nombre de la categoría         |
| color      | TEXT        | Código hexadecimal para tareas |
| created_at | TIMESTAMPTZ | Fecha de creación              |

**Constraints:**

- UNIQUE(user_id, name) - No duplicar nombres por usuario
- ON DELETE CASCADE en user_id

---

### Tabla: `calendar_blocks`

| Campo       | Tipo        | Descripción                         |
| ----------- | ----------- | ----------------------------------- |
| id          | UUID        | Primary Key                         |
| user_id     | UUID        | Foreign Key → auth.users            |
| title       | TEXT        | Título del bloque                   |
| type        | TEXT        | 'deep' \| 'shallow' \| 'other'      |
| category_id | UUID        | Foreign Key → categories (nullable) |
| start_time  | TIMESTAMPTZ | Hora de inicio                      |
| end_time    | TIMESTAMPTZ | Hora de fin                         |
| color       | TEXT        | Color hex (solo si type='other')    |
| created_at  | TIMESTAMPTZ | Fecha de creación                   |
| updated_at  | TIMESTAMPTZ | Última actualización                |

**Constraints:**

- CHECK: type IN ('deep', 'shallow', 'other')
- ON DELETE CASCADE en user_id
- ON DELETE SET NULL en category_id

**Índices:**

- idx_calendar_user_date(user_id, start_time)

---

### Tabla: `focus_sessions`

| Campo              | Tipo        | Descripción                           |
| ------------------ | ----------- | ------------------------------------- |
| id                 | UUID        | Primary Key                           |
| user_id            | UUID        | Foreign Key → auth.users              |
| type               | TEXT        | 'deep' \| 'shallow'                   |
| duration_minutes   | INTEGER     | Duración planificada                  |
| actual_minutes     | INTEGER     | Duración real (nullable)              |
| distractions_count | INTEGER     | Contador de distracciones (default 0) |
| created_at         | TIMESTAMPTZ | Fecha de creación                     |
| session_date       | DATE        | Fecha de la sesión                    |

**Constraints:**

- CHECK: type IN ('deep', 'shallow')
- ON DELETE CASCADE en user_id

**Índices:**

- idx_focus_user_date(user_id, session_date)

---

### Tabla: `tasks`

| Campo          | Tipo        | Descripción                                     |
| -------------- | ----------- | ----------------------------------------------- |
| id             | UUID        | Primary Key                                     |
| user_id        | UUID        | Foreign Key → auth.users                        |
| title          | TEXT        | Título de la tarea                              |
| category_id    | UUID        | Foreign Key → categories (nullable)             |
| priority       | TEXT        | 'high' \| 'medium' \| 'low' (default: 'medium') |
| due_date       | DATE        | Fecha límite (nullable)                         |
| completed      | BOOLEAN     | Estado de completado (default false)            |
| parent_task_id | UUID        | Foreign Key → tasks (nullable, para subtareas)  |
| order_index    | INTEGER     | Orden dentro de columna (default 0)             |
| created_at     | TIMESTAMPTZ | Fecha de creación                               |
| updated_at     | TIMESTAMPTZ | Última actualización                            |

**Constraints:**

- CHECK: priority IN ('high', 'medium', 'low')
- ON DELETE CASCADE en user_id y parent_task_id
- ON DELETE SET NULL en category_id

**Índices:**

- idx_tasks_user_category(user_id, category_id)
- idx_tasks_parent(parent_task_id)

---

### Tabla: `pomodoro_sessions` (opcional)

| Campo               | Tipo        | Descripción                             |
| ------------------- | ----------- | --------------------------------------- |
| id                  | UUID        | Primary Key                             |
| user_id             | UUID        | Foreign Key → auth.users                |
| total_work_minutes  | INTEGER     | Total de minutos de trabajo             |
| total_break_minutes | INTEGER     | Total de minutos de descanso (nullable) |
| created_at          | TIMESTAMPTZ | Fecha de creación                       |

**Constraints:**

- ON DELETE CASCADE en user_id

**Índices:**

- idx_pomodoro_user_date(user_id, created_at)

---

### Row Level Security (RLS)

**Habilitar RLS en todas las tablas** para que cada usuario solo acceda a sus propios datos.

**Políticas a crear para cada tabla:**

- SELECT: `auth.uid() = user_id`
- INSERT: `auth.uid() = user_id`
- UPDATE: `auth.uid() = user_id`
- DELETE: `auth.uid() = user_id`

---

### Triggers

**Actualizar `updated_at` automáticamente:**

- Aplicar a: `calendar_blocks`, `tasks`
- Función: Actualiza `updated_at` a NOW() en cada UPDATE

---

## 10. Consideraciones de UX

### Estados de Carga

- Skeleton loaders para calendario y tareas
- Spinners para acciones (guardar, eliminar)
- Mensajes de confirmación (toast notifications)

### Validaciones

- Bloques de calendario no pueden solaparse
- Fechas de inicio < fechas de fin
- Títulos no vacíos
- Duraciones en rangos válidos

### Responsive Design

- Mobile: Tabs para navegar entre módulos
- Tablet: Sidebar colapsable
- Desktop: Sidebar fijo + contenido amplio

### Accesibilidad

- Keyboard navigation
- ARIA labels
- Color contrast ratios
- Focus indicators

---

## 10. Implementación de AI Agents

### ¿Qué son los Agents?

Los agents permiten delegar tareas complejas a Claude directamente desde tu aplicación. Claude puede analizar datos, generar insights y ejecutar acciones basadas en el contexto del usuario.

### Agents Recomendados para el Proyecto

#### 1. **Agent de Análisis de Distracciones** (Prioridad Alta)

**Ubicación**: Módulo `/enfoque`

**Propósito**: Analizar patrones de distracciones y generar insights personalizados.

**Capabilities**:

```javascript
// En el componente de /enfoque
const analyzeDistractions = async () => {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `Analiza estos datos de sesiones Deep Work:
            
            ${JSON.stringify(focusSessionsData)}
            
            Por favor:
            1. Calcula el promedio de distracciones/hora esta semana vs semana anterior
            2. Identifica patrones (¿qué días hay más distracciones?)
            3. Dame 2-3 recomendaciones concretas para mejorar
            
            Responde en JSON con esta estructura:
            {
              "semanaActual": { "promedio": 1.33, "totalHoras": 7.5 },
              "semanaAnterior": { "promedio": 1.67, "totalHoras": 6.0 },
              "mejora": "+20%",
              "patrones": ["Más distracciones los lunes", "..."],
              "recomendaciones": ["Desactiva notificaciones", "..."]
            }`,
        },
      ],
    }),
  });

  const data = await response.json();
  const analysis = JSON.parse(data.content[0].text);
  return analysis;
};
```

**UI Resultante**:

- Card con estadísticas calculadas por Claude
- Sección "Patrones detectados" con bullet points
- Sección "Recomendaciones personalizadas"

---

#### 2. **Agent de Planificación Semanal** (Prioridad Media)

**Ubicación**: Nuevo módulo `/insights` o botón en `/calendario`

**Propósito**: Ayudar al usuario a planificar su semana basándose en sus objetivos y disponibilidad.

**Capabilities**:

```javascript
const generateWeekPlan = async (goals, availability) => {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `Objetivos del usuario:
            - ${goals.deepWorkHours} horas de Deep Work esta semana
            - Categorías prioritarias: ${goals.categories.join(", ")}
            
            Bloques actuales en calendario:
            ${JSON.stringify(currentBlocks)}
            
            Por favor sugiere cómo distribuir el tiempo restante.
            Responde SOLO en JSON:
            {
              "sugerencias": [
                {
                  "dia": "Lunes",
                  "inicio": "09:00",
                  "fin": "11:00",
                  "tipo": "deep",
                  "razon": "Mañana sin reuniones, ideal para trabajo profundo"
                }
              ],
              "resumen": "Te faltan 8 horas de Deep Work. Aquí hay 4 bloques óptimos."
            }`,
        },
      ],
    }),
  });

  const data = await response.json();
  return JSON.parse(data.content[0].text);
};
```

**Flujo de Usuario**:

1. Usuario hace click en "Planificar mi semana"
2. Modal pregunta: "¿Cuántas horas de Deep Work quieres esta semana?"
3. Claude analiza calendario actual y sugiere bloques
4. Usuario puede aceptar sugerencias (crear bloques automáticamente) o ajustar

---

#### 3. **Agent de Detección de Conflictos** (Prioridad Baja)

**Ubicación**: Al crear/mover bloques en `/calendario`

**Propósito**: Validar que no haya solapamientos y sugerir alternativas.

**Capabilities**:

```javascript
const checkConflicts = async (newBlock, existingBlocks) => {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `Nuevo bloque: ${JSON.stringify(newBlock)}
            Bloques existentes: ${JSON.stringify(existingBlocks)}
            
            ¿Hay conflictos de horario? Si sí, sugiere 3 horarios alternativos.
            Responde en JSON:
            {
              "conflicto": true/false,
              "mensaje": "Se solapa con 'Reunión Equipo'",
              "alternativas": ["14:00-15:30", "16:00-17:30", "..."]
            }`,
        },
      ],
    }),
  });

  const data = await response.json();
  return JSON.parse(data.content[0].text);
};
```

---

#### 4. **Agent de Reportes Semanales** (Prioridad Media)

**Ubicación**: Nuevo módulo `/dashboard` o `/insights`

**Propósito**: Generar un reporte semanal automático con análisis y recomendaciones.

**Capabilities**:

```javascript
const generateWeeklyReport = async () => {
  // Obtener todos los datos de la semana
  const calendarData = await fetchCalendarBlocks(thisWeek);
  const focusData = await fetchFocusSessions(thisWeek);
  const tasksData = await fetchTasks();

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `Genera un reporte semanal basado en estos datos:
            
            Bloques de calendario: ${JSON.stringify(calendarData)}
            Sesiones de enfoque: ${JSON.stringify(focusData)}
            Tareas completadas: ${JSON.stringify(tasksData.filter((t) => t.completed))}
            
            Incluye:
            1. Total horas Deep Work vs Shallow Work
            2. Tareas completadas vs pendientes por categoría
            3. Promedio de distracciones (si hay sesiones Deep)
            4. 3 insights clave de la semana
            5. 3 recomendaciones para la próxima semana
            
            Formato libre, escribe como si fueras un coach de productividad.`,
        },
      ],
    }),
  });

  const data = await response.json();
  return data.content[0].text; // Texto en prosa, no JSON
};
```

**UI Resultante**:

- Sección de métricas (con gráficos)
- Card de "Insights de la semana" con texto generado por Claude
- Card de "Recomendaciones" con acciones sugeridas

---

### Consideraciones de Implementación

#### Error Handling

```javascript
try {
  const analysis = await analyzeDistractions();
  setAnalysisData(analysis);
} catch (error) {
  console.error("Error al analizar distracciones:", error);
  // Mostrar mensaje de error al usuario
  toast.error("No se pudo generar el análisis. Intenta de nuevo.");
}
```

#### Loading States

```javascript
const [isAnalyzing, setIsAnalyzing] = useState(false);

const handleAnalyze = async () => {
  setIsAnalyzing(true);
  try {
    const result = await analyzeDistractions();
    setAnalysisData(result);
  } finally {
    setIsAnalyzing(false);
  }
};

// En el UI
{
  isAnalyzing ? (
    <div>Analizando tus datos...</div>
  ) : (
    <button onClick={handleAnalyze}>Analizar Distracciones</button>
  );
}
```

#### Parsing Seguro de JSON

````javascript
const parseAIResponse = (text) => {
  try {
    // Limpiar posibles backticks de markdown
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Error parsing AI response:", error);
    return null;
  }
};
````

#### Costos y Rate Limiting

- Cada llamada a Claude consume tokens (input + output)
- Implementar debouncing/caching para análisis repetitivos
- Considerar almacenar análisis generados en Supabase para reutilizarlos

---

### Estructura de BD para Agents (Opcional)

Si quieres guardar los análisis generados:

#### Tabla: `ai_insights`

| Campo         | Tipo        | Descripción                                              |
| ------------- | ----------- | -------------------------------------------------------- |
| id            | UUID        | Primary Key                                              |
| user_id       | UUID        | Foreign Key → auth.users                                 |
| type          | TEXT        | 'distraction_analysis' \| 'week_plan' \| 'weekly_report' |
| week_start    | DATE        | Semana a la que pertenece                                |
| insights_data | JSONB       | Datos generados por Claude                               |
| created_at    | TIMESTAMPTZ | Fecha de generación                                      |

**Beneficios**:

- No regenerar análisis cada vez que el usuario vuelva a la página
- Comparar insights de semanas pasadas
- Reducir costos de API

---

### Módulos Nuevos Sugeridos

#### `/insights` o `/dashboard`

- Vista general de la semana
- Botón "Generar Reporte Semanal"
- Gráficos de Deep Work vs Shallow Work
- Análisis de distracciones
- Recomendaciones personalizadas

#### Navegación Actualizada

```
/calendario
/pomodoro
/enfoque
/tareas
/insights (nuevo) ← Aquí viven los agents
```

---

## 11. Plan de Implementación Sugerido

1. **Setup inicial**: Vite + React + TypeScript + Tailwind
2. **Configurar Supabase**: Proyecto, tablas, RLS
3. **Auth**: Login/Register/Protected routes
4. **Módulo Calendario**: Grid + CRUD básico
5. **Módulo Pomodoro**: Temporizador + autoplay
6. **Integración Pomodoro → Calendario**
7. **Módulo Enfoque**: Temporizador + distracciones
8. **Módulo Tareas**: Columnas + subtareas
9. **Refinamiento**: Drag & drop, resize, copiar/pegar
10. **Testing y deployment**

---

**¡Proyecto listo para desarrollar!** 🚀
