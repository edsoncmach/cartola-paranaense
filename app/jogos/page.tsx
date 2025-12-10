'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function Jogos() {
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadMatches() {
      // Busca jogos ordenados por data
      const { data } = await supabase
        .from('matches')
        .select(`
          id, match_date, home_score, away_score,
          home_team:clubs!matches_home_team_id_fkey(name, shield_url),
          away_team:clubs!matches_away_team_id_fkey(name, shield_url)
        `)
        .order('match_date', { ascending: true })
      
      if (data) setMatches(data)
      setLoading(false)
    }
    loadMatches()
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      <header className="bg-green-700 text-white p-4 text-center font-bold sticky top-0 z-10">
        Tabela de Jogos 📅
      </header>

      <div className="p-4 max-w-md mx-auto space-y-3">
        {loading && <p className="text-center text-gray-500 mt-10">Carregando jogos...</p>}
        
        {matches.map(match => {
            const date = new Date(match.match_date)
            return (
                <div key={match.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="text-xs text-gray-400 text-center mb-3 border-b pb-2">
                        {date.toLocaleDateString('pt-BR')} às {date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="flex flex-col items-center w-1/3">
                            <img src={match.home_team.shield_url} className="w-10 h-10 object-contain mb-1" />
                            <span className="text-xs text-center font-bold leading-tight">{match.home_team.name}</span>
                        </div>
                        <div className="font-mono text-xl font-bold bg-gray-100 px-3 py-1 rounded text-gray-700">
                            {match.home_score ?? ''} x {match.away_score ?? ''}
                        </div>
                        <div className="flex flex-col items-center w-1/3">
                            <img src={match.away_team.shield_url} className="w-10 h-10 object-contain mb-1" />
                            <span className="text-xs text-center font-bold leading-tight">{match.away_team.name}</span>
                        </div>
                    </div>
                </div>
            )
        })}
        {matches.length === 0 && !loading && <p className="text-center text-gray-500">Nenhum jogo agendado.</p>}
      </div>

      {/* MENU INFERIOR */}
      <BottomMenu active="jogos" />
    </div>
  )
}

// Componente de Menu Reutilizável (Para não repetir código)
function BottomMenu({ active }: { active: string }) {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-2 pb-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50">
           <Link href="/dashboard" className={`flex flex-col items-center px-4 py-1 rounded transition ${active === 'escalar' ? 'text-green-600' : 'text-gray-400 hover:text-green-500'}`}>
              <span className="text-2xl">🏟️</span>
              <span className="text-[10px] font-bold uppercase mt-1">Escalar</span>
           </Link>
           <Link href="/ligas" className={`flex flex-col items-center px-4 py-1 rounded transition ${active === 'ligas' ? 'text-green-600' : 'text-gray-400 hover:text-green-500'}`}>
              <span className="text-2xl">🏆</span>
              <span className="text-[10px] font-bold uppercase mt-1">Ligas</span>
           </Link>
           <Link href="/ranking" className={`flex flex-col items-center px-4 py-1 rounded transition ${active === 'ranking' ? 'text-green-600' : 'text-gray-400 hover:text-green-500'}`}>
              <span className="text-2xl">🌎</span>
              <span className="text-[10px] font-bold uppercase mt-1">Ranking</span>
           </Link>
           <Link href="/jogos" className={`flex flex-col items-center px-4 py-1 rounded transition ${active === 'jogos' ? 'text-green-600' : 'text-gray-400 hover:text-green-500'}`}>
              <span className="text-2xl">📅</span>
              <span className="text-[10px] font-bold uppercase mt-1">Jogos</span>
           </Link>
        </div>
    )
}