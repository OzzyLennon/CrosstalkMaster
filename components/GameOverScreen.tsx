import React, { useState, useEffect } from 'react';
import { GameState, Role } from '../types';
import { ENCORE_THRESHOLD } from '../constants';
import { playEncore } from '../utils/sound';

interface GameOverScreenProps {
  state: GameState;
  onRestart: () => void; // Go back to Home
  onNewGame: () => void; // Start new game directly
  onEncore: () => Promise<{ success: boolean; message?: string }>;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ state, onRestart, onNewGame, onEncore }) => {
  const isWin = state.daocai < 3;
  const canEncore = state.hecai >= ENCORE_THRESHOLD && state.daocai < 2; 

  const [showScript, setShowScript] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    if (canEncore) {
      playEncore();
    }
  }, [canEncore]);

  const handleEncoreClick = async () => {
    const result = await onEncore();
    if (!result.success && result.message) {
      setFeedbackMessage(result.message);
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
  };

  const generateScript = () => {
    return state.messages
      .filter(m => !m.isEvaluation)
      .map(m => `${m.role === Role.DOUGEN ? '逗哏' : '捧哏'}：${m.text}`)
      .join('\n\n');
  };

  const copyToClipboard = () => {
    const script = generateScript();
    navigator.clipboard.writeText(script).then(() => {
      alert('台词已复制到剪贴板！');
    });
  };

  // Determine Rank
  const getRank = (score: number) => {
    if (score < 5) return { title: '相声学徒', desc: '刚入门，还得练练嘴皮子！' };
    if (score < 10) return { title: '小有名气', desc: '不错，能在这四九城混口饭吃！' };
    if (score < 18) return { title: '德云台柱', desc: '好家伙，您就是未来的相声大师！' };
    return { title: '一代宗师', desc: '前无古人，后无来者，您就是传说！' };
  };

  const rank = getRank(state.hecai);

  // Generate dynamic summary text based on performance
  const getSummaryText = () => {
    if (canEncore) {
      return '太棒了！您的表演惊艳四座，观众久久不愿离去，强烈要求返场！您要再来一段吗？';
    }
    if (!isWin) {
      return '这一场演砸了！观众把瓜子皮都扔台上了。回去再练练嘴皮子吧！';
    }
    
    // Win conditions based on score
    if (state.hecai < 5) {
      return '您这捧得...怎么说呢，没让观众睡着就算成功。离“严丝合缝”还差着二里地呢，还得勤练呐！';
    }
    if (state.hecai < 10) {
      return '有来有回，像模像样。虽说没那么多炸裂的包袱，但也没让话掉地上。观众听个乐呵，但也记得住您这号人物了。';
    }
    if (state.hecai < 18) {
      return '这尺寸拿捏得死死的！翻包袱干脆利落，观众的手都拍红了，期待您下场演出！';
    }
    return '神了！您这反应比电脑都快。哪怕逗哏的是个哑巴，您都能给捧出花儿来！';
  };

  return (
    <div className={`
      flex flex-col items-center justify-center min-h-screen p-6 relative overflow-hidden
      ${canEncore ? 'bg-gradient-to-b from-red-50 to-amber-100' : 'bg-stone-100'}
    `}>
      
      {/* Encore Confetti Animation Elements */}
      {canEncore && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i}
              className="absolute text-2xl animate-bounce"
              style={{
                top: `${Math.random() * -20}%`,
                left: `${Math.random() * 100}%`,
                animationDuration: `${2 + Math.random() * 3}s`,
                animationDelay: `${Math.random() * 2}s`,
                opacity: 0.6
              }}
            >
              {['🎊', '✨', '🎉', '🌹'][Math.floor(Math.random() * 4)]}
            </div>
          ))}
        </div>
      )}

      {/* Toast Notification for Encore Error */}
      {feedbackMessage && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-sm px-4 pointer-events-none">
           <div className="animate-bounce pointer-events-auto">
             <div className="bg-gray-800/95 text-white px-6 py-4 rounded-xl shadow-2xl flex flex-col items-center border border-gray-600 backdrop-blur-sm">
               <div className="text-4xl mb-2">🥵</div>
               <div className="text-center font-bold text-lg">{feedbackMessage}</div>
               <div className="mt-2 text-xs text-gray-400">（点击在线模式即可无限续写）</div>
             </div>
           </div>
        </div>
      )}

      {/* Modal for Script */}
      {showScript && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-stone-50 rounded-t-xl">
              <h3 className="font-bold text-lg font-serif">本场演出台词本</h3>
              <button onClick={() => setShowScript(false)} className="text-gray-500 hover:text-gray-800">
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto bg-stone-50 font-serif text-gray-800 leading-relaxed whitespace-pre-wrap">
              {generateScript()}
            </div>
            <div className="p-4 border-t flex justify-end space-x-4 bg-white rounded-b-xl">
               <button 
                onClick={copyToClipboard}
                className="px-4 py-2 text-red-700 font-bold border-2 border-red-700 rounded hover:bg-red-50"
              >
                复制全文
              </button>
              <button 
                onClick={() => setShowScript(false)}
                className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`
        w-full max-w-md p-8 rounded-xl shadow-2xl text-center border-4 z-10 transition-all duration-500
        ${canEncore 
          ? 'bg-white/90 border-yellow-500 shadow-yellow-500/30 scale-105' 
          : (isWin ? 'bg-red-50 border-red-600' : 'bg-gray-100 border-gray-600')
        }
      `}>
        
        {canEncore && (
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-red-900 px-6 py-2 rounded-full font-bold shadow-lg border-2 border-white animate-pulse whitespace-nowrap z-20">
             🌟 观众高呼：再来一个！ 🌟
          </div>
        )}

        <h2 className="text-5xl font-calligraphy mb-4 mt-2">
          {isWin ? '完美谢幕' : '演出事故'}
        </h2>
        
        {isWin && (
          <div className="mb-4">
             <span className={`
               inline-block px-4 py-1 rounded-full text-sm font-bold border 
               ${canEncore ? 'bg-yellow-400 text-red-900 border-red-500' : 'bg-yellow-100 text-yellow-800 border-yellow-400'}
             `}>
               获得称号
             </span>
             <div className="text-3xl font-bold text-red-700 mt-2 font-serif drop-shadow-sm">{rank.title}</div>
             <div className="text-sm text-gray-500 mt-1">{rank.desc}</div>
          </div>
        )}

        <div className="text-6xl mb-6 filter drop-shadow-md transform hover:scale-110 transition-transform">
          {canEncore ? '🏆' : (isWin ? '🎉' : '🍅')}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8 bg-white/50 p-4 rounded-lg">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 uppercase">最终喝彩</span>
            <span className="text-3xl font-bold text-red-700">{state.hecai}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 uppercase">最终倒彩</span>
            <span className="text-3xl font-bold text-gray-700">{state.daocai}</span>
          </div>
        </div>

        <p className="text-lg mb-8 font-serif leading-relaxed text-gray-700">
          {getSummaryText()}
        </p>

        <div className="space-y-3">
          {canEncore && (
             <button
              onClick={handleEncoreClick}
              className="w-full py-3 px-6 rounded-lg font-bold text-lg shadow-lg border-2 border-yellow-300 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-red-900 hover:scale-[1.03] active:scale-95 transition-all animate-pulse"
            >
              🎤 返场！再多说两句 (Encore)
            </button>
          )}

          {/* New Game Button - Primary Action if no encore or second option */}
          <button
            onClick={onNewGame}
            className={`
              w-full py-3 px-6 rounded-lg font-bold text-lg shadow-md transition-transform transform hover:scale-105 border-2
              ${canEncore
                ? 'bg-red-700 text-white border-red-800 hover:bg-red-800'
                : 'bg-red-600 text-white border-red-700 hover:bg-red-700'
              }
            `}
          >
            🎬 换个段子继续 (Next Script)
          </button>

          {/* Script Review */}
          <button
            onClick={() => setShowScript(true)}
            className="w-full py-2 px-6 rounded-lg font-bold text-base text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 shadow-sm"
          >
            📜 回顾全场台词
          </button>
          
          {/* Return to Home - Secondary Action */}
           <button
            onClick={onRestart}
            className="w-full py-2 px-6 rounded-lg font-bold text-base text-gray-500 hover:text-gray-800 bg-transparent hover:bg-black/5"
          >
            🏠 谢幕离场 (Return Home)
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverScreen;