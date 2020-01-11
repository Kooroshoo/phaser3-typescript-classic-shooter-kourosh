import { Asteroid } from "./Asteroid";
import { Bullet, BulletType } from "./Bullet";
import { Enemy } from "./Enemy";
import { Background } from "./Background";
import { Upgrade } from "./Upgrade";
import { EnemyHolder } from "./EnemyHolder";


  
export class Play extends Phaser.Scene {

   player: Phaser.Physics.Arcade.Sprite
   pickup: Phaser.Physics.Arcade.Sprite;
   pc: number = 8;
   playerPieces: Phaser.Physics.Arcade.Sprite[];
   asteroids: Phaser.Physics.Arcade.Group;
   moveKeys: {[key:string] : Phaser.Input.Keyboard.Key };
   lasers: Phaser.Physics.Arcade.Group;
   enemies: Phaser.Physics.Arcade.Group;
   background: Phaser.Physics.Arcade.Group;

// List of predefined enemies
   enemyHolders: EnemyHolder[];
   lastSpawn: number = 0;
   lastPickupSpawn: number = 0;

   score: number = 0;
   health: number = 3;
   healthSprites: {[key:number] : Phaser.Physics.Arcade.Sprite};
   //healthText: Phaser.GameObjects.Text;
   gunType: number = 0;
   lastSideShooted : number = 0;
   upgrades: Phaser.Physics.Arcade.Group;
   currentBullet: BulletType;
   shootCooldown: number = 300;
   upgradeCooldown: number = 0;

   scoreText: Phaser.GameObjects.Text;
   healthText2:Phaser.GameObjects.Text;

   playerEnemyCollier: Phaser.Physics.Arcade.Collider;

   constructor() {
       super("Play");
   }

   create() {
       console.log("Play.create()");

       this.background = this.physics.add.group({
           classType: Background,
           maxSize: 300,
           runChildUpdate: true
       });

       this.player = this.physics.add.sprite(320, 500, "playership1").setScale(0.5, 0.5);
       this.player.body.collideWorldBounds=true;
       this.player.body.width *= 0.5;
       this.player.body.height *= 0.5;
       this.player.body.setCircle(27);
       this.player.depth = 10;
       this.gunType = 0;
       this.currentBullet = BulletType.Default;




this.pickup = this.physics.add.sprite(320, 500, "star").setScale(0.5, 0.5);
       this.pickup.body.collideWorldBounds=true;
       this.pickup.body.width *= 0.5;
       this.pickup.body.height *= 0.5;
       this.pickup.setActive(false).setVisible(false);

       this.lastPickupSpawn = 0;

       let pw: number = this.player.width / this.pc;
       let ph: number = this.player.height / this.pc;
       this.playerPieces = [];
       for (let i: number = 0; i < this.pc; ++i) {
         for (let j: number = 0; j < this.pc; ++j) {
           let pp : Phaser.Physics.Arcade.Sprite = this.physics.add.sprite(320, 500, "playership1").setScale(0.5, 0.5).setCrop(i*pw, j*ph, pw, ph);
           pp.setActive(false).setVisible(false);
           this.playerPieces.push(pp);
         }
       }

       this.moveKeys = <{[key:string] : Phaser.Input.Keyboard.Key }> this.input.keyboard.addKeys({
           'up': Phaser.Input.Keyboard.KeyCodes.W,
           'down': Phaser.Input.Keyboard.KeyCodes.S,
           'left': Phaser.Input.Keyboard.KeyCodes.A,
           'right': Phaser.Input.Keyboard.KeyCodes.D,
           'fire': Phaser.Input.Keyboard.KeyCodes.SPACE
       });

      // Enables movement of player with WASD keys
       this.input.keyboard.on('keydown_W', function (event: object) {
           this.scene.player.setAccelerationY(-10000);
       });
       this.input.keyboard.on('keydown_S', function (event: object) {
           this.scene.player.setAccelerationY(10000);
       });
       this.input.keyboard.on('keydown_A', function (event: object) {
           this.scene.player.setAccelerationX(-10000);
       });
       this.input.keyboard.on('keydown_D', function (event: object) {
           this.scene.player.setAccelerationX(10000);
       });           

       // Stops player acceleration on uppress of WASD keys
       this.input.keyboard.on('keyup_W', function (event: object) {
           if (this.scene.moveKeys['down'].isUp)
               this.scene.player.setAccelerationY(0);
       });
       this.input.keyboard.on('keyup_S', function (event: object) {
           if (this.scene.moveKeys['up'].isUp)
               this.scene.player.setAccelerationY(0);
       });
       this.input.keyboard.on('keyup_A', function (event: object) {
           if (this.scene.moveKeys['right'].isUp)
               this.scene.player.setAccelerationX(0);
       });
       this.input.keyboard.on('keyup_D', function (event: object) {
           if (this.scene.moveKeys['left'].isUp)
               this.scene.player.setAccelerationX(0);
       });        

       
      

       // BULLET GROUP
       this.lasers = this.physics.add.group({
           classType: Bullet,
           maxSize: 20,
           runChildUpdate: true
       });           
       //Upgrades
       this.upgrades = this.physics.add.group({
           classType: Upgrade,
           maxSize: 1,
           runChildUpdate: true
       });   

       // ENEMY GROUP
       this.enemies = this.physics.add.group({
           classType: Enemy,
           maxSize: 50,
           runChildUpdate: true
       });
//ASTEROID GROUP
       this.asteroids = this.physics.add.group({
         classType: Asteroid,
         maxSize: 60,
         runChildUpdate: true
       })

      
       // LASERS kill ENEMIES
       this.physics.add.collider(this.lasers, this.enemies, this.collideLaserEnemy, null, this); // last parameter is the context passed into the callback

       // PLAYER is killed by ENEMIES
       this.playerEnemyCollier = this.physics.add.collider(this.player, this.enemies, this.collidePlayerEnemy, null, this); // last parameter is the context passed into the callback

       this.physics.add.collider(this.player, this.pickup, this.collidePickup, null, this); // last parameter is the context passed into the callback

       // PLAYER is killed by UPGRADE
       this.physics.add.collider(this.player, this.upgrades, this.collidePlayerPowerup, null, this); // last parameter is the context passed into the callback

 this.physics.add.collider(this.player, this.asteroids, this.collidePlayerEnemy, null, this);

       this.physics.add.collider(this.lasers, this.asteroids, this.collideLaserAsteroid, null, this);



       // SCORE TEXT
       this.scoreText = this.add.text(5, 5, "Score: 0", { fontFamily: "Arial Black", fontSize: 12, color: "#33ff33", align: 'left' }).setStroke('#333333', 1);

       

       this.healthText2 = this.add.text(5, 20, "Health:", { fontFamily: "Arial Black", fontSize: 12,             color: "#33ff33", align: 'left' }).setStroke('#333333', 1);
      this.healthText2.text = "health: " + this.health;

      this.initializeHealthUI();
      this.InitializeEnemiesList();
   
}

InitializeEnemiesList(){
     this.enemyHolders = [
       new EnemyHolder("blackEnemy", function(time: number, delta: number){
             this.y += this.speed * delta;
             //console.log(time);
             this.x += 2*this.speed*Math.sin(0.02*this.y)*delta;

             if (this.y > Number(this.scene.game.config.height) + 50)
             {
                 this.setActive(false);
                 this.setVisible(false);
             }
       }),
       new EnemyHolder("blueEnemy", function(x: number, y: number){
             this.y += this.speed * y;

             if (this.y > Number(this.scene.game.config.height) + 50)
             {
                 this.setActive(false);
                 this.setVisible(false);
             }
       } ),
       new EnemyHolder("greenEnemy", function(x: number, y: number){
             this.y += (this.speed * y)*2;

             if (this.y > Number(this.scene.game.config.height) + 50)
             {
                 this.setActive(false);
                 this.setVisible(false);
             }
       }),
       new EnemyHolder("redEnemy", function(x: number, y: number){
             this.y += (this.speed * y)*4;

             if (this.y > Number(this.scene.game.config.height) + 50)
             {
                 this.setActive(false);
                 this.setVisible(false);
             }
       }),
     ];

   }


   update(time: number, delta: number) {

//astroids spawn
this.lastSpawn -= delta;

if (this.lastSpawn < 0) {
           if (this.asteroids.countActive()<5)
           (this.asteroids.get() as Asteroid).launch(Phaser.Math.Between(50,400),-50,1,0,0);
}

       this.constrainVelocity(this.player, 100);

const xGunOffset = 35;
       const yGunOffset = 20;

       switch(this.gunType) {
         case 0: {
             if (this.input.keyboard.checkDown(this.moveKeys['fire'], 300)){
               let b: Bullet = this.lasers.get() as Bullet;
               if (b) {
                 b.fire(this.player.x, this.player.y, this.currentBullet
);  
               }
             }
             break;
         }
         case 1: {
             if (this.input.keyboard.checkDown(this.moveKeys['fire'], 400)){
               let b: Bullet = this.lasers.get() as Bullet;
               if (b) {
                 b.fire(this.player.x + this.lastSideShooted * xGunOffset - xGunOffset/2, this.player.y + yGunOffset, this.currentBullet
);
               }
               this.lastSideShooted = (this.lastSideShooted + 1) % 2;
             } 
             break;
         }
         case 2: {
             if (this.input.keyboard.checkDown(this.moveKeys['fire'], 300)){
               if (this.lastSideShooted % 2 == 0) {
                   let b: Bullet = this.lasers.get() as Bullet;
                   if (b) {
                     b.fire(this.player.x, this.player.y, this.currentBullet );  
                   }
               } else {
                   let b: Bullet = this.lasers.get() as Bullet;
                   if (b) {
                     b.fire(this.player.x + xGunOffset - xGunOffset/2, this.player.y + yGunOffset, this.currentBullet
); 
                   }
                   b = this.lasers.get() as Bullet;
                   if (b) {
                     b.fire(this.player.x - xGunOffset/2, this.player.y + yGunOffset, this.currentBullet
); 
                   }
               }
               this.lastSideShooted = (this.lastSideShooted + 1) % 2;
             } 
             break;
         }
         case 3: {
             if (this.input.keyboard.checkDown(this.moveKeys['fire'], 250)){
               let b: Bullet = this.lasers.get() as Bullet;
               if (b) {
                 b.fire(this.player.x, this.player.y, this.currentBullet
);  
               }
               b = this.lasers.get() as Bullet;
               if (b) {
                 b.fire(this.player.x + xGunOffset - xGunOffset/2, this.player.y + yGunOffset, this.currentBullet
); 
               }
               b = this.lasers.get() as Bullet;
               if (b) {
                 b.fire(this.player.x - xGunOffset/2, this.player.y + yGunOffset, this.currentBullet
); 
               }
               this.lastSideShooted = (this.lastSideShooted + 1) % 2;
             } 
             break;
         }
       }


//for spawning the Power Up -----------------------
this.upgradeCooldown -= delta;

       if(this.upgradeCooldown < 0)
         {
           let u: Upgrade = this.upgrades.get() as Upgrade;
           if (u) {
               u.spawn();
               this.upgradeCooldown += 10000;
           }
         

         }

//-------------------------------------
       
//background scroll
       if (this.lastSpawn < 0) {
           // SPAWN BACK
           (this.background.get() as Background).launch(Phaser.Math.Between(0, 480), -50);    
          // this.lastSpawn += 1;
       }

       if (this.lastSpawn < 0) {
           // SPAWN BACK
           (this.background.get() as Background).launch(Phaser.Math.Between(0, 480), -50);    
          // this.lastSpawn += 1;
       }

       if (this.lastSpawn < 0) {
           // SPAWN BACK
           (this.background.get() as Background).launch(Phaser.Math.Between(0, 480), -50);    
           //this.lastSpawn += 1;
       }


      //this is for spawning the star-------------------------------------
       this.lastPickupSpawn -= delta;

       if(!this.pickup.active && this.lastPickupSpawn < 0) {
           this.pickup.setActive(true).setVisible(true)
           this.pickup.setVelocity(0,0);
           this.pickup.setAcceleration(0,0);
          
           let x: number = Phaser.Math.Between(50, 400);
           let y: number = Phaser.Math.Between(25, 200);

           this.pickup.setPosition(x, y)
           this.lastPickupSpawn += 10000;
       }

       if(this.pickup.active) {
           let scale: number = Math.sin(time*0.005);
           this.pickup.setScale(0.5 + 0.1*scale, 0.5 + 0.1*scale);
       }
       //------------------------------------------

    
      // SPAWN ENEMY
       if (this.lastSpawn < 0) {
           
           (this.enemies.get() as Enemy).launch(Phaser.Math.Between(50, 400), -50);    
          
           var enemy : Enemy = this.enemies.get() as Enemy;
           var randomIndex : integer = Phaser.Math.Between(0, this.enemyHolders.length-1);
          
           enemy.init(this.enemyHolders[randomIndex]);
           enemy.launch(Phaser.Math.Between(50, 400), -50);

           //

           this.lastSpawn += 1000;
       }
   }
//--------------
// maintain player velocity to a reasonable speed
   constrainVelocity(sprite: Phaser.Physics.Arcade.Sprite, maxVelocity: number)
   {
       if (!sprite || !sprite.body)
       return;

       var angle, currVelocitySqr, vx, vy;
       vx = sprite.body.velocity.x;
       vy = sprite.body.velocity.y;
       currVelocitySqr = vx * vx + vy * vy;

       if (currVelocitySqr > maxVelocity * maxVelocity)
       {
           angle = Math.atan2(vy, vx);
           vx = Math.cos(angle) * maxVelocity;
           vy = Math.sin(angle) * maxVelocity;
           sprite.body.velocity.x = vx;
           sprite.body.velocity.y = vy;
       }
   }

//this is the Star Pickup--------------------------
collidePickup(player: Phaser.Physics.Arcade.Sprite, pickup: Phaser.Physics.Arcade.Sprite) {
       if (!player.active) return;
       if (!pickup.active) return;

       pickup.setActive(false).setVisible(false);
      
       if(this.gunType < 3) this.gunType += 1;
else {
      this.score += 25;
      this.scoreText.text = "Score: " + this.score;
}

   }

   //the Powerup Pickup
   collidePlayerPowerup(player: Phaser.Physics.Arcade.Sprite, upgrade: Upgrade)
   {
       if (!player.active) return;
       if (!upgrade.active) return;
       
       upgrade.setActive(false).setVisible(false);
       //this is for changing bullet type
       //this.currentBullet  = (this.currentBullet + 1) % 4;
       
       this.health++;
       this.updateHealthUI();

       if(this.currentBullet == BulletType.Fast)
         this.shootCooldown = 100;
       else
         this.shootCooldown = 300;

   }


   collideLaserEnemy(laser: Bullet, enemy: Enemy) {
       if (!laser.active) return;
       if (!enemy.active) return;

       laser.setActive(false).setVisible(false);
       enemy.setActive(false).setVisible(false);

       var particles_1 = this.add.particles('explosion_1');
    var emitter_1 = particles_1.createEmitter({
      speedX: {min: -100, max: 100},
      speedY: {min: -100, max: 100},
      scale: {start: 0.2, end: 0.4},
      alpha: {min: 0.2, max: 0.8},
      lifespan: {min: 150, max: 400},
    });    
    emitter_1.explode(20, enemy.x, enemy.y);

       this.score += 1;
       this.scoreText.text = "Score: " + this.score;
   }

   collidePlayerEnemy(player: Phaser.Physics.Arcade.Sprite, enemy: Enemy) {
       if (!player.active) return;
       if (!enemy.active) return;      
       enemy.setActive(false).setVisible(false);
       this.health--;
       this.updateHealthUI();
       if (this.health <= 0) {
       this.playerExplode();    	 
        }
   }

   playerExplode() {
       this.playerEnemyCollier.destroy();
       this.player.setActive(false).setVisible(false);
       this.time.delayedCall(2500, this.gameOver, [], this);
   }

   gameOver() {
       this.scene.restart();
       this.health=3;
   }

   initializeHealthUI() {
     
      
       
   }

   updateHealthUI() {
     this.healthText2.text = "health: " + this.health;
     //this.healthSprites[this.health].destroy();
   }

collideLaserAsteroid(laser: Bullet, asteroid: Asteroid){
       if (!laser.active) return;
       if (!asteroid.active) return;

        laser.setActive(false).setVisible(false);

       this.score += 1;
       this.scoreText.text = "Score: " + this.score;

       if (asteroid.size >= 3)
       {
         asteroid.setActive(false).setVisible(false);
       }
       else
       {
           asteroid.size+=1;
          
           var t:number = Phaser.Math.Between(-50,50);
           var t2:number = Phaser.Math.Between(-50,50);
           asteroid.setSprite();
          (this.asteroids.get() as Asteroid).launch(asteroid.X,asteroid.Y,asteroid.size,t,Phaser.Math.Between(-50,50));
         
           asteroid.xdif=-t;
           asteroid.ydif=Phaser.Math.Between(-50,50);
       }
   }

   

}


