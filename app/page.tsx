'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Home() {
	const router = useRouter()

	useEffect(() => {
		async function checkUser() {
			// Verifica se existe alguém logado
			const { data: { session } } = await supabase.auth.getSession()

			if (session) {
				// Se tem sessão, vai pro jogo
				router.replace('/dashboard')
			} else {
				// Se não tem, vai pro login
				router.replace('/login')
			}
		}

		checkUser()
	}, [router])

	// Enquanto decide, mostra um carregando bonitinho
	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-green-900 text-white">
			<div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-yellow-400 mb-4"></div>
			<p className="font-bold animate-pulse">Carregando Cartola Paranaense...</p>
		</div>
	)
}