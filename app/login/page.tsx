'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [isSignUp, setIsSignUp] = useState(false) // Alterna entre Login e Cadastro

    async function handleAuth(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        if (isSignUp) {
            // --- MODO CADASTRO (CRIAR CONTA) ---
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            })

            if (error) {
                alert('Erro ao criar conta: ' + error.message)
            } else {
                // SUCESSO! Como a confirmação de email está desligada,
                // o usuário já recebe uma sessão e podemos redirecionar.
                alert('Conta criada! Bem-vindo ao Cartola Paranaense. ⚽')
                router.push('/dashboard') // Manda direto pro jogo
            }

        } else {
            // --- MODO LOGIN (ENTRAR) ---
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                alert('Erro ao entrar: ' + error.message)
            } else {
                router.push('/dashboard')
            }
        }

        setLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-800 to-green-900 p-4">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="text-5xl mb-2">⚽</div>
                    <h1 className="text-2xl font-bold text-gray-800">Cartola Paranaense</h1>
                    <p className="text-gray-500 text-sm">Monte seu time e vença a rodada!</p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:border-green-500 bg-gray-50"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Senha</label>
                        <input
                            type="password"
                            required
                            className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:border-green-500 bg-gray-50"
                            placeholder="******"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 rounded text-white font-bold transition transform active:scale-95 ${loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700 shadow-lg'}`}
                    >
                        {loading ? 'Carregando...' : (isSignUp ? 'Criar Conta Grátis' : 'Entrar no Jogo')}
                    </button>
                </form>

                <div className="mt-6 text-center pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                        {isSignUp ? 'Já tem time?' : 'Ainda não tem conta?'}
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="ml-2 text-green-600 font-bold hover:underline"
                        >
                            {isSignUp ? 'Fazer Login' : 'Cadastre-se agora'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    )
}