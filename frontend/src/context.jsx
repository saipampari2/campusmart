import {createContext, useCallback, useContext, useEffect, useState} from 'react'
import {apiFetch, clearTokens, getAccessToken, getRefreshToken, saveTokens} from './api'

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

const EMPTY = {items: [], totalItems: 0, totalPrice: 0}

// rowId is for the cart row, listingId is for the listing
const formatCartItem = i => ({
  rowId: i.id, listingId: i.listing, title: i.listing_title,
  condition: i.listing_condition, price: Number(i.listing_price), quantity: i.quantity,
})

export function AppProvider({children}) {
  const [loggedIn, setLoggedIn] = useState(Boolean(getAccessToken()))
  const [cart, setCart] = useState(EMPTY)

  const getCart = useCallback(async () => {
    if (getAccessToken() === undefined) { setCart(EMPTY); return }
    const res = await apiFetch('/api/cart/')
    if (res.ok) {
      const d = await res.json()
      setCart({items: d.items.map(formatCartItem), totalItems: d.total_items, totalPrice: Number(d.total_price)})
    }
  }, [])

  useEffect(() => { getCart() }, [loggedIn, getCart])

  const login = tokens => { saveTokens(tokens); setLoggedIn(true) }

  const logout = async () => {
    try {
      await apiFetch('/api/users/logout/', {method: 'POST', body: JSON.stringify({refresh: getRefreshToken()})})
    } finally {
      clearTokens()
      setLoggedIn(false)
    }
  }

  const addToCart = async (listingId, quantity = 1) => {
    const res = await apiFetch('/api/cart/add/', {method: 'POST', body: JSON.stringify({listing: listingId, quantity})})
    await getCart()
    return res
  }
  const removeItem = async rowId => { await apiFetch(`/api/cart/items/${rowId}/`, {method: 'DELETE'}); await getCart() }
  const updateQty = async (rowId, quantity) => {
    if (quantity < 1) return removeItem(rowId)
    await apiFetch(`/api/cart/items/${rowId}/`, {method: 'PATCH', body: JSON.stringify({quantity})})
    await getCart()
  }

  return (
    <Ctx.Provider value={{loggedIn, login, logout, cart, getCart, addToCart, removeItem, updateQty}}>
      {children}
    </Ctx.Provider>
  )
}
