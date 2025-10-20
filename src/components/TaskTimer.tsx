import { useState, useEffect, useCallback } from 'react'
import { Play, Pause, Square, Clock } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'
import type { Task } from '@/lib/types'

interface TaskTimerProps {
  task: Task
  onUpdateTask: (task: Task) => void
  compact?: boolean
  readOnly?: boolean
}

export function TaskTimer({ task, onUpdateTask, compact = false, readOnly = false }: TaskTimerProps) {
  const [currentTime, setCurrentTime] = useState(Date.now())

  // Actualizar el tiempo cada segundo cuando el timer está corriendo
  useEffect(() => {
    if (task.timeTracking?.isRunning) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now())
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [task.timeTracking?.isRunning])

  // Calcular el tiempo total acumulado
  const getTotalMinutes = useCallback((): number => {
    if (!task.timeTracking) return 0

    let total = task.timeTracking.trackedMinutes

    // Si está corriendo, agregar el tiempo desde que se inició
    if (task.timeTracking.isRunning && task.timeTracking.startTime) {
      const elapsed = (currentTime - new Date(task.timeTracking.startTime).getTime()) / 1000 / 60
      total += elapsed
    }

    return total
  }, [task.timeTracking, currentTime])

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.floor(minutes % 60)
    const secs = Math.floor((minutes * 60) % 60)

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const isOverTime = (): boolean => {
    if (!task.timeTracking?.estimatedMinutes) return false
    return getTotalMinutes() > task.timeTracking.estimatedMinutes
  }

  const handleStart = () => {
    const now = new Date()
    const newSession = {
      id: Date.now().toString(),
      startTime: now,
      minutes: 0
    }

    onUpdateTask({
      ...task,
      timeTracking: {
        ...task.timeTracking,
        trackedMinutes: task.timeTracking?.trackedMinutes || 0,
        isRunning: true,
        startTime: now,
        sessions: [...(task.timeTracking?.sessions || []), newSession]
      }
    })
  }

  const handlePause = () => {
    if (!task.timeTracking?.startTime) return

    const now = new Date()
    const elapsed = (now.getTime() - new Date(task.timeTracking.startTime).getTime()) / 1000 / 60
    const sessions = [...(task.timeTracking.sessions || [])]
    const lastSession = sessions[sessions.length - 1]

    if (lastSession && !lastSession.endTime) {
      lastSession.endTime = now
      lastSession.minutes = elapsed
    }

    onUpdateTask({
      ...task,
      timeTracking: {
        ...task.timeTracking,
        trackedMinutes: (task.timeTracking.trackedMinutes || 0) + elapsed,
        isRunning: false,
        startTime: undefined,
        sessions
      }
    })
  }

  const handleStop = () => {
    if (!task.timeTracking) return

    if (task.timeTracking.isRunning) {
      handlePause()
    }

    // Reset timer
    onUpdateTask({
      ...task,
      timeTracking: {
        ...task.timeTracking,
        trackedMinutes: 0,
        isRunning: false,
        startTime: undefined,
        sessions: []
      }
    })
  }

  const totalMinutes = getTotalMinutes()
  const overtime = isOverTime()

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Clock className={cn(
          "h-4 w-4",
          overtime ? "text-red-500" : "text-gray-500"
        )} />
        <span className={cn(
          "text-sm font-mono",
          overtime ? "text-red-600 font-bold" : "text-gray-700"
        )}>
          {formatTime(totalMinutes)}
        </span>
        {task.timeTracking?.estimatedMinutes && (
          <span className="text-xs text-gray-500">
            / {formatTime(task.timeTracking.estimatedMinutes)}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className={cn(
            "h-5 w-5",
            overtime ? "text-red-500" : "text-gray-500"
          )} />
          <div>
            <div className={cn(
              "text-2xl font-mono font-bold",
              overtime ? "text-red-600" : "text-gray-900"
            )}>
              {formatTime(totalMinutes)}
            </div>
            {task.timeTracking?.estimatedMinutes && (
              <div className="text-xs text-gray-500">
                Estimado: {formatTime(task.timeTracking.estimatedMinutes)}
                {overtime && (
                  <span className="text-red-600 font-medium ml-2">
                    (+{formatTime(totalMinutes - task.timeTracking.estimatedMinutes)} extra)
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-2">
            {!task.timeTracking?.isRunning ? (
              <Button
                onClick={handleStart}
                size="sm"
                variant="default"
              >
                <Play className="h-4 w-4 mr-1" />
                Iniciar
              </Button>
            ) : (
              <Button
                onClick={handlePause}
                size="sm"
                variant="secondary"
              >
                <Pause className="h-4 w-4 mr-1" />
                Pausar
              </Button>
            )}

            {(task.timeTracking?.trackedMinutes || 0) > 0 && (
              <Button
                onClick={handleStop}
                size="sm"
                variant="outline"
              >
                <Square className="h-4 w-4 mr-1" />
                Detener
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Alerta de tiempo excedido */}
      {overtime && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800 font-medium">
            ⚠️ Tiempo estimado excedido
          </p>
          <p className="text-xs text-red-600 mt-1">
            Has superado el tiempo estimado en {formatTime(totalMinutes - (task.timeTracking?.estimatedMinutes || 0))}
          </p>
        </div>
      )}

      {/* Historial de sesiones */}
      {task.timeTracking && task.timeTracking.sessions.length > 0 && (
        <div className="border-t pt-3">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
            Sesiones de trabajo ({task.timeTracking.sessions.length})
          </p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {task.timeTracking.sessions.slice().reverse().map((session) => (
              <div key={session.id} className="text-xs text-gray-600 flex justify-between">
                <span>
                  {new Date(session.startTime).toLocaleTimeString()}
                  {session.endTime && ` - ${new Date(session.endTime).toLocaleTimeString()}`}
                </span>
                <span className="font-mono">
                  {formatTime(session.minutes)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
