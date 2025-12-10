import Link from 'next/link'

export default function Regras() {
    return (
        <div className="min-h-screen bg-gray-100 p-6 pb-24">
            <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold mb-6 text-green-700 text-center">Regras de Pontuação 📏</h1>

                <div className="space-y-6">
                    <Section title="Ataque ⚽">
                        <Item label="Gol" points="+8.0" />
                        <Item label="Assistência" points="+5.0" />
                    </Section>

                    <Section title="Defesa 🛡️">
                        <Item label="Saldo de Gols (SG)" points="+5.0" desc="Bônus para Goleiro, Zagueiros e Laterais se o time não sofrer gol." />
                        <Item label="Gol Sofrido" points="-1.0" desc="Punição apenas para o Goleiro (por gol)." />
                    </Section>

                    <Section title="Punições 🟨">
                        <Item label="Cartão Amarelo" points="-2.0" />
                        <Item label="Cartão Vermelho" points="-5.0" />
                    </Section>

                    <Section title="Coletivo 🤝">
                        <Item label="Vitória" points="+1.0" desc="Bônus para todos os jogadores do time vencedor." />
                        <Item label="Derrota" points="-1.0" desc="Punição para todos os jogadores do time perdedor." />
                    </Section>

                    <Section title="Valorização 💰">
                        <p className="text-sm text-gray-600">
                            O sistema usa o algoritmo de "Preço Justo". Um jogador precisa fazer aproximadamente <strong>50% do seu valor</strong> em pontos para começar a valorizar.
                        </p>
                    </Section>
                </div>

                <div className="mt-8 text-center pt-6 border-t">
                    <Link href="/dashboard" className="bg-green-600 text-white px-8 py-3 rounded-full font-bold shadow hover:bg-green-700 transition">
                        Entendi, bora escalar!
                    </Link>
                </div>
            </div>
        </div>
    )
}

// Pequenos componentes para organizar o layout
function Section({ title, children }: any) {
    return (
        <div>
            <h2 className="font-bold text-lg border-b pb-1 mb-2 border-green-100 text-green-800">{title}</h2>
            <div className="space-y-3">{children}</div>
        </div>
    )
}

function Item({ label, points, desc }: any) {
    const isPositive = points.includes('+')
    return (
        <div className="flex justify-between items-start">
            <div>
                <span className="font-medium text-gray-800">{label}</span>
                {desc && <p className="text-xs text-gray-500 mt-0.5 leading-tight">{desc}</p>}
            </div>
            <span className={`font-bold text-lg ${isPositive ? 'text-blue-600' : 'text-red-500'}`}>{points}</span>
        </div>
    )
}