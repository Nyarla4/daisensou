import { btnContainer, enemyBase, field, playerBase } from "./elements.js";
/** 개체 사망 후 사라지기까지 시간 */
const REMOVE_DEAD_CREATURE_DELAY = 5000;
/** 피해시 넉백 거리 */
const KNOCKBACK_DISTANCE = 10;
/** 모든 개체 데이터 */
export let creaturesData = [];
/** json 개체 데이터 로드 */
async function fetchCreatureData() {
    const response = await fetch("./json/creatures.json");
    if (!response.ok) {
        throw new Error("Failed to load creature data: creatures.json");
    }
    return await response.json();
}
/** 전체 개체 데이터 로드 */
export async function loadCreatureData() {
    creaturesData = await fetchCreatureData();
}
/** 개체 소환 버튼 */
export function renderCreatureButtons(gameState, updateCost) {
    btnContainer.replaceChildren();
    creaturesData.forEach((creature) => {
        const creatureBtn = document.createElement("button");
        creatureBtn.textContent = creature.name;
        creatureBtn.classList.add("btn", "btn-primary");
        creatureBtn.addEventListener("click", () => {
            summonCreature(gameState, creature, true, updateCost);
        });
        btnContainer.appendChild(creatureBtn);
    });
}
/** 개체 소환 함수 */
export function summonCreature(gameState, creature, isPlayer, updateCost) {
    if (isPlayer && gameState.cost < creature.cost) {
        console.log(`Not enough cost to set ${creature.name}!`);
        return;
    }
    if (isPlayer) {
        gameState.cost -= creature.cost;
        updateCost?.();
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
    var hpDiv = document.createElement("div");
    hpDiv.id = creature.element.id + "_hp";
    hpDiv.style.width = "100%";
    hpDiv.style.height = "10px";
    hpDiv.style.backgroundColor = "red";
    creature.element.appendChild(hpDiv);
    creature.element.innerHTML += `<img src="${creature.data.idle}" alt="${creature.data.name}">`;
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
    const hpBar = creature.element.querySelector("img")?.querySelector("div");
    if (hpBar) {
        hpBar.style.width = Math.floor((creature.hp / creature.data.maxHp * 100)) + "%";
    }
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
/** 개체 업데이트 */
export function updateCreatures(creatures, opponents, isPlayerSide, now, deltaTime, gameState) {
    creatures.forEach((creature) => {
        if (!creature.isAlive) {
            return;
        }
        const isBlockedByCreature = attackOpponentsInRange(creature, opponents, isPlayerSide, now);
        const isBlockedByBase = !isBlockedByCreature && attackBaseIfInRange(gameState, creature, isPlayerSide, now);
        if (!isBlockedByCreature && !isBlockedByBase) {
            moveCreature(creature, isPlayerSide, deltaTime);
        }
    });
}
/** 공격 범위 내 상대 개체 공격 */
function attackOpponentsInRange(creature, opponents, isPlayerSide, now) {
    const targets = getAttackableOpponents(creature, opponents, isPlayerSide);
    if (targets.length <= 0) {
        return false;
    }
    attackCreatures(creature, getAttackTargets(creature, targets), now);
    return true;
}
/** 공격 가능한 상대 개체 목록 */
function getAttackableOpponents(creature, opponents, isPlayerSide) {
    return opponents.filter((opponent) => {
        if (!opponent.isAlive) {
            return false;
        }
        return isPlayerSide
            ? creature.position <= opponent.position + creature.data.attackRange
            : creature.position > opponent.position - creature.data.attackRange;
    });
}
/** 실제 공격 대상 목록 */
function getAttackTargets(creature, targets) {
    return creature.data.canAttackMultipleTargets ? targets : targets.slice(0, 1);
}
/** 베이스 공격 범위 확인 */
function attackBaseIfInRange(gameState, creature, isPlayerSide, now) {
    const isBaseInRange = isPlayerSide
        ? creature.position - creature.data.attackRange <= enemyBase.clientWidth
        : creature.position + creature.data.attackRange >= field.clientWidth - playerBase.clientWidth - playerBase.clientWidth;
    if (!isBaseInRange) {
        return false;
    }
    attackBase(gameState, creature, isPlayerSide, now);
    return true;
}
/** 개체 공격 처리 */
function attackCreatures(attacker, targets, now) {
    if (!canAttack(attacker, now)) {
        return;
    }
    attacker.lastAttackTime = now;
    setCreatureImage(attacker, attacker.data.attack);
    targets.forEach((target) => {
        target.damaged(attacker.data.attackDamage);
    });
}
/** 베이스 공격 처리 */
function attackBase(gameState, creature, isPlayerSide, now) {
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
/** 공격 가능 여부 */
function canAttack(creature, now) {
    return now - creature.lastAttackTime >= creature.data.attackTerm;
}
/** 개체 이동 처리 */
function moveCreature(creature, isPlayerSide, deltaTime) {
    setCreatureImage(creature, creature.data.idle);
    creature.position += (isPlayerSide ? -1 : 1) * creature.data.moveSpeed * deltaTime;
    updateCreaturePosition(creature);
}
/** 개체 위치 갱신 */
function updateCreaturePosition(creature) {
    creature.element.style.left = `${creature.position}px`;
}
/** 개체 이미지 변경 */
function setCreatureImage(creature, src) {
    const creatureImg = creature.element.querySelector("img");
    if (creatureImg instanceof HTMLImageElement) {
        creatureImg.src = src;
    }
}
/** 적 개체 이미지 방향 반전 */
function setCreatureImageDirection(creature) {
    const creatureImg = creature.element.querySelector("img");
    if (creatureImg instanceof HTMLImageElement && !creature.isPlayer) {
        creatureImg.style.transform = "scaleX(-1)";
    }
}
