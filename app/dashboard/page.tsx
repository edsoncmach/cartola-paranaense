'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import SoccerField from '@/components/SoccerField'

// --- CONFIGURAÇÃO TÁTICA ---
const SCHEMES: any = {
	'4-3-3': { label: '4-3-3', limits: { gol: 1, zag: 2, lat: 2, mei: 3, ata: 3, tec: 1 } },
	'4-4-2': { label: '4-4-2', limits: { gol: 1, zag: 2, lat: 2, mei: 4, ata: 2, tec: 1 } },
	'3-5-2': { label: '3-5-2', limits: { gol: 1, zag: 3, lat: 0, mei: 5, ata: 2, tec: 1 } },
	'3-4-3': { label: '3-4-3', limits: { gol: 1, zag: 3, lat: 0, mei: 4, ata: 3, tec: 1 } },
	'4-5-1': { label: '4-5-1', limits: { gol: 1, zag: 2, lat: 2, mei: 5, ata: 1, tec: 1 } },
}

// Tipos
type Player = {
	id: string; name: string; position: string; price: number; status: string;
	last_variation: number;
	clubs: { name: string; shield_url: string; slug: string };
	x?: string; y?: string;
}

type MyTeam = {
	id: string; balance: number; team_name: string; badge_url: string | null;
}

export default function Dashboard() {
	const router = useRouter()
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)

	// Estados
	const [players, setPlayers] = useState<Player[]>([])
	const [fantasyTeam, setFantasyTeam] = useState<MyTeam | null>(null)
	const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([])
	const [captainId, setCaptainId] = useState<string | null>(null)

	// Controle
	const [currentScheme, setCurrentScheme] = useState('4-3-3')
	const [filterPos, setFilterPos] = useState('ata')
	const [currentBalance, setCurrentBalance] = useState(100)

	// Mercado
	const [marketStatus, setMarketStatus] = useState({ isOpen: false, closeDate: null as Date | null })
	const [currentRoundId, setCurrentRoundId] = useState<number>(0)

	// 1. CARGA INICIAL
	useEffect(() => {
		async function loadData() {
			const { data: { user } } = await supabase.auth.getUser()
			if (!user) return router.push('/login')

			// Busca Time
			const { data: team } = await supabase.from('fantasy_teams').select('*').eq('user_id', user.id).single()
			if (!team) return router.push('/criar-time')

			setFantasyTeam({ id: team.id, balance: team.balance, team_name: team.name, badge_url: team.badge_url })
			setCurrentBalance(team.balance)

			// Busca Jogadores
			const { data: allPlayers } = await supabase.from('players').select(`*, clubs(name, shield_url, slug)`).order('price', { ascending: false })
			if (allPlayers) setPlayers(allPlayers)

			// Verifica Mercado
			const { data: round } = await supabase.from('rounds').select('*').eq('finished', false).order('id').limit(1).single()

			if (round) {
				setCurrentRoundId(round.id)
				setMarketStatus({ isOpen: new Date() < new Date(round.start_date), closeDate: new Date(round.start_date) })

				// Recupera escalação salva
				const { data: savedLineup } = await supabase.from('team_lineups').select('player_id, is_captain').eq('fantasy_team_id', team.id).eq('round_id', round.id)

				if (savedLineup && savedLineup.length > 0 && allPlayers) {
					const restoredPlayers = savedLineup.map((l: any) => allPlayers.find((p: any) => p.id === l.player_id)).filter(Boolean)
					const savedCaptain = savedLineup.find((l: any) => l.is_captain)
					setSelectedPlayers(restoredPlayers)
					if (savedCaptain) setCaptainId(savedCaptain.player_id)
				}
			}
			setLoading(false)
		}
		loadData()
	}, [])

	function changeScheme(newScheme: string) {
		if (selectedPlayers.length > 0 && !confirm('Mudar o esquema tático removerá todos os jogadores. Continuar?')) return
		setCurrentScheme(newScheme)
		setSelectedPlayers([])
		setCaptainId(null)
		if (fantasyTeam) setCurrentBalance(fantasyTeam.balance)
	}

	function togglePlayer(player: Player) {
		if (!marketStatus.isOpen) return alert('Mercado Fechado!')
		const isSelected = selectedPlayers.find(p => p.id === player.id)
		const limits = SCHEMES[currentScheme].limits

		if (isSelected) {
			// Vender
			setSelectedPlayers(prev => prev.filter(p => p.id !== player.id))
			setCurrentBalance(prev => prev + player.price)
			if (captainId === player.id) setCaptainId(null)
		} else {
			// Comprar
			if (selectedPlayers.length >= 12) return alert('Time completo! Venda alguém antes.')
			if (currentBalance < player.price) return alert('Sem cartoletas suficientes! 💸')
			const currentPosCount = selectedPlayers.filter(p => p.position === player.position).length
			const maxPos = limits[player.position] || 0
			if (currentPosCount >= maxPos) return alert(`Limite de ${player.position.toUpperCase()} atingido neste esquema.`)

			setSelectedPlayers(prev => [...prev, player])
			setCurrentBalance(prev => prev - player.price)
		}
	}

	async function sellAll() {
		if (!marketStatus.isOpen) return alert('Mercado Fechado!')
		if (selectedPlayers.length === 0) return
		if (!confirm('Vender todo o time e resetar escalação?')) return

		setSaving(true)
		try {
			const sellValue = selectedPlayers.reduce((acc, p) => acc + p.price, 0)
			const newBalance = currentBalance + sellValue

			await supabase.from('team_lineups').delete().match({ fantasy_team_id: fantasyTeam?.id, round_id: currentRoundId })
			await supabase.from('fantasy_teams').update({ balance: newBalance }).eq('id', fantasyTeam?.id)

			setSelectedPlayers([])
			setCaptainId(null)
			setCurrentBalance(newBalance)
			alert('Time vendido! 💰')
		} catch (error: any) { alert('Erro: ' + error.message) }
		finally { setSaving(false) }
	}

	async function saveLineup() {
		if (!marketStatus.isOpen) return alert('Mercado Fechado!')
		if (selectedPlayers.length < 12) return alert(`Time incompleto!`)
		if (!captainId) return alert('Escolha um CAPITÃO!')
		setSaving(true)

		await supabase.from('team_lineups').delete().match({ fantasy_team_id: fantasyTeam?.id, round_id: currentRoundId })
		const lineupToInsert = selectedPlayers.map(p => ({ fantasy_team_id: fantasyTeam?.id, player_id: p.id, round_id: currentRoundId, is_captain: p.id === captainId }))
		await supabase.from('team_lineups').insert(lineupToInsert)
		await supabase.from('fantasy_teams').update({ balance: currentBalance }).eq('id', fantasyTeam?.id)

		setSaving(false)
		alert('Escalação Salva! 🎩⚽')
	}

	if (loading) return <div className="p-10 text-center text-green-700 animate-pulse">Carregando vestiário...</div>

	const limits = SCHEMES[currentScheme].limits
	const filteredPlayers = players.filter(p => p.position === filterPos)
	const totalPrice = selectedPlayers.reduce((acc, p) => acc + p.price, 0)

	// ORDENA A LISTA DA DIREITA POR POSIÇÃO
	const sortedSelected = [...selectedPlayers].sort((a, b) => {
		const order = ['gol', 'lat', 'zag', 'mei', 'ata', 'tec']
		return order.indexOf(a.position) - order.indexOf(b.position)
	})

	return (
		<div className="min-h-screen bg-gray-100 pb-24">
			{/* HEADER */}
			<header className="bg-gradient-to-r from-green-800 to-green-600 text-white p-4 sticky top-0 z-30 shadow-lg">
				<div className="max-w-6xl mx-auto flex justify-between items-center">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 bg-white rounded-full p-0.5 shadow-md">
							{fantasyTeam?.badge_url ? <img src={fantasyTeam.badge_url} className="w-full h-full rounded-full object-cover" /> : <div className="text-gray-400 text-xl text-center leading-9">🛡️</div>}
						</div>
						<div>
							<h1 className="font-bold text-lg leading-tight">{fantasyTeam?.team_name}</h1>
							<Link href="/configuracoes" className="text-xs text-green-200 hover:text-white flex items-center gap-1">⚙️ Configurar</Link>
						</div>
					</div>
					<div className="text-right">
						<p className="text-xs opacity-80 uppercase tracking-wide">Patrimônio</p>
						<p className="text-2xl font-bold text-yellow-300 drop-shadow-sm">C$ {currentBalance.toFixed(2)}</p>
					</div>
				</div>
			</header>

			<main className="max-w-6xl mx-auto p-4 space-y-8">

				{/* --- SEÇÃO 1: SUA ESCALAÇÃO (CAMPINHO + LISTA) --- */}
				<section>
					<div className="flex justify-between items-end mb-4 border-b pb-2">
						<h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">Sua Escalação</h2>
						<div className="flex items-center gap-4">
							<select
								className="bg-white border border-gray-300 text-gray-700 font-bold py-1 px-3 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
								value={currentScheme}
								onChange={(e) => changeScheme(e.target.value)}
								disabled={!marketStatus.isOpen}
							>
								{Object.keys(SCHEMES).map(key => <option key={key} value={key}>{SCHEMES[key].label}</option>)}
							</select>
							<button onClick={sellAll} disabled={selectedPlayers.length === 0} className="text-red-500 font-bold text-sm hover:underline disabled:opacity-50">
								🗑️ Vender Tudo
							</button>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						{/* COLUNA ESQUERDA: CAMPINHO */}
						<div className="md:col-span-2">
							<SoccerField
								players={selectedPlayers}
								scheme={currentScheme}
								captainId={captainId}
								onRemove={togglePlayer}
							/>
						</div>

						{/* COLUNA DIREITA: LISTA DO TIME (Resumo) */}
						<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 h-fit">
							<h3 className="text-gray-400 font-bold text-xs uppercase mb-3 flex justify-between">
								<span>Jogadores ({selectedPlayers.length}/12)</span>
								<span>Preço</span>
							</h3>
							<div className="space-y-2">
								{sortedSelected.map(p => (
									<div key={p.id} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2 last:border-0">
										<div className="flex items-center gap-2">
											<span className={`text-[10px] font-bold px-1.5 py-0.5 rounded text-white min-w-[35px] text-center
                                ${p.position === 'gol' ? 'bg-yellow-500' :
													p.position === 'lat' ? 'bg-blue-500' :
														p.position === 'zag' ? 'bg-blue-600' :
															p.position === 'mei' ? 'bg-green-500' :
																p.position === 'ata' ? 'bg-red-500' : 'bg-gray-500'}`}>
												{p.position.toUpperCase()}
											</span>
											<div className="flex flex-col">
												<span className={`font-bold text-gray-700 ${captainId === p.id ? 'text-orange-600' : ''}`}>
													{p.name} {captainId === p.id && '©'}
												</span>
											</div>
										</div>
										<span className="font-mono text-gray-600">C$ {p.price.toFixed(2)}</span>
									</div>
								))}
								{selectedPlayers.length === 0 && (
									<div className="text-center text-gray-400 py-10 text-sm">
										Seu time está vazio.<br />Compre jogadores abaixo! 👇
									</div>
								)}
							</div>
							<div className="mt-4 pt-4 border-t border-gray-100 flex justify-between font-bold text-gray-800">
								<span>Valor do Time</span>
								<span>C$ {totalPrice.toFixed(2)}</span>
							</div>
						</div>
					</div>
				</section>

				{/* --- SEÇÃO 2: MERCADO (COMPRA) --- */}
				<section className="pt-8 border-t-4 border-gray-200">
					<h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
						🛒 Mercado de Transferências
						<span className={`text-xs px-2 py-0.5 rounded-full ${marketStatus.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
							{marketStatus.isOpen ? 'ABERTO' : 'FECHADO'}
						</span>
					</h2>

					{/* Filtros de Posição */}
					<div className="flex overflow-x-auto gap-2 mb-6 pb-2">
						{['gol', 'zag', 'lat', 'mei', 'ata', 'tec'].map((pos) => {
							const count = selectedPlayers.filter(p => p.position === pos).length
							const max = limits[pos] || 0
							if (max === 0) return null
							return (
								<button key={pos} onClick={() => setFilterPos(pos)}
									className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border shadow-sm ${filterPos === pos ? 'bg-green-600 text-white border-green-600 ring-2 ring-green-300' :
											count >= max ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
										}`}
								>
									{pos.toUpperCase()} <span className="text-xs ml-1 opacity-70">({count}/{max})</span>
								</button>
							)
						})}
					</div>

					{/* Lista de Compra */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
						{filteredPlayers.map((player) => {
							const isSelected = selectedPlayers.find(p => p.id === player.id)
							const isCaptain = captainId === player.id
							const canBuy = currentBalance >= player.price && marketStatus.isOpen

							return (
								<div key={player.id} className={`bg-white p-3 rounded-lg shadow-sm border flex items-center justify-between transition hover:shadow-md ${isSelected ? 'border-green-500 bg-green-50' : 'border-gray-100'}`}>
									<div className="flex items-center gap-3 overflow-hidden">
										<img src={player.clubs?.shield_url} className="w-10 h-10 object-contain" alt="escudo" />
										<div className="min-w-0">
											<h3 className="font-bold text-gray-800 text-sm truncate">{player.name}</h3>
											<p className="text-xs text-gray-500 truncate">{player.clubs?.name}</p>
										</div>
									</div>

									<div className="text-right flex flex-col items-end gap-1">
										<div className="text-sm font-bold text-gray-700">C$ {player.price.toFixed(2)}</div>
										{player.last_variation !== 0 && (
											<span className={`text-[10px] font-bold flex items-center ${player.last_variation > 0 ? 'text-green-600' : 'text-red-500'}`}>
												{player.last_variation > 0 ? '▲' : '▼'} {Math.abs(player.last_variation).toFixed(2)}
											</span>
										)}

										{isSelected ? (
											<div className="flex gap-1 mt-1">
												<button onClick={() => setCaptainId(player.id)} className={`w-6 h-6 rounded-full border text-[10px] font-bold flex items-center justify-center ${isCaptain ? 'bg-orange-500 text-white border-orange-600' : 'bg-white text-gray-400 hover:border-orange-500 hover:text-orange-500'}`} title="Capitão">C</button>
												<button onClick={() => togglePlayer(player)} className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-bold hover:bg-red-200">Vender</button>
											</div>
										) : (
											<button
												onClick={() => togglePlayer(player)}
												disabled={!canBuy}
												className={`px-3 py-1 rounded text-xs font-bold mt-1 ${canBuy ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
											>
												Comprar
											</button>
										)}
									</div>
								</div>
							)
						})}
					</div>
				</section>
			</main>

			{/* FLOAT SAVE BUTTON (Ajustado para não bater no menu) */}
      <div className="fixed bottom-24 left-0 right-0 flex justify-center z-40 px-4">
         <button
           onClick={saveLineup}
           disabled={saving || !marketStatus.isOpen}
           className={`shadow-2xl font-bold py-4 px-10 rounded-full transition transform hover:scale-105 border-4 border-white ${
             !marketStatus.isOpen ? 'bg-gray-500 cursor-not-allowed' :
             (captainId && selectedPlayers.length === 12) ? 'bg-green-600 text-white hover:bg-green-500' : 'bg-yellow-400 text-yellow-900'
           }`}
         >
           {saving ? 'Salvando...' : (selectedPlayers.length === 12 && captainId ? 'CONFIRMAR ESCALAÇÃO ✅' : `ESCALAR TIME (${selectedPlayers.length}/12)`)}
         </button>
      </div>

      {/* --- NOVO MENU DE NAVEGAÇÃO --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-2 pb-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50">
           <Link href="/dashboard" className="flex flex-col items-center px-4 py-1 rounded text-green-600">
              <span className="text-2xl">🏟️</span>
              <span className="text-[10px] font-bold uppercase mt-1">Escalar</span>
           </Link>
           <Link href="/ligas" className="flex flex-col items-center px-4 py-1 rounded text-gray-400 hover:text-green-500">
              <span className="text-2xl">🏆</span>
              <span className="text-[10px] font-bold uppercase mt-1">Ligas</span>
           </Link>
           <Link href="/ranking" className="flex flex-col items-center px-4 py-1 rounded text-gray-400 hover:text-green-500">
              <span className="text-2xl">🌎</span>
              <span className="text-[10px] font-bold uppercase mt-1">Ranking</span>
           </Link>
           <Link href="/jogos" className="flex flex-col items-center px-4 py-1 rounded text-gray-400 hover:text-green-500">
              <span className="text-2xl">📅</span>
              <span className="text-[10px] font-bold uppercase mt-1">Jogos</span>
           </Link>
      </div>
		</div>
	)
}