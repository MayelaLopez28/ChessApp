# ♟️ Ajedrez Móvil (PIA)

Este repositorio contiene el **Producto Integrador de Aprendizaje (PIA)** desarrollado para la materia de **Aplicaciones Móviles**.

## 📱 Caracteristicas del Proyecto

* **Motor de Juego Completo:** Logica propia de validación de movimientos para todas las piezas (Peón, Caballo, Alfil, Torre, Reina, Rey).
* **Inteligencia Artificial:** Modo "Vs CPU" implementado con un algoritmo *Greedy* que evalua el peso material del tablero para tomar decisiones.
* **Validación de Reglas:** Sistema de detección de Jaque (visualizacion roja), Jaque Mate y Tablas (Ahogado).
* **Gestion de Estado:** Uso de notación estándar **FEN** (Forsyth-Edwards Notation) para manipular y serializar el estado del tablero.
* **Persistencia de Datos:** Funcionalidad de "Guardar y Salir" y "Continuar Partida" utilizando almacenamiento local asíncrono.
* **Reloj de Ajedrez:** Temporizadores de partida funcionales con gestión de turnos y pausas automaticas.
* **Interfaz de Usuario:**
    * Splash Screen con animación personalizada.
    * Efectos de sonido inmersivos.
    * Guías visuales (color verde) para movimientos válidos.
    * Diseño responsivo adaptable a diferentes tamaños de pantalla.

## Estructura del Proyecto

* `src/components/`: Componentes visuales (Tablero, Splash Screen).
* `src/logic/`:
    * `GameEngine.ts`: Cerebro del juego (Validaciones, IA, deteccion de Jaque).
    * `FenParser.ts` / `FenGenerator.ts`: Traductores entre el estado visual y cadenas de texto FEN.
    * `Types.ts`: Definiciones de tipos TypeScript para asegurar la robustez del código.
* `app/`: Pantallas de navegación (Expo Router).

## Tecnologias Utilizadas

* **Framework:** React Native (Expo SDK).
* **Lenguaje:** TypeScript.
* **Navegacion:** Expo Router.
* **Almacenamiento:** `@react-native-async-storage/async-storage`.
* **Audio:** `expo-av`.

## Instalacion y Ejecucion

1.  **Clonar el repositorio:**
2.  **Instalar dependencias:**
3.  **Ejecutar la aplicación:**


---
**Desarrollado por:** Mayela López
**Materia:** Aplicaciones Móviles