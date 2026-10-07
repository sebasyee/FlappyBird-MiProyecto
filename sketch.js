function preload() {
  // coloca el código de precarga aquí

}

function setup() {
  // coloca el código de configuración aquí
 createCanvas(600, 800); // crea un lienzo (canvas) de 600x800 píxeles
}

function draw() {
  // coloca el código de dibujo aquí
  background(220);
  square(100, 100, 50);
  circle(300,400,100)
}

/*
function windowResized() {
  // Actualiza el tamaño del lienzo (canvas) cuando 
  // la ventana cambia de tamaño
  // útil cuando canvas usa windowWidth y windowHeight
  resizeCanvas(windowWidth, windowHeight);
}
*/