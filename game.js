// Variables
let paddle, ball, bricks = [];
let rows, cols;
let level = 1, score = 0, lives = 3;
let ballLaunched = false;
let hitSound, bgMusic;
let gameOver = false, gameWin = false;

//Tamaño de la pelota y velocidad
let ballSpeed;
const PADDLE_WIDTH = 100, PADDLE_HEIGHT = 15;
const BALL_SIZE = 12, MARGIN = 30;

// Imagen de fondo
let bgImg;

// Precargar todos los sonidos del juego y la imagen de fondo
function preload() {
  hitSound = loadSound('golpe.mp3');
  bgMusic  = loadSound('musicafondo.mp3');
  bgImg    = loadImage('fondo.jpg');
}

// Canvas
function setup() {
  createCanvas(800, 600);
  resetBallAndPaddle();
  initLevel(level);
  bgMusic.setVolume(0.3);
}

// Dibujar todo el videojuego y pantalla de perdido o ganado
function draw() {
  if (bgImg) {
    image(bgImg, 0, 0, width, height);
  } else {
    background(20);
  }
  fill(255);
  textSize(16);
  text(`Nivel: ${level}   Puntos: ${score}   Vidas: ${lives}`, 160, 20);

  paddle.display();
  paddle.move();

  if (!ballLaunched && !gameOver && !gameWin) {
    ball.pos.x = paddle.pos.x + paddle.w/2;
    ball.pos.y = paddle.pos.y - ball.r/2;
    textSize(18);
    textAlign(CENTER);
    text("Presiona ESPACIO para empezar el juego", width/2, height/2);
    textAlign(LEFT);
  } else if (!gameOver && !gameWin) {
    ball.move();
    ball.checkPaddle(paddle);
    displayBricks();

    if (ball.pos.y - ball.r/2 > height) {
      lives--;
      if (lives <= 0) {
        gameOver = true;
        noLoop();
        bgMusic.stop();
        textAlign(CENTER);
        textSize(32);
        text("Juego Terminado! Presiona ESPACIO para reiniciar", width/2, height/2);
        textAlign(LEFT);
        return;
      }
      resetBallAndPaddle();
      return;
    }

    if (bricks.filter(b => !b.unbreakable).every(b => b.destroyed)) {
      if (level < 3) {
        level++;
        initLevel(level);
      } else {
        gameWin = true;
        noLoop();
        bgMusic.stop();
        textAlign(CENTER);
        textSize(32);
        text("Ganaste! Presiona ESPACIO para reiniciar", width/2, height/2);
        textAlign(LEFT);
      }
      return;
    }
  }

  ball.display();
}

// Gestion de teclas
function keyPressed() {
  // Tecla espacio para lanzar la pelota
  if (!ballLaunched && keyCode === 32 && !gameOver && !gameWin) {
    userStartAudio();                                    
    // Musica de fondo en bucle
    if (!bgMusic.isPlaying()) bgMusic.loop();           
    // Deteccion de lanzar la pelota
    ballLaunched = true;
    ball.vel = p5.Vector.random2D().mult(ballSpeed);
    if (ball.vel.y > 0) ball.vel.y *= -1;
  }
  // Tecla espacio para reinciar el juego en caso de perder o ganar
  else if ((gameOver || gameWin) && keyCode === 32) {
    resetGame();
  }
}

// Clases
class Paddle {
  constructor() {
    //Tamaño del cuadro de juego
    this.w = PADDLE_WIDTH;
    this.h = PADDLE_HEIGHT;
    //Funcion para centrar la pelota
    this.pos = createVector(width/2 - this.w/2, height - MARGIN);
    //Velocidad de la pelota
    this.speed = 8;
  }
  display() { rect(this.pos.x, this.pos.y, this.w, this.h, 5); }
  move() {
    if (keyIsDown(LEFT_ARROW)) this.pos.x = max(0, this.pos.x - this.speed);
    if (keyIsDown(RIGHT_ARROW)) this.pos.x = min(width - this.w, this.pos.x + this.speed);
  }
}

class Ball {
  constructor() {
    //Aqui se define el tamaño de la pelota
    this.r = BALL_SIZE;
    //Aqui se coloca la pelota en el centro del canvas al iniciar el juego
    this.pos = createVector(width/2, height/2);
    this.vel = createVector(0, 0);
  }
  display() { ellipse(this.pos.x, this.pos.y, this.r); }
  move() {
    this.pos.add(this.vel);
    if (this.pos.x < this.r/2 || this.pos.x > width - this.r/2) this.vel.x *= -1;
    if (this.pos.y < this.r/2) this.vel.y *= -1;
  }
  //Funcion para la colision de la pelota
  checkPaddle(p) {
    if (this.pos.x > p.pos.x && this.pos.x < p.pos.x + p.w &&
        this.pos.y + this.r/2 > p.pos.y) {
      this.vel.y *= -1;
      this.pos.y = p.pos.y - this.r/2;
    }
  }
}

// Niveles
function initLevel(lv) {
  //Aqui se definen los tamaños de los niveles (1,2,3)
  if (lv === 1)      { rows = 3; cols = 7; ballSpeed = 4;  specialBlocks = []; }
  else if (lv === 2) { rows = 5; cols = 9; ballSpeed = 5;  specialBlocks = [ floor(random(rows*cols)) ]; }
  else               { rows = 6; cols = 11; ballSpeed = 6;
    let total = rows * cols;
    //Aqui son los bloques especiales
    specialBlocks = [];
    while (specialBlocks.length < 3) {
      let idx = floor(random(total));
      if (!specialBlocks.includes(idx)) specialBlocks.push(idx);
    }
  }
  createBricks(lv);
  resetBallAndPaddle();
}

function createBricks(lv) {
  bricks = [];
  let w = (width - 2*MARGIN) / cols, h = 20;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let idx = r * cols + c;
      //Aqui se calcula cuanto hits se han dado, si el bloque es indestructible y si ya se elimino
      let hits = (specialBlocks.includes(idx) && lv > 1) ? 3 : 1;
      let unbreakable = (specialBlocks.includes(idx) && lv === 3 && specialBlocks.indexOf(idx) === 2);
      bricks.push({ x: MARGIN + c * w, y: MARGIN + r * (h + 5), w: w - 5, h: h,
                    hits: hits, destroyed: false, unbreakable: unbreakable });
    }
  }
}

function displayBricks() {
  for (let b of bricks) {
    if (b.destroyed) continue;
    //Funcion para dibujar los bloques
    fill(b.unbreakable ? 120 : b.hits === 3 ? [200,100,100] : [100,200,255]);
    rect(b.x, b.y, b.w, b.h, 3);
    // Rebote en todos los bloques
    if (ball.pos.x > b.x && ball.pos.x < b.x + b.w &&
        ball.pos.y - ball.r/2 < b.y + b.h && ball.pos.y + ball.r/2 > b.y) {
      ball.vel.y *= -1;
      if (!b.unbreakable) {
        hitSound.play();
        b.hits--;
        if (b.hits <= 0) {
          b.destroyed = true;
          score++;
        }
      }
    }
  }
}

// Reiniciar el juego en caso de presionar espacio
function resetBallAndPaddle() {
  paddle = new Paddle();
  ball   = new Ball();
  ballLaunched = false;
}

function resetGame() {
  level = 1; score = 0; lives = 3; gameOver = gameWin = false;
  loop();
  if (getAudioContext().state === 'running' && !bgMusic.isPlaying()) bgMusic.loop();
  initLevel(level);
}
