# Ajedrez Móvil (PIA)

Este repositorio contiene el **Producto Integrador de Aprendizaje (PIA)** desarrollado para la materia de **Aplicaciones Móviles**.

El proyecto consiste en la realizacion de un ajedrez funcional en React Native.

## Caracteristicas del Proyecto

* **Motor de Juego Completo:** Logica de validación de movimientos para todas las piezas (Peón, Caballo, Alfil, Torre, Reina, Rey).
* **Validacion de Reglas:** Sistema de detección de Jaque (visualización roja) y prevención de movimientos ilegales.
* **Gestion de Estado:** Uso de notación **FEN** (Forsyth-Edwards Notation) para manipular el estado del tablero.
* **Persistencia de Datos:** Funcionalidad de "Guardar y Salir" y "Continuar Partida" mediante almacenamiento local (`AsyncStorage`).
* **Reloj de Ajedrez:** Temporizadores funcionales con pausas automáticas al salir al menu.
* **Interfaz de Usuario:**
    * Splash Screen con animación personalizada.
    * Efectos de sonido integrados.
    * Guías visuales de movimientos válidos.
    * Diseño responsivo con coordenadas y marco.

## Tecnologias Utilizadas

* **Framework:** React Native (Expo SDK).
* **Lenguaje:** TypeScript.
* **Navegación:** Expo Router.
* **Almacenamiento:** `@react-native-async-storage/async-storage`.
* **Audio:** `expo-av`.

## Instalacion y Ejecucion

1.  Clonar el repositorio:
2.  Instalar dependencias:
3.  Ejecutar la aplicación:
