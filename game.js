class PointsList{
	constructor(x, y, color, player2){
		this.points = [];
		this.x = x;
		this.y = y;
		this.step = 15;
        this.color = color;
        this.player2 = player2;
	}
	addPointsOnLineTo(x, y){
		var distance = dist(this.x, this.y, x, y);
		var stepX = (x - this.x) / distance * this.step;
		var stepY = (y - this.y) / distance * this.step;
		var lastIndex = this.points.length;
		while(dist(this.x, this.y, x, y) > this.step){
			this.x += stepX;
			this.y += stepY;
			this.points.push({
				"x": this.x,
				"y": this.y,
				"lastIndex": lastIndex > 0 ? lastIndex - 1 : 0,
				"nextIndex": lastIndex,
				"nextToDelete": 0,
                "deleteDepth": 0
			});
			if(lastIndex > 0){
				this.points[lastIndex - 1]["nextIndex"] = lastIndex;
			}
			lastIndex += 1;
		}
	}
	display(){
		for(let point of this.points){
			let x = point["x"];
			let y = point["y"];
			if(point["nextToDelete"] == 0){
				fill(this.color);
			} else if(point["nextToDelete"] == 1){
				fill(210, 230, 40);
			} else if(point["nextToDelete"] == 2){
				fill(230, 50, 60)
			} else{
				fill(221, 16, 224);
			}
			ellipse(x, y, 6, 6);
		}
	}
	delete(){
		var toUpdate = [];
		for(var point in this.points){
			if(this.points[point]["nextToDelete"] == 1){
				for(var other in this.points){
					var ox = this.points[other]["x"];
					var oy = this.points[other]["y"];
					var px = this.points[point]["x"];
					var py = this.points[point]["y"];		
					var distance = dist(ox, oy, px, py);
					if(distance < 25 && distance !== 0 && this.points[other]["nextToDelete"] === 0){
						toUpdate.push(other);
                        this.points[other]["deleteDepth"] = this.points[point]["deleteDepth"] + 1;
					}
                    if(dist(px, py, player.x, player.y) < 30 && !this.player2){
                        playing = false;
                        winner = true;
                    }
                    if(multiplayer){
                        if(dist(px, py, player2.x, player2.y) < 30 && this.player2){
                            playing = false;
                            winner = false;
                        }
                    }
				}
				this.points[point]["nextToDelete"] = 2;
			}
		}
		for(var item of toUpdate){
            if(this.points[item]["deleteDepth"] < maxDeleteDepth){
                this.points[item]["nextToDelete"] = 1;
            }
		}
		var point = 0;
		while(point < this.points.length){
			if(this.points[point]["nextToDelete"] == 2){
                //explode nearby enemies
                for(var enemy in enemies){
                    var px = this.points[point]["x"];
                    var py = this.points[point]["y"];
                    var ex = enemies[enemy].x;
                    var ey = enemies[enemy].y;
                    if(dist(px, py, ex, ey) <= deleteRange){
                        damageEnemy(enemy, this.player2);
                    }
                }

				this.points.splice(point, 1);
				point -= 1;
			}
			point += 1;
		}
	}
	deleteFilter(item){
		return item["nextToDelete"] !== 2;
	}
}

class Player{
	constructor(x, y, color, player2){
		this.x = x;
		this.y = y;
		this.xv = 0;
		this.yv = 0; 
		this.drag = 0.95;
        this.color = color;
        this.player2 = player2;
		this.pointsList = new PointsList(0, 0, color, player2);
        this.pointsList.addPointsOnLineTo(this.x, this.y);
	}
	update(){
	}
    display(){
        this.pointsList.display();
        fill(42, 135, 212);
        stroke(0);
        strokeWeight(2);
        ellipse(this.x, this.y, 8, 8);
        noStroke();
    }
	move(x, y){
        this.x += x;
        this.y += y;
        if(dist(this.x, this.y, this.pointsList.x, this.pointsList.y)){
    		this.pointsList.addPointsOnLineTo(this.x + x, this.y + y);
        }
	}
}
class Bullet{
    constructor(x, y, xv, yv){
        this.x = x;
        this.y = y;
        this.xv = xv;
        this.yv = yv;
        this.range = 6;
    }
    update(){
        this.x += this.xv;
        this.y += this.yv;
        if(this.x < 4 || this.x > windowWidth / 1.06 || this.y < 4 || this.y > windowHeight / 1.06){
            return false;
        }
        for(var point in player.pointsList.points){
            var px = player.pointsList.points[point]["x"];
            var py = player.pointsList.points[point]["y"];
            if(dist(px, py, this.x, this.y) <= this.range && dist(player.x, player.y, this.x, this.y) >= safeArea){
                player.pointsList.points[point]["nextToDelete"] = 1;
            }         
        }
        if(multiplayer){
            for(var point in player2.pointsList.points){
                var px = player2.pointsList.points[point]["x"];
                var py = player2.pointsList.points[point]["y"];
                if(dist(px, py, this.x, this.y) <= this.range && dist(player2.x, player2.y, this.x, this.y) >= safeArea){
                    player2.pointsList.points[point]["nextToDelete"] = 1;
                }         
            }     
        }
        return true;
    }
    display(){
        fill(0);
        ellipse(this.x, this.y, 3, 3);
    }
}
class Enemy{
    constructor(x, y, type, health, shootRate = 45, bulletSpeed = 3){
        this.x = x;
        this.y = y;
        this.type = type;
        this.bullets = [];
        this.shootRate = shootRate;
        this.bulletSpeed = bulletSpeed;
        this.health = health;
    }
    update(){
        if(this.type == "shooter"){
            this.shooterUpdate();
        }
    }
    shooterUpdate(){
        if(frameCount % this.shootRate === 0){
            var nearestPlayer;
            if(!multiplayer){
                nearestPlayer = player;
            } else {
                var playerDist = dist(this.x, this.y, player.x, player.y);
                var player2Dist = dist(this.x, this.y, player2.x, player2.y);
                nearestPlayer = playerDist < player2Dist ? player : player2;
            }
            let xv = (nearestPlayer.x - this.x) / dist(nearestPlayer.x, nearestPlayer.y, this.x, this.y) * this.bulletSpeed;
            let yv = (nearestPlayer.y - this.y) / dist(nearestPlayer.x, nearestPlayer.y, this.x, this.y) * this.bulletSpeed;         
            let bullet = new Bullet(this.x, this.y, xv, yv);
            this.bullets.push(bullet);
        }
        for(let bullet in this.bullets){
            let update = this.bullets[bullet].update();
            this.bullets[bullet].display();
            if(!update){
                this.bullets.splice(bullet, 1);
            }
        }
        noStroke();
        fill(237, 64, 64);
        ellipse(this.x, this.y, 6, 6);
    }
    damage(amount, player2){
        this.health -= amount;
        if(this.health <= 0){
            if(player2){
                player2Score += 1;
            } else{
                player1Score += 1;
            }
            return true;
        }
        return false;
    }
}

var enemies = [];
var enemySpawnRarity = 100;
var minEnemyHealth = 20;
var maxEnemyHealth = 70;
var maxEnemies = 2;

var deleteFrequency = 12;
var deleteRange = 40;
var deleteDamage = 10;

var maxDeleteDepth = 30;

var player;
var player2;
var speed = 7;
var dashSpeed = 60;
var safeArea = 120;

var dashDelay = 0;
var dashDelay2 = 0;
var dashInterval = 40;


var playing = false;
var multiplayer = false;
var winner;
var player1Score = 0;
var player2Score = 0;
var played = false;

var player1Keys = {
    "left": 65,
    "down": 83,
    "right":68,
    "up": 87,
    "dash": 16,
};
var player2Keys = {
    "left": 37,
    "down": 40,
    "right":39,
    "up": 38,
    "dash": 32,
};
function setup() {
	createCanvas(windowWidth / 1.05, windowHeight / 1.05);
	background(100);
    rectMode(CENTER);
    noStroke();
}

function draw() {
    background(200);
    if(playing){
        player.update();
        player.display();
        var movement = handleMovement(player1Keys, false);
        player.move(movement[0], movement[1]);

        if(multiplayer){
            player2.update();
            player2.display();

            var movement = handleMovement(player2Keys, true);
            player2.move(movement[0], movement[1]); 
        }

        spawnEnemies();
        updateEnemies();

        deletePoints();
    } else{
        displayHomeScreen();
        handleHomeScreenInput();
    }
}

function handleHomeScreenInput(){
    if(keyIsDown(32)){
        if(keyIsDown(77)){
            multiplayer = true;
        } else {
            multiplayer = false;
        }
        playing = true;
        enemies = [];
        player = new Player(100, 100, color("rgb(40, 140, 222)"), false);
        player1Score = 0;
        player2Score = 0;
        played = true;
        if(multiplayer){
            player2 = new Player(200, 100, color("rgb(40, 222, 88)"), true);
        }
    }
}

function displayHomeScreen(){
    fill(0);
    textSize(scaledSize(32));
    var titleText = "Mine Madness";
    var titleWidth = textWidth(titleText);
    var titleCenter = windowWidth / 2.1 / 2 - titleWidth / 2;
    text(titleText, titleCenter, 200);
    textSize(scaledSize(18));
    var subText = "Press Space to Start, m + Space for a Two Player Game"
    var subTextWidth = textWidth(subText);
    var subTextCenter = windowWidth / 2.1 / 2 - subTextWidth / 2;
    text(subText, subTextCenter, 260);
    textSize(scaledSize(16));
    if(played){
        var p1ScoreText = `Player 1 Has a Score of ${player1Score}`;
        var p1ScoreTextWidth = textWidth(p1ScoreText);
        var p1ScoreTextCenter = windowWidth / 2.1 / 2 - p1ScoreTextWidth / 2;
        text(p1ScoreText, p1ScoreTextCenter, 340);
    }
    var winnerText = "";
    if(multiplayer){
        if(!winner){
            winnerText = "Player 1 Wins"
        } else{
            winnerText = "Player 2 Wins"
        }
        var winnerTextWidth = textWidth(winnerText);
        var winnerTextCenter = windowWidth / 2.1 / 2 - winnerTextWidth / 2;
        text(winnerText, winnerTextCenter, 300);

        var p2ScoreText = `Player 2 Has a Score of ${player2Score}`;
        var p2ScoreTextWidth = textWidth(p2ScoreText);
        var p2ScoreTextCenter = windowWidth / 2.1 / 2 - p2ScoreTextWidth / 2;
        text(p2ScoreText, p2ScoreTextCenter, 380);
    }
    var rightAlign = windowWidth / 0.9 / 1.05;
    textSize(scaledSize(18));
    var aboutText = `In this game, you lay landmines anywhere you go and there will be up to two enemies shooting at you. The bullets do nothing to you if they hit you but if they hit your mines, they will blow them up causing a chain reaction. If a mine explodes next to an enemy, the enemy will die. Space to start a new game, WASD to move and Shift to dash (teleport a few inches in the direction you are moving). Multiplayer controls are the same for Player 1 (Blue) and Arrow Keys and Space to dash for Player 2 (green). First to get hit loses. Destroying an enemy gives 1 point`;
    var aboutTextWidth = windowWidth / 3;
    text(aboutText, rightAlign - aboutTextWidth, 520, aboutTextWidth, 900);
}

function scaledSize(size){
    return windowWidth / (1000 / size);
}

function handleMovement(keys, forSecond){
    dashDelay -= 1;
    dashDelay2 -= 1;
    var xMove = 0;
    var yMove = 0;
    var distanceMultiplier = speed;
    if(keyIsDown(keys["left"])){
        xMove -= 1;
    }
    if(keyIsDown(keys["down"])){
        yMove += 1;
    }
    if(keyIsDown(keys["right"])){
        xMove += 1;
    }
    if(keyIsDown(keys["up"])){
        yMove -= 1;
    }
    var delay = forSecond ? dashDelay2 : dashDelay;
    if(keyIsDown(keys["dash"]) && delay <= 0){
        distanceMultiplier = dashSpeed;
        if(!forSecond){
            dashDelay = dashInterval;
        } else{
            dashDelay2 = dashInterval;
        }
    }
    xMove *= distanceMultiplier;
    yMove *= distanceMultiplier;
    return [xMove, yMove]
}

function updateEnemies(){
    for(let enemy in enemies){
        enemies[enemy].update();
    }
}

function deletePoints(){
    if(frameCount % deleteFrequency == 0){
        player.pointsList.delete();
        if(multiplayer){
            player2.pointsList.delete();
        }
    }
}

function damageEnemy(enemy, player2){
    var dead = enemies[enemy].damage(deleteDamage, player2);
    if(dead){
        enemies.splice(enemy, 1);
    }
}

function spawnEnemies(){
    if(enemies.length < maxEnemies){
        if(round(random(0, enemySpawnRarity)) == 0){
            let enemy = new Enemy(
                random(100, windowWidth - 100),
                random(100, windowHeight - 100),
                "shooter",
                round(random(minEnemyHealth, maxEnemyHealth))
            );
            enemies.push(enemy);
        }
    }
}

function dist(x1, y1, x2, y2){
    return Math.hypot(x1 - x2, y1 - y2);
}
