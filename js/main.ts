import { costSpan, field, stageBtn, stageScreen, titleScreen } from "./elements.js";
import { creaturesData, loadCreatureData, renderCreatureButtons, summonCreature, updateCreatures } from "./creatures.js";
import { EnemySpawn, GameState, PlayerState, StageData } from "./interfaces.js";
import { loadStageData, renderStageButtons, showInStage, showStageSelector } from "./stages.js";

/** deltaTime 계산용 변수 */
let lastTime = performance.now();

/** 스테이지 시작 시간 */
let stageStartTime = performance.now();

/** 게임 루프 실행 여부 */
let isGameRunning = false;

/** 현재 적 목록 */
let enemyQueue: EnemySpawn[] = [];

/** 게임 데이터 로드 Promise */
let gameDataReady: Promise<void>;

/** 현재 게임 상태 */
const gameState: GameState = {
    cost: 0,
    playerHp: 100,
    enemyHp: 100,
    playerCreatures: [],
    enemyCreatures: [],
    stageData: {} as StageData
};

/** 현재 플레이어 상태 */
const playerConfig: PlayerState = {
    currency: 100,
    upgrades: {
        costPerSec: 1,
        rewardMultiplier: 1,
        nextUpgrade: 0
    },
    creatureLevels: {
        dummy: 0,
        dummy2: 1
    },
    clearedStages: ["1"]
};

// 스테이지 버튼 클릭 시 스테이지 선택 화면 표시
stageBtn.addEventListener("click", () => {
    void openStageSelect();
});

/** 스테이지 선택 화면 열기 */
async function openStageSelect() {
    await gameDataReady;
    titleScreen.classList.remove("active");
    stageScreen.classList.add("active");
    showStageSelector();
    renderStageButtons(startStage);
}

/** 스테이지 시작 */
function startStage(stageData: StageData) {
    showInStage();
    resetGameState(stageData);
    renderCreatureButtons(gameState, updateCost);
    field.style.width = `${gameState.stageData.stageDistance}px`;

    lastTime = performance.now();
    stageStartTime = lastTime;
    if (!isGameRunning) {
        isGameRunning = true;
        requestAnimationFrame(gameLoop);
    }
}

/** 스테이지 데이터 기준 게임 상태 초기화 */
function resetGameState(stageData: StageData) {
    gameState.cost = 0;
    gameState.playerHp = 100;
    gameState.enemyHp = 100;
    gameState.playerCreatures = [];
    gameState.enemyCreatures = [];
    gameState.stageData = stageData;
    enemyQueue = [...stageData.enemies];
    field.querySelectorAll(".creature").forEach((creature) => creature.remove());
    updateCost();
}

/** 현재 코스트 텍스트 가시화 */
function updateCost() {
    costSpan.textContent = `Current Cost: ${Math.floor(gameState.cost)}`;
}

/** 스테이지 루프 */
function gameLoop(now: number) {
    const deltaTime = (now - lastTime) / 1000;
    lastTime = now;

    gainCost(deltaTime);
    spawnQueuedEnemies(now - stageStartTime);
    updateCreatures(gameState.playerCreatures, gameState.enemyCreatures, true, now, deltaTime, gameState);
    updateCreatures(gameState.enemyCreatures, gameState.playerCreatures, false, now, deltaTime, gameState);

    checkGameOver(gameState.stageData);
    requestAnimationFrame(gameLoop);
}

/** 코스트 획득 */
function gainCost(deltaTime: number) {
    gameState.cost += playerConfig.upgrades.costPerSec * deltaTime;
    updateCost();
}

/** 큐에 있는 에너미 소환 처리 */
function spawnQueuedEnemies(stageElapsedTime: number) {
    if (enemyQueue.length === 0 || stageElapsedTime < enemyQueue[0].timing) {
        return;
    }

    const enemyData = enemyQueue.shift();
    const target = creaturesData.find((creature) => creature.id === enemyData?.id);

    if (target && enemyData) {
        summonCreature(gameState, target, false);
        console.log(`Enemy ${enemyData.id} appears!`);
    }
}

/** 게임오버 체크 */
function checkGameOver(stageData: StageData) {
    if (gameState.playerHp <= 0) {
        alert("Game Over! You lost.");
        isGameRunning = false;
        openStageSelect();
    } else if (gameState.enemyHp <= 0) {
        alert("Congratulations! You won!");
        isGameRunning = false;
        if (!playerConfig.clearedStages.includes(stageData.id)) {
            playerConfig.clearedStages.push(stageData.id);
        }
        playerConfig.currency += stageData.reward; // 스테이지 클리어 보상
        openStageSelect();
    }
}

/** 게임 초기화 */
async function initGame() {
    try {
        await Promise.all([loadCreatureData(), loadStageData()]);
        console.log("Creature data loaded:", creaturesData);
    } catch (error) {
        console.error("Initialization failed:", error);
    }
}

gameDataReady = initGame();
