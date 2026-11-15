import {
  DESKTOP_BREAKPOINT,
  DIRECTION_LOCK_THRESHOLD,
  DRAG_SENSITIVITY,
  DRAWER_PARTIAL_WIDTH,
  TRANSITION_DURATION_MS,
  TRANSITION_EASING,
} from './drawer-state';

export function buildStandaloneHtml(): string {
  const transitionSeconds = (TRANSITION_DURATION_MS / 1000).toFixed(2);

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Calculadora Nutricional</title>
    <meta
      name="description"
      content="Calculadora Nutricional con seguimiento diario de calorías y macronutrientes."
    />
    <meta name="color-scheme" content="light dark" />
    <meta
      name="theme-color"
      content="#ffffff"
      media="(prefers-color-scheme: light)"
    />
    <meta
      name="theme-color"
      content="#131314"
      media="(prefers-color-scheme: dark)"
    />
    <link
      href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:wght@400;500;700&display=swap"
      rel="stylesheet"
    />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
    />
    <style>
      /* =====================================
         1. RESET BASE (UI / APP MODERNA)
         ================================== */
      *,
      *::before,
      *::after {
        box-sizing: border-box;
      }

      * {
        margin: 0;
        padding: 0;
      }

      html {
        -webkit-text-size-adjust: 100%;
        overflow-x: clip;
        touch-action: pan-y;
        scrollbar-width: none;
        -ms-overflow-style: none;
      }

      body {
        min-height: 100vh;
        text-rendering: optimizeLegibility;
        background: var(--bg);
        color: var(--text);
        font-family: "Google Sans Flex", sans-serif;
        overflow-x: clip;
        touch-action: pan-y;
        scrollbar-width: none;
        -ms-overflow-style: none;
      }

      html::-webkit-scrollbar,
      body::-webkit-scrollbar,
      .sidebar::-webkit-scrollbar {
        display: none;
      }

      html.drawer-scroll-locked {
        overflow: hidden;
        overscroll-behavior: none;
      }

      body.drawer-scroll-locked {
        overflow-x: clip;
        overflow-y: visible;
        touch-action: none;
      }

      /* =====================================
         2. VARIABLES Y TEMA
         ================================== */
      :root {
        --blue: #4285f4;
        --red: #ea4335;
        --yellow: #fbbc04;
        --green: #34a853;
        --bg: #ffffff;
        --surface: #f8f9fa;
        --text: #3c4043;
        --text-secondary: #5f6368;
        --border: #dee2e6;
        --hover-bg: rgba(0, 0, 0, 0.06);
      }

      @media (prefers-color-scheme: dark) {
        :root {
          --blue: #8ab4f8;
          --red: #f28b82;
          --yellow: #fdd663;
          --green: #81c995;
          --bg: #131314;
          --surface: #1e1f20;
          --text: #e3e3e3;
          --text-secondary: #c4c7c5;
          --border: #444746;
          --hover-bg: rgba(255, 255, 255, 0.08);
        }
      }

      /* =====================================
         APP STRUCTURE (SIDEBAR / OVERLAY / CONTENT)
         ================================== */
      .app-container {
        display: flex;
        min-height: 100vh;
      }

      .main-content {
        flex: 1;
        min-width: 0;
        position: relative;
        z-index: 1200;
        background: var(--bg);
        will-change: transform;
        backface-visibility: hidden;
      }

      .sidebar {
        position: fixed;
        top: 0;
        left: 0;
        height: 100%;
        width: 100vw;
        background: var(--bg);
        border-right: 1px solid var(--border);
        z-index: 1400;
        overflow-x: hidden;
        overflow-y: auto;
        overscroll-behavior: contain;
        touch-action: pan-y;
        scrollbar-width: none;
        -ms-overflow-style: none;
        will-change: transform;
        backface-visibility: hidden;
        contain: layout style paint;
        transform: translateX(-100%);
        pointer-events: none;
      }

      .sidebar-edge-shadow {
        position: fixed;
        top: 0;
        left: 0;
        width: 18px;
        height: 100%;
        pointer-events: none;
        z-index: 1390;
        opacity: 0;
        background: linear-gradient(
          to right,
          rgba(0, 0, 0, 0.24),
          rgba(0, 0, 0, 0.08) 45%,
          transparent
        );
        will-change: transform, opacity;
        backface-visibility: hidden;
        transform: translateX(0px);
      }

      .sidebar-inner {
        width: 100%;
        min-height: 100%;
        will-change: transform;
        backface-visibility: hidden;
      }

      .drawer-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1350;
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        touch-action: none;
        overscroll-behavior: contain;
        will-change: opacity;
        backface-visibility: hidden;
      }

      @media (min-width: ${DESKTOP_BREAKPOINT}px) {
        .sidebar {
          width: 30% !important;
          max-width: 400px;
          transform: translateX(0) !important;
          box-shadow: none !important;
          pointer-events: auto !important;
          transition: none !important;
        }

        .sidebar-inner {
          transform: none !important;
          transition: none !important;
        }

        .sidebar-edge-shadow {
          display: none !important;
        }

        .drawer-overlay {
          display: none !important;
        }

        .main-content {
          margin-left: min(30%, 400px);
          transform: none !important;
          transition: none !important;
          z-index: auto;
        }

        #openSidebar {
          display: none !important;
        }

        .fab {
          transform: none !important;
          transition: none !important;
        }
      }

      .sidebar-content {
        padding: 24px 12px;
      }

      .menu-item {
        width: 100%;
        border: none;
        background: transparent;
        color: inherit;
        font: inherit;
        text-align: left;
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 12px 16px;
        border-radius: 8px;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: background 0.2s;
        margin-bottom: 4px;
        font-size: 14px;
      }

      .menu-item:hover {
        background: var(--hover-bg);
      }

      .menu-item .material-symbols-outlined {
        color: var(--text-secondary);
      }

      .menu-section {
        margin-bottom: 32px;
      }

      .menu-section-title {
        font-size: 12px;
        font-weight: 500;
        color: var(--text-secondary);
        padding: 8px 16px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      /* =====================================
         3. BASE TIPOGRÁFICA
         ================================== */
      h1 {
        font-size: 17px;
        font-weight: 700;
        margin-right: auto;
      }

      h2 {
        font-size: 19px;
        font-weight: 700;
        margin-bottom: 12px;
      }

      /* =====================================
         4. LAYOUT ESTRUCTURAL
         ================================== */
      header {
        position: sticky;
        top: 0;
        z-index: 100;
        height: 44px;
        padding: 0 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bg);
      }

      .header-content {
        width: 100%;
        max-width: 1200px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      main {
        max-width: 1200px;
        margin: 30px auto 0 auto;
        padding: 0 16px 96px 16px;
        display: grid;
        gap: 20px;
      }

      /* =====================================
         5. COMPONENTES BASE
         ================================== */
      .icon-button {
        background: transparent;
        border: none;
        padding: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 30%;
        cursor: pointer;
        color: var(--text-secondary);
        -webkit-tap-highlight-color: transparent;
      }

      .icon {
        padding: 10px;
        font-size: 17px;
        border-radius: 30%;
        cursor: pointer;
        color: var(--text-secondary);
        -webkit-tap-highlight-color: transparent;
      }

      .material-symbols-outlined.icon {
        width: auto;
        height: auto;
        font-size: 17px;
        line-height: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .icon:hover {
        background: var(--hover-bg);
      }

      .card {
        background: var(--surface);
        padding: 16px;
        border-radius: 12px;
        border: 2px solid;
        border-top-width: 8px;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }

      .card-icon {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
      }

      .card-icon .material-symbols-outlined {
        width: 24px;
        height: 24px;
        font-size: 24px;
        line-height: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .percentage {
        font-size: 11px;
        font-weight: 700;
        padding: 6px 12px;
        border-radius: 10px;
        color: var(--text-secondary);
        background: rgba(128, 128, 128, 0.1);
      }

      .icon-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }

      /* =====================================
         6. VARIANTES DE COMPONENTES
         ================================== */
      .card.blue {
        border-color: var(--blue);
      }

      .card.red {
        border-color: var(--red);
      }

      .card.yellow {
        border-color: var(--yellow);
      }

      .card.green {
        border-color: var(--green);
      }

      .card.multi {
        border: 2px solid transparent;
        border-top-width: 8px;
        background:
          linear-gradient(var(--surface), var(--surface)) padding-box,
          linear-gradient(
            90deg,
            var(--blue),
            var(--red),
            var(--yellow),
            var(--green)
          )
          border-box;
      }

      .blue .card-icon {
        background: rgba(66, 133, 244, 0.1);
        color: var(--blue);
      }

      .red .card-icon {
        background: rgba(234, 67, 53, 0.1);
        color: var(--red);
      }

      .yellow .card-icon {
        background: rgba(251, 188, 4, 0.1);
        color: var(--yellow);
      }

      .green .card-icon {
        background: rgba(52, 168, 83, 0.1);
        color: var(--green);
      }

      .multi .card-icon {
        background: rgba(128, 128, 128, 0.1);
      }

      /* =====================================
         7. COMPONENTES ESPECIALES
         ================================== */
      .fab {
        position: fixed;
        right: 24px;
        bottom: 24px;
        z-index: 1250;
        width: 56px;
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 16px;
        border: 2px solid transparent;
        background:
          linear-gradient(var(--surface), var(--surface)) padding-box,
          linear-gradient(
            90deg,
            var(--blue),
            var(--red),
            var(--yellow),
            var(--green)
          )
          border-box;
        color: var(--blue);
        cursor: pointer;
        will-change: transform;
        backface-visibility: hidden;
        -webkit-tap-highlight-color: transparent;
      }

      /* =====================================
         8. UTILIDADES VISUALES
         ================================== */
      .google-gradient {
        display: inline-block;
        background: linear-gradient(
          135deg,
          var(--blue) 15%,
          var(--red) 40%,
          var(--yellow) 65%,
          var(--green) 88%
        );
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        color: transparent;
      }

      /* =====================================
         9. MEDIA QUERIES (LAYOUT)
         ================================== */
      @media (min-width: 640px) {
        main {
          grid-template-columns: repeat(2, 1fr);
        }
        .full {
          grid-column: 1 / -1;
        }
      }

      .kcal-row {
        display: flex;
        align-items: baseline;
        gap: 8px;
      }

      .kcal-target {
        font-size: 13px;
        color: var(--text-secondary);
        font-weight: 500;
      }

      .summary-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-top: 0;
        text-align: center;
      }

      .summary-item strong {
        display: block;
        font-size: 13px;
        margin-bottom: 4px;
      }

      .summary-label {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        font-size: 9px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--text-secondary);
      }

      .color-key {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 2px;
        flex-shrink: 0;
        align-self: center;
      }

      .key-blue {
        background: var(--blue);
      }

      .key-red {
        background: var(--red);
      }

      .key-yellow {
        background: var(--yellow);
      }

      .key-green {
        background: var(--green);
      }

      .main-progress {
        background: rgba(128, 128, 128, 0.2);
        height: 10px;
        border-radius: 6px;
        margin: 12px 0 16px 0;
        overflow: hidden;
        display: flex;
      }

      .kcal-number {
        font-size: 19px;
        font-weight: 700;
        letter-spacing: -0.5px;
        line-height: 1;
        color: var(--text);
      }

      .prog-bar {
        height: 100%;
        width: 25%;
      }

      .prog-blue {
        background: var(--blue);
      }

      .prog-red {
        background: var(--red);
      }

      .prog-yellow {
        background: var(--yellow);
      }

      .prog-green {
        background: var(--green);
      }
    </style>
  </head>
  <body>
    <div class="app-container">
      <aside
        class="sidebar"
        id="sidebar"
        aria-label="Menú lateral"
        aria-hidden="true"
        data-state="0"
        inert
      >
        <div id="sidebarInner" class="sidebar-inner">
          <div class="sidebar-content">
          <div class="menu-section">
            <div class="menu-section-title">Comidas</div>
            <button type="button" class="menu-item">
              <span class="material-symbols-outlined">bakery_dining</span>
              <span>Desayuno</span>
            </button>
            <button type="button" class="menu-item">
              <span class="material-symbols-outlined">restaurant</span>
              <span>Almuerzo</span>
            </button>
            <button type="button" class="menu-item">
              <span class="material-symbols-outlined">coffee</span>
              <span>Merienda</span>
            </button>
            <button type="button" class="menu-item">
              <span class="material-symbols-outlined">dark_mode</span>
              <span>Cena</span>
            </button>
          </div>

          <div class="menu-section">
            <div class="menu-section-title">Análisis</div>
            <button type="button" class="menu-item">
              <span class="material-symbols-outlined">analytics</span>
              <span>Resumen diario</span>
            </button>
            <button type="button" class="menu-item">
              <span class="material-symbols-outlined">monitoring</span>
              <span>Estadísticas</span>
            </button>
            <button type="button" class="menu-item">
              <span class="material-symbols-outlined">trending_up</span>
              <span>Progreso</span>
            </button>
          </div>

          <div class="menu-section">
            <div class="menu-section-title">Configuración</div>
            <button type="button" class="menu-item">
              <span class="material-symbols-outlined">person</span>
              <span>Perfil</span>
            </button>
            <button type="button" class="menu-item">
              <span class="material-symbols-outlined">flag</span>
              <span>Objetivos</span>
            </button>
            <button type="button" class="menu-item">
              <span class="material-symbols-outlined">settings</span>
              <span>Ajustes</span>
            </button>
          </div>
          </div>
        </div>
      </aside>

      <div id="sidebarShadow" class="sidebar-edge-shadow" aria-hidden="true"></div>

      <div id="overlay" class="drawer-overlay" aria-hidden="true"></div>

      <div id="envoltorio" class="main-content">
        <header>
          <div class="header-content">
            <button
              type="button"
              class="icon-button"
              id="openSidebar"
              aria-label="Abrir o cerrar menú"
              aria-expanded="false"
              aria-controls="sidebar"
            >
              <span class="material-symbols-outlined icon">menu</span>
            </button>
            <h1>Calculadora Nutricional</h1>
          </div>
        </header>

        <main>
          <div class="card blue">
            <div class="icon-row">
              <div class="card-icon">
                <span class="material-symbols-outlined">bakery_dining</span>
              </div>
              <span class="percentage">25.0%</span>
            </div>
            <h2>Desayuno</h2>
            <div class="kcal-row">
              <span class="color-key key-blue" aria-hidden="true"></span>
              <span class="kcal-number">500</span>
              <span class="kcal-target">/ 500 kcal</span>
            </div>
            <div class="main-progress">
              <div class="prog-bar prog-blue"></div>
              <div class="prog-bar prog-red"></div>
              <div class="prog-bar prog-yellow"></div>
              <div class="prog-bar prog-green"></div>
            </div>
            <div class="summary-grid">
              <div class="summary-item">
                <strong>110g</strong>
                <span class="summary-label">
                  <span class="color-key key-red" aria-hidden="true"></span>
                  <span>Proteína</span>
                </span>
              </div>
              <div class="summary-item">
                <strong>180g</strong>
                <span class="summary-label">
                  <span class="color-key key-yellow" aria-hidden="true"></span>
                  <span>Carbos</span>
                </span>
              </div>
              <div class="summary-item">
                <strong>55g</strong>
                <span class="summary-label">
                  <span class="color-key key-green" aria-hidden="true"></span>
                  <span>Grasas</span>
                </span>
              </div>
            </div>
          </div>

          <div class="card red">
            <div class="icon-row">
              <div class="card-icon">
                <span class="material-symbols-outlined">restaurant</span>
              </div>
              <span class="percentage">25.0%</span>
            </div>
            <h2>Almuerzo</h2>
            <div class="kcal-row">
              <span class="color-key key-blue" aria-hidden="true"></span>
              <span class="kcal-number">500</span>
              <span class="kcal-target">/ 500 kcal</span>
            </div>
            <div class="main-progress">
              <div class="prog-bar prog-blue"></div>
              <div class="prog-bar prog-red"></div>
              <div class="prog-bar prog-yellow"></div>
              <div class="prog-bar prog-green"></div>
            </div>
            <div class="summary-grid">
              <div class="summary-item">
                <strong>110g</strong>
                <span class="summary-label">
                  <span class="color-key key-red" aria-hidden="true"></span>
                  <span>Proteína</span>
                </span>
              </div>
              <div class="summary-item">
                <strong>180g</strong>
                <span class="summary-label">
                  <span class="color-key key-yellow" aria-hidden="true"></span>
                  <span>Carbos</span>
                </span>
              </div>
              <div class="summary-item">
                <strong>55g</strong>
                <span class="summary-label">
                  <span class="color-key key-green" aria-hidden="true"></span>
                  <span>Grasas</span>
                </span>
              </div>
            </div>
          </div>

          <div class="card yellow">
            <div class="icon-row">
              <div class="card-icon">
                <span class="material-symbols-outlined">coffee</span>
              </div>
              <span class="percentage">25.0%</span>
            </div>
            <h2>Merienda</h2>
            <div class="kcal-row">
              <span class="color-key key-blue" aria-hidden="true"></span>
              <span class="kcal-number">500</span>
              <span class="kcal-target">/ 500 kcal</span>
            </div>
            <div class="main-progress">
              <div class="prog-bar prog-blue"></div>
              <div class="prog-bar prog-red"></div>
              <div class="prog-bar prog-yellow"></div>
              <div class="prog-bar prog-green"></div>
            </div>
            <div class="summary-grid">
              <div class="summary-item">
                <strong>110g</strong>
                <span class="summary-label">
                  <span class="color-key key-red" aria-hidden="true"></span>
                  <span>Proteína</span>
                </span>
              </div>
              <div class="summary-item">
                <strong>180g</strong>
                <span class="summary-label">
                  <span class="color-key key-yellow" aria-hidden="true"></span>
                  <span>Carbos</span>
                </span>
              </div>
              <div class="summary-item">
                <strong>55g</strong>
                <span class="summary-label">
                  <span class="color-key key-green" aria-hidden="true"></span>
                  <span>Grasas</span>
                </span>
              </div>
            </div>
          </div>

          <div class="card green">
            <div class="icon-row">
              <div class="card-icon">
                <span class="material-symbols-outlined">dark_mode</span>
              </div>
              <span class="percentage">25.0%</span>
            </div>
            <h2>Cena</h2>
            <div class="kcal-row">
              <span class="color-key key-blue" aria-hidden="true"></span>
              <span class="kcal-number">500</span>
              <span class="kcal-target">/ 500 kcal</span>
            </div>
            <div class="main-progress">
              <div class="prog-bar prog-blue"></div>
              <div class="prog-bar prog-red"></div>
              <div class="prog-bar prog-yellow"></div>
              <div class="prog-bar prog-green"></div>
            </div>
            <div class="summary-grid">
              <div class="summary-item">
                <strong>110g</strong>
                <span class="summary-label">
                  <span class="color-key key-red" aria-hidden="true"></span>
                  <span>Proteína</span>
                </span>
              </div>
              <div class="summary-item">
                <strong>180g</strong>
                <span class="summary-label">
                  <span class="color-key key-yellow" aria-hidden="true"></span>
                  <span>Carbos</span>
                </span>
              </div>
              <div class="summary-item">
                <strong>55g</strong>
                <span class="summary-label">
                  <span class="color-key key-green" aria-hidden="true"></span>
                  <span>Grasas</span>
                </span>
              </div>
            </div>
          </div>

          <div class="card multi full">
            <div class="icon-row">
              <div class="card-icon">
                <span class="material-symbols-outlined google-gradient"
                  >fact_check</span
                >
              </div>
              <span class="percentage">100.0%</span>
            </div>
            <h2>Resumen Total</h2>
            <div class="kcal-row">
              <span class="color-key key-blue" aria-hidden="true"></span>
              <span class="kcal-number">2,000</span>
              <span class="kcal-target">/ 2,000 kcal</span>
            </div>
            <div class="main-progress">
              <div class="prog-bar prog-blue"></div>
              <div class="prog-bar prog-red"></div>
              <div class="prog-bar prog-yellow"></div>
              <div class="prog-bar prog-green"></div>
            </div>
            <div class="summary-grid">
              <div class="summary-item">
                <strong>440g</strong>
                <span class="summary-label">
                  <span class="color-key key-red" aria-hidden="true"></span>
                  <span>Proteína</span>
                </span>
              </div>
              <div class="summary-item">
                <strong>720g</strong>
                <span class="summary-label">
                  <span class="color-key key-yellow" aria-hidden="true"></span>
                  <span>Carbos</span>
                </span>
              </div>
              <div class="summary-item">
                <strong>220g</strong>
                <span class="summary-label">
                  <span class="color-key key-green" aria-hidden="true"></span>
                  <span>Grasas</span>
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>

      <button type="button" class="fab" aria-label="Añadir">
        <span class="material-symbols-outlined">add</span>
      </button>
    </div>

    <script>
      (function () {
        const PARTIAL_WIDTH = ${DRAWER_PARTIAL_WIDTH};
        const SENSITIVITY = ${DRAG_SENSITIVITY};
        const DESKTOP_BREAKPOINT = ${DESKTOP_BREAKPOINT};
        const DIRECTION_LOCK_THRESHOLD = ${DIRECTION_LOCK_THRESHOLD};
        const TRANSITION_MS = ${TRANSITION_DURATION_MS};
        const TRANSITION = '${transitionSeconds}s ${TRANSITION_EASING}';

        const sidebar = document.getElementById('sidebar');
        const sidebarInner = document.getElementById('sidebarInner');
        const sidebarShadow = document.getElementById('sidebarShadow');
        const envoltorio = document.getElementById('envoltorio');
        const overlay = document.getElementById('overlay');
        const openBtn = document.getElementById('openSidebar');
        const fab = document.querySelector('.fab');
        const menuItems = document.querySelectorAll('.menu-item');

        let menuState = 0;
        let isDragging = false;
        let isClosing = false;
        let scrollLocked = false;
        let tracking = false;
        let startState = 0;
        let startX = 0;
        let startY = 0;
        let currentX = 0;
        let dragStartDisplacementX = null;
        let direction = 'undecided';
        let lastFrame = null;
        let restTimer = null;

        let lastOverlayOpacity = '';
        let lastOverlayVisibility = '';
        let lastSidebarPointerEvents = '';
        let lastTransitionMode = null;

        function isMobileViewport() {
          return window.innerWidth < DESKTOP_BREAKPOINT;
        }

        function clamp(value, min, max) {
          return Math.max(min, Math.min(max, value));
        }

        function getEffectivePartialWidth(viewportWidth) {
          if (viewportWidth <= 0) return PARTIAL_WIDTH;
          return Math.min(PARTIAL_WIDTH, viewportWidth);
        }

        function detectSwipeDirection(deltaX, deltaY) {
          const absX = Math.abs(deltaX);
          const absY = Math.abs(deltaY);
          if (absX >= 2 && absX > absY * 1.5) return 'horizontal';
          if (Math.max(absX, absY) < DIRECTION_LOCK_THRESHOLD) return 'undecided';
          return absY > absX ? 'vertical' : 'horizontal';
        }

        function buildFrame(displacementX, effectivePartial, fullWidth, phase) {
          const overlayProgress =
            effectivePartial > 0 ? clamp(displacementX / effectivePartial, 0, 1) : 0;

          return {
            displacementX: displacementX,
            menuTranslateX: displacementX - fullWidth,
            innerTranslateX: fullWidth - Math.max(effectivePartial, displacementX),
            menuWidth: fullWidth,
            overlayProgress: overlayProgress,
            phase: phase
          };
        }

        function computeStateFrame(state, viewportWidth) {
          const effectivePartial = getEffectivePartialWidth(viewportWidth);
          const fullWidth = Math.max(effectivePartial, viewportWidth);

          if (state === 0) {
            return buildFrame(0, effectivePartial, fullWidth, 'slide');
          }

          if (state === 1) {
            return buildFrame(effectivePartial, effectivePartial, fullWidth, 'slide');
          }

          return buildFrame(fullWidth, effectivePartial, fullWidth, 'resize');
        }

        function computeDragFrame(state, deltaX, viewportWidth, startDisplacementX) {
          const effectivePartial = getEffectivePartialWidth(viewportWidth);
          const fullWidth = Math.max(effectivePartial, viewportWidth);
          const defaultBase = state === 0 ? 0 : state === 1 ? effectivePartial : fullWidth;
          const base = startDisplacementX !== null && startDisplacementX !== undefined ? startDisplacementX : defaultBase;
          const raw = base + deltaX;

          if (state === 0 || (state === 1 && raw < effectivePartial)) {
            const displacementX = clamp(raw, 0, effectivePartial);
            return buildFrame(displacementX, effectivePartial, fullWidth, 'slide');
          }

          const displacementX = clamp(raw, effectivePartial, fullWidth);
          return buildFrame(displacementX, effectivePartial, fullWidth, 'resize');
        }

        function resolveSnapState(params) {
          const effectivePartial = getEffectivePartialWidth(params.viewportWidth);
          const fullWidth = Math.max(effectivePartial, params.viewportWidth);

          if ((params.startState === 1 || params.startState === 2) && params.displacementX >= effectivePartial) {
            const midpoint = (fullWidth + effectivePartial) / 2;
            return params.displacementX >= midpoint ? 2 : 1;
          }

          if (params.startState === 1 && params.displacementX < effectivePartial) {
            return params.deltaX < -SENSITIVITY ? 0 : 1;
          }

          if (params.startState === 0) {
            return params.deltaX > SENSITIVITY && params.currentX > SENSITIVITY ? 1 : 0;
          }

          return params.startState;
        }

        function isElementHorizontallyScrollable(el) {
          const style = window.getComputedStyle(el);
          const allowsOverflow = style.overflowX === 'auto' || style.overflowX === 'scroll';
          return allowsOverflow && el.scrollWidth > el.clientWidth + 1;
        }

        function hasHorizontallyScrollableAncestor(target) {
          let node = target instanceof HTMLElement ? target : null;
          while (node && node !== document.body && node !== document.documentElement) {
            if (isElementHorizontallyScrollable(node)) {
              return true;
            }
            node = node.parentElement;
          }
          return false;
        }

        function clearRestTimer() {
          if (restTimer !== null) {
            clearTimeout(restTimer);
            restTimer = null;
          }
        }

        function readCurrentWrapperDisplacementX() {
          const transform = window.getComputedStyle(envoltorio).transform;
          if (!transform || transform === 'none') {
            return 0;
          }
          return new DOMMatrixReadOnly(transform).m41;
        }

        function clearStyleCaches() {
          lastOverlayOpacity = '';
          lastOverlayVisibility = '';
          lastSidebarPointerEvents = '';
          lastTransitionMode = null;
        }

        function setScrollLock(locked) {
          scrollLocked = locked;
          document.documentElement.classList.toggle('drawer-scroll-locked', locked);
          document.body.classList.toggle('drawer-scroll-locked', locked);
        }

        function resetWrapperToRest() {
          isClosing = false;
          setScrollLock(false);
          syncAccessibilityAndScroll();
          envoltorio.style.transition = 'none';
          envoltorio.style.transform = 'none';
          if (fab) {
            fab.style.transition = 'none';
            fab.style.transform = 'none';
          }
          sidebar.style.transition = 'none';
          if (sidebarInner) sidebarInner.style.transition = 'none';
          if (sidebarShadow) sidebarShadow.style.transition = 'none';
          overlay.style.transition = 'none';
          lastTransitionMode = 'none';
        }

        function applyDesktopMode() {
          clearRestTimer();
          clearStyleCaches();
          menuState = 0;
          isDragging = false;
          isClosing = false;
          lastFrame = null;

          sidebar.style.transform = '';
          sidebar.style.transition = '';
          sidebar.style.pointerEvents = '';
          if (sidebarInner) {
            sidebarInner.style.transform = '';
            sidebarInner.style.transition = '';
          }
          if (sidebarShadow) {
            sidebarShadow.style.transform = '';
            sidebarShadow.style.opacity = '';
            sidebarShadow.style.transition = '';
          }
          sidebar.setAttribute('data-state', 'desktop');
          sidebar.setAttribute('aria-hidden', 'false');
          sidebar.removeAttribute('inert');

          envoltorio.style.transform = '';
          envoltorio.style.transition = '';
          if (fab) {
            fab.style.transform = '';
            fab.style.transition = '';
          }

          overlay.style.opacity = '';
          overlay.style.visibility = '';
          overlay.style.pointerEvents = '';
          overlay.style.transition = '';

          openBtn.setAttribute('aria-expanded', 'false');
          setScrollLock(false);
        }

        function applyFrame(frame, dragging, keepZeroTransform, immediate) {
          lastFrame = frame;
          const interactive = menuState !== 0 || dragging;
          const progress = frame.overlayProgress;
          const transitionMode =
            dragging || immediate || (menuState === 0 && !keepZeroTransform)
              ? 'none'
              : 'animate';

          if (transitionMode !== lastTransitionMode) {
            lastTransitionMode = transitionMode;
            if (transitionMode === 'none') {
              envoltorio.style.transition = 'none';
              if (fab) fab.style.transition = 'none';
              sidebar.style.transition = 'none';
              if (sidebarInner) sidebarInner.style.transition = 'none';
              if (sidebarShadow) sidebarShadow.style.transition = 'none';
              overlay.style.transition = 'none';
            } else {
              envoltorio.style.transition = 'transform ' + TRANSITION;
              if (fab) fab.style.transition = 'transform ' + TRANSITION;
              sidebar.style.transition = 'transform ' + TRANSITION;
              if (sidebarInner) sidebarInner.style.transition = 'transform ' + TRANSITION;
              if (sidebarShadow) {
                sidebarShadow.style.transition = 'transform ' + TRANSITION + ', opacity ' + TRANSITION;
              }
              overlay.style.transition = 'opacity ' + TRANSITION + ', visibility ' + TRANSITION;
            }
          }

          const wrapTransform =
            frame.displacementX === 0 && !dragging && !keepZeroTransform
              ? 'none'
              : 'translateX(' + frame.displacementX + 'px)';
          envoltorio.style.transform = wrapTransform;
          if (fab) fab.style.transform = wrapTransform;

          sidebar.style.transform = 'translateX(' + frame.menuTranslateX + 'px)';
          if (sidebarInner) {
            sidebarInner.style.transform = 'translateX(' + frame.innerTranslateX + 'px)';
          }
          if (sidebarShadow) {
            sidebarShadow.style.transform = 'translateX(' + frame.displacementX + 'px)';
          }

          const nextPointerEvents = interactive ? 'auto' : 'none';
          if (nextPointerEvents !== lastSidebarPointerEvents) {
            lastSidebarPointerEvents = nextPointerEvents;
            sidebar.style.pointerEvents = nextPointerEvents;
          }

          const nextOpacity = progress > 0 ? String(progress) : '0';
          if (nextOpacity !== lastOverlayOpacity) {
            lastOverlayOpacity = nextOpacity;
            overlay.style.opacity = nextOpacity;
            if (sidebarShadow) {
              sidebarShadow.style.opacity = nextOpacity;
            }
          }

          const nextVisibility = progress > 0 ? 'visible' : 'hidden';
          if (nextVisibility !== lastOverlayVisibility) {
            lastOverlayVisibility = nextVisibility;
            overlay.style.visibility = nextVisibility;
            overlay.style.pointerEvents = progress > 0 ? 'auto' : 'none';
          }
        }

        function syncAccessibilityAndScroll() {
          const isClosed = menuState === 0 && !isClosing;
          sidebar.setAttribute('data-state', String(menuState));
          sidebar.setAttribute('aria-hidden', String(isClosed));
          if (isClosed) {
            sidebar.setAttribute('inert', '');
          } else {
            sidebar.removeAttribute('inert');
          }
          openBtn.setAttribute('aria-expanded', String(menuState !== 0));
        }

        function setMenuState(nextState) {
          if (!isMobileViewport()) {
            applyDesktopMode();
            return;
          }
          clearRestTimer();
          const wasOpen = menuState !== 0;
          const wasMoved =
            wasOpen ||
            (lastFrame && lastFrame.displacementX > 0) ||
            dragStartDisplacementX !== null;
          const animateBackToZero = nextState === 0 && wasMoved;
          menuState = nextState;
          isDragging = false;
          isClosing = nextState === 0 && wasOpen;
          syncAccessibilityAndScroll();

          const frame = computeStateFrame(menuState, window.innerWidth);
          applyFrame(frame, false, animateBackToZero, false);

          if (animateBackToZero) {
            restTimer = setTimeout(function () {
              if (isMobileViewport() && menuState === 0 && !isDragging && !tracking) {
                resetWrapperToRest();
              }
            }, TRANSITION_MS + 30);
          } else if (menuState === 0) {
            setScrollLock(false);
          } else {
            restTimer = setTimeout(function () {
              if (isMobileViewport() && menuState !== 0 && !isDragging && !tracking) {
                setScrollLock(true);
              }
            }, TRANSITION_MS + 30);
          }
        }

        function resetTouchTracking() {
          tracking = false;
          startX = 0;
          startY = 0;
          currentX = 0;
          dragStartDisplacementX = null;
          direction = 'undecided';
        }

        function finishActiveDrag() {
          if (direction === 'horizontal' && isDragging) {
            const deltaX = currentX - startX;
            const frame = computeDragFrame(startState, deltaX, window.innerWidth, dragStartDisplacementX);
            const nextState = resolveSnapState({
              startState: startState,
              displacementX: frame.displacementX,
              deltaX: deltaX,
              currentX: currentX,
              viewportWidth: window.innerWidth
            });
            setMenuState(nextState);
          } else {
            isDragging = false;
            if (dragStartDisplacementX !== null) {
              setMenuState(menuState);
            } else {
              syncAccessibilityAndScroll();
            }
          }
          resetTouchTracking();
        }

        openBtn.addEventListener('click', function () {
          if (!isMobileViewport()) return;
          setMenuState(menuState === 0 ? 1 : 0);
        });

        overlay.addEventListener('click', function () {
          if (!isMobileViewport()) return;
          setMenuState(0);
        });

        envoltorio.addEventListener('transitionend', function (event) {
          if (
            event.target === envoltorio &&
            event.propertyName === 'transform' &&
            isMobileViewport() &&
            !isDragging &&
            !tracking
          ) {
            clearRestTimer();
            if (menuState === 0) {
              resetWrapperToRest();
            } else {
              setScrollLock(true);
            }
          }
        });

        for (let i = 0; i < menuItems.length; i++) {
          menuItems[i].addEventListener('click', function () {
            if (isMobileViewport()) {
              setMenuState(0);
            }
          });
        }

        document.addEventListener('touchstart', function (event) {
          if (!isMobileViewport()) return;

          if (event.touches.length !== 1) {
            if (tracking) {
              finishActiveDrag();
            } else {
              resetTouchTracking();
            }
            return;
          }

          if (hasHorizontallyScrollableAncestor(event.target)) {
            resetTouchTracking();
            return;
          }

          clearRestTimer();
          const touch = event.touches[0];
          tracking = true;
          startState = menuState;
          startX = touch.clientX;
          startY = touch.clientY;
          currentX = touch.clientX;
          dragStartDisplacementX = null;
          direction = 'undecided';

          if (lastTransitionMode === 'animate') {
            const visualX = readCurrentWrapperDisplacementX();
            const frozen = computeDragFrame(startState, 0, window.innerWidth, visualX);
            dragStartDisplacementX = frozen.displacementX;
            applyFrame(frozen, true, false, true);
          }
        }, { passive: true });

        document.addEventListener('touchmove', function (event) {
          if (!tracking || !isMobileViewport()) return;

          if (event.touches.length !== 1) {
            finishActiveDrag();
            return;
          }

          const touch = event.touches[0];
          const deltaX = touch.clientX - startX;
          const deltaY = touch.clientY - startY;

          if (direction === 'undecided') {
            const detected = detectSwipeDirection(deltaX, deltaY);
            if (detected === 'undecided') return;
            if (detected === 'vertical') {
              if (dragStartDisplacementX !== null) {
                setMenuState(menuState);
              }
              resetTouchTracking();
              return;
            }
            clearRestTimer();
            direction = 'horizontal';
            isDragging = true;
          }

          if (event.cancelable) {
            event.preventDefault();
          }

          currentX = touch.clientX;
          const frame = computeDragFrame(startState, deltaX, window.innerWidth, dragStartDisplacementX);
          applyFrame(frame, true, false, false);
        }, { passive: false });

        document.addEventListener('touchend', function () {
          if (!tracking) return;
          finishActiveDrag();
        }, { passive: true });

        document.addEventListener('touchcancel', function () {
          if (!tracking) return;
          finishActiveDrag();
        }, { passive: true });

        function handleViewportChange() {
          if (!isMobileViewport()) {
            resetTouchTracking();
            applyDesktopMode();
            return;
          }
          if (!isDragging) {
            syncAccessibilityAndScroll();
            applyFrame(computeStateFrame(menuState, window.innerWidth), false, false, true);
          }
        }

        window.addEventListener('resize', handleViewportChange, { passive: true });
        window.addEventListener('orientationchange', handleViewportChange, { passive: true });

        handleViewportChange();
      })();
    </script>
  </body>
</html>
`;
}
