import { useState, type KeyboardEvent } from 'react'
import type { Task, UpdateTaskPayload } from '../types'

interface Props {
  task: Task
  onUpdate: (id: string, payload: UpdateTaskPayload) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export default function TaskItem({ task, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDesc, setEditDesc] = useState(task.description)
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const withLoading = async (fn: () => Promise<void>) => {
    setLoading(true)
    try { await fn() } finally { setLoading(false) }
  }

  const toggle = () => withLoading(() => onUpdate(task.id, { completed: !task.completed }))

  const saveEdit = async () => {
    if (!editTitle.trim()) return
    await withLoading(() => onUpdate(task.id, { title: editTitle.trim(), description: editDesc.trim() }))
    setEditing(false)
  }

  const cancelEdit = () => {
    setEditing(false)
    setEditTitle(task.title)
    setEditDesc(task.description)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter')  void saveEdit()
    if (e.key === 'Escape') cancelEdit()
  }

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
      return
    }
    void withLoading(() => onDelete(task.id))
  }

  return (
    <div className={`group bg-white rounded-xl border transition-all duration-200 ${
      task.completed
        ? 'border-slate-100 opacity-70'
        : 'border-slate-200 hover:border-blue-200 hover:shadow-sm'
    } p-4`}>
      <div className="flex items-start gap-3">
        {/* Toggle button */}
        <button
          onClick={() => void toggle()}
          disabled={loading}
          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
            task.completed ? 'bg-blue-500 border-blue-500' : 'border-slate-300 hover:border-blue-400'
          }`}
        >
          {task.completed && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <>
              <input
                autoFocus
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full font-medium text-slate-800 bg-slate-50 border border-blue-300 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Descripción"
                className="mt-1 w-full text-sm text-slate-500 bg-slate-50 border border-blue-200 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-300"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => void saveEdit()}
                  className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Guardar
                </button>
                <button
                  onClick={cancelEdit}
                  className="text-xs px-3 py-1 text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </>
          ) : (
            <>
              <p className={`font-medium ${task.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                {task.title}
              </p>
              {task.description && (
                <p className="text-sm text-slate-500 mt-0.5">{task.description}</p>
              )}
            </>
          )}
        </div>

        {/* Action buttons */}
        {!editing && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button
              onClick={() => setEditing(true)}
              title="Editar"
              className="p-1.5 text-slate-400 hover:text-blue-500 rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              title={confirmDelete ? 'Confirmar eliminación' : 'Eliminar'}
              className={`p-1.5 rounded transition-colors ${
                confirmDelete ? 'text-red-500 bg-red-50' : 'text-slate-400 hover:text-red-500'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
