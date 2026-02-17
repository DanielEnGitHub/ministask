import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Button } from './ui/button'
import type { Sprint } from '@/lib/types'

interface SprintModalProps {
  open: boolean
  onClose: () => void
  onSave: (sprint: Partial<Sprint>) => void
  sprint?: Sprint | null
}

export function SprintModal({ open, onClose, onSave, sprint }: SprintModalProps) {
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [dateError, setDateError] = useState('')

  useEffect(() => {
    if (sprint) {
      setName(sprint.name)
      setGoal(sprint.goal || '')
      setStartDate(sprint.start_date ? sprint.start_date.slice(0, 10) : '')
      setEndDate(sprint.end_date ? sprint.end_date.slice(0, 10) : '')
    } else {
      resetForm()
    }
  }, [sprint, open])

  const resetForm = () => {
    setName('')
    setGoal('')
    setStartDate('')
    setEndDate('')
    setDateError('')
  }

  const validateDates = (start: string, end: string) => {
    if (start && end) {
      if (start >= end) {
        setDateError('La fecha de inicio debe ser anterior a la fecha de fin')
        return false
      }
    }
    setDateError('')
    return true
  }

  const handleStartDateChange = (value: string) => {
    setStartDate(value)
    validateDates(value, endDate)
  }

  const handleEndDateChange = (value: string) => {
    setEndDate(value)
    validateDates(startDate, value)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !startDate || !endDate) return
    if (!validateDates(startDate, endDate)) return

    const sprintData: Partial<Sprint> = {
      ...(sprint?.id && { id: sprint.id }),
      name: name.trim(),
      goal: goal.trim() || undefined,
      start_date: startDate,
      end_date: endDate,
    }

    onSave(sprintData)
    resetForm()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onClose={onClose} className="max-w-md">
        <DialogHeader>
          <DialogTitle>{sprint ? 'Editar Sprint' : 'Nuevo Sprint'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Nombre <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del sprint"
              required
            />
          </div>

          {/* Objetivo */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Objetivo
            </label>
            <Textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Objetivo del sprint (opcional)"
              rows={2}
            />
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Fecha Inicio <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Fecha Fin <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                required
              />
            </div>
          </div>
          {dateError && (
            <p className="text-sm text-red-600 -mt-2">{dateError}</p>
          )}

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!name.trim() || !startDate || !endDate || !!dateError}>
              {sprint ? 'Guardar Cambios' : 'Crear Sprint'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
