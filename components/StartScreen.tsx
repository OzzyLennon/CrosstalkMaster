import React, { useState } from 'react';
import { OFFLINE_SCRIPTS } from '../constants';

interface StartScreenProps {
  onStart: (scriptIndex?: number) => void;
  isLoading: boolean;
  onStartOffline?: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart, isLoading }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center space-y-8">
      <div className="space-y-4">
        <h1 className="text-5xl md:text-7xl font-calligraphy text-red-700 drop-shadow-sm">
          相声捧哏模拟器
        </h1>
        <div className="inline-block bg-stone-200 text-stone-600 px-3 py-1 rounded text-xs font-bold tracking-widest uppercase">
          完全离线版
        </div>
        <p className="text-gray-600 text-lg md:text-xl font-serif">
          三分逗，七分捧。您能接住几个包袱？
        </p>
      </div>

      <div className="bg-white/80 p-6 rounded-lg shadow-xl border-2 border-amber-600 max-w-md w-full transition-all duration-300">
        {!showMenu ? (
          <>
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2 border-gray-200">
              游戏规则
            </h3>
            <ul className="text-left space-y-2 text-gray-700 text-sm md:text-base mb-6">
              <li className="flex items-start">
                <span className="text-red-600 mr-2">♦</span>
                逗哏说话，您（捧哏）选词儿接话。
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">♦</span>
                接得好，满堂<span className="font-bold text-green-700">喝彩</span>，加分！
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">♦</span>
                接不着，观众<span className="font-bold text-red-700">倒彩</span>起哄，甚至轰下台！
              </li>
            </ul>

            <div className="space-y-3">
              <button
                onClick={() => onStart()} // Random start
                disabled={isLoading}
                className={`w-full py-4 text-xl md:text-2xl font-bold rounded-lg transition-all transform shadow-md flex flex-col items-center justify-center border-b-4
                  ${
                    isLoading
                      ? 'bg-gray-400 border-gray-500 text-gray-200 cursor-not-allowed'
                      : 'bg-red-700 border-red-900 text-amber-50 hover:bg-red-800 hover:scale-[1.02] active:scale-95 active:border-b-0 active:translate-y-1'
                  }
                `}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center text-lg">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    正在整理大褂...
                  </span>
                ) : (
                  <span>👏 上台鞠躬 (Start)</span>
                )}
              </button>

              <button
                onClick={() => setShowMenu(true)}
                disabled={isLoading}
                className="w-full py-2 text-gray-700 font-bold rounded hover:bg-stone-200 transition-colors text-sm border border-stone-300"
              >
                📜 选择剧本 (Select Script)
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4 border-b pb-2 border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">
                请点戏 (Select)
              </h3>
              <button 
                onClick={() => setShowMenu(false)}
                className="text-gray-500 hover:text-red-600 font-bold px-2"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto scrollbar-hide pr-1">
              {OFFLINE_SCRIPTS.map((script, index) => (
                <button
                  key={index}
                  onClick={() => onStart(index)}
                  disabled={isLoading}
                  className="p-3 text-left rounded bg-stone-50 border border-stone-200 hover:border-red-400 hover:bg-red-50 hover:shadow-sm transition-all text-gray-800 font-serif"
                >
                  <div className="font-bold text-sm">
                    {index + 1}. {script.topic.split('(')[0]}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                     {script.topic.split('(')[1]?.replace(')', '') || 'Classic'}
                  </div>
                </button>
              ))}
            </div>
            <div className="text-xs text-center text-gray-400 mt-2">
              共 {OFFLINE_SCRIPTS.length} 个剧本
            </div>
          </>
        )}
      </div>
      
      <div className="text-xs text-gray-400 mt-4">
        无需联网 · 本地运行
      </div>
    </div>
  );
};

export default StartScreen;