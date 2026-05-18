interface creatureStructure { // 개체 데이터
    id: string, // 개체 ID
    name: string, // 개체 이름
    idle: string, // 대기 이미지 경로
    attack: string, // 공격 이미지 경로
    die: string, // 죽는 이미지 경로
    moveSpeed: number, // 이동 속도 (픽셀/초)
    attackRange: number, // 공격 범위 (픽셀)
    attackTerm: number, // 공격 간격 (밀리초)
    attackDamage: number, // 공격력
    coolTime: number, // 소환 쿨타임 (밀리초)
    cost: number, // 소환 비용
    maxHp: number, // 최대 체력
}

interface creatureInstanced { // 소환된 개체
    data: creatureStructure, // 개체 데이터
    position: number, // 현재 위치 (픽셀)
    lastAttackTime: number, // 마지막 공격 시간 (밀리초)
    element: HTMLDivElement, // 개체 요소
    hp: number, // 현재 체력
    isPlayer: boolean, // 플레이어측 여부
    isAlive: boolean, // 생존 여부
    damaged: (damage: number, isPlayer: boolean) => void, // 피격 함수
}

interface gameState { // 현재 게임 상태
    cost: number, // 플레이어 가용 코스트
    playerHp: number, // 플레이어 체력
    enemyHp: number, // 적 체력
    playerCreatures: creatureInstanced[], // 플레이어가 소환한 개체들
    enemyCreatures: creatureInstanced[], // 적이 소환한 개체들
    distance: number // 플레이어 베이스와 적 베이스의 거리 (픽셀)
}

interface player { // 플레이어 정보
    costPerSec: number, // 초당 코스트 증가량
}

interface enemy { // 현재 스테이지의 적 정보
    id: string, // 적 ID
    timing: number, // 소환 타이밍 (밀리초)
}

var btnContainer = document.getElementById("btn-container") as HTMLDivElement; // 버튼 컨테이너

var costSpan = document.getElementById("cost") as HTMLSpanElement; // 코스트 표시

var lastTime = performance.now(); // 마지막 프레임 시간

var field = document.getElementById("field") as HTMLDivElement; // 필드 요소
var enemyBase = document.getElementById("enemyBase") as HTMLDivElement;
var playerBase = document.getElementById("playerBase") as HTMLDivElement;

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
        creatureElement.innerHTML += `<button onclick="attackedCreature('${newCreature.element.id}',10)">Attacked</button>`;
        field.appendChild(creatureElement);
        console.log(`Set ${newCreature.data.name} to field!`);
    }
}

var attackedCreature = (creatureId: string, damage: number) => {
    const creature = curGameState.playerCreatures.find(c => c.element.id === creatureId);
    if (creature) {
        creature.damaged(damage, creature.isPlayer);
    }
}

function gameLoop(now: number) {
    const deltaTime = (now - lastTime) / 1000; // 초 단위로 변환
    lastTime = now;

    curGameState.cost += p.costPerSec * deltaTime;
    costSpan.textContent = `Current Cost: ${Math.floor(curGameState.cost)}`;

    if (e.length > 0 && now >= e[0].timing) {
        const enemyData = e.shift();
        if (enemyData) {
            let target = creaturesData.find(c => c.id === enemyData.id);
            if(target){
                setCreature(target, false);
                console.log(`Enemy ${enemyData.id} appears!`);
            }
        }
    }

    curGameState.playerCreatures.forEach(creature => {
        if (!creature.isAlive) return; // 죽은 개체는 행동하지 않음
        var attacked = false;
        curGameState.enemyCreatures.forEach(enemy => {
            if (!enemy.isAlive) return;
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
        else if(!attacked) {
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
        var attacked = false;
        curGameState.playerCreatures.forEach(player => {
            if (!player.isAlive) return;
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

        // 4. 게임 루프 시작
        requestAnimationFrame(gameLoop);

    } catch (error) {
        console.error("Initialization failed:", error);
    }
}

// 게임 실행
initGame();