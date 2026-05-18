import { creatureStructure, creatureInstanced, gameState, player, enemy } from "./interfaces.js";
import { btnContainer, stageBtn, titleScreen, stageScreen, field, playerBase, costSpan, enemyBase } from "./elements.js";

stageBtn.addEventListener("click", () => {
    titleScreen.classList.remove("active"); // 타이틀 숨기기
    stageScreen.classList.add("active"); // 스테이지 표시
    if (btnContainer != null) {
        creaturesData.forEach(creature => {
            const creatureBtn = document.createElement("button");
            creatureBtn.textContent = creature.name;
            creatureBtn.classList.add("btn");
            creatureBtn.classList.add("btn-primary");
            creatureBtn.addEventListener("click", () => {
                setCreature(creature, true);
            });
            btnContainer!.appendChild(creatureBtn);
        });
    }
    requestAnimationFrame(gameLoop);
});

var lastTime = performance.now(); // 마지막 프레임 시간

var curGameState: gameState = {
    cost: 0,
    playerHp: 100,
    enemyHp: 100,
    playerCreatures: [],
    enemyCreatures: [],
    distance: 500
}
field.style.width = `${curGameState.distance}px`;

var p: player = {
    costPerSec: 1
}

var e: enemy[] = [
    {
        id: "dummy",
        timing: 1000
    },
    {
        id: "dummy",
        timing: 5000
    }
];

async function loadCreatureData(): Promise<creatureStructure[]> {
    const response = await fetch(`./json/creatures.json`);
    if (!response.ok) {
        throw new Error(`Failed to load creature data: creatures.json`);
    }
    return await response.json();
}

var creaturesData: creatureStructure[] = [];

var setCreature = (creature: creatureStructure, isPlayer: boolean) => {
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

        var newCreature: creatureInstanced = {
            data: creature,
            position: startPos,
            lastAttackTime: 0,
            element: document.createElement("div"),
            hp: creature.maxHp,
            isAlive: true,
            isPlayer: isPlayer,
            damaged: (damage: number, isPlayer: boolean) => {
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
                } else {
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
        //creatureElement.innerHTML += `<button onclick="attackedCreature('${newCreature.element.id}',10)">Attacked</button>`;
        field.appendChild(creatureElement);
        console.log(`Set ${newCreature.data.name} to field!`);
    }
}

// var attackedCreature = (creatureId: string, damage: number) => {
//     const creature = curGameState.playerCreatures.find(c => c.element.id === creatureId);
//     if (creature) {
//         creature.damaged(damage, creature.isPlayer);
//     }
// }

function gameLoop(now: number) {
    const deltaTime = (now - lastTime) / 1000; // 초 단위로 변환
    lastTime = now;

    curGameState.cost += p.costPerSec * deltaTime;
    costSpan.textContent = `Current Cost: ${Math.floor(curGameState.cost)}`;

    if (e.length > 0 && now >= e[0].timing) {
        const enemyData = e.shift();
        if (enemyData) {
            let target = creaturesData.find(c => c.id === enemyData.id);
            if (target) {
                setCreature(target, false);
                console.log(`Enemy ${enemyData.id} appears!`);
            }
        }
    }

    curGameState.playerCreatures.forEach(creature => {
        if (!creature.isAlive) return; // 죽은 개체는 행동하지 않음
        var isBlocked = false;

        // 적 개체들과의 상호작용
        curGameState.enemyCreatures.forEach(enemy => {
            if (!enemy.isAlive) return;

            if (creature.position <= enemy.position + creature.data.attackRange) {
                isBlocked = true;
                if (now - creature.lastAttackTime >= creature.data.attackTerm) {
                    creature.lastAttackTime = now;
                    const creatureImg = document.querySelector(`#${creature.element.id} img`);
                    if (creatureImg != null && creatureImg instanceof HTMLImageElement) {
                        creatureImg.src = creature.data.attack;
                    }
                    enemy.damaged(creature.data.attackDamage, enemy.isPlayer);
                }
            }
        });

        // 적 베이스와의 상호작용
        if (!isBlocked && creature.position - creature.data.attackRange <= enemyBase.clientWidth) {
            isBlocked = true;
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

        // 이동 처리 (어떤 개체도 막지 않을 때만 이동)
        else if (!isBlocked) {
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
        if (!creature.isAlive) return;
        var isBlocked = false;

        // 플레이어 개체들과의 상호작용
        curGameState.playerCreatures.forEach(player => {
            if (!player.isAlive) return;
            if (creature.position > player.position - creature.data.attackRange) {
                isBlocked = true;
                if (now - creature.lastAttackTime >= creature.data.attackTerm) {
                    creature.lastAttackTime = now;
                    const creatureImg = document.querySelector(`#${creature.element.id} img`);
                    if (creatureImg != null && creatureImg instanceof HTMLImageElement) {
                        creatureImg.src = creature.data.attack;
                    }
                    player.damaged(creature.data.attackDamage, player.isPlayer);
                    isBlocked = true;
                }
            }
        });

        // 플레이어 베이스와의 상호작용
        if (!isBlocked && creature.position + creature.data.attackRange >= field.clientWidth - playerBase.clientWidth - playerBase.clientWidth) {
            isBlocked = true;
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

        // 이동 처리 (어떤 개체도 막지 않을 때만 이동)
        else if (!isBlocked) {
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

    } catch (error) {
        console.error("Initialization failed:", error);
    }
}

// 게임 실행
initGame();