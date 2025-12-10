'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation' // Hook para pegar o ID da URL

export default function DetalheLiga() {
    const params = useParams() // Pega o [id] da URL
    const leagueId = params.id as string

    const [leagueInfo, setLeagueInfo] = useState<any>(null)
    const [ranking, setRanking] = useState<any[]>([])
    const [rounds, setRounds] = useState<any[]>([])
    const [selectedRound, setSelectedRound] = useState<number>(0)
    const [loading, setLoading] = useState(true)

    // 1. Carrega Info da Liga e Rodadas
    useEffect(() => {
        async function init() {
            // Info da Liga
            const { data: league } = await supabase.from('leagues').select('*').eq('id', leagueId).single()
            setLeagueInfo(league)

            // Rodadas
            const { data: r } = await supabase.from('rounds').select('*').order('id')
            if (r && r.length > 0) {
                setRounds(r)
                const active = r.find((x: any) => !x.finished) || r[r.length - 1]
                setSelectedRound(active.id)
            }
        }
        init()
    }, [leagueId])

    // 2. Carrega Ranking Filtrado
    useEffect(() => {
        if (!selectedRound || !leagueId) return
        fetchRanking()
    }, [selectedRound, leagueId])

    async function fetchRanking() {
        setLoading(true)
        // Chama a nossa nova função SQL específica para ligas
        const { data, error } = await supabase.rpc('get_league_ranking', {
            target_league_id: leagueId,
            target_round_id: selectedRound
        })

        if (data) setRanking(data)
        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-gray-100 pb-20">

            {/* Header da Liga */}
            <div className="bg-blue-800 p-6 text-white text-center shadow-lg rounded-b-3xl mb-6 relative">
                <a href="/ligas" className="absolute top-4 left-4 text-white opacity-70 text-sm">← Voltar</a>

                <h1 className="text-3xl font-bold mb-1">{leagueInfo?.name}</h1>
                <div className="inline-block bg-blue-900 px-3 py-1 rounded text-xs font-mono mb-4">
                    Cód: {leagueInfo?.code}
                </div>

                {/* Seletor de Rodada */}
                <div className="flex justify-center">
                    <select
                        className="bg-blue-900 text-white p-2 rounded border border-blue-600 font-bold"
                        value={selectedRound}
                        onChange={(e) => setSelectedRound(Number(e.target.value))}
                    >
                        {rounds.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Lista de Ranking */}
            <div className="max-w-md mx-auto px-4 space-y-3">
                {loading && <p className="text-center text-gray-500">Carregando classificação...</p>}

                {ranking.map((team, index) => (
                    <div key={team.team_id} className={`relative bg-white p-4 rounded-xl shadow-sm flex items-center justify-between border-l-4 ${index === 0 ? 'border-yellow-400' : 'border-transparent'
                        }`}>
                        <div className="flex items-center gap-4">
                            <span className={`font-bold text-lg w-6 text-center ${index === 0 ? 'text-yellow-600' : 'text-gray-500'}`}>
                                {index + 1}º
                            </span>
                            <div>
                                <h3 className="font-bold text-gray-800">{team.team_name}</h3>
                                <p className="text-xs text-gray-500">{team.coach_name}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="block text-2xl font-bold text-blue-600">{Number(team.total_points).toFixed(2)}</span>
                        </div>
                        {index === 0 && <span className="absolute top-2 right-2 text-xl">👑</span>}
                    </div>
                ))}

                {ranking.length === 0 && !loading && (
                    <div className="text-center text-gray-400 mt-10 p-4 border border-dashed rounded bg-gray-50">
                        Ninguém pontuou nesta rodada ainda (ou a liga está vazia).
                    </div>
                )}
            </div>

        </div>
    )
}