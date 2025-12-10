'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function CadastroJogadores() {
    const [clubs, setClubs] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

    // Formulário
    const [formData, setFormData] = useState({
        name: '',
        club_id: '',
        position: 'ata',
        price: '5.00'
    })

    // 1. Busca os clubes assim que a página carrega
    useEffect(() => {
        async function fetchClubs() {
            const { data, error } = await supabase.from('clubs').select('*').order('name')
            if (data) setClubs(data)
        }
        fetchClubs()
    }, [])

    // 2. Envia para o Supabase
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setMessage('')

        if (!formData.club_id) {
            alert('Selecione um clube!')
            setLoading(false)
            return
        }

        const { error } = await supabase.from('players').insert([
            {
                name: formData.name,
                club_id: formData.club_id,
                position: formData.position,
                price: parseFloat(formData.price),
                status: 'doubt'
            }
        ])

        setLoading(false)

        if (error) {
            console.error(error)
            setMessage('Erro ao cadastrar ❌')
        } else {
            setMessage('Jogador cadastrado com sucesso! ✅')
            setFormData({ ...formData, name: '' })
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8 flex justify-center items-start">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-gray-800">Painel God Mode 👑</h1>

                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Nome */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nome do Jogador</label>
                        <input
                            type="text"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    {/* Clube */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Clube</label>
                        <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border bg-white"
                            value={formData.club_id}
                            onChange={(e) => setFormData({ ...formData, club_id: e.target.value })}
                        >
                            <option value="">Selecione...</option>
                            {clubs.map(club => (
                                <option key={club.id} value={club.id}>{club.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Posição e Preço (Lado a Lado) */}
                    <div className="flex gap-4">
                        <div className="w-1/2">
                            <label className="block text-sm font-medium text-gray-700">Posição</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border bg-white"
                                value={formData.position}
                                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                            >
                                <option value="gol">Goleiro</option>
                                <option value="zag">Zagueiro</option>
                                <option value="lat">Lateral</option>
                                <option value="mei">Meia</option>
                                <option value="ata">Atacante</option>
                                <option value="tec">Técnico</option>
                            </select>
                        </div>

                        <div className="w-1/2">
                            <label className="block text-sm font-medium text-gray-700">Preço (C$)</label>
                            <input
                                type="number"
                                step="0.01"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 text-white p-3 rounded-md font-bold hover:bg-green-700 transition disabled:opacity-50"
                    >
                        {loading ? 'Salvando...' : 'Cadastrar Jogador'}
                    </button>

                    {message && (
                        <div className={`text-center p-2 rounded ${message.includes('Erro') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {message}
                        </div>
                    )}

                </form>
            </div>
        </div>
    )
}