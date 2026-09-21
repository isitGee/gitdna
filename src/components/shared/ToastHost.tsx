import { createContext, useCallback, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { Toast } from './Toast'

const ToastCtx = createContext<(m: string) => void>(() => {})
export function useToast() { return useContext(ToastCtx) }

export function ToastHost({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null)
  const show = useCallback((m: string) => setMsg(m), [])
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <Toast message={msg} onDone={() => setMsg(null)} />
    </ToastCtx.Provider>
  )
}
