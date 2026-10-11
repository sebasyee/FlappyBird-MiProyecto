// --- CARGA DE ASSETS (Imágenes) ---
let imgFondo;
let imgRampa;
let imgPlataforma;
let imgTuberiaAbiertaAbajo;
let imgTuberiaDerechaAbajo;
let imgTuberiaDerechaArriba;

//ASSETS DE ANIMACION DE CARRERA DE SKATER
let imgSkaterRun = [];

//IMAGENES DE SKATER EN EL AIRE
let imgSkaterDespuesSalto;
let imgSkaterShoot;
let imgSkaterDown;

//Musica
let musicaFondo;

function preload() {
  //CARGAR FONDO RAMPA Y TUBERIA
  imgFondo = loadImage('assets/Background_UnderSurface.jpg');
  imgRampa = loadImage('assets/Rampa.png');
  imgPlataforma = loadImage('assets/plataforma.png');
  imgTuberiaAbiertaAbajo = loadImage('assets/Tuberia_abiertaAbajo.png');
  imgTuberiaDerechaAbajo = loadImage('assets/Tuberia_derechaAbajo.png');
  imgTuberiaDerechaArriba = loadImage('assets/Tuberia_derechaArriba.png');

  //CARGAR FRAMES DE LA CARRERA
  imgSkaterRun[0] = loadImage('assets/skater_run/skater_run01.png');
  imgSkaterRun[1] = loadImage('assets/skater_run/skater_run02.png');
  imgSkaterRun[2] = loadImage('assets/skater_run/skater_run03.png');

  //CARGAR POSES
  imgSkaterShoot = loadImage('assets/skater_shoot.png');
  imgSkaterDown = loadImage('assets/skater_down.png');
  imgSkaterDespuesSalto = loadImage('assets/Skater_DespuesSalto.png');

  //Musica de fondo
  musicaFondo = loadSound('assets/musicaFondo.mp3');

}


// ==========================================
// 1. VARIABLES GLOBALES Y ESTADOS DEL JUEGO
// ==========================================
let estadoJuego = "INICIO"; // Estados: "INICIO", "CINEMATICA", "JUGANDO", "GAMEOVER"

// Personaje y Escenario
let jugador;
let columnas = [];
let frecuenciaColumnas = 90; // Nueva columna cada ~1.5 segundos
let indicePatronAbajo = 0; // <--- Declara esta variable globalmente arriba del todo

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
let rampaX = 400;

// Sistema de Partículas (Humo/Graffiti de Spray)
let particulas = [];

// Puntuaciones
let puntuacion = 0;
let puntuacionMaxima = 0;

//posición de la rampa  
let desplazamientoRampaX = 15;

let musicaIniciada = false; // <--- Declárala aquí


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
function mousePressed() {
  userStartAudio().then(() => {
    if (musicaFondo && !musicaFondo.isPlaying()) {
      musicaFondo.loop();
      musicaFondo.setVolume(0.5);
    }
});
}

function keyPressed() {
  userStartAudio().then(() => {
    if (musicaFondo && !musicaFondo.isPlaying()) {
      musicaFondo.loop();
      musicaFondo.setVolume(0.5);
    }
  });

  if (key === ' ') {
    if (estadoJuego === "INICIO") {
      estadoJuego = "CINEMATICA";
    } else if (estadoJuego === "JUGANDO") {
      if (typeof jugador !== 'undefined' && jugador.saltar) {
        jugador.saltar();
      }
    } else if (estadoJuego === "GAMEOVER") {
      reiniciarJuego();
      estadoJuego = "CINEMATICA";
    }
  }
}

  // 2. Activación de la música de fondo en el primer intento
  if (!musicaIniciada && musicaFondo) {
    musicaFondo.loop();
    musicaFondo.setVolume(0.4);
    musicaIniciada = true;
  }

// ==========================================
// 4. FONDO Y AMBIENTACIÓN (Alcantarillas NY)
// ==========================================


// Fondo oculto mientras hago pruebas
function renderizarFondo() {
   image(imgFondo, 0, 0, width, height);

  // 2. CAPA DE OSCURIDAD / POCA LUZ (Overlay oscuro)
  // El último parámetro (150) es la opacidad: más alto = más oscuro (0 a 255)
  fill(10, 15, 20, 160); 
  rect(0, 0, width, height);

  // 3. Agua tóxica (resalta más en la oscuridad)
  offsetAgua += 0.05;
  noStroke();

  // Brillo sutil para el agua en la penumbra
  drawingContext.shadowBlur = 15;
  drawingContext.shadowColor = color(50, 255, 50);

  fill(40, 220, 50, 210); // Verde neón tóxico

  beginShape();
  vertex(0, height);
  for (let x = 0; x <= width; x += 20) {
    let y = height - altoAguaToxica + sin(offsetAgua + x * 0.05) * 4;
    vertex(x, y);
  }
  vertex(width, height);
  endShape(CLOSE);

  // Desactivar el brillo para el resto de los elementos que se dibujen después
  drawingContext.shadowBlur = 0;
}

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
  if (frameCount % 120 === 0) {
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
  text("FLAPPY SKATE", width / 2, height / 3);
  
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
  text("GAME OVER", width / 2, height / 3);
  
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

  // Dentro de la clase Skater:
mostrar() {
  push();
  translate(this.x, this.y);

  let angulo = map(this.velocidad, -9.5, 10, -radians(25), radians(55));
  angulo = constrain(angulo, -radians(25), radians(55));
  rotate(angulo);

  imageMode(CENTER);

  // --- INICIO EFECTO AURA VERDE RADIACTIVA ---
  drawingContext.shadowBlur = 30; // Qué tan difusa es el aura (aumenta para más efecto)
  drawingContext.shadowColor = color(50, 255, 50); // Verde neón brillante
  // --- FIN EFECTO AURA ---

  // Dibujar el personaje grande (90x90)
  if (this.velocidad < 0) {
    image(imgSkaterShoot, 0, 0, 90, 90);
  } else {
    image(imgSkaterDown, 0, 0, 90, 90);
  }

  // --- IMPORTANTE: DESACTIVAR EL AURA para no afectar el resto del juego ---
  drawingContext.shadowBlur = 0;
  // ------------------------------------------------------------------------

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
class Columna {
  constructor() {
    this.ancho = 95; 
    this.x = width;
    this.velocidad = 3.8;
    this.pasada = false;

    this.espacioApertura = 160;

    let margenSuperior = 130;
    let margenInferior = height - altoAguaToxica - 130;
    let centroHueco = random(margenSuperior, margenInferior);
    
    this.topMeta = centroHueco - (this.espacioApertura / 2);
    this.bottomY = centroHueco + (this.espacioApertura / 2);

    this.topY = -350; 
    this.vyTop = 0;           
    this.gravedadTop = 0.6;    
    this.impactado = false;

    this.fuerzaResorte = 0.25; 
    this.amortiguacion = 0.55; 
    this.altoFijo = 450; 

    // Tuberías superiores (pueden seguir siendo aleatorias)
    let listaTuberiasArriba = [
      imgTuberiaDerechaArriba,
      imgTuberiaDerechaAbajo
    ];
    this.imgTop = random(listaTuberiasArriba);

    // --- PATRÓN ESTRICTO PARA LAS TUBERÍAS INFERIORES ---
    // Patrón: [derechaAbajo, derechaAbajo, abiertaAbajo]
    let patronAbajo = [
      imgTuberiaDerechaAbajo,
      imgTuberiaDerechaAbajo,
      imgTuberiaAbiertaAbajo
    ];

    // Asignamos la imagen según el índice actual del patrón
    this.imgBottom = patronAbajo[indicePatronAbajo];

    // Avanzamos al siguiente elemento y reiniciamos el ciclo al llegar al final (3 elementos)
    indicePatronAbajo = (indicePatronAbajo + 1) % patronAbajo.length;
  }

  actualizar() {
    this.x -= this.velocidad;

    if (!this.impactado) {
      this.vyTop += this.gravedadTop;
      this.topY += this.vyTop;

      if (this.topY >= this.topMeta) {
        this.topY = this.topMeta;
        this.vyTop = -this.vyTop * 0.45;
        this.impactado = true;
      }
    } else {
      let delta = this.topY - this.topMeta;
      let fuerza = -this.fuerzaResorte * delta;
      this.vyTop += fuerza;
      this.vyTop *= this.amortiguacion;
      this.topY += this.vyTop;
    }
  }

  mostrar() {
    push();
    image(this.imgTop, this.x, this.topY - this.altoFijo, this.ancho, this.altoFijo);
    pop();

    push();
    image(this.imgBottom, this.x, this.bottomY, this.ancho, this.altoFijo);
    pop();
  }

  estaFuera() {
    return (this.x + this.ancho < 0);
  }

  colisionaCon(p) {
    // Definimos un margen de tolerancia (en píxeles) para hacer la colisión más justa
    let margenX = 15; // El skater puede "entrar" 15px en la tubería antes de morir
    let margenY = 10; // Margen vertical superior/inferior

    // Verificamos si el skater cruza la posición horizontal de la columna (con margen)
    let colisionaX = (p.x + p.tamano / 2 - margenX > this.x) && 
                     (p.x - p.tamano / 2 + margenX < this.x + this.ancho);

    // Verificamos si choca con la tubería de arriba o con la de abajo (con margen)
    let colisionaY = (p.y - p.tamano / 2 + margenY < this.topY) || 
                     (p.y + p.tamano / 2 - margenY > this.bottomY);

    // Si está en la columna y además toca la parte superior o inferior, hay muerte
    if (colisionaX && colisionaY) {
      return true;
    }
    
    return false;
  }
}
// CLASE PARTÍCULA SPRAY (Verde Radiactivo)
class ParticulaSpray {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    // Dispersión aleatoria realista del spray
    this.vx = random(-1.5, 1.5);
    this.vy = random(-0.5, 3.5); // Caen ligeramente
    // Opacidad inicial alta (255) y reducción por frame
    this.alpha = 255; 
    // Reducción aleatoria de opacidad para que no desaparezcan todas a la vez
    this.decay = random(4, 9); 
    this.tamano = random(5, 12); // Tamaños variados
  }

  actualizar() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= this.decay; // Se desvanecen
  }

  mostrar() {
    push(); // Guarda el estado actual del lienzo para que los cambios no afecten a otros objetos
    
    noStroke();
    
    // COLOR VERDE RADIACTIVO: (50, 255, 50) con la opacidad actual
    fill(50, 255, 50, this.alpha); 

    // Brillo específico SOLO para esta partícula
    drawingContext.shadowBlur = 5;
    drawingContext.shadowColor = color(50, 255, 50);

    ellipse(this.x, this.y, this.tamano);

    pop(); // Restaura el estado del lienzo, apagando automáticamente la sombra para el siguiente elemento
  }

  estaMuerta() {
    return this.alpha < 0;
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