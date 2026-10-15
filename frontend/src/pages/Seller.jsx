import {useEffect, useState} from 'react'
import {Link, useNavigate, useParams} from 'react-router'
import {apiFetch, getErrorMessage} from '../api'
import {useApi} from '../hooks'
import {money} from './Listings'
import {Badge} from './Orders'

const Forbidden = () => <p className="error">Only seller accounts can use this screen. Log in as Priya to try it.</p>

export function Dashboard() {
  const {data: d, status, loading} = useApi('/api/seller/dashboard/')
  if (loading) return <p>Loading...</p>
  if (status === 403) return <Forbidden />
  if (!d) return <p>Could not load the dashboard.</p>
  const max = Math.max(1, ...d.last_7_days.map(x => x.items))
  return (
    <div>
      <h2>Seller Dashboard</h2>
      <p><Link to="/seller/listings">My Listings</Link> | <Link to="/seller/orders">Seller Orders</Link></p>
      <div className="cards4">
        <div className="card"><small>Listings</small><h2>{d.total_listings}</h2></div>
        <div className="card"><small>Orders</small><h2>{d.total_orders}</h2></div>
        <div className="card"><small>Items sold</small><h2>{d.items_sold}</h2></div>
        <div className="card"><small>Revenue</small><h2>{money(d.revenue)}</h2></div>
      </div>
      <div className="banner">Still to hand over: <b>{d.still_to_hand_over}</b></div>
      <div className="card">
        <h4>Last 7 days (items)</h4>
        <div className="chart">
          {d.last_7_days.map(x => (
            <div key={x.date} className="barwrap">
              <div className="bar7" style={{height: `${(x.items / max) * 100}%`}} title={`${x.items} items`} />
              <small>{x.date.slice(5)}</small>
            </div>
          ))}
        </div>
      </div>
      <div className="two">
        <div className="card"><h4>Top listings</h4>
          {d.top_listings.length ? d.top_listings.map(t => <p key={t.title}>{t.title} - {t.quantity}</p>) : <p>Nothing sold yet.</p>}
        </div>
        <div className="card"><h4>Items by status</h4>
          {Object.entries(d.items_by_status).map(([s, n]) => <p key={s}><Badge s={s} /> {n}</p>)}
        </div>
      </div>
    </div>
  )
}

export function MyListings() {
  const [typed, setTyped] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const {data, status, loading, reload} = useApi(`/api/seller/listings/?page=${page}&search=${encodeURIComponent(search)}`)

  const remove = async id => {
    if (!window.confirm('Delete this listing?')) return
    const res = await apiFetch(`/api/listings/${id}/`, {method: 'DELETE'})
    if (res.status === 204) reload()
  }
  if (status === 403) return <Forbidden />
  return (
    <div>
      <h2>My Listings</h2>
      <div className="bar">
        <input placeholder="Search, press Enter" value={typed} onChange={e => setTyped(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { setSearch(typed.trim()); setPage(1) } }} />
        <Link className="btn" to="/seller/listings/new">Add Listing</Link>
      </div>
      {loading ? <p>Loading...</p> : data?.results?.map(l => (
        <div className="card row" key={l.id}>
          <img src={l.image_url} alt="" className="thumb" />
          <div><b>{l.title}</b><br /><small>{l.category} | {l.availability}</small></div>
          <b>{money(l.price)}</b>
          <Link to={`/seller/listings/${l.id}/edit`}>Edit</Link>
          <button className="link" onClick={() => remove(l.id)}>Delete</button>
        </div>
      ))}
      <div className="pager">
        <button disabled={!data?.previous} onClick={() => setPage(p => p - 1)}>Previous</button>
        <span>Page {page} of {data?.total_pages || 1}</span>
        <button disabled={!data?.next} onClick={() => setPage(p => p + 1)}>Next</button>
      </div>
    </div>
  )
}

const BLANK = {title: '', hostel: '', condition: 'Good', negotiable: 'false', category: 'Books', price: '',
  imageUrl: '', availability: 'Available', description: '', is_senior_deal: 'false'}

export function ListingForm() {
  const {id} = useParams()
  const navigate = useNavigate()
  const [f, setF] = useState(BLANK)
  const [error, setError] = useState('')
  const {data} = useApi(id ? `/api/listings/${id}/` : null)

  useEffect(() => {
    if (data) setF({...BLANK, ...data, price: data.price, negotiable: String(data.negotiable), is_senior_deal: String(data.is_senior_deal)})
  }, [data])

  const set = k => e => setF({...f, [k]: e.target.value})
  const save = async e => {
    e.preventDefault()
    setError('')
    const body = {title: f.title, hostel: f.hostel, condition: f.condition, category: f.category, price: f.price,
      imageUrl: f.imageUrl, availability: f.availability, description: f.description,
      negotiable: f.negotiable === 'true', is_senior_deal: f.is_senior_deal === 'true'}
    const res = await apiFetch(id ? `/api/listings/${id}/` : '/api/listings/', {method: id ? 'PATCH' : 'POST', body: JSON.stringify(body)})
    const out = await res.json()
    if (res.ok) navigate('/seller/listings'); else setError(getErrorMessage(out))
  }
  const yn = (k, label) => (
    <label>{label}<select value={f[k]} onChange={set(k)}><option value="true">Yes</option><option value="false">No</option></select></label>
  )
  return (
    <form className="card form" onSubmit={save}>
      <h2>{id ? 'Edit' : 'Add'} Listing</h2>
      <input placeholder="Title" value={f.title} onChange={set('title')} required />
      <input placeholder="Hostel (e.g. Hostel C)" value={f.hostel} onChange={set('hostel')} required />
      <select value={f.condition} onChange={set('condition')}>{['Like New', 'Good', 'Fair'].map(c => <option key={c}>{c}</option>)}</select>
      {yn('negotiable', 'Negotiable ')}
      <select value={f.category} onChange={set('category')}>{['Books', 'Electronics', 'Hostel Essentials', 'Cycles', 'Sports'].map(c => <option key={c}>{c}</option>)}</select>
      <input type="number" step="0.01" min="1" placeholder="Price" value={f.price} onChange={set('price')} required />
      <input placeholder="Image address (URL)" value={f.imageUrl} onChange={set('imageUrl')} />
      <select value={f.availability} onChange={set('availability')}><option>Available</option><option>Sold</option></select>
      <textarea placeholder="Description" value={f.description} onChange={set('description')} />
      {yn('is_senior_deal', 'Senior-Only Deal ')}
      {error && <p className="error">{error}</p>}
      <button className="btn">Save</button>
    </form>
  )
}

export function SellerOrders() {
  const [page, setPage] = useState(1)
  const {data, status, loading, reload} = useApi(`/api/seller/orders/?page=${page}`)
  const advance = async id => { await apiFetch(`/api/seller/orders/${id}/status/`, {method: 'PATCH'}); reload() }
  if (status === 403) return <Forbidden />
  if (loading) return <p>Loading...</p>
  return (
    <div>
      <h2>Seller Orders</h2>
      {!data?.results?.length && <p>No orders for your listings yet.</p>}
      {data?.results?.map(i => (
        <div className="card row" key={i.id}>
          <span>Order #{i.order_id}</span><b>{i.title}</b><span>x {i.quantity}</span>
          <b>{money(i.amount)}</b><Badge s={i.status} />
          {i.next_status && <button className="btn" onClick={() => advance(i.id)}>Mark {i.next_status}</button>}
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
