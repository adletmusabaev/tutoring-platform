import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import * as gamificationService from '../services/gamificationService';

const TIER_COLORS = {
  platinum: { bg: 'bg-gradient-to-br from-slate-300 to-slate-500', text: 'text-slate-800', border: 'border-slate-400', badge: 'bg-slate-200' },
  gold:     { bg: 'bg-gradient-to-br from-yellow-300 to-yellow-500', text: 'text-yellow-900', border: 'border-yellow-400', badge: 'bg-yellow-100' },
  silver:   { bg: 'bg-gradient-to-br from-gray-300 to-gray-400',   text: 'text-gray-800',   border: 'border-gray-400',   badge: 'bg-gray-100' },
  bronze:   { bg: 'bg-gradient-to-br from-amber-500 to-amber-700', text: 'text-amber-900',  border: 'border-amber-500',  badge: 'bg-amber-50'  },
  none:     { bg: 'bg-gradient-to-br from-blue-400 to-indigo-600', text: 'text-white',      border: 'border-blue-400',   badge: 'bg-blue-50'   },
};

function AchievementsPage() {
  const { user } = useAuth();
  const [gamification, setGamification] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('achievements');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [gData, lData] = await Promise.all([
        gamificationService.getMyGamification(),
        gamificationService.getLeaderboard()
      ]);
      setGamification(gData);
      setLeaderboard(lData);
    } catch (err) {
      console.error('Failed to load gamification data', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const { points = 0, levelInfo = {}, achievements = [] } = gamification || {};
  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const tierColors = TIER_COLORS[levelInfo.tier] || TIER_COLORS.none;
  const progressPct = Math.min(levelInfo.progress || 0, 100);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">

      {/* Header Banner */}
      <div className={`${tierColors.bg} rounded-2xl p-8 text-white shadow-xl`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-white/70 text-sm font-semibold uppercase tracking-widest mb-1">Your Rank</p>
            <h1 className="text-4xl font-extrabold mb-1">
              {levelInfo.icon} {levelInfo.level}
            </h1>
            <p className="text-white/80 text-lg">{user?.name}</p>
          </div>
          <div className="text-center md:text-right">
            <div className="text-6xl font-black">{points}</div>
            <div className="text-white/70 font-semibold text-sm uppercase tracking-widest">Total Points</div>
          </div>
        </div>

        {/* XP Progress Bar */}
        {levelInfo.next && (
          <div className="mt-6">
            <div className="flex justify-between text-white/80 text-sm mb-2">
              <span>{points} pts</span>
              <span>Next level: {levelInfo.next} pts</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3">
              <div
                className="bg-white h-3 rounded-full transition-all duration-1000"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-white/60 text-xs mt-1 text-right">{progressPct}% to next level</p>
          </div>
        )}
        {!levelInfo.next && (
          <div className="mt-4 text-white/80 font-semibold">🎉 Maximum level reached!</div>
        )}
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 text-center">
          <div className="text-3xl font-black text-blue-600">{points}</div>
          <div className="text-gray-500 text-sm mt-1">Total Points</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 text-center">
          <div className="text-3xl font-black text-green-600">{unlockedAchievements.length}</div>
          <div className="text-gray-500 text-sm mt-1">Achievements</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 text-center">
          <div className="text-3xl font-black text-purple-600">
            {(Array.isArray(leaderboard) ? leaderboard : []).find(l => l?.name === user?.name)?.rank || '—'}
          </div>
          <div className="text-gray-500 text-sm mt-1">Leaderboard Rank</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: 'achievements', label: '🏅 Achievements' },
          { id: 'leaderboard', label: '🏆 Leaderboard' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              All Achievements <span className="text-gray-400 font-normal text-lg">({unlockedAchievements.length}/{achievements.length})</span>
            </h2>
          </div>

          {/* Group by tier */}
          {['platinum', 'gold', 'silver', 'bronze'].map(tier => {
            const tierAchs = achievements.filter(a => a.tier === tier);
            if (!tierAchs.length) return null;
            const tc = TIER_COLORS[tier];
            return (
              <div key={tier} className="mb-8">
                <h3 className={`text-xs font-bold uppercase tracking-widest mb-3 ${tc.text.replace('text-', 'text-')} capitalize`}>
                  {tier} Tier
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {tierAchs.map(ach => (
                    <div
                      key={ach.key}
                      className={`relative bg-white rounded-2xl p-5 border-2 text-center transition-all duration-300 ${
                        ach.unlocked
                          ? `${tc.border} shadow-md hover:shadow-lg hover:-translate-y-1`
                          : 'border-gray-200 opacity-50 grayscale'
                      }`}
                    >
                      {ach.unlocked && (
                        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">✓</div>
                      )}
                      <div className="text-4xl mb-3">{ach.icon}</div>
                      <div className="font-bold text-sm text-gray-800 mb-1">{ach.name}</div>
                      <div className="text-xs text-gray-500 mb-2">{ach.description}</div>
                      {ach.pointsReward > 0 && (
                        <div className={`text-xs font-bold ${ach.unlocked ? 'text-green-600' : 'text-gray-400'}`}>
                          +{ach.pointsReward} pts
                        </div>
                      )}
                      {!ach.unlocked && (
                        <div className="text-xs text-gray-400 mt-1">🔒 Locked</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800">Top Students</h2>
            <p className="text-gray-500 text-sm mt-1">Rankings based on total points earned</p>
          </div>
          <div className="divide-y divide-gray-50">
            {!Array.isArray(leaderboard) || leaderboard.length === 0 ? (
              <div className="py-12 text-center text-gray-500">No leaderboard data yet</div>
            ) : (
              leaderboard.map((entry, index) => {
                const isMe = entry.name === user?.name;
                const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${entry.rank}`;
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-4 p-5 transition-colors ${isMe ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                  >
                    <div className="text-2xl font-black w-10 text-center">{rankEmoji}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{entry.name}</span>
                        {isMe && <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">You</span>}
                      </div>
                      <div className="text-xs text-gray-500">{entry.levelInfo.icon} {entry.levelInfo.level} · {entry.achievementsCount} achievements</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-blue-600">{entry.points}</div>
                      <div className="text-xs text-gray-400">points</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AchievementsPage;
