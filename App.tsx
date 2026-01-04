import React, { useState, useCallback } from 'react';
import { Screen, GameState, Role, ChatMessage, Option } from './types';
import StartScreen from './components/StartScreen';
import GameScreen from './components/GameScreen';
import GameOverScreen from './components/GameOverScreen';
import { startGameSession, evaluateTurn, getNextTurn } from './services/geminiService';
import { MAX_DAOCAI, MAX_TURNS, ENCORE_TURNS_ADDED } from './constants';
import { initAudio, playHecai, playDaocai } from './utils/sound';

const initialState: GameState = {
  screen: Screen.START,
  hecai: 0,
  daocai: 0,
  mood: 50, // Start neutral
  messages: [],
  currentOptions: [],
  isLoading: false,
  lastFeedback: null,
  turnCount: 0,
  maxTurns: MAX_TURNS,
  consecutiveHecai: 0,
  consecutiveDaocai: 0,
  topic: undefined,
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(initialState);

  // --- Start Handler ---
  // Now accepts an optional scriptIndex
  const handleStartGame = useCallback(async (scriptIndex?: number) => {
    initAudio();
    // Reset state but keep loading true initially
    setGameState({ 
      ...JSON.parse(JSON.stringify(initialState)), 
      isLoading: true 
    });

    try {
      // Pass the selected index to the service
      const data = await startGameSession(scriptIndex);
      setGameState(prev => ({
        ...prev,
        screen: Screen.PLAYING,
        isLoading: false,
        turnCount: 1,
        messages: [{ role: Role.DOUGEN, text: data.firstLine }],
        currentOptions: data.options,
        topic: data.topic, // Save topic
      }));
    } catch (error) {
      console.error("Error starting game", error);
      alert("启动失败，请刷新重试");
      setGameState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // --- Encore Handler ---
  // Returns a promise resolving to the success state and optional message
  const handleEncore = useCallback(async (): Promise<{ success: boolean; message?: string }> => {
    // 1. Pre-check: If no more content in the local script, return failure
    const nextTurn = getNextTurn(gameState.turnCount);
    if (!nextTurn) {
      return { 
        success: false, 
        message: "老先生累了，这回是真没词儿了！（离线剧本已全部演完）" 
      };
    }

    // Immediate UI update: Go back to playing, show "loading", reset mood
    setGameState(prev => ({
      ...prev,
      screen: Screen.PLAYING,
      maxTurns: prev.maxTurns + ENCORE_TURNS_ADDED,
      mood: 100, // Reset mood to max for encore
      isLoading: true, // Show loading state while fetching next line
      messages: [
        ...prev.messages, 
        { 
          role: Role.DOUGEN, 
          text: "（擦把汗，鞠躬）感谢大伙儿的厚爱！既然各位不想走，那咱们就——再多聊两句！",
          isEvaluation: true 
        }
      ]
    }));

    // Simulate delay for effect
    await new Promise(r => setTimeout(r, 1000)); 

    setGameState(prev => ({
      ...prev,
      isLoading: false,
      messages: [...prev.messages, { role: Role.DOUGEN, text: nextTurn.dougen }],
      currentOptions: nextTurn.options
    }));

    return { success: true };

  }, [gameState.turnCount, gameState.messages]);

  const handleOptionSelect = useCallback(async (option: Option) => {
    // 1. Update state with user choice immediately
    setGameState(prev => ({
      ...prev,
      messages: [...prev.messages, { role: Role.PENGGEN, text: option.text }],
      currentOptions: [], // Disable buttons
      isLoading: true,
      lastFeedback: null
    }));

    try {
      // Evaluate using local logic
      const result = await evaluateTurn(gameState.turnCount, option.text);

      // 5. Calculate Scores, Streaks & Mood with Logic
      const baseHecai = result.scoreImpact.hecai;
      const baseDaocai = result.scoreImpact.daocai;
      
      let nextConsecutiveHecai = gameState.consecutiveHecai;
      let nextConsecutiveDaocai = gameState.consecutiveDaocai;

      // Update streaks
      if (baseHecai > 0) {
        nextConsecutiveHecai += 1;
        nextConsecutiveDaocai = 0;
      } else if (baseDaocai > 0) {
        nextConsecutiveDaocai += 1;
        nextConsecutiveHecai = 0;
      } else {
        nextConsecutiveHecai = 0;
        nextConsecutiveDaocai = 0;
      }

      let finalHecaiGain = baseHecai;
      let finalDaocaiGain = baseDaocai;
      let moodChange = 0;

      if (baseHecai > 0) {
        let gain = 10;
        if (nextConsecutiveHecai > 1) {
          gain += (nextConsecutiveHecai - 1) * 3;
        }
        moodChange = gain;
        if (gameState.mood >= 80) {
          finalHecaiGain += 1; 
          moodChange = Math.max(5, moodChange - 5); 
        }
      } else if (baseDaocai > 0) {
        let loss = 15;
        if (nextConsecutiveDaocai > 1) {
          loss += (nextConsecutiveDaocai - 1) * 5;
        }
        moodChange = -loss;
        if (gameState.mood <= 30) {
           if (gameState.mood < 20) finalDaocaiGain += 1; 
        }
      } else {
        if (gameState.mood > 50) moodChange = -3;
        if (gameState.mood < 50) moodChange = +2;
      }

      if (finalDaocaiGain > 0) {
        playDaocai();
      } else if (finalHecaiGain > 0) {
        playHecai();
      }

      const newMood = Math.min(100, Math.max(0, gameState.mood + moodChange));
      const newHecai = gameState.hecai + finalHecaiGain;
      const newDaocai = gameState.daocai + finalDaocaiGain;

      // 6. Determine Game Status
      let nextScreen = Screen.PLAYING;
      
      // Determine if we should end the game
      if (newDaocai >= MAX_DAOCAI) {
        // Too many boos, immediate game over
        nextScreen = Screen.GAME_OVER;
      } else if (result.isGameOver) {
        // Offline script ended (ran out of lines)
        nextScreen = Screen.GAME_OVER;
      } else if (gameState.turnCount >= gameState.maxTurns) {
        // Reached turn limit (but might be eligible for Encore in GameOverScreen)
        nextScreen = Screen.GAME_OVER;
      }

      // 7. Update State
      setGameState(prev => {
        const updatedMessages: ChatMessage[] = [...prev.messages]; 
        
        updatedMessages.push({ role: Role.DOUGEN, text: result.feedback, isEvaluation: true });

        if (nextScreen === Screen.PLAYING && result.nextDougenLine) {
           updatedMessages.push({ role: Role.DOUGEN, text: result.nextDougenLine });
        }

        let feedbackLabel: string | null = null;
        if (finalDaocaiGain > 0) {
           feedbackLabel = '倒彩';
           if (nextConsecutiveDaocai > 1) feedbackLabel += ` x${nextConsecutiveDaocai}`;
        } else if (finalHecaiGain > 0) {
           feedbackLabel = '喝彩';
           if (nextConsecutiveHecai > 1) feedbackLabel += ` x${nextConsecutiveHecai}`;
        }

        return {
          ...prev,
          screen: nextScreen,
          hecai: newHecai,
          daocai: newDaocai,
          mood: newMood,
          isLoading: false,
          messages: updatedMessages,
          currentOptions: nextScreen === Screen.PLAYING ? (result.nextOptions || []) : [],
          lastFeedback: feedbackLabel,
          turnCount: prev.turnCount + 1,
          consecutiveHecai: nextConsecutiveHecai,
          consecutiveDaocai: nextConsecutiveDaocai,
        };
      });

      setTimeout(() => {
        setGameState(prev => ({ ...prev, lastFeedback: null }));
      }, 2500);

    } catch (error) {
      console.error(error);
      setGameState(prev => ({ ...prev, isLoading: false }));
    }
  }, [gameState]); 

  // Reset to initial state (Home Screen)
  const handleRestart = useCallback(() => {
    // Force a deep copy to prevent any reference retention issues
    setGameState(JSON.parse(JSON.stringify(initialState)));
  }, []);

  // Quit current game to Home directly
  const handleQuit = useCallback(() => {
    // Removed window.confirm to ensure responsiveness
    handleRestart();
  }, [handleRestart]);

  return (
    <div className="font-sans antialiased text-gray-900">
      {gameState.screen === Screen.START && (
        <StartScreen 
          onStart={handleStartGame} 
          isLoading={gameState.isLoading} 
        />
      )}
      {gameState.screen === Screen.PLAYING && (
        <GameScreen 
          state={gameState} 
          onOptionSelect={handleOptionSelect} 
          onQuit={handleQuit} 
        />
      )}
      {gameState.screen === Screen.GAME_OVER && (
        <GameOverScreen 
          state={gameState} 
          onRestart={handleRestart} 
          onNewGame={() => handleStartGame()}
          onEncore={handleEncore}
        />
      )}
    </div>
  );
};

export default App;