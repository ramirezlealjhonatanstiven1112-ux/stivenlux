import { defineConfig, devices } from '@playwright/test';

// Tests sensibles a la carga de la máquina: con varios navegadores headless en paralelo, la CPU compartida
// alarga las tareas y los asentamientos aunque la página no cambie (la base 0f6b12d falla igual). Se ejecutan
// después del resto, encadenados y de uno en uno, sin cambiar ningún umbral (decisión del usuario, spec 002).
const LOAD_STATES = /con la URL \/#servicios, los titulares vistos quedan finales sin animación/;
const LONG_TASKS = /sin tareas de más de 50 ms durante el recorrido del puntero/;
const ISOLATED = new RegExp(`${LOAD_STATES.source}|${LONG_TASKS.source}`);

const desktop = { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } };
const mobile = { ...devices['Pixel 7'] };

// Pruebas de interfaz contra el build de producción (vite preview).
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4173' },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    { name: 'escritorio', use: desktop, grepInvert: ISOLATED },
    { name: 'movil', use: mobile, grepInvert: ISOLATED },
    // Aislados: cada proyecto tiene un solo test y espera a que acabe el anterior
    { name: 'aislado-carga-escritorio', use: desktop, testMatch: 'load-states.spec.js', grep: LOAD_STATES, dependencies: ['escritorio', 'movil'] },
    { name: 'aislado-carga-movil', use: mobile, testMatch: 'load-states.spec.js', grep: LOAD_STATES, dependencies: ['aislado-carga-escritorio'] },
    { name: 'aislado-tareas-escritorio', use: desktop, testMatch: 'spec002-rnf.spec.js', grep: LONG_TASKS, dependencies: ['aislado-carga-movil'] },
  ],
});
