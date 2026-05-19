/** 현재 플레이어 상태 */
export let playerState;
/** json 플레이어 데이터 로드 */
async function fetchPlayerData() {
    const response = await fetch("./json/playerData.json");
    if (!response.ok) {
        throw new Error("Failed to load player data: playerData.json");
    }
    return await response.json();
}
/** 전체 플레이어 데이터 로드 */
export async function loadPlayerData() {
    playerState = await fetchPlayerData();
}
/** 사용 가능한 개체 여부 */
export function canUseCreature(creature) {
    return getCreatureLevel(creature.id) >= 1;
}
/** 개체 레벨 조회 */
export function getCreatureLevel(creatureId) {
    return playerState.creatureLevels[creatureId] ?? 0;
}
/** 스테이지 클리어 보상 처리 */
export function rewardStageClear(stageData) {
    if (!playerState.clearedStages.includes(stageData.id)) {
        playerState.clearedStages.push(stageData.id);
    }
    playerState.currency += stageData.reward * playerState.upgrades.rewardMultiplier;
}
