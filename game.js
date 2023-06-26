// Obtén el elemento del lienzo (canvas)
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const playerImage = new Image();
playerImage.setAttribute("crossOrigin", "anonymous");
playerImage.src = "nave.png";

const enemyImage = new Image();
enemyImage.setAttribute("crossOrigin", "anonymous");
enemyImage.src = "ovni.png";

// Variable para almacenar la imagen del proyectil
const projectileImage = new Image();
projectileImage.src = "proyectil.png";

let projectiles = []; // Array para almacenar los proyectiles disparados

// Variables del juego
let playerX; // Posición X del jugador
let playerY; // Posición Y del jugador
let enemies = []; // Array para almacenar los enemigos
let score = 0; // Puntaje del jugador
let lives = 3; // Número de vidas del jugador
let gameOver = false; // Bandera para indicar si el juego ha terminado
let playerSpeed = 10; // Velocidad de movimiento del jugador
let enemySpeed = 7; // Velocidad de movimiento de los enemigos
let minDistance; // Distancia mínima entre el jugador y los enemigos
let leftPressed = false;
let rightPressed = false;
let showLifeLostScreen = false; // Bandera para indicar si se muestra la pantalla de "Perdiste una vida"
let lifeLostTime = 0; // Tiempo en el que se mostró la pantalla de "Perdiste una vida"
let lifeLostDuration = 2500; // Duración en milisegundos de la pantalla de "Perdiste una vida"
let secondsCounter = 0; // Contador de segundos
let playerWidth = 50; // Ancho de la nave del jugador
let playerHeight = 50; // Alto de la nave del jugador
let projectileWidth = 10;
let enemyWidth = 70;
let projectileHeight = 50;
let enemyHeight = 50;
let projectileSpeed = 10; // Velocidad del proyectil
let enemiesPerCycle = 10; // Cantidad de ovnis por ciclo
let eliminatedEnemies = []; // Lista de ovnis eliminados
let lastShotTime = 0; // Tiempo del último disparo
const shootInterval = 0.5; // Intervalo deseado entre disparos (en segundos)
let playerShootSound;
const enemySpacing = 10; // Espacio entre enemigos (ajusta el valor según tus necesidades)
let ovni1DeathSound;
let gameOverSound;
let enemiesKilled = 0;
let isPaused = false;

// Variable para almacenar el tiempo del fotograma anterior
let previousFrameTime = 0;

// Variables para el control de velocidad de los enemigos
let initialEnemySpeed = 2; // Velocidad inicial de los enemigos
let acceleration = 0.01; // Aceleración gradual de los enemigos
let accelerationInterval = 1000; // Intervalo de tiempo para aumentar la velocidad (en milisegundos)
let lastAccelerationTime = 0; // Último momento en que se aceleró la velocidad de los enemigos

function resizeCanvas() {
    // Ajustar el tamaño del lienzo al tamaño de la ventana
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Inicializar la posición del jugador y la distancia mínima
    playerX = canvas.width / 2;
    playerY = canvas.height * 0.75;
    minDistance = canvas.height * 0.5;

    draw();
}

// Llamar a la función de ajuste inicial
resizeCanvas();

// Manejar evento de redimensionamiento de ventana
window.addEventListener("resize", resizeCanvas);

function isCollision(object1, object2) {
    // Obtener las coordenadas y dimensiones de los objetos
    const obj1X = object1.x;
    const obj1Y = object1.y;
    const obj1Width = object1.width;
    const obj1Height = object1.height;

    const obj2X = object2.x;
    const obj2Y = object2.y;
    const obj2Width = object2.width;
    const obj2Height = object2.height;

    // Verificar si hay colisión entre los objetos
    if (
        obj1X < obj2X + obj2Width &&
        obj1X + obj1Width > obj2X &&
        obj1Y < obj2Y + obj2Height &&
        obj1Y + obj1Height > obj2Y
    ) {
        return true; // Hay colisión
    } else {
        return false; // No hay colisión
    }
}

function checkProjectileCollisions() {
    for (let i = 0; i < projectiles.length; i++) {
        const projectile = projectiles[i];

        if (!projectile.visible) continue; // Si el proyectil no es visible, pasar al siguiente

        for (let j = 0; j < enemies.length; j++) {
            const enemy = enemies[j];

            if (
                projectile.x < enemy.x + enemyWidth &&
                projectile.x + projectileWidth > enemy.x &&
                projectile.y < enemy.y + enemyHeight &&
                projectile.y + projectileHeight > enemy.y
            ) {
                // Colisión detectada
                projectile.visible = false;
                enemies.splice(j, 1); // Eliminar el ovni del array
                score += 50;

                // Aumentar el contador de enemigos eliminados
                enemiesKilled++;
                // Realiza otras acciones necesarias cuando hay colisión
                ovni1DeathSound.currentTime = 0; // Reiniciar el sonido para reproducirlo desde el principio
                ovni1DeathSound.play();
                break; // Salir del bucle interno para evitar colisiones múltiples con un mismo proyectil
            }
        }
    }
}

// Función principal de dibujo
function draw() {
    // Limpiar el lienzo
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar el fondo negro
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Configurar el estilo de fuente y alineación
    ctx.font = "24px Arial";
    ctx.fillStyle = "#FFFFFF";

    // Calcular el centro del canvas
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Dibujar los enemigos
    drawEnemies();

    // Dibujar al jugador
    drawPlayer();

    // Dibujar el puntaje y las vidas del jugador
    ctx.font = "20px Arial";
    ctx.fillStyle = "white";
    ctx.fillText("Puntaje: " + score, 10, 30);
    ctx.fillText("Vidas: " + lives, canvas.width - 90, 30);

    // Dibujar la cantidad de ovnis destruidos
    ctx.fillText("Enemigos destruidos: " + enemiesKilled, 10, 60);

    // Dibujar el contador de segundos en el centro de la pantalla
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("Tiempo: " + Math.floor(secondsCounter) + "s", canvas.width / 2 - 60, 30);

    // Verificar si se muestra la pantalla de "Perdiste una vida"
    if (showLifeLostScreen) {
        // Mostrar la pantalla de "Perdiste una vida"
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "30px Arial";
        const lifeLostText = "Perdiste una vida";
        const livesLeftText = "Vidas restantes: " + lives;
        const textWidth = ctx.measureText(lifeLostText).width;
        ctx.fillText(lifeLostText, canvas.width / 2 - textWidth / 2, canvas.height / 2);
        ctx.fillText(livesLeftText, canvas.width / 2 - ctx.measureText(livesLeftText).width / 2, canvas.height / 2 + 40);

        // Verificar si ha pasado el tiempo suficiente para ocultar la pantalla de "Perdiste una vida"
        if (Date.now() - lifeLostTime >= lifeLostDuration) {
            showLifeLostScreen = false;
            lifeLostTime = 0;
        }
    }


    // Verificar si el juego está en pausa
    if (isPaused) {
        // Dibujar el cartel de pausa
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = "50px Arial";
        ctx.fillStyle = "#FFFFFF";

        // Calcular la posición del cartel de pausa
        const textWidth = ctx.measureText("Juego en pausa").width;
        const textX = (canvas.width - textWidth) / 2;
        const textY = canvas.height / 2;
        ctx.fillText("Juego en pausa", textX, textY);
    }

    // Dibujar los proyectiles
    for (let i = 0; i < projectiles.length; i++) {
        const projectile = projectiles[i];
        if (projectile.visible) {
            ctx.drawImage(projectileImage, projectile.x, projectile.y, projectileWidth, projectileHeight);
        }
    }

    // Actualizar los proyectiles
    for (let i = 0; i < projectiles.length; i++) {
        const projectile = projectiles[i];
        if (projectile.visible) {
            projectile.y -= projectileSpeed;

            // Verificar colisiones entre proyectiles y enemigos
            for (let j = 0; j < enemies.length; j++) {
                const enemy = enemies[j];
                if (isCollision(projectile.x, projectile.y, projectileWidth, projectileHeight, enemy.x, enemy.y, enemyWidth, enemyHeight)) {
                    projectile.visible = false;
                    enemies.splice(j, 1);
                    score += 50;
                    break;
                }
            }

            // Verificar si el proyectil está fuera de la pantalla
            if (projectile.y < 0) {
                projectile.visible = false;
            }
        }
    }





    if (gameOver) {
        // Si el juego ha terminado, mostrar pantalla de Game Over
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "white";
        ctx.font = "40px Arial";
        ctx.fillText("Game Over", canvas.width / 2 - 100, canvas.height / 2);
        ctx.font = "20px Arial";
        ctx.fillText("Score: " + score, canvas.width / 2 - 50, canvas.height / 2 + 50);
        ctx.fillStyle = "blue";
        ctx.fillRect(canvas.width / 2 - 75, canvas.height / 2 + 100, 150, 50);
        ctx.fillStyle = "white";
        ctx.font = "24px Arial";
        ctx.fillText("Play Again", canvas.width / 2 - 60, canvas.height / 2 + 130);
        gameOverSound.play();
        // Manejar evento de clic para reiniciar el juego
        canvas.addEventListener("click", playAgain);

        return;
    }

    // Solicitar el siguiente fotograma de animación
    requestAnimationFrame(draw);
}

function drawProjectiles() {
    for (let projectile of projectiles) {
        if (projectile.visible) {
            ctx.drawImage(projectileImage, projectile.x, projectile.y);
        }
    }
}


// Función para dibujar al jugador
function drawPlayer() {
    ctx.drawImage(playerImage, playerX, playerY, 50, 50);
    // ctx.fillStyle = "blue";
    // ctx.fillRect(playerX, playerY, 50, 50);
}

// Función para dibujar a los enemigos
function drawEnemies() {
    // ctx.fillStyle = "red";
    for (let enemy of enemies) {
        ctx.drawImage(enemyImage, enemy.x, enemy.y, 70, 50);
    }
}

// Función para mover los enemigos
function moveEnemies() {
    for (let enemy of enemies) {
        enemy.y += enemySpeed;

        // Verificar colisiones entre enemigos y ajustar la posición si es necesario
        for (let otherEnemy of enemies) {
            if (enemy !== otherEnemy) {
                if (
                    enemy.x < otherEnemy.x + enemyWidth &&
                    enemy.x + enemyWidth > otherEnemy.x &&
                    enemy.y < otherEnemy.y + enemyHeight &&
                    enemy.y + enemyHeight > otherEnemy.y
                ) {
                    // Colisión detectada, ajustar la posición vertical del enemigo
                    enemy.y = otherEnemy.y + enemyHeight + enemySpacing;
                }
            }
        }

        // Verificar si el enemigo ha alcanzado la parte inferior de la pantalla
        if (enemy.y > canvas.height) {
            // Repositionar el enemigo en la parte superior con una posición aleatoria
            enemy.x = Math.random() * (canvas.width - enemyWidth);
            enemy.y = -enemyHeight - enemySpacing;
        }
    }
}


// Función para verificar colisiones entre el jugador y los enemigos
function checkCollisions() {
    for (let enemy of enemies) {
        if (
            playerX < enemy.x + enemyWidth &&
            playerX + playerWidth > enemy.x &&
            playerY < enemy.y + enemyHeight &&
            playerY + playerHeight > enemy.y
        ) {
            lives--; // Reducir una vida cuando hay una colisión

            if (lives <= 0) {
                gameOver = true;
                // Reproducir sonido de Game Over aquí
                // ...
            } else {
                // Reiniciar la posición del jugador
                playerX = canvas.width / 2;
                playerY = canvas.height * 0.75;
                // Mostrar la pantalla de "Perdiste una vida" y configurar el tiempo de visualización
                showLifeLostScreen = true;
                lifeLostTime = Date.now();
                // Restablecer la posición de los ovnis
                resetEnemies();
            }
        }
    }
}


// Función para mover al jugador
function movePlayer() {
    if (leftPressed && playerX > 0) {
        playerX -= playerSpeed;
    } else if (rightPressed && playerX < canvas.width - 50) {
        playerX += playerSpeed;
    }
}

function shoot() {
    const projectileX = playerX + playerWidth / 2 - projectileWidth / 2;
    const projectileY = playerY - projectileHeight;
    projectiles.push({ x: projectileX, y: projectileY, visible: true });
}

function update() {
    // Calcular deltaTime
    const currentTime = performance.now();
    const deltaTime = (currentTime - previousFrameTime) / 1000; // Convertir a segundos
    previousFrameTime = currentTime;

    if (!gameOver) {
        movePlayer();
        moveEnemies();
        checkCollisions();
        score++;
    }

    if (currentTime - lastAccelerationTime >= accelerationInterval) {
        enemySpeed += acceleration;
        lastAccelerationTime = currentTime;
    }

    // Incrementar el contador de segundos
    secondsCounter += deltaTime;
    checkProjectileCollisions();

    if (showLifeLostScreen) {
        if (Date.now() - lifeLostTime >= lifeLostDuration) {
            showLifeLostScreen = false;
            lifeLostTime = 0;
        }
    }

    if (enemies.length + eliminatedEnemies.length < enemiesPerCycle) {
        generateEnemies(enemiesPerCycle - enemies.length - eliminatedEnemies.length);
    }

    if (isPaused) {
        // Pausar el juego
        // setTimeout(update, 100); // Esperar 100ms antes de llamar a update() nuevamente
        return;
    }

    // Solicitar el siguiente fotograma de animación
    requestAnimationFrame(update);
}

function generateEnemies(count) {
    for (let i = 0; i < count; i++) {
        let enemyX, enemyY;
        do {
            enemyX = Math.random() * canvas.width;
            enemyY = enemyY = -enemyHeight;;
        } while (
            Math.abs(enemyX - playerX) < minDistance &&
            Math.abs(enemyY - playerY) < minDistance
        );

        // Verificar si hay ovnis eliminados y agregarlos a la lista de enemigos
        const eliminatedEnemy = eliminatedEnemies.shift();
        if (eliminatedEnemy) {
            eliminatedEnemy.visible = true;
            eliminatedEnemy.x = enemyX;
            eliminatedEnemy.y = enemyY;
            enemies.push(eliminatedEnemy);
        } else {
            enemies.push({ x: enemyX, y: enemyY, visible: true });
        }
    }
}

// Función para eliminar un ovni y agregarlo a la lista de eliminados
function eliminateEnemy(enemy) {
    const index = enemies.indexOf(enemy);
    if (index !== -1) {
        const eliminatedEnemy = enemies.splice(index, 1)[0];
        eliminatedEnemies.push(eliminatedEnemy);
    }
}

// Inicialización del juego
function init() {
    resizeCanvas();

    // Cargar el sonido de disparo
    playerShootSound = document.getElementById("playerShootSound");
    ovni1DeathSound = document.getElementById("ovni1DeathSound");
    gameOverSound = document.getElementById("gameOverSound");

    // Crear enemigos iniciales
    for (let i = 0; i < 10; i++) {
        let enemyX, enemyY;
        do {
            enemyX = Math.random() * canvas.width; // Posición X aleatoria
            enemyY = -enemyHeight; // Posición Y en la parte superior de la pantalla, por encima del límite
        } while (
            Math.abs(enemyX - playerX) < minDistance &&
            Math.abs(enemyY - playerY) < minDistance
        );

        enemies.push({ x: enemyX, y: enemyY });
    }

    // Variable para controlar si la tecla "p" está presionada
    let isPKeyPressed = false;

    // Evento de tecla presionada
    document.addEventListener("keydown", function (event) {
        if (isPaused) {
            if (event.key === "p" && !isPKeyPressed) {
                isPKeyPressed = true;
                isPaused = false;
                requestAnimationFrame(update); // Reanudar el bucle de actualización después de quitar la pausa
            }
            return; // Evitar que se procesen otros eventos de teclado mientras el juego está pausado
        }

        if (event.key === " ") {
            const projectileX = playerX + playerWidth / 2; // Posición X inicial del proyectil (centro del jugador)
            const projectileY = playerY; // Posición Y inicial del proyectil (misma altura que el jugador)
            shoot();
            projectiles.push({ x: projectileX, y: projectileY, visible: true });
        } else if (event.key === "p" && !isPKeyPressed) {
            isPKeyPressed = true;
            isPaused = true;
        } else if (event.key === "ArrowLeft") {
            leftPressed = true;
        } else if (event.key === "ArrowRight") {
            rightPressed = true;
        }
    });

    // Evento de tecla liberada
    document.addEventListener("keyup", function (event) {
        if (event.key === "ArrowLeft") {
            leftPressed = false;
        } else if (event.key === "ArrowRight") {
            rightPressed = false;
        } else if (event.key === "p") {
            isPKeyPressed = false;
        }
    });

    // Iniciar el bucle de actualización
    update();
}


function shoot() {
    

    // Resto del código de disparo
    // ...
}

function generateEnemy() {
    let enemyX, enemyY;
    do {
        enemyX = Math.random() * canvas.width;
        enemyY = -enemyHeight;
    } while (
        Math.abs(enemyX - playerX) < minDistance &&
        Math.abs(enemyY - playerY) < minDistance
    );

    enemies.push({ x: enemyX, y: enemyY, visible: true });
}

function resetEnemies() {
    enemies = [];

    for (let i = 0; i < 10; i++) {
        let enemyX, enemyY;
        do {
            enemyX = Math.random() * canvas.width;
            enemyY = Math.random() * (canvas.height * 0.2) - canvas.height;
        } while (
            Math.abs(enemyX - playerX) < minDistance &&
            Math.abs(enemyY - playerY) < minDistance
        );

        enemies.push({ x: enemyX, y: enemyY, visible: true });
    }
}

// Función para reiniciar el juego
function playAgain(event) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    if (
        mouseX > canvas.width / 2 - 75 &&
        mouseX < canvas.width / 2 + 75 &&
        mouseY > canvas.height / 2 + 100 &&
        mouseY < canvas.height / 2 + 150
    ) {
        // Reiniciar los valores del juego
        gameOver = false;
        score = 0;
        lives = 3;
        playerX = canvas.width / 2;
        playerY = canvas.height * 0.75;
        enemies = [];

        enemySpeed = initialEnemySpeed;

        // Crear nuevos enemigos
        for (let i = 0; i < 10; i++) {
            let enemyX, enemyY;
            do {
                enemyX = Math.random() * canvas.width;
                enemyY = enemyY = -enemyHeight;;
            } while (
                Math.abs(enemyX - playerX) < minDistance &&
                Math.abs(enemyY - playerY) < minDistance
            );

            enemies.push({ x: enemyX, y: enemyY });
        }
        // Reiniciar el contador de segundos
        secondsCounter = 0;
        // Reiniciar el contador de enemigos eliminados
        enemiesKilled = 0;
        // Volver a dibujar el juego
        draw();

        // Remover el evento de clic para evitar múltiples reinicios del juego
        canvas.removeEventListener("click", playAgain);
        // Iniciar la actualización del juego
        update();
    }
}


// Iniciar el juego
init();
