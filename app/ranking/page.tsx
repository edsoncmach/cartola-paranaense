'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function RankingGeral() {
    const [ranking, setRanking] = useState<any[]>([])
    const [rounds, setRounds] = useState<any[]>([])
    const [selectedRound, setSelectedRound] = useState<number>(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function init() {
            // Carrega Rodadas
            const { data: r } = await supabase.from('rounds').select('*').order('id')
            if (r && r.length > 0) {
                setRounds(r)
                // Tenta pegar a rodada finalizada mais recente, ou a primeira
                const finished = r.filter((x: any) => x.finished).pop()
                setSelectedRound(finished ? finished.id : r[0].id)
            }
        }
        init()
    }, [])

    useEffect(() => {
        if (!selectedRound) return
        async function fetchRanking() {
            setLoading(true)
            // Chama a função SQL de Ranking
            const { data } = await supabase.rpc('get_ranking', { target_round_id: selectedRound })
            if (data) setRanking(data)
            setLoading(false)
        }
        fetchRanking()
    }, [selectedRound])

    return (
        <div className="min-h-screen bg-gray-100 pb-24">
            <header className="bg-blue-800 text-white p-6 rounded-b-3xl shadow-lg mb-6">
                <h1 className="text-2xl font-bold text-center mb-4">Ranking Nacional 🌎</h1>
                <div className="flex justify-center">
                    <select
                        className="bg-blue-900 border border-blue-500 text-white font-bold py-2 px-4 rounded focus:outline-none"
                        value={selectedRound}
                        onChange={e => setSelectedRound(Number(e.target.value))}
                    >
                        {rounds.map(r => <option key={r.id} value={r.id}>{r.name} {r.finished ? '(Finalizada)' : '(Em andamento)'}</option>)}
                    </select>
                </div>
            </header>

            <div className="max-w-md mx-auto px-4 space-y-3">
                {loading && <p className="text-center text-gray-500">Calculando pontos...</p>}

                {ranking.map((team, index) => (
                    <div key={team.team_id} className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between border-l-4 border-blue-500">
                        <div className="flex items-center gap-4">
                            <span className={`font-bold text-lg w-8 text-center ${index < 3 ? 'text-yellow-600 text-xl' : 'text-gray-400'}`}>
                                {index + 1}º
                            </span>
                            <div>
                                <h3 className="font-bold text-gray-800">{team.team_name}</h3>
                                <p className="text-xs text-gray-500">{team.coach_name}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="block text-xl font-bold text-blue-700">{Number(team.total_points).toFixed(2)}</span>
                            <span className="text-[10px] text-gray-400 uppercase">Pontos</span>
                        </div>
                    </div>
                ))}

                {ranking.length === 0 && !loading && (
                    <div className="text-center text-gray-500 py-10">Nenhuma pontuação nesta rodada ainda.</div>
                )}
            </div>

            {/* MENU INFERIOR (O mesmo componente, mas inline aqui pra facilitar o copy-paste) */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-2 pb-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50">
                <Link href="/dashboard" className="flex flex-col items-center px-4 py-1 rounded text-gray-400 hover:text-green-500">
                    <span className="text-2xl">🏟️</span>
                    <span className="text-[10px] font-bold uppercase mt-1">Escalar</span>
                </Link>
                <Link href="/ligas" className="flex flex-col items-center px-4 py-1 rounded text-gray-400 hover:text-green-500">
                    <span className="text-2xl">🏆</span>
                    <span className="text-[10px] font-bold uppercase mt-1">Ligas</span>
                </Link>
                <Link href="/ranking" className="flex flex-col items-center px-4 py-1 rounded text-green-600">
                    <span className="text-2xl">🌎</span>
                    <span className="text-[10px] font-bold uppercase mt-1">Ranking</span>
                </Link>
                <Link href="/jogos" className="flex flex-col items-center px-4 py-1 rounded text-gray-400 hover:text-green-500">
                    <span className="text-2xl">📅</span>
                    <span className="text-[10px] font-bold uppercase mt-1">Jogos</span>
                </Link>
            </div>
        </div>
    )
}