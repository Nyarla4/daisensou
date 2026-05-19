import { backBtn, closeSettingsBtn, costSpan, enemyHp, field, playerHp, settingBtn, settingsModal, stageBtn, stageScreen, titleScreen, upgradeBtn, upgradeScreen } from "./elements.js";
import { creaturesData, loadCreatureData, renderCreatureButtons, summonCreature, updateCreatures } from "./creatures.js";
import { canUseCreature, loadPlayerData, playerState, rewardStageClear } from "./player.js";
import { loadStageData, renderStageButtons, showInStage, showStageSelector } from "./stages.js";
/** deltaTime 계산용 변수 */
let lastTime = performance.now();
/** 스테이지 시작 시간 */
let stageStartTime = performance.now();
/** 게임 루프 실행 여부 */
let isGameRunning = false;
/** 현재 적 목록 */
let enemyQueue = [];
/** 게임 데이터 로드 Promise */
let gameDataReady;
let gameLoopId = 0;
/** 현재 게임 상태 */
const gameState = {
    cost: 0,
    playerHp: 100,
    playerMaxHp: 100,
    enemyHp: 100,
    playerCreatures: [],
    enemyCreatures: [],
    stageData: {}
};
/** 스테이지 버튼 클릭 시 스테이지 선택 화면 표시 */
stageBtn.addEventListener("click", () => {
    void openStageSelect();
});
/** 업그레이드 버튼 클릭 시 업그레이드 화면 표시 */
upgradeBtn.addEventListener("click", () => {
    titleScreen.classList.remove("active");
    upgradeScreen.classList.add("active");
});
/** 뒤로 버튼 클릭 시 */
backBtn.addEventListener("click", () => {
    if (stageScreen.classList.contains("active")) {
        stageScreen.classList.remove("active");
    }
    if (upgradeScreen.classList.contains("active")) {
        upgradeScreen.classList.remove("active");
    }
    titleScreen.classList.add("active");
});
/** 설정 버튼 클릭 시 */
settingBtn.addEventListener("click", () => {
    settingBtn.disabled = true;
    settingsModal.style.display = "block";
});
/** 설정 모달 닫기 버튼 클릭 시 */
closeSettingsBtn.addEventListener("click", () => {
    settingsModal.style.display = "none";
    settingBtn.disabled = false;
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
function startStage(stageData) {
    showInStage();
    resetGameState(stageData);
    renderCreatureButtons(gameState, canUseCreature, updateCost);
    field.style.width = `${gameState.stageData.stageDistance}px`;
    lastTime = performance.now();
    stageStartTime = lastTime;
    if (!isGameRunning) {
        isGameRunning = true;
        gameLoopId = requestAnimationFrame(gameLoop);
    }
}
/** 스테이지 데이터 기준 게임 상태 초기화 */
function resetGameState(stageData) {
    gameState.cost = 0;
    gameState.playerMaxHp = playerState.upgrades.currentHp;
    gameState.playerHp = gameState.playerMaxHp;
    playerHp.textContent = `${gameState.playerHp}/${gameState.playerMaxHp}`;
    gameState.enemyHp = stageData.enemyHp;
    enemyHp.textContent = `${gameState.enemyHp}/${stageData.enemyHp}`;
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
function gameLoop(now) {
    const deltaTime = (now - lastTime) / 1000;
    lastTime = now;
    gainCost(deltaTime);
    spawnQueuedEnemies(now - stageStartTime);
    updateCreatures(gameState.playerCreatures, gameState.enemyCreatures, true, now, deltaTime, gameState);
    updateCreatures(gameState.enemyCreatures, gameState.playerCreatures, false, now, deltaTime, gameState);
    checkGameOver(gameState.stageData);
    if (isGameRunning) {
        gameLoopId = requestAnimationFrame(gameLoop);
    }
}
/** 코스트 획득 */
function gainCost(deltaTime) {
    gameState.cost += playerState.upgrades.costPerSec * deltaTime;
    updateCost();
}
/** 큐에 있는 에너미 소환 처리 */
function spawnQueuedEnemies(stageElapsedTime) {
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
function checkGameOver(stageData) {
    if (gameState.playerHp <= 0) {
        alert("Game Over! You lost.");
        isGameRunning = false;
        cancelAnimationFrame(gameLoopId);
        openStageSelect();
    }
    else if (gameState.enemyHp <= 0) {
        alert("Congratulations! You won!");
        isGameRunning = false;
        rewardStageClear(stageData);
        cancelAnimationFrame(gameLoopId);
        openStageSelect();
    }
}
/** 게임 초기화 */
async function initGame() {
    try {
        await Promise.all([loadCreatureData(), loadStageData(), loadPlayerData()]);
        console.log("Creature data loaded:", creaturesData);
    }
    catch (error) {
        console.error("Initialization failed:", error);
    }
}
gameDataReady = initGame();
