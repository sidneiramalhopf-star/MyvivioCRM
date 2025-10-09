const API_BASE = '';
let currentUser = null;
let authToken = null;

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

function setupEventListeners() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const agendaForm = document.getElementById('agenda-form');
    
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registerForm) registerForm.addEventListener('submit', handleRegister);
    if (agendaForm) agendaForm.addEventListener('submit', handleAgendaSubmit);
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
            currentUser = { email: email };
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
            updateTopStats(stats);
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

        await loadAgendas();
        await loadProgramas();
    } catch (error) {
        console.error('Erro ao carregar dados do dashboard', error);
    }
}

function updateTopStats(stats) {
    document.getElementById('stat-risco').textContent = stats.risco_desistencia + '%';
    document.getElementById('stat-usuarios-visitantes').textContent = stats.usuarios_totais + stats.visitantes;
    document.getElementById('stat-usuarios-ativos').textContent = stats.usuarios_ativos;
    
    document.getElementById('prog-expirados').textContent = stats.programas.expirados;
    document.getElementById('prog-nao-atribuidos').textContent = stats.programas.nao_atribuidos;
    document.getElementById('prog-atribuidos').textContent = stats.programas.atribuidos;
}

function updateMetrics(metricas) {
    document.getElementById('metric-engajamento').textContent = metricas.engajamento + '%';
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
                <span class="agenda-data">${formatDate(agenda.data)}</span>
                <span class="agenda-duracao">${agenda.duracao_minutos} min</span>
                ${!agenda.concluida ? `<button onclick="concluirAgenda(${agenda.id})" class="btn-concluir">✓</button>` : ''}
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

    container.innerHTML = programas.map(prog => `
        <div class="program-card status-${prog.status.replace(' ', '-')}">
            <h4>${prog.nome}</h4>
            <p class="program-status">${prog.status}</p>
            <p class="program-usuarios">${prog.usuarios_matriculados} usuários</p>
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

    if (!authToken) {
        showToast('Faça login primeiro', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/agendas/criar?titulo=${encodeURIComponent(titulo)}&descricao=${encodeURIComponent(descricao)}&tipo_atividade=${encodeURIComponent(tipo)}&duracao_minutos=${duracao}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            showToast('Atividade adicionada à agenda!', 'success');
            closeAgendaModal();
            await loadAgendas();
        } else {
            showToast('Erro ao criar agenda', 'error');
        }
    } catch (error) {
        showToast('Erro ao criar agenda', 'error');
    }
}

async function concluirAgenda(agendaId) {
    if (!authToken) return;

    try {
        const response = await fetch(`${API_BASE}/agendas/${agendaId}/concluir`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            showToast('Agenda concluída!', 'success');
            await loadAgendas();
        }
    } catch (error) {
        showToast('Erro ao concluir agenda', 'error');
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function checkAuth() {
    authToken = localStorage.getItem('authToken');
    if (authToken) {
        showDashboard();
        loadDashboardData();
    } else {
        document.getElementById('login-section').classList.add('active');
    }
}

function showDashboard() {
    document.getElementById('login-section').classList.remove('active');
    document.getElementById('dashboard-section').classList.add('active');
}

function logout() {
    localStorage.removeItem('authToken');
    authToken = null;
    currentUser = null;
    location.reload();
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
    if (event.target == modal) {
        closeAgendaModal();
    }
}
