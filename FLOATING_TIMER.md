# Temporizador Flotante (Picture-in-Picture)

## Característica Implementada

Temporizador flotante tipo "picture-in-picture" para los módulos de **Pomodoro**, **Deep Work** y **Shallow Work**, similar al temporizador de Windows.

## Funcionalidad

### Minimizar Temporizador

1. **Desde /pomodoro o /enfoque**: Click en botón "Minimizar" (icono `picture_in_picture_alt`)
2. El temporizador se convierte en un widget flotante pequeño (280px × ~200px)
3. El contenido principal muestra un mensaje con opción de restaurar

### Widget Flotante

**Características:**

- ✅ Flotante sobre toda la aplicación (z-index: 50)
- ✅ Draggable (arrastrar y soltar)
- ✅ Snap automático a bordes (threshold: 50px)
- ✅ Persiste posición en localStorage
- ✅ Muestra tiempo en formato MM:SS
- ✅ Botones: Play/Pause (grande) y Reset (pequeño)
- ✅ Botón X para restaurar (no cancela el timer)
- ✅ Funciona en todas las rutas (/calendario, /tareas, etc.)

**Controles:**

- **Arrastrar**: Click + drag en cualquier parte del widget (excepto botones)
- **Play/Pause**: Botón circular grande con color temático
- **Reset**: Botón circular pequeño gris
- **Restaurar**: Botón X (cierra widget, vuelve a vista completa)
- **ESC**: También restaura el temporizador

### Navegación

- El timer sigue corriendo aunque cambies de página
- Si regresas a /pomodoro o /enfoque mientras está minimizado, ves mensaje de "Temporizador Minimizado" con botón para restaurar
- El estado del timer NO se pierde al cambiar de ruta

### Persistencia

**localStorage keys:**

- `floating-timer-storage`: Guarda la posición del widget

**Estado compartido (Zustand):**

- `isMinimized`: boolean
- `source`: "pomodoro" | "focus" | null
- `position`: { x: number, y: number }

## Archivos Creados/Modificados

### Nuevos Archivos

1. **src/store/floatingTimerStore.ts**
   - Store de Zustand con persist
   - Maneja estado de minimizado y posición

2. **src/components/timer/FloatingTimer.tsx**
   - Componente del widget flotante
   - Renderizado vía React Portal a document.body
   - Lógica de drag & drop con snap

### Archivos Modificados

1. **src/components/layout/MainLayout.tsx**
   - Agregado `<FloatingTimer />` para que esté disponible globalmente

2. **src/pages/Pomodoro.tsx**
   - Importa `useFloatingTimerStore`
   - Agregado botón "Minimizar"
   - Muestra placeholder cuando está minimizado
   - Botón para restaurar

3. **src/pages/Enfoque.tsx**
   - Importa `useFloatingTimerStore`
   - Agregado botón "Minimizar"
   - Muestra placeholder cuando está minimizado
   - Botón para restaurar

## Comportamiento Técnico

### Drag & Drop

```typescript
- mousedown: captura offset
- mousemove: actualiza posición con constraints
- mouseup: aplica snap a bordes si está cerca
```

### Constraints del Widget

```typescript
maxX = window.innerWidth - 280;
maxY = window.innerHeight - 200;
```

### Snap a Bordes

- Threshold: 50px desde cualquier borde
- Se aplica al soltar (mouseup)
- Padding final: 20px desde el borde

### Accesibilidad

- ✅ `aria-label` en todos los botones
- ✅ `title` tooltips
- ✅ Keyboard: ESC para cerrar
- ✅ Focus visible en botones
- ✅ Click targets: 40px mínimo (botones grandes)

## Uso

```tsx
// En cualquier componente de timer:
import { useFloatingTimerStore } from "../store/floatingTimerStore";

const { minimize, restore, isMinimized } = useFloatingTimerStore();

// Minimizar
minimize("pomodoro"); // o "focus"

// Restaurar
restore();
```

## Notas de Diseño

- **Color principal**: Se adapta al tipo de timer (violet/green)
- **Bordes**: 2px con color temático
- **Sombra**: `shadow-2xl` con blur aumentado al arrastrar
- **Transiciones**: Smooth 300ms en todos los estados
- **Font**: Mono para el tiempo (mejor legibilidad)
- **Indicador de drag**: 3 puntos sutiles en la parte superior

## Mejoras Futuras Posibles

1. [ ] Minimizar automático al cambiar de página (opcional)
2. [ ] Sonido de notificación al completar
3. [ ] Animación de entrada/salida del widget
4. [ ] Ajuste de tamaño del widget (pequeño/grande)
5. [ ] Múltiples widgets simultáneos (timer + cronómetro)
6. [ ] Touch support para móvil
