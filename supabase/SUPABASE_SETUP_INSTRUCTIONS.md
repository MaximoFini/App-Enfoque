# Enfoque V2 - Setup de Base de Datos (Supabase)

## Paso 1: Crear Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Inicia sesión o crea una cuenta
3. Click en "New Project"
4. Completa:
   - **Name**: enfoque-v2 (o el nombre que prefieras)
   - **Database Password**: Genera una contraseña segura y guárdala
   - **Region**: Elige la región más cercana a ti
5. Click en "Create new project" y espera 2-3 minutos

---

## Paso 2: Ejecutar el Script SQL

1. En tu proyecto de Supabase, ve a la sección **SQL Editor** (menú lateral izquierdo)
2. Click en "New Query"
3. Copia **TODO** el contenido del archivo `supabase-setup.sql` que está en la raíz del proyecto
4. Pégalo en el editor SQL
5. Click en "Run" o presiona `Ctrl+Enter`
6. Deberías ver el mensaje: "Success. No rows returned"

---

## Paso 3: Verificar las Tablas Creadas

1. Ve a **Table Editor** en el menú lateral
2. Deberías ver las siguientes tablas:
   - ✅ `categories`
   - ✅ `calendar_blocks`
   - ✅ `focus_sessions`
   - ✅ `tasks`
   - ✅ `pomodoro_sessions`

3. **IMPORTANTE**: Verifica que el RLS (Row Level Security) esté habilitado:
   - Click en cada tabla
   - Ve a "Policies" (pestaña arriba)
   - Deberías ver 4 políticas: SELECT, INSERT, UPDATE, DELETE
   - Todas deben tener el ícono verde ✓

---

## Paso 4: Obtener las Credenciales

### 4.1 Obtener la URL del Proyecto

1. Ve a **Settings** > **API** (menú lateral)
2. En la sección "Project URL", copia la URL que se ve así:
   ```
   https://xxxxxxxxxxx.supabase.co
   ```
3. Guárdala para el siguiente paso

### 4.2 Obtener el Anon Key

1. En la misma página (**Settings > API**)
2. En la sección "Project API keys", copia el **anon public** key
3. Es un string largo que empieza con `eyJ...`

---

## Paso 5: Configurar las Variables de Entorno

### Opción A: Usar el archivo .env existente

Ya tienes un archivo `.env` en el proyecto con estas variables:

```env
VITE_SUPABASE_URL=https://sxqlrxxljnjgyrwaudrp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

**Reemplaza los valores** con las credenciales de TU proyecto:

1. Abre `c:\Users\Maximo\Documents\EnfoqueV2\.env`
2. Reemplaza `VITE_SUPABASE_URL` con la URL que copiaste en el Paso 4.1
3. Reemplaza `VITE_SUPABASE_ANON_KEY` con el Anon Key que copiaste en el Paso 4.2
4. Guarda el archivo

### Opción B: Si no existe el archivo .env

1. Crea un archivo llamado `.env` en la raíz del proyecto
2. Agrega estas líneas (reemplazando con tus valores):

```env
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_ANON_KEY_AQUI
```

---

## Paso 6: Reiniciar el Servidor de Desarrollo

1. Detén el servidor si está corriendo (Ctrl+C en la terminal)
2. Vuelve a ejecutar:
   ```bash
   npm run dev
   ```
3. Esto cargará las nuevas variables de entorno

---

## Paso 7: Probar la Conexión

1. Abre la aplicación en `http://localhost:5176` (o el puerto que te indique)
2. Inicia sesión o regístrate
3. Ve a `/calendario`
4. Intenta crear un nuevo bloque:
   - Click en cualquier celda vacía
   - Completa el formulario
   - Click en "Crear Bloque"
5. ✅ Si el bloque aparece en el calendario, **¡todo funciona!**
6. ❌ Si hay un error, verifica:
   - La consola del navegador (F12 → Console)
   - Que las credenciales en `.env` sean correctas
   - Que hayas reiniciado el servidor después de editar `.env`

---

## Verificación de Categorías Por Defecto

Al registrarte, deberían crearse automáticamente 4 categorías:

- Trabajo (Azul)
- Estudio (Violeta)
- Personal (Verde)
- Reuniones (Naranja)

Para verificar:

1. Crea un bloque
2. Abre el selector de "Categoría"
3. Deberías ver las 4 categorías listadas

---

## Solución de Problemas Comunes

### Error: "Failed to fetch" o "Network Error"

**Causa**: La URL de Supabase está mal configurada

**Solución**:

1. Verifica que `VITE_SUPABASE_URL` en `.env` sea correcta
2. NO debe terminar con `/`
3. Reinicia el servidor

---

### Error: "Invalid API key"

**Causa**: El Anon Key está mal copiado

**Solución**:

1. Ve a Supabase → Settings → API
2. Copia de nuevo el **anon** key (no el service_role)
3. Actualiza `VITE_SUPABASE_ANON_KEY` en `.env`
4. Reinicia el servidor

---

### Error: "Row Level Security policy violation"

**Causa**: Las políticas RLS no se crearon correctamente

**Solución**:

1. Ve a Supabase → Table Editor
2. Selecciona la tabla con problema (ej: `calendar_blocks`)
3. Ve a "Policies"
4. Asegúrate que haya 4 políticas (SELECT, INSERT, UPDATE, DELETE)
5. Si faltan, ejecuta nuevamente el script SQL completo

---

### Los bloques no se guardan

**Posibles causas**:

1. No estás autenticado → Verifica que iniciaste sesión
2. RLS está bloqueando → Verifica las políticas
3. Error en los datos → Abre la consola (F12) y busca mensajes de error

---

## Estructura de Tablas (Referencia Rápida)

### calendar_blocks

- **id**: UUID (auto)
- **user_id**: UUID (ref: auth.users)
- **title**: TEXT
- **type**: 'deep' | 'shallow' | 'other'
- **category_id**: UUID (ref: categories, nullable)
- **start_time**: TIMESTAMPTZ
- **end_time**: TIMESTAMPTZ
- **color**: TEXT (nullable)
- **created_at**: TIMESTAMPTZ
- **updated_at**: TIMESTAMPTZ

### categories

- **id**: UUID (auto)
- **user_id**: UUID (ref: auth.users)
- **name**: TEXT
- **color**: TEXT
- **created_at**: TIMESTAMPTZ

---

## Próximos Pasos

Una vez que todo funcione:

1. ✅ Crear bloques en el calendario
2. ✅ Editar bloques existentes
3. ✅ Eliminar bloques
4. ✅ Cambiar entre semanas con `<` `>`
5. ⏭️ Continuar con el Módulo Pomodoro (Fase 4)
6. ⏭️ Continuar con el Módulo Enfoque (Fase 6)
7. ⏭️ Continuar con el Módulo Tareas (Fase 7)

---

## Comandos de Verificación en Supabase

Si quieres verificar manualmente los datos en SQL Editor:

```sql
-- Ver todas tus categorías
SELECT * FROM categories;

-- Ver todos tus bloques
SELECT * FROM calendar_blocks ORDER BY start_time DESC LIMIT 10;

-- Contar bloques por tipo
SELECT type, COUNT(*) as total
FROM calendar_blocks
GROUP BY type;

-- Ver bloques de esta semana
SELECT title, start_time, end_time, type
FROM calendar_blocks
WHERE start_time >= date_trunc('week', NOW())
ORDER BY start_time;
```

---

**¡Listo!** Tu base de datos está configurada y lista para usar. 🚀
