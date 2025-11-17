# 🔍 DEBUG RÁPIDO - Ejecutar en Consola del Navegador

## Pasos:

### 1. Abre el navegador en http://localhost:5173

### 2. Abre la consola del navegador
- **Chrome/Edge**: Presiona `F12`
- **Firefox**: Presiona `F12`
- Ve a la pestaña "Console" o "Consola"

### 3. Copia y pega este código COMPLETO en la consola:

```javascript
console.log('=== DEBUG MINITASKS ===');
console.log('1. Variables de entorno:');
console.log('   SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('   SUPABASE_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'EXISTS ✓' : 'MISSING ✗');

console.log('\n2. LocalStorage (sesión):');
const allKeys = Object.keys(localStorage).filter(k => k.includes('supabase'));
console.log('   Claves encontradas:', allKeys.length > 0 ? allKeys : 'NINGUNA ✗');

console.log('\n3. URL actual:', window.location.href);

console.log('\n=== COPIA TODO LO DE ARRIBA Y PÉGALO EN EL CHAT ===');
```

### 4. Presiona Enter

### 5. Copia TODO el output que aparece en la consola y pégalo aquí

---

## Si ves errores en ROJO:

También cópialos y pégalos aquí.

Los errores en rojo se ven así:
```
❌ Error: Cannot read property 'role' of null
❌ TypeError: ...
❌ Failed to fetch
```

---

## Reinicio Limpio (Si la app está atascada):

Si la app está congelada en la pantalla de carga, haz esto:

### En la consola del navegador:
```javascript
localStorage.clear()
location.reload()
```

Luego intenta hacer login de nuevo.

---

**IMPORTANTE: Necesito que me compartas el output completo de la consola para poder ayudarte. 🙏**
