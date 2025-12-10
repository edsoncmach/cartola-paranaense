'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import BadgeUpload from '@/components/BadgeUpload' // Importe o componente

export default function CriarTime() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [teamName, setTeamName] = useState('')
    const [coachName, setCoachName] = useState('')
    const [badgeUrl, setBadgeUrl] = useState('') // Novo estado para a URL do escudo
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) router.push('/login')
            setUser(user)
        })
    }, [])

    async function handleCreateTeam(e: React.FormEvent) {
        e.preventDefault()
        if (!user) return
        setLoading(true)

        const { error } = await supabase.from('fantasy_teams').insert([
            {
                user_id: user.id,
                name: teamName,
                coach_name: coachName,
                badge_url: badgeUrl, // Salva a URL aqui
                balance: 100.00
            }
        ])

        if (error) {
            alert('Erro: Talvez você já tenha um time ou o nome já existe!')
            setLoading(false)
        } else {
            router.push('/dashboard')
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <h1 className="text-2xl font-bold mb-2 text-gray-800 text-center">Bem-vindo, Cartoleiro! 🎩</h1>
                <p className="text-gray-600 mb-6 text-center">Personalize sua equipe.</p>

                <form onSubmit={handleCreateTeam} className="space-y-6">

                    {/* Componente de Upload no topo */}
                    <div className="flex justify-center">
                        <BadgeUpload onUpload={(url) => setBadgeUrl(url)} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nome do Time</label>
                        <input
                            type="text"
                            required
                            placeholder="Ex: Real Matismo"
                            className="mt-1 block w-full rounded-md border-gray-300 border p-2"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nome do Técnico (Você)</label>
                        <input
                            type="text"
                            required
                            placeholder="Sua alcunha"
                            className="mt-1 block w-full rounded-md border-gray-300 border p-2"
                            value={coachName}
                            onChange={(e) => setCoachName(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 text-white p-3 rounded-md font-bold hover:bg-green-700 transition"
                    >
                        {loading ? 'Criando...' : 'Fundar Clube e Começar'}
                    </button>
                </form>
            </div>
        </div>
    )
}