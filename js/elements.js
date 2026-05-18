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
export const btnContainer = getElement("btn-container");
export const costSpan = getElement("cost");
export const field = getElement("field");
export const enemyBase = getElement("enemyBase");
export const playerBase = getElement("playerBase");
