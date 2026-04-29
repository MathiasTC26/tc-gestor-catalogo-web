import './App.css'

function App() {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-card">
          <div className="brand-logo">TC</div>
          <div>
            <strong>Todo Costura</strong>
            <span>Gestor web</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Navegación principal">
          <a className="nav-item active" href="#inicio">Inicio</a>
          <a className="nav-item" href="#revistas">Revistas</a>
          <a className="nav-item" href="#productos">Productos</a>
          <a className="nav-item" href="#publicaciones">Publicaciones</a>
          <a className="nav-item" href="#configuracion">Configuración</a>
        </nav>
      </aside>

      <section className="content">
        <header className="hero-panel" id="inicio">
          <div>
            <span className="eyebrow">Catálogo web</span>
            <h1>Gestor de Catálogo Web</h1>
            <p>
              Administrá revistas, productos y publicaciones desde una interfaz clara,
              rápida y profesional.
            </p>
          </div>

          <div className="hero-mark" aria-hidden="true">
            <span>TC</span>
          </div>
        </header>

        <section className="section-block" id="revistas">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Acciones rápidas</span>
              <h2>Panel principal</h2>
            </div>
          </div>

          <div className="quick-grid">
            <article className="action-card">
              <span className="card-icon">＋</span>
              <h3>Nueva revista</h3>
              <p>Creá una revista desde cero y prepará su estructura inicial.</p>
              <a href="#" className="primary-btn">Crear</a>
            </article>

            <article className="action-card">
              <span className="card-icon">✎</span>
              <h3>Editar revista</h3>
              <p>Modificá datos, contenido y configuración de revistas existentes.</p>
              <a href="#" className="primary-btn">Editar</a>
            </article>

            <article className="action-card">
              <span className="card-icon">□</span>
              <h3>Productos</h3>
              <p>Administrá el catálogo de productos asociados a tus publicaciones.</p>
              <a href="#" className="primary-btn">Ver productos</a>
            </article>

            <article className="action-card">
              <span className="card-icon">↗</span>
              <h3>Publicar</h3>
              <p>Prepará contenido para distribución visible en la web.</p>
              <a href="#" className="primary-btn">Publicar</a>
            </article>
          </div>
        </section>

        <section className="dashboard-grid">
          <article className="panel-card large" id="productos">
            <div className="panel-title">
              <h2>Revistas recientes</h2>
              <a href="#">Ver todas</a>
            </div>

            <div className="list">
              <div className="list-row">
                <div className="thumb">TC</div>
                <div>
                  <strong>Revista Verano 2024</strong>
                  <span>Actualizada hace 2 horas</span>
                </div>
                <em>Publicada</em>
              </div>

              <div className="list-row">
                <div className="thumb">TC</div>
                <div>
                  <strong>Colección Invierno</strong>
                  <span>Actualizada hace 1 día</span>
                </div>
                <em className="warning">En edición</em>
              </div>

              <div className="list-row">
                <div className="thumb">TC</div>
                <div>
                  <strong>Especial Accesorios</strong>
                  <span>Actualizada hace 3 días</span>
                </div>
                <em>Publicada</em>
              </div>
            </div>
          </article>

          <aside className="panel-stack">
            <article className="panel-card">
              <h2>Resumen general</h2>

              <div className="metric">
                <span>Revistas</span>
                <strong>12</strong>
              </div>
              <div className="metric">
                <span>Productos</span>
                <strong>1.248</strong>
              </div>
              <div className="metric">
                <span>Publicaciones</span>
                <strong>8</strong>
              </div>
            </article>

            <article className="panel-card" id="publicaciones">
              <h2>Actividad reciente</h2>
              <ul className="activity">
                <li>Revista Verano 2024 fue publicada</li>
                <li>Nuevo producto agregado</li>
                <li>Página “Tendencias” actualizada</li>
              </ul>
            </article>
          </aside>
        </section>
      </section>
    </main>
  )
}

export default App