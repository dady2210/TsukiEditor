# Capacidades Actuales del Editor (Tooling & Engine)

Esta es la documentación de las herramientas y capacidades ya construidas en el entorno web, las cuales servirán de base para el modo de juego (`/play`). No se utiliza Godot.

## 1. Parser / Ensamblador `.csave` (`parser.js`)
- **Descodificación AST:** Lee formatos `OdinSerializer` desde bytes crudos y los traduce a un Abstract Syntax Tree (AST) navegable (Nodos, Listas, Primitivas).
- **Escritura y Parcheo:** Puede buscar nodos específicos (ej. `placements`, `inventory`), modificarlos y re-empaquetar el array de bytes manteniendo la integridad del archivo.
- **Verification ID:** Implementa un generador algorítmico idéntico a `System.Random` de C# para firmar ítems nuevos de manera válida y evitar medidas anti-trampas.

## 2. Motor Isométrico (`map.js` & `app.js`)
- **Renderizado 2D/3D:** Utiliza Canvas de HTML5 con proyecciones `DOMMatrix` para lograr una cuadrícula isométrica (ancho 64, alto 32).
- **Z-Sorting Dinámico:** Ordena los sprites de los muebles basándose en las coordenadas (X, Y) y offsets de altura para lograr profundidad realista.
- **Revestimientos (Pisos y Papeles Tapiz):** Soporta dibujado texturizado (`createPattern`) con transformaciones isométricas de sesgo (Shear) y rotación para recubrir la estructura 3D del mapa nativamente.

## 3. Extracción y Base de Datos (`items_db.js`, `content_pivots.js`)
- **Extractor de Assets (Python / Node):** Scripts capaces de desempaquetar archivos `.bundle` de Unity (como `level2` o `sharedassets`) cruzando nombres para obtener Sprites limpios y Textures2D (tilesets de paredes/pisos).
- **Catálogo de Items:** Base de datos en JSON con IDs numéricos, nombres traducidos (ES/EN), medidas físicas (`width`, `length`) que el motor consume para delimitar colisiones en el mapa.
- **Pivotes (Offsets):** Ajustes visuales de anclaje (x, y) que corrigen los sprites originales de Unity para que sienten correctamente sobre el suelo isométrico.

## 4. UI / Funciones Editoriales
- **Inyección de Muebles y Decoración:** Permite editar los datos de cualquier cuadrícula, aplicar rotaciones, y reflejarlos en tiempo real.
- **Exportación JSON Parcial:** Desacopla la matriz de decoración de una habitación (muebles, rotación, paredes) en un JSON ligero para compartirse externamente.
- **Fusión (Merge):** Capacidad de leer un `.csave` original, importar un diseño JSON e inyectar el diseño de forma segura en la habitación sin afectar progreso global.
