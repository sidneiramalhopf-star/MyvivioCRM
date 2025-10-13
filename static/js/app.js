const API_BASE = '';
let currentUser = null;
let authToken = null;
let currentPage = 'home';

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

function setupEventListeners() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const agendaForm = document.getElementById('agenda-form');
    const eventForm = document.getElementById('event-form');
    
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registerForm) registerForm.addEventListener('submit', handleRegister);
    if (agendaForm) agendaForm.addEventListener('submit', handleAgendaSubmit);
    if (eventForm) eventForm.addEventListener('submit', handleEventFormSubmit);
    
    // Inicializar display de mês/ano no calendário
    updateMonthYearDisplay();
}

function switchTab(tab) {
    const tabs = document.querySelectorAll('.tab');
    const forms = {
        login: document.getElementById('login-form'),
        register: document.getElementById('register-form')
    };

    tabs.forEach(t => t.classList.remove('active'));
    Object.values(forms).forEach(f => f.style.display = 'none');

    if (tab === 'login') {
        tabs[0].classList.add('active');
        forms.login.style.display = 'flex';
    } else {
        tabs[1].classList.add('active');
        forms.register.style.display = 'flex';
    }
}

function navigateTo(event, page) {
    event.preventDefault();
    currentPage = page;
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    event.currentTarget.classList.add('active');
    
    document.querySelectorAll('.page-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const pageElement = document.getElementById(`page-${page}`);
    if (pageElement) {
        pageElement.classList.add('active');
        
        if (page === 'home') {
            loadDashboardData();
        } else if (page === 'planejador') {
            initPlanner();
        } else if (page === 'treinamento') {
            loadProgramas();
        }
    }
}

function navigateToPage(page) {
    currentPage = page;
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const navItem = document.querySelector(`.nav-item[onclick*="${page}"]`);
    if (navItem) {
        navItem.classList.add('active');
    }
    
    document.querySelectorAll('.page-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const pageElement = document.getElementById(`page-${page}`);
    if (pageElement) {
        pageElement.classList.add('active');
        
        if (page === 'home') {
            loadDashboardData();
        } else if (page === 'planejador') {
            initPlanner();
        } else if (page === 'treinamento') {
            loadProgramas();
        }
    }
}

function switchHomeTab(tab) {
    document.querySelectorAll('.view-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.home-tab-content').forEach(c => c.classList.remove('active'));
    
    event.currentTarget.classList.add('active');
    
    if (tab === 'dia-apos-dia') {
        document.getElementById('tab-dia-apos-dia').classList.add('active');
        loadDayToDayData();
    } else if (tab === 'desempenho') {
        document.getElementById('tab-desempenho').classList.add('active');
        loadDashboardData();
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                senha: password
            })
        });

        if (response.ok) {
            const data = await response.json();
            authToken = data.access_token;
            localStorage.setItem('authToken', authToken);
            currentUser = { email: email, nome: data.nome || email.split('@')[0] };
            showToast('Login realizado com sucesso!', 'success');
            showDashboard();
            await loadDashboardData();
        } else {
            showToast('Credenciais inválidas', 'error');
        }
    } catch (error) {
        showToast('Erro ao fazer login', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const type = document.getElementById('register-type').value;
    const unidade = document.getElementById('register-unidade').value;

    try {
        const response = await fetch(`${API_BASE}/registrar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                senha: password,
                nome: name,
                tipo: type,
                unidade_id: parseInt(unidade)
            })
        });

        if (response.ok) {
            showToast('Registro realizado! Faça login.', 'success');
            switchTab('login');
            document.getElementById('login-email').value = email;
        } else {
            const error = await response.json();
            showToast(error.detail || 'Erro ao registrar', 'error');
        }
    } catch (error) {
        showToast('Erro ao registrar', 'error');
    }
}

async function loadDashboardData() {
    if (!authToken) return;
    
    try {
        const statsResponse = await fetch(`${API_BASE}/stats/overview`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            updateStats(stats);
        }

        const metricasResponse = await fetch(`${API_BASE}/metricas/ia?unidade_id=1`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        if (metricasResponse.ok) {
            const metricas = await metricasResponse.json();
            updateMetrics(metricas);
        }
    } catch (error) {
        console.error('Erro ao carregar dados do dashboard', error);
    }
}

async function loadDayToDayData() {
    if (!authToken) return;
    
    try {
        const agendasResponse = await fetch(`${API_BASE}/agendas/historico`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (agendasResponse.ok) {
            const agendas = await agendasResponse.json();
            displayDayToDayActivities(agendas);
        }

        const statsResponse = await fetch(`${API_BASE}/stats/overview`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            document.getElementById('contacts-risk').textContent = stats.risco_desistencia || '0';
            document.getElementById('contacts-total').textContent = stats.usuarios_totais || '0';
            document.getElementById('leads-count').textContent = stats.visitantes || '0';
            document.getElementById('programs-expired').textContent = stats.programas?.expirado || '0';
            document.getElementById('programs-unassigned').textContent = stats.programas?.['não-atribuído'] || '0';
        }
    } catch (error) {
        console.error('Erro ao carregar dados do dia a dia', error);
    }
}

function displayDayToDayActivities(agendas) {
    const timeline = document.getElementById('activities-timeline');
    const todoCount = document.getElementById('activities-todo');
    const doneCount = document.getElementById('activities-done');
    const todayCount = document.getElementById('today-activities-count');
    
    if (!agendas || agendas.length === 0) {
        timeline.innerHTML = '<p class="empty-message">Nenhuma atividade agendada</p>';
        todoCount.textContent = '0';
        doneCount.textContent = '0';
        todayCount.textContent = '0 atividades';
        return;
    }
    
    const todo = agendas.filter(a => !a.concluida).length;
    const done = agendas.filter(a => a.concluida).length;
    
    todoCount.textContent = todo;
    doneCount.textContent = done;
    todayCount.textContent = `${agendas.length} atividades`;
    
    timeline.innerHTML = agendas.map(agenda => `
        <div class="activity-timeline-item">
            <div class="activity-time">${agenda.duracao_minutos} min</div>
            <div class="activity-title">${agenda.titulo}</div>
            <div class="activity-details">${agenda.tipo_atividade} - ${agenda.concluida ? 'Concluída' : 'Pendente'}</div>
        </div>
    `).join('');
}

function updateStats(stats) {
    document.getElementById('stat-risco').textContent = stats.risco_desistencia || '0';
    document.getElementById('stat-usuarios').textContent = stats.usuarios_totais || '0';
    document.getElementById('stat-usuarios-ativos').textContent = stats.usuarios_ativos || '0';
    document.getElementById('stat-visitantes').textContent = stats.visitantes || '0';
    
    document.getElementById('prog-expirados').textContent = stats.programas.expirado;
    document.getElementById('prog-nao-atribuidos').textContent = stats.programas['não-atribuído'];
    document.getElementById('prog-atribuidos').textContent = stats.programas.atribuído;
}

function updateMetrics(metricas) {
    if (!metricas) return;
    
    document.getElementById('metric-engajamento').textContent = metricas.taxa_engajamento + '%';
    document.getElementById('metric-roi').textContent = metricas.roi + '%';
    document.getElementById('metric-produtividade').textContent = metricas.produtividade + '%';
    document.getElementById('metric-membros').textContent = metricas.usuarios_ativos;
}

async function loadAgendas() {
    if (!authToken) return;
    
    try {
        const response = await fetch(`${API_BASE}/agendas/historico`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const agendas = await response.json();
            displayAgendas(agendas);
        }
    } catch (error) {
        console.error('Erro ao carregar agendas', error);
    }
}

function displayAgendas(agendas) {
    const container = document.getElementById('agenda-list');
    
    if (agendas.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhuma atividade agendada</p>';
        return;
    }
    
    container.innerHTML = agendas.map(agenda => `
        <div class="agenda-item ${agenda.concluida ? 'concluida' : ''}">
            <div class="agenda-header">
                <span class="agenda-titulo">${agenda.titulo}</span>
                <span class="agenda-tipo">${agenda.tipo_atividade}</span>
            </div>
            <p class="agenda-descricao">${agenda.descricao}</p>
            <div class="agenda-footer">
                <span class="agenda-duracao">⏱️ ${agenda.duracao_minutos} min</span>
                ${!agenda.concluida ? 
                    `<button class="btn-concluir" onclick="concluirAgenda(${agenda.id})">✓ Concluir</button>` : 
                    '<span style="color: var(--success-color); font-weight: 600;">✓ Concluída</span>'
                }
            </div>
        </div>
    `).join('');
}

async function loadProgramas() {
    if (!authToken) return;
    
    try {
        const response = await fetch(`${API_BASE}/programas`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        if (response.ok) {
            const programas = await response.json();
            displayProgramas(programas);
        }
    } catch (error) {
        console.error('Erro ao carregar programas', error);
    }
}

function displayProgramas(programas) {
    const container = document.getElementById('programs-grid');
    
    if (programas.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhum programa cadastrado</p>';
        return;
    }
    
    container.innerHTML = programas.map(p => `
        <div class="program-card status-${p.status}">
            <h4>${p.nome}</h4>
            <p class="program-status">Status: ${p.status}</p>
            <p class="program-usuarios">👥 ${p.usuarios_matriculados} matriculados</p>
        </div>
    `).join('');
}

function openAgendaModal() {
    document.getElementById('agenda-modal').style.display = 'block';
}

function closeAgendaModal() {
    document.getElementById('agenda-modal').style.display = 'none';
    document.getElementById('agenda-form').reset();
}

async function handleAgendaSubmit(e) {
    e.preventDefault();
    
    const titulo = document.getElementById('agenda-titulo').value;
    const descricao = document.getElementById('agenda-descricao').value;
    const tipo = document.getElementById('agenda-tipo').value;
    const duracao = document.getElementById('agenda-duracao').value;
    
    try {
        const response = await fetch(`${API_BASE}/agendas/criar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                titulo: titulo,
                descricao: descricao,
                tipo_atividade: tipo,
                duracao_minutos: parseInt(duracao)
            })
        });
        
        if (response.ok) {
            showToast('Atividade adicionada com sucesso!', 'success');
            closeAgendaModal();
            await loadAgendas();
        } else {
            showToast('Erro ao adicionar atividade', 'error');
        }
    } catch (error) {
        showToast('Erro ao adicionar atividade', 'error');
    }
}

async function concluirAgenda(id) {
    try {
        const response = await fetch(`${API_BASE}/agendas/${id}/concluir`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            showToast('Atividade concluída!', 'success');
            await loadAgendas();
        }
    } catch (error) {
        showToast('Erro ao concluir atividade', 'error');
    }
}

function checkAuth() {
    const token = localStorage.getItem('authToken');
    if (token) {
        authToken = token;
        showDashboard();
        loadDashboardData();
    }
}

function showDashboard() {
    document.getElementById('login-section').classList.remove('active');
    document.getElementById('dashboard-section').classList.add('active');
    
    if (currentUser) {
        const userNameElements = document.querySelectorAll('#userName, #userName-display');
        userNameElements.forEach(el => {
            el.textContent = currentUser.nome || currentUser.email.split('@')[0];
        });
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    document.getElementById('dashboard-section').classList.remove('active');
    document.getElementById('login-section').classList.add('active');
    showToast('Logout realizado com sucesso', 'success');
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

window.onclick = function(event) {
    const modal = document.getElementById('agenda-modal');
    if (event.target === modal) {
        closeAgendaModal();
    }
}

// ============================================
// PLANEJADOR - Funções de Calendário e Reservas
// ============================================

let currentDate = new Date();
let viewMode = 'week';
let sidebarCollapsed = false;

// Toggle Sidebar
function togglePlannerSidebar() {
    const sidebar = document.getElementById('planner-sidebar');
    sidebarCollapsed = !sidebarCollapsed;
    if (sidebarCollapsed) {
        sidebar.classList.add('collapsed');
    } else {
        sidebar.classList.remove('collapsed');
    }
}

// Trocar entre visualizações do Planejador
function switchPlannerView(view, evt) {
    // Remove active de todos os botões
    document.querySelectorAll('.planner-menu-item').forEach(btn => btn.classList.remove('active'));
    
    // Remove active de todas as views
    document.querySelectorAll('.planner-view').forEach(v => v.classList.remove('active'));
    
    // Ativa o botão clicado (se houver evento)
    if (evt) {
        evt.target.closest('.planner-menu-item').classList.add('active');
    } else {
        // Se não houver evento, ativa o botão correspondente
        const button = document.querySelector(`.planner-menu-item[onclick*="${view}"]`);
        if (button) button.classList.add('active');
    }
    
    // Ativa a view correspondente
    document.getElementById(`planner-${view}`).classList.add('active');
    
    // Carregar dados específicos
    if (view === 'calendario') {
        renderCalendar();
    } else if (view === 'reservas') {
        renderWeekCalendar();
    } else if (view === 'agendamento') {
        renderAgendamentoList();
    }
}

// Inicializar Planejador quando a página for carregada
function initPlanner() {
    // Verificar se estamos na página do planejador
    const plannerPage = document.getElementById('page-planejador');
    if (plannerPage && plannerPage.classList.contains('active')) {
        switchPlannerView('calendario');
    }
}

// ===== CALENDÁRIO =====

function renderCalendar() {
    const mode = document.getElementById('view-mode').value;
    if (mode === 'week') {
        renderWeekView();
    } else {
        renderMonthView();
    }
}

function renderMonthView() {
    const header = document.getElementById('calendar-header');
    const body = document.getElementById('calendar-body');
    
    // Dias da semana
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    header.innerHTML = weekDays.map(day => `<div>${day}</div>`).join('');
    
    // Obter primeiro e último dia do mês
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    // Construir calendário
    let html = '';
    let day = 1;
    
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 7; j++) {
            if (i === 0 && j < startDay) {
                html += '<div class="calendar-day other-month"></div>';
            } else if (day > daysInMonth) {
                html += '<div class="calendar-day other-month"></div>';
            } else {
                const isToday = day === new Date().getDate() && 
                               month === new Date().getMonth() && 
                               year === new Date().getFullYear();
                html += `
                    <div class="calendar-day ${isToday ? 'today' : ''}">
                        <div class="calendar-day-number">${day}</div>
                        <div class="calendar-events">
                            ${day % 3 === 0 ? '<span class="calendar-event-dot"></span>' : ''}
                            ${day % 5 === 0 ? '<span class="calendar-event-dot"></span>' : ''}
                        </div>
                    </div>
                `;
                day++;
            }
        }
        if (day > daysInMonth) break;
    }
    
    body.innerHTML = html;
}

function renderWeekView() {
    const header = document.getElementById('calendar-header');
    const body = document.getElementById('calendar-body');
    
    // Obter início da semana
    const today = new Date(currentDate);
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    
    // Dias da semana com datas
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    let headerHTML = '';
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        const isToday = date.toDateString() === new Date().toDateString();
        headerHTML += `
            <div class="${isToday ? 'today' : ''}">
                ${weekDays[i]}<br>
                <small>${date.getDate()}</small>
            </div>
        `;
    }
    
    header.innerHTML = headerHTML;
    body.innerHTML = '<div style="grid-column: 1/-1; padding: 2rem; text-align: center; color: var(--text-secondary);">Selecione uma data para ver as atividades</div>';
}

function changeViewMode() {
    renderCalendar();
}

function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
}

function goToToday() {
    currentDate = new Date();
    renderCalendar();
}

// ===== RESERVA DE AULAS =====

let currentWeek = new Date();

function renderWeekCalendar() {
    const container = document.getElementById('week-calendar');
    
    // Obter início da semana
    const today = new Date(currentWeek);
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    
    const weekDays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
    
    // Exemplo de aulas
    const classes = [
        { day: 1, time: '07:00', duration: 60, name: 'GINÁSIO', instructor: 'Ramalho Sidnei', capacity: '17/30', type: 'ginasio' },
        { day: 3, time: '07:00', duration: 60, name: 'GINÁSIO', instructor: 'Ramalho Sidnei', capacity: '6/30', type: 'ginasio' },
        { day: 4, time: '07:00', duration: 60, name: 'GINÁSIO', instructor: 'Ramalho Sidnei', capacity: '4/30', type: 'ginasio' },
        { day: 5, time: '07:00', duration: 60, name: 'GINÁSIO', instructor: 'Ramalho Sidnei', capacity: '4/30', type: 'ginasio' },
        { day: 6, time: '07:00', duration: 60, name: 'GINÁSIO', instructor: 'Ramalho Sidnei', capacity: '1/30', type: 'ginasio' },
        { day: 6, time: '08:00', duration: 30, name: 'Personal Training 30\'', instructor: 'Lima Bernardo', capacity: '0/1', type: 'personal' },
        { day: 3, time: '09:00', duration: 30, name: 'Personal Training 30\'', instructor: 'Ramalho Sidnei', capacity: '0/1', type: 'personal' },
    ];
    
    let html = '<div class="week-grid">';
    
    // Cabeçalho com dias
    html += '<div class="week-header time"></div>';
    for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        const isToday = date.toDateString() === new Date().toDateString();
        html += `
            <div class="week-header ${isToday ? 'today' : ''}">
                ${weekDays[i]}<br>
                <small>${date.getDate()} Out</small>
            </div>
        `;
    }
    
    // Horários
    const hours = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
    
    hours.forEach(hour => {
        html += `<div class="time-slot">${hour}</div>`;
        
        for (let day = 0; day < 7; day++) {
            const dayClasses = classes.filter(c => c.day === day && c.time === hour);
            html += '<div class="week-cell">';
            dayClasses.forEach(cls => {
                html += `
                    <div class="class-block ${cls.type}">
                        <div class="class-time">${cls.time} - ${addMinutes(cls.time, cls.duration)}</div>
                        <div class="class-name">${cls.name}</div>
                        <div class="class-instructor">${cls.instructor}</div>
                        <div class="class-capacity">${cls.capacity}</div>
                    </div>
                `;
            });
            html += '</div>';
        }
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function addMinutes(time, minutes) {
    const [hours, mins] = time.split(':').map(Number);
    const totalMins = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMins / 60);
    const newMins = totalMins % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
}

function previousWeek() {
    currentWeek.setDate(currentWeek.getDate() - 7);
    renderWeekCalendar();
}

function nextWeek() {
    currentWeek.setDate(currentWeek.getDate() + 7);
    renderWeekCalendar();
}

function goToTodayReservas() {
    currentWeek = new Date();
    renderWeekCalendar();
}

// ===== AGENDAMENTO DE AULAS =====

let currentAgendaDate = new Date();

function renderAgendamentoList() {
    const container = document.getElementById('agendamento-list');
    
    const agendamentos = [
        { time: '12:00 - 12:30', title: 'Personal Training 30\' - CP', location: 'GINÁSIO', instructor: 'Ferreira Pinto Carlos', capacity: '0/1' },
        { time: '15:00 - 17:30', title: 'Personal Training 30\' - SR', location: 'GINÁSIO', instructor: 'Ramalho Sidnei', capacity: '0/1' },
        { time: '17:30 - 18:00', title: 'Personal Training 30\' - CP', location: 'GINÁSIO', instructor: 'Ferreira Pinto Carlos', capacity: '0/1' },
        { time: '18:00 - 20:00', title: 'GINÁSIO', location: 'GINÁSIO', instructor: 'Ferreira Pinto Carlos', capacity: '0/30' }
    ];
    
    let html = '';
    agendamentos.forEach(item => {
        html += `
            <div class="agendamento-item">
                <div class="agendamento-time">${item.time}</div>
                <div class="agendamento-info">
                    <div class="agendamento-title">${item.title}</div>
                    <div class="agendamento-subtitle">${item.location}</div>
                    <div class="agendamento-instructor">${item.instructor}</div>
                </div>
                <div class="agendamento-capacity">${item.capacity}</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function previousDayAgenda() {
    currentAgendaDate.setDate(currentAgendaDate.getDate() - 1);
    renderAgendamentoList();
}

function nextDayAgenda() {
    currentAgendaDate.setDate(currentAgendaDate.getDate() + 1);
    renderAgendamentoList();
}

function goToTodayAgendamento() {
    currentAgendaDate = new Date();
    renderAgendamentoList();
}

// ============================================================
// CONEXÃO COM BACKEND - NOVOS ENDPOINTS
// ============================================================

// Carregar eventos do calendário
async function carregarEventosCalendario() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await fetch('/calendario/eventos', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const eventos = await response.json();
            renderizarEventosCalendario(eventos);
        }
    } catch (error) {
        console.error('Erro ao carregar eventos:', error);
    }
}

// Carregar aulas para reserva
async function carregarAulasDisponiveis() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const dataInicio = new Date(currentWeek);
        dataInicio.setDate(dataInicio.getDate() - dataInicio.getDay());
        const dataFim = new Date(dataInicio);
        dataFim.setDate(dataFim.getDate() + 6);
        
        const response = await fetch(`/aulas?data_inicio=${dataInicio.toISOString()}&data_fim=${dataFim.toISOString()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const aulas = await response.json();
            renderizarAulasReserva(aulas);
        }
    } catch (error) {
        console.error('Erro ao carregar aulas:', error);
    }
}

// Carregar lista de agendamentos
async function carregarAgendamentos() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const dataInicio = new Date(currentAgendaDate);
        dataInicio.setHours(0, 0, 0, 0);
        const dataFim = new Date(currentAgendaDate);
        dataFim.setHours(23, 59, 59, 999);
        
        const response = await fetch(`/aulas?data_inicio=${dataInicio.toISOString()}&data_fim=${dataFim.toISOString()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const aulas = await response.json();
            renderizarListaAgendamentos(aulas);
        }
    } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
    }
}

// Renderizar eventos do calendário
function renderizarEventosCalendario(eventos) {
    const calendarBody = document.getElementById('calendar-body');
    if (!calendarBody) return;
    
    // Adicionar eventos ao calendário (implementação básica)
    console.log('Eventos carregados:', eventos);
}

// Renderizar aulas para reserva
function renderizarAulasReserva(aulas) {
    const weekCalendar = document.getElementById('week-calendar');
    if (!weekCalendar) return;
    
    let html = '<div class="week-schedule">';
    
    aulas.forEach(aula => {
        const dataHora = new Date(aula.data_hora);
        const horaInicio = dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const horaFim = new Date(dataHora.getTime() + aula.duracao_minutos * 60000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        const vagas = aula.reservas_count || 0;
        const limite = aula.limite_inscricoes || 0;
        
        html += `
            <div class="aula-card" onclick="verDetalhesAula(${aula.id})">
                <div class="aula-time">${horaInicio} - ${horaFim}</div>
                <div class="aula-title">${aula.titulo || 'Aula'}</div>
                <div class="aula-instructor">${aula.instrutor_nome || 'Instrutor'}</div>
                <div class="aula-room">${aula.sala_nome || 'Sala'}</div>
                <div class="aula-capacity">${vagas}/${limite}</div>
            </div>
        `;
    });
    
    html += '</div>';
    weekCalendar.innerHTML = html;
}

// Renderizar lista de agendamentos
function renderizarListaAgendamentos(aulas) {
    const container = document.getElementById('agendamento-list');
    if (!container) return;
    
    if (aulas.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhuma aula agendada para este dia</p>';
        return;
    }
    
    let html = '';
    aulas.forEach(aula => {
        const dataHora = new Date(aula.data_hora);
        const horaInicio = dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const horaFim = new Date(dataHora.getTime() + aula.duracao_minutos * 60000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        const vagas = aula.reservas_count || 0;
        const limite = aula.limite_inscricoes || 0;
        
        html += `
            <div class="agendamento-item">
                <div class="agendamento-time">${horaInicio} - ${horaFim}</div>
                <div class="agendamento-info">
                    <div class="agendamento-title">${aula.titulo || 'Aula'}</div>
                    <div class="agendamento-subtitle">${aula.sala_nome || 'Sala não especificada'}</div>
                    <div class="agendamento-instructor">${aula.instrutor_nome || 'Instrutor não especificado'}</div>
                </div>
                <div class="agendamento-capacity">${vagas}/${limite}</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Ver detalhes de uma aula
async function verDetalhesAula(aulaId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showToast('Faça login para ver detalhes da aula', 'error');
            return;
        }
        
        const response = await fetch(`/aulas/${aulaId}/estatisticas`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const stats = await response.json();
            showToast(`Aula: ${stats.ocupacao_percentual}% ocupada`, 'success');
        }
    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
    }
}

// Atualizar funções existentes para carregar dados do backend
const originalRenderWeekCalendar = renderWeekCalendar;
renderWeekCalendar = function() {
    originalRenderWeekCalendar();
    carregarAulasDisponiveis();
};

const originalRenderAgendamentoList = renderAgendamentoList;
renderAgendamentoList = function() {
    carregarAgendamentos();
};

// ============================================================
// NOVAS FUNCIONALIDADES - CALENDÁRIO INTERATIVO E BARRA GLOBAL
// ============================================================

// Atualizar exibição de mês/ano no calendário
function updateMonthYearDisplay() {
    const monthYearElement = document.getElementById('month-year');
    if (!monthYearElement) return;
    
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    const mes = meses[currentDate.getMonth()];
    const ano = currentDate.getFullYear();
    
    monthYearElement.textContent = `${mes} ${ano}`;
}

// Atualizar renderMonthView para incluir clique nas datas e atualizar display
const originalRenderMonthView = renderMonthView;
renderMonthView = function() {
    const header = document.getElementById('calendar-header');
    const body = document.getElementById('calendar-body');
    
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    header.innerHTML = weekDays.map(day => `<div>${day}</div>`).join('');
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    let html = '';
    let day = 1;
    
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 7; j++) {
            if (i === 0 && j < startDay) {
                html += '<div class="calendar-day other-month"></div>';
            } else if (day > daysInMonth) {
                html += '<div class="calendar-day other-month"></div>';
            } else {
                const isToday = day === new Date().getDate() && 
                               month === new Date().getMonth() && 
                               year === new Date().getFullYear();
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                html += `
                    <div class="calendar-day ${isToday ? 'today' : ''}" onclick="onCalendarDayClick('${dateStr}')">
                        <div class="calendar-day-number">${day}</div>
                        <div class="calendar-events">
                            ${day % 3 === 0 ? '<span class="calendar-event-dot"></span>' : ''}
                            ${day % 5 === 0 ? '<span class="calendar-event-dot"></span>' : ''}
                        </div>
                    </div>
                `;
                day++;
            }
        }
        if (day > daysInMonth) break;
    }
    
    body.innerHTML = html;
    updateMonthYearDisplay();
};

// Atualizar previousMonth e nextMonth para atualizar o display
const originalPreviousMonth = previousMonth;
previousMonth = function() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
    updateMonthYearDisplay();
};

const originalNextMonth = nextMonth;
nextMonth = function() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
    updateMonthYearDisplay();
};

const originalGoToToday = goToToday;
goToToday = function() {
    currentDate = new Date();
    renderCalendar();
    updateMonthYearDisplay();
};

// Função chamada ao clicar em uma data do calendário
function onCalendarDayClick(dateStr) {
    openEventModal(dateStr);
}

// ===== MODAL DE EVENTO =====

function openEventModal(prefilledDate = null) {
    const modal = document.getElementById('event-modal');
    const form = document.getElementById('event-form');
    
    if (prefilledDate) {
        document.getElementById('event-data').value = prefilledDate;
    } else {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('event-data').value = today;
    }
    
    modal.style.display = 'block';
}

function closeEventModal() {
    const modal = document.getElementById('event-modal');
    const form = document.getElementById('event-form');
    modal.style.display = 'none';
    form.reset();
}

// Submeter formulário de evento
async function handleEventFormSubmit(e) {
    e.preventDefault();
    
    const titulo = document.getElementById('event-titulo').value;
    const data = document.getElementById('event-data').value;
    const horaInicio = document.getElementById('event-hora-inicio').value;
    const horaFim = document.getElementById('event-hora-fim').value;
    const tipo = document.getElementById('event-tipo').value;
    const descricao = document.getElementById('event-descricao').value;
    const temLembrete = document.getElementById('event-lembrete').checked;
    
    const eventData = {
        titulo: titulo,
        data_evento: data,
        hora_inicio: horaInicio || null,
        hora_fim: horaFim || null,
        tipo_evento: tipo,
        descricao: descricao || '',
        tem_lembrete: temLembrete
    };
    
    try {
        const response = await fetch('/calendario/eventos/criar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(eventData)
        });
        
        if (response.ok) {
            showToast('Evento criado com sucesso!', 'success');
            closeEventModal();
            renderCalendar();
        } else {
            const error = await response.json();
            showToast(error.detail || 'Erro ao criar evento', 'error');
        }
    } catch (error) {
        showToast('Erro ao criar evento', 'error');
        console.error('Erro:', error);
    }
}

// Fechar modal ao clicar fora
window.addEventListener('click', (event) => {
    const eventModal = document.getElementById('event-modal');
    if (event.target === eventModal) {
        closeEventModal();
    }
});

// ===== BARRA LATERAL GLOBAL DO PLANEJADOR =====

let globalPlannerOpen = false;

function toggleGlobalPlanner() {
    const sidebar = document.getElementById('global-planner-sidebar');
    globalPlannerOpen = !globalPlannerOpen;
    
    if (globalPlannerOpen) {
        sidebar.classList.add('active');
        renderMiniCalendar();
    } else {
        sidebar.classList.remove('active');
    }
}

function closeGlobalPlanner() {
    const sidebar = document.getElementById('global-planner-sidebar');
    sidebar.classList.remove('active');
    globalPlannerOpen = false;
}

// Fechar ao clicar fora da sidebar
document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('global-planner-sidebar');
    const toggleBtn = document.getElementById('toggle-global-planner');
    
    if (globalPlannerOpen && 
        !sidebar.contains(e.target) && 
        e.target !== toggleBtn && 
        !toggleBtn.contains(e.target)) {
        closeGlobalPlanner();
    }
});

// ===== MINI CALENDÁRIO =====

let miniCurrentDate = new Date();

function renderMiniCalendar() {
    const grid = document.getElementById('mini-calendar-grid');
    const monthYearSpan = document.getElementById('mini-month-year');
    
    if (!grid || !monthYearSpan) return;
    
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
                   'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    monthYearSpan.textContent = `${meses[miniCurrentDate.getMonth()]} ${miniCurrentDate.getFullYear()}`;
    
    const year = miniCurrentDate.getFullYear();
    const month = miniCurrentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    let html = '';
    let day = 1;
    
    // Dias da semana (cabeçalho)
    const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    weekDays.forEach(d => {
        html += `<div style="font-weight: 600; color: var(--text-secondary); font-size: 0.7rem;">${d}</div>`;
    });
    
    // Dias do mês
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 7; j++) {
            if (i === 0 && j < startDay) {
                html += '<div class="mini-calendar-day other-month"></div>';
            } else if (day > daysInMonth) {
                html += '<div class="mini-calendar-day other-month"></div>';
            } else {
                const isToday = day === new Date().getDate() && 
                               month === new Date().getMonth() && 
                               year === new Date().getFullYear();
                html += `<div class="mini-calendar-day ${isToday ? 'today' : ''}">${day}</div>`;
                day++;
            }
        }
        if (day > daysInMonth) break;
    }
    
    grid.innerHTML = html;
}

function miniPrevMonth() {
    miniCurrentDate.setMonth(miniCurrentDate.getMonth() - 1);
    renderMiniCalendar();
}

function miniNextMonth() {
    miniCurrentDate.setMonth(miniCurrentDate.getMonth() + 1);
    renderMiniCalendar();
}

// ===== FUNCIONALIDADES DO PLANEJADOR APRIMORADO =====

// Modal de Informações da Aula
let aulaAtualId = null;

function abrirInfoAula(aulaId) {
    if (!window.mockData || !window.mockData.aulasDetalhes[aulaId]) {
        showToast('Aula não encontrada', 'error');
        return;
    }
    
    const aula = window.mockData.aulasDetalhes[aulaId];
    aulaAtualId = aulaId;
    
    // Preencher dados do cabeçalho
    document.getElementById('aula-nome').textContent = aula.nome;
    document.getElementById('aula-instrutor').textContent = aula.instrutor;
    
    const dataFormatada = new Date(aula.data).toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    document.getElementById('aula-data-horario').textContent = 
        `${dataFormatada}, ${aula.horario_inicio} - ${aula.horario_fim}`;
    document.getElementById('aula-local').textContent = aula.sala;
    
    // Calcular porcentagens
    const percVagas = Math.round((aula.vagas_ocupadas / aula.vagas_totais) * 100);
    const percPresentes = aula.vagas_ocupadas > 0 ? 
        Math.round((aula.presentes / aula.vagas_ocupadas) * 100) : 0;
    const percAusentes = aula.vagas_ocupadas > 0 ? 
        Math.round((aula.ausentes / aula.vagas_ocupadas) * 100) : 0;
    
    // Atualizar círculos
    document.getElementById('stat-vagas').textContent = 
        `${aula.vagas_ocupadas}/${aula.vagas_totais}`;
    document.querySelector('.circle-stat.vagas .circle-progress').style.setProperty('--progress', percVagas);
    
    document.getElementById('stat-presentes').textContent = 
        `${aula.presentes}/${aula.vagas_ocupadas}`;
    document.querySelector('.circle-stat.presentes .circle-progress').style.setProperty('--progress', percPresentes);
    
    document.getElementById('stat-ausentes').textContent = 
        `${aula.ausentes}/${aula.vagas_ocupadas}`;
    document.querySelector('.circle-stat.ausentes .circle-progress').style.setProperty('--progress', percAusentes);
    
    document.getElementById('stat-espera').textContent = aula.lista_espera;
    document.querySelector('.circle-stat.espera .circle-progress').style.setProperty('--progress', 
        aula.lista_espera > 0 ? 50 : 0);
    
    // Popular lista de inscritos
    const inscritosTable = document.getElementById('inscritos-table');
    inscritosTable.innerHTML = aula.inscritos.map(inscrito => `
        <div class="inscrito-item">
            <div class="inscrito-avatar">${inscrito.avatar}</div>
            <div class="inscrito-nome">${inscrito.nome}</div>
            <div class="inscrito-data">${new Date(inscrito.data_inscricao).toLocaleDateString('pt-BR')}</div>
            <div class="inscrito-acoes">
                <button class="btn-icon" title="${inscrito.presente ? 'Presente' : 'Ausente'}">
                    <i class="fas fa-${inscrito.presente ? 'check-circle' : 'times-circle'}"></i>
                </button>
                <button class="btn-icon" title="Remover">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    // Mostrar modal
    document.getElementById('modal-info-aula').style.display = 'flex';
}

function closeAulaInfoModal() {
    document.getElementById('modal-info-aula').style.display = 'none';
    aulaAtualId = null;
}

function reservarAula() {
    if (!aulaAtualId) return;
    
    const usuario = window.mockData.usuarioLogado;
    
    // Verificar se já está inscrito
    if (usuario.inscricoes_ativas.includes(aulaAtualId)) {
        showToast('Você já está inscrito nesta aula!', 'error');
        return;
    }
    
    // Verificar se está bloqueado
    if (usuario.bloqueado) {
        showToast('Você está bloqueado devido a faltas não justificadas', 'error');
        return;
    }
    
    const aula = window.mockData.aulasDetalhes[aulaAtualId];
    
    // Verificar vagas
    if (aula.vagas_ocupadas >= aula.vagas_totais) {
        showToast('Aula lotada! Você foi adicionado à lista de espera', 'error');
        return;
    }
    
    // Simular reserva
    usuario.inscricoes_ativas.push(aulaAtualId);
    showToast('✅ Aula reservada com sucesso!', 'success');
    closeAulaInfoModal();
}

// Agendamento Rápido
function carregarAulasDisponiveis() {
    const select = document.getElementById('aula-rapida-select');
    if (!select) return;
    
    const aulasDisponiveis = window.mockData.aulasDisponiveis || [];
    const usuario = window.mockData.usuarioLogado;
    
    select.innerHTML = '<option value="">Selecionar aula...</option>';
    
    aulasDisponiveis.forEach(aula => {
        const jaInscrito = usuario.inscricoes_ativas.includes(aula.id);
        const option = document.createElement('option');
        option.value = aula.id;
        option.textContent = `${aula.nome} - ${aula.horario_inicio} (${aula.vagas_disponiveis} vagas) ${jaInscrito ? '✓ Inscrito' : ''}`;
        option.disabled = jaInscrito || aula.vagas_disponiveis === 0;
        select.appendChild(option);
    });
    
    select.addEventListener('change', () => {
        const btn = document.getElementById('btn-agendar-rapido');
        btn.disabled = !select.value;
    });
}

function agendarAulaRapida() {
    const select = document.getElementById('aula-rapida-select');
    const aulaId = select.value;
    
    if (!aulaId) return;
    
    const usuario = window.mockData.usuarioLogado;
    const aula = window.mockData.aulasDisponiveis.find(a => a.id === aulaId);
    
    if (!aula) {
        showToast('Aula não encontrada', 'error');
        return;
    }
    
    if (usuario.bloqueado) {
        showToast('Você está bloqueado devido a faltas não justificadas', 'error');
        return;
    }
    
    if (usuario.inscricoes_ativas.includes(aulaId)) {
        showToast('Você já está inscrito nesta aula!', 'error');
        return;
    }
    
    if (aula.vagas_disponiveis === 0) {
        showToast('Esta aula não tem mais vagas disponíveis', 'error');
        return;
    }
    
    // Simular agendamento
    usuario.inscricoes_ativas.push(aulaId);
    aula.vagas_disponiveis--;
    
    showToast(`✅ Aula ${aula.nome} agendada com sucesso! Você receberá um lembrete 1h antes.`, 'success');
    
    // Recarregar lista
    carregarAulasDisponiveis();
    
    // Resetar seleção
    select.value = '';
    document.getElementById('btn-agendar-rapido').disabled = true;
}

// Penalidades
function carregarPenalidades() {
    const container = document.getElementById('penalidades-list');
    if (!container) return;
    
    const penalidades = window.mockData.penalidades || [];
    
    if (penalidades.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhuma penalidade ativa</p>';
        return;
    }
    
    container.innerHTML = penalidades.map(pen => {
        const bloqueado = pen.bloqueado;
        const badgeClass = bloqueado ? 'bloqueado' : 'alerta';
        const badgeText = bloqueado ? 
            `BLOQUEADO 🚫 - Liberação em ${pen.dias_restantes_bloqueio} dias` : 
            `Faltas ${pen.total_faltas}/2 ⚠️`;
        
        return `
            <div class="penalidade-card ${bloqueado ? 'bloqueado' : ''}">
                <div class="penalidade-usuario">
                    <div class="penalidade-avatar">${pen.usuario.avatar}</div>
                    <div class="penalidade-dados">
                        <h4>${pen.usuario.nome}</h4>
                        <div class="penalidade-status">
                            <span class="badge ${badgeClass}">${badgeText}</span>
                        </div>
                    </div>
                </div>
                <button class="btn-ver-detalhes" onclick="verDetalhesPenalidade(${pen.id})">
                    Ver Detalhes
                </button>
            </div>
        `;
    }).join('');
    
    // Atualizar contador
    const contador = document.getElementById('penalidades-contador');
    if (contador) {
        contador.textContent = `${penalidades.length} ${penalidades.length === 1 ? 'membro com penalidade ativa' : 'membros com penalidades ativas'}`;
    }
}

function verDetalhesPenalidade(penId) {
    const penalidade = window.mockData.penalidades.find(p => p.id === penId);
    if (!penalidade) return;
    
    // Criar modal dinamicamente
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'modal-detalhes-falta';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="fecharModalFalta()">&times;</span>
            <h3>Detalhes da Penalidade</h3>
            
            <div class="falta-mensagem">
                <p>${penalidade.usuario.nome} acumulou ${penalidade.total_faltas} falta(s) em 7 dias</p>
            </div>
            
            <div class="faltas-cards">
                ${penalidade.faltas.map((falta, idx) => `
                    <div class="falta-card">
                        <div class="falta-card-header">
                            <div>
                                <h4>${falta.aula}</h4>
                                <p><i class="fas fa-user"></i> ${falta.instrutor}</p>
                                <p><i class="fas fa-calendar"></i> ${new Date(falta.data).toLocaleDateString('pt-BR')}, ${falta.horario}</p>
                                <p><i class="fas fa-location-dot"></i> ${falta.sala}</p>
                            </div>
                            <span class="falta-tag">Falta confirmada</span>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <button class="btn-eliminar-falta" onclick="eliminarPenalidade(${penId})">
                <i class="fas fa-trash"></i> ELIMINAR FALTA
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function fecharModalFalta() {
    const modal = document.getElementById('modal-detalhes-falta');
    if (modal) {
        modal.remove();
    }
}

function eliminarPenalidade(penId) {
    const idx = window.mockData.penalidades.findIndex(p => p.id === penId);
    if (idx >= 0) {
        window.mockData.penalidades.splice(idx, 1);
        showToast('Penalidade eliminada com sucesso', 'success');
        fecharModalFalta();
        carregarPenalidades();
    }
}

function buscarPenalidades(termo) {
    const container = document.getElementById('penalidades-list');
    if (!container) return;
    
    const penalidades = window.mockData.penalidades || [];
    const filtradas = penalidades.filter(pen => 
        pen.usuario.nome.toLowerCase().includes(termo.toLowerCase())
    );
    
    if (filtradas.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhuma penalidade encontrada</p>';
        return;
    }
    
    // Renderizar penalidades filtradas (mesmo código da função carregarPenalidades)
    container.innerHTML = filtradas.map(pen => {
        const bloqueado = pen.bloqueado;
        const badgeClass = bloqueado ? 'bloqueado' : 'alerta';
        const badgeText = bloqueado ? 
            `BLOQUEADO 🚫 - Liberação em ${pen.dias_restantes_bloqueio} dias` : 
            `Faltas ${pen.total_faltas}/2 ⚠️`;
        
        return `
            <div class="penalidade-card ${bloqueado ? 'bloqueado' : ''}">
                <div class="penalidade-usuario">
                    <div class="penalidade-avatar">${pen.usuario.avatar}</div>
                    <div class="penalidade-dados">
                        <h4>${pen.usuario.nome}</h4>
                        <div class="penalidade-status">
                            <span class="badge ${badgeClass}">${badgeText}</span>
                        </div>
                    </div>
                </div>
                <button class="btn-ver-detalhes" onclick="verDetalhesPenalidade(${pen.id})">
                    Ver Detalhes
                </button>
            </div>
        `;
    }).join('');
}

// Filtros de Aulas
let filtrosAtivos = {
    aula: 'Todas',
    sala: 'Todas',
    instrutor: 'Todos'
};

function carregarFiltros() {
    const filtros = window.mockData.filtrosOpcoes;
    if (!filtros) return;
    
    // Carregar dropdown de aulas
    const selectAula = document.getElementById('filtro-aula');
    if (selectAula) {
        selectAula.innerHTML = filtros.aulas.map(aula => 
            `<option value="${aula}">${aula}</option>`
        ).join('');
    }
    
    // Carregar dropdown de salas
    const selectSala = document.getElementById('filtro-sala');
    if (selectSala) {
        selectSala.innerHTML = filtros.salas.map(sala => 
            `<option value="${sala}">${sala}</option>`
        ).join('');
    }
    
    // Carregar dropdown de instrutores
    const selectInstrutor = document.getElementById('filtro-instrutor');
    if (selectInstrutor) {
        selectInstrutor.innerHTML = filtros.instrutores.map(instrutor => 
            `<option value="${instrutor}">${instrutor}</option>`
        ).join('');
    }
}

function aplicarFiltros() {
    const selectAula = document.getElementById('filtro-aula');
    const selectSala = document.getElementById('filtro-sala');
    const selectInstrutor = document.getElementById('filtro-instrutor');
    
    if (!selectAula || !selectSala || !selectInstrutor) return;
    
    filtrosAtivos.aula = selectAula.value;
    filtrosAtivos.sala = selectSala.value;
    filtrosAtivos.instrutor = selectInstrutor.value;
    
    let resultado = [...window.mockData.todasAulas];
    
    if (filtrosAtivos.aula !== 'Todas') {
        resultado = resultado.filter(a => a.tipo === filtrosAtivos.aula);
    }
    if (filtrosAtivos.sala !== 'Todas') {
        resultado = resultado.filter(a => a.sala === filtrosAtivos.sala);
    }
    if (filtrosAtivos.instrutor !== 'Todos') {
        resultado = resultado.filter(a => a.instrutor === filtrosAtivos.instrutor);
    }
    
    // Atualizar contador
    const contador = document.getElementById('resultado-contador');
    if (contador) {
        contador.textContent = `Exibindo ${resultado.length} ${resultado.length === 1 ? 'aula' : 'aulas'}`;
    }
    
    // Aqui você pode atualizar a visualização do calendário com as aulas filtradas
    // Por exemplo, renderizando apenas as aulas que passaram no filtro
    showToast(`Filtros aplicados: ${resultado.length} aulas encontradas`, 'success');
}

function limparFiltros() {
    const selectAula = document.getElementById('filtro-aula');
    const selectSala = document.getElementById('filtro-sala');
    const selectInstrutor = document.getElementById('filtro-instrutor');
    
    if (selectAula) selectAula.value = 'Todas';
    if (selectSala) selectSala.value = 'Todas';
    if (selectInstrutor) selectInstrutor.value = 'Todos';
    
    filtrosAtivos = {
        aula: 'Todas',
        sala: 'Todas',
        instrutor: 'Todos'
    };
    
    aplicarFiltros();
}

// Inicialização das novas funcionalidades
function initPlanejadorAprimorado() {
    // Carregar aulas disponíveis para agendamento rápido
    carregarAulasDisponiveis();
    
    // Carregar filtros se existirem
    if (document.getElementById('filtro-aula')) {
        carregarFiltros();
    }
    
    // Carregar penalidades se existirem
    if (document.getElementById('penalidades-list')) {
        carregarPenalidades();
    }
    
    // Adicionar event listener para busca de penalidades
    const buscaPenalidades = document.getElementById('busca-penalidades');
    if (buscaPenalidades) {
        buscaPenalidades.addEventListener('input', (e) => {
            buscarPenalidades(e.target.value);
        });
    }
    
    // Adicionar event listeners para filtros
    const filtroAula = document.getElementById('filtro-aula');
    const filtroSala = document.getElementById('filtro-sala');
    const filtroInstrutor = document.getElementById('filtro-instrutor');
    
    if (filtroAula) filtroAula.addEventListener('change', aplicarFiltros);
    if (filtroSala) filtroSala.addEventListener('change', aplicarFiltros);
    if (filtroInstrutor) filtroInstrutor.addEventListener('change', aplicarFiltros);
}

// Chamar inicialização quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPlanejadorAprimorado);
} else {
    initPlanejadorAprimorado();
}

// Controle de Tabs de Reserva
function switchReservaTab(tab, event) {
    // Remover active de todos os botões
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => btn.classList.remove('active'));
    
    // Adicionar active ao botão clicado
    if (event) {
        event.currentTarget.classList.add('active');
    }
    
    // Esconder todos os conteúdos de tab
    const tabContents = document.querySelectorAll('.reserva-tab-content');
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Mostrar o conteúdo da tab selecionada
    const selectedTab = document.getElementById(`reserva-tab-${tab}`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Se for tab de penalidades, carregar dados
    if (tab === 'penalidades') {
        carregarPenalidades();
    }
}

// Toggle dos filtros
function toggleFiltrosReservas() {
    const filtrosContainer = document.getElementById('filtros-reservas');
    if (!filtrosContainer) return;
    
    if (filtrosContainer.style.display === 'none' || filtrosContainer.style.display === '') {
        filtrosContainer.style.display = 'flex';
        carregarFiltros(); // Carregar opções dos filtros
    } else {
        filtrosContainer.style.display = 'none';
    }
}

// Funções de navegação do calendário já estão conectadas via onclick no HTML
