class PointsList{
	constructor(x, y){
		this.points = [];
		this.x = x;
		this.y = y;
		this.step = 15;
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
				fill(30, 100, 230);
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
                    if(dist(px, py, player.x, player.y) < 30){
                        playing = false;
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
                        damageEnemy(enemy);
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
	constructor(x, y, keys){
		this.x = x;
		this.y = y;
		this.keys = keys;
		this.xv = 0;
		this.yv = 0; 
		this.drag = 0.95;
		this.pointsList = new PointsList(0, 0);
        this.pointsList.addPointsOnLineTo(100, 100);
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
            if(dist(px, py, this.x, this.y) <= this.range){
                player.pointsList.points[point]["nextToDelete"] = 1;
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
            let xv = (player.x - this.x) / dist(player.x, player.y, this.x, this.y) * this.bulletSpeed;
            let yv = (player.y - this.y) / dist(player.x, player.y, this.x, this.y) * this.bulletSpeed;         
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
    damage(amount){
        this.health -= amount;
        if(this.health <= 0){
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

var player = new Player(100, 100);
var speed = 7;
var dashSpeed = 60;

var dashDelay = 0;
var dashInterval = 40;

var score = 0;
var playing = false;
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
        var movement = handleMovement();
        player.move(movement[0], movement[1]);

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
        playing = true;
        enemies = [];
        player = new Player(100, 100);
    }
}

function displayHomeScreen(){
    fill(0);
    textSize(32);
    var titleText = "Explode Dot";
    var titleWidth = textWidth(titleText);
    var titleCenter = windowWidth / 2 - titleWidth;
    text(titleText, titleCenter, 200);
    textSize(18);
    var subText = "Press Space to Start"
    var subTextWidth = textWidth(subText);
    var subTextCenter = windowWidth / 2 - subTextWidth;
    text(subText, subTextCenter, 260);
}

function handleMovement(){
    dashDelay -= 1;
    var xMove = 0;
    var yMove = 0;
    var distanceMultiplier = speed;
    if(keyIsDown(65)){
        xMove -= 1;
    }
    if(keyIsDown(83)){
        yMove += 1;
    }
    if(keyIsDown(68)){
        xMove += 1;
    }
    if(keyIsDown(87)){
        yMove -= 1;
    }
    if(keyIsDown(32) && dashDelay <= 0){
        distanceMultiplier = dashSpeed;
        dashDelay = dashInterval;
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
    }
}

function damageEnemy(enemy){
    var dead = enemies[enemy].damage(deleteDamage);
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