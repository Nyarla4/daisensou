export interface creatureStructure { // 개체 데이터
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

export interface creatureInstanced { // 소환된 개체
    data: creatureStructure, // 개체 데이터
    position: number, // 현재 위치 (픽셀)
    lastAttackTime: number, // 마지막 공격 시간 (밀리초)
    element: HTMLDivElement, // 개체 요소
    hp: number, // 현재 체력
    isPlayer: boolean, // 플레이어측 여부
    isAlive: boolean, // 생존 여부
    damaged: (damage: number, isPlayer: boolean) => void, // 피격 함수
}

export interface gameState { // 현재 게임 상태
    cost: number, // 플레이어 가용 코스트
    playerHp: number, // 플레이어 체력
    enemyHp: number, // 적 체력
    playerCreatures: creatureInstanced[], // 플레이어가 소환한 개체들
    enemyCreatures: creatureInstanced[], // 적이 소환한 개체들
    distance: number // 플레이어 베이스와 적 베이스의 거리 (픽셀)
}

export interface player { // 플레이어 정보
    costPerSec: number, // 초당 코스트 증가량
}

export interface enemy { // 현재 스테이지의 적 정보
    id: string, // 적 ID
    timing: number, // 소환 타이밍 (밀리초)
}