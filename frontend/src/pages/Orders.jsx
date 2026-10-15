import {useState} from 'react'
import {Link, useParams} from 'react-router'
import {apiFetch, getErrorMessage} from '../api'
import {useApi} from '../hooks'
import {money} from './Listings'

export const Badge = ({s}) => <span className={`badge ${s}`}>{s}</span>
const MEETUP = {MAIN_GATE: 'Main Gate', LIBRARY: 'Library Steps', CANTEEN: 'Canteen'}

export function Orders() {
  const [page, setPage] = useState(1)
  const {data, loading} = useApi(`/api/orders/?page=${page}`)
  if (loading) return <p>Loading...</p>
  return (
    <div>
      <h2>My Orders</h2>
      {!data?.results?.length && <p>No orders yet.</p>}
      {data?.results?.map(o => (
        <div className="card row" key={o.id}>
          <div><b>Order #{o.id}</b><br /><small>{new Date(o.created_at).toLocaleDateString()}</small></div>
          <Badge s={o.status} />
          <span>{o.total_items} items</span>
          <b>{money(o.total_price)}</b>
          <Link to={`/orders/${o.id}`}>View Details</Link>
        </div>
      ))}
      <div className="pager">
        <button disabled={!data?.previous} onClick={() => setPage(p => p - 1)}>Previous</button>
        <span>Page {page}</span>
        <button disabled={!data?.next} onClick={() => setPage(p => p + 1)}>Next</button>
      </div>
    </div>
  )
}

export function OrderDetail() {
  const {id} = useParams()
  const {data: o, status, loading, reload} = useApi(`/api/orders/${id}/`)
  const [error, setError] = useState('')
  if (loading) return <p>Loading...</p>
  if (status === 404 || !o) return <p>Order not found.</p>

  const cancel = async () => {
    const res = await apiFetch(`/api/orders/${id}/cancel/`, {method: 'POST'})
    if (res.ok) reload(); else setError(getErrorMessage(await res.json()))
  }
  return (
    <div>
      <h2>Order #{o.id} <Badge s={o.status} /></h2>
      {o.items.map(i => (
        <div className="card row" key={i.id}>
          <img src={i.image_url} alt="" className="thumb" />
          <div><b>{i.title}</b><br /><small>{i.hostel} | {i.condition}</small></div>
          <span>x {i.quantity}</span><b>{money(i.price * i.quantity)}</b><Badge s={i.status} />
        </div>
      ))}
      <div className="card">
        <p><b>Meetup:</b> {MEETUP[o.meetup_point]}</p>
        <p><b>Address:</b> {o.address.full_name}, {o.address.phone}, {o.address.address}, {o.address.city}, {o.address.state} {o.address.pincode}</p>
        <p><b>Payment:</b> {o.payment_method === 'COD' ? 'Cash at Meetup' : 'Pay Now'} | {o.is_paid ? 'Paid' : 'Not paid yet'}</p>
        <p><b>Total:</b> {money(o.total_price)}</p>
        {error && <p className="error">{error}</p>}
        {o.can_cancel && <button className="btn danger" onClick={cancel}>Cancel order</button>}
      </div>
    </div>
  )
}
