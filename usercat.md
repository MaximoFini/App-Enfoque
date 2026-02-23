# Prompt: Onboarding de categorías al primer inicio de sesión

Quiero que cuando un usuario inicia sesión por **primera vez**, se le muestre automáticamente el modal de categorías (`CategoryModal`) para que configure las categorías en las que divide su vida (nombre + color). Una vez que cierra el modal o crea al menos una categoría, no debe volver a aparecer en futuros inicios de sesión.

---

## Cómo detectar si es el primer login

No agregar ninguna columna nueva a la base de datos. Usar la siguiente lógica: después de que el usuario se autentica, hacer una consulta a Supabase a la tabla `categories` filtrando por `user_id`. Si el resultado es un array vacío, es el primer login → mostrar el modal. Si ya tiene categorías, no mostrarlo.

---

## Cambios a implementar

### 1. `src/store/categoryStore.ts`

Agregar un nuevo campo de estado `isOnboardingOpen: boolean` y sus acciones `openOnboarding()` / `closeOnboarding()`. Este estado es independiente de `isModalOpen` (que se sigue usando para el botón de categorías del sidebar).

---

### 2. `src/components/categories/CategoryModal.tsx`

El modal actual usa `isModalOpen` del store. Modificarlo para que también se renderice cuando `isOnboardingOpen === true`. Cuando está en modo onboarding, hacer los siguientes ajustes visuales y de comportamiento:

- Cambiar el título del modal a **"Bienvenido — Configurá tus categorías"**
- Agregar un subtítulo debajo: `"Definí las áreas de tu vida. Las usarás en el calendario y en tus tareas."` con estilo de texto pequeño y gris.
- El botón de cerrar (`X`) debe seguir funcionando para cerrar el modal de onboarding.
- Al cerrar (ya sea con el X o porque el usuario creó categorías y después cierra), llamar a `closeOnboarding()`.
- NO cambiar el comportamiento del modal cuando se abre desde el sidebar (flujo `isModalOpen`).

---

### 3. `src/components/ProtectedRoute.tsx`

Después de confirmar que el usuario está autenticado (`user` no es null y `loading` es false), agregar un `useEffect` que:

1. Llame a `fetchCategories()` del `useCategoryStore`.
2. Espere el resultado. Si `categories.length === 0`, llamar a `openOnboarding()`.

Este efecto debe correr solo una vez por montaje (dependencias: `[user?.id]`).

---

### 4. `src/components/layout/MainLayout.tsx`

Asegurarse de que el `CategoryModal` esté renderizado en el layout principal (probablemente ya está, verificar). Si no está, importarlo y agregarlo junto al `FloatingTimer`.

---

## Comportamiento esperado

- Usuario se registra → login → `ProtectedRoute` detecta que no tiene categorías → `openOnboarding()` → `CategoryModal` se abre automáticamente con el título de bienvenida.
- El usuario crea sus categorías y cierra el modal.
- La próxima vez que inicia sesión, `fetchCategories()` devuelve datos → `categories.length > 0` → el modal **no** se abre.
- El botón de "Categorías" del sidebar sigue abriendo el modal normalmente (`openModal()` / `isModalOpen`), sin interferencia.