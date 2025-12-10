'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Função auxiliar para converter UTC do banco para o formato do input Local
function toLocalISOString(dateString: string) {
    if (!dateString) return ''
    const date = new Date(dateString)
    // Desconta o fuso horário para o ISOString sair com a hora local
    const offset = date.getTimezoneOffset() * 60000
    const localDate = new Date(date.getTime() - offset)
    return localDate.toISOString().slice(0, 16)
}

export default function GestaoTabela() {
    // --- ESTADOS DO SISTEMA ---
    const [rounds, setRounds] = useState<any[]>([])
    const [clubs, setClubs] = useState<any[]>([])
    const [matches, setMatches] = useState<any[]>([])

    // --- CONTROLE DA TELA ---
    const [selectedRoundId, setSelectedRoundId] = useState<number>(0)
    const [currentRoundData, setCurrentRoundData] = useState<any>(null)

    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

    // --- FORMULÁRIO DE NOVO JOGO ---
    const [newMatch, setNewMatch] = useState({
        home_team_id: '',
        away_team_id: '',
        match_date: '',
        match_time: '16:00'
    })

    // 1. CARGA INICIAL (Rodadas e Clubes)
    useEffect(() => {
        loadRoundsAndClubs()
    }, [])

    async function loadRoundsAndClubs() {
        const { data: r } = await supabase.from('rounds').select('*').order('id')
        const { data: c } = await supabase.from('clubs').select('*').order('name')

        if (r && r.length > 0) {
            setRounds(r)
            // Se não tiver rodada selecionada, pega a primeira. Se já tiver, mantém.
            if (selectedRoundId === 0) setSelectedRoundId(r[0].id)
        }
        if (c) setClubs(c)
    }

    // 2. CARREGAR DETALHES QUANDO MUDA A RODADA
    useEffect(() => {
        if (selectedRoundId === 0) return
        fetchRoundDetails()
        fetchMatches()
    }, [selectedRoundId])

    async function fetchRoundDetails() {
        const { data } = await supabase
            .from('rounds')
            .select('*')
            .eq('id', selectedRoundId)
            .single()
        setCurrentRoundData(data)
    }

    async function fetchMatches() {
        const { data } = await supabase
            .from('matches')
            .select(`
        id, match_date, home_score, away_score,
        home_team:clubs!matches_home_team_id_fkey(name, shield_url),
        away_team:clubs!matches_away_team_id_fkey(name, shield_url)
      `)
            .eq('round_id', selectedRoundId)
            .order('match_date')

        if (data) setMatches(data as any[])
    }

    // 3. FUNÇÃO: CRIAR NOVA FASE (Ex: Quartas de Final)
    async function handleCreateRound() {
        const nextNum = rounds.length + 1
        const { data, error } = await supabase.from('rounds').insert({
            name: `Nova Fase ${nextNum}`,
            start_date: new Date().toISOString(),
            end_date: new Date().toISOString(),
            type: 'regular' // Padrão
        }).select()

        if (error) alert('Erro ao criar: ' + error.message)
        else {
            await loadRoundsAndClubs()
            if (data) setSelectedRoundId(data[0].id) // Já seleciona a nova
        }
    }

    // 4. FUNÇÃO: ATUALIZAR CONFIGURAÇÕES DA RODADA
    async function handleUpdateRound(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        const { error } = await supabase
            .from('rounds')
            .update({
                name: currentRoundData.name,
                start_date: currentRoundData.start_date,
                end_date: currentRoundData.end_date,
                type: currentRoundData.type,
                leg: currentRoundData.leg
            })
            .eq('id', selectedRoundId)

        if (error) alert('Erro ao atualizar!')
        else {
            setMessage('Rodada configurada! ✅')
            loadRoundsAndClubs() // Atualiza lista de botões lá em cima
        }
        setLoading(false)
        setTimeout(() => setMessage(''), 3000)
    }

    // 5. FUNÇÃO: CADASTRAR PARTIDA
    async function handleAddMatch(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        const fullDate = new Date(`${newMatch.match_date}T${newMatch.match_time}:00`)

        const { error } = await supabase.from('matches').insert({
            round_id: selectedRoundId,
            home_team_id: newMatch.home_team_id,
            away_team_id: newMatch.away_team_id,
            match_date: fullDate.toISOString()
        })

        if (error) alert('Erro: ' + error.message)
        else {
            fetchMatches()
            setNewMatch(prev => ({ ...prev, home_team_id: '', away_team_id: '' }))
        }
        setLoading(false)
    }

    // 6. FUNÇÃO: ATUALIZAR PLACAR
    async function updateScore(matchId: string, home: number, away: number) {
        await supabase.from('matches').update({ home_score: home, away_score: away }).eq('id', matchId)
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6 flex flex-col xl:flex-row gap-6">

            {/* --- COLUNA ESQUERDA: GESTÃO --- */}
            <div className="w-full xl:w-2/3 space-y-6">

                {/* Navegação de Rodadas */}
                <div className="bg-white p-4 rounded-lg shadow flex gap-2 items-center overflow-x-auto">
                    <div className="flex gap-2">
                        {rounds.map(r => (
                            <button
                                key={r.id}
                                onClick={() => setSelectedRoundId(r.id)}
                                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap border ${selectedRoundId === r.id
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                    }`}
                            >
                                {r.name}
                            </button>
                        ))}
                    </div>
                    <button onClick={handleCreateRound} className="px-3 py-1 bg-gray-800 text-white rounded text-xs hover:bg-black whitespace-nowrap">
                        + Nova Fase
                    </button>
                </div>

                {/* Configuração da Rodada Atual */}
        {currentRoundData && (
          <div className="bg-white border-l-4 border-blue-500 p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              ⚙️ Configuração da Fase
            </h2>
            <form onSubmit={handleUpdateRound} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              
              {/* Tipo da Fase */}
              <div className="col-span-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Tipo de Disputa</label>
                <select 
                  className="w-full p-2 border rounded bg-gray-50"
                  value={currentRoundData.type || 'regular'}
                  onChange={e => setCurrentRoundData({...currentRoundData, type: e.target.value})}
                >
                  <option value="regular">Fase de Grupos (Pontos)</option>
                  <option value="quarter">Quartas de Final</option>
                  <option value="semi">Semifinal</option>
                  <option value="final">Final</option>
                  <option value="relegation">Torneio da Morte</option>
                </select>
              </div>

              {/* Jogo Ida/Volta */}
              <div className="col-span-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Jogo Único/Ida/Volta</label>
                <select 
                  className="w-full p-2 border rounded bg-gray-50"
                  value={currentRoundData.leg || 'single'}
                  onChange={e => setCurrentRoundData({...currentRoundData, leg: e.target.value})}
                >
                  <option value="single">Jogo Único / Normal</option>
                  <option value="first">Jogo de Ida</option>
                  <option value="second">Jogo de Volta</option>
                </select>
              </div>

              {/* Nome da Rodada */}
              <div className="col-span-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Nome de Exibição</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded"
                  value={currentRoundData.name}
                  onChange={e => setCurrentRoundData({...currentRoundData, name: e.target.value})}
                />
              </div>

              {/* Fechamento */}
              <div className="col-span-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Fecha Mercado Em</label>
                <input 
                  type="datetime-local" 
                  className="w-full p-2 border rounded"
                  // Função auxiliar para arrumar o fuso (se você adicionou ela antes)
                  // Se não adicionou a função toLocalISOString, use: 
                  value={currentRoundData.start_date ? new Date(currentRoundData.start_date).toISOString().slice(0, 16) : ''}
                  onChange={e => setCurrentRoundData({...currentRoundData, start_date: new Date(e.target.value).toISOString()})}
                />
              </div>

              <div className="col-span-1 md:col-span-4 flex justify-end">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 w-full md:w-auto"
                >
                  {loading ? 'Salvando...' : 'Salvar Configuração'}
                </button>
              </div>
            </form>

            {/* --- AQUI ESTÁ O BOTÃO QUE FALTAVA --- */}
            <div className="mt-8 pt-6 border-t border-gray-200 bg-red-50 p-4 rounded border border-red-100">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <h3 className="font-bold text-red-800 flex items-center gap-2">⚠️ Zona de Perigo: Encerrar Rodada</h3>
                  <p className="text-xs text-red-600 max-w-md">
                    Ao clicar aqui, o sistema vai: <br/>
                    1. Calcular a valorização/desvalorização dos jogadores. <br/>
                    2. Fechar esta rodada e <b>ABRIR O MERCADO</b> para a próxima.
                  </p>
                </div>

                {currentRoundData.finished ? (
                  <span className="bg-gray-200 text-gray-500 px-6 py-3 rounded font-bold cursor-not-allowed border border-gray-300">
                     🔒 Rodada Já Finalizada
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm('CONFIRMAÇÃO FINAL:\n\nTem certeza que todos os jogos acabaram?\nIsso vai alterar o preço dos jogadores e abrir o mercado.')) return
                      
                      setLoading(true)
                      try {
                        // 1. Roda o Algoritmo de Valorização
                        const { error: calcError } = await supabase.rpc('apply_market_values', { p_round_id: selectedRoundId })
                        if (calcError) throw calcError

                        // 2. Marca a rodada como finalizada
                        const { error: updateError } = await supabase.from('rounds').update({ finished: true }).eq('id', selectedRoundId)
                        if (updateError) throw updateError
                        
                        alert('Sucesso! Rodada encerrada e Mercado Aberto! 🚀')
                        window.location.reload()

                      } catch (error: any) {
                        alert('Erro ao processar: ' + error.message)
                      } finally {
                        setLoading(false)
                      }
                    }}
                    className="bg-red-600 text-white px-6 py-3 rounded font-bold hover:bg-red-700 shadow-lg transition transform hover:scale-105"
                  >
                    Encerrar Rodada & Valorizar 📉📈
                  </button>
                )}
              </div>
            </div>
            
            {message && <p className="text-green-600 text-sm mt-4 font-bold text-center">{message}</p>}
          </div>
        )}

                {/* Cadastro de Jogos */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-bold mb-4 text-gray-800">Partidas ⚽</h2>
                    <form onSubmit={handleAddMatch} className="bg-gray-50 p-4 rounded border border-gray-200 mb-6 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                        <div className="md:col-span-1">
                            <label className="text-xs font-bold text-gray-500">Data</label>
                            <input type="date" required className="w-full p-2 border rounded" value={newMatch.match_date} onChange={e => setNewMatch({ ...newMatch, match_date: e.target.value })} />
                        </div>
                        <div className="md:col-span-1">
                            <label className="text-xs font-bold text-gray-500">Hora</label>
                            <input type="time" required className="w-full p-2 border rounded" value={newMatch.match_time} onChange={e => setNewMatch({ ...newMatch, match_time: e.target.value })} />
                        </div>
                        <div className="md:col-span-1">
                            <label className="text-xs font-bold text-gray-500">Mandante</label>
                            <select required className="w-full p-2 border rounded" value={newMatch.home_team_id} onChange={e => setNewMatch({ ...newMatch, home_team_id: e.target.value })}>
                                <option value="">Time Casa</option>
                                {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-1">
                            <label className="text-xs font-bold text-gray-500">Visitante</label>
                            <select required className="w-full p-2 border rounded" value={newMatch.away_team_id} onChange={e => setNewMatch({ ...newMatch, away_team_id: e.target.value })}>
                                <option value="">Visitante</option>
                                {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <button type="submit" disabled={loading} className="bg-green-600 text-white p-2 rounded font-bold hover:bg-green-700 h-10">+ Jogo</button>
                    </form>

                    <div className="space-y-2">
                        {matches.map(m => (
                            <div key={m.id} className="flex flex-col sm:flex-row items-center justify-between bg-white border p-3 rounded hover:bg-gray-50 gap-2">
                                <div className="text-xs text-gray-500 w-full sm:w-24 text-center sm:text-left">
                                    {new Date(m.match_date).toLocaleDateString('pt-BR')} <br />
                                    {new Date(m.match_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="flex items-center gap-2 flex-1 justify-end w-full">
                                    <span className="font-bold text-sm text-right flex-1">{m.home_team.name}</span>
                                    <img src={m.home_team.shield_url} className="w-8 h-8 object-contain" />
                                    <input type="number" className="w-12 text-center border rounded bg-gray-50 p-1 font-bold" defaultValue={m.home_score} onBlur={(e) => updateScore(m.id, parseInt(e.target.value), m.away_score)} />
                                </div>
                                <span className="font-bold text-gray-400">X</span>
                                <div className="flex items-center gap-2 flex-1 w-full">
                                    <input type="number" className="w-12 text-center border rounded bg-gray-50 p-1 font-bold" defaultValue={m.away_score} onBlur={(e) => updateScore(m.id, m.home_score, parseInt(e.target.value))} />
                                    <img src={m.away_team.shield_url} className="w-8 h-8 object-contain" />
                                    <span className="font-bold text-sm flex-1">{m.away_team.name}</span>
                                </div>
                            </div>
                        ))}
                        {matches.length === 0 && <p className="text-center text-gray-400 py-4 bg-gray-50 rounded border border-dashed">Nenhum jogo nesta rodada.</p>}
                    </div>
                </div>
            </div>

            {/* --- COLUNA DIREITA: CLASSIFICAÇÃO --- */}
            <div className="w-full xl:w-1/3">
                {currentRoundData?.type === 'regular' ? (
                    <TabelaClassificacao />
                ) : (
                    <div className="bg-white p-8 rounded-lg shadow text-center border border-yellow-200 bg-yellow-50">
                        <h2 className="text-xl font-bold text-yellow-800">Fase Mata-mata ⚔️</h2>
                        <p className="text-gray-600 mt-2">A tabela de pontos corridos não se aplica a fases eliminatórias.</p>
                        <div className="mt-6 text-sm text-gray-500">
                            Use o chaveamento para acompanhar os resultados de ida e volta.
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// ===============================================
// COMPONENTE AUXILIAR: TABELA COMPLETA (A e B)
// ===============================================
function TabelaClassificacao() {
    const [tableA, setTableA] = useState<any[]>([])
    const [tableB, setTableB] = useState<any[]>([])

    useEffect(() => {
        async function calculateTable() {
            // 1. Busca clubes e grupos
            const { data: clubs } = await supabase.from('clubs').select('id, name, group_name')

            // 2. Busca jogos realizados
            const { data: matchesData } = await supabase
                .from('matches')
                .select('home_team_id, away_team_id, home_score, away_score')
                .not('home_score', 'is', null)

            // CORREÇÃO DE TIPO
            const matches = matchesData as any[]

            // Inicializa estatísticas
            const stats: any = {}
            clubs?.forEach(c => {
                stats[c.id] = {
                    name: c.name,
                    group: c.group_name,
                    pts: 0, v: 0, sg: 0, j: 0
                }
            })

            // Calcula pontos
            matches?.forEach(m => {
                if (!stats[m.home_team_id] || !stats[m.away_team_id]) return

                const home = stats[m.home_team_id]
                const away = stats[m.away_team_id]

                home.j++; away.j++;
                home.sg += (m.home_score - m.away_score)
                away.sg += (m.away_score - m.home_score)

                if (m.home_score > m.away_score) {
                    home.pts += 3; home.v++;
                } else if (m.away_score > m.home_score) {
                    away.pts += 3; away.v++;
                } else {
                    home.pts += 1; away.pts += 1;
                }
            })

            // Ordenação (Pts > V > SG)
            const sortFn = (a: any, b: any) => {
                if (b.pts !== a.pts) return b.pts - a.pts
                if (b.v !== a.v) return b.v - a.v
                return b.sg - a.sg
            }

            // Separa os grupos
            const allStats = Object.values(stats)
            setTableA(allStats.filter((t: any) => t.group === 'A').sort(sortFn))
            setTableB(allStats.filter((t: any) => t.group === 'B').sort(sortFn))
        }

        calculateTable()
        // Atualiza a cada 5 segundos
        const interval = setInterval(calculateTable, 5000)
        return () => clearInterval(interval)
    }, [])

    // Componente visual da tabelinha individual
    const RenderTable = ({ title, data }: { title: string, data: any[] }) => (
        <div className="mb-6 border rounded-lg overflow-hidden shadow-sm">
            <h3 className="font-bold text-green-900 bg-green-200 p-3 text-center uppercase tracking-wider text-sm">{title}</h3>
            <table className="w-full text-sm bg-white">
                <thead>
                    <tr className="text-gray-500 text-xs bg-gray-50 border-b">
                        <th className="text-left p-3 font-semibold">Clube</th>
                        <th className="p-2 font-semibold text-center">P</th>
                        <th className="p-2 font-semibold text-center">J</th>
                        <th className="p-2 font-semibold text-center">V</th>
                        <th className="p-2 font-semibold text-center">SG</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((team, index) => (
                        <tr key={index} className={`border-b last:border-0 hover:bg-gray-50 ${index < 4 ? 'bg-blue-50/50' : ''} ${index >= data.length - 2 ? 'bg-red-50/50' : ''}`}>
                            <td className="p-3 font-bold text-gray-700 truncate max-w-[140px] flex items-center gap-2">
                                <span className={`text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold ${index < 4 ? 'bg-blue-600 text-white' : (index >= data.length - 2 ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-500')}`}>
                                    {index + 1}
                                </span>
                                {team.name}
                            </td>
                            <td className="text-center font-bold text-gray-900">{team.pts}</td>
                            <td className="text-center text-gray-500">{team.j}</td>
                            <td className="text-center text-gray-500">{team.v}</td>
                            <td className="text-center text-gray-500">{team.sg}</td>
                        </tr>
                    ))}
                    {data.length === 0 && <tr><td colSpan={5} className="text-center py-4 text-gray-400 italic">Sem times no Grupo.</td></tr>}
                </tbody>
            </table>
        </div>
    )

    return (
        <div className="bg-white p-4 rounded-lg shadow sticky top-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4 text-gray-800 border-b pb-2 flex justify-between items-center">
                Classificação 📊
                <span className="text-xs font-normal text-green-600 animate-pulse">● Ao vivo</span>
            </h2>
            <RenderTable title="Grupo A" data={tableA} />
            <RenderTable title="Grupo B" data={tableB} />

            <div className="flex gap-4 justify-center text-[10px] mt-4 text-gray-500">
                <span className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-600 rounded-full"></div> Classificação</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 bg-red-600 rounded-full"></div> Torneio da Morte</span>
            </div>
        </div>
    )
}