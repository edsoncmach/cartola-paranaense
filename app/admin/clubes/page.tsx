'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function CadastroClubes() {
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

    const [formData, setFormData] = useState({
        name: '',
        slug: '', // Ex: 'cap', 'cfc'
        file: null as File | null
    })

    // Ajuda a gerar a sigla automaticamente enquanto digita o nome
    function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
        const name = e.target.value
        // Ex: "Operário Ferroviário" -> "operario-ferroviario"
        const slugSuggestion = name.toLowerCase()
            .replace(/[áàãâä]/g, 'a').replace(/[éèêë]/g, 'e').replace(/[íìîï]/g, 'i').replace(/[óòõôö]/g, 'o').replace(/[úùûü]/g, 'u').replace(/[ç]/g, 'c')
            .replace(/[^a-z0-9]/g, '-') // Troca espaços e especiais por hifen
            .replace(/-+/g, '-') // Remove hifens duplicados

        setFormData({ ...formData, name, slug: slugSuggestion })
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setMessage('')

        try {
            if (!formData.file || !formData.slug) {
                throw new Error('Nome, Sigla e Escudo são obrigatórios!')
            }

            // 1. Upload da Imagem para o Storage
            const fileExt = formData.file.name.split('.').pop()
            const fileName = `${formData.slug}-${Date.now()}.${fileExt}` // Nome único: cfc-123123.png

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('shields') // Nome do bucket que criamos
                .upload(fileName, formData.file)

            if (uploadError) throw uploadError

            // 2. Pegar a URL pública da imagem
            const { data: { publicUrl } } = supabase.storage
                .from('shields')
                .getPublicUrl(fileName)

            // 3. Salvar no Banco de Dados
            const { error: dbError } = await supabase.from('clubs').insert([
                {
                    name: formData.name,
                    slug: formData.slug,
                    shield_url: publicUrl
                }
            ])

            if (dbError) throw dbError

            setMessage('Clube cadastrado com sucesso! ⚽')
            setFormData({ name: '', slug: '', file: null }) // Limpa form

        } catch (error: any) {
            console.error(error)
            setMessage(`Erro: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8 flex justify-center items-start">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-gray-800">Novo Clube 🛡️</h1>

                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Nome */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nome do Clube</label>
                        <input
                            type="text"
                            required
                            placeholder="Ex: Maringá FC"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                            value={formData.name}
                            onChange={handleNameChange}
                        />
                    </div>

                    {/* Slug (Sigla) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Sigla / ID (Slug)</label>
                        <input
                            type="text"
                            required
                            placeholder="Ex: mfc"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border bg-gray-50"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        />
                        <span className="text-xs text-gray-500">Usado para identificar o time no sistema.</span>
                    </div>

                    {/* Upload Escudo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Escudo (PNG/JPG)</label>
                        <input
                            type="file"
                            accept="image/*"
                            required
                            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                            onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white p-3 rounded-md font-bold hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        {loading ? 'Enviando...' : 'Salvar Clube'}
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