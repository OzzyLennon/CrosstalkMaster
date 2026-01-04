import { StartGameResponse, TurnEvaluationResponse, Option } from "../types";
import { OFFLINE_SCRIPTS } from "../constants";

// Keep track of the currently active offline script
let currentOfflineScript = OFFLINE_SCRIPTS[0]; 
let lastScriptIndex = -1; // Track the previously played script index to avoid repetition

// Helper to shuffle array (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Helper for delay to simulate "thinking" time
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const startGameSession = async (specificIndex?: number): Promise<StartGameResponse> => {
  // Simulate loading delay
  await delay(600);

  let targetIndex: number;

  if (specificIndex !== undefined && specificIndex >= 0 && specificIndex < OFFLINE_SCRIPTS.length) {
    // User selected a specific script
    targetIndex = specificIndex;
  } else {
    // Random selection logic (avoiding immediate repetition if possible)
    if (OFFLINE_SCRIPTS.length > 1) {
      do {
        targetIndex = Math.floor(Math.random() * OFFLINE_SCRIPTS.length);
      } while (targetIndex === lastScriptIndex && lastScriptIndex !== -1);
    } else {
      targetIndex = 0;
    }
  }

  lastScriptIndex = targetIndex;
  currentOfflineScript = OFFLINE_SCRIPTS[targetIndex];
  
  console.log(`Starting Offline Script: ${currentOfflineScript.topic} (Index: ${targetIndex})`);

  return {
    topic: currentOfflineScript.topic,
    firstLine: currentOfflineScript.turns[0].dougen,
    options: shuffleArray(currentOfflineScript.turns[0].options)
  };
};

export const getNextTurn = (turnIndex: number): { dougen: string, options: Option[] } | null => {
  // turnIndex is 1-based. 
  // If turnCount is 13, it means we are about to play the 13th turn, so we need index 12.
  if (turnIndex > currentOfflineScript.turns.length) return null;
  const turnData = currentOfflineScript.turns[turnIndex - 1];
  return {
    dougen: turnData.dougen,
    options: shuffleArray(turnData.options)
  };
};

export const evaluateTurn = async (turnIndex: number, choiceText: string): Promise<TurnEvaluationResponse> => {
  await delay(800); // Simulate natural pause
  
  // Safety check: if turnIndex is out of bounds
  if (turnIndex > currentOfflineScript.turns.length) {
    return {
      scoreImpact: { hecai: 0, daocai: 0 },
      feedback: "演出结束",
      isGameOver: true,
      isSuccess: true,
    };
  }

  const currentTurnData = currentOfflineScript.turns[turnIndex - 1]; // turnIndex is 1-based in App
  
  // Find which option the user picked
  const chosenOption = currentTurnData.options.find(o => o.text === choiceText);
  const isBest = chosenOption?.id === currentTurnData.bestId;
  const isWorst = chosenOption?.id === currentTurnData.worstId;
  
  let hecai = 0;
  let daocai = 0;
  let feedback = "嗯...";

  // Simple feedback logic
  if (isBest) {
    hecai = 1;
    const praises = ["好！接得严丝合缝！", "漂亮！这就叫尺寸！", "好！这包袱翻得脆！", "对咯！要的就是这句！"];
    feedback = praises[Math.floor(Math.random() * praises.length)];
  } else if (isWorst) {
    daocai = 1;
    const crit = ["这都哪跟哪啊！", "这句不行，掉地上了。", "胡说八道嘛这不是！", "您这是来捣乱的吧？"];
    feedback = crit[Math.floor(Math.random() * crit.length)];
  } else {
    const neutral = ["也行吧。", "凑合听。", "稍微差点意思。", "没毛病，但不响。"];
    feedback = neutral[Math.floor(Math.random() * neutral.length)];
  }

  const nextTurnIndex = turnIndex; // The NEXT turn data is at array index `turnIndex` (since current was `turnIndex-1`)
  const hasNextTurn = nextTurnIndex < currentOfflineScript.turns.length;

  return {
    scoreImpact: { hecai, daocai },
    feedback,
    isSuccess: isBest,
    isGameOver: !hasNextTurn, // Mark as game over if no next turn
    nextDougenLine: hasNextTurn ? currentOfflineScript.turns[nextTurnIndex].dougen : undefined,
    nextOptions: hasNextTurn ? shuffleArray(currentOfflineScript.turns[nextTurnIndex].options) : undefined
  };
};