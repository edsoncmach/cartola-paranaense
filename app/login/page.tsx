'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isSignUp, setIsSignUp] = useState(false) // Alternar entre Login e Cadastro
    const [message, setMessage] = useState('')

    async function handleAuth(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setMessage('')

        let error

        if (isSignUp) {
            // Criar conta
            const { error: signUpError } = await supabase.auth.signUp({
                email,
                password,
            })
            error = signUpError
            if (!error) setMessage('Verifique seu email para confirmar a conta! 📧')
        } else {
            // Fazer Login
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })
            error = signInError
            if (!error) {
                // Sucesso: Checar se já tem time ou precisa criar
                router.push('/dashboard')
            }
        }

        if (error) setMessage(error.message)
        setLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-green-900 p-4">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-sm">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-green-800">Paranaense Fantasy ⚽</h1>
                    <p className="text-gray-500">{isSignUp ? 'Crie sua conta' : 'Entre para escalar'}</p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 border p-2"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Senha</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            className="mt-1 block w-full rounded-md border-gray-300 border p-2"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-orange-500 text-white p-3 rounded-md font-bold hover:bg-orange-600 transition"
                    >
                        {loading ? 'Carregando...' : (isSignUp ? 'Cadastrar' : 'Entrar')}
                    </button>

                    {message && <p className="text-center text-sm text-red-600 mt-2">{message}</p>}
                </form>

                <div className="mt-4 text-center">
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-sm text-green-700 hover:underline"
                    >
                        {isSignUp ? 'Já tem conta? Entre aqui.' : 'Não tem conta? Cadastre-se.'}
                    </button>
                </div>
            </div>
        </div>
    )
}