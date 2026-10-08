// ==========================================
// 1. VARIABLES GLOBALES Y ESTADOS DEL JUEGO
// ==========================================
let estadoJuego = "INICIO"; // Estados: "INICIO", "JUGANDO", "GAMEOVER"

let jugador;

// Arreglo para almacenar los obstáculos (Columnas / Tuberías)
let columnas = [];
let frecuenciaColumnas = 120; // Crea una columna nueva cada 120 frames

// Puntuaciones
let puntuacion = 0;
let puntuacionMaxima = 0;

let cohetes = [];
let modoCohete = false;
let tiempoCoheteRestante = 0;
let duracionCohete = 300; // 300 fotogramas = 5 segundos a 60 fps

// ==========================================
// 2. SETUP Y LOOP PRINCIPAL
// ==========================================
function setup() {
  createCanvas(800, 450); // Tamaño del lienzo
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
    push(); // 1. Guarda el estado del lienzo
    translate(this.x, this.y); // 2. Mueve el punto de origen al centro del personaje

    // 3. Convierte la velocidad vertical en un ángulo
    // Si la velocidad es -9 (saltando), el ángulo es -30 grados (mira arriba).
    // Si la velocidad es 10 (cayendo), el ángulo es 70 grados (mira abajo).
    let angulo = map(this.velocidad, -9, 10, -radians(30), radians(70));
    angulo = constrain(angulo, -radians(30), radians(70)); // Evita rotaciones excesivas
    
    rotate(angulo); // 4. Aplica la rotación

    // 5. Dibuja el personaje centrado en (0, 0)
    fill(255, 220, 0); // Amarillo
    stroke(0);
    strokeWeight(2);
    ellipse(0, 0, this.tamano);

    // Ojo y pico sencillo para saber hacia dónde mira el personaje
    fill(255);
    ellipse(6, -4, 8, 8); // Ojo
    fill(0);
    ellipse(8, -4, 3, 3); // Pupila
    fill(255, 100, 0);
    triangle(10, 0, 18, 4, 10, 6); // Pico

    pop(); // 6. Restaura el lienzo a su estado original
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
    this.ancho = 65;
    this.x = width;
    this.velocidad = 4;
    this.pasada = false;

    // Espacios iniciales y finales para el efecto de cierre
    this.espacioInicial = 220; // Apertura inicial amplia
    this.espacioFinal = 150;   // Apertura reducida al cerrarse
    this.espacioActual = this.espacioInicial;
    
    // Posición del centro del hueco
    this.centroHueco = random(100, height - 100);

    // Variables de física para el rebote (Simulación de resorte)
    this.velocidadCierre = 0;
    this.fuerzaCierre = 0.15;
    this.amortiguacion = 0.75; // Frena el rebote paulatinamente
    this.enRebote = false;
  }

  actualizar() {
    // 1. Movimiento horizontal
    this.x -= this.velocidad;

    // 2. Lógica de cierre progresivo mientras la columna se acerca al jugador
    if (this.espacioActual > this.espacioFinal && !this.enRebote) {
      this.espacioActual -= 1.8; // Velocidad de cierre constante
      if (this.espacioActual <= this.espacioFinal) {
        this.espacioActual = this.espacioFinal;
        this.enRebote = true; // Activa el rebote al chocar
        this.velocidadCierre = -4; // Impulso inicial de rebote hacia afuera
      }
    }

    // 3. Efecto de rebote (Spring Physics)
    if (this.enRebote) {
      let delta = this.espacioActual - this.espacioFinal;
      let fuerza = -this.fuerzaCierre * delta;
      this.velocidadCierre += fuerza;
      this.velocidadCierre *= this.amortiguacion;
      this.espacioActual += this.velocidadCierre;
    }

    // Recalcular posiciones del techo y suelo del obstáculo
    this.top = this.centroHueco - (this.espacioActual / 2);
    this.bottom = height - (this.centroHueco + (this.espacioActual / 2));
  }

  mostrar(esSubterraneo) {
    stroke(0);
    strokeWeight(2);
    
    // Cambiar color según el escenario activo
    if (esSubterraneo) {
      fill(80, 50, 20); // Tuberías/Estalactitas de cueva oscuras
    } else {
      fill(34, 139, 34); // Tuberías verdes clásicas de la superficie
    }

    // Dibujar bloque superior e inferior
    rect(this.x, 0, this.ancho, this.top);
    rect(this.x, height - this.bottom, this.ancho, this.bottom);

    // Bordes o "labios" mecánicos/rocosos para darle volumen
    rect(this.x - 4, this.top - 15, this.ancho + 8, 15);
    rect(this.x - 4, height - this.bottom, this.ancho + 8, 15);
  }

  estaFuera() {
    return (this.x + this.ancho < 0);
  }

  colisionaCon(p) {
    if (p.x + p.tamano / 2 > this.x && p.x - p.tamano / 2 < this.x + this.ancho) {
      if (p.y - p.tamano / 2 < this.top || p.y + p.tamano / 2 > height - this.bottom) {
        return true;
      }
    }
    return false;
  }
}
// 7. CLASE COHETE 
class Cohete {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.tamano = 25;
    this.velocidad = 4; // Se mueve a la par de las columnas
    this.recolectado = false;
  }

  actualizar() {
    this.x -= this.velocidad;
  }

  mostrar() {
    if (this.recolectado) return;
    push();
    translate(this.x, this.y);
    // Dibujo del Cohete
    fill(220, 20, 20); // Cuerpo rojo
    stroke(0);
    strokeWeight(1.5);
    ellipse(0, 0, this.tamano, this.tamano / 1.5);
    fill(255, 200, 0); // Punta amarilla
    triangle(this.tamano / 2, -this.tamano / 4, this.tamano / 2 + 10, 0, this.tamano / 2, this.tamano / 4);
    fill(255, 100, 0); // Fuego trasero
    triangle(-this.tamano / 2, -5, -this.tamano / 2 - 8, 0, -this.tamano / 2, 5);
    pop();
  }

  colisionaCon(p) {
    if (this.recolectado) return false;
    let d = dist(this.x, this.y, p.x, p.y);
    return d < (this.tamano / 2 + p.tamano / 2);
  }
}