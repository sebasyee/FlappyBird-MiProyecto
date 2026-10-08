// ==========================================
// 1. VARIABLES GLOBALES Y ESTADOS DEL JUEGO
// ==========================================
let estadoJuego = "INICIO"; // Estados: "INICIO", "JUGANDO", "GAMEOVER"

// Personaje (Pájaro / Jugador)
let jugador;

// Arreglo para almacenar los obstáculos (Columnas / Tuberías)
let columnas = [];
let frecuenciaColumnas = 90; // Crea una columna nueva cada 90 fotogramas (~1.5 segundos)

// Puntuaciones
let puntuacion = 0;
let puntuacionMaxima = 0;

// ==========================================
// 2. SETUP Y LOOP PRINCIPAL
// ==========================================
function setup() {
  createCanvas(400, 600); // Tamaño del lienzo
  jugador = new Jugador();
  
  // Recuperar la puntuación máxima guardada en el navegador si existe
  let guardado = localStorage.getItem("flappy_max_score");
  if (guardado !== null) {
    puntuacionMaxima = parseInt(guardado);
  }
}

function draw() {
  background(135, 206, 235); // Fondo azul cielo

  if (estadoJuego === "INICIO") {
    pantallaInicio();
  } else if (estadoJuego === "JUGANDO") {
    actualizarJuego();
  } else if (estadoJuego === "GAMEOVER") {
    pantallaGameOver();
  }
}

// ==========================================
// 3. CONTROLES E INTERACCIÓN
// ==========================================
function keyPressed() {
  if (key === ' ') { // Tecla Espacio
    if (estadoJuego === "INICIO") {
      reiniciarJuego();
      estadoJuego = "JUGANDO";
    } else if (estadoJuego === "JUGANDO") {
      jugador.saltar();
    } else if (estadoJuego === "GAMEOVER") {
      reiniciarJuego();
      estadoJuego = "JUGANDO";
    }
  }
}

// ==========================================
// 4. LÓGICA DEL JUEGO EN EJECUCIÓN
// ==========================================
function actualizarJuego() {
  // --- Generar nuevas columnas ---
  if (frameCount % frecuenciaColumnas === 0) {
    columnas.push(new Columna());
  }

  // --- Actualizar y dibujar columnas ---
  for (let i = columnas.length - 1; i >= 0; i--) {
    columnas[i].actualizar();
    columnas[i].mostrar();

    // Comprobar si sumamos punto (si el jugador pasa la columna)
    if (!columnas[i].pasada && columnas[i].x + columnas[i].ancho < jugador.x) {
      columnas[i].pasada = true;
      puntuacion++;
      if (puntuacion > puntuacionMaxima) {
        puntuacionMaxima = puntuacion;
        localStorage.setItem("flappy_max_score", puntuacionMaxima); // Guardar récord
      }
    }

    // Comprobar colisión con la columna
    if (columnas[i].colisionaCon(jugador)) {
      estadoJuego = "GAMEOVER";
    }

    // Eliminar columnas que salen de la pantalla para liberar memoria
    if (columnas[i].estaFuera()) {
      columnas.splice(i, 1);
    }
  }

  // --- Actualizar y dibujar jugador ---
  jugador.actualizar();
  jugador.mostrar();

  // Comprobar colisión con Techo y Suelo
  if (jugador.tocaLimites()) {
    estadoJuego = "GAMEOVER";
  }

  // --- Mostrar puntuación en pantalla ---
  fill(255);
  stroke(0);
  strokeWeight(3);
  textSize(32);
  textAlign(CENTER);
  text(puntuacion, width / 2, 60);
}

function reiniciarJuego() {
  jugador = new Jugador();
  columnas = [];
  puntuacion = 0;
}

// ==========================================
// 5. PANTALLAS DE INTERFAZ (UI)
// ==========================================
function pantallaInicio() {
  fill(255);
  stroke(0);
  strokeWeight(4);
  textAlign(CENTER, CENTER);
  
  textSize(36);
  text("FLAPPY GAME", width / 2, height / 3);
  
  textSize(18);
  text("Presiona ESPACIO para iniciar", width / 2, height / 2);
  text("Récord actual: " + puntuacionMaxima, width / 2, height / 2 + 50);
}

function pantallaGameOver() {
  fill(255, 50, 50);
  stroke(0);
  strokeWeight(4);
  textAlign(CENTER, CENTER);
  
  textSize(36);
  text("GAME OVER", width / 2, height / 3);
  
  fill(255);
  textSize(22);
  text("Puntos: " + puntuacion, width / 2, height / 2 - 20);
  text("Récord: " + puntuacionMaxima, width / 2, height / 2 + 20);
  
  textSize(16);
  text("Presiona ESPACIO para reiniciar", width / 2, height / 2 + 80);
}

// ==========================================
// 6. CLASE JUGADOR (Personaje)
// ==========================================
class Jugador {
  constructor() {
    this.x = 80;               // Posición fija en X
    this.y = height / 2;       // Posición inicial en Y (centro)
    this.tamano = 30;          // Diámetro del personaje
    this.gravedad = 0.6;       // Fuerza que lo empuja hacia abajo
    this.fuerzaSalto = -10;    // Impulso hacia arriba al saltar
    this.velocidad = 0;        // Velocidad vertical actual
  }

  saltar() {
    this.velocidad = this.fuerzaSalto;
  }

  actualizar() {
    this.velocidad += this.gravedad; // La gravedad acelera la velocidad
    this.y += this.velocidad;        // La posición cambia según la velocidad
  }

  mostrar() {
    fill(255, 220, 0); // Color amarillo
    stroke(0);
    strokeWeight(2);
    ellipse(this.x, this.y, this.tamano);
  }

  tocaLimites() {
    // Toca el techo (y <= 0) o toca el suelo (y >= height)
    return (this.y - this.tamano / 2 <= 0 || this.y + this.tamano / 2 >= height);
  }
}

// ==========================================
// 7. CLASE COLUMNA (Obstáculos)
// ==========================================
class Columna {
  constructor() {
    this.ancho = 60;
    this.espacioApertura = 200; // Hueco libre por donde pasa el jugador
    this.x = width;             // Aparece en el borde derecho de la pantalla
    this.velocidad = 4;         // Velocidad a la que se mueve a la izquierda
    this.pasada = false;

    // Determina la altura del espacio de paso de forma aleatoria
    let margenMinimo = 50;
    this.top = random(margenMinimo, height - this.espacioApertura - margenMinimo);
    this.bottom = height - (this.top + this.espacioApertura);
  }

  actualizar() {
    this.x -= this.velocidad;
  }

  mostrar() {
    fill(34, 139, 34); // Color verde
    stroke(0);
    strokeWeight(2);

    // Columna superior
    rect(this.x, 0, this.ancho, this.top);
    // Columna inferior
    rect(this.x, height - this.bottom, this.ancho, this.bottom);
  }

  estaFuera() {
    return (this.x + this.ancho < 0);
  }

  colisionaCon(p) {
    // Verificamos si el x del jugador está dentro del rango ancho de la columna
    if (p.x + p.tamano / 2 > this.x && p.x - p.tamano / 2 < this.x + this.ancho) {
      // Verificamos si toca la columna superior O la columna inferior
      if (p.y - p.tamano / 2 < this.top || p.y + p.tamano / 2 > height - this.bottom) {
        return true;
      }
    }
    return false;
  }
}