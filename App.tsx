
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

        // Use process.env for environment variables instead of import.meta.env
        const apiKey = process.env.VITE_FIREBASE_API_KEY;
        const databaseURL = process.env.VITE_FIREBASE_DATABASE_URL;

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

  // Archive the current season and reset data for the next one
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
      <tr className="bg-slate-800/80 text-slate-400 text-[8px] md:text-[9px] uppercase tracking-widest font-black border-b border-white/5">
        <th className="px-2 py-4 text-center">#</th>
        <th className="px-4 py-4 text-right">שחקן</th>
        <th className="px-2 py-4 text-center">מש'</th>
        <th className="px-2 py-4 text-center text-green-400">נ'</th>
        <th className="px-2 py-4 text-center text-slate-400">ת'</th>
        <th className="px-2 py-4 text-center text-red-400">ה'</th>
        <th className="px-2 py-4 text-center text-blue-300">הפרש</th>
        <th className="px-4 py-4 text-center text-blue-400">נק'</th>
      </tr>
    </thead>
  );

  const TableRow: React.FC<{ p: PlayerStats, idx: number }> = ({ p, idx }) => {
    const playerObj = (players || []).find(px => px && px.id === p.id);
    return (
      <tr onClick={() => playerObj && setSelectedPlayerInfo(playerObj)} className="hover:bg-slate-800/30 transition-all border-b border-white/5 last:border-0 cursor-pointer">
        <td className="px-2 py-4 text-center"><span className={`w-6 h-6 md:w-7 md:h-7 inline-flex items-center justify-center rounded-lg font-black text-[10px] md:text-[11px] ${idx === 0 ? 'bg-yellow-500 text-black' : 'bg-slate-800 text-slate-500'}`}>{idx + 1}</span></td>
        <td className="px-4 py-4"><div className="flex items-center gap-2 md:gap-4 text-right truncate"><div className="w-8 h-8 rounded-xl overflow-hidden bg-slate-800 border border-white/5 shrink-0">{playerObj?.photoUrl ? <img src={playerObj.photoUrl} className="w-full h-full object-cover" alt={p.name} /> : <UserIcon size={14} className="m-auto mt-2 text-slate-600" />}</div><span className="font-black text-xs md:text-sm text-white truncate">{p.name}</span></div></td>
        <td className="px-2 py-4 text-center text-[10px] font-bold text-slate-400">{p.gp}</td>
        <td className="px-2 py-4 text-center text-[10px] font-black text-green-500/80">{p.w}</td>
        <td className="px-2 py-4 text-center text-[10px] font-bold text-slate-500">{p.d}</td>
        <td className="px-2 py-4 text-center text-[10px] font-black text-red-500/80">{p.l}</td>
        <td className="px-2 py-4 text-center text-[10px] font-black text-blue-300">{p.gd > 0 ? `+${p.gd}` : p.gd}</td>
        <td className="px-4 py-4 text-center"><span className="bg-blue-600/10 text-blue-400 px-2 md:px-3 py-1 rounded-lg font-black text-xs border border-blue-600/20">{p.pts}</span></td>
      </tr>
    );
  };

  const PlayoffMatchUI: React.FC<{ match: PlayoffMatch, mode: LeagueType }> = ({ match, mode }) => {
    const p1 = (players || []).find(p => p.id === match.player1Id), p2 = (players || []).find(p => p.id === match.player2Id);
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-4 w-60 shadow-2xl transition-all border-white/5 group text-white">
        <div className="flex flex-col gap-3">
           <div className={`flex justify-between items-center p-3 rounded-xl border border-white/5 ${match.winnerId === match.player1Id ? 'bg-blue-600/20 border-blue-500/30' : 'bg-black/30'}`}><span className="text-[10px] font-black truncate max-w-[100px]">{p1?.name || '??'}</span><span className="font-black ml-2 text-sm">{match.score1 ?? '-'}</span></div>
           <div className={`flex justify-between items-center p-3 rounded-xl border border-white/5 ${match.winnerId === match.player2Id ? 'bg-blue-600/20 border-blue-500/30' : 'bg-black/30'}`}><span className="text-[10px] font-black truncate max-w-[100px]">{p2?.name || '??'}</span><span className="font-black ml-2 text-sm">{match.score2 ?? '-'}</span></div>
        </div>
        {isAdmin && p1 && p2 && (<button onClick={() => { setFixtureToUpdate({ id: match.id, league: mode, homePlayerId: match.player1Id!, awayPlayerId: match.player2Id!, homeScore: match.score1, awayScore: match.score2, completed: !!match.winnerId, date: new Date().toISOString() }); setUpdateScores({ home: match.score1?.toString() || '', away: match.score2?.toString() || '' }); }} className="mt-3 w-full text-[9px] font-black text-blue-500 hover:bg-blue-500/10 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all">עדכן תוצאה</button>)}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white pb-20 selection:bg-blue-600" dir="rtl">
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-900/5 blur-[150px]" />
      </div>

      <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-2xl border-b border-white/5 px-8 py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6 shrink-0"><IFLLogo /><div className="text-right"><div className="flex items-center gap-2"><h1 className="text-3xl font-black text-white italic tracking-tighter">IFL 26</h1><span className="text-[11px] text-blue-500 font-black bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">נוסד 2022</span></div><p className="text-[9px] text-slate-600 uppercase tracking-[0.3em] font-black mt-1">ULTIMATE MASTER</p></div></div>
          
          <div className="flex-1 w-full max-w-lg relative" ref={searchRef}>
             <div className="relative group"><Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={16} /><input type="text" placeholder="חיפוש שחקן..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onFocus={() => setShowSearchResults(true)} className="w-full bg-slate-900/40 border border-white/5 rounded-xl py-3 pr-11 pl-4 text-xs font-black text-white outline-none focus:border-blue-500/30 transition-all" /></div>
             {showSearchResults && searchQuery && (
                <div className="absolute top-full mt-2 left-0 right-0 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                   {(players || []).filter(p => p && p.name.includes(searchQuery)).slice(0, 5).map(p => (
                      <button key={p.id} onClick={() => { setSelectedPlayerInfo(p); setShowSearchResults(false); setSearchQuery(''); }} className="w-full flex items-center gap-4 p-3 hover:bg-white/5 border-b border-white/5 last:border-0 text-right"><div className="w-8 h-8 rounded-lg bg-slate-800 overflow-hidden">{p.photoUrl ? <img src={p.photoUrl} className="w-full h-full object-cover" alt={p.name} /> : <UserIcon size={14} className="m-auto mt-2 text-slate-600" />}</div><div className="flex-1"><div className="font-black text-xs">{p.name}</div><div className="text-[8px] text-slate-500">{p.sonyUsername}</div></div><ChevronRight size={14} className="text-slate-700" /></button>
                   ))}
                </div>
             )}
          </div>

          <div className="flex items-center gap-3">
             <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-[9px] font-black ${isCloudConnected ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-slate-900 border-white/5 text-slate-500'}`}>
                {isCloudConnected ? <Cloud size={14} className="text-green-500" /> : <CloudOff size={14} className="text-red-500" />}
                {isCloudConnected ? 'Cloud Online' : 'Offline Mode'}
                {isSyncing && <RefreshCcw size={10} className="animate-spin ml-1" />}
             </div>
             <button onClick={() => isAdmin ? setIsAdmin(false) : setShowPinModal(true)} className={`p-2.5 rounded-xl transition-all ${isAdmin ? 'bg-green-600 text-white shadow-lg border border-green-400' : 'bg-slate-900 text-slate-500 border border-white/5'}`}>{isAdmin ? <ShieldCheck size={18} /> : <Lock size={18} />}</button>
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
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black transition-all border whitespace-nowrap ${activeTab === tab.id ? 'bg-blue-600 text-white border-blue-500 shadow-lg scale-105' : 'bg-slate-900/50 text-slate-500 border-white/5 hover:text-white'}`}>{tab.icon} {tab.label}</button>
          ))}
        </nav>

        {activeTab === 'leagues' && (
          <section className="space-y-12">
            <div className="bg-slate-900/40 p-8 rounded-[3rem] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
               <div className="flex items-center gap-6 text-right flex-1 z-10"><div className="bg-blue-600/10 p-4 rounded-3xl text-blue-500 border border-blue-500/20"><Newspaper size={32} /></div><div><div className="flex items-center gap-3"><h3 className="text-xl font-black mb-1">סיקור הליגות</h3><span className="text-[10px] font-black text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full border border-blue-400/20">{currentMonth}</span></div><p className="text-slate-400 text-sm max-w-xl">{commentary || "ניתוח AI זמין..."}</p></div></div>
               <button disabled={isGeneratingCommentary} onClick={() => { setIsGeneratingCommentary(true); generateLeagueCommentary(currentMonth, premierStats, history).then(setCommentary).finally(() => setIsGeneratingCommentary(false)); }} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black text-xs shadow-xl disabled:opacity-50 transition-all active:scale-95 shrink-0 z-10">{isGeneratingCommentary ? "מנתח..." : "עדכן סיקור AI"}</button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">{['premier', 'national'].map(l => (<div key={l} className="space-y-4"><div className="flex justify-between items-center px-4"><h2 className="text-xl font-black flex items-center gap-3 text-blue-500">{l === 'premier' ? <Award /> : <BarChart3 />} {l === 'premier' ? 'ליגת העל' : 'הליגה הלאומית'}</h2></div><div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] overflow-x-auto shadow-2xl no-scrollbar"><table className="w-full text-right min-w-[600px] md:min-w-0"><TableHeader /><tbody>{(l === 'premier' ? premierStats : nationalStats).map((p, i) => <TableRow key={p.id} p={p} idx={i} />)}</tbody></table></div></div>))}</div>
          </section>
        )}

        {activeTab === 'champions' && (
          <section className="space-y-10">
            <div className="bg-gradient-to-r from-blue-900/20 to-transparent p-10 rounded-[3rem] border border-blue-500/10 flex items-center gap-6"><div className="bg-blue-600 p-4 rounded-3xl shadow-2xl"><Zap className="text-white" size={36} /></div><div className="text-right"><h2 className="text-3xl font-black italic uppercase tracking-tighter">Champions League</h2><p className="text-blue-400 font-black text-xs tracking-widest mt-1">שלב הבתים • {currentMonth}</p></div></div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">{clGroupStats.map((gs) => (<div key={gs.group.id} className="space-y-4"><div className="flex justify-between items-center px-4"><h3 className="font-black text-blue-500 flex items-center gap-2 text-sm"><Check size={14} /> {gs.group.name}</h3>{isAdmin && (<button onClick={() => { setPlayerModalTab('existing'); setShowPlayerModal({show: true, league: 'champions', groupId: gs.group.id}); }} className="p-1.5 bg-blue-600/10 text-blue-500 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Plus size={14} /></button>)}</div><div className="bg-slate-900/40 border border-white/5 rounded-[1.5rem] overflow-x-auto shadow-lg no-scrollbar"><table className="w-full text-right text-[10px] min-w-[400px] md:min-w-0"><TableHeader /><tbody>{(gs.stats || []).map((p, idx) => <TableRow key={p.id} p={p} idx={idx} />)}</tbody></table></div></div>))}</div>
          </section>
        )}

        {activeTab === 'playoffs' && (
          <section className="space-y-12">
            <div className="flex justify-center bg-slate-900/50 p-2 rounded-2xl border border-white/5 w-fit mx-auto gap-2">{['premier', 'national'].map(m => (<button key={m} onClick={() => setPlayoffViewMode(m as LeagueType)} className={`px-8 py-3 rounded-xl text-[10px] font-black transition-all ${playoffViewMode === m ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>{m === 'premier' ? 'ליגת העל' : 'הליגה הלאומית'}</button>))}</div>
            {((playoffs && (playoffs as any)[playoffViewMode]) || []).length === 0 ? (<div className="py-32 text-center bg-slate-900/20 border border-white/5 rounded-[4rem] flex flex-col items-center gap-6"><GitBranch size={64} className="text-slate-800" /><h3 className="text-2xl font-black text-slate-500">שלב הפלייאוף טרם הופעל</h3>{isAdmin && <button onClick={() => startLeaguePlayoffs(playoffViewMode)} className="bg-blue-600 text-white px-12 py-5 rounded-2xl font-black shadow-2xl active:scale-95 transition-all">צור שלב נוקאאוט (8 שחקנים)</button>}</div>) : (
               <div className="flex flex-row justify-between items-start py-10 gap-8 max-w-full mx-auto overflow-x-auto pb-10 px-4 min-h-[600px] no-scrollbar">
                  <div className="flex flex-col gap-6 items-center shrink-0 pt-4"><span className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/20 mb-4">רבע גמר</span>{((playoffs as any)[playoffViewMode] || []).filter((m: any) => m.round === 'quarter').map((m: any) => <PlayoffMatchUI key={m.id} match={m} mode={playoffViewMode} />)}</div>
                  <div className="flex flex-col gap-12 items-center justify-around shrink-0 pt-20"><span className="text-[10px] font-black text-purple-400 uppercase tracking-widest bg-purple-500/10 px-4 py-1.5 rounded-full border border-purple-500/20 mb-4">חצי גמר</span>{((playoffs as any)[playoffViewMode] || []).filter((m: any) => m.round === 'semi').map((m: any) => <PlayoffMatchUI key={m.id} match={m} mode={playoffViewMode} />)}</div>
                  <div className="flex flex-col gap-12 items-center justify-center shrink-0 pt-40 scale-110"><span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest bg-yellow-500/10 px-4 py-1.5 rounded-full border border-yellow-500/20 mb-8 animate-pulse">הגמר הגדול</span>{(() => { const final = ((playoffs as any)[playoffViewMode] || []).find((m: any) => m.round === 'final'); return final ? <PlayoffMatchUI match={final} mode={playoffViewMode} /> : null; })()}</div>
               </div>
            )}
          </section>
        )}

        {activeTab === 'fixtures' && (
          <section className="space-y-6">
             <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-4">
                <div className="flex items-center gap-6"><h2 className="text-2xl font-black flex items-center gap-3"><Calendar className="text-blue-500" /> משחקי העונה</h2><div className="flex bg-slate-900 p-1 rounded-xl border border-white/5">{[{ id: 'premier', label: 'ליגת על' }, { id: 'national', label: 'לאומית' }, { id: 'champions', label: "צ'מפיונס" }].map(f => <button key={f.id} onClick={() => setFixtureSubTab(f.id as LeagueType)} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${fixtureSubTab === f.id ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>{f.label}</button>)}</div></div>
                <div className="relative w-full md:w-80 group"><Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={16} /><input type="text" placeholder="חיפוש לפי שחקן..." value={fixtureSearchQuery} onChange={(e) => setFixtureSearchQuery(e.target.value)} className="w-full bg-slate-900 border border-white/5 rounded-xl pr-12 pl-4 py-3 text-xs font-black outline-none focus:border-blue-500/30 transition-all text-white" /></div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{(fixtures || []).filter(f => { if (!f || f.league !== fixtureSubTab) return false; const p1 = (players || []).find(p => p.id === f.homePlayerId), p2 = (players || []).find(p => p.id === f.awayPlayerId); const q = fixtureSearchQuery.toLowerCase(); return !q || p1?.name.toLowerCase().includes(q) || p2?.name.toLowerCase().includes(q); }).sort((a,b) => Number(a.completed) - Number(b.completed)).map(f => { const p1 = (players || []).find(p => p.id === f.homePlayerId), p2 = (players || []).find(p => p.id === f.awayPlayerId); if(!p1 || !p2) return null; return (<button key={f.id} disabled={!isAdmin} onClick={() => { setFixtureToUpdate(f); setUpdateScores({ home: f.homeScore?.toString() || '', away: f.awayScore?.toString() || '' }); }} className={`bg-slate-900/50 border ${f.completed ? 'border-green-500/10' : 'border-white/5'} p-6 rounded-[2rem] transition-all hover:bg-slate-900 relative text-right w-full block group`}><div className="flex justify-between text-[8px] font-black text-slate-500 uppercase tracking-widest mb-6"><span>{f.league === 'champions' ? `בית ${f.groupId}` : f.league === 'premier' ? 'ליגת על' : 'לאומית'}</span><span>{new Date(f.date).toLocaleDateString('he-IL')}</span></div><div className="flex items-center justify-between gap-4"><div className="flex-1 flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-slate-800 shrink-0 shadow-lg overflow-hidden">{p1.photoUrl ? <img src={p1.photoUrl} className="w-full h-full object-cover" alt={p1.name} /> : <UserIcon size={14} className="m-auto mt-3 text-slate-600" />}</div><span className="font-black text-xs truncate max-w-[80px] text-right text-white">{p1.name}</span></div><div className="bg-black/40 px-4 py-3 rounded-2xl border border-white/5 shrink-0 flex items-center gap-4 shadow-inner">{f.completed ? <><span className="text-lg font-black text-white">{f.homeScore}</span><span className="text-slate-700">:</span><span className="text-lg font-black text-white">{f.awayScore}</span></> : isAdmin ? <span className="text-[10px] font-black text-blue-500 px-4 group-hover:scale-110 transition-transform">עדכן תוצאה</span> : <span className="text-[10px] font-black text-slate-700 tracking-[0.2em]">VS</span>}</div><div className="flex-1 flex items-center gap-4 justify-end text-left"><span className="font-black text-xs truncate max-w-[80px] text-left text-white">{p2.name}</span><div className="w-10 h-10 rounded-xl bg-slate-800 shrink-0 shadow-lg overflow-hidden">{p2.photoUrl ? <img src={p2.photoUrl} className="w-full h-full object-cover" alt={p2.name} /> : <UserIcon size={14} className="m-auto mt-3 text-slate-600" />}</div></div></div></button>);})}</div>
          </section>
        )}

        {activeTab === 'history' && (
          <section className="space-y-8">
            <div className="flex items-center gap-4 px-4"><History className="text-blue-500" size={32}/><h2 className="text-3xl font-black italic">היסטוריית הליגה</h2></div>
            {(history || []).length === 0 ? (<div className="py-32 text-center bg-slate-900/20 border border-white/5 rounded-[4rem] flex flex-col items-center gap-6 text-slate-500 font-black italic"><History size={64}/><p>טרם הסתיימו עונות במערכת</p></div>) : (
              <div className="grid grid-cols-1 gap-6">{[...history].reverse().map((s) => (<div key={s.id} className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl transition-all relative"><button onClick={() => setExpandedHistoryId(expandedHistoryId === s.id ? null : s.id)} className="w-full flex items-center justify-between p-8 text-right hover:bg-white/5 transition-colors"><div className="flex items-center gap-6"><div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-600/20"><History className="text-white" size={24}/></div><div><h3 className="text-2xl font-black">{s.seasonName}</h3><div className="flex flex-wrap items-center gap-4 mt-2">{s.premierWinner && <span className="text-[10px] font-black text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20 uppercase tracking-widest flex items-center gap-1"><Trophy size={10}/> אלוף העל: {s.premierWinner}</span>}{s.championsWinner && <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 uppercase tracking-widest flex items-center gap-1"><Zap size={10}/> אלוף הצ'מפיונס: {s.championsWinner}</span>}<span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">{new Date(s.timestamp).toLocaleDateString('he-IL')}</span></div></div></div><div className="flex items-center gap-4">{isAdmin && (<button onClick={(e) => { e.stopPropagation(); setHistoryToDelete(s); }} className="p-2 text-slate-600 hover:text-red-500 transition-colors"><Trash2 size={20} /></button>)}<ChevronDown size={24} className={`text-slate-500 transition-transform ${expandedHistoryId === s.id ? 'rotate-180' : ''}`}/></div></button>{expandedHistoryId === s.id && (<div className="p-8 border-t border-white/5 bg-black/20 animate-in slide-in-from-top duration-300"><div className="grid grid-cols-1 lg:grid-cols-2 gap-8"><div><h4 className="font-black text-blue-500 mb-4 flex items-center gap-2"><Award size={16}/> טבלת ליגת העל</h4><div className="bg-slate-950/50 rounded-2xl overflow-hidden border border-white/5 shadow-inner"><table className="w-full text-right"><TableHeader /><tbody>{(s.premierTable || []).map((p, idx) => <TableRow key={p.id} p={p} idx={idx} />)}</tbody></table></div></div><div><h4 className="font-black text-slate-400 mb-4 flex items-center gap-2"><BarChart3 size={16}/> טבלת הליגה הלאומית</h4><div className="bg-slate-950/50 rounded-2xl overflow-hidden border border-white/5 shadow-inner"><table className="w-full text-right"><TableHeader /><tbody>{(s.nationalTable || []).map((p, idx) => <TableRow key={p.id} p={p} idx={idx} />)}</tbody></table></div></div></div></div>)}</div>))}</div>
            )}
          </section>
        )}

        {activeTab === 'hof' && (
          <section className="space-y-10">
             <div className="flex justify-between items-center px-4"><h2 className="text-3xl font-black flex items-center gap-4 text-yellow-500 italic"><Crown size={32} /> היכל התהילה</h2>{isAdmin && <button onClick={() => setShowHOFModal(true)} className="bg-yellow-600 text-black px-8 py-3.5 rounded-2xl font-black text-xs shadow-xl active:scale-95 transition-all">אגדה חדשה</button>}</div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">{(hallOfFame || []).map(e => (<div key={e.id} className="bg-slate-900/60 border border-yellow-500/20 p-10 rounded-[3rem] relative group overflow-hidden"><div className="flex items-center gap-8"><div className="bg-yellow-500/10 p-5 rounded-[1.5rem] text-yellow-500 border border-yellow-500/20 shadow-inner group-hover:rotate-12 transition-transform duration-500"><Trophy size={48} /></div><div className="text-right flex-1"><h3 className="text-3xl font-black text-white">{e.playerName}</h3><p className="text-yellow-500 font-black text-xs uppercase tracking-widest mt-1 italic">{e.achievement}</p><div className="flex items-center gap-2 text-slate-600 font-black text-[9px] uppercase mt-3 bg-white/5 px-3 py-1 rounded-full w-fit mr-auto"><Calendar size={12}/> {e.season}</div></div></div>{isAdmin && <button onClick={() => setHallOfFame(prev => (prev || []).filter(x => x.id !== e.id))} className="absolute top-8 left-8 text-slate-700 hover:text-red-500 transition-colors"><Trash2 size={20} /></button>}</div>))}</div>
          </section>
        )}

        {activeTab === 'admin' && isAdmin && (
          <section className="space-y-10 pb-10">
             <div className="bg-slate-900/60 p-10 rounded-[3rem] border border-white/5 space-y-8 shadow-2xl">
                <h3 className="text-xl font-black flex items-center gap-4 text-red-500 flex-row-reverse"><RefreshCcw size={28} /> ניהול עונה</h3>
                <button onClick={() => setShowArchiveModal(true)} className="w-full bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white p-6 rounded-[2rem] border border-red-500/20 font-black text-sm transition-all active:scale-95 flex flex-col items-center gap-2"><span>סגור עונה וארכב</span><span className="text-[10px] opacity-70">שומר היסטוריה ומאפס את הטבלאות</span></button>
             </div>

             <div className="bg-slate-900/60 p-10 rounded-[3rem] border border-white/5 space-y-8 shadow-2xl">
                <h3 className="text-xl font-black flex items-center gap-4 text-blue-500 flex-row-reverse"><UserPlus size={28} /> הוספת שחקנים לליגות</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                   <button onClick={() => { setPlayerModalTab('new'); setShowPlayerModal({show: true, league: 'premier'}); }} className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 p-8 rounded-[2rem] border border-blue-500/20 font-black text-sm flex flex-col items-center gap-4 transition-all active:scale-95"><Award size={32} /> <span>ליגת העל</span></button>
                   <button onClick={() => { setPlayerModalTab('new'); setShowPlayerModal({show: true, league: 'national'}); }} className="bg-slate-800/50 hover:bg-slate-800 text-slate-400 p-8 rounded-[2rem] border border-white/5 font-black text-sm flex flex-col items-center gap-4 transition-all active:scale-95"><BarChart3 size={32} /> <span>הלאומית</span></button>
                   <div className="grid grid-cols-2 gap-2">
                      {(clGroups || []).map((group) => (<button key={group.id} onClick={() => { setPlayerModalTab('new'); setShowPlayerModal({show: true, league: 'champions', groupId: group.id}); }} className="bg-blue-400/5 hover:bg-blue-400/10 text-blue-400 p-4 rounded-[1.5rem] border border-white/5 font-black text-[10px] flex flex-col items-center gap-1 transition-all active:scale-95"><Zap size={16} /><span>{group.name}</span></button>))}
                   </div>
                </div>
             </div>

             <div className="bg-slate-900/60 p-10 rounded-[3rem] border border-white/5 space-y-8 shadow-2xl">
                <div className="flex flex-col md:flex-row-reverse justify-between items-center gap-4"><div className="text-right"><h3 className="text-xl font-black flex items-center gap-4 text-orange-500 flex-row-reverse"><Users size={28} /> ניהול שחקנים וליגות</h3></div><div className="relative w-full md:w-64"><Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} /><input type="text" placeholder="חיפוש שחקן..." value={adminSearchQuery} onChange={(e) => setAdminSearchQuery(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pr-10 pl-4 text-xs font-black outline-none focus:border-orange-500/50 text-white" /></div></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{(players || []).filter(p => !adminSearchQuery || p.name.includes(adminSearchQuery)).map(p => (<div key={p.id} className="flex flex-col bg-black/40 rounded-2xl border border-white/5 overflow-hidden shadow-lg group"><div className="flex items-center gap-4 p-5"><div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-white/5 shadow-md group-hover:scale-105 transition-transform">{p.photoUrl ? <img src={p.photoUrl} className="w-full h-full object-cover" alt={p.name} /> : <UserIcon size={20} className="m-auto mt-3 text-slate-600" />}</div><div className="flex-1 overflow-hidden text-right"><div className="font-black text-sm text-white">{p.name}</div><div className="text-[10px] text-slate-500 font-bold">{p.sonyUsername}</div></div><button onClick={() => setPlayerToDelete(p)} className="p-2 bg-red-600/10 rounded-lg hover:bg-red-600 hover:text-white transition-all text-red-600 shadow-sm"><Trash2 size={16} /></button></div><div className="px-5 pb-5 flex flex-wrap gap-2 justify-end">{(premierPlayerIds || []).includes(p.id) && (<button onClick={() => setPlayerToRemoveFromLeague({player: p, league: 'premier'})} className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-600/10 border border-blue-500/20 rounded-full text-[9px] font-black text-blue-500 hover:bg-red-600 hover:text-white hover:border-red-500 transition-all"><Award size={10} /> ליגת על <X size={10} /></button>)}{(nationalPlayerIds || []).includes(p.id) && (<button onClick={() => setPlayerToRemoveFromLeague({player: p, league: 'national'})} className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 border border-white/10 rounded-full text-[9px] font-black text-slate-400 hover:bg-red-600 hover:text-white hover:border-red-500 transition-all"><BarChart3 size={10} /> לאומית <X size={10} /></button>)}{(clGroups || []).map(group => (group.playerIds || []).includes(p.id) && (<button key={group.id} onClick={() => setPlayerToRemoveFromLeague({player: p, league: 'champions', groupId: group.id})} className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-400/10 border border-blue-500/20 rounded-full text-[9px] font-black text-blue-400 hover:bg-red-600 hover:text-white hover:border-red-500 transition-all"><Zap size={10} /> {group.name} <X size={10} /></button>))}</div></div>))}</div>
             </div>
          </section>
        )}
      </main>

      {/* MODALS */}
      {selectedPlayerInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md">
           <div className="absolute inset-0 bg-black/80" onClick={() => setSelectedPlayerInfo(null)} />
           <div className="relative w-full max-w-lg animate-in zoom-in-95 duration-300">
              <div className="bg-slate-900 border border-blue-500/30 p-1 rounded-[3rem] shadow-2xl overflow-hidden">
                 <div className="bg-slate-900 rounded-[2.8rem] p-8 flex flex-col items-center relative">
                    <button onClick={() => setSelectedPlayerInfo(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X size={20} /></button>
                    <div className="flex flex-col items-center gap-4 mb-8">
                       <div className="w-24 h-24 rounded-[2rem] overflow-hidden border-2 border-slate-800 bg-slate-800 shadow-xl">{selectedPlayerInfo.photoUrl ? <img src={selectedPlayerInfo.photoUrl} className="w-full h-full object-cover" alt={selectedPlayerInfo.name} /> : <UserIcon size={32} className="m-auto mt-7 text-slate-700" />}</div>
                       <div className="text-center">
                          <h3 className="text-2xl font-black text-white italic tracking-tighter mb-1">{selectedPlayerInfo.name}</h3>
                          <div className="flex items-center justify-center gap-2"><span className="text-[9px] text-blue-500 font-black uppercase tracking-widest bg-blue-500/5 px-3 py-1 rounded-full border border-blue-500/10">{selectedPlayerInfo.sonyUsername}</span></div>
                          <div className="flex items-center justify-center gap-1.5 mt-4">
                             {getPlayerCareerStats(selectedPlayerInfo.id).streak.map((res, i) => (<div key={i} className={`w-4 h-4 rounded-full ${res === 'W' ? 'bg-green-500 shadow-glow shadow-green-500/40' : res === 'L' ? 'bg-red-500 shadow-glow shadow-red-500/40' : 'bg-slate-500'} flex items-center justify-center text-[7px] font-black text-white`}>{res}</div>))}
                          </div>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 w-full">
                       {(() => { 
                         const career = getPlayerCareerStats(selectedPlayerInfo.id); 
                         return [{ label: 'משחקים', val: career.gp, icon: <Swords size={16} />, color: 'text-slate-400' }, { label: 'ניצחונות', val: career.w, icon: <Flame size={16} />, color: 'text-green-500' }, { label: 'תארים', val: career.titles, icon: <Trophy size={16} />, color: 'text-yellow-600' }, { label: 'עונות פעיל', val: career.activeSeasons, icon: <Calendar size={16} />, color: 'text-blue-500' }].map((stat, i) => (<div key={i} className="bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col items-center gap-1"><div className={`${stat.color} mb-1 opacity-70`}>{stat.icon}</div><span className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none">{stat.label}</span><span className="text-xl font-black text-white leading-tight">{stat.val}</span></div>));
                       })()}
                    </div>
                    {isAdmin && (<button onClick={() => { setShowPlayerModal({show: true, player: selectedPlayerInfo}); setSelectedPlayerInfo(null); }} className="w-full mt-6 py-4 bg-slate-800 rounded-2xl hover:bg-blue-600 transition-all font-black text-[10px] text-white flex items-center justify-center gap-2"><Edit2 size={14}/> עריכת פרטי שחקן</button>)}
                 </div>
              </div>
           </div>
        </div>
      )}

      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md">
           <div className="absolute inset-0 bg-black/80" onClick={() => setShowPinModal(false)} />
           <div className="bg-slate-900 p-12 rounded-[4rem] border border-white/10 shadow-2xl relative w-full max-sm text-center animate-in zoom-in-95 duration-300">
              <h2 className="text-2xl font-black mb-8 text-white tracking-tighter italic text-center w-full">ADMIN ACCESS</h2>
              <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} maxLength={4} className="w-full bg-black border border-white/5 rounded-3xl py-6 text-center text-5xl font-black text-blue-500 mb-8 outline-none focus:border-blue-600" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()} />
              <button onClick={handleAdminLogin} className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black active:scale-95 transition-all shadow-xl">כניסת מנהל</button>
           </div>
        </div>
      )}

      {showPlayerModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md">
           <div className="absolute inset-0 bg-black/80" onClick={() => setShowPlayerModal({show: false})} />
           <div className="bg-slate-900 border border-white/10 p-1 rounded-[3rem] shadow-2xl relative w-full max-md animate-in zoom-in-95 duration-300 overflow-hidden">
              <div className="bg-slate-950 p-10 space-y-6 text-right">
                <div className="flex justify-between items-center"><h2 className="text-2xl font-black flex items-center gap-4 text-white"><UserPlus className="text-blue-500" size={28} /> {showPlayerModal.player ? 'עריכת שחקן' : 'הוספת שחקן'}</h2><button onClick={() => setShowPlayerModal({show: false})} className="text-slate-500 hover:text-white"><X size={24}/></button></div>
                {!showPlayerModal.player && (<div className="flex bg-black/40 p-1 rounded-2xl border border-white/5"><button onClick={() => setPlayerModalTab('new')} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${playerModalTab === 'new' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>שחקן חדש</button><button onClick={() => setPlayerModalTab('existing')} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${playerModalTab === 'existing' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>קיים במערכת</button></div>)}
                {playerModalTab === 'new' || showPlayerModal.player ? (
                  <div className="space-y-5">
                    <div className="flex flex-col items-center gap-4 mb-4"><label className="w-20 h-20 rounded-[1.5rem] bg-black/50 border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 transition-all overflow-hidden relative">{(tempUploadedPhoto || showPlayerModal.player?.photoUrl) ? <img src={tempUploadedPhoto || showPlayerModal.player?.photoUrl} className="w-full h-full object-cover" alt="temp" /> : <Plus className="text-slate-600" size={20} />}<input type="file" className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if(f) { const r = new FileReader(); r.onloadend = () => setTempUploadedPhoto(r.result as string); r.readAsDataURL(f); } }} /></label></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 mr-2 uppercase">Full Name</label><input id="p-name" autoFocus placeholder="שם מלא" defaultValue={showPlayerModal.player?.name} className="w-full bg-black/50 border border-white/5 rounded-2xl p-5 font-black text-white text-right outline-none focus:border-blue-500" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 mr-2 uppercase">Playstation ID</label><input id="p-sony" placeholder="PSN ID" defaultValue={showPlayerModal.player?.sonyUsername} className="w-full bg-black/50 border border-white/5 rounded-2xl p-5 font-black text-white text-right outline-none focus:border-blue-500" /></div>
                    <button onClick={() => { const n = (document.getElementById('p-name') as HTMLInputElement).value, s = (document.getElementById('p-sony') as HTMLInputElement).value; if(n) savePlayer({ name: n, sonyUsername: s, photoUrl: tempUploadedPhoto || showPlayerModal.player?.photoUrl || '' }, showPlayerModal.league, showPlayerModal.groupId); }} className="w-full bg-blue-600 text-white font-black py-5 rounded-[2rem] active:scale-95 transition-all shadow-xl mt-4">שמירה</button>
                  </div>
                ) : (
                  <div className="space-y-5 text-right">
                    <div className="relative group"><Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={16} /><input type="text" placeholder="חפש שחקן קיים..." value={existingPlayerSearch} onChange={(e) => setExistingPlayerSearch(e.target.value)} className="w-full bg-black/50 border border-white/5 rounded-2xl py-4 pr-11 pl-4 text-xs font-black text-white outline-none focus:border-blue-500/30 transition-all text-right" /></div>
                    <div className="max-h-64 overflow-y-auto no-scrollbar space-y-2">{(players || []).filter(p => !existingPlayerSearch || p.name.includes(existingPlayerSearch)).map(p => (<button key={p.id} onClick={() => addExistingPlayerToLeague(p.id, showPlayerModal.league!, showPlayerModal.groupId)} className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all text-right group"><div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-800 shrink-0 shadow-lg">{p.photoUrl ? <img src={p.photoUrl} className="w-full h-full object-cover" alt={p.name} /> : <UserIcon size={14} className="m-auto mt-3 text-slate-600" />}</div><div className="flex-1"><div className="font-black text-xs text-white group-hover:text-blue-400 transition-colors">{p.name}</div><div className="text-[9px] text-slate-500 font-bold">{p.sonyUsername}</div></div><div className="p-2 bg-blue-600/10 text-blue-500 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all"><UserCheck size={16} /></div></button>))}</div>
                  </div>
                )}
              </div>
           </div>
        </div>
      )}

      {fixtureToUpdate && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 backdrop-blur-xl">
           <div className="absolute inset-0 bg-black/80" onClick={() => setFixtureToUpdate(null)} />
           <div className="relative w-full max-md animate-in zoom-in-95 duration-300">
              <div className="bg-slate-900 border border-blue-500/40 p-1 rounded-[3.5rem] shadow-2xl overflow-hidden">
                 <div className="bg-slate-950 rounded-[3.2rem] p-10 flex flex-col items-center">
                    <button onClick={() => setFixtureToUpdate(null)} className="absolute top-8 right-8 text-slate-500 hover:text-white"><X size={24} /></button>
                    <h3 className="text-2xl font-black mb-8 text-white italic tracking-tighter">עדכון תוצאת משחק</h3>
                    <div className="flex items-center justify-center gap-6 w-full mb-10">
                       <div className="flex flex-col items-center gap-3 flex-1">
                          <div className="w-16 h-16 rounded-2xl bg-slate-800 overflow-hidden border border-white/5">
                             {(players || []).find(p => p.id === fixtureToUpdate.homePlayerId)?.photoUrl ? <img src={(players || []).find(p => p.id === fixtureToUpdate.homePlayerId)?.photoUrl} className="w-full h-full object-cover" alt="home" /> : <UserIcon className="m-auto mt-4 text-slate-600" />}
                          </div>
                          <input type="number" value={updateScores.home} onChange={(e) => setUpdateScores(prev => ({ ...prev, home: e.target.value }))} className="w-20 bg-slate-900 border border-blue-500/30 rounded-2xl py-4 text-center text-3xl font-black text-white outline-none" placeholder="0" />
                       </div>
                       <div className="text-2xl font-black text-slate-700 mt-12">:</div>
                       <div className="flex flex-col items-center gap-3 flex-1">
                          <div className="w-16 h-16 rounded-2xl bg-slate-800 overflow-hidden border border-white/5">
                             {(players || []).find(p => p.id === fixtureToUpdate.awayPlayerId)?.photoUrl ? <img src={(players || []).find(p => p.id === fixtureToUpdate.awayPlayerId)?.photoUrl} className="w-full h-full object-cover" alt="away" /> : <UserIcon className="m-auto mt-4 text-slate-600" />}
                          </div>
                          <input type="number" value={updateScores.away} onChange={(e) => setUpdateScores(prev => ({ ...prev, away: e.target.value }))} className="w-20 bg-slate-900 border border-blue-500/30 rounded-2xl py-4 text-center text-3xl font-black text-white outline-none" placeholder="0" />
                       </div>
                    </div>
                    <button onClick={() => {
                        const h = parseInt(updateScores.home), a = parseInt(updateScores.away);
                        if (!isNaN(h) && !isNaN(a)) {
                          setFixtures(prev => (prev || []).map(f => f.id === fixtureToUpdate.id ? { ...f, homeScore: h, awayScore: a, completed: true } : f));
                          setFixtureToUpdate(null);
                        }
                    }} className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"><Save size={18} />שמור תוצאה</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {showArchiveModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 backdrop-blur-2xl">
           <div className="absolute inset-0 bg-black/90" onClick={() => setShowArchiveModal(false)} />
           <div className="relative w-full max-w-sm animate-in zoom-in-95 duration-300">
              <div className="bg-slate-900 border border-blue-500/40 p-1 rounded-[3.5rem] shadow-2xl overflow-hidden">
                 <div className="bg-slate-950 rounded-[3.2rem] p-12 flex flex-col items-center text-center space-y-6">
                    <div className="w-20 h-20 rounded-full bg-blue-600/10 flex items-center justify-center border border-blue-500/20"><RefreshCcw className="text-blue-500" size={36} /></div>
                    <div className="text-right w-full"><h3 className="text-2xl font-black text-white italic">סגירת עונה {currentMonth}</h3><p className="text-slate-400 text-xs font-bold mt-2">הטבלאות והזוכים יישמרו בהיסטוריה. אנא בחר שם לעונה הבאה:</p></div>
                    <input id="new-season-name" placeholder="שם העונה הבאה" className="w-full bg-slate-900 border border-white/5 rounded-2xl p-5 font-black text-white text-right outline-none focus:border-blue-500" autoFocus />
                    <div className="flex flex-col gap-3 w-full">
                       <button onClick={() => { 
                          const val = (document.getElementById('new-season-name') as HTMLInputElement).value; 
                          if(val) archiveSeason(val); 
                          else alert('נא להזין שם עונה'); 
                       }} className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xs shadow-xl active:scale-95">סגור עונה ופתח חדשה</button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      <footer className="mt-20 border-t border-white/5 py-16 opacity-20 text-center">
        <div className="flex flex-col items-center gap-4"><Trophy size={24} /><p className="text-[10px] font-black uppercase tracking-[0.6em] italic">IFL 26 LEAGUE MASTER • EST 2022</p></div>
      </footer>
    </div>
  );
};

export default App;
