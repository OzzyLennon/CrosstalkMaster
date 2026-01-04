import React, { useEffect, useRef } from 'react';
import { GameState, Option, Role } from '../types';
import { MAX_DAOCAI } from '../constants';

interface GameScreenProps {
  state: GameState;
  onOptionSelect: (option: Option) => void;
  onQuit: () => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ state, onOptionSelect, onQuit }) => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  // Calculate percentage for progress bars
  const daocaiPercent = (state.daocai / MAX_DAOCAI) * 100;
  
  // Mood helpers
  const getMoodConfig = (mood: number) => {
    if (mood >= 85) return { 
      label: '🔥 火爆 (On Fire!)', 
      color: 'bg-gradient-to-r from-red-500 to-yellow-400', 
      text: 'text-red-600 font-extrabold', 
      icon: '🤣',
      animation: 'animate-bounce'
    };
    if (mood >= 60) return { 
      label: '😊 热烈 (Happy)', 
      color: 'bg-gradient-to-r from-orange-400 to-red-400', 
      text: 'text-orange-600 font-bold', 
      icon: '😄',
      animation: ''
    };
    if (mood >= 30) return { 
      label: '😐 平稳 (Neutral)', 
      color: 'bg-yellow-400', 
      text: 'text-yellow-600', 
      icon: '🙂',
      animation: ''
    };
    return { 
      label: '🥶 冷场 (Awkward)', 
      color: 'bg-blue-400', 
      text: 'text-blue-500 font-medium', 
      icon: '😓',
      animation: 'shake' // Using the custom shake class defined in index.html
    };
  };

  const moodConfig = getMoodConfig(state.mood);

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto bg-stone-50 shadow-2xl overflow-hidden relative border-x-2 border-stone-200">
      
      {/* Header / Scoreboard */}
      <div className="bg-red-800 text-amber-50 p-4 shadow-lg z-20 transition-all duration-300 relative">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-3">
            <button 
              onClick={onQuit}
              className="group flex items-center space-x-1 px-2 py-1.5 rounded-full hover:bg-red-700 transition-colors text-yellow-200 hover:text-white cursor-pointer active:scale-95 z-50 relative border border-transparent hover:border-red-600"
              title="返回首页"
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-xs font-bold hidden md:inline">退出</span>
            </button>
            <div className="flex flex-col">
              <h2 className="text-xl md:text-2xl font-calligraphy leading-none">相声大舞台</h2>
              {state.topic && <div className="text-[10px] md:text-xs text-yellow-200/80 font-serif mt-1 truncate max-w-[150px]">《{state.topic.split('(')[0]}》</div>}
            </div>
          </div>
          <div className="text-xs md:text-sm opacity-80 font-serif">第 {state.turnCount} / {state.maxTurns} 回合</div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 md:gap-4 mt-2">
          {/* Hecai (Cheers) */}
          <div className="bg-red-900/50 p-2 rounded-lg border border-red-700/50 flex flex-col justify-between shadow-inner">
            <div className="text-[10px] md:text-xs mb-1 uppercase tracking-wider font-bold text-yellow-400">
              喝彩值 (Score)
            </div>
            <div className="text-xl md:text-2xl font-bold text-yellow-300">
              {state.hecai}
            </div>
          </div>

          {/* Audience Mood - Enhanced Visuals */}
          <div className="bg-red-900/50 p-2 rounded-lg border border-red-700/50 flex flex-col justify-between relative overflow-hidden shadow-inner">
             <div className="flex justify-between text-[10px] md:text-xs mb-1 uppercase tracking-wider font-bold text-red-200 z-10 relative">
              <span>观众情绪</span>
              <span>{state.mood}%</span>
            </div>
            
            <div className="flex items-center space-x-2 mt-1 z-10 relative">
              <span className={`text-2xl filter drop-shadow-md ${moodConfig.animation}`}>
                {moodConfig.icon}
              </span>
              <div className="flex-1 h-3 bg-black/30 rounded-full overflow-hidden border border-white/10 shadow-inner">
                <div 
                  className={`h-full transition-all duration-700 ease-out shadow-lg ${moodConfig.color}`} 
                  style={{ width: `${state.mood}%` }}
                />
              </div>
            </div>
            
            <div className={`text-[10px] text-right mt-1 z-10 relative transition-colors duration-300 ${moodConfig.text === 'text-red-600 font-extrabold' ? 'text-yellow-200' : 'text-red-200'}`}>
              {moodConfig.label}
            </div>

            {/* Subtle background glow based on mood */}
            {state.mood >= 85 && (
              <div className="absolute inset-0 bg-red-500/20 animate-pulse z-0"></div>
            )}
            {state.mood <= 20 && (
              <div className="absolute inset-0 bg-blue-500/20 z-0"></div>
            )}
          </div>

          {/* Daocai (Boos) */}
          <div className="bg-red-900/50 p-2 rounded-lg border border-red-700/50 flex flex-col justify-between shadow-inner">
             <div className="flex justify-between text-[10px] md:text-xs mb-1 uppercase tracking-wider font-bold text-red-200">
              <span>倒彩 (Boos)</span>
              <span>{state.daocai} / {MAX_DAOCAI}</span>
            </div>
            <div className="h-3 bg-black/30 rounded-full overflow-hidden relative mt-2 border border-white/10 shadow-inner">
              <div 
                className={`h-full transition-all duration-500 ${state.daocai >= MAX_DAOCAI - 1 ? 'bg-red-600 animate-pulse' : 'bg-orange-600'}`}
                style={{ width: `${Math.min(daocaiPercent, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-stone-50 scrollbar-hide pb-32">
        {state.messages.map((msg, index) => (
          <div 
            key={index} 
            className={`flex w-full ${msg.role === Role.DOUGEN ? 'justify-start' : 'justify-end'} 
                       ${msg.isEvaluation ? 'justify-center my-4' : ''}`}
          >
            {msg.isEvaluation ? (
              // Evaluation / Feedback Message
              <div className={`
                px-4 py-1 rounded-full text-sm font-medium shadow-sm pop-in border
                ${msg.text.includes('好') || state.mood > 60 ? 'bg-yellow-100 border-yellow-300 text-yellow-800' : 'bg-gray-200 border-gray-300 text-gray-700'}
              `}>
                {msg.text}
              </div>
            ) : (
              // Character Message
              <div className={`flex flex-col max-w-[85%] md:max-w-[80%] ${msg.role === Role.PENGGEN ? 'items-end' : 'items-start'}`}>
                <span className="text-xs text-gray-400 mb-1 font-serif">
                  {msg.role === Role.DOUGEN ? '逗哏 (Dougen)' : '捧哏 (You)'}
                </span>
                <div 
                  className={`p-3 md:p-4 rounded-2xl text-base md:text-lg font-serif leading-relaxed shadow-sm relative
                    ${msg.role === Role.DOUGEN 
                      ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-none' 
                      : 'bg-red-50 border border-red-100 text-red-900 rounded-tr-none'
                    }
                  `}
                >
                  {msg.text}
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* Loading Indicator inside chat */}
        {state.isLoading && (
          <div className="flex justify-start w-full animate-pulse">
            <div className="flex flex-col max-w-[80%] items-start">
              <span className="text-xs text-gray-400 mb-1 font-serif">逗哏 (Dougen)</span>
              <div className="bg-gray-100 p-4 rounded-2xl rounded-tl-none text-gray-400 italic">
                正在思考包袱...
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Control Panel (Sticky Bottom) */}
      <div className="bg-white border-t border-gray-200 p-4 pb-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20">
        <h3 className="text-center text-sm text-gray-500 mb-3 font-medium">请选择您的接话 (Your Response)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {state.currentOptions.map((option, idx) => (
            <button
              key={option.id}
              onClick={() => onOptionSelect(option)}
              disabled={state.isLoading}
              className={`
                p-3 rounded-lg border-2 text-left transition-all duration-200 font-serif
                ${state.isLoading 
                  ? 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50' 
                  : 'border-stone-200 hover:border-red-400 hover:bg-red-50 hover:shadow-md active:bg-red-100 active:scale-[0.99] text-gray-800'
                }
              `}
            >
              <span className="font-bold mr-2 text-red-700 opacity-50 text-xs">#{idx + 1}</span>
              {option.text}
            </button>
          ))}
        </div>
      </div>
      
      {/* Feedback Overlay Animation (Transient) */}
      {state.lastFeedback && (
         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 w-full flex justify-center">
             <div className={`
                text-5xl md:text-7xl font-calligraphy drop-shadow-lg pop-in bg-white/95 p-8 rounded-xl border-4 rotate-[-5deg] shadow-2xl
                ${state.lastFeedback.includes('倒彩') ? 'text-gray-800 border-gray-800' : 'text-red-600 border-red-800'}
             `}>
                {state.lastFeedback.includes('倒彩') || state.lastFeedback.includes('下去') ? '吁～～' : '好！！'}
                {state.mood > 80 && state.lastFeedback.includes('喝彩') && <div className="text-sm md:text-xl text-center mt-2 font-serif text-orange-500">炸场啦！(+2)</div>}
                {state.mood < 30 && state.lastFeedback.includes('倒彩') && <div className="text-sm md:text-xl text-center mt-2 font-serif text-blue-800">要凉！(x2)</div>}
             </div>
         </div>
      )}
    </div>
  );
};

export default GameScreen;