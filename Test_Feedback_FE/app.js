/* ============================================================
   FEEDBACK FORM TESTER — APP.JS
   Full backend testing UI for /api/v1/forms endpoints
   ============================================================ */

// ─── STATE ────────────────────────────────────────────────
const state = {
  activeSectionId: null,
  builderFormId: null,
  sections: [],          // full schema sections
  pollingInterval: null,
  isBuilderActive: false, // track if current form in builder is active
  editingFormId: null,
  editingSectionId: null,
  editingQuestionId: null,
};

// ─── DOM HELPERS ──────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const $$ = (sel, ctx = document) => ctx.querySelectorAll(sel);

// ─── CONFIG ───────────────────────────────────────────────
const getBaseUrl = () => $('base-url').value.replace(/\/$/, '');
const getToken = () => $('jwt-token').value.trim();

// ─── TOAST ────────────────────────────────────────────────
function toast(msg, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  $('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

// ─── API LOG ──────────────────────────────────────────────
function logApi(method, url, status, reqBody, resBody) {
  const body = $('api-log-body');
  const entry = document.createElement('div');
  entry.className = 'log-entry';

  const timeStr = new Date().toLocaleTimeString('vi-VN');
  const statusClass = status >= 200 && status < 300 ? 'log-status-ok' : 'log-status-err';

  let reqStr = '';
  if (reqBody) {
    try { reqStr = JSON.stringify(reqBody, null, 2); } catch { reqStr = String(reqBody); }
  }
  let resStr = '';
  if (resBody) {
    try { resStr = typeof resBody === 'string' ? resBody : JSON.stringify(resBody, null, 2); } catch { resStr = String(resBody); }
  }

  entry.innerHTML = `
    <div>
      <span class="log-method log-method-${method}">${method}</span>
      <span class="log-url">${url}</span>
      <span class="${statusClass}"> ${status}</span>
      <span class="log-time"> • ${timeStr}</span>
    </div>
    ${reqStr ? `<div class="log-body">REQ: ${escapeHtml(reqStr)}</div>` : ''}
    ${resStr ? `<div class="log-body">RES: ${escapeHtml(resStr.slice(0, 500))}${resStr.length > 500 ? '...' : ''}</div>` : ''}
  `;
  body.prepend(entry);
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ─── FETCH WRAPPER ────────────────────────────────────────
async function apiFetch(method, path, body = null) {
  const url = `${getBaseUrl()}${path}`;
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

  let status = 0;
  let resData = null;
  try {
    const opts = { method, headers };
    if (body !== null) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    status = res.status;
    const text = await res.text();
    try { resData = JSON.parse(text); } catch { resData = text; }
    logApi(method, url, status, body, resData);
    if (!res.ok) {
      const errMsg = resData?.message || resData?.error || text || `HTTP ${status}`;
      throw new Error(errMsg);
    }
    return resData;
  } catch (err) {
    if (!status) logApi(method, url, 0, body, err.message);
    throw err;
  }
}

// ─── NAV / TAB SWITCHING ─────────────────────────────────
function switchTab(tabId) {
  $$('.tab-panel').forEach(p => p.classList.remove('active'));
  $$('.nav-item').forEach(n => n.classList.remove('active'));
  $(`tab-${tabId}`).classList.add('active');
  $(`nav-${tabId}`).classList.add('active');
}

$$('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab(item.dataset.tab);
  });
});

// ─── MODAL HELPERS ────────────────────────────────────────
function openModal(id) {
  const el = $(id);
  el.classList.add('open');
  el.addEventListener('click', outsideClose);
}
function closeModal(id) {
  const el = $(id);
  el.classList.remove('open');
  el.removeEventListener('click', outsideClose);
}
function outsideClose(e) { if (e.target === e.currentTarget) closeModal(e.currentTarget.id); }

$$('[data-close]').forEach(btn => {
  btn.addEventListener('click', () => closeModal(btn.dataset.close));
});

// ─── API LOG PANEL ────────────────────────────────────────
$('btn-clear-log').addEventListener('click', () => { $('api-log-body').innerHTML = ''; });
$('btn-toggle-log').addEventListener('click', () => {
  const panel = $('api-log-panel');
  panel.classList.toggle('collapsed');
  $('btn-toggle-log').textContent = panel.classList.contains('collapsed') ? '▲' : '▼';
});

// ─── SIDEBAR TOGGLE ───────────────────────────────────────
$('sidebar-toggle-btn').addEventListener('click', () => {
  document.querySelector('.sidebar').style.width =
    document.querySelector('.sidebar').style.width === '60px' ? '' : '60px';
});

// ─── HELPER: LOCK UI IF ACTIVE ───────────────────────────
function setLockState(isActive) {
  state.isBuilderActive = isActive;
  const lockEl = $('lock-status');
  if (isActive) {
    lockEl.style.display = 'flex';
    $('btn-add-section').disabled = true;
    $('btn-add-question').disabled = true;
    $('btn-trigger-build').disabled = true;
  } else {
    lockEl.style.display = 'none';
    $('btn-add-section').disabled = false;
    // btn-add-question depends on activeSectionId, handled in selectSection
    if (state.activeSectionId) $('btn-add-question').disabled = false;
    $('btn-trigger-build').disabled = false;
  }
}

// ════════════════════════════════════════════════════════════
//  TAB 1: FORM LIST
// ════════════════════════════════════════════════════════════

$('btn-open-create-modal').addEventListener('click', () => openModal('modal-create-form'));

// Form type select — show custom input
$('new-form-type').addEventListener('change', function() {
  $('custom-form-type-group').style.display = this.value === 'custom' ? 'block' : 'none';
});

// Load Forms
$('btn-load-forms').addEventListener('click', async () => {
  const curriculumId = $('curriculum-id-filter').value.trim();
  if (!curriculumId) { toast('Vui lòng nhập Curriculum ID', 'warning'); return; }

  $('btn-load-forms').disabled = true;
  $('btn-load-forms').textContent = 'Đang tải...';

  try {
    const forms = await apiFetch('GET', `/api/v1/forms?curriculumId=${encodeURIComponent(curriculumId)}`);
    renderFormCards(Array.isArray(forms) ? forms : []);
    toast(`Đã tải ${Array.isArray(forms) ? forms.length : 0} form`, 'success');
  } catch (err) {
    toast(`Lỗi: ${err.message}`, 'error');
    renderFormCards([]);
  } finally {
    $('btn-load-forms').disabled = false;
    $('btn-load-forms').innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg> Tải Forms`;
  }
});

function renderFormCards(forms) {
  const grid = $('forms-grid');
  grid.innerHTML = '';

  if (!forms.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>Không tìm thấy form nào</h3>
        <p>Curriculum này chưa có form. Hãy tạo mới!</p>
      </div>`;
    return;
  }

  forms.forEach(form => {
    const card = document.createElement('div');
    card.className = 'form-card';
    card.innerHTML = `
      <div class="form-card-stripe"></div>
      <div class="form-card-body">
        <div class="form-card-type">${form.formType || '—'}</div>
        <div style="font-size:14px;font-weight:600;color:var(--text-primary);margin:4px 0">Form ID:</div>
        <div class="form-card-id">${form.id}</div>
        <div class="form-card-id" style="color:var(--text-muted);font-size:11px;margin-top:2px">
          ${form.createdAt ? new Date(form.createdAt).toLocaleString('vi-VN') : ''}
        </div>
      </div>
      <div class="form-card-footer">
        <span class="badge ${form.isActive ? 'badge-active' : 'badge-draft'}">
          <span class="badge-dot"></span>
          ${form.isActive ? 'Active' : 'Draft'}
        </span>
        <div style="display:flex;gap:6px">
          ${form.formUrl ? `<a href="${form.formUrl}" target="_blank" class="btn btn-sm btn-primary">🔗 Xem Form</a>` : ''}
          <button class="btn btn-sm btn-outline" onclick="openInBuilder('${form.id}')">✏️ Builder</button>
          <div class="card-actions-dropdown">
            <button class="action-btn" onclick="openEditFormModal('${form.id}', '${form.formType}')" title="Sửa tên/loại">✎</button>
            <button class="action-btn delete" onclick="deleteForm('${form.id}')" title="Xóa Form">🗑</button>
          </div>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// ─── FORM CRUD ACTIONS ──────────────────────────────────
window.openEditFormModal = function(id, type) {
  state.editingFormId = id;
  $('edit-form-id').value = id;
  $('edit-form-type').value = type;
  openModal('modal-edit-form');
};

$('btn-update-form').addEventListener('click', async () => {
  const formType = $('edit-form-type').value.trim();
  if (!formType) { toast('Vui lòng nhập Form Type', 'warning'); return; }

  $('btn-update-form').disabled = true;
  try {
    await apiFetch('PUT', `/api/v1/forms/${state.editingFormId}`, { formType });
    toast('✅ Cập nhật form thành công', 'success');
    closeModal('modal-edit-form');
    $('btn-load-forms').click(); // reload
  } catch (err) {
    toast(`Lỗi: ${err.message}`, 'error');
  } finally {
    $('btn-update-form').disabled = false;
  }
});

window.deleteForm = async function(id) {
  if (!confirm(`Bạn có chắc muốn XÓA form ${id}?\nHành động này không thể hoàn tác.`)) return;
  try {
    await apiFetch('DELETE', `/api/v1/forms/${id}`);
    toast('🗑 Đã xóa form', 'success');
    $('btn-load-forms').click();
  } catch (err) {
    toast(`Lỗi: ${err.message}`, 'error');
  }
};

// Open form in builder tab
window.openInBuilder = function(formId) {
  $('builder-form-id').value = formId;
  switchTab('builder');
  loadFullSchema(formId);
};

// Create Form
$('btn-create-form').addEventListener('click', async () => {
  const curriculumId = $('new-curriculum-id').value.trim();
  const typeValue = $('new-form-type').value;
  const customType = $('custom-form-type').value.trim();
  const formType = typeValue === 'custom' ? customType : typeValue;

  if (!curriculumId) { toast('Vui lòng nhập Curriculum ID', 'warning'); return; }
  if (!formType) { toast('Vui lòng nhập Form Type', 'warning'); return; }

  $('btn-create-form').disabled = true;
  $('btn-create-form').textContent = 'Đang tạo...';

  try {
    const result = await apiFetch('POST', '/api/v1/forms', { curriculumId, formType });
    toast(`✅ Đã tạo form: ${result.id}`, 'success');
    closeModal('modal-create-form');
    // auto-fill builder
    $('builder-form-id').value = result.id;
    // reset fields
    $('new-curriculum-id').value = '';
    $('new-form-type').value = 'MIDTERM';
    $('custom-form-type-group').style.display = 'none';
  } catch (err) {
    toast(`Lỗi: ${err.message}`, 'error');
  } finally {
    $('btn-create-form').disabled = false;
    $('btn-create-form').textContent = 'Tạo Form';
  }
});


// ════════════════════════════════════════════════════════════
//  TAB 2: FORM BUILDER
// ════════════════════════════════════════════════════════════

// Load full schema
$('btn-load-full-schema').addEventListener('click', () => {
  const formId = $('builder-form-id').value.trim();
  if (!formId) { toast('Vui lòng nhập Form ID', 'warning'); return; }
  loadFullSchema(formId);
});

async function loadFullSchema(formId) {
  state.builderFormId = formId;

  try {
    const data = await apiFetch('GET', `/api/v1/forms/${formId}/full`);
    // Check if published
    const formMeta = await apiFetch('GET', `/api/v1/forms/${formId}`);
    setLockState(formMeta.isActive);

    state.sections = data.sections || [];
    renderSections(state.sections);
    toast(`Đã tải schema: ${state.sections.length} section(s)`, 'success');
  } catch (err) {
    toast(`Lỗi tải schema: ${err.message}`, 'error');
  }
}

function renderSections(sections) {
  const list = $('sections-list');
  list.innerHTML = '';

  if (!sections.length) {
    list.innerHTML = `<div class="empty-state-sm">Chưa có section. Nhấn "+ Section" để thêm.</div>`;
    return;
  }

  sections.forEach((sec, idx) => {
    const item = document.createElement('div');
    item.className = `section-item ${state.activeSectionId === sec.sectionId ? 'active' : ''}`;
    item.dataset.sectionId = sec.sectionId;
    item.innerHTML = `
      <div class="section-index">${idx + 1}</div>
      <div class="section-info">
        <div class="section-name">${escapeHtml(sec.title || '(Không có tiêu đề)')}</div>
        <div class="section-action-badge">${sec.actionAfter || sec.afterSectionAction || 'NEXT'}</div>
      </div>
      <div class="section-actions">
        ${!state.isBuilderActive ? `
          <button class="action-btn edit" onclick="openEditSectionModal(event, '${sec.sectionId}')" title="Sửa Section">✎</button>
          <button class="action-btn delete" onclick="deleteSection(event, '${sec.sectionId}')" title="Xóa Section">🗑</button>
        ` : ''}
      </div>
    `;
    item.addEventListener('click', () => selectSection(sec));
    list.appendChild(item);
  });
}

// ─── SECTION CRUD ACTIONS ──────────────────────────────
window.openEditSectionModal = function(e, id) {
  e.stopPropagation();
  const sec = state.sections.find(s => s.sectionId === id);
  if (!sec) return;

  state.editingSectionId = id;
  $('edit-section-title').value = sec.title || '';
  $('edit-section-action').value = sec.actionAfter || sec.afterSectionAction || 'NEXT';
  $('edit-target-section-id').value = sec.targetSectionId || '';
  $('edit-target-section-group').style.display = $('edit-section-action').value === 'GO_TO_SECTION' ? 'block' : 'none';

  openModal('modal-edit-section');
};

$('edit-section-action').addEventListener('change', function() {
  $('edit-target-section-group').style.display = this.value === 'GO_TO_SECTION' ? 'block' : 'none';
});

$('btn-update-section').addEventListener('click', async () => {
  const title = $('edit-section-title').value.trim();
  const action = $('edit-section-action').value;
  const targetId = $('edit-target-section-id').value.trim() || null;

  try {
    const body = { title, afterSectionAction: action, targetSectionId: targetId };
    await apiFetch('PUT', `/api/v1/forms/sections/${state.editingSectionId}`, body);
    toast('✅ Cập nhật section thành công', 'success');
    closeModal('modal-edit-section');
    await loadFullSchema(state.builderFormId);
  } catch (err) {
    toast(`Lỗi: ${err.message}`, 'error');
  }
});

window.deleteSection = async function(e, id) {
  e.stopPropagation();
  if (!confirm('Xóa section này sẽ xóa toàn bộ câu hỏi bên trong. Tiếp tục?')) return;
  try {
    await apiFetch('DELETE', `/api/v1/forms/sections/${id}`);
    toast('🗑 Đã xóa section', 'success');
    await loadFullSchema(state.builderFormId);
  } catch (err) {
    toast(`Lỗi: ${err.message}`, 'error');
  }
};

function selectSection(sec) {
  state.activeSectionId = sec.sectionId;
  $$('.section-item').forEach(i => i.classList.remove('active'));
  $$('.section-item').forEach(i => {
    if (i.dataset.sectionId === sec.sectionId) i.classList.add('active');
  });
  $('active-section-title').textContent = sec.title || '(Không có tiêu đề)';
  $('btn-add-question').disabled = state.isBuilderActive;
  renderQuestions(sec.questions || []);
}

function renderQuestions(questions) {
  const list = $('questions-list');
  list.innerHTML = '';

  if (!questions.length) {
    list.innerHTML = `<div class="empty-state-sm">Chưa có câu hỏi nào trong section này.</div>`;
    return;
  }

  questions.forEach(q => {
    const item = document.createElement('div');
    item.className = 'question-item';
    const optionsHtml = (q.options || []).slice(0, 4).map(o =>
      `<div class="option-preview-item">${escapeHtml(o.text || o.optionText || '')}</div>`
    ).join('');
    const moreOpts = q.options && q.options.length > 4
      ? `<div class="option-preview-item" style="color:var(--text-muted)">+${q.options.length - 4} lựa chọn khác...</div>` : '';

    item.innerHTML = `
      <div class="question-item-header">
        <span class="question-type-badge type-${q.type}">${q.type}</span>
        <span class="question-content">
          ${escapeHtml(q.content || q.questionText || '')}
          ${q.isRequired ? '<span class="question-required-star">*</span>' : ''}
        </span>
        <div class="question-actions">
           ${!state.isBuilderActive ? `
            <button class="action-btn edit" onclick="openEditQuestionModal('${q.questionId}')" title="Sửa Câu hỏi">✎</button>
            <button class="action-btn delete" onclick="deleteQuestion('${q.questionId}')" title="Xóa Câu hỏi">🗑</button>
          ` : ''}
        </div>
      </div>
      ${optionsHtml || moreOpts ? `<div class="question-options-preview">${optionsHtml}${moreOpts}</div>` : ''}
    `;
    list.appendChild(item);
  });
}

// ─── QUESTION CRUD ACTIONS ─────────────────────────────
window.openEditQuestionModal = function(id) {
  const sec = state.sections.find(s => s.sectionId === state.activeSectionId);
  const q = sec.questions.find(q => q.questionId === id);
  if (!q) return;

  state.editingQuestionId = id;
  $('edit-question-content').value = q.content || q.questionText || '';
  $('edit-question-type').value = q.type;
  $('edit-question-required').checked = q.isRequired;

  const needsOpts = ['RADIO', 'CHECKBOX', 'DROPDOWN'].includes(q.type);
  $('edit-options-section').style.display = needsOpts ? 'block' : 'none';
  $('edit-options-list').innerHTML = '';

  if (needsOpts && q.options) {
    q.options.forEach(o => addOptionRow(o.text || o.optionText || '', o.nextSectionId || '', 'edit-options-list'));
  }

  openModal('modal-edit-question');
};

$('edit-question-type').addEventListener('change', function() {
  $('edit-options-section').style.display = ['RADIO', 'CHECKBOX', 'DROPDOWN'].includes(this.value) ? 'block' : 'none';
});

$('btn-edit-add-option').addEventListener('click', () => addOptionRow('', '', 'edit-options-list'));

// Refactor addOptionRow to be reusable
// (Already moved below as addOptionRow)

$('btn-update-question').addEventListener('click', async () => {
  const content = $('edit-question-content').value.trim();
  const type = $('edit-question-type').value;
  const isRequired = $('edit-question-required').checked;

  let options = [];
  if (['RADIO', 'CHECKBOX', 'DROPDOWN'].includes(type)) {
    $$('.option-row', $('edit-options-list')).forEach(row => {
      const text = row.querySelector('.option-text-input').value.trim();
      const nextId = row.querySelector('.next-section-input').value.trim() || null;
      if (text) options.push({ optionText: text, nextSectionId: nextId });
    });
  }

  try {
    const body = { content, type, isRequired, options };
    await apiFetch('PUT', `/api/v1/forms/questions/${state.editingQuestionId}`, body);
    toast('✅ Cập nhật câu hỏi thành công', 'success');
    closeModal('modal-edit-question');
    await loadFullSchema(state.builderFormId);
    // re-select
    const updatedSec = state.sections.find(s => s.sectionId === state.activeSectionId);
    if (updatedSec) selectSection(updatedSec);
  } catch (err) {
    toast(`Lỗi: ${err.message}`, 'error');
  }
});

window.deleteQuestion = async function(id) {
  if (!confirm('Xóa câu hỏi này?')) return;
  try {
    await apiFetch('DELETE', `/api/v1/forms/questions/${id}`);
    toast('🗑 Đã xóa câu hỏi', 'success');
    await loadFullSchema(state.builderFormId);
    const updatedSec = state.sections.find(s => s.sectionId === state.activeSectionId);
    if (updatedSec) selectSection(updatedSec);
  } catch (err) {
    toast(`Lỗi: ${err.message}`, 'error');
  }
};

// Add Section Modal
$('section-action').addEventListener('change', function() {
  $('target-section-group').style.display = this.value === 'GO_TO_SECTION' ? 'block' : 'none';
});

$('btn-add-section').addEventListener('click', () => {
  if (!state.builderFormId) { toast('Tải schema trước', 'warning'); return; }
  $('section-title').value = '';
  $('section-action').value = 'NEXT';
  $('target-section-group').style.display = 'none';
  $('target-section-id').value = '';
  openModal('modal-add-section');
});

$('btn-save-section').addEventListener('click', async () => {
  const title = $('section-title').value.trim();
  const afterSectionAction = $('section-action').value;
  const targetSectionId = $('target-section-id').value.trim() || null;

  if (afterSectionAction === 'GO_TO_SECTION' && !targetSectionId) {
    toast('Vui lòng nhập Target Section ID', 'warning');
    return;
  }

  $('btn-save-section').disabled = true;
  try {
    const body = { title, afterSectionAction };
    if (targetSectionId) body.targetSectionId = targetSectionId;
    const result = await apiFetch('POST', `/api/v1/forms/${state.builderFormId}/sections`, body);
    toast(`✅ Đã thêm section: ${result.sectionId}`, 'success');
    closeModal('modal-add-section');
    await loadFullSchema(state.builderFormId);
  } catch (err) {
    toast(`Lỗi: ${err.message}`, 'error');
  } finally {
    $('btn-save-section').disabled = false;
  }
});

// Add Question Modal
$('question-type').addEventListener('change', function() {
  const needsOptions = ['RADIO', 'CHECKBOX', 'DROPDOWN'].includes(this.value);
  $('options-section').style.display = needsOptions ? 'block' : 'none';
});

$('btn-add-question').addEventListener('click', () => {
  if (!state.activeSectionId) { toast('Chọn section trước', 'warning'); return; }
  $('question-content').value = '';
  $('question-type').value = 'SHORT_TEXT';
  $('question-required').checked = true;
  $('options-section').style.display = 'none';
  $('options-list').innerHTML = '';
  openModal('modal-add-question');
});

// Add option row
$('btn-add-option').addEventListener('click', () => addOptionRow());

// Add option row to a specific container
function addOptionRow(text = '', nextId = '', containerId = 'options-list') {
  const row = document.createElement('div');
  row.className = 'option-row';
  row.innerHTML = `
    <input type="text" class="form-input option-text-input" placeholder="Lựa chọn..." value="${escapeHtml(text)}" />
    <div class="option-branching">
      <span>→</span>
      <input type="text" class="form-input next-section-input" placeholder="nextSectionId (tuỳ chọn)" value="${escapeHtml(nextId)}" />
    </div>
    <button class="btn-remove-option" title="Xóa">&times;</button>
  `;
  row.querySelector('.btn-remove-option').addEventListener('click', () => row.remove());
  $(containerId).appendChild(row);
}

$('btn-save-question').addEventListener('click', async () => {
  const content = $('question-content').value.trim();
  const type = $('question-type').value;
  const isRequired = $('question-required').checked;

  if (!content) { toast('Vui lòng nhập nội dung câu hỏi', 'warning'); return; }

  let options = [];
  const needsOptions = ['RADIO', 'CHECKBOX', 'DROPDOWN'].includes(type);
  if (needsOptions) {
    $$('.option-row', $('options-list')).forEach(row => {
      const optText = row.querySelector('.option-text-input')?.value.trim();
      const nextSectionId = row.querySelector('.next-section-input')?.value.trim() || null;
      if (optText) {
        let opt = { optionText: optText };
        if (nextSectionId) opt.nextSectionId = nextSectionId;
        options.push(opt);
      }
    });
    if (!options.length) { toast('Vui lòng thêm ít nhất 1 lựa chọn', 'warning'); return; }
  }

  const body = { content, type, isRequired };
  if (needsOptions) body.options = options;

  $('btn-save-question').disabled = true;
  try {
    const result = await apiFetch('POST', `/api/v1/forms/sections/${state.activeSectionId}/questions`, body);
    toast(`✅ Đã thêm câu hỏi: ${result.questionId}`, 'success');
    closeModal('modal-add-question');
    await loadFullSchema(state.builderFormId);
    // re-select active section
    const updatedSec = state.sections.find(s => s.sectionId === state.activeSectionId);
    if (updatedSec) selectSection(updatedSec);
  } catch (err) {
    toast(`Lỗi: ${err.message}`, 'error');
  } finally {
    $('btn-save-question').disabled = false;
  }
});

// Trigger Build
$('btn-trigger-build').addEventListener('click', async () => {
  const formId = $('builder-form-id').value.trim();
  if (!formId) { toast('Vui lòng nhập Form ID', 'warning'); return; }

  if (!confirm('Bạn muốn publish Google Form này? Hệ thống sẽ gửi trigger-build đến backend.')) return;

  try {
    const result = await apiFetch('POST', `/api/v1/forms/${formId}/trigger-build`);
    toast(`🚀 ${result.message || 'Trigger build thành công. Đang polling...'}`, 'info');
    startPolling(formId);
  } catch (err) {
    toast(`Lỗi trigger-build: ${err.message}`, 'error');
  }
});

function startPolling(formId) {
  if (state.pollingInterval) clearInterval(state.pollingInterval);
  $('polling-status').style.display = 'flex';

  state.pollingInterval = setInterval(async () => {
    try {
      const form = await apiFetch('GET', `/api/v1/forms/${formId}`);
      if (form.isActive) {
        clearInterval(state.pollingInterval);
        state.pollingInterval = null;
        $('polling-status').style.display = 'none';
        toast(`✅ Google Form đã ACTIVE! URL: ${form.formUrl}`, 'success');
        if (form.formUrl) window.open(form.formUrl, '_blank');
      }
    } catch (err) {
      // ignore transient errors during polling
    }
  }, 4000);
}

// ─── SCHEDULE CLOSE LOGIC ─────────────────────────────
$('btn-open-schedule-modal').addEventListener('click', () => {
  if (!state.builderFormId) { toast('Chọn form trước', 'warning'); return; }
  openModal('modal-schedule-close');
});

$('btn-save-schedule').addEventListener('click', async () => {
  const closeAtInput = $('schedule-close-at').value;
  if (!closeAtInput) { toast('Vui lòng chọn thời gian', 'warning'); return; }

  // Convert local time to ISO Instant (UTC)
  const dt = new Date(closeAtInput);
  const isoStr = dt.toISOString();

  $('btn-save-schedule').disabled = true;
  try {
    await apiFetch('POST', `/api/v1/forms/${state.builderFormId}/schedule-close`, { closeAt: isoStr });
    toast(`✅ Đã hẹn giờ đóng form: ${dt.toLocaleString()}`, 'success');
    closeModal('modal-schedule-close');
  } catch (err) {
    toast(`Lỗi: ${err.message}`, 'error');
  } finally {
    $('btn-save-schedule').disabled = false;
  }
});


// ════════════════════════════════════════════════════════════
//  TAB 3: SUBMISSIONS
// ════════════════════════════════════════════════════════════

$('btn-load-submissions').addEventListener('click', async () => {
  const formId = $('sub-form-id').value.trim();
  if (!formId) { toast('Vui lòng nhập Form ID', 'warning'); return; }

  $('btn-load-submissions').disabled = true;
  const container = $('submissions-container');
  container.innerHTML = `<div class="empty-state"><div class="empty-icon">⏳</div><h3>Đang tải...</h3></div>`;

  try {
    const subs = await apiFetch('GET', `/api/v1/forms/${formId}/submissions`);
    renderSubmissions(Array.isArray(subs) ? subs : []);
    toast(`Tải được ${Array.isArray(subs) ? subs.length : 0} submission(s)`, 'success');
  } catch (err) {
    toast(`Lỗi: ${err.message}`, 'error');
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">💬</div><h3>Không tải được dữ liệu</h3><p>${err.message}</p></div>`;
  } finally {
    $('btn-load-submissions').disabled = false;
    $('btn-load-submissions').innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg> Tải Submissions`;
  }
});

function renderSubmissions(subs) {
  const container = $('submissions-container');
  container.innerHTML = '';

  if (!subs.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">💬</div><h3>Chưa có submission nào</h3><p>Form chưa có câu trả lời nào được gửi.</p></div>`;
    return;
  }

  subs.forEach((sub, idx) => {
    const card = document.createElement('div');
    card.className = 'submission-card';

    const answersHtml = (sub.answers || []).map(a => `
      <div class="answer-item">
        <div class="answer-question">${escapeHtml(a.questionText || a.questionId || 'Câu hỏi')}</div>
        <div class="answer-value">${escapeHtml(a.answerText || a.selectedOptionText || '—')}</div>
      </div>
    `).join('');

    const timeStr = sub.submittedAt ? new Date(sub.submittedAt).toLocaleString('vi-VN') : '';

    card.innerHTML = `
      <div class="submission-header" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'">
        <div>
          <span style="font-weight:600;color:var(--text-primary)">Submission #${idx + 1}</span>
          <div class="submission-id">${sub.id || ''}</div>
        </div>
        <div class="submission-time">${timeStr}</div>
      </div>
      <div class="submission-body" style="display:none">
        ${answersHtml || '<div class="answer-item"><div class="answer-value" style="color:var(--text-muted)">Không có câu trả lời</div></div>'}
      </div>
    `;
    container.appendChild(card);
  });
}


// ════════════════════════════════════════════════════════════
//  TAB 4: REPORT
// ════════════════════════════════════════════════════════════

$('btn-load-report').addEventListener('click', async () => {
  const formId = $('report-form-id').value.trim();
  if (!formId) { toast('Vui lòng nhập Form ID', 'warning'); return; }

  $('btn-load-report').disabled = true;
  const container = $('report-container');
  container.innerHTML = `<div class="empty-state"><div class="empty-icon">⏳</div><h3>Đang tải báo cáo...</h3></div>`;

  try {
    const report = await apiFetch('GET', `/api/v1/forms/${formId}/report`);
    renderReport(report);
    toast('Tải báo cáo thành công', 'success');
  } catch (err) {
    toast(`Lỗi: ${err.message}`, 'error');
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">📊</div><h3>Không tải được báo cáo</h3><p>${err.message}</p></div>`;
  } finally {
    $('btn-load-report').disabled = false;
    $('btn-load-report').innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg> Tải Báo cáo`;
  }
});

function renderReport(report) {
  const container = $('report-container');
  container.innerHTML = '';

  // Summary stats
  const summary = document.createElement('div');
  summary.className = 'report-summary';
  summary.innerHTML = `
    <div class="stat-card">
      <div class="stat-value">${report.totalSubmissions ?? '—'}</div>
      <div class="stat-label">Tổng số phản hồi</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color:var(--purple)">${(report.questions || []).length}</div>
      <div class="stat-label">Số câu hỏi</div>
    </div>
  `;
  container.appendChild(summary);

  // Questions
  const questions = report.questions || [];
  if (!questions.length) {
    container.innerHTML += `<div class="empty-state"><div class="empty-icon">📊</div><h3>Không có câu hỏi nào</h3></div>`;
    return;
  }

  questions.forEach((q, idx) => {
    const card = document.createElement('div');
    card.className = 'report-question-card';

    let chartHtml = '';
    const type = q.type;

    if (['RADIO', 'DROPDOWN', 'CHECKBOX'].includes(type) && q.optionCounts && Object.keys(q.optionCounts).length) {
      const total = Object.values(q.optionCounts).reduce((a, b) => a + b, 0);
      const bars = Object.entries(q.optionCounts).map(([label, count]) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return `
          <div class="bar-row">
            <div class="bar-label">
              <span class="bar-option-text">${escapeHtml(label)}</span>
              <span class="bar-count">${count} (${pct}%)</span>
            </div>
            <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
          </div>
        `;
      }).join('');
      chartHtml = `<div class="bar-chart">${bars}</div>`;
    } else if (type === 'LINEAR_SCALE' || type === 'SCALE') {
      const avg = typeof q.averageRating === 'number' ? q.averageRating : null;
      const stars = avg !== null ? Math.round(avg) : 0;
      const starHtml = Array.from({ length: 5 }, (_, i) =>
        `<span class="scale-star ${i < stars ? '' : 'empty'}">★</span>`).join('');
      chartHtml = `
        <div class="scale-display">
          <div class="scale-value">${avg !== null ? avg.toFixed(1) : '—'}</div>
          <div>
            <div class="scale-star-row">${starHtml}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:4px">Điểm trung bình / 5</div>
          </div>
        </div>
        ${(q.textAnswers || []).length ? `<div class="bar-chart" style="margin-top:12px">${(q.textAnswers || []).map(v=>`<div class="bar-row"><div class="bar-label"><span>${v}</span></div></div>`).join('')}</div>` : ''}
      `;
    } else if ((q.textAnswers || []).length) {
      const items = (q.textAnswers || []).map(t => `<div class="text-answer-item">${escapeHtml(t)}</div>`).join('');
      chartHtml = `<div class="text-answers">${items}</div>`;
    } else {
      chartHtml = `<div style="color:var(--text-muted);font-size:13px">Không có dữ liệu</div>`;
    }

    card.innerHTML = `
      <div class="rq-header">
        <span class="question-type-badge type-${type}">${type}</span>
        <span class="rq-content">Q${idx + 1}: ${escapeHtml(q.questionText || '')}</span>
      </div>
      <div class="rq-body">${chartHtml}</div>
    `;
    container.appendChild(card);
  });
}


// ════════════════════════════════════════════════════════════
//  KEYBOARD SHORTCUTS
// ════════════════════════════════════════════════════════════
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    $$('.modal-overlay.open').forEach(m => m.classList.remove('open'));
  }
});

// ─── INIT ─────────────────────────────────────────────────
console.log('%c🚀 Feedback Form Tester loaded', 'color:#4285F4;font-weight:bold;font-size:14px');
