import { getComponents } from 'nextra-theme-docs'
import RepoMeta from './components/RepoMeta'

export function useMDXComponents(components?: Record<string, any>) {
  return {
    ...getComponents({ components: components as any }),
    RepoMeta
  }
}
