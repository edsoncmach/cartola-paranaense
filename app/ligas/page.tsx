'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LigasHub() {
  const router = useRouter()
  const [myLeagues, setMyLeagues] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Forms
  const [newLeagueName, setNewLeagueName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [userTeamId, setUserTeamId] = useState<string | null>(null)

  useEffect(() => {
    loadLeagues()
  }, [])

  async function loadLeagues() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')

    const { data: team } = await supabase.from('fantasy_teams').select('id').eq('user_id', user.id).single()
    if (!team) return router.push('/criar-time')
    setUserTeamId(team.id)

    const { data: leagues } = await supabase
      .from('league_members')
      .select('league:leagues(*)')
      .eq('fantasy_team_id', team.id)
    
    if (leagues) {
        setMyLeagues(leagues.map((item: any) => item.league))
    }
    setLoading(false)
  }

  async function handleCreateLeague(e: React.FormEvent) {
    e.preventDefault()
    if (!userTeamId || !newLeagueName.trim()) return

    const code = Math.random().toString(36).substring(2, 7).toUpperCase()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: league, error } = await supabase.from('leagues').insert({
        name: newLeagueName,
        code: code,
        owner_id: user?.id
    }).select().single()

    if (error) return alert('Erro ao criar liga!')

    await supabase.from('league_members').insert({
        league_id: league.id,
        fantasy_team_id: userTeamId
    })

    alert(`Liga criada com sucesso! Código: ${code}`)
    setNewLeagueName('')
    loadLeagues()
  }

  async function handleJoinLeague(e: React.FormEvent) {
    e.preventDefault()
    if (!userTeamId || !joinCode.trim()) return

    const { data: league } = await supabase.from('leagues').select('id, name').eq('code', joinCode.toUpperCase().trim()).single()
    
    if (!league) return alert('Código inválido! Liga não encontrada.')

    const { error } = await supabase.from('league_members').insert({
        league_id: league.id,
        fantasy_team_id: userTeamId
    })

    if (error) {
        if (error.code === '23505') alert('Você já está nessa liga!')
        else alert('Erro ao entrar.')
    } else {
        alert(`Bem-vindo à liga ${league.name}!`)
        setJoinCode('')
        loadLeagues()
    }
  }

  function copyToClipboard(code: string) {
    navigator.clipboard.writeText(code)
    alert('Código copiado!')
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* HEADER DESTAQUE */}
      <header className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-8 rounded-b-[2rem] shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 text-9xl transform translate-x-10 -translate-y-10">🏆</div>
        <div className="relative z-10 max-w-4xl mx-auto">
            <h1 className="text-3xl font-black mb-2">Suas Ligas</h1>
            <p className="text-blue-200 text-sm">Dispute com amigos e veja quem é o verdadeiro mito.</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 space-y-10">

        {/* --- SEÇÃO 1: MINHAS LIGAS (CARDS) --- */}
        <section>
          <div className="flex items-center gap-2 mb-4">
             <span className="text-xl">⚔️</span>
             <h2 className="font-bold text-gray-700 text-lg">Competições Ativas</h2>
          </div>
          
          {loading ? (
             <div className="text-center py-10 text-gray-400">Carregando competições...</div>
          ) : myLeagues.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myLeagues.map(league => (
                    <div key={league.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400"></div>
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-xl text-gray-800 mb-1">{league.name}</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono border">
                                        Cód: {league.code}
                                    </span>
                                    <button onClick={(e) => {e.preventDefault(); copyToClipboard(league.code)}} className="text-gray-400 hover:text-blue-600 text-xs" title="Copiar">
                                        📋
                                    </button>
                                </div>
                            </div>
                            <Link href={`/ligas/${league.id}`} className="bg-blue-50 text-blue-600 w-10 h-10 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition">
                                →
                            </Link>
                        </div>
                        <Link href={`/ligas/${league.id}`} className="absolute inset-0 z-0"></Link>
                    </div>
                ))}
             </div>
          ) : (
             <div className="bg-white border-dashed border-2 border-gray-300 rounded-xl p-8 text-center">
                <div className="text-4xl mb-3">😕</div>
                <h3 className="font-bold text-gray-600">Nenhuma liga encontrada</h3>
                <p className="text-sm text-gray-400 mb-4">Você ainda não participa de nenhuma competição.</p>
             </div>
          )}
        </section>

        {/* --- SEÇÃO 2: AÇÕES (CRIAR E ENTRAR) --- */}
        <section className="grid md:grid-cols-2 gap-6">
            
            {/* CARD CRIAR LIGA */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100 relative overflow-hidden">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-green-100 rounded-full opacity-50"></div>
                
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl mb-4 text-green-700">
                        ✨
                    </div>
                    <h2 className="font-bold text-lg text-gray-800 mb-2">Criar Nova Liga</h2>
                    <p className="text-sm text-gray-500 mb-6">Seja o dono da bola. Crie uma liga e convide a galera.</p>
                    
                    <form onSubmit={handleCreateLeague} className="flex flex-col gap-3">
                        <input 
                            type="text" 
                            placeholder="Nome da Liga (ex: Firma FC)" 
                            required
                            className="w-full border border-gray-300 bg-gray-50 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                            value={newLeagueName}
                            onChange={e => setNewLeagueName(e.target.value)}
                        />
                        <button type="submit" className="w-full bg-green-600 text-white p-3 rounded-lg font-bold hover:bg-green-700 transition shadow-lg shadow-green-200">
                            Criar Liga Grátis
                        </button>
                    </form>
                </div>
            </div>

            {/* CARD ENTRAR EM LIGA */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100 relative overflow-hidden">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-100 rounded-full opacity-50"></div>
                
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl mb-4 text-blue-700">
                        🎟️
                    </div>
                    <h2 className="font-bold text-lg text-gray-800 mb-2">Entrar com Código</h2>
                    <p className="text-sm text-gray-500 mb-6">Já tem um convite? Cole o código abaixo para entrar.</p>
                    
                    <form onSubmit={handleJoinLeague} className="flex flex-col gap-3">
                        <input 
                            type="text" 
                            placeholder="Código (ex: X7B2A)" 
                            required
                            className="w-full border border-gray-300 bg-gray-50 p-3 rounded-lg uppercase font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                            value={joinCode}
                            onChange={e => setJoinCode(e.target.value)}
                        />
                        <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200">
                            Entrar na Liga
                        </button>
                    </form>
                </div>
            </div>

        </section>
      </main>
      
      {/* MENU INFERIOR */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-2 pb-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50">
           <Link href="/dashboard" className="flex flex-col items-center px-4 py-1 rounded text-gray-400 hover:text-green-500 transition">
              <span className="text-2xl">🏟️</span>
              <span className="text-[10px] font-bold uppercase mt-1">Escalar</span>
           </Link>
           <Link href="/ligas" className="flex flex-col items-center px-4 py-1 rounded text-green-600 transition">
              <span className="text-2xl">🏆</span>
              <span className="text-[10px] font-bold uppercase mt-1">Ligas</span>
           </Link>
           <Link href="/ranking" className="flex flex-col items-center px-4 py-1 rounded text-gray-400 hover:text-green-500 transition">
              <span className="text-2xl">🌎</span>
              <span className="text-[10px] font-bold uppercase mt-1">Ranking</span>
           </Link>
           <Link href="/jogos" className="flex flex-col items-center px-4 py-1 rounded text-gray-400 hover:text-green-500 transition">
              <span className="text-2xl">📅</span>
              <span className="text-[10px] font-bold uppercase mt-1">Jogos</span>
           </Link>
      </div>
    </div>
  )
}