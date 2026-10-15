import {useState} from 'react'
import {Link} from 'react-router'
import {useApi} from '../hooks'

export const money = v => `₹${Number(v).toFixed(2)}`

export function ListingCard({l}) {
  return (
    <Link to={`/listings/${l.id}`} className="card lcard">
      <img src={l.imageUrl} alt={l.title} />
      <h4>{l.title}</h4>
      <small>{l.hostel} | {l.condition}</small>
      <div>
        {l.negotiable && <span className="tag">Negotiable</span>}
        {l.is_senior_deal && <span className="tag gold">Senior Deal</span>}
        {l.availability === 'Sold' && <span className="tag red">Sold</span>}
      </div>
      <b>{money(l.price)}</b> <small>Rating {l.rating}</small>
    </Link>
  )
}

const CATEGORIES = ['Books', 'Electronics', 'Hostel Essentials', 'Cycles', 'Sports']
const HOSTELS = ['Hostel A', 'Hostel B', 'Hostel C', 'Hostel D', 'Hostel E']

export default function Listings() {
  const [f, setF] = useState({category: '', hostel: '', rating: '', ordering: '', search: '', page: 1})
  const [typed, setTyped] = useState('')
  const set = (k, v) => setF(p => ({...p, [k]: v, page: 1}))

  const q = new URLSearchParams()
  Object.entries(f).forEach(([k, v]) => v && q.set(k, v))
  const {data, loading} = useApi(`/api/listings/?${q}`)
  const senior = useApi('/api/listings/?is_senior_deal=true&page_size=6')

  return (
    <div>
      <h2>Senior-Only Deals</h2>
      {senior.status === 401 ? (
        <div className="banner">Senior-Only Deals are for members. <Link to="/login">Log in</Link> to see them.</div>
      ) : (
        <div className="strip">{senior.data?.results?.map(l => <ListingCard key={l.id} l={l} />)}</div>
      )}

      <div className="layout">
        <aside className="card filters">
          <h4>Category</h4>
          <label><input type="radio" checked={f.category === ''} onChange={() => set('category', '')} /> All</label>
          {CATEGORIES.map(c => (
            <label key={c}><input type="radio" checked={f.category === c} onChange={() => set('category', c)} /> {c}</label>
          ))}
          <h4>Hostel</h4>
          <label><input type="radio" checked={f.hostel === ''} onChange={() => set('hostel', '')} /> All</label>
          {HOSTELS.map(h => (
            <label key={h}><input type="radio" checked={f.hostel === h} onChange={() => set('hostel', h)} /> {h}</label>
          ))}
          <h4>Rating</h4>
          {[4, 3, 2, 1].map(r => (
            <label key={r}><input type="radio" checked={f.rating === String(r)} onChange={() => set('rating', String(r))} /> {r}Rating and up</label>
          ))}
          <button className="link" onClick={() => set('rating', '')}>Clear rating</button>
        </aside>

        <section>
          <div className="bar">
            <input
              placeholder="Search title or hostel, press Enter"
              value={typed}
              onChange={e => setTyped(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && set('search', typed.trim())}
            />
            <select value={f.ordering} onChange={e => set('ordering', e.target.value)}>
              <option value="">Sort</option>
              <option value="price">Price: Low-High</option>
              <option value="-price">Price: High-Low</option>
              <option value="-rating">Rating</option>
            </select>
          </div>
          {loading ? <p>Loading...</p> : data?.results?.length ? (
            <div className="grid">{data.results.map(l => <ListingCard key={l.id} l={l} />)}</div>
          ) : <p>No listings found.</p>}
          {data && (
            <div className="pager">
              <button disabled={!data.previous} onClick={() => setF(p => ({...p, page: p.page - 1}))}>Previous</button>
              <span>Page {f.page} of {data.total_pages || 1} ({data.count} listings)</span>
              <button disabled={!data.next} onClick={() => setF(p => ({...p, page: p.page + 1}))}>Next</button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
