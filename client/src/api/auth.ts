import { api } from './request'

export interface User {
  id: string
  username: string
  name: string
  role: string
  status: string
  token: string
}

export const authApi = {
  login: (username: string, password: string) =>
    api.post<{ success: boolean; data: User }>('/users/login', { username, password }),
}
