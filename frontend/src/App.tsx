import { useState } from 'react'
import TaskForm from './components/TaskForm'
import TaskList from './components/TaskList'
import { useTasks } from './hooks/useTasks'
import type { FilterType } from './types'

const FILTERS: { value: FilterType; label: string }[] = [
  { value: 'all',       label: 'Todas' },
  { value: 'pending',   label: 'Pendientes' },
  { value: 'completed', label: 'Completadas' },
]

export default function App() {
  const { tasks, loading, error, createTask, updateTask, deleteTask } = useTasks()
  const [filter, setFilter] = useState<FilterType>('all')

  const filtered = tasks.filter(t => {
    if (filter === 'pending')   return !t.completed
    if (filter === 'completed') return t.completed
    return true
  })

  const counts = {
    all:       tasks.length,
    pending:   tasks.filter(t => !t.completed).length,
    completed: tasks.filter(t => t.completed).length,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Task Manager</h1>
          </div>
          <p className="text-slate-500 text-sm ml-11">
            {counts.completed} de {counts.all} completadas
          </p>
        </header>

        {/* Form */}
        <TaskForm onCreate={createTask} />

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.07 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-2 mt-6 mb-4 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              {f.label}
              <span className={`ml-1.5 text-xs ${filter === f.value ? 'opacity-80' : 'text-slate-400'}`}>
                {counts[f.value]}
              </span>
            </button>
          ))}
        </div>

        {/* Task list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : (
          <TaskList tasks={filtered} onUpdate={updateTask} onDelete={deleteTask} />
        )}
      </div>
    </div>
  )
}
