import {useEffect, useState} from 'react'
import {apiFetch} from './api'

export function useApi(path) {
  const [state, setState] = useState({data: null, status: null, loading: true})
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!path) return
    let off = false
    setState(s => ({...s, loading: true}))
    apiFetch(path)
      .then(async r => {
        let data = null
        try { data = await r.json() } catch {}
        if (!off) setState({data, status: r.status, loading: false})
      })
      .catch(() => !off && setState({data: null, status: 0, loading: false}))
    return () => { off = true }
  }, [path, tick])
  return {...state, reload: () => setTick(t => t + 1)}
}
