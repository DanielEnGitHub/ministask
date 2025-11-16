import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    // Cargar tema desde localStorage o usar 'light' por defecto
    const savedTheme = localStorage.getItem('theme') as Theme | null
    return savedTheme || 'light'
  })

  useEffect(() => {
    // Aplicar tema al elemento root
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)

    // Guardar tema en localStorage
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light')
  }

  return { theme, toggleTheme }
}
