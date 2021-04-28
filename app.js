// ===================== GLOBAL VARIABLES AND OBJECTS ====================== //

//DOM references
const game = document.getElementById('game');
const height = document.getElementById('height');
const lives = document.getElementById('lives');
const score = document.getElementById('score');
const powerUps = document.getElementById('power-ups');
const status = document.getElementById('status');
const easyButton = document.getElementById('easy');
const hardButton = document.getElementById('hard');
const impossibleButton = document.getElementById('impossible');
const resetButton = document.getElementById('reset');
const startScreen = document.getElementById('start-screen');
const endGameWindow = document.getElementById('end-screen');
const endGameText = document.getElementById('end-game-text');

//DOM management variables
let playerScore = 0;
let playerLives = 5; //initialized by difficulty selection
let playerStatus = "Ready?";
let playerPowerUps = "None";
let platformCount = 75; //dependent on difficulty

//height and speed variables
let viewportY = 0;
let playerHorizontalSpeed = 10
let playerGustSpeed = 15;
let playerFallModifier = 0;
let playerFall = true;
let playerGlider = false;
let playerGust = false;
const pixelRatio = 10; //pixel to meter ratio
let playerStartHeight = 300; //dependent on difficulty
const backgroundImageHeight = 480; //dependent on background image
const loopSpeed = 50; //in milliseconds
/*  1 pixelRatio = 1m
    1 gameloop = loopSpeed ms
    acceleration due to gravity = 9.8m/s
    9.8(m/s)(1 pixelRatio / 1m)(1s / 1000ms)(loopSpeed / gameloop) = (playerAcceleration)px / gameloop
    This is 4.9px/gameloop at 50ms loopSpeed. This is too fast, so setting to 10*/
const playerAcceleration = 9.8*(pixelRatio)*(1/1000)*(loopSpeed);
console.log(`player acceleration: ${playerAcceleration}`); //4.9 at 10px/50ms loopSpeed
/*  terminal velocity (vT) of a human is roughly 50.6m/s
    vT = 50.6(m/s)(pixelRatio px / 1m)(1s / 1000ms)(loopSpeed / gameloop) = 25.3 px/gameloop at 10px / 50ms loopSpeed
    That's too fast, so setting to 70*/
const playerMaxFallSpeed = 50.6*(pixelRatio)*(1/1000)*(loopSpeed);
console.log(`player fall speed: ${playerMaxFallSpeed}`); //25.3 at 10px/50ms loopSpeed
let playerFallSpeed = -playerMaxFallSpeed;
const playerGliderSpeed = playerMaxFallSpeed-5;
let glideReleaseSpeed = playerGliderSpeed;

//game management variables
let gameOn = false;
let playerDistance = 0;
let obstacleSeparation = 400; //dependent on difficulty
let weaponRecharge = false;
let entityArray = []; //all non-unique entities should be stored here
let difficulty = 'easy';
let ghostMode = false;
let gameOver = false;

const difficultyOptions = {
    easy: {
        title: 'Easy',
        obstacleSeparation: 400,
        playerStartHeight: 2000,
        platformCount: 50,
        playerLives: 5
    },
    hard: {
        title: 'Hard',
        obstacleSeparation: 300,
        playerStartHeight: 5000,
        platformCount: 170,
        playerLives: 3
    },
    impossible: {
        title: 'Impossible',
        obstacleSeparation: 200,
        playerStartHeight: 10000,
        platformCount: 500,
        playerLives: 1
    }
};

// ====================== SETUP FOR CANVAS RENDERING ======================= //

const ctx = game.getContext('2d');
game.setAttribute("height", getComputedStyle(game)["height"]);
game.setAttribute("width", getComputedStyle(game)["width"]);

// ====================== ENTITIES ======================= //

class Entity{
    constructor(x, y, color, radius) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = radius;
        this.alive = true;
        this.fillStyle = this.color;
    };
    render() {
        ctx.beginPath();
        ctx.fillStyle = this.fillStyle;
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        ctx.fill();
    };
    collisionData() {
        let theData = [];
            theData.push(
                {
                    y: this.y,
                    x1: this.x - this.radius,
                    x2: this.x + this.radius
                }
            );
        return theData;
    };
    collisionEffect() {
        console.log('hit entity');
    };
};

class Coin extends Entity {
    collisionEffect() {
        if (this.alive) {
            playerScore += 100;
            this.alive = false;
        }
    };
};

function Obstacle(y=game.height, color=0){
    this.color = color;
    this.segmentCount = 5;
    this.width = game.width / this.segmentCount;
    this.segments = Array(this.segmentCount).fill(false);
    this.y = y;
    this.radius = 10;
    this.alive = true;
    this.render = function() {
        ctx.fillStyle = this.color;
        for (let i=0; i<this.segments.length; i++) {
            if (this.segments[i]) {
                ctx.fillRect(this.width*i,this.y-this.radius,this.width,this.radius*2);
            }
        }
    };
    this.collisionData = function () {
        let theData = [];
            for (let i=0; i<this.segments.length; i++) {
                if (this.segments[i]) {
                    theData.push(
                        {
                            y: this.y,
                            x1: this.width*i,
                            x2: this.width*i + this.width
                        }
                    );
                }
            }
        return theData;
    };
    this.collisionEffect = function () {
        gameEnd('Lose');
    }
    this.initialize = function() {
        this.segmentCount = (Math.floor(Math.random()*4)+2)
        this.width = game.width / this.segmentCount;
        this.segments = Array(this.segmentCount);
        for (let i=0; i<this.segments.length; i++) {
            this.segments[i]=(Boolean(Math.floor(Math.random()*2)));
        }
        this.color = 'brown';
        //make sure there is a hole
        let fillCount = 0;
        for (let i=0; i < this.segments.length; i++) {
            if (this.segments[i] == true) {fillCount++;}
        }
        if (fillCount === this.segmentCount) {
            this.segments[Math.floor(Math.random()*this.segmentCount)] = false;
        }
        //make sure there is a segment
        fillCount = 0;
        for (let i=0; i < this.segments.length; i++) {
            if (this.segments[i] == true) {fillCount++;}
        }
        if (fillCount === 0) {
            this.segments[Math.floor(Math.random()*this.segmentCount)] = true;
        }
    };
};

class Hero extends Entity {
    constructor(x, y, color, radius) {
        super(x, y, color, radius);
        this.gliderDirection = 'down';
    }
    render() {
        //set fillStyle to radial gradient
        const gradient = ctx.createRadialGradient(this.x,this.y,this.radius/2, this.x,this.y,this.radius)
        gradient.addColorStop(0, 'black');
        gradient.addColorStop(.3, `${weaponRecharge?'orange':'black'}`);
        gradient.addColorStop(1, 'black');
        this.fillStyle = gradient;
        //then render
        super.render();
        //then draw the glider
        if (playerGlider || this.gliderDirection === "down") {
            ctx.fillStyle = 'black';
            //determine direction and render
            if (this.gliderDirection === "down") {
                ctx.beginPath();
                ctx.moveTo(this.x, this.y-this.radius-5);
                ctx.lineTo(this.x+this.radius+5, this.y-this.radius*2-5);
                ctx.lineTo(this.x-this.radius-5, this.y-this.radius*2-5);
                ctx.fill();
            } else if (this.gliderDirection === "right") {
                ctx.beginPath();
                ctx.moveTo(this.x-this.radius-2, this.y-this.radius-5);
                ctx.lineTo(this.x-this.radius+2, this.y-this.radius*2-5);
                ctx.lineTo(this.x+this.radius+10, this.y-this.radius*2+5);
                ctx.fill();
            } else if (this.gliderDirection === "left") {
                ctx.beginPath();
                ctx.moveTo(this.x+this.radius+2, this.y-this.radius-5);
                ctx.lineTo(this.x+this.radius-2, this.y-this.radius*2-5);
                ctx.lineTo(this.x-this.radius-10, this.y-this.radius*2+5);
                ctx.fill();
            }
        }

    };
};

//The ground/goal
function Ground() {
    this.y = playerStartHeight*pixelRatio+hero.radius*4;
    this.alive = true;
    this.collisionData = function () {
        return [
            {
                y: this.y,
                x1: 0,
                x2: game.width
            }
        ];
    };
    this.collisionEffect = function () {
        gameEnd('WIN');
    };
    this.render = function () {
        ctx.fillStyle = '#9b5513';
        ctx.fillRect(0,this.y,game.width,game.height);
    };
}

//Create the hero!
var hero = new Hero(game.width/2, 100, 'black', 15);

// ====================== HELPER FUNCTIONS ======================= //
// CANVAS functions 
function clearCanvas(){
    ctx.clearRect(0,0,game.width,game.height);
};
function drawCanvas(){
    //draw background
	game.style.backgroundPositionY = viewportY.toString()+'px';
    if (viewportY <= -backgroundImageHeight){
        viewportY = 0;
    }
    //draw entities
    for (let i=0; i<entityArray.length; i++) {
        if (entityArray[i].alive) {
            entityArray[i].render();
        }
    }
    //draw hero
    hero.render();
};

function updateDisplay() {
    height.innerText = `Height: ${playerStartHeight - Math.round(playerDistance/pixelRatio)}m`;
    lives.innerText = `Lives: ${playerLives}`;
    score.innerText = `Score: ${playerScore}`;
    powerUps.innerText = `Power Up: ${playerPowerUps}`;
    status.innerText = playerStatus;
};

//management functions

function manageHeight(){
    //determine fall distance
    if ( !playerGlider && glideReleaseSpeed > 0 ) {
        glideReleaseSpeed -= playerAcceleration;
        //until it reaches 0
        if ( glideReleaseSpeed < 0 ) {
            glideReleaseSpeed = 0;
        }
    }
    let fallDistance = Number(`${playerFall?playerFallSpeed:0}`) 
                     + Number(`${playerGust?playerGustSpeed:0}`)
                     + glideReleaseSpeed + playerFallModifier;
    //adjust background
    viewportY += fallDistance;
    if (gameOn) {
        //adjust entity heights
        for (let i=0; i<entityArray.length; i++) {
            entityArray[i].y += fallDistance;
            //check for collision
            if (   (entityArray[i].y - entityArray[i].radius) < (hero.y + hero.radius)
                && (entityArray[i].y + entityArray[i].radius) > (hero.y - hero.radius)
                && !ghostMode) {
                    if (detectCollision(entityArray[i].collisionData()) ) {
                        entityArray[i].collisionEffect();
                    }
                }
        }
        //keep track of distance traveled
        playerDistance -= fallDistance;
    }
};

function manageGlide() {
    //if the player is not up against the edge of the screen, move in the direction of the glider
    if ( hero.gliderDirection === 'left' && hero.x - hero.radius > 0 ) {
        hero.x -= playerHorizontalSpeed;
    } else if ( hero.gliderDirection === 'right' && hero.x + hero.radius < game.width ) {
        hero.x += playerHorizontalSpeed;
    }
};

function gameStart() {
    //set obstacles
    for (let i=0; i<platformCount; i++) {
        const anObstacle = new Obstacle((i)*obstacleSeparation+game.height);
        anObstacle.initialize();
        entityArray.push(anObstacle);
    }
    //set coins
    for (let i=0; i<platformCount; i++) {
        //random number of coin spots
        const coinCount = Math.floor(Math.random()*5);
        for (let j=0; j<coinCount; j++) {
            //random chance of coin spawn at spot
            if (Math.floor(Math.random()*2)%2) {
                const aCoin = new Coin((game.width*(j+1))/(coinCount+1),
                (i)*obstacleSeparation+game.height-obstacleSeparation/2,
                'yellow', 15);
                entityArray.push(aCoin);
            }
        }
    }
    //set ground
    entityArray.push(new Ground);
    playerGlider = true;
    glideReleaseSpeed = playerGliderSpeed;
    gameOn = true;
};

function gameEnd(endStatus) {
    //end the game
    gameOn = false;
    gameOver = true;
    clearInterval();
    //set endgame text
    endGameText.innerText = `You ${endStatus}! Play again?`;
    //show endgame text
    powerUps.className = "hidden";
    endGameWindow.className = "unhidden";
};

//event listeners and keyboard interaction logic 
function movementHandler(e) {
    if(gameOn){
        if (e.which === 65) {
            //player can only turn if the glider is out
            if (playerGlider) {
                hero.gliderDirection = 'left';
            }
        }
        if (e.which === 68) {
            //player can only turn if the glider is out
            if (playerGlider) {
                hero.gliderDirection = 'right';
            } 
        }
        if (e.which === 32) {
            if (playerGlider){
                playerGlider = false;
                //hop the player upward
                glideReleaseSpeed += 25;
            } else {
                playerGlider = true;
                glideReleaseSpeed = playerGliderSpeed;
            }
        }
    }
    // key event codes - here https://keycode.info/
};

resetButton.addEventListener('click', () => {
    location.reload();
});
easyButton.addEventListener('click', () => {
    //intialize diffictulty settings
    obstacleSeparation = difficultyOptions.easy.obstacleSeparation;
    playerStartHeight = difficultyOptions.easy.playerStartHeight;
    platformCount = difficultyOptions.easy.platformCount;
    playerLives = difficultyOptions.easy.playerLives;
    //swap windows
    startScreen.className = "hidden";
    powerUps.className = "unhidden";
    //start game
    gameStart();
});
hardButton.addEventListener('click', () => {
    //intialize diffictulty settings
    obstacleSeparation = difficultyOptions.hard.obstacleSeparation;
    playerStartHeight = difficultyOptions.hard.playerStartHeight;
    platformCount = difficultyOptions.hard.platformCount;
    playerLives = difficultyOptions.hard.playerLives;
    //swap windows
    startScreen.className = "hidden";
    powerUps.className = "unhidden";
    //start game
    gameStart();
});
impossibleButton.addEventListener('click', () => {
    //intialize diffictulty settings
    obstacleSeparation = difficultyOptions.impossible.obstacleSeparation;
    playerStartHeight = difficultyOptions.impossible.playerStartHeight;
    platformCount = difficultyOptions.impossible.platformCount;
    playerLives = difficultyOptions.impossible.playerLives;
    //swap windows
    startScreen.className = "hidden";
    powerUps.className = "unhidden";
    //start game
    gameStart();
});

// ====================== GAME PROCESSES ======================= //

function gameLoop(){
    if (!gameOver) {
        manageHeight();
        manageGlide();
        clearCanvas();
        drawCanvas();
        updateDisplay();
        // console.log('game running')
    }
};

// ====================== COLLISION DETECTION ======================= //

function detectCollision(collisionData) {
    for (let i=0; i<collisionData.length; i++) {
        const obst = collisionData[i];
        //if in range of collision
        if (   (hero.x + hero.radius) > obst.x1 
            && (hero.x - hero.radius) < obst.x2 ) {
            //if over corner
            if (hero.x < obst.x1 || hero.x > obst.x2) {
                //c^2 = a^2 + b^2
                //c = sqrt(a^2 + b^2)
                const dy = hero.y - obst.y;
                const dx1 = hero.x - obst.x1;
                const dx2 = hero.x - obst.x2;
                const distance1 = Math.sqrt(dx1*dx1+dy*dy);
                const distance2 = Math.sqrt(dx2*dx2+dy*dy);
                if (distance1 < hero.radius || distance2 < hero.radius ) {
                    return true;
                }
            } else {
                return true;
            }
        }
    }
    return false;
};

// ====================== PAINT INTIAL SCREEN ======================= //

// Event Listener
document.addEventListener("DOMContentLoaded", ()=>{
    document.addEventListener("keydown",movementHandler);
    const runGame = setInterval(gameLoop, loopSpeed);
});