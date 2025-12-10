'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function AdminDashboard() {
  const [marketStatus, setMarketStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStatus() {
      // Busca a próxima rodada não finalizada para saber do mercado
      const { data: round } = await supabase
        .from('rounds')
        .select('*')
        .eq('finished', false)
        .order('start_date', { ascending: true })
        .limit(1)
        .single()
      
      if (round) {
        const isOpen = new Date() < new Date(round.start_date)
        setMarketStatus({ 
            isOpen, 
            roundName: round.name, 
            closesAt: new Date(round.start_date).toLocaleString('pt-BR') 
        })
      }
      setLoading(false)
    }
    fetchStatus()
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0e17] text-white p-6 relative overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-green-900/20 to-transparent pointer-events-none"></div>
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-green-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* HERO HEADER - Status do Sistema */}
        <header className="mb-12 mt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-sm shadow-2xl">
            <div>
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-2">
                    Painel God Mode ⚡
                </h1>
                <p className="text-gray-400">Bem-vindo ao centro de controle do Cartola Paranaense.</p>
            </div>
            
            {/* Widget de Status do Mercado */}
            <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl border shadow-lg ${loading ? 'animate-pulse bg-gray-800' : marketStatus?.isOpen ? 'bg-green-950/40 border-green-500/30' : 'bg-red-950/40 border-red-500/30'}`}>
                <div className={`w-3 h-3 rounded-full ${loading ? 'bg-gray-600' : marketStatus?.isOpen ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`}></div>
                <div>
                    <h3 className="font-bold text-sm uppercase tracking-wider mb-1">Status do Mercado</h3>
                    {loading ? (
                        <div className="h-4 w-24 bg-gray-700 rounded"></div>
                    ) : marketStatus ? (
                        <div>
                            <span className={`font-black text-xl ${marketStatus.isOpen ? 'text-green-400' : 'text-red-400'}`}>
                                {marketStatus.isOpen ? 'ABERTO 🟢' : 'FECHADO 🔴'}
                            </span>
                            <p className="text-xs text-gray-400 mt-1">
                                {marketStatus.isOpen ? `Fecha em: ${marketStatus.closesAt}` : `Aguardando próxima rodada`}
                            </p>
                        </div>
                    ) : (
                        <span className="text-gray-400 font-bold">Sem rodadas ativas</span>
                    )}
                </div>
            </div>
        </header>

        <main className="space-y-10">
            {/* SEÇÃO PRINCIPAL - Operação do Jogo */}
            <section>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-300">
                    <span className="text-green-500">🎮</span> Operação da Rodada
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    
                    <AdminCard 
                        title="Live Scout (Súmula)" 
                        desc="Pontuar jogos em tempo real durante a rodada."
                        icon="🔴"
                        href="/admin/live"
                        color="red"
                        highlight
                    />

                    <AdminCard 
                        title="Tabela & Rodadas" 
                        desc="Criar novas rodadas, agendar jogos e encerrar o mercado."
                        icon="📅"
                        href="/admin/tabela"
                        color="blue"
                    />

                     <AdminCard 
                        title="Gerenciar Jogadores" 
                        desc="Editar preços, posições e status de atletas existentes."
                        icon="🏃"
                        href="/admin/jogadores"
                        color="yellow"
                    />
                </div>
            </section>

            {/* SEÇÃO SECUNDÁRIA - Cadastros */}
            <section>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-300">
                    <span className="text-blue-500">📂</span> Cadastros Base
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-90 hover:opacity-100 transition-opacity">
                    <AdminCard 
                        title="Cadastrar Jogador" 
                        desc="Adicionar um novo atleta ao banco de dados."
                        icon="➕"
                        href="/admin/novo-jogador"
                        color="gray"
                        small
                    />
                    <AdminCard 
                        title="Cadastrar Clube" 
                        desc="Criar um novo time real (ex: Coritiba, Athletico)."
                        icon="🛡️"
                        href="/admin/novo-clube"
                        color="gray"
                        small
                    />
                </div>
            </section>
        </main>

      </div>
    </div>
  )
}

// --- COMPONENTE DE CARD REUTILIZÁVEL E BONITÃO ---
interface AdminCardProps { title: string; desc: string; icon: string; href: string; color: 'green'|'blue'|'red'|'yellow'|'gray'; highlight?: boolean; small?: boolean }

function AdminCard({ title, desc, icon, href, color, highlight, small }: AdminCardProps) {
    const colors = {
        green: 'from-green-500 to-emerald-700',
        blue: 'from-blue-500 to-indigo-700',
        red: 'from-red-500 to-rose-700',
        yellow: 'from-yellow-500 to-orange-700',
        gray: 'from-gray-700 to-gray-800',
    }
    const iconBg = colors[color]

    return (
        <Link href={href} className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-2
            ${highlight 
                ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-green-500/50 shadow-[0_0_30px_-10px_rgba(34,197,94,0.3)] hover:shadow-[0_0_40px_-5px_rgba(34,197,94,0.5)]' 
                : 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-white/10 hover:border-white/30 hover:bg-gray-800 shadow-xl hover:shadow-2xl'
            }
            ${small ? 'p-5' : 'p-6'}
        `}>
            <div className="relative z-10 flex items-start gap-4">
                <div className={`flex-shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br shadow-lg group-hover:scale-110 transition-transform duration-300
                    ${small ? 'w-10 h-10 text-xl' : 'w-14 h-14 text-3xl'} ${iconBg} text-white`}>
                    {icon}
                </div>
                <div>
                    <h3 className={`font-bold text-white group-hover:text-${color === 'gray' ? 'white' : color + '-400'} transition-colors ${small ? 'text-lg' : 'text-xl'}`}>
                        {title}
                    </h3>
                    <p className={`text-gray-400 leading-relaxed mt-1 ${small ? 'text-xs' : 'text-sm'}`}>{desc}</p>
                </div>
            </div>
            
            {/* Efeito de "Brilho" no hover */}
            <div className={`absolute -bottom-10 -right-10 w-40 h-40 bg-${color}-500/10 blur-3xl rounded-full group-hover:bg-${color}-500/20 transition-all duration-500 opacity-0 group-hover:opacity-100`}></div>
        </Link>
    )
}