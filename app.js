// GLOBAL DOM VARIABLES

const game = document.getElementById('game');
game.style.backgroundPositionY = '0px';
let entityArray = [];
let viewportY = 0;
let playerFallSpeed = -15;
let playerGliderSpeed = 10;
let playerGustSpeed = 15;
let playerFall = true;
let playerGlider = true;
let playerGust = false;
let progress = 0;
const backgroundImageHeight = 480;

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
var gradient = ctx.createRadialGradient(100,100,10, 100,100,20);

// Add three color stops
gradient.addColorStop(0, 'black');
gradient.addColorStop(.5, 'green');
gradient.addColorStop(1, 'black');

// Set the fill style and draw a rectangle
// ctx.fillStyle = gradient;
// ctx.fillRect(20, 20, 160, 160);
ctx.beginPath();
ctx.arc(100, 100, 20, 0, 2 * Math.PI);
ctx.fillStyle = gradient;
ctx.fill();


// (function renderGame() {
// 	window.requestAnimationFrame(renderGame);
	
// 	ctx.clearRect(0, 0, game.width, game.height);
	
// 	ctx.fillStyle = '#333';
// 	ctx.fillRect(0, 0, game.width, game.height);
	
// 	ctx.drawImage(img, vy, 50);
// 	ctx.drawImage(img, img.height-Math.abs(vy), 50);
	
// 	if (Math.abs(vx) > img.height) {
// 		vx = 0;
// 	}
	
// 	vy -= 2;
// }());
// ====================== ENTITIES ======================= //

function Entity(x,y,color,radius){
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = radius;
    this.alive = true;
    this.render = function(){
        ctx.fillStyle = this.color;
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        ctx.fill();
    }
}

function Obstacle(color=0){
    this.color = color;
    this.segmentCount = 5;
    this.width = game.width / this.segmentCount;
    this.segments = Array(this.segmentCount).fill(false);
    this.y = game.height;
    this.render = function(){
        ctx.fillStyle = this.color;
        for (let i=0; i<this.segments.length; i++) {
            if (this.segments[i]) {
                ctx.fillRect(this.width*i,this.y,this.width,20);
            }
        }
    };
    this.initialize = function(){
        this.segmentCount = (Math.floor(Math.random()*4)+1)
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
        if (fillCount == this.segmentCount) {
            this.segments[Math.floor(Math.random()*this.segmentCount)] = false;
        }
    };
}



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
        //keep track of fall distance
        progress++;
    }
    //draw entities
    for (let i=0; i<entityArray.length; i++) {
        entityArray[i].render();
    }
    
};

function manageHeight(){
    //determine fall distance
    let fallDistance = Number(`${playerFall?playerFallSpeed:0}`) 
                     + Number(`${playerGust?playerGustSpeed:0}`)
                     + Number(`${playerGlider?playerGliderSpeed:0}`);
    //adjust background
    viewportY += fallDistance;
    //adjust entity heights
    for (let i=0; i<entityArray.length; i++) {
        entityArray[i].y += fallDistance;
    }
}

function drawBox(x,y,size,color) {
    ctx.fillStyle = color;
    ctx.fillRect(x,y,size,size);
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
    if (e.which === 87){
        const anObstacle = new Obstacle();
        anObstacle.initialize();
        entityArray.push(anObstacle);
    }
    // if (e.which === 83){
    //     hero.y += 10;
    // }
    // if (e.which === 65){
    //     hero.x -= 20;
    // }
    // if (e.which === 68){
    //     hero.x += 20;
    // }
    // if(detectHit(hero, ogre)){
    //     ogre.alive = false;
    // }
    // key event codes - here https://keycode.info/
}


// ====================== GAME PROCESSES ======================= //

function gameLoop(){
    manageHeight();
    clearCanvas();
    drawCanvas();
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

