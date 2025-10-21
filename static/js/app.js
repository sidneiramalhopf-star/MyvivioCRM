const API_BASE = '';
let currentUser = null;
let authToken = null;
let currentPage = 'home';

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
    addToggleButtonToHeaders();
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
        content.style.display = 'none'; // Força esconder todas
    });
    
    const pageElement = document.getElementById(`page-${page}`);
    if (pageElement) {
        pageElement.classList.add('active');
        pageElement.style.display = 'block'; // Força mostrar a página ativa
        
        // Atualizar sidebar unificada
        updateUnifiedSidebar(page);
        
        // Adicionar botão toggle ao header da página
        setTimeout(() => addToggleButtonToHeaders(), 50);
        
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
        content.style.display = 'none'; // Força esconder todas
    });
    
    const pageElement = document.getElementById(`page-${page}`);
    if (pageElement) {
        pageElement.classList.add('active');
        pageElement.style.display = 'block'; // Força mostrar a página ativa
        
        // Atualizar sidebar unificada
        updateUnifiedSidebar(page);
        
        // Adicionar botão toggle ao header da página
        setTimeout(() => addToggleButtonToHeaders(), 50);
        
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

// Trocar entre visualizações de Treinamento
function switchTreinamentoView(view, evt) {
    // Remove active de todos os botões da sidebar unificada
    document.querySelectorAll('.unified-menu-item').forEach(btn => btn.classList.remove('active'));
    
    // Ativa o botão clicado (se houver evento)
    if (evt) {
        evt.target.closest('.unified-menu-item').classList.add('active');
    }
    
    // Por enquanto, apenas carrega programas (pode ser expandido no futuro)
    if (view === 'programas') {
        loadProgramas();
    }
}

async function loadProgramas() {
    // Carregar programas do localStorage (criados localmente)
    const programasLocais = JSON.parse(localStorage.getItem('programas') || '[]');
    
    // Se houver autenticação, tentar carregar da API também
    if (authToken) {
        try {
            const response = await fetch(`${API_BASE}/programas`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            if (response.ok) {
                const programasAPI = await response.json();
                // Combinar programas da API com programas locais
                const todosProgramas = [...programasAPI, ...programasLocais];
                displayProgramas(todosProgramas);
                return;
            }
        } catch (error) {
            console.error('Erro ao carregar programas da API', error);
        }
    }
    
    // Se não houver autenticação ou a API falhou, mostrar apenas programas locais
    displayProgramas(programasLocais);
}

function displayProgramas(programas) {
    const container = document.getElementById('programs-grid');
    
    if (!programas || programas.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-dumbbell"></i>
                <p>Nenhum programa criado ainda</p>
                <p class="empty-hint">Clique em "Novo Programa" para começar</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = programas.map(prog => {
        // Programa da API (tem status e usuarios_matriculados)
        if (prog.status) {
            return `
                <div class="program-card status-${prog.status}">
                    <h4>${prog.nome}</h4>
                    <p class="program-status">Status: ${prog.status}</p>
                    <p class="program-usuarios">👥 ${prog.usuarios_matriculados || 0} matriculados</p>
                </div>
            `;
        }
        
        // Programa local (tem exercicios e dataCriacao)
        const numExercicios = prog.exercicios?.length || 0;
        const data = prog.dataCriacao ? new Date(prog.dataCriacao).toLocaleDateString('pt-BR') : 'Sem data';
        
        return `
            <div class="programa-card">
                <div class="programa-header">
                    <h3>${prog.nome}</h3>
                    <button class="btn-menu"><i class="fas fa-ellipsis-vertical"></i></button>
                </div>
                <div class="programa-info">
                    <span><i class="fas fa-list"></i> ${numExercicios} exercício${numExercicios !== 1 ? 's' : ''}</span>
                    <span><i class="fas fa-calendar"></i> ${data}</span>
                </div>
                <div class="programa-tags">
                    <span class="tag">${prog.tipoObjetivo || 'Sem categoria'}</span>
                    <span class="tag">${prog.objetivo || 'Geral'}</span>
                </div>
            </div>
        `;
    }).join('');
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
let unifiedSidebarCollapsed = false;

// ============================================
// UNIFIED SIDEBAR - Controle Dinâmico
// ============================================

// Configuração do conteúdo da sidebar para cada página
const sidebarConfigs = {
    planejador: {
        title: 'Planejador',
        items: [
            { id: 'calendario', icon: 'fa-calendar', label: 'Calendário', action: 'switchPlannerView' },
            { id: 'aulas-andamento', icon: 'fa-list', label: 'Aulas em Andamento', action: 'switchPlannerView' },
            { id: 'agendamento', icon: 'fa-calendar-plus', label: 'Agendamento de Aulas', action: 'switchPlannerView' }
        ]
    },
    pessoas: {
        title: 'Pessoas',
        items: [
            { id: 'contatos', icon: 'fa-address-book', label: 'Contatos', action: 'abrirPessoasTab' },
            { id: 'equipe', icon: 'fa-users', label: 'Membros da equipe', action: 'abrirPessoasTab' },
            { id: 'suporte', icon: 'fa-headset', label: 'Suporte Vivio', action: 'abrirPessoasTab' }
        ]
    },
    treinamento: {
        title: 'Treinamento',
        items: [
            { id: 'programas', icon: 'fa-dumbbell', label: 'Programas', action: 'switchTreinamentoView' },
            { id: 'exercicios', icon: 'fa-running', label: 'Exercícios', action: 'switchTreinamentoView' }
        ]
    }
};

// Posicionar dinamicamente o botão da sidebar colapsada/hidden no page-header
function positionSidebarButton() {
    const sidebar = document.getElementById('unified-sidebar');
    const sidebarToggle = document.getElementById('unified-sidebar-toggle');
    
    if (!sidebar || !sidebarToggle) return;
    
    // Verificar se a sidebar está colapsada ou hidden
    const isCollapsed = sidebar.classList.contains('collapsed') || sidebar.classList.contains('hidden');
    
    if (isCollapsed) {
        // Encontrar o page-header ativo
        const pageHeader = document.querySelector('.page-content.active .page-header');
        
        if (pageHeader) {
            // Mover o botão para dentro do page-header
            if (!pageHeader.contains(sidebarToggle)) {
                pageHeader.appendChild(sidebarToggle);
            }
        }
    }
}

// Adicionar listeners para manter o posicionamento atualizado
let positionDebounceTimer;
function updateSidebarPosition() {
    clearTimeout(positionDebounceTimer);
    positionDebounceTimer = setTimeout(() => {
        positionSidebarButton();
    }, 50);
}

// Inicializar listeners quando o DOM estiver carregado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.addEventListener('resize', updateSidebarPosition);
        window.addEventListener('orientationchange', updateSidebarPosition);
        window.addEventListener('scroll', updateSidebarPosition, { passive: true });
    });
} else {
    window.addEventListener('resize', updateSidebarPosition);
    window.addEventListener('orientationchange', updateSidebarPosition);
    window.addEventListener('scroll', updateSidebarPosition, { passive: true });
}

// Atualizar conteúdo da sidebar unificada baseado na página (estilo Technogym)
function updateUnifiedSidebar(page) {
    const sidebar = document.getElementById('unified-sidebar');
    const sidebarContent = document.getElementById('unified-sidebar-content');
    const toggleIcon = document.getElementById('sidebar-toggle-icon-circle');
    
    if (!sidebar || !sidebarContent) return;
    
    // Verificar se a página tem configuração de sidebar
    const config = sidebarConfigs[page];
    
    if (config) {
        // Mostrar sidebar colapsada inicialmente
        sidebar.classList.remove('hidden');
        sidebar.classList.add('collapsed');
        unifiedSidebarCollapsed = true;
        
        // Atualizar ícone para chevron-right (aponta para direita quando fechada)
        if (toggleIcon) {
            toggleIcon.className = 'fas fa-chevron-right';
        }
        
        // Construir HTML do conteúdo
        let html = `
            <div class="unified-sidebar-header">
                <h3>${config.title}</h3>
            </div>
        `;
        
        config.items.forEach((item, index) => {
            const activeClass = index === 0 ? 'active' : '';
            html += `
                <button class="unified-menu-item ${activeClass}" onclick="${item.action}('${item.id}', event)">
                    <i class="fas ${item.icon}"></i>
                    <span>${item.label}</span>
                </button>
            `;
        });
        
        sidebarContent.innerHTML = html;
    } else {
        // Ocultar sidebar completamente para páginas sem configuração
        sidebar.classList.add('hidden');
    }
}

// Toggle da sidebar unificada (estilo Technogym - sidebar no meio)
function toggleUnifiedSidebar() {
    const sidebar = document.getElementById('unified-sidebar');
    const toggleIcon = document.getElementById('sidebar-toggle-icon-circle');
    
    if (!sidebar || !toggleIcon) return;
    
    // Se está hidden, não fazer nada (sidebar escondida em páginas sem subtabs)
    if (sidebar.classList.contains('hidden')) {
        return;
    }
    
    // Alterna entre collapsed e expandida
    unifiedSidebarCollapsed = !unifiedSidebarCollapsed;
    
    if (unifiedSidebarCollapsed) {
        sidebar.classList.add('collapsed');
        toggleIcon.className = 'fas fa-chevron-right';
    } else {
        sidebar.classList.remove('collapsed');
        toggleIcon.className = 'fas fa-chevron-left';
    }
}

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
    // Remove active de todos os botões da sidebar unificada
    document.querySelectorAll('.unified-menu-item').forEach(btn => btn.classList.remove('active'));
    
    // Remove active de todas as views
    document.querySelectorAll('.planner-view').forEach(v => v.classList.remove('active'));
    
    // Ativa o botão clicado (se houver evento)
    if (evt) {
        evt.target.closest('.unified-menu-item').classList.add('active');
    } else {
        // Se não houver evento, ativa o botão correspondente
        const button = document.querySelector(`.unified-menu-item[onclick*="${view}"]`);
        if (button) button.classList.add('active');
    }
    
    // Ativa a view correspondente
    document.getElementById(`planner-${view}`).classList.add('active');
    
    // Carregar dados específicos
    if (view === 'calendario') {
        renderCalendar();
    } else if (view === 'aulas-andamento') {
        renderCalendarioSemanalAulas();
    } else if (view === 'agendamento') {
        renderCalendarioAgendamento24h();
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

// ===== FUNÇÕES ANTIGAS REMOVIDAS =====
// renderWeekCalendar e renderAgendamentoList foram substituídas pelas novas funções
// renderAulasEmAndamento e renderCalendarioAgendamento24h

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

// Funções antigas removidas - agora usamos renderAulasEmAndamento e renderCalendarioAgendamento24h

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

// ===== AULAS EM ANDAMENTO =====

function renderAulasEmAndamento() {
    const container = document.getElementById('aulas-andamento-list');
    if (!container || !window.mockData) return;
    
    const aulas = window.mockData.aulasSemanais || [];
    const hoje = new Date();
    const hojeStr = formatarDataLocal(hoje);
    
    // Filtrar apenas aulas de hoje ou futuras
    const aulasAtivas = aulas.filter(aula => aula.data >= hojeStr);
    
    if (aulasAtivas.length === 0) {
        container.innerHTML = `
            <div class="aulas-empty-state">
                <i class="fas fa-calendar-xmark"></i>
                <h3>Nenhuma aula em andamento</h3>
                <p>Não há aulas agendadas no momento</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = aulasAtivas.map(aula => {
        const percentual = Math.round((aula.inscritos / aula.capacidade) * 100);
        const status = aula.data === hojeStr ? 'ativa' : 'agendada';
        const tipoData = window.mockData.tiposAula.find(t => t.tipo === aula.tipo);
        const cor = tipoData ? tipoData.cor : '#62b1ca';
        
        return `
            <div class="aula-card" onclick="abrirModalAula('editar', '${aula.id}')">
                <div class="aula-card-header">
                    <div class="aula-card-tipo" style="color: ${cor}">${aula.tipo}</div>
                    <div class="aula-card-status ${status}">${status === 'ativa' ? 'Hoje' : 'Agendada'}</div>
                </div>
                <div class="aula-card-info">
                    <div class="aula-card-info-item">
                        <i class="fas fa-clock"></i>
                        <span>${aula.horario_inicio} - ${aula.horario_fim}</span>
                    </div>
                    <div class="aula-card-info-item">
                        <i class="fas fa-calendar"></i>
                        <span>${formatarDataBR(aula.data)}</span>
                    </div>
                    <div class="aula-card-info-item">
                        <i class="fas fa-user"></i>
                        <span>${aula.instrutor}</span>
                    </div>
                    <div class="aula-card-info-item">
                        <i class="fas fa-door-open"></i>
                        <span>${aula.sala}</span>
                    </div>
                </div>
                <div class="aula-card-capacidade">
                    <div class="aula-card-capacidade-texto">Ocupação</div>
                    <div class="aula-card-capacidade-numeros">
                        ${aula.inscritos}<span>/${aula.capacidade}</span>
                    </div>
                </div>
                <div class="aula-card-progress">
                    <div class="aula-card-progress-bar" style="width: ${percentual}%; background: ${cor}"></div>
                </div>
            </div>
        `;
    }).join('');
}

function formatarDataBR(dataStr) {
    const [ano, mes, dia] = dataStr.split('-');
    return `${dia}/${mes}/${ano}`;
}

// ===== AGENDAMENTO DE AULAS - GRID 24H =====

let semanaAgendamento = new Date();

function renderCalendarioAgendamento24h() {
    const grid = document.getElementById('calendario-grid-agendamento');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    const horarios24h = [];
    for (let h = 0; h < 24; h++) {
        horarios24h.push(`${String(h).padStart(2, '0')}:00`);
    }
    
    const inicio = getStartOfWeek(semanaAgendamento);
    atualizarHeaderAgendamento(inicio);
    
    // Para cada horário
    horarios24h.forEach(horario => {
        // Coluna de hora
        const horaDiv = document.createElement('div');
        horaDiv.className = 'hora-celula';
        horaDiv.textContent = horario;
        grid.appendChild(horaDiv);
        
        // 7 colunas de dias
        for (let dia = 0; dia < 7; dia++) {
            const dataCelula = new Date(inicio);
            dataCelula.setDate(inicio.getDate() + dia);
            const dataFormatada = formatarDataLocal(dataCelula);
            
            const celulaDiv = document.createElement('div');
            celulaDiv.className = 'dia-celula';
            celulaDiv.dataset.dia = dia;
            celulaDiv.dataset.horario = horario;
            celulaDiv.dataset.date = dataFormatada;
            celulaDiv.onclick = () => clicarCelulaAgendamento(dia, horario, dataFormatada);
            grid.appendChild(celulaDiv);
        }
    });
    
    renderAulasAgendamento();
}

function atualizarHeaderAgendamento(inicio) {
    const fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 6);
    
    const mesInicio = inicio.toLocaleDateString('pt-BR', { month: 'long' });
    const mesFim = fim.toLocaleDateString('pt-BR', { month: 'long' });
    const ano = inicio.getFullYear();
    
    const textoSemana = mesInicio === mesFim 
        ? `${inicio.getDate()}-${fim.getDate()} ${mesInicio} ${ano}`
        : `${inicio.getDate()} ${mesInicio} - ${fim.getDate()} ${mesFim} ${ano}`;
    
    const headerEl = document.getElementById('semana-agendamento');
    if (headerEl) headerEl.textContent = textoSemana;
    
    // Atualizar números dos dias
    for (let i = 0; i < 7; i++) {
        const data = new Date(inicio);
        data.setDate(inicio.getDate() + i);
        const el = document.getElementById(`dia-agend-${i}`);
        if (el) el.textContent = data.getDate();
    }
}

function renderAulasAgendamento() {
    if (!window.mockData || !window.mockData.aulasSemanais) return;
    
    const inicio = getStartOfWeek(semanaAgendamento);
    const fim = getEndOfWeek(semanaAgendamento);
    
    const inicioStr = formatarDataLocal(inicio);
    const fimStr = formatarDataLocal(fim);
    
    const aulas = window.mockData.aulasSemanais.filter(aula => {
        return aula.data >= inicioStr && aula.data <= fimStr;
    });
    
    // Limpar blocos antigos
    document.querySelectorAll('.aula-bloco').forEach(bloco => bloco.remove());
    
    aulas.forEach(aula => {
        const tipoData = window.mockData.tiposAula.find(t => t.tipo === aula.tipo);
        const cor = tipoData ? tipoData.cor : '#62b1ca';
        
        const celula = document.querySelector(
            `.dia-celula[data-date="${aula.data}"][data-horario="${aula.horario_inicio}"]`
        );
        
        if (celula) {
            const blocoDiv = document.createElement('div');
            blocoDiv.className = 'aula-bloco';
            blocoDiv.style.background = `linear-gradient(135deg, ${cor} 0%, ${cor}dd 100%)`;
            blocoDiv.onclick = (e) => {
                e.stopPropagation();
                abrirModalAulaAgendamento('editar', aula.id);
            };
            
            blocoDiv.innerHTML = `
                <div>
                    <div class="aula-bloco-tipo">${aula.tipo}</div>
                    <div class="aula-bloco-horario">${aula.horario_inicio} - ${aula.horario_fim}</div>
                </div>
                <div>
                    <div class="aula-bloco-instrutor">${aula.instrutor}</div>
                    <div class="aula-bloco-capacidade">
                        <i class="fas fa-users"></i> ${aula.inscritos}/${aula.capacidade}
                    </div>
                </div>
            `;
            
            celula.appendChild(blocoDiv);
        }
    });
}

function clicarCelulaAgendamento(dia, horario, data) {
    console.log('Criar aula:', {dia, horario, data});
    abrirModalAulaAgendamento('criar', null, {data, horario});
}

function previousWeekAgendamento() {
    semanaAgendamento.setDate(semanaAgendamento.getDate() - 7);
    renderCalendarioAgendamento24h();
}

function nextWeekAgendamento() {
    semanaAgendamento.setDate(semanaAgendamento.getDate() + 7);
    renderCalendarioAgendamento24h();
}

function goToTodayAgendamento() {
    semanaAgendamento = new Date();
    renderCalendarioAgendamento24h();
}

function toggleFiltrosAgendamento() {
    const filtros = document.getElementById('filtros-agendamento');
    if (filtros) {
        filtros.style.display = filtros.style.display === 'none' ? 'flex' : 'none';
    }
}

function limparFiltrosAgendamento() {
    document.getElementById('filtro-tipo-agendamento').value = 'Todos';
    document.getElementById('filtro-sala-agendamento').value = 'Todas';
    document.getElementById('filtro-instrutor-agendamento').value = 'Todos';
    renderAulasAgendamento();
}

function abrirModalAulaAgendamento(modo, aulaId = null, dadosIniciais = null) {
    // Reutilizar modal existente ou criar novo
    abrirModalAula(modo, aulaId, dadosIniciais);
}

// ===== CALENDÁRIO SEMANAL =====

let semanaAtual = new Date(); // Controla a semana sendo visualizada
let aulasSemanaisCache = []; // Cache das aulas da semana

// Formatar data local como YYYY-MM-DD (sem problemas de fuso horário)
function formatarDataLocal(date) {
    const ano = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

// Renderizar o Calendário Semanal
function renderCalendarioSemanal() {
    const grid = document.getElementById('calendario-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    const horarios = window.mockData.horariosDisponiveis;
    const inicio = getStartOfWeek(semanaAtual);
    
    // Para cada horário
    horarios.forEach(horario => {
        // Coluna de hora
        const horaDiv = document.createElement('div');
        horaDiv.className = 'hora-celula';
        horaDiv.textContent = horario;
        grid.appendChild(horaDiv);
        
        // 7 colunas de dias
        for (let dia = 0; dia < 7; dia++) {
            const dataCelula = new Date(inicio);
            dataCelula.setDate(inicio.getDate() + dia);
            const dataFormatada = formatarDataLocal(dataCelula);
            
            const celulaDiv = document.createElement('div');
            celulaDiv.className = 'dia-celula';
            celulaDiv.dataset.dia = dia;
            celulaDiv.dataset.horario = horario;
            celulaDiv.dataset.date = dataFormatada; // Adicionar data real
            celulaDiv.onclick = () => clicarCelulaSemanal(dia, horario, dataFormatada);
            grid.appendChild(celulaDiv);
        }
    });
    
    // Renderizar as aulas
    renderAulasSemanais();
}

// Renderizar as aulas no grid
function renderAulasSemanais() {
    if (!window.mockData || !window.mockData.aulasSemanais) return;
    
    const inicio = getStartOfWeek(semanaAtual);
    const fim = getEndOfWeek(semanaAtual);
    
    // Formatar datas para comparação (YYYY-MM-DD) usando data local
    const inicioStr = formatarDataLocal(inicio);
    const fimStr = formatarDataLocal(fim);
    
    // Filtrar aulas da semana atual (comparar strings de data)
    const aulas = window.mockData.aulasSemanais.filter(aula => {
        return aula.data >= inicioStr && aula.data <= fimStr;
    });
    
    aulasSemanaisCache = [...aulas];
    
    // Limpar aulas antigas
    document.querySelectorAll('.aula-bloco').forEach(bloco => bloco.remove());
    
    aulas.forEach(aula => {
        // Buscar célula pela data real, não apenas dia da semana
        const celula = document.querySelector(`.dia-celula[data-date="${aula.data}"][data-horario="${aula.horario_inicio}"]`);
        if (!celula) return;
        
        const tipoAula = window.mockData.tiposAula.find(t => t.nome === aula.tipo);
        const cor = tipoAula ? tipoAula.cor : '#62b1ca';
        
        const blocoDiv = document.createElement('div');
        blocoDiv.className = 'aula-bloco';
        blocoDiv.style.background = `linear-gradient(135deg, ${cor} 0%, ${adjustColor(cor, -20)} 100%)`;
        blocoDiv.onclick = (e) => {
            e.stopPropagation();
            clicarAulaSemanal(aula.id);
        };
        
        const percentual = Math.round((aula.inscritos / aula.capacidade) * 100);
        
        blocoDiv.innerHTML = `
            <div>
                <div class="aula-bloco-tipo">${aula.tipo}</div>
                <div class="aula-bloco-horario">${aula.horario_inicio} - ${aula.horario_fim}</div>
            </div>
            <div>
                <div class="aula-bloco-instrutor"><i class="fas fa-user"></i> ${aula.instrutor}</div>
                <div class="aula-bloco-capacidade"><i class="fas fa-users"></i> ${aula.inscritos}/${aula.capacidade} (${percentual}%)</div>
            </div>
        `;
        
        celula.appendChild(blocoDiv);
    });
}

// Ajustar cor (para gradiente)
function adjustColor(color, amount) {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

// Atualizar header da semana
function atualizarHeaderSemana() {
    const inicio = getStartOfWeek(semanaAtual);
    const fim = getEndOfWeek(semanaAtual);
    
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    const textoSemana = `${inicio.getDate()}-${fim.getDate()} ${meses[inicio.getMonth()]} ${inicio.getFullYear()}`;
    
    const semanaAtualEl = document.getElementById('semana-atual');
    if (semanaAtualEl) {
        semanaAtualEl.textContent = textoSemana;
    }
    
    // Atualizar números dos dias no header
    for (let i = 0; i < 7; i++) {
        const data = new Date(inicio);
        data.setDate(inicio.getDate() + i);
        const diaEl = document.getElementById(`dia-${i}`);
        if (diaEl) {
            diaEl.textContent = data.getDate();
        }
    }
}

// Obter início da semana
function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? 0 : -day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

// Obter fim da semana
function getEndOfWeek(date) {
    const start = getStartOfWeek(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return end;
}

// Navegação de semanas
function previousWeekSemanal() {
    semanaAtual.setDate(semanaAtual.getDate() - 7);
    atualizarHeaderSemana();
    renderCalendarioSemanal();
}

function nextWeekSemanal() {
    semanaAtual.setDate(semanaAtual.getDate() + 7);
    atualizarHeaderSemana();
    renderCalendarioSemanal();
}

function goToTodaySemanal() {
    semanaAtual = new Date();
    atualizarHeaderSemana();
    renderCalendarioSemanal();
}

// Clique em célula vazia (criar aula)
function clicarCelulaSemanal(dia, horario, dataFormatada) {
    // Abrir modal de criação com data e horário pré-preenchidos
    abrirModalAula('criar', { data: dataFormatada, horario_inicio: horario });
}

// Clique em aula (editar)
function clicarAulaSemanal(aulaId) {
    const aula = aulasSemanaisCache.find(a => a.id === aulaId);
    if (!aula) return;
    
    abrirModalAula('editar', aula);
}

// Inicializar calendário semanal quando estiver na página
function initCalendarioSemanal() {
    const calendarioGrid = document.getElementById('calendario-grid');
    if (calendarioGrid) {
        atualizarHeaderSemana();
        renderCalendarioSemanal();
    }
}

// Chamar quando mudar para página de reservas
const originalSwitchPlannerView = window.switchPlannerView;
window.switchPlannerView = function(view, event) {
    if (originalSwitchPlannerView) {
        originalSwitchPlannerView(view, event);
    }
    
    if (view === 'reservas') {
        setTimeout(() => {
            initCalendarioSemanal();
        }, 100);
    }
};

// ===== MODAL GRANDE DE AULA =====

let aulaEditando = null; // Armazena a aula sendo editada

// Abrir modal de aula
function abrirModalAula(modo, dados = {}) {
    const modal = document.getElementById('modal-aula');
    const titulo = document.getElementById('modal-aula-titulo');
    const btnDeletar = document.getElementById('btn-deletar-aula');
    const btnSalvarTexto = document.getElementById('btn-salvar-texto');
    
    if (!modal) return;
    
    aulaEditando = modo === 'editar' ? dados : null;
    
    const btnCancelarAula = document.getElementById('btn-cancelar-aula-completa');
    
    // Configurar modal
    if (modo === 'criar') {
        titulo.textContent = 'Nova Aula';
        btnDeletar.style.display = 'none';
        btnCancelarAula.style.display = 'none';
        btnSalvarTexto.textContent = 'CRIAR';
        limparFormularioAula();
        
        // Pré-preencher data e hora se fornecidos
        if (dados.data) document.getElementById('modal-data').value = dados.data;
        if (dados.horario_inicio) document.getElementById('modal-hora-inicio').value = dados.horario_inicio;
    } else {
        titulo.textContent = 'Editar Aula';
        btnDeletar.style.display = 'inline-block';
        btnCancelarAula.style.display = 'inline-block';
        btnSalvarTexto.textContent = 'SALVAR';
        preencherFormularioAula(dados);
        
        // Renderizar participantes e atualizar ocupação
        renderParticipantes();
        atualizarOcupacao();
    }
    
    // Carregar opções dos dropdowns
    carregarOpcoesModalAula();
    carregarAlunosSelect();
    
    modal.style.display = 'flex';
}

// Fechar modal
function closeModalAula() {
    const modal = document.getElementById('modal-aula');
    if (modal) {
        modal.style.display = 'none';
        aulaEditando = null;
    }
}

// Navegar entre seções do modal
function navegarSecaoModal(secao, event) {
    // Remover active de todos os nav-items
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    
    // Adicionar active ao clicado
    if (event) {
        event.currentTarget.classList.add('active');
    }
    
    // Esconder todas as seções
    document.querySelectorAll('.modal-section').forEach(section => section.classList.remove('active'));
    
    // Mostrar seção selecionada
    const sectionEl = document.getElementById(`section-${secao}`);
    if (sectionEl) {
        sectionEl.classList.add('active');
    }
}

// Carregar opções dos dropdowns
function carregarOpcoesModalAula() {
    if (!window.mockData) return;
    
    // Tipos de aula
    const selectTipo = document.getElementById('modal-tipo-aula');
    if (selectTipo && window.mockData.tiposAula) {
        selectTipo.innerHTML = '<option value="">Selecione o tipo de aula...</option>';
        window.mockData.tiposAula.forEach(tipo => {
            const opt = document.createElement('option');
            opt.value = tipo.nome;
            opt.textContent = tipo.nome;
            selectTipo.appendChild(opt);
        });
    }
    
    // Instrutores
    const selectInstrutor = document.getElementById('modal-instrutor');
    if (selectInstrutor && window.mockData.instrutores) {
        selectInstrutor.innerHTML = '<option value="">Selecione o instrutor...</option>';
        window.mockData.instrutores.forEach(instrutor => {
            const opt = document.createElement('option');
            opt.value = instrutor.nome;
            opt.textContent = instrutor.nome;
            selectInstrutor.appendChild(opt);
        });
    }
    
    // Modos
    const selectModo = document.getElementById('modal-modo');
    if (selectModo && window.mockData.modosAula) {
        selectModo.innerHTML = '<option value="">Selecione o modo...</option>';
        window.mockData.modosAula.forEach(modo => {
            const opt = document.createElement('option');
            opt.value = modo.nome;
            opt.textContent = `${modo.nome} - ${modo.descricao}`;
            selectModo.appendChild(opt);
        });
    }
    
    // Salas
    const selectSala = document.getElementById('modal-sala');
    if (selectSala && window.mockData.salas) {
        selectSala.innerHTML = '<option value="">Selecione a sala...</option>';
        window.mockData.salas.forEach(sala => {
            const opt = document.createElement('option');
            opt.value = sala.nome;
            opt.textContent = `${sala.nome} (${sala.capacidade} pessoas)`;
            selectSala.appendChild(opt);
        });
    }
}

// Limpar formulário
function limparFormularioAula() {
    document.getElementById('modal-tipo-aula').value = '';
    document.getElementById('modal-instrutor').value = '';
    document.getElementById('modal-modo').value = '';
    document.getElementById('modal-sala').value = '';
    document.getElementById('modal-data').value = '';
    document.getElementById('modal-hora-inicio').value = '';
    document.getElementById('modal-hora-fim').value = '';
    document.getElementById('modal-recorrente').checked = false;
    document.getElementById('modal-capacidade-min').value = '1';
    document.getElementById('modal-capacidade-max').value = '20';
    document.getElementById('modal-lista-espera').checked = false;
    document.getElementById('modal-descricao').value = '';
    document.getElementById('modal-observacoes').value = '';
}

// Preencher formulário com dados da aula
function preencherFormularioAula(aula) {
    document.getElementById('modal-tipo-aula').value = aula.tipo || '';
    document.getElementById('modal-instrutor').value = aula.instrutor || '';
    document.getElementById('modal-modo').value = aula.modo || '';
    document.getElementById('modal-sala').value = aula.sala || '';
    document.getElementById('modal-data').value = aula.data || '';
    document.getElementById('modal-hora-inicio').value = aula.horario_inicio || '';
    document.getElementById('modal-hora-fim').value = aula.horario_fim || '';
    document.getElementById('modal-recorrente').checked = aula.recorrente || false;
    document.getElementById('modal-capacidade-max').value = aula.capacidade || '20';
}

// Salvar aula (criar ou editar)
function salvarAula() {
    const dados = {
        tipo: document.getElementById('modal-tipo-aula').value,
        instrutor: document.getElementById('modal-instrutor').value,
        modo: document.getElementById('modal-modo').value,
        sala: document.getElementById('modal-sala').value,
        data: document.getElementById('modal-data').value,
        horario_inicio: document.getElementById('modal-hora-inicio').value,
        horario_fim: document.getElementById('modal-hora-fim').value,
        recorrente: document.getElementById('modal-recorrente').checked,
        capacidade: parseInt(document.getElementById('modal-capacidade-max').value),
        inscritos: aulaEditando ? aulaEditando.inscritos : 0
    };
    
    // Validações básicas
    if (!dados.tipo || !dados.instrutor || !dados.sala || !dados.data || !dados.horario_inicio || !dados.horario_fim) {
        showToast('Preencha todos os campos obrigatórios', 'error');
        return;
    }
    
    if (aulaEditando) {
        // Editar aula existente
        const index = aulasSemanaisCache.findIndex(a => a.id === aulaEditando.id);
        if (index !== -1) {
            aulasSemanaisCache[index] = { ...aulaEditando, ...dados };
            window.mockData.aulasSemanais = [...aulasSemanaisCache];
            showToast('Aula atualizada com sucesso!', 'success');
        }
    } else {
        // Criar nova aula
        const novaAula = {
            id: `sem_${Date.now()}`,
            ...dados,
            dia_semana: new Date(dados.data).getDay()
        };
        aulasSemanaisCache.push(novaAula);
        window.mockData.aulasSemanais = [...aulasSemanaisCache];
        showToast('Aula criada com sucesso!', 'success');
    }
    
    renderAulasSemanais();
    closeModalAula();
}

// Deletar aula
function deletarAula() {
    if (!aulaEditando) return;
    
    if (confirm(`Tem certeza que deseja deletar a aula de ${aulaEditando.tipo}?`)) {
        aulasSemanaisCache = aulasSemanaisCache.filter(a => a.id !== aulaEditando.id);
        window.mockData.aulasSemanais = [...aulasSemanaisCache];
        
        showToast('Aula deletada com sucesso!', 'success');
        renderAulasSemanais();
        closeModalAula();
    }
}

// Funções placeholder para adicionar novos itens
function adicionarTipoAula() {
    const tipo = prompt('Digite o nome do novo tipo de aula:');
    if (tipo) {
        showToast(`Tipo "${tipo}" será adicionado (conectar com backend)`, 'info');
    }
}

function adicionarInstrutor() {
    const nome = prompt('Digite o nome do novo instrutor:');
    if (nome) {
        showToast(`Instrutor "${nome}" será adicionado (conectar com backend)`, 'info');
    }
}

function adicionarModo() {
    const modo = prompt('Digite o nome do novo modo:');
    if (modo) {
        showToast(`Modo "${modo}" será adicionado (conectar com backend)`, 'info');
    }
}

function adicionarSala() {
    const sala = prompt('Digite o nome da nova sala:');
    if (sala) {
        showToast(`Sala "${sala}" será adicionada (conectar com backend)`, 'info');
    }
}

// ============================================================
// AULAS EM ANDAMENTO - GRADE SEMANAL
// ============================================================

let semanaAulasAndamento = new Date();

// Alternar entre tabs Calendário / Penalidades
function switchAulasTab(tab) {
    // Atualizar botões
    document.querySelectorAll('.aulas-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.tab-btn').classList.add('active');
    
    // Atualizar conteúdo
    document.querySelectorAll('.aulas-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    if (tab === 'calendario') {
        document.getElementById('aulas-tab-calendario').classList.add('active');
        renderCalendarioSemanalAulas();
    } else if (tab === 'penalidades') {
        document.getElementById('aulas-tab-penalidades').classList.add('active');
        renderPenalidades();
    }
}

// Renderizar Grade Technogym - Horários de 6h a 22h (hora em hora)
function renderCalendarioSemanalAulas() {
    // Obter aulas do mockData
    const aulas = window.mockData?.aulasSemanais || [];
    
    // Calcular início da semana (domingo)
    const inicioSemana = getStartOfWeek(semanaAulasAndamento);
    
    // Nomes dos dias da semana e meses
    const diasSemana = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    
    // Verificar se é hoje
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    // 1. Renderizar Header com Dias da Semana (8 colunas individuais)
    for (let i = 0; i < 7; i++) {
        const headerCell = document.getElementById(`dia-header-${i}`);
        if (!headerCell) continue;
        
        const dia = new Date(inicioSemana);
        dia.setDate(dia.getDate() + i);
        
        const diaNumero = dia.getDate();
        const mes = meses[dia.getMonth()];
        const isHoje = dia.getTime() === hoje.getTime();
        
        headerCell.className = `dia-header-tech ${isHoje ? 'hoje' : ''}`;
        headerCell.innerHTML = `
            <div class="dia-nome-tech">${diasSemana[i]}</div>
            <div class="dia-numero-tech">${diaNumero}</div>
            <div class="dia-mes-tech">${mes}</div>
        `;
    }
    
    // 2. Renderizar Grade com Horários de 6h a 22h (17 linhas)
    const bodyContainer = document.getElementById('grade-technogym-body');
    if (!bodyContainer) return;
    
    let bodyHtml = '';
    const horaInicio = 6;
    const horaFim = 22;
    
    // Criar linhas hora em hora (6h, 7h, 8h... 22h)
    for (let hora = horaInicio; hora <= horaFim; hora++) {
        const horarioLabel = `${String(hora).padStart(2, '0')}:00`;
        
        // Coluna de hora (visível à esquerda para o gestor)
        bodyHtml += `<div class="slot-hora">${horarioLabel}</div>`;
        
        // 7 colunas de dias
        for (let diaIndex = 0; diaIndex < 7; diaIndex++) {
            const dia = new Date(inicioSemana);
            dia.setDate(dia.getDate() + diaIndex);
            
            // Buscar aulas que começam nesta hora (aceita :00 ou :30)
            const aulasNaHora = aulas.filter(aula => {
                const aulaData = new Date(aula.data);
                aulaData.setHours(0, 0, 0, 0);
                
                if (aulaData.getTime() !== dia.getTime()) return false;
                
                const horarioInicio = aula.horario_inicio || aula.horario || '00:00';
                const [aulaHora] = horarioInicio.split(':').map(Number);
                return aulaHora === hora;
            });
            
            if (aulasNaHora.length > 0) {
                // Pegar a primeira aula (se houver múltiplas no mesmo horário)
                const aulaNoSlot = aulasNaHora[0];
                
                const tipoClass = (aulaNoSlot.tipo || '').toLowerCase().replace(/\s+/g, '');
                const icone = getIconeAula(aulaNoSlot.tipo);
                const ocupados = aulaNoSlot.inscritos || aulaNoSlot.alunos_inscritos?.length || 0;
                const capacidade = aulaNoSlot.capacidade || 30;
                const duracao = aulaNoSlot.duracao || 60;
                const horarioFim = aulaNoSlot.horario_fim || calcularHorarioFim(aulaNoSlot.horario_inicio || aulaNoSlot.horario, duracao);
                
                bodyHtml += `
                    <div class="slot-celula has-aula">
                        <div class="bloco-aula-tech ${tipoClass}" onclick="abrirInfoAula('${aulaNoSlot.id}')">
                            <div class="bloco-tech-header">
                                <span class="bloco-tech-icon">${icone}</span>
                                <span class="bloco-tech-horario">${aulaNoSlot.horario_inicio || aulaNoSlot.horario} - ${horarioFim}</span>
                            </div>
                            <div class="bloco-tech-nome">${aulaNoSlot.tipo || 'Aula'}</div>
                            <div class="bloco-tech-local">${aulaNoSlot.sala || 'GINÁSIO'}</div>
                            <div class="bloco-tech-instrutor">${aulaNoSlot.instrutor || 'Instrutor'}</div>
                            <div class="bloco-tech-ocupacao">${ocupados}/${capacidade}</div>
                        </div>
                    </div>
                `;
            } else {
                // Slot vazio - clicável para criar aula
                const dataISO = dia.toISOString().split('T')[0];
                bodyHtml += `
                    <div class="slot-celula" onclick="criarAulaNoSlot('${dataISO}', '${horarioLabel}')">
                        <i class="fas fa-plus slot-vazio-indicator"></i>
                    </div>
                `;
            }
        }
    }
    
    bodyContainer.innerHTML = bodyHtml;
}

// Obter ícone da aula por tipo
function getIconeAula(tipo) {
    const icones = {
        'Yoga': '🧘',
        'Spinning': '🚴',
        'Pilates': '🤸',
        'CrossFit': '🏋️',
        'Funcional': '💪',
        'Musculação': '🏋️',
        'Personal Training': '👤'
    };
    return icones[tipo] || '🏃';
}

// Calcular horário de fim
function calcularHorarioFim(inicio, duracao) {
    const [hora, minuto] = inicio.split(':').map(Number);
    const totalMinutos = hora * 60 + minuto + duracao;
    const horaFim = Math.floor(totalMinutos / 60);
    const minutoFim = totalMinutos % 60;
    return `${String(horaFim).padStart(2, '0')}:${String(minutoFim).padStart(2, '0')}`;
}

// Navegação de semana
function previousWeekAulas() {
    semanaAulasAndamento.setDate(semanaAulasAndamento.getDate() - 7);
    renderCalendarioSemanalAulas();
}

function nextWeekAulas() {
    semanaAulasAndamento.setDate(semanaAulasAndamento.getDate() + 7);
    renderCalendarioSemanalAulas();
}

function goToTodayAulas() {
    semanaAulasAndamento = new Date();
    renderCalendarioSemanalAulas();
}

// Abrir seletor de data
function abrirSeletorData() {
    const dataAtual = formatarDataLocal(semanaAulasAndamento);
    const novaData = prompt('Selecione uma data (DD/MM/AAAA):', dataAtual);
    
    if (novaData) {
        const [dia, mes, ano] = novaData.split('/').map(Number);
        if (dia && mes && ano) {
            semanaAulasAndamento = new Date(ano, mes - 1, dia);
            renderCalendarioSemanalAulas();
        }
    }
}

// Criar aula ao clicar em slot vazio
function criarAulaNoSlot(data, horario) {
    // Abrir modal de criação com data e hora pré-preenchidas
    abrirModalAula('criar', {
        data: data,
        horario_inicio: horario
    });
}

// Aplicar filtros
function aplicarFiltrosAulas() {
    const periodo = document.getElementById('filtro-periodo-aula')?.value;
    const busca = document.getElementById('search-aulas-andamento')?.value.toLowerCase();
    
    // Aplicar filtros (expandir conforme necessário)
    showToast(`Filtros aplicados: ${periodo}`, 'info');
    renderCalendarioSemanalAulas();
}

// Abrir detalhes da aula (reutilizar modal existente)
function abrirDetalhesAulaAndamento(aulaId) {
    const aula = aulasSemanaisCache.find(a => a.id === aulaId);
    if (aula) {
        abrirModalAulaAgendamento('editar', aula);
    }
}

// ============================================================
// PENALIDADES
// ============================================================

// Array de penalidades (simular backend - pode ser movido para mockData depois)
let penalidadesData = [
    {
        id: 1,
        aluno: 'João Silva',
        tipo: 'Falta não justificada',
        aula: 'Yoga',
        data: '14/10/2025',
        instrutor: 'Miguel Ricardo',
        status: 'Ativa'
    },
    {
        id: 2,
        aluno: 'Maria Santos',
        tipo: 'Cancelamento tardio',
        aula: 'Spinning',
        data: '13/10/2025',
        instrutor: 'Ana Costa',
        status: 'Ativa'
    },
    {
        id: 3,
        aluno: 'Pedro Oliveira',
        tipo: 'Falta não justificada',
        aula: 'CrossFit',
        data: '12/10/2025',
        instrutor: 'Carlos Mendes',
        status: 'Resolvida'
    },
    {
        id: 4,
        aluno: 'Ana Costa',
        tipo: 'Falta não justificada',
        aula: 'Pilates',
        data: '15/10/2025',
        instrutor: 'Sofia Rodrigues',
        status: 'Ativa'
    }
];

function renderPenalidades() {
    const container = document.getElementById('lista-penalidades');
    if (!container) return;
    
    // Calcular estatísticas
    const totalFaltasMes = penalidadesData.filter(p => 
        p.tipo.includes('Falta') && new Date(p.data.split('/').reverse().join('-')).getMonth() === new Date().getMonth()
    ).length;
    const totalAtivas = penalidadesData.filter(p => p.status === 'Ativa').length;
    const totalResolvidas = penalidadesData.filter(p => p.status === 'Resolvida').length;
    
    // Atualizar cards de estatísticas
    const elemFaltas = document.getElementById('total-faltas-mes');
    const elemAtivas = document.getElementById('total-penalidades-ativas');
    const elemResolvidas = document.getElementById('total-resolvidas');
    
    if (elemFaltas) elemFaltas.textContent = totalFaltasMes;
    if (elemAtivas) elemAtivas.textContent = totalAtivas;
    if (elemResolvidas) elemResolvidas.textContent = totalResolvidas;
    
    // Renderizar lista
    if (penalidadesData.length === 0) {
        container.innerHTML = `
            <div class="dia-vazio">
                <i class="fas fa-check-circle"></i>
                <div>Nenhuma penalidade registrada</div>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    penalidadesData.forEach(pen => {
        const tipoClass = pen.tipo.includes('Falta') ? 'falta' : 'cancelamento';
        const statusClass = pen.status === 'Ativa' ? 'ativa' : 'resolvida';
        
        html += `
            <div class="penalidade-card ${pen.status === 'Resolvida' ? 'resolvida' : ''}">
                <div class="penalidade-info">
                    <div class="penalidade-aluno">
                        <i class="fas fa-user-circle"></i>
                        ${pen.aluno}
                        <span class="penalidade-tipo ${tipoClass}">${pen.tipo}</span>
                    </div>
                    <div class="penalidade-detalhes">
                        <span><i class="fas fa-dumbbell"></i> ${pen.aula}</span>
                        <span><i class="fas fa-calendar"></i> ${pen.data}</span>
                        <span><i class="fas fa-user"></i> ${pen.instrutor}</span>
                    </div>
                </div>
                <div class="penalidade-acoes">
                    <div class="penalidade-status ${statusClass}">${pen.status}</div>
                    <button class="btn-excluir-penalidade" onclick="excluirPenalidade(${pen.id})">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Excluir penalidade individual
function excluirPenalidade(id) {
    const penalidade = penalidadesData.find(p => p.id === id);
    if (!penalidade) return;
    
    if (confirm(`Tem certeza que deseja excluir a penalidade de ${penalidade.aluno}?\n\nTipo: ${penalidade.tipo}\nAula: ${penalidade.aula}\nData: ${penalidade.data}`)) {
        // Remover do array
        penalidadesData = penalidadesData.filter(p => p.id !== id);
        
        // Re-renderizar
        renderPenalidades();
        
        showToast('Penalidade excluída com sucesso!', 'success');
    }
}

// ============================================================
// MODAL - GESTÃO DE PARTICIPANTES
// ============================================================

// Mock de alunos disponíveis (substituir com dados reais do backend)
const alunosDisponiveis = [
    { id: 1, nome: 'João Silva', email: 'joao@email.com' },
    { id: 2, nome: 'Maria Santos', email: 'maria@email.com' },
    { id: 3, nome: 'Pedro Oliveira', email: 'pedro@email.com' },
    { id: 4, nome: 'Ana Costa', email: 'ana@email.com' },
    { id: 5, nome: 'Carlos Mendes', email: 'carlos@email.com' },
    { id: 6, nome: 'Sofia Rodrigues', email: 'sofia@email.com' },
    { id: 7, nome: 'Lucas Ferreira', email: 'lucas@email.com' },
    { id: 8, nome: 'Beatriz Lima', email: 'beatriz@email.com' }
];

// Carregar lista de alunos no select
function carregarAlunosSelect() {
    const select = document.getElementById('modal-select-aluno');
    if (!select) return;
    
    select.innerHTML = '<option value="">Selecione um aluno...</option>';
    alunosDisponiveis.forEach(aluno => {
        const option = document.createElement('option');
        option.value = aluno.id;
        option.textContent = `${aluno.nome} (${aluno.email})`;
        select.appendChild(option);
    });
}

// Adicionar aluno à aula
function adicionarAlunoNaAula() {
    if (!aulaEditando) {
        showToast('Selecione uma aula primeiro', 'error');
        return;
    }
    
    const selectAluno = document.getElementById('modal-select-aluno');
    const alunoId = parseInt(selectAluno.value);
    
    if (!alunoId) {
        showToast('Selecione um aluno', 'warning');
        return;
    }
    
    // Verificar capacidade
    const capacidade = parseInt(document.getElementById('modal-capacidade-max')?.value) || 20;
    const participantesAtuais = aulaEditando.alunos_inscritos || [];
    
    if (participantesAtuais.length >= capacidade) {
        showToast('Aula já está com capacidade máxima', 'error');
        return;
    }
    
    // Verificar se já está inscrito
    if (participantesAtuais.find(p => p.id === alunoId)) {
        showToast('Aluno já está inscrito nesta aula', 'warning');
        return;
    }
    
    // Encontrar dados do aluno
    const aluno = alunosDisponiveis.find(a => a.id === alunoId);
    if (!aluno) return;
    
    // Adicionar à lista
    if (!aulaEditando.alunos_inscritos) {
        aulaEditando.alunos_inscritos = [];
    }
    aulaEditando.alunos_inscritos.push(aluno);
    
    // Atualizar visualização
    renderParticipantes();
    atualizarOcupacao();
    
    // Limpar select
    selectAluno.value = '';
    
    showToast(`${aluno.nome} adicionado à aula`, 'success');
}

// Remover aluno da aula
function removerAlunoNaAula(alunoId) {
    if (!aulaEditando) return;
    
    const aluno = aulaEditando.alunos_inscritos?.find(a => a.id === alunoId);
    if (!aluno) return;
    
    if (confirm(`Remover ${aluno.nome} desta aula?`)) {
        aulaEditando.alunos_inscritos = aulaEditando.alunos_inscritos.filter(a => a.id !== alunoId);
        
        renderParticipantes();
        atualizarOcupacao();
        
        showToast(`${aluno.nome} removido da aula`, 'success');
    }
}

// Renderizar lista de participantes
function renderParticipantes() {
    const container = document.getElementById('lista-participantes');
    if (!container || !aulaEditando) return;
    
    const participantes = aulaEditando.alunos_inscritos || [];
    
    if (participantes.length === 0) {
        container.innerHTML = `
            <div class="dia-vazio" style="padding: 2rem; text-align: center;">
                <i class="fas fa-user-slash"></i>
                <div>Nenhum aluno inscrito ainda</div>
            </div>
        `;
        return;
    }
    
    let html = '';
    participantes.forEach(aluno => {
        const iniciais = aluno.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        
        html += `
            <div class="participante-item">
                <div class="participante-info">
                    <div class="participante-avatar">${iniciais}</div>
                    <div class="participante-dados">
                        <div class="participante-nome">${aluno.nome}</div>
                        <div class="participante-email">${aluno.email || ''}</div>
                    </div>
                </div>
                <div class="participante-acoes">
                    <button class="btn-remover-participante" onclick="removerAlunoNaAula(${aluno.id})">
                        <i class="fas fa-user-minus"></i> Remover
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Atualizar informação de ocupação
function atualizarOcupacao() {
    if (!aulaEditando) return;
    
    const participantes = aulaEditando.alunos_inscritos || [];
    const capacidade = parseInt(document.getElementById('modal-capacidade-max')?.value) || 20;
    const ocupacao = participantes.length;
    const percentual = Math.round((ocupacao / capacidade) * 100);
    
    // Atualizar badge
    const badgeAtual = document.getElementById('modal-ocupacao-atual');
    const badgeMax = document.getElementById('modal-ocupacao-max');
    if (badgeAtual) badgeAtual.textContent = ocupacao;
    if (badgeMax) badgeMax.textContent = capacidade;
    
    // Atualizar barra
    const barra = document.getElementById('modal-ocupacao-barra');
    if (barra) {
        barra.style.width = `${percentual}%`;
        
        // Mudar cor conforme ocupação
        if (percentual >= 90) {
            barra.style.background = 'linear-gradient(90deg, #ff6b6b, #ee5a6f)';
        } else if (percentual >= 70) {
            barra.style.background = 'linear-gradient(90deg, #ff9800, #f57c00)';
        } else {
            barra.style.background = 'linear-gradient(90deg, var(--accent-blue), var(--medium-blue))';
        }
    }
}

// Cancelar aula completa
function cancelarAulaCompleta() {
    if (!aulaEditando) return;
    
    const participantes = aulaEditando.alunos_inscritos || [];
    const mensagem = participantes.length > 0 
        ? `Esta aula tem ${participantes.length} aluno(s) inscrito(s). Tem certeza que deseja cancelá-la? Os alunos serão notificados.`
        : 'Tem certeza que deseja cancelar esta aula?';
    
    if (confirm(mensagem)) {
        aulaEditando.status = 'cancelada';
        aulaEditando.alunos_inscritos = [];
        
        showToast('Aula cancelada com sucesso', 'success');
        renderCalendarioSemanalAulas();
        closeModalAula();
    }
}

// ============================================
// PESSOAS - HIDDEN DRAWER SIDEBAR
// ============================================

// Toggle da sidebar de Pessoas
function togglePessoasDrawer() {
    const drawer = document.getElementById('pessoas-drawer');
    const toggle = document.getElementById('pessoas-drawer-toggle');
    
    if (drawer && toggle) {
        drawer.classList.toggle('hidden');
    }
}

// Abrir tab específica de Pessoas
function abrirPessoasTab(tabName, evt) {
    // Atualizar menu items da sidebar unificada
    const unifiedMenuItems = document.querySelectorAll('.unified-menu-item');
    unifiedMenuItems.forEach(item => item.classList.remove('active'));
    
    if (evt) {
        evt.target.closest('.unified-menu-item').classList.add('active');
    } else {
        // Se não houver evento, ativa o botão correspondente
        const button = document.querySelector(`.unified-menu-item[onclick*="${tabName}"]`);
        if (button) button.classList.add('active');
    }
    
    // Atualizar conteúdo
    const tabContents = document.querySelectorAll('.pessoas-tab-content');
    tabContents.forEach(content => content.classList.remove('active'));
    
    const targetTab = document.getElementById(`tab-${tabName}`);
    if (targetTab) {
        targetTab.classList.add('active');
    }
}

// ============================================
// PROGRAMAS DE TREINAMENTO
// ============================================

// Abrir modal de criação de novo programa
function abrirModalNovoPrograma() {
    const modal = document.getElementById('modal-novo-programa');
    if (modal) {
        modal.style.display = 'block';
        // Limpar formulário
        document.getElementById('form-novo-programa').reset();
    }
}

// Fechar modal de criação de novo programa
function fecharModalNovoPrograma() {
    const modal = document.getElementById('modal-novo-programa');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Criar novo programa e abrir página de builder
function criarPrograma(event) {
    event.preventDefault();
    
    // Coletar dados do formulário
    const programaData = {
        nome: document.getElementById('programa-nome').value,
        tipoObjetivo: document.getElementById('programa-tipo-objetivo').value,
        objetivo: document.getElementById('programa-objetivo').value,
        tipoExercicios: document.getElementById('programa-tipo-exercicios').value,
        quemUtiliza: document.getElementById('programa-quem-utiliza').value,
        id: Date.now() // ID temporário
    };
    
    // Salvar em localStorage
    localStorage.setItem('programaEmCriacao', JSON.stringify(programaData));
    
    // Fechar modal
    fecharModalNovoPrograma();
    
    // Abrir página de builder
    abrirProgramaBuilder(programaData);
}

// Abrir página de builder de programa
function abrirProgramaBuilder(programaData) {
    // Resetar sistema de sessões
    sessoes = [{ id: 1, nome: 'Sessão 1', exercicios: [], expandida: false }];
    sessaoAtiva = 1;
    modoExpandido = false;
    exerciciosSessao = [];
    
    // Esconder página de programas
    const pageProgramas = document.getElementById('page-treinamento');
    if (pageProgramas) {
        pageProgramas.style.display = 'none';
    }
    
    // Mostrar página de builder
    const pageBuilder = document.getElementById('page-programa-builder');
    if (pageBuilder) {
        pageBuilder.style.display = 'block';
        pageBuilder.classList.add('active');
        
        // Atualizar título com nome do programa
        const builderTitle = document.getElementById('builder-programa-nome');
        if (builderTitle) {
            builderTitle.textContent = programaData.nome;
        }
        
        // Carregar biblioteca de exercícios
        carregarBibliotecaExercicios();
        
        // Renderizar sessões vazias
        renderizarSessoes();
    }
}

// Fechar builder e voltar para lista de programas
function fecharProgramaBuilder() {
    const pageBuilder = document.getElementById('page-programa-builder');
    if (pageBuilder) {
        pageBuilder.style.display = 'none';
        pageBuilder.classList.remove('active');
    }
    
    const pageProgramas = document.getElementById('page-treinamento');
    if (pageProgramas) {
        pageProgramas.style.display = 'block';
    }
    
    // Resetar sistema de sessões
    sessoes = [{ id: 1, nome: 'Sessão 1', exercicios: [], expandida: false }];
    sessaoAtiva = 1;
    modoExpandido = false;
    exerciciosSessao = [];
    
    // Recarregar lista de programas
    carregarProgramas();
}

// Biblioteca de exercícios global
const bibliotecaExercicios = [
    { id: 1, nome: 'Run', tipo: 'Cardio', aparelho: 'Esteira', parteCorpo: 'Corpo todo', duracao: 10, kcal: 120 },
    { id: 2, nome: 'Bike', tipo: 'Cardio', aparelho: 'Bike', parteCorpo: 'Membros inferiores', duracao: 10, kcal: 100 },
    { id: 3, nome: 'Synchro', tipo: 'Cardio', aparelho: 'Synchro', parteCorpo: 'Corpo todo', duracao: 10, kcal: 150 },
    { id: 4, nome: 'Flexão de abdômen', tipo: 'Força', aparelho: 'Solo', parteCorpo: 'Core', duracao: 5, kcal: 30 },
    { id: 5, nome: 'Elevação lateral', tipo: 'Força', aparelho: 'Halteres', parteCorpo: 'Ombros', duracao: 5, kcal: 35 },
    { id: 6, nome: 'Quadríceps - deitado', tipo: 'Força', aparelho: 'Máquina', parteCorpo: 'Pernas', duracao: 5, kcal: 40 },
    { id: 7, nome: 'Abdominal - deitado', tipo: 'Força', aparelho: 'Solo', parteCorpo: 'Core', duracao: 5, kcal: 30 },
    { id: 8, nome: 'Desenvolvimento', tipo: 'Força', aparelho: 'Halteres', parteCorpo: 'Ombros', duracao: 5, kcal: 35 }
];

// Exercícios adicionados à sessão atual
let exerciciosSessao = [];

// Sistema de múltiplas sessões
let sessoes = [
    { id: 1, nome: 'Sessão 1', exercicios: [], expandida: false }
];
let sessaoAtiva = 1;
let modoExpandido = false;

// Carregar biblioteca de exercícios
function carregarBibliotecaExercicios() {
    const grid = document.getElementById('exercicios-grid');
    if (!grid) return;
    
    grid.innerHTML = bibliotecaExercicios.map(ex => `
        <div class="exercicio-card" onclick="adicionarExercicioSessao(${ex.id})">
            <div class="exercicio-thumb">
                <i class="fas fa-play"></i>
            </div>
            <div class="exercicio-info">
                <h4>${ex.nome}</h4>
            </div>
        </div>
    `).join('');
}

// Adicionar exercício à sessão ativa
function adicionarExercicioSessao(exercicioId) {
    const exercicio = bibliotecaExercicios.find(ex => ex.id === exercicioId);
    if (!exercicio) return;
    
    const sessao = sessoes.find(s => s.id === sessaoAtiva);
    if (!sessao) return;
    
    // Adicionar à sessão ativa
    sessao.exercicios.push({ ...exercicio, ordem: sessao.exercicios.length + 1 });
    
    // Atualizar visualização
    renderizarTabsSessoes(); // Atualizar contador nas tabs
    renderizarSessaoAtiva();
    
    // Feedback visual
    showToast('Exercício adicionado à sessão!', 'success');
}

// Renderizar exercícios da sessão
function renderizarSessao() {
    const container = document.getElementById('sessao-exercicios');
    if (!container) return;
    
    if (exerciciosSessao.length === 0) {
        container.innerHTML = `
            <div class="sessao-empty">
                <p>Adicione exercícios clicando nos cards acima</p>
            </div>
        `;
        atualizarStatsSessao();
        return;
    }
    
    container.innerHTML = `
        <div class="sessao-lista">
            ${exerciciosSessao.map((ex, index) => `
                <div class="sessao-exercicio-item">
                    <div class="exercicio-numero">${index + 1}</div>
                    <div class="exercicio-detalhes">
                        <h4>${ex.nome}</h4>
                        <span class="exercicio-meta">${ex.tipo} • ${ex.aparelho}</span>
                    </div>
                    <div class="exercicio-acoes">
                        <button onclick="removerExercicioSessao(${index})" class="btn-remover">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    atualizarStatsSessao();
}

// Remover exercício da sessão
function removerExercicioSessao(index) {
    exerciciosSessao.splice(index, 1);
    renderizarSessao();
    showToast('Exercício removido', 'info');
}

// Atualizar estatísticas da sessão
function atualizarStatsSessao() {
    const totalExercicios = exerciciosSessao.length;
    const totalMinutos = exerciciosSessao.reduce((sum, ex) => sum + (ex.duracao || 0), 0);
    const totalKcal = exerciciosSessao.reduce((sum, ex) => sum + (ex.kcal || 0), 0);
    
    const statsContainer = document.querySelector('.sessao-stats');
    if (statsContainer) {
        statsContainer.innerHTML = `
            <span>${totalExercicios} exercício${totalExercicios !== 1 ? 's' : ''}</span>
            <span>${totalMinutos} min</span>
            <span>${totalKcal} kcal</span>
            <span>0 MOVEs</span>
        `;
    }
}

// Renderizar tabs de sessões
function renderizarTabsSessoes() {
    const tabsContainer = document.getElementById('sessoes-tabs');
    if (!tabsContainer) return;
    
    tabsContainer.innerHTML = sessoes.map(s => `
        <button class="sessao-tab ${s.id === sessaoAtiva ? 'active' : ''}" onclick="selecionarSessao(${s.id})">
            <span>${s.nome}</span>
            <span class="tab-count">${s.exercicios.length}</span>
        </button>
    `).join('');
}

// Selecionar sessão ativa
function selecionarSessao(sessaoId) {
    sessaoAtiva = sessaoId;
    renderizarTabsSessoes();
    renderizarSessaoAtiva();
}

// Renderizar apenas a sessão ativa
function renderizarSessaoAtiva() {
    const container = document.getElementById('sessoes-container');
    if (!container) return;
    
    const sessaoObj = sessoes.find(s => s.id === sessaoAtiva);
    if (!sessaoObj) return;
    
    container.innerHTML = `
        <div class="sessao-treino ${modoExpandido ? 'expandida' : ''}">
            <div class="sessao-header">
                <div class="sessao-info">
                    <i class="fas fa-chevron-down"></i>
                    <h3>${sessaoObj.nome}</h3>
                    <div class="sessao-menu">
                        <button class="btn-more" onclick="toggleMenuSessao(event, ${sessaoObj.id})">
                            <i class="fas fa-ellipsis-vertical"></i>
                        </button>
                        <div class="menu-dropdown" id="menu-sessao-${sessaoObj.id}" style="display: none;">
                            <button onclick="renomearSessao(${sessaoObj.id})">
                                <i class="fas fa-edit"></i> Renomear
                            </button>
                            <button onclick="clonarSessao(${sessaoObj.id})">
                                <i class="fas fa-clone"></i> Clonar
                            </button>
                            <button onclick="excluirSessao(${sessaoObj.id})" class="btn-danger">
                                <i class="fas fa-trash"></i> Excluir
                            </button>
                        </div>
                    </div>
                </div>
                <div class="sessao-stats">
                    <span>${sessaoObj.exercicios.length} exercício${sessaoObj.exercicios.length !== 1 ? 's' : ''}</span>
                    <span>${sessaoObj.exercicios.reduce((sum, ex) => sum + (ex.duracao || 0), 0)} min</span>
                    <span>${sessaoObj.exercicios.reduce((sum, ex) => sum + (ex.kcal || 0), 0)} kcal</span>
                    <span>0 MOVEs</span>
                </div>
                <button class="btn-expandir" onclick="toggleExpandirSessao()">
                    <i class="fas ${modoExpandido ? 'fa-plus' : 'fa-expand'}"></i> 
                    ${modoExpandido ? 'EXERCÍCIOS' : 'EXPANDIR'}
                </button>
            </div>
            <div class="sessao-exercicios" id="sessao-exercicios-${sessaoObj.id}">
                ${sessaoObj.exercicios.length === 0 ? `
                    <div class="sessao-empty">
                        <p>Adicione exercícios clicando nos cards acima</p>
                    </div>
                ` : `
                    <div class="sessao-lista">
                        ${sessaoObj.exercicios.map((ex, index) => `
                            <div class="sessao-exercicio-item">
                                <div class="exercicio-numero">${index + 1}</div>
                                <div class="exercicio-detalhes">
                                    <h4>${ex.nome}</h4>
                                    <span class="exercicio-meta">${ex.tipo} • ${ex.aparelho}</span>
                                </div>
                                <div class="exercicio-acoes">
                                    <button onclick="removerExercicioDaSessao(${sessaoObj.id}, ${index})" class="btn-remover">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        </div>
    `;
}

// Alias para compatibilidade - renderiza tabs + sessão
function renderizarSessoes() {
    renderizarTabsSessoes();
    renderizarSessaoAtiva();
}

// Toggle expansão da sessão
function toggleExpandirSessao() {
    modoExpandido = !modoExpandido;
    const biblioteca = document.querySelector('.exercicios-biblioteca');
    const filtros = document.querySelector('.builder-filtros');
    const btnAdicionar = document.querySelector('.btn-adicionar-sessao');
    const tabs = document.querySelector('.sessoes-tabs');
    
    if (modoExpandido) {
        // Esconder biblioteca, filtros, tabs e botão
        if (biblioteca) biblioteca.style.display = 'none';
        if (filtros) filtros.style.display = 'none';
        if (btnAdicionar) btnAdicionar.style.display = 'none';
        if (tabs) tabs.style.display = 'none';
    } else {
        // Mostrar biblioteca, filtros, tabs e botão
        if (biblioteca) biblioteca.style.display = 'block';
        if (filtros) filtros.style.display = 'flex';
        if (btnAdicionar) btnAdicionar.style.display = 'block';
        if (tabs) tabs.style.display = 'flex';
    }
    
    renderizarSessaoAtiva();
}

// Adicionar nova sessão
function adicionarNovaSessao() {
    const novoId = Math.max(...sessoes.map(s => s.id)) + 1;
    sessoes.push({
        id: novoId,
        nome: `Sessão ${novoId}`,
        exercicios: [],
        expandida: false
    });
    sessaoAtiva = novoId;
    renderizarTabsSessoes();
    renderizarSessaoAtiva();
    showToast('Nova sessão criada!', 'success');
}

// Toggle menu de opções da sessão
function toggleMenuSessao(event, sessaoId) {
    event.stopPropagation();
    const menu = document.getElementById(`menu-sessao-${sessaoId}`);
    
    // Fechar outros menus
    document.querySelectorAll('.menu-dropdown').forEach(m => {
        if (m !== menu) m.style.display = 'none';
    });
    
    if (menu) {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
}

// Renomear sessão
function renomearSessao(sessaoId) {
    const sessao = sessoes.find(s => s.id === sessaoId);
    if (!sessao) return;
    
    const novoNome = prompt('Novo nome da sessão:', sessao.nome);
    if (novoNome && novoNome.trim()) {
        sessao.nome = novoNome.trim();
        renderizarTabsSessoes();
        renderizarSessaoAtiva();
        showToast('Sessão renomeada!', 'success');
    }
    
    // Fechar menu
    const menu = document.getElementById(`menu-sessao-${sessaoId}`);
    if (menu) menu.style.display = 'none';
}

// Clonar sessão
function clonarSessao(sessaoId) {
    const sessao = sessoes.find(s => s.id === sessaoId);
    if (!sessao) return;
    
    const novoId = Math.max(...sessoes.map(s => s.id)) + 1;
    const novaSessao = {
        id: novoId,
        nome: `${sessao.nome} (cópia)`,
        exercicios: [...sessao.exercicios.map(ex => ({...ex}))], // Clone profundo
        expandida: false
    };
    
    sessoes.push(novaSessao);
    sessaoAtiva = novoId;
    renderizarTabsSessoes();
    renderizarSessaoAtiva();
    showToast('Sessão clonada!', 'success');
    
    // Fechar menu
    const menu = document.getElementById(`menu-sessao-${sessaoId}`);
    if (menu) menu.style.display = 'none';
}

// Excluir sessão
function excluirSessao(sessaoId) {
    if (sessoes.length === 1) {
        showToast('Não é possível excluir a última sessão!', 'warning');
        return;
    }
    
    if (!confirm('Deseja realmente excluir esta sessão?')) return;
    
    sessoes = sessoes.filter(s => s.id !== sessaoId);
    
    // Ativar a primeira sessão disponível
    if (sessaoAtiva === sessaoId) {
        sessaoAtiva = sessoes[0].id;
    }
    
    renderizarTabsSessoes();
    renderizarSessaoAtiva();
    showToast('Sessão excluída!', 'success');
}

// Remover exercício da sessão específica
function removerExercicioDaSessao(sessaoId, index) {
    const sessao = sessoes.find(s => s.id === sessaoId);
    if (!sessao) return;
    
    sessao.exercicios.splice(index, 1);
    renderizarTabsSessoes(); // Atualizar contador nas tabs
    renderizarSessaoAtiva();
    showToast('Exercício removido', 'info');
}

// Salvar programa
function salvarPrograma() {
    // Validar se há pelo menos 1 exercício em alguma sessão
    const totalExercicios = sessoes.reduce((sum, s) => sum + s.exercicios.length, 0);
    if (totalExercicios === 0) {
        showToast('Adicione pelo menos um exercício ao programa!', 'warning');
        return;
    }
    
    const programaData = JSON.parse(localStorage.getItem('programaEmCriacao') || '{}');
    programaData.sessoes = sessoes.map(s => ({
        ...s,
        exercicios: [...s.exercicios]
    }));
    programaData.dataCriacao = new Date().toISOString();
    programaData.id = programaData.id || Date.now();
    
    // Salvar em localStorage (futuramente será API)
    const programas = JSON.parse(localStorage.getItem('programas') || '[]');
    programas.push(programaData);
    localStorage.setItem('programas', JSON.stringify(programas));
    
    showToast('Programa salvo com sucesso!', 'success');
    
    // Limpar dados temporários
    localStorage.removeItem('programaEmCriacao');
    
    // Voltar para lista de programas
    setTimeout(() => {
        fecharProgramaBuilder();
    }, 1000);
}

// Alias para compatibilidade
function carregarProgramas() {
    loadProgramas();
}

// Filtrar exercícios
function filtrarExercicios() {
    const filtroAparelho = document.getElementById('filtro-aparelho').value;
    const filtroQualidade = document.getElementById('filtro-qualidade').value;
    const filtroParteCorpo = document.getElementById('filtro-parte-corpo').value;
    const filtroMovimento = document.getElementById('filtro-movimento').value;
    
    console.log('Filtros:', { filtroAparelho, filtroQualidade, filtroParteCorpo, filtroMovimento });
    // TODO: Implementar lógica de filtro
}
