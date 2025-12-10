'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface BadgeUploadProps {
    currentBadgeUrl?: string
    onUpload: (url: string) => void
}

export default function BadgeUpload({ currentBadgeUrl, onUpload }: BadgeUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [preview, setPreview] = useState<string | null>(currentBadgeUrl || null)

    async function uploadBadge(event: React.ChangeEvent<HTMLInputElement>) {
        try {
            setUploading(true)

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('Você precisa selecionar uma imagem para enviar.')
            }

            const file = event.target.files[0]
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('team-badges')
                .upload(filePath, file)

            if (uploadError) {
                throw uploadError
            }

            // Pega a URL pública
            const { data: { publicUrl } } = supabase.storage
                .from('team-badges')
                .getPublicUrl(filePath)

            setPreview(publicUrl)
            onUpload(publicUrl)
        } catch (error: any) {
            alert('Erro no upload: ' + error.message)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100 flex items-center justify-center">
                {preview ? (
                    <img
                        src={preview}
                        alt="Escudo"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <span className="text-4xl text-gray-400">🛡️</span>
                )}
                {uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs">
                        Enviando...
                    </div>
                )}
            </div>

            <div className="relative">
                <input
                    type="file"
                    id="badge"
                    accept="image/*"
                    onChange={uploadBadge}
                    disabled={uploading}
                    className="hidden"
                />
                <label
                    htmlFor="badge"
                    className="cursor-pointer bg-blue-600 text-white py-2 px-4 rounded-full text-sm font-bold hover:bg-blue-700 transition"
                >
                    {uploading ? 'Carregando...' : 'Alterar Escudo'}
                </label>
            </div>
        </div>
    )
}