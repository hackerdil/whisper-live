import { Link } from 'react-router-dom'

function Home({ user }) {
  return (
    <section id="main-content" className="home-page">
      <header className="home-intro">
        <div className="home-greeting">
          <span className="home-avatar" aria-hidden="true">
            {user?.name?.trim().charAt(0).toUpperCase() || 'U'}
          </span>
          <div>
            <p className="eyebrow">Welcome back</p>
            <h1>Hi, {user?.name || 'there'}</h1>
          </div>
        </div>
        <p className="home-intro-copy">
          Everything you need is right here. Start a new transcription, review your
          results, or open files shared with you.
        </p>
      </header>

      <div className="summary-grid">
        <article className="summary-card">
          <p className="summary-label">Profile</p>
          <h2>{user?.name}</h2>
          <p className="summary-copy">{user?.email}</p>
        </article>

        <article className="summary-card">
          <p className="summary-label">Results</p>
          <h2>3 completed transcripts</h2>
          <p className="summary-copy">Review notes from recent audio sessions and save new highlights.</p>
        </article>

        <article className="summary-card">
          <p className="summary-label">Shared files</p>
          <h2>4 team recordings</h2>
          <p className="summary-copy">Open shared transcripts and view files that were sent to you.</p>
        </article>
      </div>

      <div className="link-grid">
        <Link to="/transcribe" className="link-card">
          <strong>Transcribe</strong>
          <span>Start a new session and convert audio into text.</span>
        </Link>
        <Link to="/results" className="link-card">
          <strong>Results</strong>
          <span>See completed transcripts and download your notes.</span>
        </Link>
        <Link to="/shared" className="link-card">
          <strong>Shared Files</strong>
          <span>Open files shared with you by other users.</span>
        </Link>
      </div>
    </section>
  )
}

export default Home
