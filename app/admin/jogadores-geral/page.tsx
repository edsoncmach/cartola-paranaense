'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function GerenciarJogadores() {
    const [players, setPlayers] = useState<any[]>([])
    const [clubs, setClubs] = useState<any[]>([])
    const [search, setSearch] = useState('')
    const [editingPlayer, setEditingPlayer] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    // Carrega tudo
    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        const { data: c } = await supabase.from('clubs').select('id, name').order('name')
        const { data: p } = await supabase.from('players').select('*, clubs(name)').order('name')
        if (c) setClubs(c)
        if (p) setPlayers(p)
    }

    // Filtragem
    const filteredPlayers = players.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.clubs?.name.toLowerCase().includes(search.toLowerCase())
    )

    // Ações
    async function handleDelete(id: string) {
        if (!confirm('Tem certeza? Isso vai remover o jogador do mercado.')) return
        const { error } = await supabase.from('players').delete().eq('id', id)
        if (error) alert('Erro ao deletar (ele pode estar escalado em algum time).')
        else fetchData()
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        // Atualiza Jogador
        const { error } = await supabase.from('players').update({
            name: editingPlayer.name,
            club_id: editingPlayer.club_id, // Transferência acontece aqui
            position: editingPlayer.position,
            price: editingPlayer.price,
            status: editingPlayer.status
        }).eq('id', editingPlayer.id)

        if (error) alert('Erro ao salvar!')
        else {
            setEditingPlayer(null)
            fetchData()
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">Gerenciar Elenco 📋</h1>

                {/* Busca */}
                <input
                    type="text"
                    placeholder="Buscar jogador ou time..."
                    className="w-full p-3 border rounded shadow-sm mb-6"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />

                {/* Lista */}
                <div className="bg-white rounded shadow overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 uppercase text-gray-500 font-bold">
                            <tr>
                                <th className="p-3">Nome</th>
                                <th className="p-3">Time</th>
                                <th className="p-3">Pos</th>
                                <th className="p-3">Preço</th>
                                <th className="p-3">Status</th>
                                <th className="p-3 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPlayers.slice(0, 50).map(player => (
                                <tr key={player.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3 font-bold">{player.name}</td>
                                    <td className="p-3">{player.clubs?.name}</td>
                                    <td className="p-3 uppercase">{player.position}</td>
                                    <td className="p-3">C$ {player.price}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs ${player.status === 'likely' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {player.status === 'likely' ? 'Provável' : 'Dúvida'}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right space-x-2">
                                        <button
                                            onClick={() => setEditingPlayer(player)}
                                            className="text-blue-600 hover:underline font-bold"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleDelete(player.id)}
                                            className="text-red-600 hover:underline font-bold"
                                        >
                                            Excluir
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredPlayers.length === 0 && <div className="p-4 text-center text-gray-500">Nenhum jogador encontrado.</div>}
                </div>
            </div>

            {/* MODAL DE EDIÇÃO */}
            {editingPlayer && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                        <h2 className="text-xl font-bold mb-4">Editar {editingPlayer.name}</h2>
                        <form onSubmit={handleSave} className="space-y-4">

                            <div>
                                <label className="block text-xs font-bold text-gray-500">Nome</label>
                                <input className="w-full border p-2 rounded" value={editingPlayer.name} onChange={e => setEditingPlayer({ ...editingPlayer, name: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500">Clube (Transferir)</label>
                                    <select className="w-full border p-2 rounded" value={editingPlayer.club_id} onChange={e => setEditingPlayer({ ...editingPlayer, club_id: e.target.value })}>
                                        {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500">Posição</label>
                                    <select className="w-full border p-2 rounded" value={editingPlayer.position} onChange={e => setEditingPlayer({ ...editingPlayer, position: e.target.value })}>
                                        {['gol', 'zag', 'lat', 'mei', 'ata', 'tec'].map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500">Preço (C$)</label>
                                    <input type="number" step="0.1" className="w-full border p-2 rounded" value={editingPlayer.price} onChange={e => setEditingPlayer({ ...editingPlayer, price: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500">Status</label>
                                    <select className="w-full border p-2 rounded" value={editingPlayer.status} onChange={e => setEditingPlayer({ ...editingPlayer, status: e.target.value })}>
                                        <option value="likely">Provável</option>
                                        <option value="doubt">Dúvida</option>
                                        <option value="injured">Lesionado</option>
                                        <option value="suspended">Suspenso</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <button type="button" onClick={() => setEditingPlayer(null)} className="px-4 py-2 text-gray-600">Cancelar</button>
                                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">
                                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}