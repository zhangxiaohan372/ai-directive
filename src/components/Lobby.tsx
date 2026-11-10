import React, { useState } from 'react';
import { Player } from '../types/game';
import { Users, Plus, LogIn, Play, Bot, UserCheck, ArrowLeft, Copy, Check } from 'lucide-react';

interface LobbyProps {
  roomId: string;
  roomCode: string;
  players: Player[];
  isHost: boolean;
  onStartGame: () => void;
  onCreateRoom: (hostName: string, includeBots: boolean) => void;
  onJoinRoom: (roomCode: string, playerName: string) => void;
  onBackToHome: () => void;
  onAddBotPlayer: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  roomId,
  roomCode,
  players,
  isHost,
  onStartGame,
  onCreateRoom,
  onJoinRoom,
  onBackToHome,
  onAddBotPlayer,
}) => {
  const [activeTab, setActiveTab] = useState<'current' | 'create' | 'join'>('current');
  const [hostNameInput, setHostNameInput] = useState('首席侦探');
  const [includeBotsCheck, setIncludeBotsCheck] = useState(true);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinNameInput, setJoinNameInput] = useState('特邀侦探');
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Top navigation */}
      <button
        onClick={onBackToHome}
        className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>返回首页</span>
      </button>

      {/* Main card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
        {/* Header Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/60 p-2">
          <button
            onClick={() => setActiveTab('current')}
            className={`flex-1 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'current'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4 text-coral-500" />
            <span>当前房间备战室</span>
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'create'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Plus className="w-4 h-4 text-sky-500" />
            <span>创建新房间</span>
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'join'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-4 h-4 text-purple-500" />
            <span>输入房间号加入</span>
          </button>
        </div>

        {/* Tab 1: Current Room */}
        {activeTab === 'current' && (
          <div className="p-6 md:p-8 space-y-6">
            {/* Room code banner */}
            <div className="p-4 rounded-2xl bg-coral-50/50 border border-coral-200/70 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-coral-700 uppercase tracking-wider block">
                  房间联机口令 (Room Code)
                </span>
                <span className="text-2xl font-black text-slate-900 tracking-wider font-mono">
                  {roomCode}
                </span>
              </div>
              <button
                onClick={handleCopyCode}
                className="px-3 py-1.5 rounded-xl bg-white border border-coral-200 text-xs font-bold text-coral-600 hover:bg-coral-50 transition flex items-center space-x-1"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '已复制' : '复制口令'}</span>
              </button>
            </div>

            {/* Players list */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-extrabold text-slate-700">
                  当前入座侦探 ({players.length}/4 人)：
                </h4>
                {players.length < 4 && (
                  <button
                    onClick={onAddBotPlayer}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center space-x-1"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>快速补充 AI 探友</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {players.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-2xl border border-slate-200/80 bg-white flex items-center justify-between shadow-2xs"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg">
                        {p.avatar}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 flex items-center space-x-1">
                          <span>{p.name}</span>
                          {p.isHost && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold">
                              房主
                            </span>
                          )}
                          {p.isBot && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-sky-100 text-sky-800 font-bold">
                              AI探友
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {p.isBot ? '智能协作助手' : '真人玩家'}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
                      <UserCheck className="w-3 h-3" />
                      <span>已就绪</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Launch button */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                支持 2~4 名侦探开局，全员已就绪！
              </span>

              <button
                onClick={onStartGame}
                className="px-8 py-3 rounded-2xl bg-slate-900 text-white font-extrabold text-sm hover:bg-slate-800 transition shadow-md flex items-center space-x-2"
              >
                <span>正式开始调查</span>
                <Play className="w-4 h-4 fill-white text-white" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Create Room */}
        {activeTab === 'create' && (
          <div className="p-6 md:p-8 space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                你的侦探昵称：
              </label>
              <input
                type="text"
                value={hostNameInput}
                onChange={(e) => setHostNameInput(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </div>

            <label className="flex items-center space-x-2.5 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includeBotsCheck}
                onChange={(e) => setIncludeBotsCheck(e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-400"
              />
              <span>自动补充 2 名模拟探友（侦探小林、解密达人阿强）以供测试</span>
            </label>

            <button
              onClick={() => {
                onCreateRoom(hostNameInput, includeBotsCheck);
                setActiveTab('current');
              }}
              className="w-full py-3 rounded-2xl bg-sky-500 text-white font-extrabold text-xs hover:bg-sky-600 transition shadow-sm"
            >
              创建并进入房间
            </button>
          </div>
        )}

        {/* Tab 3: Join Room */}
        {activeTab === 'join' && (
          <div className="p-6 md:p-8 space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                房间口令代码 (Room Code)：
              </label>
              <input
                type="text"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                placeholder="例如: MIST"
                className="w-full text-sm font-mono font-bold p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-200 tracking-wider"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">你的昵称：</label>
              <input
                type="text"
                value={joinNameInput}
                onChange={(e) => setJoinNameInput(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
            </div>

            <button
              onClick={() => {
                if (joinCodeInput) {
                  onJoinRoom(joinCodeInput, joinNameInput);
                  setActiveTab('current');
                }
              }}
              disabled={!joinCodeInput.trim()}
              className="w-full py-3 rounded-2xl bg-purple-600 text-white font-extrabold text-xs hover:bg-purple-700 disabled:opacity-40 transition shadow-sm"
            >
              加入指定房间
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
