# Simulación Escrita y Flujo de Partida: **pregunta2**

Esta prueba escrita ilustra exactamente la experiencia de usuario paso a paso desde el primer clic hasta la coronación del ganador.

---

## FASE 1: Pantalla de Bienvenida y Configuración (Lobby)

Al abrir la aplicación en el navegador, los jugadores ven una interfaz moderna con colores vivos y música de fondo opcional:

```text
========================================================================
                          🎯 PREGUNTA2 🎯
           ¡El juego de mesa de preguntas y coronas!
========================================================================

 [ REGISTRO DE JUGADORES ]
   Jugador 1: [ Carlos            ]  Avatar: 🦊 Zorro Azul
   Jugador 2: [ Lucía             ]  Avatar: 🦉 Búho Violeta

 [ CONFIGURACIÓN DE PARTIDA ]
   Dificultad de Preguntas:
   ( ) Fácil       (*) Media (Equilibrada)       ( ) Difícil       ( ) Mixta

   Tiempo por Pregunta:
   [ 30 Segundos ] (Reglamentario con alerta sonora)

   Modo de Juego:
   (*) Local 2 Jugadores (Misma Computadora - Por Turnos)

                 [ ▶ INICIAR PARTIDA DE PREGUNTA2 ]
========================================================================
```

Carlos y Lucía eligen dificultad **Media**, confirman los 30 segundos y presionan **INICIAR PARTIDA**.

---

## FASE 2: Pantalla Principal de Juego (El Tablero)

Aparece el escenario principal. En el centro está la **Ruleta Interactiva**, y en los laterales los **Anotadores** de Carlos y Lucía:

```text
========================================================================================
                                     PREGUNTA2
========================================================================================
 [ JUGADOR 1: Carlos ] 🦊                               [ JUGADOR 2: Lucía ] 🦉
 Coronas: [ ⚪ ⚪ ⚪ ⚪ ⚪ ⚪ ] (0/6)                      Coronas: [ ⚪ ⚪ ⚪ ⚪ ⚪ ⚪ ] (0/6)
 ---------------------------------                      ---------------------------------
 🔴 Arte y Lit:      [   ] 0/3                          🔴 Arte y Lit:      [   ] 0/3
 🔵 Geografía:       [   ] 0/3                          🔵 Geografía:       [   ] 0/3
 🟢 Ciencias y Tec:  [   ] 0/3                          🟢 Ciencias y Tec:  [   ] 0/3
 🟠 Deportes:        [   ] 0/3                          🟠 Deportes:        [   ] 0/3
 🟣 Entretenimiento: [   ] 0/3                          🟣 Entretenimiento: [   ] 0/3
 🟡 Historia:        [   ] 0/3                          🟡 Historia:        [   ] 0/3
----------------------------------------------------------------------------------------
                                  TURNO DE: CARLOS 🦊
                                  
                                       ▼ (Aguja)
                                 .---''''---.
                               /  HISTORIA   \
                              / DEPORTES  👑  \
                             |      [GIRAR]    |
                              \  CIENCIA ARTE /
                               \  GEOGRAFÍA  /
                                 '---....---'
                                 
                     Pulsa el botón [GIRAR] para comenzar tu turno
========================================================================================
```

---

## FASE 3: Ronda 1 - Turno de Carlos (Categoría sin puntos previos)

1. **Acción**: Carlos presiona **[GIRAR]**.
2. **Efecto visual**: La ruleta gira rápidamente con sonido de carraca y se detiene en **🟡 HISTORIA**.
3. **Comprobación de Bonus**: Carlos tiene **0 puntos** en Historia. Dispone de **1 intento** (Pregunta 1 de la carta robada).
4. **Pantalla de Pregunta**:

```text
========================================================================================
 Categoría: 🟡 HISTORIA | Carta: HIST-MED-04 | Intento 1 de 1
 TURNO DE: CARLOS 🦊
 
 TIEMPO RESTANTE: [████████████████████] 28s
 
 PREGUNTA 1:
 "¿En qué año cayó el Muro de Berlín, marcando un hito en el fin de la Guerra Fría?"
 
   [ A ] 1985
   [ B ] 1989  <-- (Carlos hace clic aquí)
   [ C ] 1991
   [ D ] 1975
========================================================================================
```

5. **Resolución**:
   - ¡CORRECTO! Sonido de acierto y destello verde en la opción B.
   - Mensaje: *"¡Respuesta Correcta! Sumas +1 punto en Historia."*
   - El anotador de Carlos se actualiza: `🟡 Historia: [★  ] 1/3`.
   - Se muestra el botón: **[PASAR TURNO A LUCÍA 🦉]**.

---

## FASE 4: Ronda 1 - Turno de Lucía (Fallo y cese de turno)

1. **Acción**: Lucía presiona **[GIRAR]**.
2. La ruleta se detiene en **🟢 CIENCIAS Y TECNOLOGÍA**.
3. Lucía tiene **0 puntos** en Ciencias. Dispone de **1 intento**.
4. **Pantalla de Pregunta**:
   - Pregunta: *"¿Cuál es el gas más abundante en la atmósfera de la Tierra?"*
   - Opciones: `[A] Oxígeno`, `[B] Dióxido de carbono`, `[C] Nitrógeno`, `[D] Hidrógeno`.
   - El reloj corre a 10s... Lucía duda y selecciona `[A] Oxígeno`.
5. **Resolución**:
   - ¡INCORRECTO! (La correcta era Nitrógeno).
   - Mensaje: *"Respuesta incorrecta. No sumas puntos en este turno."*
   - Como tenía 0 puntos, no tiene preguntas de respaldo.
   - Lucía mantiene `0/3` en Ciencias.
   - El turno vuelve a Carlos.

---

## FASE 5: Ronda 2 - Carlos experimenta la REGLA DE BONUS (Reintentos)

1. **Situación previa**: Carlos ya tiene **1 punto** en **🟡 HISTORIA**.
2. **Acción**: Carlos gira la ruleta y vuelve a caer en **🟡 HISTORIA**.
3. **Activación de Bonus**:
   - El sistema detecta: `Puntos actuales = 1`.
   - Mensaje en pantalla: *"¡BONUS ACTIVO! Tienes 1 punto acumulado en esta categoría. Dispones de hasta 2 preguntas para sumar tu siguiente punto."*
4. **Primer Intento (Pregunta 1 de la carta)**:
   - Reloj: **30s**.
   - Pregunta: *"¿Qué tratado puso fin a la Primera Guerra Mundial en 1919?"*
   - Carlos elige por error: `[C] Tratado de Tordesillas`.
   - Resultado: *"¡Fallaste el primer intento! Pero tu bonus te da una SEGUNDA OPORTUNIDAD."*
5. **Segundo Intento (Pregunta 2 de la misma carta)**:
   - El temporizador se reinicia a **30s**.
   - Pregunta: *"¿Quién fue el primer emperador de Roma?"*
   - Opciones: `[A] Julio César`, `[B] Nerón`, `[C] Augusto`, `[D] Marco Aurelio`.
   - Carlos elige: `[C] Augusto`.
   - **¡CORRECTO!**
   - Mensaje: *"¡Acierto en tu oportunidad de bonus! Sumas +1 punto en Historia."*
   - Anotador de Carlos: `🟡 Historia: [★★ ] 2/3`.
   - Carlos está a solo 1 punto de conquistar la corona de Historia.

---

## FASE 6: Ronda 3 - Lucía cae en la CORONA 👑 (Desafío Directo)

1. **Acción**: Lucía gira la ruleta y la aguja apunta exactamente a la casilla dorada: **👑 CORONA**.
2. **Efecto visual**: Fanfarria dorada y modal interactivo:

```text
========================================================================================
                           👑 ¡CASILLA DE CORONA! 👑
                 Lucía, tienes la oportunidad de ganar una categoría
                 directamente si respondes correctamente una pregunta.
                 
  Elige la categoría que deseas disputar:
  [ 🔴 Arte y Lit ]   [ 🔵 Geografía ]   [ 🟢 Ciencias y Tec ]
  [ 🟠 Deportes ]     [ 🟣 Entretenimiento ]   [ 🟡 Historia ]
========================================================================================
```

3. Lucía hace clic en **🔵 Geografía**.
4. **Desafío de Corona**:
   - Reloj: **30 segundos**.
   - Pregunta: *"¿Cuál es la capital de Australia?"*
   - Opciones: `[A] Sídney`, `[B] Melbourne`, `[C] Canberra`, `[D] Brisbane`.
   - Lucía elige: `[C] Canberra`.
5. **Resolución**:
   - ¡RESPUESTA CORRECTA!
   - Sonido de triunfo y animación de corona flotando hacia el perfil de Lucía.
   - Su medallero se actualiza: `🔵 Geografía: [👑 GANADA]`.
   - No necesitó acumular los 3 puntos: ¡obtuvo la corona completa en un solo desafío!

---

## FASE 7: Ronda 4 - Lucía experimenta la OPCIÓN A (Regiro Automático)

1. Más adelante en la partida, Lucía gira la ruleta y cae en **🔵 Geografía**.
2. **Activación de Regla Opción A**:
   - El sistema detecta que Lucía **ya tiene la corona de Geografía**.
   - Notificación animada:
     ```text
     "ℹ️ ¡Ya tienes la corona de Geografía! La ruleta vuelve a girar automáticamente..."
     ```
   - La ruleta gira sola de inmediato y cae en **🟣 Entretenimiento** (categoría pendiente).
   - Lucía juega su turno con normalidad en Entretenimiento.

---

## FASE 8: Fin de Partida y Victoria

1. Varias rondas después, Carlos conquista su última categoría pendiente (**🟣 Entretenimiento** al llegar a 3/3 puntos).
2. Carlos alcanza **6 de 6 Coronas**:
   - `[ 👑 👑 👑 👑 👑 👑 ]`
3. **Pantalla de Victoria**:

```text
========================================================================================
                          🎉 ¡CARLOS ES EL CAMPEÓN! 🎉
                   ¡Ha completado las 6 categorías de PREGUNTA2!
========================================================================================

                 🦊 Carlos: 6 Coronas | 14 Aciertos / 18 Preguntas
                 🦉 Lucía:  4 Coronas | 11 Aciertos / 17 Preguntas
                 
 [ ESTADÍSTICAS DE LA PARTIDA ]
 • Tiempo total de juego: 14 minutos 32 segundos
 • Categoría más dominada por Carlos: Historia (100% efectividad)
 • Categoría más dominada por Lucía: Geografía (Corona directa)
 • Reintentos de Bonus aprovechados con éxito: 3

              [ 🔄 JUGAR OTRA PARTIDA ]       [ ⚙️ VOLVER AL LOBBY ]
========================================================================================
```
