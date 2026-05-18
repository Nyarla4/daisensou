export interface CreatureData {
    id: string;
    name: string;
    idle: string;
    attack: string;
    die: string;
    moveSpeed: number;
    attackRange: number;
    attackTerm: number;
    attackDamage: number;
    coolTime: number;
    cost: number;
    maxHp: number;
    canAttackMultipleTargets: boolean;
}

export interface CreatureInstance {
    data: CreatureData;
    position: number;
    lastAttackTime: number;
    element: HTMLDivElement;
    hp: number;
    isPlayer: boolean;
    isAlive: boolean;
    damaged: (damage: number) => void;
}

export interface GameState {
    cost: number;
    playerHp: number;
    enemyHp: number;
    playerCreatures: CreatureInstance[];
    enemyCreatures: CreatureInstance[];
    distance: number;
}

export interface PlayerConfig {
    costPerSec: number;
}

export interface EnemySpawn {
    id: string;
    timing: number;
}

export interface StageData {
    no: string;
    enemies: EnemySpawn[];
    stageDistance: number;
}
