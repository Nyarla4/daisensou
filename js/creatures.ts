import { btnContainer, enemyBase, field, playerBase } from "./elements";
import { CreatureData, CreatureInstance, GameState } from "./interfaces";
import { updateCost } from "./main";

/** 개체 사망 후 사라지기까지 시간 */
const REMOVE_DEAD_CREATURE_DELAY = 5000;
/** 피해시 넉백 거리 */
const KNOCKBACK_DISTANCE = 10;
/** 모든 개체 데이터 */
export let creaturesData: CreatureData[] = [];

/** json 개체 데이터 로드 */
async function loadCreatureData(): Promise<CreatureData[]> {
    const response = await fetch("./json/creatures.json");

    if (!response.ok) {
        throw new Error("Failed to load creature data: creatures.json");
    }

    return await response.json();
}

export async function loadData() {
    creaturesData = await loadCreatureData();
}

/** 개체 소환 버튼 */
export function renderCreatureButtons(gameState: GameState) {
    btnContainer.replaceChildren();

    creaturesData.forEach((creature) => {
        const creatureBtn = document.createElement("button");
        creatureBtn.textContent = creature.name;
        creatureBtn.classList.add("btn", "btn-primary");
        creatureBtn.addEventListener("click", () => {
            summonCreature(gameState, creature, true);
        });
        btnContainer.appendChild(creatureBtn);
    });
}

/** 개체 소환 함수 */
export function summonCreature(gameState: GameState, creature: CreatureData, isPlayer: boolean) {
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
function createCreatureInstance(creature: CreatureData, isPlayer: boolean): CreatureInstance {
    const startPosition = isPlayer ? field.clientWidth - playerBase.clientWidth : 0;
    const newCreature: CreatureInstance = {
        data: creature,
        position: startPosition,
        lastAttackTime: 0,
        element: document.createElement("div"),
        hp: creature.maxHp,
        isAlive: true,
        isPlayer,
        damaged: (damage: number) => {
            damageCreature(newCreature, damage);
        },
    };

    return newCreature;
}

/** 개체 렌더 */
function renderCreature(creature: CreatureInstance, sameSideCreatures: CreatureInstance[]) {
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
function damageCreature(creature: CreatureInstance, damage: number) {
    creature.hp = Math.max(0, creature.hp - damage);

    if (creature.hp <= 0) {
        killCreature(creature);
    }

    creature.position += creature.isPlayer ? KNOCKBACK_DISTANCE : -KNOCKBACK_DISTANCE;
    updateCreaturePosition(creature);
    console.log(`${creature.data.name} takes ${damage} damage! Current HP: ${creature.hp}`);
}

/** 개체 사망 */
function killCreature(creature: CreatureInstance) {
    setCreatureImage(creature, creature.data.die);
    creature.isAlive = false;

    setTimeout(() => {
        creature.element.remove();
    }, REMOVE_DEAD_CREATURE_DELAY);
}

/** 개체 업데이트 */
export function updateCreatures(
    creatures: CreatureInstance[],
    opponents: CreatureInstance[],
    isPlayerSide: boolean,
    now: number,
    deltaTime: number,
    gameState: GameState
) {
    creatures.forEach((creature) => {
        if (!creature.isAlive) {
            return;
        }

        const isBlockedByCreature = attackFirstOpponentInRange(creature, opponents, isPlayerSide, now);
        const isBlockedByBase = !isBlockedByCreature && attackBaseIfInRange(gameState, creature, isPlayerSide, now);

        if (!isBlockedByCreature && !isBlockedByBase) {
            moveCreature(creature, isPlayerSide, deltaTime);
        }
    });
}

function attackFirstOpponentInRange(
    creature: CreatureInstance,
    opponents: CreatureInstance[],
    isPlayerSide: boolean,
    now: number,
): boolean {
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

function attackBaseIfInRange(gameState:GameState, creature: CreatureInstance, isPlayerSide: boolean, now: number): boolean {
    const isBaseInRange = isPlayerSide
        ? creature.position - creature.data.attackRange <= enemyBase.clientWidth
        : creature.position + creature.data.attackRange >= field.clientWidth - playerBase.clientWidth - playerBase.clientWidth;

    if (!isBaseInRange) {
        return false;
    }

    attackBase(gameState, creature, isPlayerSide, now);
    return true;
}

function attackCreature(attacker: CreatureInstance, target: CreatureInstance, now: number) {
    if (!canAttack(attacker, now)) {
        return;
    }

    attacker.lastAttackTime = now;
    setCreatureImage(attacker, attacker.data.attack);
    target.damaged(attacker.data.attackDamage);
}

function attackBase(gameState:GameState, creature: CreatureInstance, isPlayerSide: boolean, now: number) {
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

function canAttack(creature: CreatureInstance, now: number): boolean {
    return now - creature.lastAttackTime >= creature.data.attackTerm;
}

function moveCreature(creature: CreatureInstance, isPlayerSide: boolean, deltaTime: number) {
    setCreatureImage(creature, creature.data.idle);
    creature.position += (isPlayerSide ? -1 : 1) * creature.data.moveSpeed * deltaTime;
    updateCreaturePosition(creature);
}

function updateCreaturePosition(creature: CreatureInstance) {
    creature.element.style.left = `${creature.position}px`;
}

function setCreatureImage(creature: CreatureInstance, src: string) {
    const creatureImg = creature.element.querySelector("img");

    if (creatureImg instanceof HTMLImageElement) {
        creatureImg.src = src;
    }
}

function setCreatureImageDirection(creature: CreatureInstance) {
    const creatureImg = creature.element.querySelector("img");

    if (creatureImg instanceof HTMLImageElement && !creature.isPlayer) {
        creatureImg.style.transform = "scaleX(-1)";
    }
}