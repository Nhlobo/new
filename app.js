const STORAGE_KEY = 'waterwise-v9-demo-state';
const ROUTES = ['dashboard', 'control', 'history', 'faults', 'users', 'weather', 'settings'];
const routeTitles = {
  dashboard: 'Dashboard',
  control: 'Control',
  history: 'History',
  faults: 'Faults',
  users: 'Users',
  weather: 'Weather',
  settings: 'Settings'
};

const defaultState = {
  route: 'dashboard',
  lastUpdated: Date.now(),
  startedAt: Date.now(),
  mode: 'auto',
  offline: false,
  leakSim: false,
  noFlowSim: false,
  pumpOn: false,
  valveOpen: false,
  soilMoisture: 46,
  tankLevel: 72,
  flowRate: 0,
  temperature: 27,
  batteryVoltage: 12.5,
  solarCharging: 48,
  connectivity: 'Online',
  historyFilter: '24h',
  settings: {
    soilTarget: 55,
    minTankLevel: 18,
    flowTimeoutMinutes: 4,
    alertsEnabled: true,
    farmName: 'Green Valley Demo Farm',
    deviceId: 'WW-V9-HA-2026-01',
    appVersion: 'v9.0.0-demo'
  },
  faults: [],
  users: [
    { id: crypto.randomUUID(), name: 'Nomsa Dlamini', role: 'owner' },
    { id: crypto.randomUUID(), name: 'Sipho Mokoena', role: 'worker' },
    { id: crypto.randomUUID(), name: 'Lerato Naidoo', role: 'admin' }
  ],
  weather: {
    current: 'Sunny',
    rainExpected: false,
    forecast: [
      { day: 'Today', condition: 'Sunny', rain: 12, high: 30, low: 19 },
      { day: 'Tomorrow', condition: 'Cloudy', rain: 35, high: 27, low: 18 },
      { day: 'Day 3', condition: 'Light Rain', rain: 68, high: 24, low: 17 }
    ]
  },
  noFlowTicks: 0,
  history: []
};

const state = loadState();
let tickHandle = null;
let editingUserId = null;

const nav = document.getElementById('nav');
const pageTitle = document.getElementById('pageTitle');
const subtitle = document.getElementById('subtitle');
const view = document.getElementById('view');
const connectivityBadge = document.getElementById('connectivityBadge');
const updatedAt = document.getElementById('updatedAt');
const toastWrap = document.getElementById('toastWrap');

init();

function init() {
  if (!location.hash || !ROUTES.includes(location.hash.slice(2))) {
    history.replaceState({}, '', '#/dashboard');
  }
  state.route = getRouteFromHash();
  ensureHistorySeed();
  renderNav();
  render();
  window.addEventListener('hashchange', () => {
    state.route = getRouteFromHash();
    render();
  });

  if (tickHandle) clearInterval(tickHandle);
  tickHandle = setInterval(simulateTick, 3000);
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return structuredClone(defaultState);
    const merged = deepMerge(structuredClone(defaultState), JSON.parse(saved));
    merged.connectivity = merged.offline ? 'Offline' : 'Online';
    return merged;
  } catch {
    return structuredClone(defaultState);
  }
}

function deepMerge(base, incoming) {
  Object.keys(incoming || {}).forEach((key) => {
    if (incoming[key] && typeof incoming[key] === 'object' && !Array.isArray(incoming[key])) {
      base[key] = deepMerge(base[key] || {}, incoming[key]);
    } else {
      base[key] = incoming[key];
    }
  });
  return base;
}

function saveState() {
  state.lastUpdated = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getRouteFromHash() {
  const route = location.hash.replace('#/', '');
  return ROUTES.includes(route) ? route : 'dashboard';
}

function renderNav() {
  nav.innerHTML = ROUTES.map((route) => {
    const active = route === state.route ? 'active' : '';
    const label = routeTitles[route];
    return `<button class="nav-link ${active}" data-route="${route}">${label}</button>`;
  }).join('');

  nav.querySelectorAll('.nav-link').forEach((btn) => {
    btn.addEventListener('click', () => {
      const route = btn.dataset.route;
      if (route !== state.route) history.pushState({}, '', `#/${route}`);
      state.route = route;
      render();
    });
  });
}

function render() {
  state.connectivity = state.offline ? 'Offline' : 'Online';
  const activeFaults = state.faults.filter((f) => f.status === 'active');
  const rainExpected = state.weather.forecast.some((f) => f.rain >= 60);
  state.weather.rainExpected = rainExpected;

  pageTitle.textContent = routeTitles[state.route];
  subtitle.textContent = `Farm: ${state.settings.farmName} • Device: ${state.settings.deviceId}`;
  connectivityBadge.textContent = `${state.connectivity}`;
  connectivityBadge.className = `pill ${state.offline ? 'danger' : 'ok'}`;
  updatedAt.textContent = `Updated ${new Date(state.lastUpdated).toLocaleTimeString()}`;

  renderNav();
  const warningHtml = renderGlobalWarnings(activeFaults, rainExpected);
  view.innerHTML = warningHtml + renderRoute(activeFaults, rainExpected);
  bindViewEvents(activeFaults);
  drawHistoryChart();
  saveState();
}

function renderGlobalWarnings(activeFaults, rainExpected) {
  const warnings = [];
  if (state.offline) warnings.push('System is in offline simulation mode. Live updates are paused.');
  if (state.tankLevel < state.settings.minTankLevel) warnings.push('Tank level is below safety minimum. Pump auto-stop enforced.');
  if (activeFaults.length) warnings.push(`Active faults: ${activeFaults.length}. Control actions may be restricted.`);
  if (rainExpected) warnings.push('Forecast affects irrigation: high rain probability detected.');

  if (!warnings.length) return '';
  const rainClass = rainExpected ? 'rain' : '';
  return `<section class="alert-banner ${rainClass}"><strong>System status:</strong><ul>${warnings.map((w) => `<li>${w}</li>`).join('')}</ul></section>`;
}

function renderRoute(activeFaults, rainExpected) {
  if (state.route === 'dashboard') return renderDashboard(activeFaults);
  if (state.route === 'control') return renderControl(activeFaults);
  if (state.route === 'history') return renderHistory();
  if (state.route === 'faults') return renderFaults();
  if (state.route === 'users') return renderUsers();
  if (state.route === 'weather') return renderWeather(rainExpected);
  return renderSettings();
}

function metricCard(title, value, unit, progressValue, warningMode, stamp = '') {
  const progressClass = warningMode === 'danger' ? 'danger' : warningMode === 'warn' ? 'warn' : '';
  return `
    <article class="card">
      <div class="metric-title">${title}</div>
      <div class="metric-value">${value}${unit ? `<span class="muted"> ${unit}</span>` : ''}</div>
      ${typeof progressValue === 'number' ? `<div class="progress ${progressClass}"><span style="width:${clamp(progressValue, 0, 100)}%"></span></div>` : ''}
      ${stamp ? `<div class="muted" style="margin-top:0.4rem;font-size:0.75rem;">${stamp}</div>` : ''}
    </article>`;
}

function renderDashboard(activeFaults) {
  const now = new Date(state.lastUpdated).toLocaleTimeString();
  const lowTank = state.tankLevel < state.settings.minTankLevel;
  const cards = [
    metricCard('Soil Moisture', state.soilMoisture.toFixed(1), '%', state.soilMoisture, state.soilMoisture < 30 ? 'danger' : state.soilMoisture < 40 ? 'warn' : ''),
    metricCard('Tank Level', state.tankLevel.toFixed(1), '%', state.tankLevel, lowTank ? 'danger' : state.tankLevel < 28 ? 'warn' : ''),
    metricCard('Flow Rate', state.flowRate.toFixed(1), 'L/min', clamp(state.flowRate * 5.5, 0, 100), state.flowRate < 1 && state.pumpOn ? 'danger' : ''),
    metricCard('Temperature', state.temperature.toFixed(1), '°C', clamp((state.temperature - 10) * 2.5, 0, 100), state.temperature > 36 ? 'warn' : ''),
    metricCard('Battery Voltage', state.batteryVoltage.toFixed(2), 'V', clamp((state.batteryVoltage - 10.5) * 50, 0, 100), state.batteryVoltage < 11.4 ? 'warn' : ''),
    metricCard('Solar Charging', state.solarCharging.toFixed(0), '%', state.solarCharging, state.solarCharging < 20 ? 'warn' : ''),
    metricCard('Pump State', state.pumpOn ? 'ON' : 'OFF', '', state.pumpOn ? 100 : 0, state.pumpOn ? '' : 'warn', `as of ${now}`),
    metricCard('Valve State', state.valveOpen ? 'OPEN' : 'CLOSED', '', state.valveOpen ? 100 : 0, state.valveOpen ? '' : 'warn', `as of ${now}`),
    metricCard('Connectivity', state.connectivity, '', state.offline ? 0 : 100, state.offline ? 'danger' : '', `as of ${now}`),
    metricCard('System Mode', state.mode.toUpperCase(), '', state.mode === 'auto' ? 100 : 55, '', `as of ${now}`)
  ];

  return `
    <section class="grid sensor-grid">${cards.join('')}</section>
    <section class="grid control-grid">
      <article class="card">
        <h3>Demo status</h3>
        <p class="muted">This interface is simulation-only. Sensor and control values are generated locally and do not represent live hardware telemetry.</p>
        <p>Active faults: <strong class="${activeFaults.length ? 'danger' : 'ok'}">${activeFaults.length}</strong></p>
      </article>
      <article class="card">
        <h3>Irrigation recommendation</h3>
        <p class="muted">${buildIrrigationRecommendation()}</p>
        <p>Last update: ${new Date(state.lastUpdated).toLocaleString()}</p>
      </article>
    </section>`;
}

function renderControl(activeFaults) {
  const canStartPump = !state.offline && state.tankLevel >= state.settings.minTankLevel;
  const hasBlockingFault = activeFaults.some((fault) => ['critical', 'high'].includes(fault.severity));

  return `
    <section class="grid control-grid">
      <article class="card">
        <h3>Actuators</h3>
        <div class="button-row">
          <button id="pumpOnBtn" class="primary" ${(!canStartPump || hasBlockingFault) ? 'disabled' : ''}>Pump ON</button>
          <button id="pumpOffBtn">Pump OFF</button>
          <button id="valveOnBtn" ${state.offline ? 'disabled' : ''}>Valve ON</button>
          <button id="valveOffBtn">Valve OFF</button>
        </div>
        <p class="muted">Safety: pump cannot start below ${state.settings.minTankLevel}% tank level.</p>
      </article>
      <article class="card">
        <h3>Mode & simulation</h3>
        <div class="button-row">
          <button id="modeToggleBtn" class="ghost">Switch to ${state.mode === 'auto' ? 'manual' : 'auto'} mode</button>
          <button id="simFaultBtn" class="warn">Simulate fault</button>
          <button id="offlineBtn" class="${state.offline ? 'primary' : ''}">${state.offline ? 'Restore online' : 'Simulate offline'}</button>
          <button id="resetBtn" class="danger">Reset system</button>
        </div>
        <p class="muted">Manual override is limited while offline.</p>
      </article>
    </section>
    <section class="card">
      <h3>Current control state</h3>
      <p>Pump: <strong>${state.pumpOn ? 'ON' : 'OFF'}</strong> • Valve: <strong>${state.valveOpen ? 'OPEN' : 'CLOSED'}</strong> • Mode: <strong>${state.mode.toUpperCase()}</strong></p>
    </section>`;
}

function renderHistory() {
  const filtered = getFilteredHistory();
  return `
    <section class="card">
      <div class="button-row">
        <button data-filter="1h" class="history-filter ${state.historyFilter === '1h' ? 'primary' : ''}">Last hour</button>
        <button data-filter="24h" class="history-filter ${state.historyFilter === '24h' ? 'primary' : ''}">Last 24 hours</button>
        <button data-filter="7d" class="history-filter ${state.historyFilter === '7d' ? 'primary' : ''}">Last 7 days</button>
      </div>
      <canvas id="historyChart" class="chart-canvas" width="900" height="240"></canvas>
      <p class="muted">History is simulated and stored in localStorage for this browser only.</p>
    </section>
    <section class="card table-wrap">
      <table>
        <thead>
          <tr><th>Time</th><th>Soil %</th><th>Tank %</th><th>Flow L/min</th><th>Temp °C</th><th>Battery V</th></tr>
        </thead>
        <tbody>
          ${filtered.slice(-14).reverse().map((entry) => `
            <tr>
              <td>${new Date(entry.ts).toLocaleString()}</td>
              <td>${entry.soil.toFixed(1)}</td>
              <td>${entry.tank.toFixed(1)}</td>
              <td>${entry.flow.toFixed(1)}</td>
              <td>${entry.temp.toFixed(1)}</td>
              <td>${entry.battery.toFixed(2)}</td>
            </tr>`).join('') || '<tr><td colspan="6" class="muted">No data yet.</td></tr>'}
        </tbody>
      </table>
    </section>`;
}

function renderFaults() {
  const active = state.faults.filter((f) => f.status === 'active');
  const resolved = state.faults.filter((f) => f.status === 'resolved');

  const faultTable = (rows, title) => `
    <article class="card table-wrap">
      <h3>${title}</h3>
      <table>
        <thead><tr><th>Fault</th><th>Severity</th><th>Time</th><th>Status</th><th>Description</th><th>Action</th></tr></thead>
        <tbody>
          ${rows.map((fault) => `
            <tr>
              <td>${fault.type}</td>
              <td class="${fault.severity === 'critical' ? 'danger' : fault.severity === 'high' ? 'warn' : ''}">${fault.severity}</td>
              <td>${new Date(fault.time).toLocaleString()}</td>
              <td>${fault.status}</td>
              <td>${fault.description}</td>
              <td>
                ${fault.status === 'active' ? `<button data-fault-action="ack" data-id="${fault.id}">Acknowledge</button> <button data-fault-action="resolve" data-id="${fault.id}">Resolve</button>` : `<button data-fault-action="reopen" data-id="${fault.id}">Re-open</button>`}
              </td>
            </tr>`).join('') || `<tr><td colspan="6" class="muted">No entries.</td></tr>`}
        </tbody>
      </table>
    </article>`;

  return `<section class="grid fault-grid">${faultTable(active, 'Active faults')}${faultTable(resolved, 'Resolved faults')}</section>`;
}

function renderUsers() {
  const editing = state.users.find((u) => u.id === editingUserId);
  return `
    <section class="grid users-grid">
      <article class="card table-wrap">
        <h3>Demo users</h3>
        <table>
          <thead><tr><th>Name</th><th>Role</th><th>Actions</th></tr></thead>
          <tbody>
            ${state.users.map((user) => `
              <tr>
                <td>${user.name}</td>
                <td>${user.role}</td>
                <td>
                  <button data-user-action="edit" data-id="${user.id}">Edit</button>
                  <button data-user-action="delete" data-id="${user.id}" class="danger">Delete</button>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </article>
      <article class="card">
        <h3>${editing ? 'Edit user' : 'Add user'}</h3>
        <form id="userForm" class="form-grid">
          <label>Name<input id="userName" required value="${editing ? editing.name : ''}" /></label>
          <label>Role
            <select id="userRole">
              ${['owner', 'worker', 'admin'].map((role) => `<option value="${role}" ${editing && editing.role === role ? 'selected' : ''}>${role}</option>`).join('')}
            </select>
          </label>
          <div class="button-row">
            <button class="primary" type="submit">${editing ? 'Update user' : 'Add user'}</button>
            ${editing ? '<button id="cancelEditBtn" type="button" class="ghost">Cancel</button>' : ''}
          </div>
        </form>
      </article>
    </section>`;
}

function renderWeather(rainExpected) {
  const advice = buildIrrigationRecommendation();
  return `
    ${rainExpected ? '<section class="alert-banner rain">Forecast affects irrigation: reduce runtime and monitor tank reserve.</section>' : ''}
    <section class="grid weather-grid">
      ${state.weather.forecast.map((item) => `
        <article class="card">
          <h3>${item.day}</h3>
          <p>${item.condition}</p>
          <p>Rain probability: <strong>${item.rain}%</strong></p>
          <p class="muted">${item.low}°C - ${item.high}°C</p>
        </article>`).join('')}
    </section>
    <section class="card">
      <h3>Irrigation advice</h3>
      <p>${advice}</p>
      <div class="button-row">
        <button id="randomizeWeatherBtn">Generate new forecast</button>
      </div>
    </section>`;
}

function renderSettings() {
  const uptimeSeconds = Math.floor((Date.now() - state.startedAt) / 1000);
  return `
    <section class="grid settings-grid">
      <article class="card">
        <h3>Thresholds & preferences</h3>
        <form id="settingsForm" class="form-grid">
          <label>Soil moisture target (%)<input type="number" min="20" max="85" name="soilTarget" value="${state.settings.soilTarget}" /></label>
          <label>Minimum tank level (%)<input type="number" min="5" max="50" name="minTankLevel" value="${state.settings.minTankLevel}" /></label>
          <label>Flow timeout (minutes)<input type="number" min="1" max="20" name="flowTimeoutMinutes" value="${state.settings.flowTimeoutMinutes}" /></label>
          <label class="inline"><input type="checkbox" class="checkbox" name="alertsEnabled" ${state.settings.alertsEnabled ? 'checked' : ''}/> Alerts enabled</label>
          <label>Farm name<input name="farmName" value="${state.settings.farmName}" /></label>
          <button class="primary" type="submit">Save settings</button>
        </form>
      </article>
      <article class="card">
        <h3>System info</h3>
        <p>Device ID: <strong>${state.settings.deviceId}</strong></p>
        <p>Farm: <strong>${state.settings.farmName}</strong></p>
        <p>App version: <strong>${state.settings.appVersion}</strong></p>
        <p>Uptime: <strong>${formatDuration(uptimeSeconds)}</strong></p>
      </article>
    </section>`;
}

function bindViewEvents(activeFaults) {
  const byId = (id) => document.getElementById(id);

  if (state.route === 'control') {
    byId('pumpOnBtn')?.addEventListener('click', () => {
      if (state.offline) return notify('Manual pump start blocked while offline.', 'danger');
      if (state.tankLevel < state.settings.minTankLevel) {
        addFault('tank low', 'high', 'Tank level is below configured minimum. Pump start blocked.');
        return notify('Cannot start pump: low tank level.', 'danger');
      }
      if (activeFaults.some((f) => ['critical', 'high'].includes(f.severity))) {
        return notify('Resolve critical/high faults before starting pump.', 'warn');
      }
      state.pumpOn = true;
      notify('Pump started (simulation).');
      render();
    });

    byId('pumpOffBtn')?.addEventListener('click', () => {
      state.pumpOn = false;
      state.flowRate = 0;
      notify('Pump stopped.');
      render();
    });

    byId('valveOnBtn')?.addEventListener('click', () => {
      if (state.offline) return notify('Cannot open valve while offline.', 'warn');
      state.valveOpen = true;
      notify('Valve opened.');
      render();
    });

    byId('valveOffBtn')?.addEventListener('click', () => {
      state.valveOpen = false;
      notify('Valve closed.');
      render();
    });

    byId('modeToggleBtn')?.addEventListener('click', () => {
      if (!confirm('Switch system mode?')) return;
      state.mode = state.mode === 'auto' ? 'manual' : 'auto';
      notify(`Mode changed to ${state.mode}.`, 'warn');
      render();
    });

    byId('simFaultBtn')?.addEventListener('click', () => {
      const selected = prompt('Simulate fault type: leak, no-flow, or sensor', 'leak');
      if (!selected) return;
      const type = selected.trim().toLowerCase();
      if (type === 'leak') {
        state.leakSim = true;
        addFault('leak suspected', 'critical', 'Simulated leak causes faster tank depletion.');
        notify('Leak fault simulated.', 'warn');
      } else if (type === 'no-flow') {
        state.noFlowSim = true;
        addFault('no flow detected', 'critical', 'Simulated no-flow condition while pump is commanded on.');
        notify('No-flow fault simulated.', 'warn');
      } else if (type === 'sensor') {
        addFault('sensor error', 'medium', 'Simulated sensor calibration anomaly.');
        notify('Sensor fault simulated.', 'warn');
      } else {
        notify('Unknown fault type. Use leak, no-flow, or sensor.', 'danger');
      }
      render();
    });

    byId('offlineBtn')?.addEventListener('click', () => {
      if (!confirm(`${state.offline ? 'Restore online mode?' : 'Enable offline simulation mode?'}`)) return;
      state.offline = !state.offline;
      if (state.offline) {
        addFault('offline mode', 'high', 'Connectivity disabled. Manual control restrictions apply.');
        state.connectivity = 'Offline';
        state.pumpOn = false;
      } else {
        resolveFaultByType('offline mode');
        state.connectivity = 'Online';
      }
      notify(`Connectivity ${state.offline ? 'offline' : 'online'}.`, state.offline ? 'warn' : 'ok');
      render();
    });

    byId('resetBtn')?.addEventListener('click', () => {
      if (!confirm('Reset the full demo state?')) return;
      const keepUsers = structuredClone(state.users);
      Object.assign(state, structuredClone(defaultState));
      state.users = keepUsers;
      editingUserId = null;
      notify('System reset complete.', 'warn');
      render();
    });
  }

  if (state.route === 'history') {
    document.querySelectorAll('.history-filter').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.historyFilter = btn.dataset.filter;
        render();
      });
    });
  }

  if (state.route === 'faults') {
    document.querySelectorAll('button[data-fault-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const action = btn.dataset.faultAction;
        const fault = state.faults.find((f) => f.id === id);
        if (!fault) return;

        if (action === 'ack') {
          fault.description = `${fault.description} (acknowledged)`;
          notify(`Fault acknowledged: ${fault.type}`, 'warn');
        }
        if (action === 'resolve') {
          fault.status = 'resolved';
          notify(`Fault resolved: ${fault.type}`);
          if (fault.type === 'leak suspected') state.leakSim = false;
          if (fault.type === 'offline mode') state.offline = false;
          if (fault.type === 'no flow detected') state.noFlowSim = false;
        }
        if (action === 'reopen') {
          fault.status = 'active';
          notify(`Fault re-opened: ${fault.type}`, 'warn');
        }
        render();
      });
    });
  }

  if (state.route === 'users') {
    document.querySelectorAll('button[data-user-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const action = btn.dataset.userAction;
        if (action === 'edit') {
          editingUserId = id;
          render();
        }
        if (action === 'delete') {
          state.users = state.users.filter((u) => u.id !== id);
          if (editingUserId === id) editingUserId = null;
          notify('User removed.', 'warn');
          render();
        }
      });
    });

    document.getElementById('userForm')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const name = document.getElementById('userName').value.trim();
      const role = document.getElementById('userRole').value;
      if (!name) return notify('Name is required.', 'danger');

      if (editingUserId) {
        const user = state.users.find((u) => u.id === editingUserId);
        if (!user) return;
        user.name = name;
        user.role = role;
        editingUserId = null;
        notify('User updated.');
      } else {
        state.users.push({ id: crypto.randomUUID(), name, role });
        notify('User added.');
      }
      render();
    });

    document.getElementById('cancelEditBtn')?.addEventListener('click', () => {
      editingUserId = null;
      render();
    });
  }

  if (state.route === 'weather') {
    byId('randomizeWeatherBtn')?.addEventListener('click', () => {
      state.weather.forecast = createForecast();
      notify('Forecast updated.');
      render();
    });
  }

  if (state.route === 'settings') {
    document.getElementById('settingsForm')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = new FormData(event.target);
      state.settings.soilTarget = clamp(Number(formData.get('soilTarget')), 20, 85);
      state.settings.minTankLevel = clamp(Number(formData.get('minTankLevel')), 5, 50);
      state.settings.flowTimeoutMinutes = clamp(Number(formData.get('flowTimeoutMinutes')), 1, 20);
      state.settings.alertsEnabled = Boolean(formData.get('alertsEnabled'));
      state.settings.farmName = String(formData.get('farmName') || '').trim() || state.settings.farmName;
      notify('Settings saved.');
      render();
    });
  }
}

function simulateTick() {
  if (state.offline) {
    state.flowRate = 0;
    state.solarCharging = Math.max(5, state.solarCharging - 1);
    state.batteryVoltage = clamp(state.batteryVoltage - 0.01, 11, 13.1);
    pushHistoryPoint();
    render();
    return;
  }

  applyWeatherEffects();

  if (state.mode === 'auto') {
    const shouldIrrigate = state.soilMoisture < state.settings.soilTarget - 8 && state.tankLevel > state.settings.minTankLevel && !state.weather.rainExpected;
    if (shouldIrrigate) {
      state.pumpOn = true;
      state.valveOpen = true;
    }
    if (state.soilMoisture >= state.settings.soilTarget || state.weather.rainExpected) {
      state.pumpOn = false;
      state.valveOpen = false;
    }
  }

  if (state.pumpOn) {
    if (state.tankLevel <= state.settings.minTankLevel) {
      state.pumpOn = false;
      state.flowRate = 0;
      addFault('tank low', 'high', 'Pump auto-stopped to protect system when tank dropped below minimum.');
      notify('Pump stopped automatically: low tank.', 'danger');
    } else {
      const leakFactor = state.leakSim ? 1.8 : 1;
      const targetFlow = state.noFlowSim ? 0 : clamp(8 + (state.valveOpen ? 4.2 : 1.5), 0, 14);
      state.flowRate = targetFlow;
      state.tankLevel = clamp(state.tankLevel - (0.9 * leakFactor), 0, 100);
      state.soilMoisture = clamp(state.soilMoisture + (state.valveOpen ? 1.3 : 0.35), 0, 100);
      if (state.flowRate < 0.8) {
        state.noFlowTicks += 1;
      } else {
        state.noFlowTicks = 0;
      }
    }
  } else {
    state.flowRate = Math.max(0, state.flowRate - 1.2);
    state.soilMoisture = clamp(state.soilMoisture - 0.45, 0, 100);
    state.noFlowTicks = 0;
  }

  if (state.leakSim) {
    state.tankLevel = clamp(state.tankLevel - 0.8, 0, 100);
  }

  const timeoutTicks = Math.max(1, Math.round((state.settings.flowTimeoutMinutes * 60) / 3));
  if (state.pumpOn && state.noFlowTicks >= timeoutTicks) {
    state.noFlowSim = true;
    addFault('no flow detected', 'critical', 'Pump commanded on but flow remains below expected threshold.');
    state.pumpOn = false;
    notify('No-flow fault triggered. Pump stopped.', 'danger');
  }

  if (state.tankLevel < state.settings.minTankLevel) {
    addFault('tank low', 'high', 'Tank level has fallen below minimum threshold.');
  } else {
    resolveFaultByType('tank low');
  }

  if (Math.random() < 0.05) {
    state.temperature = clamp(state.temperature + randomBetween(-0.4, 0.8), 15, 40);
  }

  state.solarCharging = clamp(state.solarCharging + randomBetween(-3, 4), 0, 100);
  state.batteryVoltage = clamp(state.batteryVoltage + (state.solarCharging > 35 ? 0.015 : -0.02), 11.0, 13.1);

  maybeInjectSensorError();
  pushHistoryPoint();
  render();
}

function applyWeatherEffects() {
  const rainChance = state.weather.forecast[0]?.rain || 10;
  if (rainChance >= 60) {
    state.weather.current = 'Rainy';
    state.soilMoisture = clamp(state.soilMoisture + 0.45, 0, 100);
    state.temperature = clamp(state.temperature - 0.2, 15, 40);
    state.solarCharging = clamp(state.solarCharging - 2.2, 0, 100);
  } else if (rainChance >= 35) {
    state.weather.current = 'Cloudy';
    state.soilMoisture = clamp(state.soilMoisture + 0.1, 0, 100);
    state.temperature = clamp(state.temperature + randomBetween(-0.15, 0.25), 15, 40);
  } else {
    state.weather.current = 'Sunny';
    state.soilMoisture = clamp(state.soilMoisture - 0.18, 0, 100);
    state.temperature = clamp(state.temperature + randomBetween(0.05, 0.4), 15, 40);
    state.solarCharging = clamp(state.solarCharging + 1.8, 0, 100);
  }
}

function maybeInjectSensorError() {
  if (Math.random() < 0.015) {
    addFault('sensor error', 'medium', 'Intermittent simulated sensor calibration anomaly.');
  }
}

function ensureHistorySeed() {
  if (state.history.length > 0) return;
  const now = Date.now();
  for (let i = 40; i >= 1; i -= 1) {
    state.history.push({
      ts: now - i * 15 * 60 * 1000,
      soil: clamp(state.soilMoisture + randomBetween(-4.5, 3.2), 0, 100),
      tank: clamp(state.tankLevel + randomBetween(-7, 5), 0, 100),
      flow: clamp(state.flowRate + randomBetween(0, 6), 0, 14),
      temp: clamp(state.temperature + randomBetween(-2, 2), 15, 40),
      battery: clamp(state.batteryVoltage + randomBetween(-0.15, 0.12), 11, 13.1)
    });
  }
}

function pushHistoryPoint() {
  state.history.push({
    ts: Date.now(),
    soil: state.soilMoisture,
    tank: state.tankLevel,
    flow: state.flowRate,
    temp: state.temperature,
    battery: state.batteryVoltage
  });
  const maxPoints = 7 * 24 * 20;
  if (state.history.length > maxPoints) {
    state.history.splice(0, state.history.length - maxPoints);
  }
}

function getFilteredHistory() {
  const now = Date.now();
  const ranges = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000
  };
  const windowMs = ranges[state.historyFilter] || ranges['24h'];
  return state.history.filter((entry) => now - entry.ts <= windowMs);
}

function drawHistoryChart() {
  if (state.route !== 'history') return;
  const canvas = document.getElementById('historyChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const points = getFilteredHistory();
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  ctx.strokeStyle = '#28436e';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = (height / 4) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  if (points.length < 2) return;
  const drawLine = (mapper, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach((p, i) => {
      const x = (i / (points.length - 1)) * (width - 20) + 10;
      const y = height - 12 - mapper(p) * (height - 24);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  };

  drawLine((p) => p.soil / 100, '#22c55e');
  drawLine((p) => p.tank / 100, '#38bdf8');
  drawLine((p) => clamp(p.flow / 14, 0, 1), '#f59e0b');

  ctx.fillStyle = '#22c55e';
  ctx.font = '12px sans-serif';
  ctx.fillText('Soil', 14, 16);
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('Tank', 52, 16);
  ctx.fillStyle = '#f59e0b';
  ctx.fillText('Flow', 88, 16);
}

function addFault(type, severity, description) {
  const existing = state.faults.find((fault) => fault.type === type && fault.status === 'active');
  if (existing) return;
  state.faults.unshift({
    id: crypto.randomUUID(),
    type,
    severity,
    time: Date.now(),
    status: 'active',
    description
  });
}

function resolveFaultByType(type) {
  state.faults.forEach((fault) => {
    if (fault.type === type && fault.status === 'active') fault.status = 'resolved';
  });
}

function buildIrrigationRecommendation() {
  if (state.weather.rainExpected) return 'Rain is likely soon. Keep irrigation in short pulses and prioritize tank reserve.';
  if (state.soilMoisture < state.settings.soilTarget - 10) return 'Soil is dry. Run irrigation cycles until target moisture is reached.';
  if (state.tankLevel < state.settings.minTankLevel + 6) return 'Tank is trending low. Delay non-critical watering and refill tank first.';
  return 'Conditions look stable. Continue normal scheduling with auto mode.';
}

function createForecast() {
  const labels = ['Today', 'Tomorrow', 'Day 3'];
  return labels.map((label, i) => {
    const rain = clamp(Math.round(randomBetween(5, 85)), 5, 90);
    const condition = rain >= 65 ? 'Light Rain' : rain >= 35 ? 'Cloudy' : 'Sunny';
    const low = Math.round(randomBetween(15, 20));
    const high = Math.round(randomBetween(low + 4, low + 12));
    return { day: label, condition, rain, low, high: high + i };
  });
}

function notify(message, type = 'ok') {
  if (!state.settings.alertsEnabled && type !== 'danger') return;
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'warn' ? 'warn' : type === 'danger' ? 'danger' : ''}`;
  toast.innerHTML = `<strong>${message}</strong><div class="muted">${new Date().toLocaleTimeString()}</div>`;
  toastWrap.appendChild(toast);
  setTimeout(() => toast.remove(), 3600);
}

function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}h ${m}m ${s}s`;
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
