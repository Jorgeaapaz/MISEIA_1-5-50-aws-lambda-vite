import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/tasks'
import type { Task, CreateTaskPayload, UpdateTaskPayload } from '../types'

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.list()
      setTasks(data.sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const createTask = async (payload: CreateTaskPayload) => {
    const task = await api.create(payload)
    setTasks(prev => [task, ...prev])
  }

  const updateTask = async (id: string, payload: UpdateTaskPayload) => {
    const updated = await api.update(id, payload)
    setTasks(prev => prev.map(t => (t.id === id ? updated : t)))
  }

  const deleteTask = async (id: string) => {
    await api.delete(id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  return { tasks, loading, error, createTask, updateTask, deleteTask }
}
