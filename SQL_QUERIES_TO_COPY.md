# 📋 SQL Queries para Supabase - Copiar y Pegar

## Instrucciones Rápidas

1. Ve a tu proyecto en Supabase
2. Click en **SQL Editor** (menú lateral)
3. Click en **New Query**
4. Copia **TODO** el contenido de este archivo
5. Pégalo en el editor
6. Click en **Run** o presiona `Ctrl+Enter`

---

## ⚠️ IMPORTANTE

- Ejecuta TODO el script de una sola vez
- NO lo ejecutes en partes
- Verás "Success. No rows returned" si todo salió bien
- El script incluye `IF NOT EXISTS` y `DROP IF EXISTS`, así que es seguro ejecutarlo múltiples veces

---

## 🗄️ SQL COMPLETO - COPIA TODO ESTO ⬇️

\`\`\`sql
-- =============================================
-- ENFOQUE V2 - SUPABASE DATABASE SETUP
-- =============================================

-- 1. CREAR TABLAS
CREATE TABLE IF NOT EXISTS categories (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
name TEXT NOT NULL,
color TEXT NOT NULL,
created_at TIMESTAMPTZ DEFAULT NOW(),
CONSTRAINT unique_user_category UNIQUE (user_id, name)
);

CREATE TABLE IF NOT EXISTS calendar_blocks (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
title TEXT NOT NULL,
type TEXT NOT NULL CHECK (type IN ('deep', 'shallow', 'other')),
category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
start_time TIMESTAMPTZ NOT NULL,
end_time TIMESTAMPTZ NOT NULL,
color TEXT,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS focus_sessions (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
type TEXT NOT NULL CHECK (type IN ('deep', 'shallow')),
duration_minutes INTEGER NOT NULL,
actual_minutes INTEGER,
distractions_count INTEGER DEFAULT 0,
created_at TIMESTAMPTZ DEFAULT NOW(),
session_date DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
title TEXT NOT NULL,
category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
due_date DATE,
completed BOOLEAN DEFAULT FALSE,
parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
order_index INTEGER DEFAULT 0,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pomodoro_sessions (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
total_work_minutes INTEGER NOT NULL,
total_break_minutes INTEGER,
created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CREAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_calendar_user_date ON calendar_blocks(user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_focus_user_date ON focus_sessions(user_id, session_date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_category ON tasks(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_user_date ON pomodoro_sessions(user_id, created_at);

-- 3. FUNCIÓN PARA UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = NOW();
RETURN NEW;
END;

$$
LANGUAGE plpgsql;

-- 4. TRIGGERS PARA UPDATED_AT
DROP TRIGGER IF EXISTS update_calendar_blocks_updated_at ON calendar_blocks;
CREATE TRIGGER update_calendar_blocks_updated_at
  BEFORE UPDATE ON calendar_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. HABILITAR RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;

-- 6. POLÍTICAS RLS - CATEGORIES
DROP POLICY IF EXISTS "Users can view own categories" ON categories;
CREATE POLICY "Users can view own categories" ON categories FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
CREATE POLICY "Users can insert own categories" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own categories" ON categories;
CREATE POLICY "Users can update own categories" ON categories FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own categories" ON categories;
CREATE POLICY "Users can delete own categories" ON categories FOR DELETE USING (auth.uid() = user_id);

-- 7. POLÍTICAS RLS - CALENDAR_BLOCKS
DROP POLICY IF EXISTS "Users can view own blocks" ON calendar_blocks;
CREATE POLICY "Users can view own blocks" ON calendar_blocks FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own blocks" ON calendar_blocks;
CREATE POLICY "Users can insert own blocks" ON calendar_blocks FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own blocks" ON calendar_blocks;
CREATE POLICY "Users can update own blocks" ON calendar_blocks FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own blocks" ON calendar_blocks;
CREATE POLICY "Users can delete own blocks" ON calendar_blocks FOR DELETE USING (auth.uid() = user_id);

-- 8. POLÍTICAS RLS - FOCUS_SESSIONS
DROP POLICY IF EXISTS "Users can view own focus sessions" ON focus_sessions;
CREATE POLICY "Users can view own focus sessions" ON focus_sessions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own focus sessions" ON focus_sessions;
CREATE POLICY "Users can insert own focus sessions" ON focus_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own focus sessions" ON focus_sessions;
CREATE POLICY "Users can update own focus sessions" ON focus_sessions FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own focus sessions" ON focus_sessions;
CREATE POLICY "Users can delete own focus sessions" ON focus_sessions FOR DELETE USING (auth.uid() = user_id);

-- 9. POLÍTICAS RLS - TASKS
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
CREATE POLICY "Users can insert own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;
CREATE POLICY "Users can delete own tasks" ON tasks FOR DELETE USING (auth.uid() = user_id);

-- 10. POLÍTICAS RLS - POMODORO_SESSIONS
DROP POLICY IF EXISTS "Users can view own pomodoro sessions" ON pomodoro_sessions;
CREATE POLICY "Users can view own pomodoro sessions" ON pomodoro_sessions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own pomodoro sessions" ON pomodoro_sessions;
CREATE POLICY "Users can insert own pomodoro sessions" ON pomodoro_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own pomodoro sessions" ON pomodoro_sessions;
CREATE POLICY "Users can update own pomodoro sessions" ON pomodoro_sessions FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own pomodoro sessions" ON pomodoro_sessions;
CREATE POLICY "Users can delete own pomodoro sessions" ON pomodoro_sessions FOR DELETE USING (auth.uid() = user_id);

-- 11. CATEGORÍAS POR DEFECTO AL REGISTRARSE
CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER AS
$$

BEGIN
INSERT INTO categories (user_id, name, color) VALUES
(NEW.id, 'Trabajo', '#3B82F6'),
(NEW.id, 'Estudio', '#8B5CF6'),
(NEW.id, 'Personal', '#10B981'),
(NEW.id, 'Reuniones', '#F59E0B');
RETURN NEW;
END;

$$
LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS create_categories_on_signup ON auth.users;
CREATE TRIGGER create_categories_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_categories();
\`\`\`

---

## ✅ Verificación Post-Ejecución

Después de ejecutar el script, verifica que todo esté bien:

### 1. Ve a **Table Editor**
Deberías ver estas 5 tablas:
- ✓ categories
- ✓ calendar_blocks
- ✓ focus_sessions
- ✓ tasks
- ✓ pomodoro_sessions

### 2. Verifica RLS en cada tabla
Click en cada tabla → pestaña "Policies"

Cada una debe tener 4 políticas:
- ✓ Users can view own [tabla]
- ✓ Users can insert own [tabla]
- ✓ Users can update own [tabla]
- ✓ Users can delete own [tabla]

### 3. Ejecuta queries de prueba

En el SQL Editor, ejecuta esto para verificar:

\`\`\`sql
-- Verificar estructura de calendar_blocks
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'calendar_blocks';

-- Verificar triggers
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
\`\`\`

---

## 🔥 Si algo sale mal

### Error: "permission denied for schema public"

**Solución**: Ejecuta este comando primero:

\`\`\`sql
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;
\`\`\`

### Error: "relation already exists"

**Solución**: Es normal si ejecutas el script múltiples veces. El script está diseñado para ser idempotente (seguro ejecutarlo varias veces).

---

## 📞 Siguientes Pasos

1. ✅ Ejecutar este SQL en Supabase
2. ✅ Verificar que las tablas existan
3. ✅ Obtener tus credenciales (URL + Anon Key)
4. ✅ Configurar el archivo `.env`
5. ✅ Reiniciar el servidor de desarrollo
6. ✅ Probar crear un bloque en el calendario

**Referencia completa**: Ver `SUPABASE_SETUP_INSTRUCTIONS.md`

---

**¡Listo para copiar y pegar!** 🚀
$$
