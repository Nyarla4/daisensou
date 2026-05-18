"use strict";
var btn = document.getElementById("btn"); // test용 버튼
btn.addEventListener("click", () => {
    setCreature(dummy, true);
});
var costSpan = document.getElementById("cost"); // 코스트 표시
var lastTime = performance.now(); // 마지막 프레임 시간
var field = document.getElementById("field"); // 필드 요소
var enemyBase = document.getElementById("enemyBase");
var playerBase = document.getElementById("playerBase");
var curGameState = {
    cost: 0,
    playerHp: 100,
    enemyHp: 100,
    playerCreatures: [],
    enemyCreatures: [],
    distance: 500
};
field.style.width = `${curGameState.distance}px`;
var p = {
    costPerSec: 1
};
var e = [
    {
        id: "dummy",
        timing: 1000
    },
    {
        id: "dummy",
        timing: 5000
    }
];
async function loadCreatureData() {
    const response = await fetch(`./json/creatures.json`);
    if (!response.ok) {
        throw new Error(`Failed to load creature data: creatures.json`);
    }
    // json()은 이제 creatureStructure[] 타입을 반환합니다.
    return await response.json();
}
var creaturesData = [];
var dummy;
var setCreature = (creature, isPlayer) => {
    if (isPlayer && curGameState.cost < creature.cost) {
        console.log(`Not enough cost to set ${creature.name}!`);
        return;
    }
    else {
        var startPos = isPlayer ? field.clientWidth - playerBase.clientWidth : 0; // 개체의 시작 위치
        if (isPlayer) {
            curGameState.cost -= creature.cost;
            costSpan.textContent = `Current Cost: ${curGameState.cost}`;
        }
        var newCreature = {
            data: creature,
            position: startPos,
            lastAttackTime: 0,
            element: document.createElement("div"),
            hp: creature.maxHp,
            isAlive: true,
            isPlayer: isPlayer,
            damaged: (damage, isPlayer) => {
                newCreature.hp -= damage;
                if (newCreature.hp <= 0) {
                    newCreature.hp = 0;
                    const creatureImg = document.querySelector(`#${newCreature.element.id} img`);
                    if (creatureImg != null && creatureImg instanceof HTMLImageElement) {
                        creatureImg.src = newCreature.data.die;
                    }
                    newCreature.isAlive = false;
                    // 5초 후에 개체 제거
                    setTimeout(() => {
                        const creatureElement = document.getElementById(newCreature.element.id);
                        if (creatureElement) {
                            creatureElement.remove();
                        }
                    }, 5000);
                }
                if (isPlayer) {
                    newCreature.position += 10; // 피격 시 뒤로 밀리는 효과
                }
                else {
                    newCreature.position -= 10; // 피격 시 앞으로 밀리는 효과 (적 개체는 플레이어 쪽으로 이동)
                }
                console.log(`${newCreature.data.name} takes ${damage} damage! Current HP: ${newCreature.hp}`);
            },
        };
        var targetArray = isPlayer ? curGameState.playerCreatures : curGameState.enemyCreatures;
        targetArray.push(newCreature);
        let count = targetArray.filter(c => c.data.id === newCreature.data.id).length;
        let creatureElement = newCreature.element;
        creatureElement.id = `${isPlayer ? 'player-' : 'enemy-'}${newCreature.data.id}-${count}`;
        creatureElement.className = "creature";
        creatureElement.style.left = `${newCreature.position}px`;
        creatureElement.innerHTML = `<img src="${newCreature.data.idle}" alt="${newCreature.data.name}" ${!isPlayer ? "style='transform: scaleX(-1);'" : ""}>`;
        creatureElement.innerHTML += `<button onclick="attackedCreature('${newCreature.element.id}',10)">Attacked</button>`;
        field.appendChild(creatureElement);
        console.log(`Set ${newCreature.data.name} to field!`);
    }
};
var attackedCreature = (creatureId, damage) => {
    const creature = curGameState.playerCreatures.find(c => c.element.id === creatureId);
    if (creature) {
        creature.damaged(damage, creature.isPlayer);
    }
};
var testAttacking = false;
function gameLoop(now) {
    const deltaTime = (now - lastTime) / 1000; // 초 단위로 변환
    lastTime = now;
    curGameState.cost += p.costPerSec * deltaTime;
    costSpan.textContent = `Current Cost: ${Math.floor(curGameState.cost)}`;
    if (e.length > 0 && now >= e[0].timing) {
        const enemyData = e.shift();
        if (enemyData) {
            setCreature(dummy, false);
            // 적 소환 로직 (추후 구현)
            console.log(`Enemy ${enemyData.id} appears!`);
        }
    }
    curGameState.playerCreatures.forEach(creature => {
        if (!creature.isAlive)
            return; // 죽은 개체는 행동하지 않음
        var attacked = false;
        curGameState.enemyCreatures.forEach(enemy => {
            if (!enemy.isAlive)
                return;
            const distance = Math.abs(creature.position - enemy.position);
            if (distance <= creature.data.attackRange) {
                if (now - creature.lastAttackTime >= creature.data.attackTerm) {
                    creature.lastAttackTime = now;
                    const creatureImg = document.querySelector(`#${creature.element.id} img`);
                    if (creatureImg != null && creatureImg instanceof HTMLImageElement) {
                        creatureImg.src = creature.data.attack;
                    }
                    enemy.damaged(creature.data.attackDamage, enemy.isPlayer);
                    attacked = true;
                }
            }
        });
        if (creature.position - creature.data.attackRange <= enemyBase.clientWidth) {
            if (curGameState.enemyHp > 0) {
                if (now - creature.lastAttackTime >= creature.data.attackTerm) {
                    creature.lastAttackTime = now;
                    const creatureImg = document.querySelector(`#${creature.element.id} img`);
                    if (creatureImg != null && creatureImg instanceof HTMLImageElement) {
                        creatureImg.src = creature.data.attack;
                    }
                    curGameState.enemyHp -= creature.data.attackDamage;
                    console.log(`Enemy base takes ${creature.data.attackDamage} damage! Enemy HP: ${curGameState.enemyHp}`);
                }
            }
        }
        else if (!attacked) {
            const creatureImg = document.querySelector(`#${creature.element.id} img`);
            if (creatureImg != null && creatureImg instanceof HTMLImageElement) {
                creatureImg.src = creature.data.idle;
            }
            creature.position -= creature.data.moveSpeed * deltaTime;
            let creatureElement = creature.element;
            if (creatureElement) {
                creatureElement.style.left = `${creature.position}px`;
            }
        }
    });
    curGameState.enemyCreatures.forEach(creature => {
        if (!creature.isAlive)
            return;
        var attacked = false;
        curGameState.playerCreatures.forEach(player => {
            if (!player.isAlive)
                return;
            const distance = Math.abs(creature.position - player.position);
            if (distance <= creature.data.attackRange) {
                if (now - creature.lastAttackTime >= creature.data.attackTerm) {
                    creature.lastAttackTime = now;
                    const creatureImg = document.querySelector(`#${creature.element.id} img`);
                    if (creatureImg != null && creatureImg instanceof HTMLImageElement) {
                        creatureImg.src = creature.data.attack;
                    }
                    player.damaged(creature.data.attackDamage, player.isPlayer);
                    attacked = true;
                }
            }
        });
        if (creature.position + creature.data.attackRange >= field.clientWidth - playerBase.clientWidth - playerBase.clientWidth) {
            if (curGameState.playerHp > 0) {
                if (now - creature.lastAttackTime >= creature.data.attackTerm) {
                    creature.lastAttackTime = now;
                    const creatureImg = document.querySelector(`#${creature.element.id} img`);
                    if (creatureImg != null && creatureImg instanceof HTMLImageElement) {
                        creatureImg.src = creature.data.attack;
                    }
                    curGameState.playerHp -= creature.data.attackDamage;
                    console.log(`Player base takes ${creature.data.attackDamage} damage! Player HP: ${curGameState.playerHp}`);
                }
            }
        }
        else if (!attacked) {
            const creatureImg = document.querySelector(`#${creature.element.id} img`);
            if (creatureImg != null && creatureImg instanceof HTMLImageElement) {
                creatureImg.src = creature.data.idle;
            }
            creature.position += creature.data.moveSpeed * deltaTime;
            let creatureElement = creature.element;
            if (creatureElement) {
                creatureElement.style.left = `${creature.position}px`;
            }
        }
    });
    requestAnimationFrame(gameLoop);
}
async function initGame() {
    try {
        // 1. 데이터를 먼저 불러와서 배열에 저장
        creaturesData = await loadCreatureData();
        console.log("Creature data loaded:", creaturesData);
        // 2. 불러온 배열에서 필요한 데이터(dummy) 추출
        const foundDummy = creaturesData.find(c => c.id === "dummy");
        if (foundDummy) {
            dummy = foundDummy;
        }
        else {
            throw new Error("Dummy data not found in JSON");
        }
        // 3. 데이터 로드가 완료된 후에 이벤트 리스너 등록
        const btn = document.getElementById("btn");
        btn.addEventListener("click", () => {
            if (dummy)
                setCreature(dummy, true);
        });
        // 4. 게임 루프 시작
        requestAnimationFrame(gameLoop);
    }
    catch (error) {
        console.error("Initialization failed:", error);
    }
}
// 게임 실행
initGame();
