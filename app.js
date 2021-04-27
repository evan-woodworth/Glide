// ===================== GLOBAL VARIABLES AND OBJECTS ====================== //

//DOM references
const game = document.getElementById('game');
const height = document.getElementById('height');
const lives = document.getElementById('lives');
const score = document.getElementById('score');
const powerUps = document.getElementById('power-ups');
const status = document.getElementById('status');

//DOM management variables
let playerScore = 0;
let playerLives = 5; //initialized by difficulty selection
let playerStatus = "Ready?";
let playerPowerUps = "None";
let platformCount = 20; //dependent on difficulty

//height variables
let viewportY = 0;
let playerFallSpeed = -15;
let playerGliderSpeed = 10;
let playerGustSpeed = 15;
let playerFallModifier = -10;
let playerFall = true;
let playerGlider = true;
let playerGust = false;
let playerStartHeight = 75; //dependent on difficulty
const backgroundImageHeight = 480; //dependent on background image

//game management variables
let gameOn = false;
let playerDistance = 0;
let obstacleSeparation = 400; //dependent on difficulty
let weaponRecharge = false;
let entityArray = []; //all non-unique entities should be stored here
let difficulty = 'easy';

const difficultyOptions = {
    easy: {
        title: 'Easy',
        obstacleSeparation: 400,
        playerStartHeight: 300,
        platformCount: Math.floor((this.playerStartHeight*100)/this.obstacleSeparation)+1,
        playerLives: 5
    },
    hard: {
        title: 'Hard',
        obstacleSeparation: 300,
        playerStartHeight: 500,
        platformCount: Math.floor((this.playerStartHeight*100)/this.obstacleSeparation)+1,
        playerLives: 3
    },
    impossible: {
        title: 'Impossible',
        obstacleSeparation: 200,
        playerStartHeight: 1000,
        platformCount: Math.floor((this.playerStartHeight*100)/this.obstacleSeparation)+1,
        playerLives: 1
    }
};


// ====================== SETUP FOR CANVAS RENDERING ======================= //

const ctx = game.getContext('2d');
game.setAttribute("height", getComputedStyle(game)["height"]);
game.setAttribute("width", getComputedStyle(game)["width"]);

// ====================== SETUP FOR CANVAS RENDERING ======================= //

// ctx.fillStyle = 'white';
// ctx.strokeStyle = 'red';
// ctx.lineWidth = 5;

// ctx.fillRect(10, 10, 100, 100);
// ctx.strokeRect(10,10,100,100);

// Create a radial gradient
// The inner circle is at x=110, y=90, with radius=30
// The outer circle is at x=100, y=100, with radius=70
// var gradient = ctx.createRadialGradient(100,100,10, 100,100,20);

// // Add three color stops
// gradient.addColorStop(0, 'black');
// gradient.addColorStop(.5, 'green');
// gradient.addColorStop(1, 'black');

// // Set the fill style and draw a rectangle
// // ctx.fillStyle = gradient;
// // ctx.fillRect(20, 20, 160, 160);
// ctx.beginPath();
// ctx.arc(100, 100, 20, 0, 2 * Math.PI);
// ctx.fillStyle = gradient;
// ctx.fill();

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
    render(){
        ctx.beginPath();
        ctx.fillStyle = this.fillStyle;
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        ctx.fill();
    };
}

function Obstacle(y=game.height, color=0){
    this.color = color;
    this.segmentCount = 5;
    this.width = game.width / this.segmentCount;
    this.segments = Array(this.segmentCount).fill(false);
    this.y = y;
    this.alive = false;
    this.render = function(){
        ctx.fillStyle = this.color;
        for (let i=0; i<this.segments.length; i++) {
            if (this.segments[i]) {
                ctx.fillRect(this.width*i,this.y,this.width,20);
            }
        }
    };
    this.initialize = function(){
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
}

class Hero extends Entity {
    constructor(x, y, color, radius) {
        super(x, y, color, radius);
        this.gliderDirection = 'down';
    }
    render(){
        //set fillStyle to radial gradient
        const gradient = ctx.createRadialGradient(this.x,this.y,this.radius/2, this.x,this.y,this.radius)
        gradient.addColorStop(0, 'black');
        gradient.addColorStop(.3, `${weaponRecharge?'orange':'black'}`);
        gradient.addColorStop(1, 'black');
        this.fillStyle = gradient;
        //then render
        super.render();
        //then draw the glider
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
    };
}

var hero = new Hero(game.width/2, 100, 'black', 15);

// ====================== HELPER FUNCTIONS ======================= //
// SANDBOX FOR TESTING PAINTING TECHNIQUES 
function clearCanvas(){
    ctx.clearRect(0,0,game.width,game.height);
}
function drawCanvas(){
    //draw background
	game.style.backgroundPositionY = viewportY.toString()+'px';
    if (viewportY <= -backgroundImageHeight){
        viewportY = 0;
    }
    //draw entities
    for (let i=0; i<entityArray.length; i++) {
        entityArray[i].render();
    }
    //draw hero
    hero.render();
};

function manageHeight(){
    //determine fall distance
    let fallDistance = Number(`${playerFall?playerFallSpeed:0}`) 
                     + Number(`${playerGust?playerGustSpeed:0}`)
                     + Number(`${playerGlider?playerGliderSpeed:0}`)
                     + playerFallModifier;
    //adjust background
    viewportY += fallDistance;
    if (gameOn) {
        //adjust entity heights
        for (let i=0; i<entityArray.length; i++) {
            entityArray[i].y += fallDistance;
        }
        //keep track of distance traveled
        playerDistance -= fallDistance;
    }

}

function gameStart() {
    for (let i=0; i<platformCount; i++) {
        const anObstacle = new Obstacle((i)*obstacleSeparation+game.height);
        anObstacle.initialize();
        entityArray.push(anObstacle);
    }
    playerFallModifier = 0;
    gameOn = true;
}

function updateDisplay() {
    height.innerText = `Height: ${playerStartHeight - Math.floor(playerDistance/100)}m`;
    lives.innerText = `Lives: ${playerLives}`;
    score.innerText = `Score: ${playerScore}`;
    powerUps.innerText = `Power Ups: ${playerPowerUps}`;
    status.innerText = playerStatus;
}


// game.addEventListener("click", (e)=>{
//     // clearCanvas();
//     // console.log(e);
//     // let newCrawler = new Crawler(e.offsetX, e.offsetY, "blue", 50, 50);
//     // newCrawler.render();
//     // crawlerArray.push(newCrawler);
//     randomCrawler.x = e.offsetX;
//     randomCrawler.y = e.offsetY;
//     refreshCanvas();
// });



//  GUI 



//  KEYBOARD INTERACTION LOGIC 
function movementHandler(e) {
    if(gameOn){
        // if (e.which === 87){

        // }
        // if (e.which === 83){
        //     hero.y += 10;
        // }
        if (e.which === 65){
            hero.x -= 15;
        }
        if (e.which === 68){
            hero.x += 15;
        }
        // if(detectHit(hero, ogre)){
        //     ogre.alive = false;
        // }
    }


    // key event codes - here https://keycode.info/
}


// ====================== GAME PROCESSES ======================= //

function gameLoop(){
    manageHeight();
    clearCanvas();
    drawCanvas();
    updateDisplay();
    // console.log('game running')
}

// ====================== COLLISION DETECTION ======================= //

function detectHit(p1, p2){
    if (   p1.x < (p2.x + p2.width) 
        && p1.y < (p2.y + p2.height) 
        && p2.x < (p1.x + p1.width) 
        && p2.y < (p1.y + p1.height)) {
            return true;
        }
}

// ====================== PAINT INTIAL SCREEN ======================= //

// Event Listener
document.addEventListener("DOMContentLoaded", ()=>{
    document.addEventListener("keydown",movementHandler);
    const runGame = setInterval(gameLoop, 60);
})

// KEYPRESS LISTENER

