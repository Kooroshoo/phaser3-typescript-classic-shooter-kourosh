import { Boot } from "./Boot";
import { Play } from "./Play";

// Setting up the Phaser 3; game config is configuring Phaser 3 engine in index.ts
export var gameConfig = {
        type: Phaser.AUTO,
        width: 480,
        height: 640,
        backgroundColor: 0x000000,
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 0 }
            }
        },
        scene: [Boot, Play],        
    };