import {useState} from 'react'
import {Link, useLocation, useNavigate} from 'react-router'
import {apiFetch, getErrorMessage} from '../api'
import {useApp} from '../context'

export function Login() {
  const [f, setF] = useState({username: '', password: ''})
  const [error, setError] = useState('')
  const {login} = useApp()
  const navigate = useNavigate()
  const location = useLocation()

  const submit = async e => {
    e.preventDefault()
    setError('')
    const res = await apiFetch('/api/users/login/', {method: 'POST', body: JSON.stringify(f)})
    const data = await res.json()
    if (res.ok) { login(data); navigate(location.state?.from || '/listings', {replace: true}) } else setError(getErrorMessage(data))
  }
  return (
    <form className="card form" onSubmit={submit}>
      <h2>Login</h2>
      <input placeholder="Username" value={f.username} onChange={e => setF({...f, username: e.target.value})} required />
      <input type="password" placeholder="Password" value={f.password} onChange={e => setF({...f, password: e.target.value})} required />
      {error && <p className="error">{error}</p>}
      <button className="btn">Login</button>
      <p>New here? <Link to="/register">Create an account</Link></p>
    </form>
  )
}

export function Register() {
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const initialType = new URLSearchParams(location.search).get('type')
  const [f, setF] = useState({
    username: '', email: '', password: '', confirmPassword: '',
    user_type: initialType === 'seller' ? 'seller' : 'student',
  })
  const set = k => e => setF({...f, [k]: e.target.value})

  const submit = async e => {
    e.preventDefault()
    setError('')
    if (f.password !== f.confirmPassword) { setError('Passwords do not match'); return }
    const {confirmPassword, ...body} = f
    const res = await apiFetch('/api/users/register/', {method: 'POST', body: JSON.stringify(body)})
    const data = await res.json()
    if (res.ok) navigate('/login', {state: location.state})
    else setError(getErrorMessage(data))
  }
  return (
    <form className="card form" onSubmit={submit}>
      <h2>Create account</h2>
      <input placeholder="Username" value={f.username} onChange={set('username')} required />
      <input type="email" placeholder="Email (optional)" value={f.email} onChange={set('email')} />
      <input type="password" placeholder="Password" value={f.password} onChange={set('password')} required />
      <input type="password" placeholder="Confirm password" value={f.confirmPassword} onChange={set('confirmPassword')} required />
      <select value={f.user_type} onChange={set('user_type')}>
        <option value="student">Student (buy)</option>
        <option value="seller">Seller (buy and sell)</option>
      </select>
      {error && <p className="error">{error}</p>}
      <button className="btn">Register</button>
      <p>Have an account? <Link to="/login">Login</Link></p>
    </form>
  )
}
