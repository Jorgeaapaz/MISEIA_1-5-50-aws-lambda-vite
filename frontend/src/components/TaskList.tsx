import TaskItem from './TaskItem'
import type { Task, UpdateTaskPayload } from '../types'

interface Props {
  tasks: Task[]
  onUpdate: (id: string, payload: UpdateTaskPayload) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export default function TaskList({ tasks, onUpdate, onDelete }: Props) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-sm">No hay tareas</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {tasks.map(task => (
        <TaskItem key={task.id} task={task} onUpdate={onUpdate} onDelete={onDelete} />
      ))}
    </div>
  )
}
