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
var dummy = {
    id: "dummy",
    name: "더미",
    idle: "./img/dummy_idle.png",
    attack: "./img/dummy_attack.png",
    die: "./img/dummy_die.png",
    moveSpeed: 10,
    attackRange: 50,
    attackTerm: 1000,
    attackDamage: 10,
    coolTime: 1000,
    cost: 1,
    maxHp: 100
};
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
requestAnimationFrame(gameLoop);
