const API_BASE = '';
let currentUser = null;
let authToken = null;

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
    updateDate();
});

function setupEventListeners() {
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('practice-form').addEventListener('submit', handlePracticeSubmit);
}

function updateDate() {
    const dateElement = document.getElementById('currentDate');
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateElement.textContent = now.toLocaleDateString('pt-BR', options);
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
        const response = await fetch(`${API_BASE}/login?email=${encodeURIComponent(email)}&senha=${encodeURIComponent(password)}`, {
            method: 'POST'
        });

        if (response.ok) {
            const data = await response.json();
            authToken = data.access_token;
            localStorage.setItem('authToken', authToken);
            await loadUserData();
            showToast('Login realizado com sucesso!', 'success');
            showDashboard();
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
    const age = document.getElementById('register-age').value;
    const goal = document.getElementById('register-goal').value;
    const community = document.getElementById('register-community').value;

    try {
        const response = await fetch(`${API_BASE}/registrar?email=${encodeURIComponent(email)}&senha=${encodeURIComponent(password)}&nome=${encodeURIComponent(name)}&idade=${age}&objetivo=${encodeURIComponent(goal)}&comunidade_nome=${encodeURIComponent(community)}`, {
            method: 'POST'
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

async function loadUserData() {
    if (!authToken) return;

    try {
        const response = await fetch(`${API_BASE}/praticas?dimensao=mente&atividade=teste&duracao=1`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            await loadDashboardData();
        }
    } catch (error) {
        console.error('Erro ao carregar dados do usuário', error);
    }
}

async function loadDashboardData() {
    try {
        const rankingResponse = await fetch(`${API_BASE}/ranking`);
        if (rankingResponse.ok) {
            const ranking = await rankingResponse.json();
            updateDashboard(ranking);
        }

        await loadSuggestions();
    } catch (error) {
        console.error('Erro ao carregar dashboard', error);
    }
}

function updateDashboard(ranking) {
    const greetingName = document.getElementById('greetingName');
    const userName = document.getElementById('userName');
    
    if (ranking.length > 0) {
        greetingName.textContent = ranking[0].nome;
        userName.textContent = ranking[0].nome;
        document.getElementById('userTokens').textContent = ranking[0].tokens.toFixed(1);
        document.getElementById('dashTokens').textContent = ranking[0].tokens.toFixed(0);
    }
}

async function handlePracticeSubmit(e) {
    e.preventDefault();
    
    const dimension = document.getElementById('practice-dimension').value;
    const activity = document.getElementById('practice-activity').value;
    const duration = document.getElementById('practice-duration').value;

    if (!authToken) {
        showToast('Faça login primeiro', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/praticas?dimensao=${encodeURIComponent(dimension)}&atividade=${encodeURIComponent(activity)}&duracao=${duration}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            showToast(data.mensagem, 'success');
            document.getElementById('practice-form').reset();
            document.getElementById('userTokens').textContent = data.tokens.toFixed(1);
            document.getElementById('dashTokens').textContent = data.tokens.toFixed(0);
            await loadDashboardData();
        } else {
            showToast('Erro ao registrar prática', 'error');
        }
    } catch (error) {
        showToast('Erro ao registrar prática', 'error');
    }
}

async function loadSuggestions() {
    try {
        const response = await fetch(`${API_BASE}/praticas/plano?objetivo=equilíbrio geral`);
        if (response.ok) {
            const data = await response.json();
            displaySuggestions(data.plano_sugerido);
        }
    } catch (error) {
        console.error('Erro ao carregar sugestões', error);
    }
}

function displaySuggestions(plan) {
    const container = document.getElementById('suggestions-container');
    container.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <h4>🧠 Mente</h4>
                <p>${plan.mente}</p>
            </div>
            <div class="stat-card">
                <h4>💪 Corpo</h4>
                <p>${plan.corpo}</p>
            </div>
            <div class="stat-card">
                <h4>⚡ Energia</h4>
                <p>${plan.energia}</p>
            </div>
        </div>
    `;
}

function showSection(sectionName) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(s => s.classList.remove('active'));

    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');

        if (sectionName === 'ranking') {
            loadRanking();
        } else if (sectionName === 'planner') {
            loadPlanner();
        }
    }
}

async function loadRanking() {
    try {
        const response = await fetch(`${API_BASE}/ranking`);
        if (response.ok) {
            const ranking = await response.json();
            displayRanking(ranking);
        }
    } catch (error) {
        showToast('Erro ao carregar ranking', 'error');
    }
}

function displayRanking(ranking) {
    const tbody = document.getElementById('ranking-body');
    tbody.innerHTML = ranking.map((user, index) => `
        <tr>
            <td class="position">${index + 1}º</td>
            <td>${user.nome}</td>
            <td>💎 ${user.tokens.toFixed(1)}</td>
        </tr>
    `).join('');
}

async function loadPlanner() {
    try {
        const response = await fetch(`${API_BASE}/praticas/plano?objetivo=reduzir estresse`);
        if (response.ok) {
            const data = await response.json();
            displayPlanner(data);
        }
    } catch (error) {
        showToast('Erro ao carregar plano', 'error');
    }
}

function displayPlanner(data) {
    const container = document.getElementById('planner-content');
    container.innerHTML = `
        <div class="practice-form-card">
            <h3>Plano para: ${data.objetivo}</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <h4>🧠 Mente</h4>
                    <p>${data.plano_sugerido.mente}</p>
                    <button onclick="quickPractice('mente', '${data.plano_sugerido.mente}')" class="btn-primary">Praticar</button>
                </div>
                <div class="stat-card">
                    <h4>💪 Corpo</h4>
                    <p>${data.plano_sugerido.corpo}</p>
                    <button onclick="quickPractice('corpo', '${data.plano_sugerido.corpo}')" class="btn-primary">Praticar</button>
                </div>
                <div class="stat-card">
                    <h4>⚡ Energia</h4>
                    <p>${data.plano_sugerido.energia}</p>
                    <button onclick="quickPractice('energia', '${data.plano_sugerido.energia}')" class="btn-primary">Praticar</button>
                </div>
            </div>
        </div>
    `;
}

function quickPractice(dimension, activity) {
    showSection('practices');
    document.getElementById('practice-dimension').value = dimension;
    document.getElementById('practice-activity').value = activity;
    document.getElementById('practice-duration').focus();
}

async function redeemVoucher() {
    if (!authToken) {
        showToast('Faça login primeiro', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/recompensas/voucher`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            showToast(`Voucher gerado: ${data.codigo_voucher}`, 'success');
            await loadDashboardData();
        } else {
            const error = await response.json();
            showToast(error.detail || 'Erro ao resgatar voucher', 'error');
        }
    } catch (error) {
        showToast('Erro ao resgatar voucher', 'error');
    }
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
