// --- CARGA DE ASSETS (Imágenes) ---
let imgFondo;
let imgRampa;
let imgTuberia;
let imgPlataforma;

//ASSETS DE ANIMACION DE CARRERA DE SKATER
let imgSkaterRun = [];

//IMAGENES DE SKATER EN EL AIRE
let imgSkaterDespuesSalto;
let imgSkaterShoot;
let imgSkaterDown;

function preload() {
  //CARGAR FONDO RAMPA Y TUBERIA
  imgFondo = loadImage('assets/Background_UnderSurface.jpg');
  imgRampa = loadImage('assets/Rampa.png');
  imgTuberia = loadImage('assets/Tuberia_derecha.png');
  imgPlataforma = loadImage('assets/plataforma.png');

  //CARGAR FRAMES DE LA CARRERA
  imgSkaterRun[0] = loadImage('assets/skater_run/skater_run01.png');
  imgSkaterRun[1] = loadImage('assets/skater_run/skater_run02.png');
  imgSkaterRun[2] = loadImage('assets/skater_run/skater_run03.png');

  //CARGAR POSES
  imgSkaterShoot = loadImage('assets/skater_shoot.png');
  imgSkaterDown = loadImage('assets/skater_down.png');
  imgSkaterDespuesSalto = loadImage('assets/Skater_DespuesSalto.png');
}


// ==========================================
// 1. VARIABLES GLOBALES Y ESTADOS DEL JUEGO
// ==========================================
let estadoJuego = "INICIO"; // Estados: "INICIO", "CINEMATICA", "JUGANDO", "GAMEOVER"

// Personaje y Escenario
let jugador;
let columnas = [];
let frecuenciaColumnas = 90; // Nueva columna cada ~1.5 segundos

// Estética de Alcantarilla y Aguas Tóxicas
let altoAguaToxica = 30;
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
let rampaX = 500;

// Sistema de Partículas (Humo/Graffiti de Spray)
let particulas = [];

// Puntuaciones
let puntuacion = 0;
let puntuacionMaxima = 0;

//posición de la rampa  
let desplazamientoRampaX = 15;


// ==========================================
// 2. SETUP Y LOOP PRINCIPAL
// ==========================================
function setup() {
  createCanvas(1000, 550); // Formato horizontal 16:9
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
  // Fondo gris neutro para pruebas (puedes ajustar el 100 a otro número entre 0 y 255)
  background(100);

  // Mantenemos el agua tóxica animada en el suelo para seguir probando colisiones
  offsetAgua += 0.05;
  noStroke();
  fill(50, 205, 50, 200); // Verde tóxico

  beginShape();
  vertex(0, height);
  for (let x = 0; x <= width; x += 20) {
    let y = height - altoAguaToxica + sin(offsetAgua + x * 0.05) * 4;
    vertex(x, y);
  }
  vertex(width, height);
  endShape(CLOSE);
}
// Fondo oculto mientras hago pruebas
/*function renderizarFondo() {
  image(imgFondo, 0, 0, width, height);

  // Mantenemos el agua tóxica sobre el fondo
  offsetAgua += 0.05;
  noStroke();
  fill(50, 205, 50, 200);

  beginShape();
  vertex(0, height);
  for (let x = 0; x <= width; x += 20) {
    let y = height - altoAguaToxica + sin(offsetAgua + x * 0.05) * 4;
    vertex(x, y);
  }
  vertex(width, height);
  endShape(CLOSE);
}*/

// Rampa
function dibujarRampa() {
  let altoPlataforma = 45; 
  let anchoRampa = 300;     
  let altoRampa = 100;       

  let yPlataforma = height - altoAguaToxica - altoPlataforma;

  // 1. La plataforma se extiende un poco más allá de rampaX para generar el traslape/encimado
  let solapamiento = 300; // Píxeles que se meterá la plataforma por debajo de la rampa
  let anchoPlataformaDibujo = rampaX + solapamiento;

  // Dibujar la plataforma de concreto
  image(imgPlataforma, 0, yPlataforma, anchoPlataformaDibujo, altoPlataforma + altoAguaToxica);

  // 2. Posición de la rampa controlada con rampaX + desplazamientoRampaX
  let posXRampa = rampaX + desplazamientoRampaX;
  
  // Dibujar la rampa encimada sobre el final de la plataforma
  image(imgRampa, posXRampa, yPlataforma - (altoRampa - altoPlataforma), anchoRampa, altoRampa);
}

function actualizarCinematica() {
  dibujarRampa();

  if (!skaterIntro.saltando) {
    skaterIntro.x += skaterIntro.vx;

    // Cambia de frame cada 8 fotogramas (ajusta el 8 si quieres que corra más rápido/lento)
    let frameActual = floor(frameCount / 12) % imgSkaterRun.length;

    push();
    translate(skaterIntro.x, skaterIntro.y);
    imageMode(CENTER);
    image(imgSkaterRun[frameActual], 0, 0, 90, 90); // Dibujar frame actual
    pop();

    if (skaterIntro.x >= rampaX + desplazamientoRampaX + 70) {
      skaterIntro.vy = -10;
      skaterIntro.saltando = true;
      skaterIntro.sprayActivo = true;
    }
  } else {
    // Salto en la rampa
    skaterIntro.x += skaterIntro.vx * 0.6;
    skaterIntro.vy += 0.4;
    skaterIntro.y += skaterIntro.vy;

    // Dibujar la pose de despegue durante el salto de la intro
    push();
    translate(skaterIntro.x, skaterIntro.y);
    imageMode(CENTER);
    image(imgSkaterShoot, 0, 0, 90, 90);
    pop();

    if (skaterIntro.sprayActivo) {
      particulas.push(new ParticulaSpray(skaterIntro.x - 15, skaterIntro.y + 5));
    }

    if (skaterIntro.x >= jugador.x) {
      jugador.x = 120;
      jugador.y = skaterIntro.y;
      jugador.velocidad = skaterIntro.vy;
      estadoJuego = "JUGANDO";
    }
  }

  // Partículas y límites
  for (let i = particulas.length - 1; i >= 0; i--) {
    particulas[i].actualizar();
    particulas[i].mostrar();
    if (particulas[i].estaMuerta()) particulas.splice(i, 1);
  }

  if (skaterIntro.y >= height - altoAguaToxica) {
    estadoJuego = "GAMEOVER";
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
    this.tamano = 45; // Hitbox ligeramente ajustada al nuevo tamaño visual
    this.gravedad = 0.55;
    this.fuerzaSalto = -9.5;
    this.velocidad = 0;
  }

  saltar() {
    this.velocidad = this.fuerzaSalto;
    for (let i = 0; i < 6; i++) {
      particulas.push(new ParticulaSpray(this.x - 15, this.y + 10));
    }
  }

  actualizar() {
    this.velocidad += this.gravedad;
    this.y += this.velocidad;

    if (this.y - this.tamano / 2 < 12) {
      this.y = 12 + this.tamano / 2;
      this.velocidad = 0;
    }
  }

  mostrar() {
    push();
    translate(this.x, this.y);

    let angulo = map(this.velocidad, -9.5, 10, -radians(25), radians(55));
    angulo = constrain(angulo, -radians(25), radians(55));
    rotate(angulo);

    imageMode(CENTER);

    // Solo 2 estados: subiendo (shoot) o cayendo (down), con tamaño grande (90x90)
    if (this.velocidad < 0) {
      image(imgSkaterShoot, 0, 0, 90, 90);
    } else {
      image(imgSkaterDown, 0, 0, 90, 90);
    }

    pop();
  }

  tocaLimites() {
    return (this.y + this.tamano / 2 >= height - altoAguaToxica);
  }
}

// Función auxiliar para dibujar la ilustración del skater
function dibujarSkaterSprite(px, py) {
  push();
  translate(px, py);
  imageMode(CENTER); // Centra la imagen para rotaciones fluidas
  
  // Dibujar la imagen del skater (ajusta el tamaño 50x50 si es necesario)
  image(imgSkater, 0, 0, 50, 50);
  pop();
}
// ==========================================
// CLASE COLUMNA (Ambas tuberías fijas en escala, sin flotar ni estirarse)
// ==========================================
class Columna {
  constructor() {
    this.ancho = 65;
    this.x = width;
    this.velocidad = 3.8;
    this.pasada = false;

    // Espacio libre por donde cruza el jugador
    this.espacioApertura = 130;

    // Determinamos el centro del hueco
    let centroHueco = random(100, height - altoAguaToxica - 100);
    
    // Posiciones meta finales (Y superior e Y inferior)
    this.topMeta = centroHueco - (this.espacioApertura / 2);
    this.bottomY = centroHueco + (this.espacioApertura / 2); // Posición donde inicia la apertura inferior

    // --- FÍSICA DE CAÍDA DE LA TUBERÍA SUPERIOR ---
    this.topY = -350; 
    this.vyTop = 0;           
    this.gravedadTop = 0.6;    
    this.impactado = false;

    this.fuerzaResorte = 0.25; 
    this.amortiguacion = 0.55; 

    // Altura fija de las imágenes para evitar deformación y espacios vacíos
    this.altoFijo = 450; 
  }

  actualizar() {
    // 1. Movimiento horizontal
    this.x -= this.velocidad;

    // 2. Caída e impacto de la tubería superior
    if (!this.impactado) {
      this.vyTop += this.gravedadTop;
      this.topY += this.vyTop;

      if (this.topY >= this.topMeta) {
        this.topY = this.topMeta;
        this.vyTop = -this.vyTop * 0.45; // Rebote de impacto seco
        this.impactado = true;
      }
    } else {
      // Física de resorte post-impacto
      let delta = this.topY - this.topMeta;
      let fuerza = -this.fuerzaResorte * delta;
      this.vyTop += fuerza;
      this.vyTop *= this.amortiguacion;
      this.topY += this.vyTop;
    }
  }

  mostrar() {
    // A. TUBERÍA SUPERIOR (Se dibuja desde topY hacia arriba)
    push();
    image(imgTuberia, this.x, this.topY - this.altoFijo, this.ancho, this.altoFijo);
    pop();

    // B. TUBERÍA INFERIOR (Fija: inicia en bottomY y se extiende hacia abajo pasando el borde del canvas)
    push();
    // Al darle un alto de this.altoFijo (450px), la imagen sobrepasa holgadamente el límite inferior de la pantalla
    image(imgTuberia, this.x, this.bottomY, this.ancho, this.altoFijo);
    pop();
  }

  estaFuera() {
    return (this.x + this.ancho < 0);
  }

  colisionaCon(p) {
    if (p.x + p.tamano / 2 > this.x && p.x - p.tamano / 2 < this.x + this.ancho) {
      // Colisión precisa usando las coordenadas Y reales del hueco (topY y bottomY)
      if (p.y - p.tamano / 2 < this.topY || p.y + p.tamano / 2 > this.bottomY) {
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
function reiniciarCinematica() {
  skaterIntro.x = -60;
  
  let altoPlataforma = 45; // Debe coincidir con el altoPlataforma de dibujarRampa()
  // Ajustamos el offset (-20 u otro valor) para que el personaje pise la plataforma
  skaterIntro.y = height - altoAguaToxica - altoPlataforma - 20; 
  
  skaterIntro.vx = 5.5;
  skaterIntro.vy = 0;
  skaterIntro.enRampa = false;
  skaterIntro.saltando = false;
  skaterIntro.angulo = 0;
  skaterIntro.sprayActivo = false;
  particulas = [];
}