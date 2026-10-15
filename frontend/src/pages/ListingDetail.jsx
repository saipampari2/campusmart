import {useState} from 'react'
import {Link, useNavigate, useParams} from 'react-router'
import {getAccessToken, getErrorMessage} from '../api'
import {useApp} from '../context'
import {useApi} from '../hooks'
import {ListingCard, money} from './Listings'

export default function ListingDetail() {
  const {id} = useParams()
  const {addToCart} = useApp()
  const navigate = useNavigate()
  const [qty, setQty] = useState(1)
  const [msg, setMsg] = useState('')
  const {data: l, status, loading} = useApi(`/api/listings/${id}/`)
  const similar = useApi(l ? `/api/listings/?category=${encodeURIComponent(l.category)}&page_size=5` : null)

  if (loading) return <p>Loading...</p>
  if (status === 401) return <div className="banner">This is a Senior-Only Deal. <Link to="/login">Log in</Link> to see it.</div>
  if (status === 404 || !l) return <p>Listing not found.</p>

  const add = async () => {
    if (getAccessToken() === undefined) { navigate('/login'); return }
    const res = await addToCart(l.id, Number(qty))
    setMsg(res.ok ? 'Added to cart!' : getErrorMessage(await res.json()))
  }

  return (
    <div>
      <div className="detail">
        <img src={l.imageUrl} alt={l.title} />
        <div>
          <h2>{l.title}</h2>
          <p>{l.hostel} | {l.condition} {l.negotiable && <span className="tag">Negotiable</span>}</p>
          <h3>{money(l.price)}</h3>
          <p>Rating {l.rating} ({l.total_reviews} reviews) | {l.availability}</p>
          <p>{l.description}</p>
          <input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} className="qty" />
          <button className="btn" onClick={add} disabled={l.availability !== 'Available'}>ADD TO CART</button>
          {msg && <p>{msg}</p>}
        </div>
      </div>
      <h3>Similar listings</h3>
      <div className="strip">
        {similar.data?.results?.filter(s => s.id !== l.id).slice(0, 4).map(s => <ListingCard key={s.id} l={s} />)}
      </div>
    </div>
  )
}
