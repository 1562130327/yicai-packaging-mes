import { api } from './request'

// 使用共享类型
export type { MachineStatus } from '../../../packages/shared/machine.js'
export { MACHINE_STATUS_RULES, getMachineStatusLabel, getMachineStatusStyle, canTransitionMachine } from '../../../packages/shared/machine.js'

import type { MachineStatus } from '../../../packages/shared/machine.js'

export interface Machine {
  id: string
  code: string
  name: string
  type: string
  status: MachineStatus
  processTypes: string[]
  workshop: string
}

export const machinesApi = {
  list: () => api.get<{ success: boolean; data: Machine[] }>('/machines'),
  updateStatus: (id: string, status: string) =>
    api.put<{ success: boolean }>(`/machines/${id}/status`, { status }),
}
