import { Site } from '@src/interfaces/site.interface'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

interface SiteStore {
  visible: boolean
  siteInfo?: Site
  showModal: (data: Site) => void
}

export const useSiteStore = create<SiteStore>()(
  devtools(
    immer((set, get) => ({
      visible: false,
      siteInfo: undefined,
      // showModal: (data) => set(() => ),
    })),
    { name: 'SiteStore' },
  ),
)
