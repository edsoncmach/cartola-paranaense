'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function SumulaEletronica() {
    const [matches, setMatches] = useState<any[]>([])
    const [selectedMatch, setSelectedMatch] = useState<any>(null)
    const [score, setScore] = useState({ home: 0, away: 0 })
    const [stats, setStats] = useState<any>({})
    const [homePlayers, setHomePlayers] = useState<any[]>([])
    const [awayPlayers, setAwayPlayers] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    // 1. Carregar partidas
    useEffect(() => {
        async function fetchMatches() {
            const { data } = await supabase
                .from('matches')
                .select(`
          id, home_score, away_score,
          home_team:clubs!matches_home_team_id_fkey(id, name, shield_url),
          away_team:clubs!matches_away_team_id_fkey(id, name, shield_url)
        `)
                .order('match_date', { ascending: false })
            if (data) setMatches(data)
        }
        fetchMatches()
    }, [])

    // 2. Ao selecionar partida
    useEffect(() => {
        if (!selectedMatch) return
        setScore({ home: selectedMatch.home_score || 0, away: selectedMatch.away_score || 0 })
        setStats({})

        async function fetchSquads() {
            const { data: home } = await supabase.from('players').select('*').eq('club_id', selectedMatch.home_team.id).order('position')
            const { data: away } = await supabase.from('players').select('*').eq('club_id', selectedMatch.away_team.id).order('position')
            if (home) setHomePlayers(home)
            if (away) setAwayPlayers(away)
        }
        fetchSquads()
    }, [selectedMatch])

    function updateStat(playerId: string, field: string, value: number) {
        setStats((prev: any) => ({
            ...prev,
            [playerId]: { ...prev[playerId], [field]: value }
        }))
    }

    // Atalho: Marca "Jogou" automaticamente se o cara fez gol, assist ou levou cartão
    function autoCheckPlayed(playerId: string) {
        if (!stats[playerId]?.played) {
            updateStat(playerId, 'played', 1)
        }
    }

    async function handleSave() {
        if (!confirm('Confirmar súmula?')) return
        setLoading(true)

        const statsArray = Object.keys(stats).map(playerId => ({
            player_id: playerId,
            played: stats[playerId]?.played || 0, // NOVO CAMPO
            goals: stats[playerId]?.goals || 0,
            assists: stats[playerId]?.assists || 0,
            yellow: stats[playerId]?.yellow || 0,
            red: stats[playerId]?.red || 0
        }))

        const { error } = await supabase.rpc('process_match_scouts', {
            p_match_id: selectedMatch.id,
            p_home_score: Number(score.home),
            p_away_score: Number(score.away),
            p_player_stats: statsArray
        })

        setLoading(false)

        if (error) alert('Erro: ' + error.message)
        else {
            alert('Súmula processada! ✅')
            setSelectedMatch(null)
            window.location.reload()
        }
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6 pb-20">
            <h1 className="text-3xl font-bold mb-8 text-center text-green-400">Súmula Eletrônica 📝</h1>

            {!selectedMatch && (
                <div className="max-w-3xl mx-auto space-y-4">
                    {matches.map(match => (
                        <button key={match.id} onClick={() => setSelectedMatch(match)} className="w-full bg-gray-800 p-4 rounded-lg flex justify-between items-center border border-gray-700 hover:bg-gray-700">
                            <div className="flex items-center gap-3 w-1/3">
                                <img src={match.home_team.shield_url} className="w-8 h-8 object-contain" />
                                <span className="font-bold truncate">{match.home_team.name}</span>
                            </div>
                            <div className="font-mono text-xl bg-black/30 px-3 py-1 rounded">{match.home_score ?? '-'} x {match.away_score ?? '-'}</div>
                            <div className="flex items-center gap-3 w-1/3 justify-end">
                                <span className="font-bold truncate">{match.away_team.name}</span>
                                <img src={match.away_team.shield_url} className="w-8 h-8 object-contain" />
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {selectedMatch && (
                <div className="max-w-6xl mx-auto">
                    <button onClick={() => setSelectedMatch(null)} className="mb-4 text-gray-400">← Voltar</button>

                    <div className="bg-gray-800 p-6 rounded-lg mb-6 flex justify-center items-center gap-8 border border-gray-700">
                        <div className="text-center"><h2 className="font-bold text-xl">{selectedMatch.home_team.name}</h2></div>
                        <div className="flex gap-4">
                            <input type="number" className="w-16 h-16 text-center text-3xl bg-gray-900 border border-gray-600 rounded text-white" value={score.home} onChange={e => setScore({ ...score, home: Number(e.target.value) })} />
                            <span className="text-4xl text-gray-500">X</span>
                            <input type="number" className="w-16 h-16 text-center text-3xl bg-gray-900 border border-gray-600 rounded text-white" value={score.away} onChange={e => setScore({ ...score, away: Number(e.target.value) })} />
                        </div>
                        <div className="text-center"><h2 className="font-bold text-xl">{selectedMatch.away_team.name}</h2></div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <TeamTable players={homePlayers} stats={stats} onStatChange={updateStat} onAutoCheck={autoCheckPlayed} color="text-green-400" title={selectedMatch.home_team.name} />
                        <TeamTable players={awayPlayers} stats={stats} onStatChange={updateStat} onAutoCheck={autoCheckPlayed} color="text-blue-400" title={selectedMatch.away_team.name} />
                    </div>

                    <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50">
                        <button onClick={handleSave} disabled={loading} className="bg-green-600 text-white font-bold py-4 px-12 rounded-full shadow-2xl hover:bg-green-500 border-2 border-white/20">
                            {loading ? 'Processando...' : 'CONSOLIDAR PARTIDA ✅'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

function TeamTable({ players, stats, onStatChange, onAutoCheck, color, title }: any) {
    return (
        <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
            <h3 className={`p-4 font-bold text-lg border-b border-gray-700 ${color}`}>{title}</h3>
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-900 text-gray-400 uppercase text-xs">
                    <tr>
                        <th className="p-3">Atleta</th>
                        <th className="p-1 text-center w-8" title="Jogou?">👟</th>
                        <th className="p-1 text-center w-10" title="Gols">⚽</th>
                        <th className="p-1 text-center w-10" title="Assist">🅰️</th>
                        <th className="p-1 text-center w-8" title="Amarelo">🟨</th>
                        <th className="p-1 text-center w-8" title="Vermelho">🟥</th>
                    </tr>
                </thead>
                <tbody>
                    {players.map((p: any) => {
                        const s = stats[p.id] || { played: 0, goals: 0, assists: 0, yellow: 0, red: 0 }
                        return (
                            <tr key={p.id} className={`border-b border-gray-700 hover:bg-gray-700 ${s.played ? 'bg-gray-700/50' : ''}`}>
                                <td className="p-3">
                                    <div className="font-bold truncate max-w-[120px]">{p.name}</div>
                                    <div className="text-xs text-gray-500 uppercase">{p.position}</div>
                                </td>

                                {/* JOGOU? (TITULAR/RESERVA) */}
                                <td className="p-1 text-center bg-black/20">
                                    <input type="checkbox" className="w-5 h-5 accent-blue-500 cursor-pointer"
                                        checked={!!s.played} onChange={e => onStatChange(p.id, 'played', e.target.checked ? 1 : 0)} />
                                </td>

                                <td className="p-1 text-center"><input type="number" min="0" className="w-8 bg-gray-900 border border-gray-600 rounded text-center text-white" value={s.goals || ''} onChange={e => { onStatChange(p.id, 'goals', Number(e.target.value)); onAutoCheck(p.id) }} /></td>
                                <td className="p-1 text-center"><input type="number" min="0" className="w-8 bg-gray-900 border border-gray-600 rounded text-center text-white" value={s.assists || ''} onChange={e => { onStatChange(p.id, 'assists', Number(e.target.value)); onAutoCheck(p.id) }} /></td>
                                <td className="p-1 text-center"><input type="checkbox" className="w-5 h-5 accent-yellow-500 cursor-pointer" checked={!!s.yellow} onChange={e => { onStatChange(p.id, 'yellow', e.target.checked ? 1 : 0); onAutoCheck(p.id) }} /></td>
                                <td className="p-1 text-center"><input type="checkbox" className="w-5 h-5 accent-red-600 cursor-pointer" checked={!!s.red} onChange={e => { onStatChange(p.id, 'red', e.target.checked ? 1 : 0); onAutoCheck(p.id) }} /></td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}