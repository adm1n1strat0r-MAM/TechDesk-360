import { createContext, useContext } from 'react'

export const AuthContext = createContext({
  user: null,
  onNavigate: () => {},
  onLogout: () => {},
})

export const useAuth = () => useContext(AuthContext)
