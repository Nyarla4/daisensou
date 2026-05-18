import { costSpan, field, stageBtn, stageScreen, titleScreen } from "./elements.js";
import { creaturesData, loadData, renderCreatureButtons, summonCreature, updateCreatures } from "./creatures.js";
/** deltaTime 계산용 변수 */
let lastTime = performance.now();
/** 현재 게임 상태 */
const gameState = {
    cost: 0,
    playerHp: 100,
    enemyHp: 100,
    playerCreatures: [],
    enemyCreatures: [],
    distance: 500,
};
/** 현재 플레이어 상태 */
const playerConfig = {
    costPerSec: 1,
};
/** 현재 적 목록 */
const enemyQueue = [
    {
        id: "dummy",
        timing: 1000,
    },
    {
        id: "dummy",
        timing: 5000,
    },
];
// 스테이지 버튼(추후 스테이지 리스트가 나오도록 처리, startStage는 해당 스테이지 시작하도록 처리)
stageBtn.addEventListener("click", startStage);
/** 스테이지 시작 */
function startStage() {
    // 타이틀 => 스테이지선택
    titleScreen.classList.remove("active");
    stageScreen.classList.add("active");
    // 스테이지 내부 시작(이후 이부분만 startStage로 남길 것)
    renderCreatureButtons(gameState);
    field.style.width = `${gameState.distance}px`;
    requestAnimationFrame(gameLoop);
}
/** 현재 코스트 텍스트 가시화 */
export function updateCost() {
    costSpan.textContent = `Current Cost: ${Math.floor(gameState.cost)}`;
}
/** 스테이지 루프 */
function gameLoop(now) {
    const deltaTime = (now - lastTime) / 1000;
    lastTime = now;
    gainCost(deltaTime);
    spawnQueuedEnemies(now);
    updateCreatures(gameState.playerCreatures, gameState.enemyCreatures, true, now, deltaTime, gameState);
    updateCreatures(gameState.enemyCreatures, gameState.playerCreatures, false, now, deltaTime, gameState);
    requestAnimationFrame(gameLoop);
}
/** 코스트 획득 */
function gainCost(deltaTime) {
    gameState.cost += playerConfig.costPerSec * deltaTime;
    updateCost();
}
/** 큐에 있는 에너미 소환 처리 */
function spawnQueuedEnemies(now) {
    if (enemyQueue.length === 0 || now < enemyQueue[0].timing) {
        return;
    }
    const enemyData = enemyQueue.shift();
    const target = creaturesData.find((creature) => creature.id === enemyData?.id);
    if (target && enemyData) {
        summonCreature(gameState, target, false);
        console.log(`Enemy ${enemyData.id} appears!`);
    }
}
async function initGame() {
    try {
        loadData();
        console.log("Creature data loaded:", creaturesData);
    }
    catch (error) {
        console.error("Initialization failed:", error);
    }
}
initGame();
