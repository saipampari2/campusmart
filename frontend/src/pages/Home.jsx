import {Link} from 'react-router'

export default function Home() {
  return (
    <section className="hero">
      <h1>CampusMart</h1>
      <p>Buy and sell books, electronics, cycles and hostel essentials with students on your campus.</p>
      <Link className="btn" to="/listings">Browse listings</Link>
    </section>
  )
}
