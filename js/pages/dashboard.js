// Movie Recommendation System — AI Intelligence Dashboard
// Full-page analytics with Canvas-based visualizations

// ──────────────────────────────────
// CHART LIBRARY (Vanilla Canvas)
// ──────────────────────────────────

const ChartColors = {
  purple: '#7c3aed',
  pink: '#ec4899',
  cyan: '#06b6d4',
  emerald: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  indigo: '#6366f1',
  teal: '#14b8a6',
  gradient: (ctx, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(124,58,237,0.7)');
    g.addColorStop(1, 'rgba(124,58,237,0.05)');
    return g;
  },
  palette: ['#7c3aed', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#14b8a6', '#f97316', '#8b5cf6']
};

/**
 * Create a high-DPI canvas inside a container element.
 */
function createCanvas(containerId, w, h) {
  const container = document.getElementById(containerId);
  if (!container) return null;
  container.innerHTML = '';
  const canvas = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  container.appendChild(canvas);
  return { canvas, ctx, w, h };
}

/**
 * Draw a bar chart with animated bars.
 */
function drawBarChart(containerId, labels, values, options = {}) {
  const { color = ChartColors.purple, barColors = null, title = '', yLabel = '', showValues = true, horizontal = false } = options;
  const container = document.getElementById(containerId);
  if (!container) return;
  const cw = container.offsetWidth || 400;
  const ch = options.height || 260;
  const c = createCanvas(containerId, cw, ch);
  if (!c) return;
  const { ctx, w, h } = c;

  const pad = { top: 30, right: 20, bottom: 50, left: 50 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;
  const maxVal = Math.max(...values, 1);

  // Title
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '600 12px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left';
  if (title) ctx.fillText(title, pad.left, 18);

  // Y-axis gridlines
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  const gridCount = 5;
  for (let i = 0; i <= gridCount; i++) {
    const y = pad.top + chartH - (i / gridCount) * chartH;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(w - pad.right, y);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '10px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(Math.round((maxVal / gridCount) * i), pad.left - 6, y + 4);
  }

  // Y-axis label
  if (yLabel) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '10px Inter, system-ui, sans-serif';
    ctx.translate(12, pad.top + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();
  }

  // Bars
  const barCount = labels.length;
  const gap = Math.max(4, chartW * 0.1 / barCount);
  const barW = Math.max(6, (chartW - gap * (barCount + 1)) / barCount);

  labels.forEach((label, i) => {
    const x = pad.left + gap + i * (barW + gap);
    const barH = (values[i] / maxVal) * chartH;
    const y = pad.top + chartH - barH;

    // Bar gradient
    const barColor = barColors ? barColors[i % barColors.length] : color;
    const grad = ctx.createLinearGradient(x, y, x, pad.top + chartH);
    grad.addColorStop(0, barColor);
    grad.addColorStop(1, barColor + '33');
    ctx.fillStyle = grad;
    ctx.beginPath();
    const r = Math.min(4, barW / 2);
    ctx.moveTo(x, pad.top + chartH);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.lineTo(x + barW - r, y);
    ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);
    ctx.lineTo(x + barW, pad.top + chartH);
    ctx.closePath();
    ctx.fill();

    // Glow
    ctx.shadowColor = barColor;
    ctx.shadowBlur = 8;
    ctx.fillStyle = barColor + '44';
    ctx.fillRect(x, y, barW, 2);
    ctx.shadowBlur = 0;

    // Value label
    if (showValues && values[i] > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = '600 10px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(values[i], x + barW / 2, y - 6);
    }

    // X-axis label
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '10px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(x + barW / 2, h - pad.bottom + 14);
    if (label.length > 8) {
      ctx.rotate(-0.4);
      ctx.textAlign = 'right';
    }
    ctx.fillText(label.length > 12 ? label.slice(0, 11) + '…' : label, 0, 0);
    ctx.restore();
  });
}

/**
 * Draw an area chart with gradient fill.
 */
function drawAreaChart(containerId, labels, datasets, options = {}) {
  const { title = '', height: ch = 280, legend = true } = options;
  const container = document.getElementById(containerId);
  if (!container) return;
  const cw = container.offsetWidth || 500;
  const c = createCanvas(containerId, cw, ch);
  if (!c) return;
  const { ctx, w, h } = c;

  const pad = { top: 30, right: 20, bottom: 50, left: 50 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;

  // Find max across all datasets
  let maxVal = 1;
  Object.values(datasets).forEach(data => {
    maxVal = Math.max(maxVal, ...data);
  });

  // Title
  if (title) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '600 12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(title, pad.left, 18);
  }

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + chartH - (i / 4) * chartH;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(w - pad.right, y);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '10px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(Math.round((maxVal / 4) * i), pad.left - 6, y + 4);
  }

  // X labels
  labels.forEach((label, i) => {
    const x = pad.left + (i / Math.max(1, labels.length - 1)) * chartW;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '9px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label.slice(5), x, h - pad.bottom + 16); // Show MM-DD
  });

  // Draw each dataset
  const colorKeys = Object.keys(datasets);
  const colors = [ChartColors.purple, ChartColors.pink, ChartColors.emerald, ChartColors.amber];

  colorKeys.forEach((key, di) => {
    const data = datasets[key];
    const col = colors[di % colors.length];

    // Area fill
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top + chartH);
    data.forEach((val, i) => {
      const x = pad.left + (i / Math.max(1, data.length - 1)) * chartW;
      const y = pad.top + chartH - (val / maxVal) * chartH;
      if (i === 0) ctx.lineTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(pad.left + chartW, pad.top + chartH);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
    grad.addColorStop(0, col + '40');
    grad.addColorStop(1, col + '05');
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    data.forEach((val, i) => {
      const x = pad.left + (i / Math.max(1, data.length - 1)) * chartW;
      const y = pad.top + chartH - (val / maxVal) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Dots
    data.forEach((val, i) => {
      if (val === 0) return;
      const x = pad.left + (i / Math.max(1, data.length - 1)) * chartW;
      const y = pad.top + chartH - (val / maxVal) * chartH;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();
    });
  });

  // Legend
  if (legend && colorKeys.length > 0) {
    let lx = pad.left;
    colorKeys.forEach((key, i) => {
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(lx, h - 14, 10, 10);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '10px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(key, lx + 14, h - 5);
      lx += ctx.measureText(key).width + 30;
    });
  }
}

/**
 * Draw a doughnut / ring chart.
 */
function drawDoughnutChart(containerId, labels, values, options = {}) {
  const { title = '', height: ch = 240, colors = ChartColors.palette } = options;
  const container = document.getElementById(containerId);
  if (!container) return;
  const cw = container.offsetWidth || 300;
  const c = createCanvas(containerId, cw, ch);
  if (!c) return;
  const { ctx, w, h } = c;

  const cx = w * 0.38;
  const cy = h / 2;
  const radius = Math.min(cx - 20, cy - 20);
  const innerRadius = radius * 0.55;
  const total = values.reduce((s, v) => s + v, 0) || 1;

  // Title
  if (title) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '600 12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(title, 10, 18);
  }

  let angle = -Math.PI / 2;
  labels.forEach((label, i) => {
    const sliceAngle = (values[i] / total) * Math.PI * 2;
    const col = colors[i % colors.length];

    // Draw slice
    ctx.beginPath();
    ctx.arc(cx, cy, radius, angle, angle + sliceAngle);
    ctx.arc(cx, cy, innerRadius, angle + sliceAngle, angle, true);
    ctx.closePath();
    ctx.fillStyle = col;
    ctx.fill();

    // Hover glow
    ctx.shadowColor = col;
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.shadowBlur = 0;

    angle += sliceAngle;
  });

  // Center text
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = '700 22px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(total, cx, cy + 4);
  ctx.font = '10px Inter, system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText('total', cx, cy + 20);

  // Legend (right side)
  const legendX = w * 0.64;
  labels.forEach((label, i) => {
    const ly = 40 + i * 24;
    if (ly > h - 10) return;
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.arc(legendX, ly, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${label} (${values[i]})`, legendX + 14, ly + 4);
  });
}

/**
 * Draw a horizontal bar chart for Q-value rankings.
 */
function drawHorizontalBarChart(containerId, labels, values, options = {}) {
  const { title = '', height: ch = 320, colors = null, maxLabel = 18 } = options;
  const container = document.getElementById(containerId);
  if (!container) return;
  const cw = container.offsetWidth || 500;
  const c = createCanvas(containerId, cw, ch);
  if (!c) return;
  const { ctx, w, h } = c;

  const pad = { top: 30, right: 60, bottom: 10, left: 140 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;
  const maxVal = Math.max(...values, 0.01);
  const barCount = labels.length;
  const gap = 6;
  const barH = Math.min(24, (chartH - gap * (barCount + 1)) / barCount);

  // Title
  if (title) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '600 12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(title, pad.left, 18);
  }

  labels.forEach((label, i) => {
    const y = pad.top + gap + i * (barH + gap);
    const barW = Math.max(2, (values[i] / maxVal) * chartW);

    // Bar
    const col = colors ? colors[i % colors.length] : ChartColors.palette[i % ChartColors.palette.length];
    const grad = ctx.createLinearGradient(pad.left, 0, pad.left + barW, 0);
    grad.addColorStop(0, col);
    grad.addColorStop(1, col + '88');
    ctx.fillStyle = grad;

    ctx.beginPath();
    const r = Math.min(4, barH / 2);
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + barW - r, y);
    ctx.quadraticCurveTo(pad.left + barW, y, pad.left + barW, y + r);
    ctx.lineTo(pad.left + barW, y + barH - r);
    ctx.quadraticCurveTo(pad.left + barW, y + barH, pad.left + barW - r, y + barH);
    ctx.lineTo(pad.left, y + barH);
    ctx.closePath();
    ctx.fill();

    // Glow
    ctx.shadowColor = col;
    ctx.shadowBlur = 6;
    ctx.fillStyle = col + '22';
    ctx.fillRect(pad.left, y, barW, barH);
    ctx.shadowBlur = 0;

    // Label
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    const truncated = label.length > maxLabel ? label.slice(0, maxLabel - 1) + '…' : label;
    ctx.fillText(truncated, pad.left - 10, y + barH / 2 + 4);

    // Value
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '600 11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(values[i], pad.left + barW + 8, y + barH / 2 + 4);
  });
}

/**
 * Draw a heatmap grid for genre × interaction type.
 */
function drawHeatmap(containerId, data, options = {}) {
  const { title = '', height: ch = 260 } = options;
  const container = document.getElementById(containerId);
  if (!container) return;
  const cw = container.offsetWidth || 500;
  const c = createCanvas(containerId, cw, ch);
  if (!c) return;
  const { ctx, w, h } = c;

  const genres = Object.keys(data);
  if (genres.length === 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '14px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No genre data yet — interact with movies to build the heatmap', w / 2, h / 2);
    return;
  }

  const eventTypes = ['view', 'click', 'rating', 'recommend_click'];
  const eventLabels = ['View', 'Click', 'Rate', 'Rec.Click'];
  const pad = { top: 35, right: 20, bottom: 30, left: 100 };
  const cellW = Math.min(70, (w - pad.left - pad.right) / eventTypes.length);
  const cellH = Math.min(30, (h - pad.top - pad.bottom) / genres.length);

  // Find max for color scale
  let maxVal = 1;
  genres.forEach(g => eventTypes.forEach(e => { maxVal = Math.max(maxVal, data[g][e] || 0); }));

  // Title
  if (title) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '600 12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(title, pad.left, 18);
  }

  // Column headers
  eventLabels.forEach((label, j) => {
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '10px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, pad.left + j * cellW + cellW / 2, pad.top - 6);
  });

  // Cells
  genres.forEach((genre, i) => {
    const y = pad.top + i * cellH;

    // Row label
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(genre.length > 12 ? genre.slice(0, 11) + '…' : genre, pad.left - 10, y + cellH / 2 + 4);

    eventTypes.forEach((type, j) => {
      const val = data[genre][type] || 0;
      const intensity = val / maxVal;
      const x = pad.left + j * cellW;

      // Cell bg
      ctx.fillStyle = `rgba(124,58,237,${0.05 + intensity * 0.75})`;
      ctx.beginPath();
      ctx.roundRect(x + 2, y + 2, cellW - 4, cellH - 4, 4);
      ctx.fill();

      // Cell value
      if (val > 0) {
        ctx.fillStyle = intensity > 0.5 ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.6)';
        ctx.font = `${intensity > 0.5 ? '700' : '400'} 11px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(val, x + cellW / 2, y + cellH / 2 + 4);
      }
    });
  });
}

/**
 * Draw a radar / spider chart for state coverage.
 */
function drawRadarChart(containerId, labels, values, options = {}) {
  const { title = '', height: ch = 280, maxVal: customMax = null } = options;
  const container = document.getElementById(containerId);
  if (!container) return;
  const cw = container.offsetWidth || 300;
  const c = createCanvas(containerId, cw, ch);
  if (!c) return;
  const { ctx, w, h } = c;

  if (labels.length < 3) {
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '14px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Need 3+ states for radar chart', w / 2, h / 2);
    return;
  }

  const cx = w / 2;
  const cy = h / 2 + 20; // Deeper vertical offset for large scale
  const radius = Math.min(cx - 180, cy - 130); // Increased padding to ensure full labels fit
  const maxVal = customMax || Math.max(...values, 1);
  const count = labels.length;

  // Title
  if (title) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '600 12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, cx, 18);
  }

  // Grid rings
  for (let ring = 1; ring <= 4; ring++) {
    const r = (ring / 4) * radius;
    ctx.beginPath();
    for (let i = 0; i <= count; i++) {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Axis lines
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.stroke();
  }

  // Data polygon
  ctx.beginPath();
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    const r = (values[i] / maxVal) * radius;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(124,58,237,0.25)';
  ctx.fill();
  ctx.strokeStyle = ChartColors.purple;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Data points + labels
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    const r = (values[i] / maxVal) * radius;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);

    // Point
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = ChartColors.purple;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Label
    const lx = cx + (radius + 28) * Math.cos(angle);
    const ly = cy + (radius + 28) * Math.sin(angle);
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; // Slightly brighter
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.textAlign = angle > Math.PI / 2 || angle < -Math.PI / 2 ? 'right' : (Math.abs(angle + Math.PI / 2) < 0.1 ? 'center' : 'left');
    const fullLabel = labels[i]; // Removed truncation
    ctx.fillText(fullLabel, lx, ly + 4);
  }
}


// ──────────────────────────────────
// DASHBOARD PAGE RENDERER
// ──────────────────────────────────

function renderDashboard() {
  const user = API.getUser();
  if (!user) {
    return `
      <div class="empty-state" style="padding-top:20px;">
        <div class="empty-icon">Note</div>
        <h3>Sign in required</h3>
        <p>Log in to access your ML Intelligence Dashboard.</p>
        <button class="btn btn-primary" onclick="showAuthModal('login')" style="margin-top:20px;">Sign In</button>
      </div>
    `;
  }

  return `
    <section class="dashboard-page">
      <div class="container">

        <!-- Dashboard Header -->
        <div class="dash-header fade-in">
          <div>
            <h1 class="dash-title">AI Intelligence Dashboard</h1>
            <p class="dash-subtitle">Real-time analytics from your personal AI recommendation model</p>
          </div>
          <div class="dash-header-actions">
            <div class="dash-model-badge" id="dash-model-badge">
              <span class="model-status-dot"></span>
              Loading...
            </div>
            <button class="btn btn-outline btn-sm sync-btn" onclick="syncDashboard(this)" style="display:flex;align-items:center;gap:8px;border-color:rgba(255,255,255,0.1);">
              <i class="fa-solid fa-rotate"></i>
              <span>Sync Now</span>
            </button>
          </div>
        </div>

        <!-- Summary KPI Cards -->
        <div class="dash-kpi-grid" id="dash-kpi-grid">
          ${renderKPILoader()}
        </div>

        <!-- Row 1: Interaction Timeline + Activity Breakdown -->
        <div class="dash-row">
          <div class="dash-chart-card dash-wide fade-in-up">
            <div class="dash-chart-head">
              <h3 class="dash-chart-title">User Interaction Trends</h3>
              <p class="dash-chart-desc">Your activity over time — each event feeds the AI model</p>
            </div>
            <div class="dash-chart-body" id="chart-timeline" style="height:280px;"></div>
          </div>
          <div class="dash-chart-card fade-in-up">
            <div class="dash-chart-head">
              <h3 class="dash-chart-title">Activity Breakdown</h3>
              <p class="dash-chart-desc">How you interact with movies</p>
            </div>
            <div class="dash-chart-body" id="chart-activity-doughnut" style="height:240px;"></div>
          </div>
        </div>

        <!-- Row 2: Q-Value Distribution + Recommendation Sources -->
        <div class="dash-row">
          <div class="dash-chart-card fade-in-up">
            <div class="dash-chart-head">
              <h3 class="dash-chart-title">Q-Value Distribution</h3>
              <p class="dash-chart-desc">Learned value estimates — higher = model is more confident about recommending</p>
            </div>
            <div class="dash-chart-body" id="chart-q-distribution" style="height:260px;"></div>
          </div>
          <div class="dash-chart-card fade-in-up">
            <div class="dash-chart-head">
              <h3 class="dash-chart-title">Explore vs Exploit</h3>
              <p class="dash-chart-desc">How your AI balances trying new things vs using what it knows</p>
            </div>
            <div class="dash-chart-body" id="chart-source-doughnut" style="height:240px;"></div>
          </div>
        </div>

        <!-- Row 3: Top Movie Q-Values (horizontal bars) -->
        <div class="dash-row">
          <div class="dash-chart-card dash-full fade-in-up">
            <div class="dash-chart-head">
              <h3 class="dash-chart-title">Most Recommended Movies</h3>
              <p class="dash-chart-desc">Movies the AI model ranks highest for you — these get prioritized in recommendations</p>
            </div>
            <div class="dash-chart-body" id="chart-movie-q-bars" style="height:380px;"></div>
          </div>
        </div>

        <!-- Row 4: Genre Heatmap + Rating Distribution -->
        <div class="dash-row">
          <div class="dash-chart-card dash-wide fade-in-up">
            <div class="dash-chart-head">
              <h3 class="dash-chart-title">Most Searched Genres</h3>
              <p class="dash-chart-desc">Which genres trigger which behaviors — darker cells = stronger signal</p>
            </div>
            <div class="dash-chart-body" id="chart-genre-heatmap" style="height:280px;"></div>
          </div>
          <div class="dash-chart-card fade-in-up">
            <div class="dash-chart-head">
              <h3 class="dash-chart-title">Your Ratings</h3>
              <p class="dash-chart-desc">Distribution of your explicit ratings</p>
            </div>
            <div class="dash-chart-body" id="chart-rating-dist" style="height:260px;"></div>
          </div>
        </div>

        <!-- Row 5: State-Space Radar + AI Config -->
        <div class="dash-row">
          <div class="dash-chart-card fade-in-up">
            <div class="dash-chart-head">
              <h3 class="dash-chart-title">State-Space Coverage</h3>
              <p class="dash-chart-desc">How many movies the model knows about in each context state</p>
            </div>
            <div class="dash-chart-body" id="chart-state-radar" style="height:550px;"></div>
          </div>
          <div class="dash-chart-card fade-in-up">
            <div class="dash-chart-head">
              <h3 class="dash-chart-title">Model Configuration</h3>
              <p class="dash-chart-desc">Current AI hyperparameters driving your recommendations</p>
            </div>
            <div class="dash-config-body" id="dash-config-body">
              ${renderAnalysisLoader()}
            </div>
          </div>
        </div>

        <!-- Row 6: State Details Table -->
        <div class="dash-row">
          <div class="dash-chart-card dash-full fade-in-up">
            <div class="dash-chart-head">
              <h3 class="dash-chart-title">Learned State Table</h3>
              <p class="dash-chart-desc">Every context state the model has learned — each state encodes Genre|Vibe|TimeOfDay</p>
            </div>
            <div class="dash-table-body" id="dash-state-table">
              ${renderAnalysisLoader()}
            </div>
          </div>
        </div>

        <!-- Row 7: ML Evaluation Metrics -->
        <div class="dash-row">
          <div class="dash-chart-card dash-full fade-in-up">
            <div class="dash-chart-head">
              <h3 class="dash-chart-title">ML Evaluation Metrics</h3>
              <p class="dash-chart-desc">Offline model quality: Precision, Recall, NDCG, Coverage — proves recommendation accuracy</p>
            </div>
            <div class="dash-metrics-body" id="dash-ml-metrics">
              ${renderAnalysisLoader()}
            </div>
          </div>
        </div>

        <!-- Row 8: Model Training Info -->
        <div class="dash-row">
          <div class="dash-chart-card dash-full fade-in-up">
            <div class="dash-chart-head">
              <h3 class="dash-chart-title">Model Training Info</h3>
              <p class="dash-chart-desc">Similarity model architecture, cold-start weights, and training metadata</p>
            </div>
            <div class="dash-metrics-body" id="dash-model-info">
              ${renderAnalysisLoader()}
            </div>
          </div>
        </div>

      </div>
    </section>
  `;
}

function renderKPILoader() {
  return `
    <div class="dash-kpi-card"><div class="dash-kpi-shimmer"></div></div>
    <div class="dash-kpi-card"><div class="dash-kpi-shimmer"></div></div>
    <div class="dash-kpi-card"><div class="dash-kpi-shimmer"></div></div>
    <div class="dash-kpi-card"><div class="dash-kpi-shimmer"></div></div>
    <div class="dash-kpi-card"><div class="dash-kpi-shimmer"></div></div>
    <div class="dash-kpi-card"><div class="dash-kpi-shimmer"></div></div>
  `;
}


// ──────────────────────────────────
// DASHBOARD DATA LOADING
// ──────────────────────────────────

async function loadDashboardData() {
  if (!API.isLoggedIn()) return;

  let d;
  try {
    const res = await API.get('/api/dashboard');
    if (res.ok && res.data && res.data.dashboard) {
      d = res.data.dashboard;
    } else {
      console.warn('Backend unavailable, using LocalAI for dashboard data.');
      d = LocalAI.getUserLearningStats();
    }
  } catch (error) {
    console.warn('Error fetching dashboard data, using LocalAI fallback.', error);
    d = LocalAI.getUserLearningStats();
  }

  // ── KPI Cards ──
  renderKPIs(d.summary);

  // ── Model Badge ──
  const badge = document.getElementById('dash-model-badge');
  const maturityLabels = { cold_start: 'Cold Start', learning: 'Learning', improving: 'Improving', mature: 'Mature' };
  const maturityColors = { cold_start: '#6b7280', learning: '#f59e0b', improving: '#10b981', mature: '#7c3aed' };
  if (badge) {
    badge.innerHTML = `<span class="model-status-dot" style="background:${maturityColors[d.summary.modelMaturity]}"></span> ${maturityLabels[d.summary.modelMaturity]}`;
  }

  // Small delay to let container dimensions settle
  setTimeout(() => renderAllCharts(d), 100);

  // Load ML evaluation metrics from AI backend
  loadMLMetrics();
}

function renderKPIs(summary) {
  const grid = document.getElementById('dash-kpi-grid');
  if (!grid) return;

  const kpis = [
    { icon: '💓', label: 'Interactions', value: summary.totalInteractions, color: ChartColors.purple },
    { icon: '📊', label: 'Q-Table Entries', value: summary.totalQEntries, color: ChartColors.pink },
    { icon: '🌐', label: 'States Learned', value: summary.uniqueStates, color: ChartColors.cyan },
    { icon: '⭐', label: 'Ratings Given', value: summary.totalRatings, color: ChartColors.amber },
    { icon: '📈', label: 'Avg Q-Value', value: summary.avgQValue, color: ChartColors.emerald },
    { icon: '🚀', label: 'Max Q-Value', value: summary.maxQValue, color: ChartColors.indigo }
  ];

  grid.innerHTML = kpis.map(k => `
    <div class="dash-kpi-card">
      <div class="dash-kpi-icon" style="background:${k.color}22;color:${k.color};">${k.icon}</div>
      <div class="dash-kpi-info">
        <div class="dash-kpi-value" style="color:${k.color};">${k.value}</div>
        <div class="dash-kpi-label">${k.label}</div>
      </div>
    </div>
  `).join('');
}

function renderAllCharts(d) {
  // 1. Interaction Timeline
  // Datasets arrives as [{label, data}] array — convert to {label: data} object for drawAreaChart
  const timelineDatasets = {};
  if (d.timeline && d.timeline.datasets) {
    d.timeline.datasets.forEach(ds => { timelineDatasets[ds.label] = ds.data; });
  }
  const hasTimeline = d.timeline && d.timeline.labels && d.timeline.labels.length > 0;
  if (hasTimeline) {
    drawAreaChart('chart-timeline', d.timeline.labels, timelineDatasets, {
      title: '', height: 280
    });
  } else {
    document.getElementById('chart-timeline').innerHTML = emptyChartMsg('No timeline data yet — start browsing movies!');
  }

  // 2. Activity Breakdown (Doughnut) — use activityBreakdown directly
  const act = d.activityBreakdown || {};
  const actTypes = ['view', 'click', 'rating', 'recommend_click', 'watchlist'];
  const actTotals = actTypes.map(t => act[t] || 0);
  const actLabelsFinal = ['Views', 'Clicks', 'Ratings', 'Rec. Clicks', 'Watchlist'];
  const hasActivity = actTotals.some(v => v > 0);

  if (hasActivity) {
    drawDoughnutChart('chart-activity-doughnut', actLabelsFinal, actTotals, {
      colors: [ChartColors.purple, ChartColors.pink, ChartColors.amber, ChartColors.emerald, ChartColors.cyan]
    });
  } else {
    document.getElementById('chart-activity-doughnut').innerHTML = emptyChartMsg('No interactions recorded yet');
  }

  // 3. Q-Value Distribution
  if (d.qDistribution && d.qDistribution.counts && d.qDistribution.counts.length > 0) {
    drawBarChart('chart-q-distribution', d.qDistribution.labels.map(l => l.toString()), d.qDistribution.counts, {
      barColors: ChartColors.palette,
      yLabel: 'Frequency',
      height: 260
    });
  } else {
    document.getElementById('chart-q-distribution').innerHTML = emptyChartMsg('No Q-values learned yet — interact with movies!');
  }

  // 4. Explore vs Exploit (Doughnut)
  const src = d.sourceBreakdown || {};
  const srcLabels = Object.keys(src).filter(k => src[k] > 0);
  const srcValues = srcLabels.map(k => src[k]);
  const srcColors = { rl: ChartColors.purple, explore: ChartColors.amber, hybrid: ChartColors.emerald, content: ChartColors.cyan, popular: ChartColors.pink };
  if (srcLabels.length > 0) {
    drawDoughnutChart('chart-source-doughnut', srcLabels, srcValues, {
      colors: srcLabels.map((l, i) => srcColors[l] || ChartColors.palette[i % ChartColors.palette.length])
    });
  } else {
    document.getElementById('chart-source-doughnut').innerHTML = emptyChartMsg('No recommendation sources yet');
  }

  // 5. Top Movie Q-Values
  if (d.topMovieQ && d.topMovieQ.length > 0) {
    drawHorizontalBarChart('chart-movie-q-bars',
      d.topMovieQ.map(m => m.title),
      d.topMovieQ.map(m => parseFloat(m.maxQ) || 0),
      { height: 380 }
    );
  } else {
    document.getElementById('chart-movie-q-bars').innerHTML = emptyChartMsg('No Q-values for movies yet');
  }

  // 6. Genre Heatmap
  drawHeatmap('chart-genre-heatmap', d.genreBreakdown || {}, { height: 280 });

  // 7. Rating Distribution
  const ratingLabels = ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'];
  const ratingDist = d.ratingDistribution || [0, 0, 0, 0, 0];
  const hasRatings = ratingDist.some(v => v > 0);
  if (hasRatings) {
    drawBarChart('chart-rating-dist', ratingLabels, ratingDist, {
      barColors: ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#7c3aed'],
      height: 260
    });
  } else {
    document.getElementById('chart-rating-dist').innerHTML = emptyChartMsg('No ratings yet — rate movies on their detail pages!');
  }

  // 8. State-Space Radar
  const states = d.stateDetails || [];
  if (states.length >= 3) {
    drawRadarChart('chart-state-radar',
      states.slice(0, 8).map(s => s.state.replace(/\|/g, ' • ')),
      states.slice(0, 8).map(s => s.movieCount),
      { title: '', height: 550 }
    );
  } else {
    document.getElementById('chart-state-radar').innerHTML = emptyChartMsg('Need 3+ context states for radar — keep interacting!');
  }

  // 9. RL Configuration Panel
  if (d.config) renderConfigPanel(d.config);

  // 10. State Details Table
  renderStateTable(d.stateDetails || []);
}

function renderConfigPanel(config) {
  const container = document.getElementById('dash-config-body');
  if (!container) return;

  container.innerHTML = `
    <div class="config-grid">
      <div class="config-item">
        <div class="config-icon">🎲</div>
        <div class="config-info">
          <div class="config-label">Epsilon (ε)</div>
          <div class="config-value">${config.epsilon}</div>
          <div class="config-desc">Exploration probability — ${Math.round(config.epsilon * 100)}% random picks</div>
        </div>
      </div>
      <div class="config-item">
        <div class="config-icon">🎯</div>
        <div class="config-info">
          <div class="config-label">Min Epsilon</div>
          <div class="config-value">${config.epsilonMin}</div>
          <div class="config-desc">Exploration floor — never below ${Math.round(config.epsilonMin * 100)}%</div>
        </div>
      </div>
      <div class="config-item">
        <div class="config-icon">📖</div>
        <div class="config-info">
          <div class="config-label">Learning Rate (α)</div>
          <div class="config-value">${config.learningRate}</div>
          <div class="config-desc">How much each interaction shifts Q-values</div>
        </div>
      </div>
      <div class="config-item">
        <div class="config-icon">⏳</div>
        <div class="config-info">
          <div class="config-label">Discount Factor (γ)</div>
          <div class="config-value">${config.discountFactor}</div>
          <div class="config-desc">Weight of future rewards vs immediate</div>
        </div>
      </div>
      ${Object.entries(config.rewardWeights).map(([key, val]) => `
        <div class="config-item config-reward">
          <div class="config-icon">${rewardIcon(key)}</div>
          <div class="config-info">
            <div class="config-label">Reward: ${key}</div>
            <div class="config-value ${val < 0 ? 'config-negative' : ''}">${val > 0 ? '+' : ''}${val}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function rewardIcon(key) {
  const icons = { click: '🖱️', view: '👁️', rating_5: '🌟', rating_4: '👍', rating_3: '😐', rating_2: '👎', rating_1: '😡', recommend_click: '🤖', dwell_long: '⏳', dwell_short: '⚡', search_select: '🔍' };
  return icons[key] || '📊';
}

function renderStateTable(stateDetails) {
  const container = document.getElementById('dash-state-table');
  if (!container) return;

  if (stateDetails.length === 0) {
    container.innerHTML = '<p class="dash-empty-text">No states learned yet. Browse movies to train your model!</p>';
    return;
  }

  container.innerHTML = `
    <div class="state-table-wrap">
      <table class="state-table">
        <thead>
          <tr>
            <th>State Key</th>
            <th>Movies</th>
            <th>Avg Q</th>
            <th>Max Q</th>
            <th>Visits</th>
            <th>Coverage</th>
          </tr>
        </thead>
        <tbody>
          ${stateDetails.map(s => {
    const parts = s.state.split('|');
    const coverage = Math.min(100, Math.round((s.movieCount / MOVIES.length) * 100));
    return `
              <tr>
                <td>
                  <div class="state-key-cell">
                    <span class="state-genre-tag">${parts[0] || '—'}</span>
                    <span class="state-vibe-tag">${parts[1] || '—'}</span>
                    <span class="state-time-tag">${parts[2] || '—'}</span>
                  </div>
                </td>
                <td><span class="state-number">${s.movieCount}</span></td>
                <td><span class="state-number">${s.avgQ}</span></td>
                <td><span class="state-number state-highlight">${s.maxQ}</span></td>
                <td><span class="state-number">${s.totalVisits}</span></td>
                <td>
                  <div class="state-coverage-bar">
                    <div class="state-coverage-fill" style="width:${coverage}%"></div>
                    <span class="state-coverage-label">${coverage}%</span>
                  </div>
                </td>
              </tr>
            `;
  }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function emptyChartMsg(text) {
  return `<div class="dash-chart-empty"><i class="fa-solid fa-circle-info" style="font-size:32px;"></i><p>${text}</p></div>`;
}

// ──────────────────────────────────
// ML EVALUATION METRICS PANEL
// ──────────────────────────────────

async function loadMLMetrics() {
  // Fetch ML evaluation metrics
  const metricsRes = await API.getMLMetrics();
  if (metricsRes.ok && metricsRes.data) {
    renderMLMetricsPanel(metricsRes.data);
  } else {
    const container = document.getElementById('dash-ml-metrics');
    if (container) container.innerHTML = '<p class="dash-empty-text">ML metrics not available — ensure the AI backend is running and model_evaluator has been executed.</p>';
  }

  // Fetch model info
  const infoRes = await API.getModelInfo();
  if (infoRes.ok && infoRes.data) {
    renderModelInfoPanel(infoRes.data);
  } else {
    const container = document.getElementById('dash-model-info');
    if (container) container.innerHTML = '<p class="dash-empty-text">Model info not available — ensure the AI backend is running.</p>';
  }
}

function renderMLMetricsPanel(metrics) {
  const container = document.getElementById('dash-ml-metrics');
  if (!container) return;

  const metricItems = [
    { icon: '<i class="fa-solid fa-bullseye"></i>', label: `Precision@${metrics.k || 5}`, value: metrics.precision_k, desc: 'Fraction of top-K recommendations that are relevant', color: ChartColors.purple },
    { icon: '<i class="fa-solid fa-tower-broadcast"></i>', label: `Recall@${metrics.k || 5}`, value: metrics.recall_k, desc: 'Fraction of relevant items captured in top-K', color: ChartColors.pink },
    { icon: '<i class="fa-solid fa-circle-check"></i>', label: `Hit Rate@${metrics.k || 5}`, value: metrics.hit_rate_k, desc: 'Fraction of queries with at least 1 relevant hit', color: ChartColors.emerald },
    { icon: '<i class="fa-solid fa-medal"></i>', label: 'MRR', value: metrics.mrr, desc: 'Highest ranked recommendation position average', color: ChartColors.amber },
    { icon: '<i class="fa-solid fa-chart-line"></i>', label: `NDCG@${metrics.k || 5}`, value: metrics.ndcg_k, desc: 'Normalized Discounted Cumulative Gain — rank quality', color: ChartColors.cyan },
    { icon: '<i class="fa-solid fa-earth-americas"></i>', label: 'Coverage', value: metrics.coverage, desc: 'Fraction of catalog items recommended across users', color: ChartColors.indigo },
    { icon: '<i class="fa-solid fa-link"></i>', label: 'Avg Similarity', value: metrics.avg_similarity, desc: 'Mean cosine similarity score of top recommendations', color: ChartColors.teal },
  ];

  container.innerHTML = `
    <div class="ml-metrics-grid">
      ${metricItems.map(m => {
        const pct = typeof m.value === 'number' ? (m.value * 100).toFixed(1) : '—';
        const raw = typeof m.value === 'number' ? m.value.toFixed(4) : '—';
        return `
          <div class="ml-metric-card">
            <div class="ml-metric-icon" style="background:${m.color}22;color:${m.color};">${m.icon}</div>
            <div class="ml-metric-info">
              <div class="ml-metric-label">${m.label}</div>
              <div class="ml-metric-value" style="color:${m.color};">${raw}</div>
              <div class="ml-metric-bar">
                <div class="ml-metric-bar-fill" style="width:${Math.min(100, parseFloat(pct))}%;background:${m.color};"></div>
              </div>
              <div class="ml-metric-desc">${m.desc}</div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
    <div class="ml-metrics-footer">
      <span>List Evaluated on <strong>${metrics.num_movies || '—'}</strong> movies</span>
      <span>Time: ${metrics.evaluated_at ? new Date(metrics.evaluated_at).toLocaleString() : '—'}</span>
    </div>
  `;
}

function renderModelInfoPanel(info) {
  const container = document.getElementById('dash-model-info');
  if (!container) return;

  const training = info.training || {};
  const coldStart = info.cold_start_weights || {};
  const evaluation = info.evaluation || {};

  const warmUser = info.warm_user_weights || {};

  container.innerHTML = `
    <div class="model-info-grid">
      <div class="model-info-section">
        <h4>Architecture</h4>
        <div class="model-info-items">
          <div class="model-info-row"><span>Status</span><span class="model-info-val">${info.status === 'loaded' ? 'Loaded' : 'Not Loaded'}</span></div>
          <div class="model-info-row"><span>Catalog Size</span><span class="model-info-val">${info.catalog_size || '—'} movies</span></div>
          <div class="model-info-row"><span>Matrix Shape</span><span class="model-info-val">${info.matrix_shape ? info.matrix_shape.join(' × ') : '—'}</span></div>
          <div class="model-info-row"><span>Has Metadata</span><span class="model-info-val">${info.has_metadata ? 'Yes (XAI ready)' : 'No'}</span></div>
        </div>
      </div>

      <div class="model-info-section">
        <h4>Training Details</h4>
        <div class="model-info-items">
          <div class="model-info-row"><span>TF-IDF Dimensions</span><span class="model-info-val">${training.tfidf_dimensions || '—'}</span></div>
          <div class="model-info-row"><span>Vocabulary Size</span><span class="model-info-val">${training.vocabulary_size || '—'}</span></div>
          <div class="model-info-row"><span>N-gram Range</span><span class="model-info-val">${training.ngram_range || '—'}</span></div>
          <div class="model-info-row"><span>Trained At</span><span class="model-info-val">${training.trained_at ? new Date(training.trained_at).toLocaleString() : '—'}</span></div>
        </div>
      </div>

      <div class="model-info-section">
        <h4>Cold-Start Weights</h4>
        <div class="model-info-items">
          <div class="model-info-row">
            <span>Similarity</span>
            <span class="model-info-val">
              <span class="weight-bar" style="width:${(coldStart.similarity || 0.5) * 100}%;background:${ChartColors.purple}"></span>
              ${coldStart.similarity || 0.5}
            </span>
          </div>
          <div class="model-info-row">
            <span>Popularity</span>
            <span class="model-info-val">
              <span class="weight-bar" style="width:${(coldStart.popularity || 0.3) * 100}%;background:${ChartColors.pink}"></span>
              ${coldStart.popularity || 0.3}
            </span>
          </div>
          <div class="model-info-row">
            <span>Rating</span>
            <span class="model-info-val">
              <span class="weight-bar" style="width:${(coldStart.rating || 0.2) * 100}%;background:${ChartColors.emerald}"></span>
              ${coldStart.rating || 0.2}
            </span>
          </div>
        </div>
        <p class="model-info-formula">Score = 0.5×similarity + 0.3×popularity + 0.2×rating</p>
      </div>

      <div class="model-info-section">
        <h4>Warm User Weights (with Genre Boost)</h4>
        <div class="model-info-items">
          <div class="model-info-row">
            <span>Similarity</span>
            <span class="model-info-val">
              <span class="weight-bar" style="width:${(warmUser.similarity || 0.45) * 100}%;background:${ChartColors.purple}"></span>
              ${warmUser.similarity || 0.45}
            </span>
          </div>
          <div class="model-info-row">
            <span>Popularity</span>
            <span class="model-info-val">
              <span class="weight-bar" style="width:${(warmUser.popularity || 0.25) * 100}%;background:${ChartColors.pink}"></span>
              ${warmUser.popularity || 0.25}
            </span>
          </div>
          <div class="model-info-row">
            <span>Rating</span>
            <span class="model-info-val">
              <span class="weight-bar" style="width:${(warmUser.rating || 0.15) * 100}%;background:${ChartColors.emerald}"></span>
              ${warmUser.rating || 0.15}
            </span>
          </div>
          <div class="model-info-row">
            <span>Genre Preference</span>
            <span class="model-info-val">
              <span class="weight-bar" style="width:${(warmUser.genre_preference || 0.15) * 100}%;background:${ChartColors.amber}"></span>
              ${warmUser.genre_preference || 0.15}
            </span>
          </div>
        </div>
        <p class="model-info-formula">Score = 0.45×sim + 0.25×pop + 0.15×rating + 0.15×genre_pref</p>
      </div>
    </div>
  `;
}


/**
 * Global sync function to refresh all dashboard data.
 */
async function syncDashboard(btn) {
  if (btn) {
    const icon = btn.querySelector('i');
    if (icon) icon.classList.add('fa-spin');
    btn.disabled = true;
    btn.style.opacity = '0.7';
  }

  // Reload all dashboard component data
  await loadDashboardData();
  
  // Visual success feedback
  if (btn) {
    const icon = btn.querySelector('i');
    if (icon) icon.classList.remove('fa-spin');
    btn.disabled = false;
    btn.style.opacity = '1';
    
    // Quick indicator success
    const originalContent = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> <span>Synced</span>';
    setTimeout(() => {
        btn.innerHTML = originalContent;
    }, 2000);
  }
}

// Expose to global scope
window.syncDashboard = syncDashboard;
window.renderDashboard = renderDashboard;
window.loadDashboardData = loadDashboardData;
