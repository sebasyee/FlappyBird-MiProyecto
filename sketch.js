// ==========================================
// 1. VARIABLES GLOBALES Y ESTADOS DEL JUEGO
// ==========================================
let estadoJuego = "INICIO"; // Estados: "INICIO", "CINEMATICA", "JUGANDO", "GAMEOVER"

// Personaje y Escenario
let jugador;
let columnas = [];
let frecuenciaColumnas = 90; // Nueva columna cada ~1.5 segundos

// Estética de Alcantarilla y Aguas Tóxicas
let altoAguaToxica = 35;
let offsetAgua = 0;

// Cinemática de Inicio (Skater en Rampa)
let skaterIntro = {
  x: -60,
  y: 0,
  vx: 5,
  vy: 0,
  enRampa: false,
  saltando: false,
  angulo: 0,
  sprayActivo: false
};
let rampaX = 220;

// Sistema de Partículas (Humo/Graffiti de Spray)
let particulas = [];

// Puntuaciones
let puntuacion = 0;
let puntuacionMaxima = 0;

// ==========================================
// 2. SETUP Y LOOP PRINCIPAL
// ==========================================
function setup() {
  createCanvas(800, 450); // Formato horizontal 16:9
  jugador = new Skater();
  
  // Cargar récord guardado en el navegador
  let guardado = localStorage.getItem("flappy_skater_max");
  if (guardado !== null) {
    puntuacionMaxima = parseInt(guardado);
  }
  
  reiniciarCinematica();
}

function draw() {
  renderizarFondo();

  if (estadoJuego === "INICIO") {
    pantallaInicio();
  } else if (estadoJuego === "CINEMATICA") {
    actualizarCinematica();
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
      estadoJuego = "CINEMATICA";
    } else if (estadoJuego === "JUGANDO") {
      jugador.saltar();
    } else if (estadoJuego === "GAMEOVER") {
      reiniciarJuego();
      estadoJuego = "CINEMATICA";
    }
  }
}

// ==========================================
// 4. FONDO Y AMBIENTACIÓN (Alcantarillas NY)
// ==========================================
function renderizarFondo() {
  // 1. Pared de Ladrillos
  background(40, 30, 25);
  stroke(25, 18, 14);
  strokeWeight(2);
  let anchoLadrillo = 50;
  let altoLadrillo = 20;

  for (let y = 0; y < height - altoAguaToxica; y += altoLadrillo) {
    let offsetFila = (floor(y / altoLadrillo) % 2 === 0) ? 0 : anchoLadrillo / 2;
    for (let x = -anchoLadrillo; x < width + anchoLadrillo; x += anchoLadrillo) {
      fill(60, 42, 35);
      rect(x + offsetFila, y, anchoLadrillo, altoLadrillo);
    }
  }

  // Tubería decorativa del techo
  fill(30, 30, 35);
  stroke(10);
  rect(0, 0, width, 12);

  // 2. Agua Tóxica en el suelo (Verde Neón Animado)
  offsetAgua += 0.05;
  noStroke();
  fill(50, 205, 50);

  beginShape();
  vertex(0, height);
  for (let x = 0; x <= width; x += 20) {
    let y = height - altoAguaToxica + sin(offsetAgua + x * 0.05) * 4;
    vertex(x, y);
  }
  vertex(width, height);
  endShape(CLOSE);

  // Resplandor de la toxina
  fill(150, 255, 150, 70);
  rect(0, height - altoAguaToxica + 4, width, 5);
}

// ==========================================
// 5. CINEMÁTICA DE INICIO (Rampa + Skater)
// ==========================================
function reiniciarCinematica() {
  skaterIntro.x = -50;
  skaterIntro.y = height - altoAguaToxica - 15;
  skaterIntro.vx = 5.5;
  skaterIntro.vy = 0;
  skaterIntro.enRampa = false;
  skaterIntro.saltando = false;
  skaterIntro.angulo = 0;
  skaterIntro.sprayActivo = false;
  particulas = [];
}

function dibujarRampa() {
  fill(100, 90, 85);
  stroke(0);
  strokeWeight(2);
  // Rampa curvada de alcantarilla
  beginShape();
  vertex(rampaX, height - altoAguaToxica);
  quadraticVertex(rampaX + 50, height - altoAguaToxica, rampaX + 70, height - altoAguaToxica - 50);
  vertex(rampaX + 70, height - altoAguaToxica);
  endShape(CLOSE);
}

function actualizarCinematica() {
  dibujarRampa();

  // Movimiento del skater
  if (!skaterIntro.saltando) {
    skaterIntro.x += skaterIntro.vx;
    // Al tocar la rampa, despega
    if (skaterIntro.x >= rampaX) {
      skaterIntro.vy = -10; // Impulso hacia arriba
      skaterIntro.saltando = true;
      skaterIntro.sprayActivo = true;
    }
  } else {
    // Física del salto
    skaterIntro.x += skaterIntro.vx * 0.6;
    skaterIntro.vy += 0.4;
    skaterIntro.y += skaterIntro.vy;
    skaterIntro.angulo = lerp(skaterIntro.angulo, -radians(25), 0.1);

    // Generar partículas de spray al volar
    if (skaterIntro.sprayActivo) {
      particulas.push(new ParticulaSpray(skaterIntro.x - 15, skaterIntro.y + 5));
    }

    // TRANSICIÓN AUTOMÁTICA: En cuanto alcanza la X del jugador (120px) o el punto alto del salto
    if (skaterIntro.x >= jugador.x) {
      jugador.x = 120;
      jugador.y = skaterIntro.y;
      jugador.velocidad = skaterIntro.vy;
      estadoJuego = "JUGANDO"; // Activa el juego base
    }
    // Si cae al agua durante la cinemática por no presionar espacio, muestra Game Over
    if (skaterIntro.y >= height - altoAguaToxica) {
      estadoJuego = "GAMEOVER";
    }
  }

  // Dibujar al skater durante la animación
  push();
  translate(skaterIntro.x, skaterIntro.y);
  rotate(skaterIntro.angulo);
  dibujarSkaterSprite(0, 0, skaterIntro.sprayActivo);
  pop();

  // Actualizar partículas
  for (let i = particulas.length - 1; i >= 0; i--) {
    particulas[i].actualizar();
    particulas[i].mostrar();
    if (particulas[i].estaMuerta()) particulas.splice(i, 1);
  }
}

// ==========================================
// 6. LÓGICA DEL JUEGO EN EJECUCIÓN
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

    // Contar punto
    if (!columnas[i].pasada && columnas[i].x + columnas[i].ancho < jugador.x) {
      columnas[i].pasada = true;
      puntuacion++;
      if (puntuacion > puntuacionMaxima) {
        puntuacionMaxima = puntuacion;
        localStorage.setItem("flappy_skater_max", puntuacionMaxima);
      }
    }

    // Colisión con la columna
    if (columnas[i].colisionaCon(jugador)) {
      estadoJuego = "GAMEOVER";
    }

    if (columnas[i].estaFuera()) {
      columnas.splice(i, 1);
    }
  }

  // --- Actualizar y dibujar partículas ---
  for (let i = particulas.length - 1; i >= 0; i--) {
    particulas[i].actualizar();
    particulas[i].mostrar();
    if (particulas[i].estaMuerta()) particulas.splice(i, 1);
  }

  // --- Actualizar y dibujar Jugador ---
  jugador.actualizar();
  jugador.mostrar();

  // Colisión con agua tóxica
  if (jugador.tocaLimites()) {
    estadoJuego = "GAMEOVER";
  }

  // --- Marcador ---
  fill(255);
  stroke(0);
  strokeWeight(4);
  textSize(32);
  textAlign(CENTER, TOP);
  text("SCORE: " + puntuacion, width / 2, 20);
}

function reiniciarJuego() {
  jugador = new Skater();
  columnas = [];
  particulas = [];
  puntuacion = 0;
  reiniciarCinematica();
}

// ==========================================
// 7. PANTALLAS DE INTERFAZ (UI)
// ==========================================
function pantallaInicio() {
  fill(255, 220, 0);
  stroke(0);
  strokeWeight(5);
  textAlign(CENTER, CENTER);
  
  textSize(42);
  text("NY SEWER SKATER", width / 2, height / 3);
  
  fill(255);
  textSize(20);
  text("Presiona ESPACIO para iniciar la carrera", width / 2, height / 2 + 10);
  
  fill(50, 205, 50);
  textSize(18);
  text("Récord actual: " + puntuacionMaxima + " pts", width / 2, height / 2 + 55);
}

function pantallaGameOver() {
  fill(255, 50, 50);
  stroke(0);
  strokeWeight(5);
  textAlign(CENTER, CENTER);
  
  textSize(42);
  text("¡CAÍSTE EN LA TOXINA!", width / 2, height / 3);
  
  fill(255);
  textSize(22);
  text("Puntos: " + puntuacion, width / 2, height / 2 - 10);
  text("Récord: " + puntuacionMaxima, width / 2, height / 2 + 25);
  
  textSize(18);
  text("Presiona ESPACIO para intentar de nuevo", width / 2, height / 2 + 75);
}

// ==========================================
// 8. CLASE JUGADOR (Skater)
// ==========================================
class Skater {
  constructor() {
    this.x = 120;
    this.y = height / 2;
    this.tamano = 32;
    this.gravedad = 0.55;
    this.fuerzaSalto = -9.5;
    this.velocidad = 0;
  }

  saltar() {
    this.velocidad = this.fuerzaSalto;
    // Generar ráfaga de pintura al saltar
    for (let i = 0; i < 6; i++) {
      particulas.push(new ParticulaSpray(this.x - 15, this.y + 10));
    }
  }

  actualizar() {
    this.velocidad += this.gravedad;
    this.y += this.velocidad;

    // Frenar suavemente en el techo
    if (this.y - this.tamano / 2 < 12) {
      this.y = 12 + this.tamano / 2;
      this.velocidad = 0;
    }
  }

  mostrar() {
    push();
    translate(this.x, this.y);

    // Calcular inclinación según la velocidad
    let angulo = map(this.velocidad, -9.5, 10, -radians(30), radians(60));
    angulo = constrain(angulo, -radians(30), radians(60));
    rotate(angulo);

    dibujarSkaterSprite(0, 0, true);
    pop();
  }

  tocaLimites() {
    return (this.y + this.tamano / 2 >= height - altoAguaToxica);
  }
}

// Función auxiliar para dibujar la ilustración del skater
function dibujarSkaterSprite(px, py, conLatas) {
  push();
  translate(px, py);

  // 1. Skateboard
  fill(40);
  stroke(0);
  strokeWeight(1.5);
  rect(-18, 12, 36, 6, 2); // Tabla
  fill(200);
  ellipse(-10, 19, 6, 6); // Rueda izq
  ellipse(10, 19, 6, 6);  // Rueda der

  // 2. Niño Skater (Cuerpo y Gorra)
  fill(220, 50, 50); // Sudadera roja
  rect(-10, -8, 20, 18, 4);

  fill(255, 200, 160); // Cabeza
  ellipse(0, -14, 16, 16);

  fill(30, 140, 220); // Gorra azul hacia atrás
  arc(0, -16, 18, 14, PI, TWO_PI);
  rect(-12, -17, 8, 3); // Visera

  // 3. Latas de Spray como propulsores
  if (conLatas) {
    fill(180);
    stroke(0);
    rect(-14, -2, 6, 12); // Lata 1
    rect(8, -2, 6, 12);  // Lata 2
    fill(255, 0, 128);   // Tapa neón
    rect(-14, -5, 6, 3);
    rect(8, -5, 6, 3);
  }

  pop();
}

// ==========================================
// 9. CLASE COLUMNA (Tuberías Oxidadas que se Cierran y Rebotan)
// ==========================================
class Columna {
  constructor() {
    this.ancho = 65;
    this.x = width;
    this.velocidad = 3.8;
    this.pasada = false;

    this.espacioInicial = 210;
    this.espacioFinal = 125;
    this.espacioActual = this.espacioInicial;

    this.centroHueco = random(90, height - altoAguaToxica - 90);

    // Física de cierre y rebote
    this.velocidadCierre = 0;
    this.fuerzaCierre = 0.15;
    this.amortiguacion = 0.72;
    this.enRebote = false;

    this.top = 0;
    this.bottom = 0;
  }

  actualizar() {
    this.x -= this.velocidad;

    // Cierre progresivo al acercarse
    if (this.espacioActual > this.espacioFinal && !this.enRebote) {
      this.espacioActual -= 1.6;
      if (this.espacioActual <= this.espacioFinal) {
        this.espacioActual = this.espacioFinal;
        this.enRebote = true;
        this.velocidadCierre = -3.5; // Impulso de rebote
      }
    }

    // Efecto elástico (Spring Physics)
    if (this.enRebote) {
      let delta = this.espacioActual - this.espacioFinal;
      let fuerza = -this.fuerzaCierre * delta;
      this.velocidadCierre += fuerza;
      this.velocidadCierre *= this.amortiguacion;
      this.espacioActual += this.velocidadCierre;
    }

    this.top = this.centroHueco - (this.espacioActual / 2);
    this.bottom = height - (this.centroHueco + (this.espacioActual / 2));
  }

  mostrar() {
    stroke(15);
    strokeWeight(2);
    fill(85, 75, 70); // Metal industrial base

    // Tubo superior e inferior
    rect(this.x, 0, this.ancho, this.top);
    rect(this.x, height - this.bottom, this.ancho, this.bottom);

    // Detalle de Óxido
    fill(170, 75, 30);
    noStroke();
    rect(this.x + 8, this.top * 0.2, 16, this.top * 0.5);
    rect(this.x + 10, height - this.bottom + 15, 20, 30);

    // Boquillas metálicas gruesas
    stroke(15);
    strokeWeight(2);
    fill(110, 100, 95);
    let altoBoquilla = 16;
    rect(this.x - 4, this.top - altoBoquilla, this.ancho + 8, altoBoquilla);
    rect(this.x - 4, height - this.bottom, this.ancho + 8, altoBoquilla);
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

// ==========================================
// 10. CLASE PARTICULA SPRAY (Efecto de Impulso)
// ==========================================
class ParticulaSpray {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = random(-4, -1.5);
    this.vy = random(-1.5, 1.5);
    this.alpha = 245;
    this.tamano = random(6, 12);
    // Colores tipo pintura graffiti (Rosa magenta, Cyan, Amarillo)
    let colores = [
      color(255, 0, 128),
      color(0, 220, 255),
      color(255, 230, 0)
    ];
    this.col = random(colores);
  }

  actualizar() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= 9;
  }

  mostrar() {
    noStroke();
    this.col.setAlpha(this.alpha);
    fill(this.col);
    ellipse(this.x, this.y, this.tamano);
  }

  estaMuerta() {
    return this.alpha <= 0;
  }
}