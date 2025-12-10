import React from 'react'

interface Player {
  id: string
  name: string
  position: string
  price: number
  status: string
  last_variation: number
  clubs: { 
    name: string
    shield_url: string 
    slug: string
  }
  x?: string 
  y?: string
}

interface SoccerFieldProps {
  players: Player[]
  scheme: string
  captainId: string | null
  onRemove: (player: Player) => void
}

export default function SoccerField({ players, scheme, captainId, onRemove }: SoccerFieldProps) {
  const goalkeepers = players.filter(p => p.position === 'gol')
  const defenders = players.filter(p => ['zag', 'lat'].includes(p.position))
  const midfielders = players.filter(p => p.position === 'mei')
  const attackers = players.filter(p => p.position === 'ata')
  const coach = players.filter(p => p.position === 'tec')

  // Componente do Pin (Bonequinho)
  const PlayerPin = ({ p }: { p: Player }) => {
    const isCaptain = captainId === p.id
    return (
      <div 
        className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer z-10 hover:z-20 transition-all hover:scale-110" 
        style={{ left: p.x, top: p.y }}
        onClick={() => onRemove(p)}
      >
        {/* Capitão Badge */}
        {isCaptain && (
          <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold border-2 border-white z-20 shadow-sm">
            C
          </div>
        )}

        {/* Círculo com Escudo */}
        <div className="w-12 h-12 rounded-full bg-white border-2 border-gray-200 overflow-hidden relative shadow-lg flex items-center justify-center">
           {p.clubs?.shield_url ? (
             <img src={p.clubs.shield_url} className="w-10 h-10 object-contain" alt={p.clubs.name} />
           ) : (
             <div className="bg-gray-100 w-full h-full"></div>
           )}
           {/* Hover X para remover */}
           <div className="absolute inset-0 bg-red-500/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 font-bold text-sm transition-opacity">
             🗑️
           </div>
        </div>

        {/* Nome do Jogador */}
        <div className="mt-1 bg-gray-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm backdrop-blur-sm truncate max-w-[80px] text-center border border-white/20">
          {p.name.split(' ')[0]}
        </div>
        
        {/* Preço (Opcional, pequeno) */}
        <div className="text-[9px] text-white font-bold drop-shadow-md mt-0.5">
          C$ {p.price.toFixed(2)}
        </div>
      </div>
    )
  }

  // Função auxiliar para distribuir jogadores na linha (horizontalmente)
  const distribute = (list: any[], topPos: string) => {
    return list.map((p, i) => ({
        ...p,
        y: topPos,
        x: `${(i + 1) * (100 / (list.length + 1))}%`
    }))
  }

  return (
    <div className="relative w-full max-w-md aspect-[3/4] bg-gradient-to-b from-green-600 to-green-700 rounded-xl border-4 border-white/20 shadow-2xl overflow-hidden mx-auto select-none">
      {/* Desenho do Campo (Linhas) */}
      <div className="absolute inset-x-0 top-0 h-px bg-white/20 top-1/2"></div> {/* Linha Meio Campo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/20 rounded-full"></div> {/* Círculo Central */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-20 border-b-2 border-x-2 border-white/20 rounded-b-lg"></div> {/* Grande Área Topo */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-20 border-t-2 border-x-2 border-white/20 rounded-t-lg"></div> {/* Grande Área Baixo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-8 border-b-2 border-x-2 border-white/20 rounded-b"></div> {/* Pequena Área Topo */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-8 border-t-2 border-x-2 border-white/20 rounded-t"></div> {/* Pequena Área Baixo */}

      {/* Camadas de Jogadores */}
      {distribute(attackers, '18%').map((p:any) => <PlayerPin key={p.id} p={p} />)}
      {distribute(midfielders, '45%').map((p:any) => <PlayerPin key={p.id} p={p} />)}
      {distribute(defenders, '72%').map((p:any) => <PlayerPin key={p.id} p={p} />)}
      {distribute(goalkeepers, '90%').map((p:any) => <PlayerPin key={p.id} p={p} />)}

      {/* Técnico */}
      <div className="absolute bottom-4 right-4 z-20">
         {coach.map(p => (
           <div key={p.id} className="flex flex-col items-center cursor-pointer group" onClick={() => onRemove(p)}>
             <div className="w-10 h-10 rounded-full bg-blue-900 border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-lg group-hover:bg-red-500 transition-colors">
                TEC
             </div>
             <span className="text-[9px] text-white font-bold bg-black/50 px-1 rounded mt-1">{p.name.split(' ')[0]}</span>
           </div>
         ))}
         {coach.length === 0 && <div className="text-white/30 text-xs font-bold">Técnico</div>}
      </div>
    </div>
  )
}