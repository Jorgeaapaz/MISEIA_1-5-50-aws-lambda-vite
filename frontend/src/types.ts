export interface Task {
  id: string
  title: string
  description: string
  completed: boolean
  createdAt: string
  updatedAt: string
}

export type FilterType = 'all' | 'pending' | 'completed'

export interface CreateTaskPayload {
  title: string
  description?: string
}

export interface UpdateTaskPayload {
  title?: string
  description?: string
  completed?: boolean
}
