import { inStage, stageSelector } from "./elements.js";
import { StageData } from "./interfaces.js";

/** 모든 스테이지 데이터 */
export let stagesData: StageData[] = [];

/** json 스테이지 데이터 로드 */
async function fetchStageData(): Promise<StageData[]> {
    const response = await fetch("./json/stageData.json");

    if (!response.ok) {
        throw new Error("Failed to load stage data: stageData.json");
    }

    return await response.json();
}

/** 전체 스테이지 데이터 로드 */
export async function loadStageData() {
    stagesData = await fetchStageData();
}

/** 스테이지 선택 버튼 */
export function renderStageButtons(startStage: (stageData: StageData) => void) {
    stageSelector.replaceChildren();

    stagesData.forEach((stageData) => {
        const stageSelectBtn = document.createElement("button");
        stageSelectBtn.textContent = stageData.name;
        stageSelectBtn.classList.add("btn", "btn-primary");
        stageSelectBtn.addEventListener("click", () => {
            startStage(stageData);
        });
        stageSelector.appendChild(stageSelectBtn);
    });
}

/** 스테이지 선택 화면 표시 */
export function showStageSelector() {
    stageSelector.classList.add("active");
    inStage.classList.remove("active");
}

/** 스테이지 내부 화면 표시 */
export function showInStage() {
    stageSelector.classList.remove("active");
    inStage.classList.add("active");
}
