import {Link, Navigate, Outlet, Route, Routes, useNavigate} from 'react-router'
import {getAccessToken} from './api'
import {useApp} from './context'
import Home from './pages/Home'
import {Login, Register} from './pages/Auth'
import Listings from './pages/Listings'
import ListingDetail from './pages/ListingDetail'
import {Cart, Checkout} from './pages/CartCheckout'
import {Orders, OrderDetail} from './pages/Orders'
import {Dashboard, MyListings, ListingForm, SellerOrders} from './pages/Seller'

const Protected = () => (getAccessToken() === undefined ? <Navigate to="/login" replace /> : <Outlet />)

function Layout() {
  const {loggedIn, logout, cart} = useApp()
  const navigate = useNavigate()
  const onLogout = async () => { await logout(); navigate('/login') }
  return (
    <>
      <nav className="nav">
        <Link to="/" className="brand">CampusMart</Link>
        <Link to="/listings">Listings</Link>
        {loggedIn ? (
          <>
            <Link to="/cart">Cart ({cart.totalItems})</Link>
            <Link to="/orders">My Orders</Link>
            <Link to="/seller">Seller</Link>
            <button className="link" onClick={onLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </nav>
      <main className="page"><Outlet /></main>
    </>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/listings" element={<Listings />} />
        <Route path="/listings/:id" element={<ListingDetail />} />
        <Route element={<Protected />}>
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/seller" element={<Dashboard />} />
          <Route path="/seller/listings" element={<MyListings />} />
          <Route path="/seller/listings/new" element={<ListingForm />} />
          <Route path="/seller/listings/:id/edit" element={<ListingForm />} />
          <Route path="/seller/orders" element={<SellerOrders />} />
        </Route>
        <Route path="*" element={<div><h2>404 - Not Found</h2><Link to="/">Go home</Link></div>} />
      </Route>
    </Routes>
  )
}
