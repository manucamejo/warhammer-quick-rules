import { useState } from 'react'
import { useMatchesStore } from '../store/matches'
import { Modal } from './Modal'

interface Props {
  onClose: () => void
}

export function NewPlayerModal({ onClose }: Props) {
  const addPlayer = useMatchesStore((s) => s.addPlayer)
  const [name, setName] = useState('')
  const canSave = name.trim().length > 0

  const handleSave = () => {
    if (!canSave) return
    addPlayer(name)
    onClose()
  }

  return (
    <Modal
      title="Nuevo jugador"
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-white/8 px-4 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/12"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="flex-1 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-[#1a1a1a] transition-opacity disabled:opacity-40"
          >
            Guardar
          </button>
        </div>
      }
    >
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/60">
          Nombre
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
          }}
          placeholder="Ej: Juan"
          autoFocus
          className="w-full rounded-xl border border-white/10 bg-white/8 px-3 py-2.5 text-sm text-white placeholder:text-white/45 focus:border-white/30 focus:outline-none"
        />
      </label>
    </Modal>
  )
}
