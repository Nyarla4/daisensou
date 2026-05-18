function getElement<T extends HTMLElement>(id: string): T {
    const element = document.getElementById(id);

    if (!element) {
        throw new Error(`Missing required element: #${id}`);
    }

    return element as T;
}

export const titleScreen = getElement<HTMLDivElement>("title");
export const stageBtn = getElement<HTMLButtonElement>("stage-btn");
export const stageScreen = getElement<HTMLDivElement>("stage");
export const btnContainer = getElement<HTMLDivElement>("btn-container");
export const costSpan = getElement<HTMLSpanElement>("cost");
export const field = getElement<HTMLDivElement>("field");
export const enemyBase = getElement<HTMLDivElement>("enemyBase");
export const playerBase = getElement<HTMLDivElement>("playerBase");
