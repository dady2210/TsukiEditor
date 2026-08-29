# Diagnóstico de Rendimiento de Carga (Phase P0)

## 1. Mediciones de Cold Load (/play y /editor)

| Métrica | Antes (Estimado/Analizado) |
| :--- | :--- |
| **Tiempo hasta casa visible** | Bloqueado > 1.5s - 3s tras cargar el .csave |
| **Main Thread Blocking** | Muy alto (Generación masiva de DOM + Parsing síncrono) |
| **Peso transferido**| ~2 - 4 MB iniciales (assets base de subloc 0) |
| **Imágenes grandes** | ~1.84 MB (Exportado_level2_Ensamblado.png) |
| **JSON Catalogs** | ~825 KB (items_db.js) + ~170 KB (content_pivots.js) |

### Top Recursos por Tamaño
1. level39_Ensamblado.png (~3.77 MB, precargado a veces)
2. level4_Ensamblado.png (~1.87 MB)
3. level2_Ensamblado.png (~1.84 MB)
4. items_db.js (~825 KB)
5. Dreamhouse_Clouds_0.png (~1.30 MB)

### Análisis del Cuello de Botella (Main Thread)
Tras analizar el código fuente (pp.js, map.js), confirmamos las siguientes hipótesis como **VERDADERAS** y principales causantes del congelamiento al cargar la casa:

1. **DOM Spiking Innecesario (El mayor bloqueador):**
   - Al cargar el .csave (parseData()), se llama a 
enderInventory(). Si el usuario tiene 1000 items en la mochila, el script crea 1000 etiquetas <tr>, <select>, <input> y <img> de forma síncrona.
   - updateInvDatalist() itera sobre TODO KNOWN_ITEMS (miles de IDs) y crea un <option> en el DOM por cada uno.
   - **Agravante:** TODO este DOM pesado de /editor se genera *incluso si el usuario entró directo a /play* (la UI de editor simplemente se oculta con display: none en handleRouting()).
2. **Precarga Masiva Síncrona:**
   - La base de datos completa ITEMS_DB se itera al boot (loadDictionaries()) para volcarse en KNOWN_ITEMS.
   - El código en pp.js tiene un loop explícito que hace // Preload all covering textures al cargar el mapa.

## 2. Plan de Acción (Fase P0)

1. **Code Split / Renderizado Condicional:**
   - Si el hash es #/play, **NO** llamar a 
enderInventory() ni popular listas del /editor hasta que el usuario cambie a la pestaña del editor.
   - Si se entra al editor, popular las listas masivas (datalist) de forma asíncrona o al hacer click, no durante el parsing inicial.
