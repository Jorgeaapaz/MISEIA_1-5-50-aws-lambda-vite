import type { Task, CreateTaskPayload, UpdateTaskPayload } from '../types'

const BASE_URL = import.meta.env.VITE_API_URL as string

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Request failed')
  return data as T
}

export const api = {
  list:   ()                                    => request<Task[]>('/tasks'),
  create: (payload: CreateTaskPayload)          => request<Task>('/tasks', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: string, payload: UpdateTaskPayload) => request<Task>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  delete: (id: string)                          => request<{ deleted: boolean }>(`/tasks/${id}`, { method: 'DELETE' }),
}
