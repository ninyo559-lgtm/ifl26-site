import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Trophy, 
  Settings, 
  Users, 
  Calendar, 
  Award, 
  Lock, 
  Plus, 
  Trash2, 
  History, 
  X, 
  Check, 
  BarChart3,
  Newspaper,
  RefreshCcw,
  ShieldCheck,
  Crown,
  UserPlus,
  Edit2,
  GitBranch,
  User as UserIcon,
  ChevronRight,
  Search,
  Zap,
  LayoutGrid,
  AlertTriangle,
  Save,
  Swords,
  Flame,
  MinusCircle,
  UserCheck,
  ChevronDown,
  Cloud,
  CloudOff
} from 'lucide-react';
import { LeagueType, Player, Fixture, PlayerStats, SeasonHistoryEntry, HallOfFameEntry, PlayoffBrackets, CLGroup, PlayoffMatch } from './types';
import { generateLeagueCommentary } from './services/geminiService';

const STORAGE_KEYS = {
  PLAYERS: 'ifl_v2_players',
  PREMIER_IDS: 'ifl_v2_premier_ids',
  NATIONAL_IDS: 'ifl_v2_national_ids',
  CL_GROUPS: 'ifl_v2_cl_groups',
  FIXTURES: 'ifl_v2_fixtures',
  HOF: 'ifl_v2_hof',
  MONTH: 'ifl_v2_month',
  PLAYOFFS: 'ifl_v2_playoffs',
  HISTORY: 'ifl_v2_history',
};

function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

const IFLLogo = () => (
  <div className="flex flex-col items-center">
    <svg viewBox="0 0 200 240" className="w-16 h-auto drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 45 L180 45 L185 140 L100 190 L15 140 Z" fill="#7DD3FC" fillOpacity="0.4" />
      <path d="M20 45 L180 45 L185 140 L100 190 L15 140 Z" stroke="#1E40AF" strokeWidth="6" strokeLinejoin="round" />
      <circle cx="100" cy="92" r="45" fill="white" stroke="#1E40AF" strokeWidth="2" />
      <path d="M100 65 L115 75 L110 92 H90 L85 75 Z" fill="#1E40AF" />
      <path d="M100 119 L88 110 L112 110 Z" fill="#1E40AF" />
      <path d="M138 80 L125 90 L130 105 Z" fill="#1E40AF" />
      <path d="M62 80 L75 90 L70 105 Z" fill="#1E40AF" />
      <path d="M145 65 L190 55" stroke="#1E40AF" strokeWidth="4" strokeLinecap="round" />
      <path d="M150 92 L205 92" stroke="#1E40AF" strokeWidth="4" strokeLinecap="round" />
      <path d="M145 119 L190 129" stroke="#1E40AF" strokeWidth="4" strokeLinecap="round" />
      <text x="100" y="215" textAnchor="middle" fill="#1E40AF" fontSize="38" fontWeight="900" fontFamily="Heebo" style={{ letterSpacing: '-1.5px' }}>IFL 26</text>
      <path d="M45 220 L100 242 L155 220" stroke="#1E40AF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <text x="100" y="238" textAnchor="middle" fill="#1E40AF" fontSize="12" fontWeight="900" fontFamily="Heebo">2022</text>
    </svg>
  </div>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('leagues');
  const [fixtureSubTab, setFixtureSubTab] = useState<LeagueType>('premier');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [commentary, setCommentary] = useState<string | null>(null);
  const [isGeneratingCommentary, setIsGeneratingCommentary] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [fixtureSearchQuery, setFixtureSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [tempUploadedPhoto, setTempUploadedPhoto] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const [showPlayerModal, setShowPlayerModal] = useState<{show: boolean, player?: Player, league?: LeagueType, groupId?: string}>({show: false});
  const [playerModalTab, setPlayerModalTab] = useState<'new' | 'existing'>('new');
  const [existingPlayerSearch, setExistingPlayerSearch] = useState('');

  const [showHOFModal, setShowHOFModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [selectedPlayerInfo, setSelectedPlayerInfo] = useState<Player | null>(null);
  const [playoffViewMode, setPlayoffViewMode] = useState<LeagueType>('premier');
  
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const [historyToDelete, setHistoryToDelete] = useState<SeasonHistoryEntry | null>(null);
  const [playerToRemoveFromLeague, setPlayerToRemoveFromLeague] = useState<{player: Player, league: LeagueType, groupId?: string} | null>(null);
  const [fixtureToUpdate, setFixtureToUpdate] = useState<Fixture | null>(null);
  const [updateScores, setUpdateScores] = useState({ home: '', away: '' });

  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  // STORAGE
  const [players, setPlayers] = useLocalStorage<Player[]>(STORAGE_KEYS.PLAYERS, []);
  const [premierPlayerIds, setPremierPlayerIds] = useLocalStorage<string[]>(STORAGE_KEYS.PREMIER_IDS, []);
  const [nationalPlayerIds, setNationalPlayerIds] = useLocalStorage<string[]>(STORAGE_KEYS.NATIONAL_IDS, []);
  const [clGroups, setClGroups] = useLocalStorage<CLGroup[]>(STORAGE_KEYS.CL_GROUPS, [
    { id: '1', name: 'בית 1', playerIds: [] },
    { id: '2', name: 'בית 2', playerIds: [] },
    { id: '3', name: 'בית 3', playerIds: [] },
    { id: '4', name: 'בית 4', playerIds: [] },
  ]);
  const [fixtures, setFixtures] = useLocalStorage<Fixture[]>(STORAGE_KEYS.FIXTURES, []);
  const [hallOfFame, setHallOfFame] = useLocalStorage<HallOfFameEntry[]>(STORAGE_KEYS.HOF, []);
  const [currentMonth, setCurrentMonth] = useLocalStorage<string>(STORAGE_KEYS.MONTH, 'פברואר 2025');
  const [playoffs, setPlayoffs] = useLocalStorage<PlayoffBrackets>(STORAGE_KEYS.PLAYOFFS, { premier: [], national: [], champions: [] });
  const [history, setHistory] = useLocalStorage<SeasonHistoryEntry[]>(STORAGE_KEYS.HISTORY, []);

  // CLOUD SYNC
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const ignorePushFromCloud = useRef(false);

  useEffect(() => {
    const initSync = () => {
      try {
        const firebase = (window as any).firebase;
        if (!firebase) return;

        // Safer env access
        const env = (import.meta as any).env || process.env || {};
        const apiKey = env.VITE_FIREBASE_API_KEY;
        const databaseURL = env.VITE_FIREBASE_DATABASE_URL;

        if (!apiKey || !databaseURL) return;

        if (!firebase.apps.length) {
          firebase.initializeApp({ apiKey, databaseURL });
        }

        const db = firebase.database();
        const mainRef = db.ref('ifl_global_v2');
        const connRef = db.ref('.info/connected');

        connRef.on('value', (snap: any) => setIsCloudConnected(snap.val() === true));

        mainRef.on('value', (snapshot: any) => {
          const data = snapshot.val();
          if (data) {
            setIsSyncing(true);
            ignorePushFromCloud.current = true;
            if (data.players) setPlayers(data.players);
            if (data.premierIds) setPremierPlayerIds(data.premierIds);
            if (data.nationalIds) setNationalPlayerIds(data.nationalIds);
            if (data.clGroups) setClGroups(data.clGroups);
            if (data.fixtures) setFixtures(data.fixtures);
            if (data.hof) setHallOfFame(data.hof);
            if (data.month) setCurrentMonth(data.month);
            if (data.playoffs) setPlayoffs(data.playoffs);
            if (data.history) setHistory(data.history);
            setTimeout(() => { setIsSyncing(false); ignorePushFromCloud.current = false; }, 300);
          }
        });
      } catch (e) {
        console.error("Sync init failed:", e);
      }
    };
    initSync();
  }, []);

  useEffect(() => {
    if (isCloudConnected && !ignorePushFromCloud.current && !isSyncing) {
      try {
        const firebase = (window as any).firebase;
        if (firebase && firebase.apps.length) {
          firebase.database().ref('ifl_global_v2').set({
            players: players || [],
            premierIds: premierPlayerIds || [],
            nationalIds: nationalPlayerIds || [],
            clGroups: clGroups || [],
            fixtures: fixtures || [],
            hof: hallOfFame || [],
            month: currentMonth || '',
            playoffs: playoffs || { premier: [], national: [], champions: [] },
            history: history || [],
            lastUpdate: new Date().toISOString()
          });
        }
      } catch (e) {}
    }
  }, [players, premierPlayerIds, nationalPlayerIds, clGroups, fixtures, hallOfFame, currentMonth, playoffs, history, isCloudConnected, isSyncing]);

  // CALCULATION LOGIC
  const calculateTable = (league: LeagueType, groupId?: string): PlayerStats[] => {
    const safePlayers = Array.isArray(players) ? players.filter(Boolean) : [];
    const safeFixtures = Array.isArray(fixtures) ? fixtures.filter(Boolean) : [];
    let leaguePlayerIds: string[] = [];

    if (league === 'premier') leaguePlayerIds = premierPlayerIds || [];
    else if (league === 'national') leaguePlayerIds = nationalPlayerIds || [];
    else if (league === 'champions' && groupId) {
      const group = (clGroups || []).find(g => g && g.id === groupId);
      leaguePlayerIds = group ? group.playerIds : [];
    }
    
    const stats: Record<string, PlayerStats> = {};
    safePlayers.filter(p => leaguePlayerIds.includes(p.id)).forEach(p => {
      stats[p.id] = { id: p.id, name: p.name, team: p.sonyUsername || 'PSN', gp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
    });
    
    safeFixtures.filter(f => f.league === league && (!groupId || f.groupId === groupId) && f.completed).forEach(f => {
      if (!stats[f.homePlayerId] || !stats[f.awayPlayerId]) return;
      const h = f.homeScore || 0, a = f.awayScore || 0;
      stats[f.homePlayerId].gp += 1; stats[f.awayPlayerId].gp += 1;
      stats[f.homePlayerId].gf += h; stats[f.homePlayerId].ga += a;
      stats[f.awayPlayerId].gf += a; stats[f.awayPlayerId].ga += h;
      if (h > a) { stats[f.homePlayerId].w += 1; stats[f.homePlayerId].pts += 3; stats[f.awayPlayerId].l += 1; }
      else if (h < a) { stats[f.awayPlayerId].w += 1; stats[f.awayPlayerId].pts += 3; stats[f.homePlayerId].l += 1; }
      else { stats[f.homePlayerId].d += 1; stats[f.homePlayerId].pts += 1; stats[f.awayPlayerId].d += 1; stats[f.awayPlayerId].pts += 1; }
    });

    return Object.values(stats).map(s => ({ ...s, gd: s.gf - s.ga })).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  };

  const premierStats = useMemo(() => calculateTable('premier'), [fixtures, players, premierPlayerIds]);
  const nationalStats = useMemo(() => calculateTable('national'), [fixtures, players, nationalPlayerIds]);
  const clGroupStats = useMemo(() => (clGroups || []).map(group => ({ group, stats: calculateTable('champions', group.id) })), [fixtures, players, clGroups]);

  const getPlayerCareerStats = (playerId: string) => {
    const stats = { gp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, titles: 0, streak: [] as string[], activeSeasons: 0 };
    const safePlayers = (players || []).filter(Boolean);
    const safeFixtures = (fixtures || []).filter(Boolean);
    const safeHistory = (history || []).filter(Boolean);
    const playerName = safePlayers.find(p => p.id === playerId)?.name;
    
    [...premierStats, ...nationalStats, ...clGroupStats.flatMap(g => g.stats)].forEach(s => {
      if (s.id === playerId) { stats.gp += s.gp; stats.w += s.w; stats.d += s.d; stats.l += s.l; stats.gf += s.gf; stats.ga += s.ga; stats.pts += s.pts; }
    });
    
    safeHistory.forEach(h => {
      let active = false;
      [...(h.premierTable || []), ...(h.nationalTable || [])].forEach(s => { 
        if (s.id === playerId) { stats.gp += s.gp; stats.w += s.w; stats.d += s.d; stats.l += s.l; stats.gf += s.gf; stats.ga += s.ga; stats.pts += s.pts; active = true; } 
      });
      if (h.premierWinner === playerName || h.nationalWinner === playerName || h.championsWinner === playerName) stats.titles += 1;
      if (active) stats.activeSeasons += 1;
    });
    if ((premierPlayerIds || []).includes(playerId) || (nationalPlayerIds || []).includes(playerId)) stats.activeSeasons += 1;
    
    stats.streak = safeFixtures.filter(f => f.completed && (f.homePlayerId === playerId || f.awayPlayerId === playerId)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).map(f => {
      const isHome = f.homePlayerId === playerId;
      const my = isHome ? (f.homeScore || 0) : (f.awayScore || 0);
      const opp = isHome ? (f.awayScore || 0) : (f.homeScore || 0);
      return my > opp ? 'W' : my < opp ? 'L' : 'D';
    }).reverse();
    
    stats.titles += (hallOfFame || []).filter(entry => entry.playerName === playerName).length;
    return stats;
  };

  const handleAdminLogin = () => {
    if (pin === '8987') { setIsAdmin(true); setShowPinModal(false); setPin(''); }
    else { alert('קוד שגוי!'); setPin(''); }
  };

  const savePlayer = (data: {name: string, sonyUsername: string, photoUrl: string}, league?: LeagueType, groupId?: string) => {
    if (!data.name) return;
    if (showPlayerModal.player) {
      setPlayers(prev => (prev || []).map(p => p.id === showPlayerModal.player!.id ? { ...p, ...data } : p));
    } else {
      const newP: Player = { id: Date.now().toString(), ...data };
      setPlayers(prev => [...(prev || []), newP]);
      if (league) addExistingPlayerToLeague(newP.id, league, groupId);
    }
    setTempUploadedPhoto(null); setShowPlayerModal({show: false});
  };

  const addExistingPlayerToLeague = (playerId: string, league: LeagueType, groupId?: string) => {
    if (!playerId) return;
    if (league === 'premier' || league === 'national') {
      const list = league === 'premier' ? (premierPlayerIds || []) : (nationalPlayerIds || []);
      const setter = league === 'premier' ? setPremierPlayerIds : setNationalPlayerIds;
      const updated = [...list, playerId]; 
      setter(updated);
      updated.forEach(id => { 
        if(id !== playerId) { 
          setFixtures(prev => [...(prev || []), 
            { id: Math.random().toString(36).substr(2, 9), league, homePlayerId: playerId, awayPlayerId: id, homeScore: null, awayScore: null, completed: false, date: new Date().toISOString() }, 
            { id: Math.random().toString(36).substr(2, 9), league, homePlayerId: id, awayPlayerId: playerId, homeScore: null, awayScore: null, completed: false, date: new Date().toISOString() }
          ]); 
        }
      });
    } else if (league === 'champions' && groupId) {
      setClGroups(prev => (prev || []).map(g => {
        if (g.id === groupId) {
          const updated = [...(g.playerIds || []), playerId];
          updated.forEach(id => { 
            if(id !== playerId) { 
              setFixtures(px => [...(px || []), 
                { id: Math.random().toString(36).substr(2, 9), league, homePlayerId: playerId, awayPlayerId: id, homeScore: null, awayScore: null, completed: false, date: new Date().toISOString(), groupId }, 
                { id: Math.random().toString(36).substr(2, 9), league, homePlayerId: id, awayPlayerId: playerId, homeScore: null, awayScore: null, completed: false, date: new Date().toISOString(), groupId }
              ]); 
            }
          });
          return { ...g, playerIds: updated };
        }
        return g;
      }));
    }
    setShowPlayerModal({show: false});
  };

  const startLeaguePlayoffs = (league: LeagueType) => {
    const stats = league === 'premier' ? premierStats : nationalStats;
    if (stats.length < 8) return;
    const top8 = stats.slice(0, 8);
    const qf: PlayoffMatch[] = [
      { id: Math.random().toString(36), round: 'quarter', player1Id: top8[0].id, player2Id: top8[7].id, score1: null, score2: null, winnerId: null, index: 0 },
      { id: Math.random().toString(36), round: 'quarter', player1Id: top8[3].id, player2Id: top8[4].id, score1: null, score2: null, winnerId: null, index: 1 },
      { id: Math.random().toString(36), round: 'quarter', player1Id: top8[1].id, player2Id: top8[6].id, score1: null, score2: null, winnerId: null, index: 2 },
      { id: Math.random().toString(36), round: 'quarter', player1Id: top8[2].id, player2Id: top8[5].id, score1: null, score2: null, winnerId: null, index: 3 },
    ];
    const sf: PlayoffMatch[] = [{ id: Math.random().toString(36), round: 'semi', player1Id: null, player2Id: null, score1: null, score2: null, winnerId: null, index: 0 }, { id: Math.random().toString(36), round: 'semi', player1Id: null, player2Id: null, score1: null, score2: null, winnerId: null, index: 1 }];
    const fn: PlayoffMatch[] = [{ id: Math.random().toString(36), round: 'final', player1Id: null, player2Id: null, score1: null, score2: null, winnerId: null, index: 0 }];
    setPlayoffs(prev => ({ ...(prev || { premier: [], national: [], champions: [] }), [league]: [...qf, ...sf, ...fn] }));
  };

  const updatePlayoffScore = (mode: LeagueType, matchId: string, s1: number, s2: number) => {
    const key = mode as keyof PlayoffBrackets;
    const bracket = [...((playoffs && playoffs[key]) || [])];
    const idx = bracket.findIndex(m => m.id === matchId);
    if (idx === -1 || s1 === s2) return;
    const match = { ...bracket[idx], score1: s1, score2: s2, winnerId: s1 > s2 ? bracket[idx].player1Id : bracket[idx].player2Id };
    bracket[idx] = match;
    if (match.round === 'quarter') {
      const semis = bracket.filter(m => m.round === 'semi');
      const target = semis[Math.floor(match.index / 2)];
      if (target) { if (match.index % 2 === 0) target.player1Id = match.winnerId; else target.player2Id = match.winnerId; }
    } else if (match.round === 'semi') {
      const final = bracket.find(m => m.round === 'final');
      if (final) { if (match.index === 0) final.player1Id = match.winnerId; else final.player2Id = match.winnerId; }
    }
    setPlayoffs(prev => ({ ...(prev || { premier: [], national: [], champions: [] }), [key]: bracket }));
  };

  const archiveSeason = (nextSeasonName: string) => {
    const pFinal = (playoffs.premier || []).find(m => m.round === 'final');
    const nFinal = (playoffs.national || []).find(m => m.round === 'final');
    const cFinal = (playoffs.champions || []).find(m => m.round === 'final');

    const getPlayerName = (id: string | null) => id ? (players || []).find(p => p.id === id)?.name : undefined;

    const historyEntry: SeasonHistoryEntry = {
      id: Date.now().toString(),
      seasonName: currentMonth,
      premierTable: premierStats,
      nationalTable: nationalStats,
      premierWinner: getPlayerName(pFinal?.winnerId) || premierStats[0]?.name,
      nationalWinner: getPlayerName(nFinal?.winnerId) || nationalStats[0]?.name,
      championsWinner: getPlayerName(cFinal?.winnerId),
      timestamp: new Date().toISOString()
    };

    setHistory(prev => [...(prev || []), historyEntry]);
    setFixtures([]);
    setPremierPlayerIds([]);
    setNationalPlayerIds([]);
    setClGroups((prev) => (prev || []).map(g => ({ ...g, playerIds: [] })));
    setPlayoffs({ premier: [], national: [], champions: [] });
    setCurrentMonth(nextSeasonName);
    setShowArchiveModal(false);
  };

  const TableHeader = () => (
    <thead>
      <tr className="bg-slate-800 text-slate-400 text-[8px] md:text-[9px] uppercase tracking-widest font-black border-b border-slate-200">
        <th className="px-2 py-4 text-center">#</th>
        <th className="px-4 py-4 text-right">שחקן</th>
        <th className="px-2 py-4 text-center">מש'</th>
        <th className="px-2 py-4 text-center text-green-600">נ'</th>
        <th className="px-2 py-4 text-center text-slate-600">ת'</th>
        <th className="px-2 py-4 text-center text-red-600">ה'</th>
        <th className="px-2 py-4 text-center text-blue-600">הפרש</th>
        <th className="px-4 py-4 text-center text-blue-700">נק'</th>
      </tr>
    </thead>
  );

  const TableRow: React.FC<{ p: PlayerStats, idx: number }> = ({ p, idx }) => {
    const playerObj = (players || []).find(px => px && px.id === p.id);
    return (
      <tr onClick={() => playerObj && setSelectedPlayerInfo(playerObj)} className="hover:bg-slate-100 transition-all border-b border-slate-100 last:border-0 cursor-pointer">
        <td className="px-2 py-4 text-center"><span className={`w-6 h-6 md:w-7 md:h-7 inline-flex items-center justify-center rounded-lg font-black text-[10px] md:text-[11px] ${idx === 0 ? 'bg-yellow-500 text-black' : 'bg-slate-200 text-slate-500'}`}>{idx + 1}</span></td>
        <td className="px-4 py-4"><div className="flex items-center gap-2 md:gap-4 text-right truncate"><div className="w-8 h-8 rounded-xl overflow-hidden bg-slate-200 border border-slate-300 shrink-0">{playerObj?.photoUrl ? <img src={playerObj.photoUrl} className="w-full h-full object-cover" alt={p.name} /> : <UserIcon size={14} className="m-auto mt-2 text-slate-400" />}</div><span className="font-black text-xs md:text-sm text-slate-800 truncate">{p.name}</span></div></td>
        <td className="px-2 py-4 text-center text-[10px] font-bold text-slate-500">{p.gp}</td>
        <td className="px-2 py-4 text-center text-[10px] font-black text-green-600">{p.w}</td>
        <td className="px-2 py-4 text-center text-[10px] font-bold text-slate-400">{p.d}</td>
        <td className="px-2 py-4 text-center text-[10px] font-black text-red-600">{p.l}</td>
        <td className="px-2 py-4 text-center text-[10px] font-black text-blue-600">{p.gd > 0 ? `+${p.gd}` : p.gd}</td>
        <td className="px-4 py-4 text-center"><span className="bg-blue-100 text-blue-700 px-2 md:px-3 py-1 rounded-lg font-black text-xs border border-blue-200">{p.pts}</span></td>
      </tr>
    );
  };

  const PlayoffMatchUI: React.FC<{ match: PlayoffMatch, mode: LeagueType }> = ({ match, mode }) => {
    const p1 = (players || []).find(p => p.id === match.player1Id), p2 = (players || []).find(p => p.id === match.player2Id);
    return (
      <div className="bg-white border border-slate-200 rounded-[2rem] p-4 w-60 shadow-lg transition-all hover:shadow-xl group">
        <div className="flex flex-col gap-3">
           <div className={`flex justify-between items-center p-3 rounded-xl border ${match.winnerId === match.player1Id ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100'}`}><span className="text-[10px] font-black truncate max-w-[100px] text-slate-800">{p1?.name || '??'}</span><span className="font-black ml-2 text-sm text-slate-800">{match.score1 ?? '-'}</span></div>
           <div className={`flex justify-between items-center p-3 rounded-xl border ${match.winnerId === match.player2Id ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100'}`}><span className="text-[10px] font-black truncate max-w-[100px] text-slate-800">{p2?.name || '??'}</span><span className="font-black ml-2 text-sm text-slate-800">{match.score2 ?? '-'}</span></div>
        </div>
        {isAdmin && p1 && p2 && (<button onClick={() => { setFixtureToUpdate({ id: match.id, league: mode, homePlayerId: match.player1Id!, awayPlayerId: match.player2Id!, homeScore: match.score1, awayScore: match.score2, completed: !!match.winnerId, date: new Date().toISOString() }); setUpdateScores({ home: match.score1?.toString() || '', away: match.score2?.toString() || '' }); }} className="mt-3 w-full text-[9px] font-black text-blue-600 hover:bg-blue-50 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all">עדכן תוצאה</button>)}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20 selection:bg-blue-600" dir="rtl">
      {/* SYSTEM HEADER FOR DIAGNOSTICS */}
      <h1 className="text-center text-4xl font-black p-4 text-white bg-blue-600 shadow-lg">SYSTEM ONLINE</h1>

      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6 shrink-0"><IFLLogo /><div className="text-right"><div className="flex items-center gap-2"><h1 className="text-3xl font-black text-slate-900 italic tracking-tighter">IFL 26</h1><span className="text-[11px] text-blue-600 font-black bg-blue-50 px-3 py-1 rounded-full border border-blue-200">נוסד 2022</span></div><p className="text-[9px] text-slate-400 uppercase tracking-[0.3em] font-black mt-1">ULTIMATE MASTER</p></div></div>
          
          <div className="flex-1 w-full max-w-lg relative" ref={searchRef}>
             <div className="relative group"><Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} /><input type="text" placeholder="חיפוש שחקן..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onFocus={() => setShowSearchResults(true)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pr-11 pl-4 text-xs font-black text-slate-900 outline-none focus:border-blue-300 focus:bg-white transition-all" /></div>
             {showSearchResults && searchQuery && (
                <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-50">
                   {(players || []).filter(p => p && p.name.includes(searchQuery)).slice(0, 5).map(p => (
                      <button key={p.id} onClick={() => { setSelectedPlayerInfo(p); setShowSearchResults(false); setSearchQuery(''); }} className="w-full flex items-center gap-4 p-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 text-right"><div className="w-8 h-8 rounded-lg bg-slate-100 overflow-hidden">{p.photoUrl ? <img src={p.photoUrl} className="w-full h-full object-cover" alt={p.name} /> : <UserIcon size={14} className="m-auto mt-2 text-slate-400" />}</div><div className="flex-1"><div className="font-black text-xs text-slate-800">{p.name}</div><div className="text-[8px] text-slate-400">{p.sonyUsername}</div></div><ChevronRight size={14} className="text-slate-300" /></button>
                   ))}
                </div>
             )}
          </div>

          <div className="flex items-center gap-3">
             <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-[9px] font-black ${isCloudConnected ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                {isCloudConnected ? <Cloud size={14} className="text-green-500" /> : <CloudOff size={14} className="text-slate-400" />}
                {isCloudConnected ? 'Cloud Online' : 'Offline Mode'}
                {isSyncing && <RefreshCcw size={10} className="animate-spin ml-1" />}
             </div>
             <button onClick={() => isAdmin ? setIsAdmin(false) : setShowPinModal(true)} className={`p-2.5 rounded-xl transition-all ${isAdmin ? 'bg-green-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>{isAdmin ? <ShieldCheck size={18} /> : <Lock size={18} />}</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        <nav className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {[
            { id: 'leagues', label: 'ליגות', icon: <LayoutGrid size={16} /> },
            { id: 'champions', label: 'ליגת האלופות', icon: <Zap size={16} /> },
            { id: 'playoffs', label: 'פלייאוף', icon: <GitBranch size={16} /> },
            { id: 'fixtures', label: 'משחקים', icon: <Calendar size={16} /> },
            { id: 'history', label: 'היסטוריה', icon: <History size={16} /> },
            { id: 'hof', label: 'היכל תהילה', icon: <Crown size={16} /> },
            ...(isAdmin ? [{ id: 'admin', label: 'ניהול', icon: <Settings size={16} /> }] : [])
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black transition-all border whitespace-nowrap ${activeTab === tab.id ? 'bg-blue-600 text-white border-blue-500 shadow-lg scale-105' : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-900'}`}>{tab.icon} {tab.label}</button>
          ))}
        </nav>

        {activeTab === 'leagues' && (
          <section className="space-y-12">
            <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
               <div className="flex items-center gap-6 text-right flex-1"><div className="bg-blue-100 p-4 rounded-3xl text-blue-600 border border-blue-200"><Newspaper size={32} /></div><div><div className="flex items-center gap-3"><h3 className="text-xl font-black mb-1 text-slate-800">סיקור הליגות</h3><span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">{currentMonth}</span></div><p className="text-slate-500 text-sm max-w-xl">{commentary || "ניתוח AI זמין..."}</p></div></div>
               <button disabled={isGeneratingCommentary} onClick={() => { setIsGeneratingCommentary(true); generateLeagueCommentary(currentMonth, premierStats, history).then(setCommentary).finally(() => setIsGeneratingCommentary(false)); }} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black text-xs shadow-lg disabled:opacity-50 transition-all shrink-0">{isGeneratingCommentary ? "מנתח..." : "עדכן סיקור AI"}</button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">{['premier', 'national'].map(l => (<div key={l} className="space-y-4"><div className="flex justify-between items-center px-4"><h2 className="text-xl font-black flex items-center gap-3 text-blue-600">{l === 'premier' ? <Award /> : <BarChart3 />} {l === 'premier' ? 'ליגת העל' : 'הליגה הלאומית'}</h2></div><div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-md overflow-x-auto no-scrollbar"><table className="w-full text-right min-w-[600px] md:min-w-0"><TableHeader /><tbody>{(l === 'premier' ? premierStats : nationalStats).map((p, i) => <TableRow key={p.id} p={p} idx={i} />)}</tbody></table></div></div>))}</div>
          </section>
        )}

        {activeTab === 'champions' && (
          <section className="space-y-10">
            <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-200 flex items-center gap-6"><div className="bg-blue-600 p-4 rounded-3xl shadow-xl"><Zap className="text-white" size={36} /></div><div className="text-right"><h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">Champions League</h2><p className="text-blue-600 font-black text-xs tracking-widest mt-1">שלב הבתים • {currentMonth}</p></div></div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">{clGroupStats.map((gs) => (<div key={gs.group.id} className="space-y-4"><div className="flex justify-between items-center px-4"><h3 className="font-black text-blue-600 flex items-center gap-2 text-sm"><Check size={14} /> {gs.group.name}</h3>{isAdmin && (<button onClick={() => { setPlayerModalTab('existing'); setShowPlayerModal({show: true, league: 'champions', groupId: gs.group.id}); }} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Plus size={14} /></button>)}</div><div className="bg-white border border-slate-200 rounded-[1.5rem] overflow-hidden shadow-sm overflow-x-auto no-scrollbar"><table className="w-full text-right text-[10px] min-w-[400px] md:min-w-0"><TableHeader /><tbody>{(gs.stats || []).map((p, idx) => <TableRow key={p.id} p={p} idx={idx} />)}</tbody></table></div></div>))}</div>
          </section>
        )}
        
        {/* Playoff View, Fixtures, etc follow same color adaptation if visible */}
        {activeTab === 'fixtures' && (
          <section className="space-y-6">
             <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-4">
                <div className="flex items-center gap-6"><h2 className="text-2xl font-black flex items-center gap-3"><Calendar className="text-blue-600" /> משחקי העונה</h2><div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">{[{ id: 'premier', label: 'ליגת על' }, { id: 'national', label: 'לאומית' }, { id: 'champions', label: "צ'מפיונס" }].map(f => <button key={f.id} onClick={() => setFixtureSubTab(f.id as LeagueType)} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${fixtureSubTab === f.id ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>{f.label}</button>)}</div></div>
                <div className="relative w-full md:w-80 group"><Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="text" placeholder="חיפוש..." value={fixtureSearchQuery} onChange={(e) => setFixtureSearchQuery(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-12 pl-4 py-3 text-xs font-black outline-none focus:bg-white" /></div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{(fixtures || []).filter(f => f.league === fixtureSubTab).map(f => {
               const p1 = (players || []).find(p => p.id === f.homePlayerId), p2 = (players || []).find(p => p.id === f.awayPlayerId);
               if (!p1 || !p2) return null;
               return (<div key={f.id} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex items-center justify-between text-slate-800">
                  <span className="font-bold text-xs">{p1.name}</span>
                  <div className="bg-slate-50 px-4 py-2 rounded-xl font-black text-lg">{f.completed ? `${f.homeScore} : ${f.awayScore}` : 'VS'}</div>
                  <span className="font-bold text-xs">{p2.name}</span>
               </div>)
             })}</div>
          </section>
        )}

        {/* Admin Login Modal */}
        {showPinModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-black/10">
             <div className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-2xl relative w-full max-w-sm text-center">
                <h2 className="text-2xl font-black mb-8 text-slate-900 italic">ADMIN ACCESS</h2>
                <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} maxLength={4} className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-6 text-center text-5xl font-black text-blue-600 mb-8 outline-none focus:border-blue-600" autoFocus />
                <button onClick={handleAdminLogin} className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black hover:bg-blue-700 active:scale-95 transition-all shadow-lg">כניסת מנהל</button>
             </div>
          </div>
        )}
      </main>

      <footer className="mt-20 border-t border-slate-100 py-16 opacity-30 text-center">
        <div className="flex flex-col items-center gap-4"><Trophy size={24} className="text-slate-400" /><p className="text-[10px] font-black uppercase tracking-[0.6em] italic text-slate-500">IFL 26 LEAGUE MASTER • EST 2022</p></div>
      </footer>
    </div>
  );
};

export default App;