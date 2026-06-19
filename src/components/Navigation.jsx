const navigationItems = [
  { id: 'login', label: 'Login' },
  { id: 'transcribe', label: 'Transcribe' },
  { id: 'results', label: 'Results' },
  { id: 'shared', label: 'Shared Files' },
]

function Navigation({ activePage, onNavigate }) {
  return (
    <header className="site-header">
      <a className="brand" href="#main-content" onClick={() => onNavigate('login')}>
        Whisper Notes
      </a>
      <nav aria-label="Primary navigation">
        <ul className="navigation-list">
          {navigationItems.map((item) => (
            <li key={item.id}>
              <button
                className={activePage === item.id ? 'navigation-link active' : 'navigation-link'}
                type="button"
                aria-current={activePage === item.id ? 'page' : undefined}
                onClick={() => onNavigate(item.id)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}

export default Navigation

