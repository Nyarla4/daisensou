import { btnContainer, costSpan, enemyBase, field, playerBase, stageBtn, stageScreen, titleScreen } from "./elements.js";
/** 개체 사망 후 사라지기까지 시간 */
const REMOVE_DEAD_CREATURE_DELAY = 5000;
/** 피해시 넉백 거리 */
const KNOCKBACK_DISTANCE = 10;
/** deltaTime 계산용 변수 */
let lastTime = performance.now();
/** 모든 개체 데이터 */
let creaturesData = [];
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
/** json 개체 데이터 로드 */
async function loadCreatureData() {
    const response = await fetch("./json/creatures.json");
    if (!response.ok) {
        throw new Error("Failed to load creature data: creatures.json");
    }
    return await response.json();
}
/** 스테이지 시작 */
function startStage() {
    // 타이틀 => 스테이지선택
    titleScreen.classList.remove("active");
    stageScreen.classList.add("active");
    // 스테이지 내부 시작(이후 이부분만 startStage로 남길 것)
    renderCreatureButtons();
    field.style.width = `${gameState.distance}px`;
    requestAnimationFrame(gameLoop);
}
/** 개체 소환 버튼 */
function renderCreatureButtons() {
    btnContainer.replaceChildren();
    creaturesData.forEach((creature) => {
        const creatureBtn = document.createElement("button");
        creatureBtn.textContent = creature.name;
        creatureBtn.classList.add("btn", "btn-primary");
        creatureBtn.addEventListener("click", () => {
            summonCreature(creature, true);
        });
        btnContainer.appendChild(creatureBtn);
    });
}
/** 개체 소환 함수 */
function summonCreature(creature, isPlayer) {
    if (isPlayer && gameState.cost < creature.cost) {
        console.log(`Not enough cost to set ${creature.name}!`);
        return;
    }
    if (isPlayer) {
        gameState.cost -= creature.cost;
        updateCost();
    }
    const targetArray = isPlayer ? gameState.playerCreatures : gameState.enemyCreatures;
    const newCreature = createCreatureInstance(creature, isPlayer);
    targetArray.push(newCreature);
    renderCreature(newCreature, targetArray);
    console.log(`Set ${newCreature.data.name} to field!`);
}
/** 개체 instantiate 처리 */
function createCreatureInstance(creature, isPlayer) {
    const startPosition = isPlayer ? field.clientWidth - playerBase.clientWidth : 0;
    const newCreature = {
        data: creature,
        position: startPosition,
        lastAttackTime: 0,
        element: document.createElement("div"),
        hp: creature.maxHp,
        isAlive: true,
        isPlayer,
        damaged: (damage) => {
            damageCreature(newCreature, damage);
        },
    };
    return newCreature;
}
/** 개체 렌더 */
function renderCreature(creature, sameSideCreatures) {
    const count = sameSideCreatures.filter((target) => target.data.id === creature.data.id).length;
    const sidePrefix = creature.isPlayer ? "player" : "enemy";
    creature.element.id = `${sidePrefix}-${creature.data.id}-${count}`;
    creature.element.className = "creature";
    creature.element.style.left = `${creature.position}px`;
    creature.element.innerHTML = `<img src="${creature.data.idle}" alt="${creature.data.name}">`;
    setCreatureImageDirection(creature);
    field.appendChild(creature.element);
}
/** 개체 피해 */
function damageCreature(creature, damage) {
    creature.hp = Math.max(0, creature.hp - damage);
    if (creature.hp <= 0) {
        killCreature(creature);
    }
    creature.position += creature.isPlayer ? KNOCKBACK_DISTANCE : -KNOCKBACK_DISTANCE;
    updateCreaturePosition(creature);
    console.log(`${creature.data.name} takes ${damage} damage! Current HP: ${creature.hp}`);
}
/** 개체 사망 */
function killCreature(creature) {
    setCreatureImage(creature, creature.data.die);
    creature.isAlive = false;
    setTimeout(() => {
        creature.element.remove();
    }, REMOVE_DEAD_CREATURE_DELAY);
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
    spawnQueuedEnemies(now);
    updateCreatures(gameState.playerCreatures, gameState.enemyCreatures, true, now, deltaTime);
    updateCreatures(gameState.enemyCreatures, gameState.playerCreatures, false, now, deltaTime);
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
        summonCreature(target, false);
        console.log(`Enemy ${enemyData.id} appears!`);
    }
}
/** 개체 업데이트 */
function updateCreatures(creatures, opponents, isPlayerSide, now, deltaTime) {
    creatures.forEach((creature) => {
        if (!creature.isAlive) {
            return;
        }
        const isBlockedByCreature = attackFirstOpponentInRange(creature, opponents, isPlayerSide, now);
        const isBlockedByBase = !isBlockedByCreature && attackBaseIfInRange(creature, isPlayerSide, now);
        if (!isBlockedByCreature && !isBlockedByBase) {
            moveCreature(creature, isPlayerSide, deltaTime);
        }
    });
}
function attackFirstOpponentInRange(creature, opponents, isPlayerSide, now) {
    const target = opponents.find((opponent) => {
        if (!opponent.isAlive) {
            return false;
        }
        return isPlayerSide
            ? creature.position <= opponent.position + creature.data.attackRange
            : creature.position > opponent.position - creature.data.attackRange;
    });
    if (!target) {
        return false;
    }
    attackCreature(creature, target, now);
    return true;
}
function attackBaseIfInRange(creature, isPlayerSide, now) {
    const isBaseInRange = isPlayerSide
        ? creature.position - creature.data.attackRange <= enemyBase.clientWidth
        : creature.position + creature.data.attackRange >= field.clientWidth - playerBase.clientWidth - playerBase.clientWidth;
    if (!isBaseInRange) {
        return false;
    }
    attackBase(creature, isPlayerSide, now);
    return true;
}
function attackCreature(attacker, target, now) {
    if (!canAttack(attacker, now)) {
        return;
    }
    attacker.lastAttackTime = now;
    setCreatureImage(attacker, attacker.data.attack);
    target.damaged(attacker.data.attackDamage);
}
function attackBase(creature, isPlayerSide, now) {
    if (!canAttack(creature, now)) {
        return;
    }
    creature.lastAttackTime = now;
    setCreatureImage(creature, creature.data.attack);
    if (isPlayerSide && gameState.enemyHp > 0) {
        gameState.enemyHp -= creature.data.attackDamage;
        console.log(`Enemy base takes ${creature.data.attackDamage} damage! Enemy HP: ${gameState.enemyHp}`);
    }
    if (!isPlayerSide && gameState.playerHp > 0) {
        gameState.playerHp -= creature.data.attackDamage;
        console.log(`Player base takes ${creature.data.attackDamage} damage! Player HP: ${gameState.playerHp}`);
    }
}
function canAttack(creature, now) {
    return now - creature.lastAttackTime >= creature.data.attackTerm;
}
function moveCreature(creature, isPlayerSide, deltaTime) {
    setCreatureImage(creature, creature.data.idle);
    creature.position += (isPlayerSide ? -1 : 1) * creature.data.moveSpeed * deltaTime;
    updateCreaturePosition(creature);
}
function updateCreaturePosition(creature) {
    creature.element.style.left = `${creature.position}px`;
}
function setCreatureImage(creature, src) {
    const creatureImg = creature.element.querySelector("img");
    if (creatureImg instanceof HTMLImageElement) {
        creatureImg.src = src;
    }
}
function setCreatureImageDirection(creature) {
    const creatureImg = creature.element.querySelector("img");
    if (creatureImg instanceof HTMLImageElement && !creature.isPlayer) {
        creatureImg.style.transform = "scaleX(-1)";
    }
}
async function initGame() {
    try {
        creaturesData = await loadCreatureData();
        console.log("Creature data loaded:", creaturesData);
    }
    catch (error) {
        console.error("Initialization failed:", error);
    }
}
initGame();
