import {useState} from 'react'
import {Link, useNavigate} from 'react-router'
import {apiFetch, getErrorMessage} from '../api'
import {useApp} from '../context'
import {money} from './Listings'

export function Cart() {
  const {cart, updateQty, removeItem} = useApp()
  if (!cart.items.length) return <div><h2>Your cart is empty</h2><Link to="/listings">Browse listings</Link></div>
  return (
    <div>
      <h2>Cart</h2>
      {cart.items.map(i => (
        <div className="card row" key={i.rowId}>
          <div><b>{i.title}</b><br /><small>{i.condition} | {money(i.price)}</small></div>
          <div>
            <button onClick={() => updateQty(i.rowId, i.quantity - 1)}>-</button>
            <span className="q">{i.quantity}</span>
            <button onClick={() => updateQty(i.rowId, i.quantity + 1)}>+</button>
          </div>
          <b>{money(i.price * i.quantity)}</b>
          <button className="link" onClick={() => removeItem(i.rowId)}>Remove</button>
        </div>
      ))}
      <h3>Total: {money(cart.totalPrice)}</h3>
      <Link className="btn" to="/checkout">Checkout</Link>
    </div>
  )
}

export function Checkout() {
  const {cart, getCart} = useApp()
  const navigate = useNavigate()
  const [a, setA] = useState({full_name: '', phone: '', address: '', city: '', state: '', pincode: ''})
  const [payment, setPayment] = useState('COD')
  const [meetup, setMeetup] = useState('MAIN_GATE')
  const [error, setError] = useState('')

  const place = async e => {
    e.preventDefault()
    setError('')
    // send only payment, meetup and address
    const res = await apiFetch('/api/orders/', {
      method: 'POST', body: JSON.stringify({payment_method: payment, meetup_point: meetup, address: a}),
    })
    const data = await res.json()
    if (res.status === 201) { await getCart(); navigate(`/orders/${data.id}`) } else setError(getErrorMessage(data))
  }

  return (
    <form className="checkout" onSubmit={place}>
      <div className="card form">
        <h3>Your details</h3>
        {Object.keys(a).map(k => (
          <input key={k} placeholder={k.replace('_', ' ')} value={a[k]} required onChange={e => setA({...a, [k]: e.target.value})} />
        ))}
        <h3>Payment</h3>
        <select value={payment} onChange={e => setPayment(e.target.value)}>
          <option value="COD">Cash at Meetup</option>
          <option value="ONLINE">Pay Now</option>
        </select>
        <h3>Meetup point</h3>
        <select value={meetup} onChange={e => setMeetup(e.target.value)}>
          <option value="MAIN_GATE">Main Gate</option>
          <option value="LIBRARY">Library Steps</option>
          <option value="CANTEEN">Canteen</option>
        </select>
      </div>
      <div className="card">
        <h3>Your cart</h3>
        {cart.items.map(i => <p key={i.rowId}>{i.title} x {i.quantity} - {money(i.price * i.quantity)}</p>)}
        <h3>Total: {money(cart.totalPrice)}</h3>
        {error && <p className="error">{error}</p>}
        <button className="btn">Place Order</button>
      </div>
    </form>
  )
}
