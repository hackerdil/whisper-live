import { NavLink } from 'react-router-dom'

const navigationItems = [
  { path: '/', label: 'Home' },
  { path: '/transcribe', label: 'Transcribe' },
  { path: '/results', label: 'Results' },
  { path: '/shared', label: 'Shared Files' },
]

function Navigation() {
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
        </ul>
      </nav>
    </header>
  )
}

export default Navigation
