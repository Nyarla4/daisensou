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
    stageData: StageData;
}

export interface PlayerState {
    currency: number;
    upgrades: {
        costPerSec: number,
        rewardMultiplier: number,
        currentHp: number
    },
    creatureLevels: {
        [key: string]: number
    },
    clearedStages: string[]
}

export interface EnemySpawn {
    id: string;
    timing: number;
}

export interface StageData {
    id: string;
    name: string;
    enemies: EnemySpawn[];
    stageDistance: number;
    reward: number;
    enemyHp: number;
}
