import { useState, type FormEvent } from 'react'
import type { CreateTaskPayload } from '../types'

interface Props {
  onCreate: (payload: CreateTaskPayload) => Promise<void>
}

export default function TaskForm({ onCreate }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    try {
      await onCreate({ title: title.trim(), description: description.trim() || undefined })
      setTitle('')
      setDescription('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <div className="flex gap-3">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Nueva tarea..."
          className="flex-1 px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-700 placeholder-slate-400"
        />
        <button
          type="submit"
          disabled={!title.trim() || submitting}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Añadiendo
            </span>
          ) : 'Añadir'}
        </button>
      </div>
      <input
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Descripción (opcional)"
        className="mt-3 w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-700 placeholder-slate-400 text-sm"
      />
    </form>
  )
}
