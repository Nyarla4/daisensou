function getElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Missing required element: #${id}`);
    }
    return element;
}
export const titleScreen = getElement("title");
export const stageBtn = getElement("stage-btn");
export const stageScreen = getElement("stage");
export const creatureBtnContainer = getElement("creature-btn-list");
export const stageSelector = getElement("stageSelector");
export const inStage = getElement("inStage");
export const costSpan = getElement("cost");
export const field = getElement("field");
export const enemyBase = getElement("enemyBase");
export const playerBase = getElement("playerBase");
export const enemyHp = getElement("enemyHp");
export const playerHp = getElement("playerHp");
export const upgradeBtn = getElement("upgrade-btn");
export const upgradeScreen = getElement("upgrade");
export const upgradeBtnContainer = getElement("upgrade-btn-list");
export const backBtn = getElement("back-btn"); // 스테이지 선택>타이틀, 업그레이드>타이틀 공통
export const settingBtn = getElement("setting-btn");
