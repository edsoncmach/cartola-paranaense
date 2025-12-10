'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import BadgeUpload from '@/components/BadgeUpload'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Configuracoes() {
    const router = useRouter()
    const [team, setTeam] = useState<any>(null)

    useEffect(() => {
        async function loadTeam() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return router.push('/login')

            const { data } = await supabase.from('fantasy_teams').select('*').eq('user_id', user.id).single()
            if (data) setTeam(data)
        }
        loadTeam()
    }, [])

    async function handleUpdate(url: string) {
        if (!team) return
        const { error } = await supabase.from('fantasy_teams').update({ badge_url: url }).eq('id', team.id)
        if (error) alert('Erro ao salvar escudo!')
        else alert('Escudo atualizado com sucesso! 🛡️')
    }

    // FUNÇÃO DE SAIR (LOGOUT)
    async function handleLogout() {
        await supabase.auth.signOut()
        router.push('/login')
    }

    if (!team) return <div className="p-10 text-center animate-pulse">Carregando perfil...</div>

    return (
        <div className="min-h-screen bg-gray-100 p-4 pb-20">
            <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg mt-6">
                <h1 className="text-2xl font-bold mb-8 text-center text-gray-800">Configurações ⚙️</h1>

                {/* Seção do Escudo */}
                <div className="mb-8 text-center">
                    <h2 className="text-sm font-bold text-gray-500 uppercase mb-4">Identidade Visual</h2>
                    <BadgeUpload
                        currentBadgeUrl={team.badge_url}
                        onUpload={handleUpdate}
                    />
                    <p className="text-xs text-gray-400 mt-2">Toque na imagem para alterar</p>
                </div>

                {/* Dados do Time (Apenas leitura por enquanto) */}
                <div className="space-y-4 mb-8">
                    <div>
                        <label className="text-xs font-bold text-gray-500">Nome do Time</label>
                        <div className="p-3 bg-gray-50 border rounded text-gray-700 font-medium">{team.name}</div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500">Cartoleiro</label>
                        <div className="p-3 bg-gray-50 border rounded text-gray-700 font-medium">{team.coach_name}</div>
                    </div>
                </div>

                {/* Ações Finais */}
                <div className="pt-6 border-t space-y-3">
                    <Link href="/regras" className="flex items-center justify-center w-full p-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition font-medium">
                        📜 Ver Regras de Pontuação
                    </Link>

                    <button
                        onClick={handleLogout}
                        className="w-full p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg font-bold hover:bg-red-100 transition flex items-center justify-center gap-2"
                    >
                        🚪 Sair da Conta
                    </button>
                </div>

                <div className="mt-6 text-center">
                    <button onClick={() => router.push('/dashboard')} className="text-blue-600 hover:underline text-sm">
                        ← Voltar ao Mercado
                    </button>
                </div>
            </div>
        </div>
    )
}