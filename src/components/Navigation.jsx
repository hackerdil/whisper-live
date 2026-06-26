import { NavLink } from 'react-router-dom'

const navigationItems = [
  { path: '/', label: 'Home' },
  { path: '/transcribe', label: 'Transcribe' },
  { path: '/results', label: 'Results' },
  { path: '/shared', label: 'Shared Files' },
]

function Navigation({ user, onLogout }) {
  return (
    <header className="site-header">
      <NavLink className="brand" to="/">
        Whisper Notes
      </NavLink>
      <nav aria-label="Primary navigation">
        <ul className="navigation-list">
          {navigationItems.map((item) => (
            <li key={item.path}>
              <NavLink
                className={({ isActive }) =>
                  isActive ? 'navigation-link active' : 'navigation-link'
                }
                end={item.path === '/'}
                to={item.path}
              >
                {item.label}
              </NavLink>
            </li>
          ))}
          {user ? (
            <li className="navigation-user">
              <span className="nav-user">{user.name}</span>
              <button type="button" className="navigation-link logout-button" onClick={onLogout}>
                Logout
              </button>
            </li>
          ) : (
            <li>
              <NavLink
                className={({ isActive }) =>
                  isActive ? 'navigation-link active' : 'navigation-link'
                }
                to="/login"
              >
                Login
              </NavLink>
            </li>
          )}
        </ul>
      </nav>
    </header>
  )
}

export default Navigation
