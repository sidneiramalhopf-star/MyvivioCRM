const API_BASE = '';
let currentUser = null;
let authToken = null;
let currentPage = 'home';

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
    loadSavedLogo();
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
        
        if (page === 'home') {
            loadDashboardData();
        } else if (page === 'planejador') {
            initPlanner();
        } else if (page === 'treinamento') {
            // Mostrar view de programas por padrão
            switchTreinamentoView('programas');
        } else if (page === 'automacao') {
            // Mostrar view de jornadas por padrão
            switchAutomacaoView('jornadas');
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
        
        if (page === 'home') {
            loadDashboardData();
        } else if (page === 'planejador') {
            initPlanner();
        } else if (page === 'treinamento') {
            // Mostrar view de programas por padrão
            switchTreinamentoView('programas');
        } else if (page === 'automacao') {
            // Mostrar view de jornadas por padrão
            switchAutomacaoView('jornadas');
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
    console.log('switchTreinamentoView:', view);
    
    // Remove active de todos os botões da sidebar unificada (exceto para forms)
    if (view !== 'exercicio-form' && view !== 'aula-form') {
        document.querySelectorAll('.unified-menu-item').forEach(btn => btn.classList.remove('active'));
        
        // Ativa o botão clicado (se houver evento)
        if (evt) {
            evt.target.closest('.unified-menu-item').classList.add('active');
        }
    }
    
    // Esconder todas as páginas de treinamento
    document.querySelectorAll('.treinamento-page').forEach(page => {
        page.classList.remove('active');
        page.style.display = 'none';
    });
    
    // Mostrar a página correta
    const targetPage = document.getElementById(`treinamento-${view}`);
    if (targetPage) {
        targetPage.classList.add('active');
        targetPage.style.display = 'block';
    }
    
    // Carregar dados específicos de cada página
    if (view === 'programas') {
        loadProgramas();
    } else if (view === 'exercicios') {
        loadExercicios();
    } else if (view === 'aulas') {
        loadAulas();
    }
}

// ============================================
// AUTOMAÇÃO - Funções de Navegação
// ============================================

function switchAutomacaoView(view, evt) {
    console.log('switchAutomacaoView:', view);
    
    // Remove active de todos os botões da sidebar unificada
    document.querySelectorAll('.unified-menu-item').forEach(btn => btn.classList.remove('active'));
    
    // Ativa o botão clicado (se houver evento)
    if (evt) {
        evt.target.closest('.unified-menu-item').classList.add('active');
    } else {
        // Se não houver evento, ativar o botão correspondente à view
        const btnToActivate = document.querySelector(`.unified-menu-item[data-menu-id="${view}"]`);
        if (btnToActivate) {
            btnToActivate.classList.add('active');
        }
    }
    
    // Esconder todas as páginas de automação
    document.querySelectorAll('.automacao-page').forEach(page => {
        page.classList.remove('active');
        page.style.display = 'none';
    });
    
    // Mostrar a página correta
    const targetPage = document.getElementById(`automacao-${view}`);
    if (targetPage) {
        targetPage.classList.add('active');
        targetPage.style.display = 'block';
    }
    
    // Carregar dados específicos de cada página
    if (view === 'jornadas') {
        loadJornadas();
    } else if (view === 'questionarios') {
        loadQuestionarios();
    } else if (view === 'grupos') {
        loadGrupos();
    } else if (view === 'atividades') {
        loadAtividades();
    }
}

async function loadJornadas() {
    // Carregar jornadas (mock data por enquanto)
    const jornadasGrid = document.getElementById('jornadas-grid');
    
    if (!jornadasGrid) return;
    
    // Inicializar window.mockJornadas com dados mockData se ainda não existir
    if (!window.mockJornadas) {
        window.mockJornadas = [...mockData.jornadas];
    }
    
    // Usar window.mockJornadas que contém tanto jornadas mockadas quanto criadas
    const jornadas = window.mockJornadas;
    
    // Mapear ícone e cor baseado no tipo
    const getIcone = (tipo) => {
        const tipoNorm = tipo.toLowerCase();
        if (tipoNorm.includes('experiências')) return 'users';
        if (tipoNorm.includes('retenção')) return 'user-clock';
        if (tipoNorm === 'padrão') return 'envelope';
        return 'code';
    };
    
    const getCorClasse = (tipo) => {
        const tipoNorm = tipo.toLowerCase();
        if (tipoNorm.includes('experiências')) return 'experiências-em-destaque';
        if (tipoNorm.includes('retenção')) return 'retenção';
        return 'rascunho';
    };
    
    // Agrupar jornadas por categoria
    const categorias = {
        'padrão': [],
        'experiências de treinamento': [],
        'retenção': []
    };
    
    jornadas.forEach(jornada => {
        const tipoNorm = jornada.tipo.toLowerCase();
        if (tipoNorm.includes('experiências')) {
            categorias['experiências de treinamento'].push(jornada);
        } else if (tipoNorm.includes('retenção')) {
            categorias['retenção'].push(jornada);
        } else {
            categorias['padrão'].push(jornada);
        }
    });
    
    // Renderizar cards agrupados por categoria
    let html = '';
    
    Object.keys(categorias).forEach(categoria => {
        if (categorias[categoria].length > 0) {
            html += `
                <div class="jornadas-categoria-section">
                    <h3 class="jornadas-categoria-titulo">${categoria.toUpperCase()}</h3>
                    <div class="jornadas-categoria-grid">
                        ${categorias[categoria].map(jornada => `
                            <div class="jornada-card" data-id="${jornada.id}">
                                <div class="jornada-card-header ${getCorClasse(jornada.tipo)}">
                                    <span class="jornada-tipo">${jornada.tipo.toUpperCase()}</span>
                                    ${jornada.status === 'ATIVO' ? '<span class="jornada-badge-ativo">ATIVO</span>' : ''}
                                    ${jornada.status === 'RASCUNHO' ? '<span class="jornada-badge-rascunho">RASCUNHO</span>' : ''}
                                </div>
                                <div class="jornada-card-body">
                                    <div class="jornada-icone">
                                        <i class="fas fa-${getIcone(jornada.tipo)}"></i>
                                    </div>
                                    <h3>${jornada.nome}</h3>
                                    <p>${jornada.descricao}</p>
                                </div>
                                <div class="jornada-card-footer">
                                    <button class="btn-card-action" onclick="abrirJornada(${jornada.id})">
                                        <i class="fas fa-arrow-right"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    });
    
    jornadasGrid.innerHTML = html;
}

async function loadQuestionarios() {
    const questionariosGrid = document.getElementById('questionarios-grid');
    
    if (!questionariosGrid) return;
    
    try {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
            questionariosGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-question fa-3x"></i>
                    <p>Faça login para ver seus questionários</p>
                </div>
            `;
            return;
        }
        
        const response = await fetch('/questionarios', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Erro ao carregar questionários');
        }
        
        const questionarios = await response.json();
        
        if (questionarios.length === 0) {
            questionariosGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-question fa-3x"></i>
                    <h3>Nenhum questionário criado</h3>
                    <p>Crie seu primeiro questionário para começar a coletar dados</p>
                    <button class="btn-nova-jornada" onclick="abrirNovoQuestionario()">
                        <i class="fas fa-plus"></i> CRIAR QUESTIONÁRIO
                    </button>
                </div>
            `;
            return;
        }
        
        // Agrupar por status
        const rascunhos = questionarios.filter(q => q.status === 'rascunho');
        const publicados = questionarios.filter(q => q.status === 'publicado');
        const arquivados = questionarios.filter(q => q.status === 'arquivado');
        
        let html = '';
        
        // Renderizar publicados
        if (publicados.length > 0) {
            html += `
                <div class="jornadas-categoria-section">
                    <h3 class="jornadas-categoria-titulo">PUBLICADOS</h3>
                    <div class="jornadas-categoria-grid">
                        ${publicados.map(q => renderQuestionarioCard(q)).join('')}
                    </div>
                </div>
            `;
        }
        
        // Renderizar rascunhos
        if (rascunhos.length > 0) {
            html += `
                <div class="jornadas-categoria-section">
                    <h3 class="jornadas-categoria-titulo">RASCUNHOS</h3>
                    <div class="jornadas-categoria-grid">
                        ${rascunhos.map(q => renderQuestionarioCard(q)).join('')}
                    </div>
                </div>
            `;
        }
        
        // Renderizar arquivados
        if (arquivados.length > 0) {
            html += `
                <div class="jornadas-categoria-section">
                    <h3 class="jornadas-categoria-titulo">ARQUIVADOS</h3>
                    <div class="jornadas-categoria-grid">
                        ${arquivados.map(q => renderQuestionarioCard(q)).join('')}
                    </div>
                </div>
            `;
        }
        
        questionariosGrid.innerHTML = html;
        
    } catch (error) {
        console.error('Erro ao carregar questionários:', error);
        questionariosGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle fa-3x"></i>
                <p>Erro ao carregar questionários. Tente novamente.</p>
            </div>
        `;
    }
}

function renderQuestionarioCard(questionario) {
    const statusBadgeConfig = {
        'rascunho': { text: 'RASCUNHO', class: 'badge-rascunho' },
        'publicado': { text: 'PUBLICADO', class: 'badge-publicado' },
        'arquivado': { text: 'ARQUIVADO', class: 'badge-arquivado' }
    };
    
    const statusConfig = statusBadgeConfig[questionario.status] || statusBadgeConfig['rascunho'];
    
    const categoryThumbnails = {
        'avaliacao_saude': '/static/uploads/thumbnails/default_saude.jpg',
        'verificacao_progresso': '/static/uploads/thumbnails/default_progresso.jpg',
        'perfil': '/static/uploads/thumbnails/default_perfil.jpg',
        'anamnese': '/static/uploads/thumbnails/default_anamnese.jpg',
        'feedback': '/static/uploads/thumbnails/default_feedback.jpg'
    };
    
    const thumbnailUrl = questionario.thumbnail_url || 
                         categoryThumbnails[questionario.categoria] || 
                         '/static/uploads/thumbnails/default_generico.jpg';
    
    return `
        <div class="questionario-card" data-id="${questionario.id}" style="background-image: url('${thumbnailUrl}')" onclick="abrirQuestionario(${questionario.id})">
            <div class="questionario-card-overlay">
                <div class="questionario-card-header">
                    <span class="questionario-badge ${statusConfig.class}">${statusConfig.text}</span>
                </div>
                <div class="questionario-card-content">
                    <h3 class="questionario-titulo">${questionario.titulo}</h3>
                    <p class="questionario-descricao">${questionario.descricao || 'Sem descrição'}</p>
                </div>
                <div class="questionario-card-icon">
                    <i class="fas fa-clipboard-question"></i>
                </div>
            </div>
        </div>
    `;
}

function loadGrupos() {
    console.log('Carregando grupos...');
    // Implementar carregamento de grupos
}

function loadAtividades() {
    console.log('Carregando atividades...');
    // Implementar carregamento de atividades
}

function abrirNovaJornada() {
    console.log('Abrindo modal para criar nova jornada...');
    document.getElementById('modal-nova-jornada').style.display = 'flex';
    
    // Limpar formulário
    document.getElementById('form-nova-jornada').reset();
    document.getElementById('jornada-upload-preview').innerHTML = `
        <i class="fas fa-image"></i>
        <p>Adicionar imagem</p>
        <span class="upload-formats">Formatos compatíveis: JPEG, PNG, GIF<br>Resolução sugerida: 100x100</span>
    `;
}

function fecharModalNovaJornada() {
    document.getElementById('modal-nova-jornada').style.display = 'none';
}

function previewImagemJornada(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('jornada-upload-preview').innerHTML = `
                <img src="${e.target.result}" alt="Preview">
            `;
        };
        reader.readAsDataURL(file);
    }
}

function criarJornada() {
    const grupo = document.getElementById('jornada-grupo').value;
    const categoria = document.getElementById('jornada-categoria').value;
    const nome = document.getElementById('jornada-nome').value;
    const descricao = document.getElementById('jornada-descricao').value;
    const imagem = document.getElementById('jornada-upload-imagem').files[0];
    
    if (!grupo || !categoria || !nome) {
        showToast('Preencha os campos obrigatórios', 'error');
        return;
    }
    
    // Criar objeto da jornada
    const novaJornada = {
        id: Date.now(),
        nome: nome,
        descricao: descricao,
        grupo: grupo,
        tipo: categoria,
        status: 'ATIVO',
        imagem: imagem ? URL.createObjectURL(imagem) : null,
        contatos: 0,
        atividades: [
            {
                id: 1,
                nome: nome,
                icon: 'fa-envelope',
                status: 'ATIVO'
            }
        ]
    };
    
    // Inicializar window.mockJornadas com dados mockData se ainda não existir
    if (!window.mockJornadas) {
        window.mockJornadas = [...mockData.jornadas];
    }
    
    // Adicionar ao mock data
    window.mockJornadas.push(novaJornada);
    
    // Fechar modal
    fecharModalNovaJornada();
    
    // Recarregar jornadas
    loadJornadas();
    
    showToast('Jornada criada com sucesso!', 'success');
}

// ============================================================
// Funções de Questionários
// ============================================================

let selectedCategoria = null;
let selectedThumbnailFile = null;

function abrirNovoQuestionario() {
    document.getElementById('modal-novo-questionario').style.display = 'flex';
    
    // Limpar formulário
    document.getElementById('form-novo-questionario').reset();
    
    // Resetar preview de thumbnail
    const previewImg = document.getElementById('thumbnail-preview-img');
    const placeholderText = document.getElementById('thumbnail-placeholder-text');
    previewImg.style.display = 'none';
    previewImg.src = '';
    placeholderText.style.display = 'block';
    selectedThumbnailFile = null;
    
    // Resetar categoria selecionada
    selectedCategoria = null;
    document.querySelectorAll('.categoria-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Resetar validação
    const nomeInput = document.getElementById('questionario-nome');
    const nomeLabel = document.getElementById('questionario-nome-label');
    nomeInput.classList.remove('error');
    nomeLabel.classList.remove('error');
    
    // Resetar checkboxes
    document.getElementById('funcao-todas').checked = false;
    document.getElementById('funcao-selecionadas').checked = false;
}

function fecharModalNovoQuestionario() {
    document.getElementById('modal-novo-questionario').style.display = 'none';
}

function previewQuestionarioThumbnail(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    selectedThumbnailFile = file;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const previewImg = document.getElementById('thumbnail-preview-img');
        const placeholderText = document.getElementById('thumbnail-placeholder-text');
        
        previewImg.src = e.target.result;
        previewImg.style.display = 'block';
        placeholderText.style.display = 'none';
    };
    reader.readAsDataURL(file);
}

function selecionarCategoria(categoria) {
    // Remover seleção anterior
    document.querySelectorAll('.categoria-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Adicionar seleção na nova categoria
    const card = document.querySelector(`.categoria-card[data-categoria="${categoria}"]`);
    if (card) {
        card.classList.add('selected');
        selectedCategoria = categoria;
    }
}

function toggleFuncoesCheckboxes() {
    const todasCheckbox = document.getElementById('funcao-todas');
    const selecionadasCheckbox = document.getElementById('funcao-selecionadas');
    
    if (todasCheckbox.checked) {
        selecionadasCheckbox.checked = false;
    }
}

async function criarQuestionarioComCategoria() {
    const nome = document.getElementById('questionario-nome').value.trim();
    const descricao = document.getElementById('questionario-descricao').value.trim();
    const nomeInput = document.getElementById('questionario-nome');
    const nomeLabel = document.getElementById('questionario-nome-label');
    
    // Validação de nome obrigatório
    if (!nome) {
        nomeInput.classList.add('error');
        nomeLabel.classList.add('error');
        showToast('O campo Nome é obrigatório', 'error');
        return;
    }
    
    // Remover classes de erro se preenchido
    nomeInput.classList.remove('error');
    nomeLabel.classList.remove('error');
    
    const token = localStorage.getItem('authToken');
    if (!token) {
        showToast('Faça login para criar questionários', 'error');
        return;
    }
    
    try {
        let thumbnailUrl = null;
        
        // Upload de thumbnail se selecionado
        if (selectedThumbnailFile) {
            const formData = new FormData();
            formData.append('file', selectedThumbnailFile);
            
            const uploadResponse = await fetch('/upload/thumbnail', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            if (uploadResponse.ok) {
                const uploadResult = await uploadResponse.json();
                thumbnailUrl = uploadResult.url || uploadResult.filename;
            }
        }
        
        // Se não houver thumbnail personalizado, usar o padrão da categoria
        if (!thumbnailUrl && selectedCategoria) {
            thumbnailUrl = `/static/uploads/thumbnails/default_${selectedCategoria}.jpg`;
        }
        
        // Criar questionário
        const response = await fetch('/questionarios', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                titulo: nome,
                descricao: descricao || null,
                categoria: selectedCategoria || 'generico',
                thumbnail_url: thumbnailUrl,
                configuracoes: {
                    todas_funcoes: document.getElementById('funcao-todas').checked,
                    funcoes_selecionadas: document.getElementById('funcao-selecionadas').checked
                }
            })
        });
        
        if (!response.ok) {
            throw new Error('Erro ao criar questionário');
        }
        
        const result = await response.json();
        
        fecharModalNovoQuestionario();
        showToast('Questionário criado com sucesso!', 'success');
        
        // Abrir o editor do questionário
        abrirQuestionario(result.id);
        
    } catch (error) {
        console.error('Erro ao criar questionário:', error);
        showToast('Erro ao criar questionário. Tente novamente.', 'error');
    }
}

async function criarQuestionario() {
    await criarQuestionarioComCategoria();
}

// Estado global do editor de questionários
let currentQuestionarioId = null;
let currentSecoes = [];
let currentPerguntas = [];
let selectedPerguntaId = null;
let sidebarConfigAberta = false;

async function abrirQuestionario(id) {
    console.log('[Editor] Abrindo questionário:', id);
    
    try {
        const token = localStorage.getItem('authToken');
        console.log('[Editor] Token presente:', !!token);
        
        if (!token) {
            showToast('Faça login para editar questionários', 'error');
            return;
        }
        
        console.log('[Editor] Carregando dados do questionário...');
        
        // Carregar dados do questionário
        const response = await fetch(`/questionarios/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('[Editor] Response status:', response.status);
        
        if (!response.ok) {
            throw new Error('Erro ao carregar questionário');
        }
        
        const questionario = await response.json();
        console.log('[Editor] Questionário carregado:', questionario);
        
        // Atualizar estado global
        currentQuestionarioId = id;
        currentPerguntas = questionario.perguntas || [];
        
        console.log('[Editor] Navegando para o editor...');
        // Navegar para o editor
        switchAutomacaoView('questionario-editor');
        
        console.log('[Editor] Preenchendo formulário...');
        // Aguardar DOM ser renderizado
        setTimeout(() => {
            const tituloInput = document.getElementById('questionario-titulo-editor');
            const descricaoInput = document.getElementById('questionario-descricao-editor');
            const statusSelect = document.getElementById('questionario-status-editor');
            const breadcrumb = document.getElementById('questionario-editor-titulo-breadcrumb');
            
            console.log('[Editor] Elementos encontrados:', {
                titulo: !!tituloInput,
                descricao: !!descricaoInput,
                status: !!statusSelect,
                breadcrumb: !!breadcrumb
            });
            
            if (tituloInput) tituloInput.value = questionario.titulo || '';
            if (descricaoInput) descricaoInput.value = questionario.descricao || '';
            if (statusSelect) statusSelect.value = questionario.status || 'rascunho';
            if (breadcrumb) breadcrumb.textContent = questionario.titulo || 'Novo Questionário';
            
            // Renderizar elementos da sidebar
            console.log('[Editor] Renderizando elementos da sidebar...');
            renderElements();
            
            // Renderizar perguntas
            console.log('[Editor] Renderizando perguntas...');
            renderPerguntas();
            
            // Configurar drag and drop
            console.log('[Editor] Configurando drag and drop...');
            setupDragAndDrop();
            
            console.log('[Editor] Editor carregado com sucesso!');
        }, 100);
        
    } catch (error) {
        console.error('[Editor] Erro ao abrir questionário:', error);
        showToast('Erro ao carregar questionário. Tente novamente.', 'error');
    }
}

function voltarParaQuestionarios() {
    switchAutomacaoView('questionarios');
    currentQuestionarioId = null;
    currentPerguntas = [];
    selectedPerguntaId = null;
}

function renderPerguntas() {
    const lista = document.getElementById('perguntas-lista');
    
    if (currentSecoes.length === 0) {
        lista.innerHTML = `
            <div class="perguntas-empty-state">
                <i class="fas fa-arrow-right"></i>
                <p>Arraste ou clique em um elemento da direita para adicionar ao questionário</p>
            </div>
        `;
        atualizarContadoresEditor();
        return;
    }
    
    // Renderizar todas as seções
    lista.innerHTML = currentSecoes.map((secao, secaoIndex) => renderSecao(secao, secaoIndex)).join('');
    atualizarContadoresEditor();
    configurarDragAndDropSecoes();
}

function renderSecao(secao, secaoIndex) {
    const totalSecoes = currentSecoes.length;
    const perguntasSecao = secao.perguntas || [];
    
    return `
        <div class="questionario-secao" data-secao-id="${secao.id}">
            <div class="secao-header">
                <div class="secao-numero">
                    <i class="fas fa-ellipsis-v"></i>
                    <span>Seção ${secaoIndex + 1} de ${totalSecoes}</span>
                    <div class="secao-menu-container">
                        <button class="btn-secao-menu" onclick="event.stopPropagation(); toggleSecaoMenu('${secao.id}')">
                            <i class="fas fa-ellipsis-h"></i>
                        </button>
                        <div class="secao-menu-dropdown" id="secao-menu-${secao.id}" style="display: none;">
                            <button class="menu-item" onclick="event.stopPropagation(); adicionarNovaSecao()">
                                <i class="fas fa-plus"></i>
                                <span>Nova seção</span>
                            </button>
                            <button class="menu-item" onclick="event.stopPropagation(); moverSecoes('${secao.id}')">
                                <i class="fas fa-arrows-alt-v"></i>
                                <span>Mover seções</span>
                            </button>
                            <button class="menu-item" onclick="event.stopPropagation(); clonarSecao('${secao.id}')">
                                <i class="fas fa-clone"></i>
                                <span>Clone</span>
                            </button>
                            <button class="menu-item menu-item-danger" onclick="event.stopPropagation(); excluirSecao('${secao.id}')">
                                <i class="fas fa-trash"></i>
                                <span>Excluir</span>
                            </button>
                        </div>
                    </div>
                </div>
                <input 
                    type="text" 
                    class="secao-titulo-input" 
                    value="${secao.titulo || ''}" 
                    placeholder="Digite um título para a seção (opcional)"
                    onchange="atualizarTituloSecao('${secao.id}', this.value)"
                    onclick="event.stopPropagation()"
                />
            </div>
            
            <div class="secao-perguntas-container">
                ${perguntasSecao.length === 0 ? `
                    <div class="secao-empty-state">
                        <i class="fas fa-arrow-down"></i>
                        <p>Arraste um elemento aqui</p>
                    </div>
                ` : perguntasSecao.map((pergunta, index) => renderPerguntaCardComEdicao(pergunta, index, secao.id)).join('')}
            </div>
            
            <div class="secao-drop-zone" 
                 data-secao-id="${secao.id}"
                 ondragover="event.preventDefault(); event.currentTarget.classList.add('drag-over')"
                 ondragleave="event.currentTarget.classList.remove('drag-over')"
                 ondrop="dropNaSecao(event, '${secao.id}')">
                <i class="fas fa-plus"></i>
                <span>Arrastar elemento aqui para adicionar nesta seção</span>
            </div>
        </div>
    `;
}

function renderPerguntaCardComEdicao(pergunta, index, secaoId) {
    const isSelected = selectedPerguntaId === pergunta.id;
    
    // Renderizar configurações IN-CARD baseado no tipo
    const configHtml = isSelected ? renderConfiguracaoInCard(pergunta) : '';
    
    return `
        <div class="pergunta-card-nova ${isSelected ? 'selected' : ''}" 
             data-pergunta-id="${pergunta.id}"
             data-secao-id="${secaoId}"
             onclick="selecionarPerguntaCard('${pergunta.id}')">
            
            <div class="pergunta-card-header-nova">
                <div class="pergunta-numero-nova">
                    <i class="fas fa-grip-vertical"></i>
                    <span class="numero-label">${index + 1}</span>
                    <i class="fas ${getTipoIcon(pergunta.tipo)}" style="margin-left: 8px; color: #62b1ca;"></i>
                    <input 
                        type="text" 
                        class="pergunta-titulo-input" 
                        value="${pergunta.titulo || pergunta.texto || ''}"
                        placeholder="Digite a pergunta"
                        onchange="atualizarTituloPergunta('${pergunta.id}', this.value)"
                        onclick="event.stopPropagation()"
                    />
                    ${pergunta.obrigatoria ? '<span class="badge-requerido">REQUERIDO</span>' : ''}
                </div>
                <div class="pergunta-actions-nova">
                    <button class="btn-pergunta-icon" onclick="event.stopPropagation(); duplicarPergunta('${pergunta.id}')" title="Duplicar">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="btn-pergunta-icon" onclick="event.stopPropagation(); excluirPergunta('${pergunta.id}')" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            
            ${configHtml}
        </div>
    `;
}

function getTipoIcon(tipo) {
    const icons = {
        'escolha_unica': 'fa-check-circle',
        'escolha_multipla': 'fa-check-square',
        'resposta_textual': 'fa-font',
        'resposta_numerica': 'fa-hashtag',
        'classificacao': 'fa-star',
        'escala_linear': 'fa-sliders-h',
        'texto': 'fa-align-left',
        'imagem': 'fa-image',
        'assinatura': 'fa-signature',
        'problemas_musculares': 'fa-dumbbell',
        'problemas_osseos': 'fa-bone',
        'problemas_cardio': 'fa-heartbeat',
        'medicacao': 'fa-pills',
        'aprovacao_atividade': 'fa-clipboard-check',
        'medidas_corporais': 'fa-weight',
        'objetivo_treinamento': 'fa-bullseye'
    };
    return icons[tipo] || 'fa-question-circle';
}

function renderConfiguracaoInCard(pergunta) {
    const tipo = pergunta.tipo;
    const config = pergunta.configuracoes || {};
    
    // Configurações básicas para escolha única/múltipla
    if (tipo === 'escolha_unica' || tipo === 'escolha_multipla') {
        return `
            <div class="config-incard">
                <div class="config-section">
                    <label class="config-label">VISUALIZAÇÃO</label>
                    <div class="opcoes-lista-incard">
                        ${(pergunta.opcoes || []).map((op, i) => `
                            <div class="opcao-item-incard">
                                <i class="fas ${tipo === 'escolha_unica' ? 'fa-circle' : 'fa-square'}" style="font-size: 0.7rem; color: #999;"></i>
                                <input 
                                    type="text" 
                                    class="opcao-input-incard" 
                                    value="${op.texto}" 
                                    placeholder="Opção ${i + 1}"
                                    onchange="atualizarOpcaoPergunta('${pergunta.id}', ${i}, this.value)"
                                    onclick="event.stopPropagation()"
                                />
                                <button class="btn-remover-opcao" onclick="event.stopPropagation(); removerOpcao('${pergunta.id}', ${i})">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        `).join('')}
                        <button class="btn-adicionar-opcao" onclick="event.stopPropagation(); adicionarOpcao('${pergunta.id}')">
                            <i class="fas fa-plus"></i>
                            Adicionar opção
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Configurações para escala linear
    if (tipo === 'escala_linear') {
        return `
            <div class="config-incard">
                <div class="config-section">
                    <label class="config-label">VISUALIZAÇÃO</label>
                    <div class="escala-visual">
                        ${[1,2,3,4,5,6,7,8,9,10].map(num => `
                            <div class="escala-numero">${num}</div>
                        `).join('')}
                    </div>
                    <div class="escala-labels">
                        <input type="text" class="escala-label-input" placeholder="Label mínimo" value="${config.labelMin || ''}" onchange="atualizarConfigEscala('${pergunta.id}', 'labelMin', this.value)" onclick="event.stopPropagation()"/>
                        <input type="text" class="escala-label-input" placeholder="Label máximo" value="${config.labelMax || ''}" onchange="atualizarConfigEscala('${pergunta.id}', 'labelMax', this.value)" onclick="event.stopPropagation()"/>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Configurações para número
    if (tipo === 'resposta_numerica') {
        return `
            <div class="config-incard">
                <div class="config-section">
                    <label class="config-label">VISUALIZAÇÃO</label>
                    <input type="number" class="numero-exemplo-input" placeholder="Coloque o seu número" disabled />
                    <div class="numero-range" style="margin-top: 12px; display: flex; gap: 12px;">
                        <input type="number" class="numero-min-input" placeholder="Mínimo" value="${config.min || ''}" onchange="atualizarConfigNumero('${pergunta.id}', 'min', this.value)" onclick="event.stopPropagation()"/>
                        <input type="number" class="numero-max-input" placeholder="Máximo" value="${config.max || ''}" onchange="atualizarConfigNumero('${pergunta.id}', 'max', this.value)" onclick="event.stopPropagation()"/>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Configurações para problemas musculares (ATIVIDADE FÍSICA)
    if (tipo === 'problemas_musculares') {
        return `
            <div class="config-incard">
                <div class="config-section">
                    <label class="config-label">VISUALIZAÇÃO</label>
                    <div class="sim-nao-buttons">
                        <button class="btn-sim-nao active"><i class="fas fa-circle"></i> Sim</button>
                        <button class="btn-sim-nao"><i class="far fa-circle"></i> Não</button>
                    </div>
                    <div class="musculos-diagram" style="margin-top: 16px;">
                        <p style="font-size: 13px; color: #666; margin-bottom: 8px;">Selecione os músculos afetados</p>
                        <div style="background: #f5f5f5; padding: 40px; border-radius: 8px; text-align: center;">
                            <i class="fas fa-male" style="font-size: 80px; color: #ccc;"></i>
                            <p style="font-size: 12px; color: #999; margin-top: 12px;">Diagrama muscular interativo</p>
                        </div>
                        <div class="notas-section" style="margin-top: 16px;">
                            <label style="font-size: 12px; color: #666; display: block; margin-bottom: 6px;">Notas</label>
                            <textarea class="notas-textarea" placeholder="Adicione observações..." rows="2" onclick="event.stopPropagation()"></textarea>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Problemas ósseos e articulares
    if (tipo === 'problemas_osseos') {
        return `
            <div class="config-incard">
                <div class="config-section">
                    <label class="config-label">VISUALIZAÇÃO</label>
                    <div class="sim-nao-buttons">
                        <button class="btn-sim-nao active"><i class="fas fa-circle"></i> Sim</button>
                        <button class="btn-sim-nao"><i class="far fa-circle"></i> Não</button>
                    </div>
                    <div style="margin-top: 16px;">
                        <p style="font-size: 13px; color: #666; margin-bottom: 8px;">Selecione as articulações afetadas</p>
                        <div style="background: #f5f5f5; padding: 30px; border-radius: 8px; text-align: center;">
                            <i class="fas fa-bone" style="font-size: 60px; color: #ccc;"></i>
                            <p style="font-size: 12px; color: #999; margin-top: 12px;">Diagrama esquelético interativo</p>
                        </div>
                        <div class="notas-section" style="margin-top: 16px;">
                            <label style="font-size: 12px; color: #666; display: block; margin-bottom: 6px;">Notas</label>
                            <textarea class="notas-textarea" placeholder="Adicione observações..." rows="2" onclick="event.stopPropagation()"></textarea>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Problemas cardiorrespiratórios
    if (tipo === 'problemas_cardio') {
        return `
            <div class="config-incard">
                <div class="config-section">
                    <label class="config-label">VISUALIZAÇÃO</label>
                    <div class="sim-nao-buttons">
                        <button class="btn-sim-nao active"><i class="fas fa-circle"></i> Sim</button>
                        <button class="btn-sim-nao"><i class="far fa-circle"></i> Não</button>
                    </div>
                    <div style="margin-top: 16px; padding: 16px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ff9800;">
                        <div style="display: flex; align-items: flex-start; gap: 12px;">
                            <i class="fas fa-exclamation-triangle" style="font-size: 20px; color: #ff9800;"></i>
                            <div>
                                <p style="font-size: 13px; font-weight: 600; color: #333; margin: 0 0 4px 0;">Atenção</p>
                                <p style="font-size: 12px; color: #666; margin: 0; line-height: 1.5;">Problemas cardiorrespiratórios requerem acompanhamento médico especializado antes de iniciar atividades físicas.</p>
                            </div>
                        </div>
                    </div>
                    <div class="notas-section" style="margin-top: 16px;">
                        <label style="font-size: 12px; color: #666; display: block; margin-bottom: 6px;">Especifique o problema</label>
                        <textarea class="notas-textarea" placeholder="Descreva o problema cardiorrespiratório..." rows="3" onclick="event.stopPropagation()"></textarea>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Medicação
    if (tipo === 'medicacao') {
        return `
            <div class="config-incard">
                <div class="config-section">
                    <label class="config-label">VISUALIZAÇÃO</label>
                    <div class="sim-nao-buttons">
                        <button class="btn-sim-nao active"><i class="fas fa-circle"></i> Sim</button>
                        <button class="btn-sim-nao"><i class="far fa-circle"></i> Não</button>
                    </div>
                    <div class="notas-section" style="margin-top: 16px;">
                        <label style="font-size: 12px; color: #666; display: block; margin-bottom: 6px;">Qual(is) medicação(ões)?</label>
                        <textarea class="notas-textarea" placeholder="Liste os medicamentos e dosagens..." rows="3" onclick="event.stopPropagation()"></textarea>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Aprovação para atividade física
    if (tipo === 'aprovacao_atividade') {
        return `
            <div class="config-incard">
                <div class="config-section">
                    <label class="config-label">VISUALIZAÇÃO</label>
                    <div class="sim-nao-buttons">
                        <button class="btn-sim-nao active"><i class="fas fa-circle"></i> Sim</button>
                        <button class="btn-sim-nao"><i class="far fa-circle"></i> Não</button>
                    </div>
                    <div style="margin-top: 16px; padding: 16px; background: #e8f5e9; border-radius: 8px; border-left: 4px solid #4caf50;">
                        <div style="display: flex; align-items: flex-start; gap: 12px;">
                            <i class="fas fa-clipboard-check" style="font-size: 20px; color: #4caf50;"></i>
                            <div>
                                <p style="font-size: 13px; font-weight: 600; color: #333; margin: 0 0 4px 0;">Aprovação Médica</p>
                                <p style="font-size: 12px; color: #666; margin: 0; line-height: 1.5;">É importante ter aprovação médica antes de iniciar qualquer programa de atividade física.</p>
                            </div>
                        </div>
                    </div>
                    <div class="notas-section" style="margin-top: 16px;">
                        <label style="font-size: 12px; color: #666; display: block; margin-bottom: 6px;">Observações médicas</label>
                        <textarea class="notas-textarea" placeholder="Restrições ou recomendações..." rows="2" onclick="event.stopPropagation()"></textarea>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Medidas corporais
    if (tipo === 'medidas_corporais') {
        return `
            <div class="config-incard">
                <div class="config-section">
                    <label class="config-label">VISUALIZAÇÃO</label>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <label style="font-size: 11px; color: #999; display: block; margin-bottom: 4px;">Peso (kg)</label>
                            <input type="number" class="numero-exemplo-input" placeholder="70" disabled />
                        </div>
                        <div>
                            <label style="font-size: 11px; color: #999; display: block; margin-bottom: 4px;">Altura (cm)</label>
                            <input type="number" class="numero-exemplo-input" placeholder="170" disabled />
                        </div>
                        <div>
                            <label style="font-size: 11px; color: #999; display: block; margin-bottom: 4px;">Cintura (cm)</label>
                            <input type="number" class="numero-exemplo-input" placeholder="80" disabled />
                        </div>
                        <div>
                            <label style="font-size: 11px; color: #999; display: block; margin-bottom: 4px;">Quadril (cm)</label>
                            <input type="number" class="numero-exemplo-input" placeholder="95" disabled />
                        </div>
                    </div>
                    <div style="margin-top: 12px; padding: 12px; background: #f0f9fc; border-radius: 6px; text-align: center;">
                        <p style="font-size: 11px; color: #666; margin: 0;">IMC calculado automaticamente</p>
                        <p style="font-size: 20px; font-weight: 600; color: #62b1ca; margin: 4px 0 0 0;">24.2</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Objetivo de treinamento
    if (tipo === 'objetivo_treinamento') {
        return `
            <div class="config-incard">
                <div class="config-section">
                    <label class="config-label">VISUALIZAÇÃO</label>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div class="objetivo-card">
                            <i class="fas fa-fire" style="font-size: 24px; color: #ff6b6b; margin-bottom: 8px;"></i>
                            <p style="font-size: 13px; font-weight: 600; margin: 0;">Perder peso</p>
                        </div>
                        <div class="objetivo-card">
                            <i class="fas fa-dumbbell" style="font-size: 24px; color: #62b1ca; margin-bottom: 8px;"></i>
                            <p style="font-size: 13px; font-weight: 600; margin: 0;">Ganhar massa</p>
                        </div>
                        <div class="objetivo-card">
                            <i class="fas fa-heartbeat" style="font-size: 24px; color: #4caf50; margin-bottom: 8px;"></i>
                            <p style="font-size: 13px; font-weight: 600; margin: 0;">Saúde</p>
                        </div>
                        <div class="objetivo-card">
                            <i class="fas fa-running" style="font-size: 24px; color: #ff9800; margin-bottom: 8px;"></i>
                            <p style="font-size: 13px; font-weight: 600; margin: 0;">Performance</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Padrão para outros tipos
    return `
        <div class="config-incard">
            <div class="config-section">
                <label class="config-label">VISUALIZAÇÃO</label>
                <input type="text" class="input-exemplo" placeholder="Resposta do usuário aparecerá aqui" disabled />
            </div>
        </div>
    `;
}

function renderPerguntaCard(pergunta, index) {
    const tiposIcons = {
        'texto_curto': 'fa-font',
        'texto_longo': 'fa-align-left',
        'multipla_escolha': 'fa-list-ul',
        'selecao_multipla': 'fa-check-double',
        'escala_likert': 'fa-star-half-alt',
        'data': 'fa-calendar-alt',
        'numero': 'fa-hashtag'
    };
    
    const tiposNomes = {
        'texto_curto': 'Texto Curto',
        'texto_longo': 'Texto Longo',
        'multipla_escolha': 'Múltipla Escolha',
        'selecao_multipla': 'Seleção Múltipla',
        'escala_likert': 'Escala Likert',
        'data': 'Data',
        'numero': 'Número'
    };
    
    const icon = tiposIcons[pergunta.tipo] || 'fa-question';
    const tipoNome = tiposNomes[pergunta.tipo] || pergunta.tipo;
    
    let opcoesHtml = '';
    if (pergunta.opcoes && pergunta.opcoes.length > 0) {
        opcoesHtml = `
            <div class="pergunta-opcoes">
                ${pergunta.opcoes.map(op => `
                    <div class="pergunta-opcao">
                        <i class="fas fa-circle" style="font-size: 0.4rem;"></i>
                        <span>${op.texto}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    return `
        <div class="pergunta-card ${selectedPerguntaId === pergunta.id ? 'selected' : ''}" 
             data-pergunta-id="${pergunta.id}"
             onclick="selecionarPergunta('${pergunta.id}')">
            <div class="pergunta-card-header">
                <div class="pergunta-numero">
                    <i class="fas fa-grip-vertical pergunta-drag-handle"></i>
                    <span>PERGUNTA ${index + 1}</span>
                    <span class="pergunta-tipo-badge">${tipoNome}</span>
                </div>
                <div class="pergunta-actions">
                    <button class="btn-pergunta-action" onclick="event.stopPropagation(); duplicarPergunta('${pergunta.id}')" title="Duplicar">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="btn-pergunta-action" onclick="event.stopPropagation(); excluirPergunta('${pergunta.id}')" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="pergunta-texto">${pergunta.texto}</div>
            ${opcoesHtml}
        </div>
    `;
}

function adicionarPergunta(tipo) {
    // Criar primeira seção se não existir nenhuma
    if (currentSecoes.length === 0) {
        criarNovaSecao('Seção 1');
    }
    
    // Adicionar à primeira seção
    const primeiraSecao = currentSecoes[0];
    const novaPergunta = {
        id: `pergunta_${Date.now()}`,
        tipo: tipo,
        titulo: getTituloDefaultPorTipo(tipo),
        texto: getTituloDefaultPorTipo(tipo),
        obrigatoria: false,
        ordem: primeiraSecao.perguntas.length,
        configuracoes: {},
        opcoes: (tipo === 'escolha_unica' || tipo === 'escolha_multipla') ? [
            { texto: 'Opção 1', ordem: 0 },
            { texto: 'Opção 2', ordem: 1 }
        ] : []
    };
    
    primeiraSecao.perguntas.push(novaPergunta);
    renderPerguntas();
    selecionarPerguntaCard(novaPergunta.id);
    
    showToast('Elemento adicionado!', 'success');
}

function getTituloDefaultPorTipo(tipo) {
    const titulos = {
        'escolha_unica': 'Nova pergunta de escolha única',
        'escolha_multipla': 'Nova pergunta de escolha múltipla',
        'resposta_textual': 'Nova pergunta de texto',
        'resposta_numerica': 'Nova pergunta numérica',
        'classificacao': 'Avalie de 1 a 5',
        'escala_linear': 'Avalie de 1 a 10',
        'texto': 'Texto informativo',
        'imagem': 'Inserir imagem',
        'assinatura': 'Assinatura digital',
        'problemas_musculares': 'Você tem ou já teve problemas musculares?',
        'problemas_osseos': 'Problemas ósseos e articulares?',
        'problemas_cardio': 'Problemas cardiorrespiratórios?',
        'medicacao': 'Você toma alguma medicação?',
        'aprovacao_atividade': 'Você tem aprovação médica para fazer atividade física?',
        'medidas_corporais': 'Medidas corporais',
        'objetivo_treinamento': 'Objetivo de treinamento'
    };
    return titulos[tipo] || 'Nova pergunta';
}

function criarNovaSecao(titulo = null) {
    const novaSecao = {
        id: `secao_${Date.now()}`,
        titulo: titulo || `Seção ${currentSecoes.length + 1}`,
        descricao: null,
        ordem: currentSecoes.length,
        perguntas: []
    };
    currentSecoes.push(novaSecao);
    return novaSecao;
}

function selecionarPerguntaCard(id) {
    selectedPerguntaId = id;
    renderPerguntas();
    abrirSidebarConfiguracao(id);
}

function selecionarPergunta(id) {
    selecionarPerguntaCard(id);
}

function atualizarTituloSecao(secaoId, novoTitulo) {
    const secao = currentSecoes.find(s => s.id === secaoId);
    if (secao) {
        secao.titulo = novoTitulo;
    }
}

function toggleSecaoMenu(secaoId) {
    const menu = document.getElementById(`secao-menu-${secaoId}`);
    if (!menu) return;
    
    // Fechar todos os outros menus
    document.querySelectorAll('.secao-menu-dropdown').forEach(m => {
        if (m.id !== `secao-menu-${secaoId}`) {
            m.style.display = 'none';
        }
    });
    
    // Toggle do menu atual
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    
    // Fechar ao clicar fora
    setTimeout(() => {
        const closeHandler = (e) => {
            if (!e.target.closest('.secao-menu-container')) {
                menu.style.display = 'none';
                document.removeEventListener('click', closeHandler);
            }
        };
        document.addEventListener('click', closeHandler);
    }, 10);
}

function adicionarNovaSecao() {
    criarNovaSecao();
    renderPerguntas();
    showToast('Nova seção adicionada!', 'success');
}

function moverSecoes(secaoId) {
    // TODO: Implementar interface para mover seções (drag and drop ou setas)
    showToast('Funcionalidade em desenvolvimento', 'info');
}

function clonarSecao(secaoId) {
    const secao = currentSecoes.find(s => s.id === secaoId);
    if (!secao) return;
    
    const newSecaoId = `secao_${Date.now()}`;
    
    const secaoClonada = {
        id: newSecaoId,
        titulo: `${secao.titulo} (Cópia)`,
        descricao: secao.descricao,
        ordem: currentSecoes.length,
        perguntas: secao.perguntas.map((p, index) => ({
            ...p,
            id: `pergunta_${Date.now()}_${index}_${Math.random()}`,
            secao_id: newSecaoId
        }))
    };
    
    currentSecoes.push(secaoClonada);
    renderPerguntas();
    showToast('Seção clonada com sucesso!', 'success');
}

function excluirSecao(secaoId) {
    const secao = currentSecoes.find(s => s.id === secaoId);
    if (!secao) return;
    
    const numPerguntas = secao.perguntas.length;
    const mensagem = numPerguntas > 0 
        ? `Deseja realmente excluir esta seção? Isso removerá ${numPerguntas} pergunta(s).`
        : 'Deseja realmente excluir esta seção?';
    
    if (confirm(mensagem)) {
        const index = currentSecoes.findIndex(s => s.id === secaoId);
        if (index > -1) {
            currentSecoes.splice(index, 1);
            renderPerguntas();
            showToast('Seção excluída!', 'success');
        }
    }
}

function atualizarTituloPergunta(perguntaId, novoTitulo) {
    for (let secao of currentSecoes) {
        const pergunta = secao.perguntas.find(p => p.id === perguntaId);
        if (pergunta) {
            pergunta.titulo = novoTitulo;
            pergunta.texto = novoTitulo;
            break;
        }
    }
}

function atualizarOpcaoPergunta(perguntaId, index, novoTexto) {
    for (let secao of currentSecoes) {
        const pergunta = secao.perguntas.find(p => p.id === perguntaId);
        if (pergunta && pergunta.opcoes && pergunta.opcoes[index]) {
            pergunta.opcoes[index].texto = novoTexto;
            break;
        }
    }
}

function adicionarOpcao(perguntaId) {
    for (let secao of currentSecoes) {
        const pergunta = secao.perguntas.find(p => p.id === perguntaId);
        if (pergunta) {
            if (!pergunta.opcoes) pergunta.opcoes = [];
            pergunta.opcoes.push({
                texto: `Opção ${pergunta.opcoes.length + 1}`,
                ordem: pergunta.opcoes.length
            });
            renderPerguntas();
            break;
        }
    }
}

function removerOpcao(perguntaId, index) {
    for (let secao of currentSecoes) {
        const pergunta = secao.perguntas.find(p => p.id === perguntaId);
        if (pergunta && pergunta.opcoes) {
            pergunta.opcoes.splice(index, 1);
            renderPerguntas();
            break;
        }
    }
}

function atualizarConfigEscala(perguntaId, campo, valor) {
    for (let secao of currentSecoes) {
        const pergunta = secao.perguntas.find(p => p.id === perguntaId);
        if (pergunta) {
            if (!pergunta.configuracoes) pergunta.configuracoes = {};
            pergunta.configuracoes[campo] = valor;
            break;
        }
    }
}

function atualizarConfigNumero(perguntaId, campo, valor) {
    for (let secao of currentSecoes) {
        const pergunta = secao.perguntas.find(p => p.id === perguntaId);
        if (pergunta) {
            if (!pergunta.configuracoes) pergunta.configuracoes = {};
            pergunta.configuracoes[campo] = valor;
            break;
        }
    }
}

function configurarDragAndDropSecoes() {
    // Implementar drag-and-drop entre seções (a ser implementado)
}

function dropNaSecao(event, secaoId) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
    
    const tipo = event.dataTransfer.getData('tipo');
    if (tipo) {
        const secao = currentSecoes.find(s => s.id === secaoId);
        if (secao) {
            const novaPergunta = {
                id: `pergunta_${Date.now()}`,
                tipo: tipo,
                titulo: getTituloDefaultPorTipo(tipo),
                texto: getTituloDefaultPorTipo(tipo),
                obrigatoria: false,
                ordem: secao.perguntas.length,
                configuracoes: {},
                opcoes: (tipo === 'escolha_unica' || tipo === 'escolha_multipla') ? [
                    { texto: 'Opção 1', ordem: 0 },
                    { texto: 'Opção 2', ordem: 1 }
                ] : []
            };
            
            secao.perguntas.push(novaPergunta);
            renderPerguntas();
            selecionarPerguntaCard(novaPergunta.id);
            showToast('Elemento adicionado à seção!', 'success');
        }
    }
}

function toggleSecaoMenu(secaoId) {
    // Implementar menu de opções da seção (a ser implementado)
    showToast('Menu da seção em desenvolvimento', 'info');
}

function abrirSidebarConfiguracao(perguntaId) {
    // Implementar sidebar de configurações avançadas (Tarefa 5)
    console.log('Abrir configurações para:', perguntaId);
}

function renderPropriedadesPergunta(id) {
    const pergunta = currentPerguntas.find(p => p.id === id);
    if (!pergunta) return;
    
    const container = document.getElementById('propriedades-container');
    
    let opcoesEditor = '';
    if (pergunta.tipo === 'multipla_escolha' || pergunta.tipo === 'selecao_multipla') {
        opcoesEditor = `
            <div class="propriedade-group">
                <h4>Opções de Resposta</h4>
                <div class="opcoes-editor">
                    ${(pergunta.opcoes || []).map((opcao, index) => `
                        <div class="opcao-input-row">
                            <input type="text" value="${opcao.texto}" 
                                   onchange="atualizarOpcao('${id}', ${index}, this.value)"
                                   placeholder="Opção ${index + 1}">
                            <button class="btn-pergunta-action" onclick="removerOpcao('${id}', ${index})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `).join('')}
                    <button class="btn-add-opcao" onclick="adicionarOpcao('${id}')">
                        <i class="fas fa-plus"></i> Adicionar Opção
                    </button>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = `
        <div class="propriedades-form">
            <div class="propriedade-group">
                <h4>Texto da Pergunta</h4>
                <input type="text" class="propriedade-input" value="${pergunta.texto}"
                       onchange="atualizarTextoPergunta('${id}', this.value)"
                       placeholder="Digite a pergunta">
            </div>
            
            ${opcoesEditor}
            
            <div class="propriedade-group">
                <h4>Configurações</h4>
                <label class="propriedade-checkbox">
                    <input type="checkbox" ${pergunta.obrigatoria ? 'checked' : ''}
                           onchange="toggleObrigatoria('${id}', this.checked)">
                    Resposta obrigatória
                </label>
            </div>
        </div>
    `;
}

function atualizarTextoPergunta(id, texto) {
    const pergunta = currentPerguntas.find(p => p.id === id);
    if (pergunta) {
        pergunta.texto = texto;
        renderPerguntas();
    }
}

function toggleObrigatoria(id, obrigatoria) {
    const pergunta = currentPerguntas.find(p => p.id === id);
    if (pergunta) {
        pergunta.obrigatoria = obrigatoria;
    }
}

function atualizarOpcao(perguntaId, index, texto) {
    const pergunta = currentPerguntas.find(p => p.id === perguntaId);
    if (pergunta && pergunta.opcoes[index]) {
        pergunta.opcoes[index].texto = texto;
        renderPerguntas();
    }
}

function adicionarOpcao(perguntaId) {
    const pergunta = currentPerguntas.find(p => p.id === perguntaId);
    if (pergunta) {
        const novaOpcao = {
            texto: `Opção ${pergunta.opcoes.length + 1}`,
            ordem: pergunta.opcoes.length
        };
        pergunta.opcoes.push(novaOpcao);
        renderPropriedadesPergunta(perguntaId);
        renderPerguntas();
    }
}

function removerOpcao(perguntaId, index) {
    const pergunta = currentPerguntas.find(p => p.id === perguntaId);
    if (pergunta && pergunta.opcoes.length > 2) {
        pergunta.opcoes.splice(index, 1);
        renderPropriedadesPergunta(perguntaId);
        renderPerguntas();
    } else {
        showToast('É necessário pelo menos 2 opções', 'error');
    }
}

function duplicarPergunta(id) {
    const pergunta = currentPerguntas.find(p => p.id === id);
    if (pergunta) {
        const duplicada = {
            ...pergunta,
            id: `pergunta_${Date.now()}`,
            ordem: currentPerguntas.length
        };
        currentPerguntas.push(duplicada);
        renderPerguntas();
        showToast('Pergunta duplicada!', 'success');
    }
}

function excluirPergunta(id) {
    if (confirm('Deseja excluir esta pergunta?')) {
        currentPerguntas = currentPerguntas.filter(p => p.id !== id);
        if (selectedPerguntaId === id) {
            selectedPerguntaId = null;
            document.getElementById('propriedades-container').innerHTML = `
                <div class="propriedades-empty">
                    <i class="fas fa-hand-pointer"></i>
                    <p>Selecione uma pergunta para editar suas propriedades</p>
                </div>
            `;
            // Esconder divisor de propriedades
            const divider = document.getElementById('questionario-properties-divider');
            if (divider) {
                divider.style.display = 'none';
            }
        }
        renderPerguntas();
        showToast('Pergunta excluída!', 'success');
    }
}

// Elementos do editor de questionários
const ELEMENTOS_PADRAO = [
    { tipo: 'escolha_unica', label: 'Escolha única', icone: 'fa-circle-dot' },
    { tipo: 'escolha_multipla', label: 'Escolha múltipla', icone: 'fa-square-check' },
    { tipo: 'resposta_textual', label: 'Resposta textual', icone: 'fa-align-left' },
    { tipo: 'resposta_numerica', label: 'Resposta numérica', icone: 'fa-hashtag' },
    { tipo: 'classificacao', label: 'Classificação', icone: 'fa-star' },
    { tipo: 'escala_linear', label: 'Escala linear', icone: 'fa-sliders' },
    { tipo: 'texto', label: 'Texto', icone: 'fa-font' },
    { tipo: 'imagem', label: 'Imagem', icone: 'fa-image' },
    { tipo: 'assinatura', label: 'Assinatura', icone: 'fa-signature' }
];

const ELEMENTOS_ATIVIDADE_FISICA = [
    { tipo: 'problemas_musculares', label: 'Problemas musculares', icone: 'fa-dumbbell' },
    { tipo: 'problemas_osseos', label: 'Problemas ósseos e articulares', icone: 'fa-bone' },
    { tipo: 'problemas_cardio', label: 'Problemas cardiorrespiratórios', icone: 'fa-heart-pulse' },
    { tipo: 'medicacao', label: 'Medicação', icone: 'fa-pills' },
    { tipo: 'aprovacao_medica', label: 'Aprovação para prática de atividade física', icone: 'fa-hand-holding-medical' },
    { tipo: 'medidas_corporais', label: 'Medidas corporais', icone: 'fa-weight-scale' },
    { tipo: 'objetivo_treinamento', label: 'Objetivo de treinamento', icone: 'fa-bullseye' }
];

let currentElementTab = 'padrao';

function switchElementTab(tab) {
    currentElementTab = tab;
    
    // Atualizar botões de tabs
    document.querySelectorAll('.element-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    // Renderizar elementos da tab selecionada
    renderElements();
}

function renderElements() {
    console.log('[Editor] Renderizando elementos da tab:', currentElementTab);
    const container = document.getElementById('questionario-elements-container');
    if (!container) {
        console.log('[Editor] Container de elementos não encontrado!');
        return;
    }
    
    const elementos = currentElementTab === 'padrao' ? ELEMENTOS_PADRAO : ELEMENTOS_ATIVIDADE_FISICA;
    console.log('[Editor] Elementos a renderizar:', elementos.length);
    
    container.innerHTML = elementos.map(elemento => `
        <div class="element-card-new" 
             draggable="true" 
             data-tipo="${elemento.tipo}"
             onclick="adicionarPerguntaPorClick('${elemento.tipo}')">
            <i class="fas ${elemento.icone}"></i>
            <span>${elemento.label}</span>
        </div>
    `).join('');
    
    // Setup drag and drop para novos elementos
    setupElementDragHandlers();
}

function adicionarPerguntaPorClick(tipo) {
    adicionarPergunta(tipo);
}

function setupElementDragHandlers() {
    // Drag from sidebar
    document.querySelectorAll('.element-card-new').forEach(card => {
        card.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('tipo', card.dataset.tipo);
            e.stopPropagation();
        });
    });
}

function setupDragAndDrop() {
    // Setup drop zone
    const lista = document.getElementById('perguntas-lista');
    if (lista) {
        lista.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        
        lista.addEventListener('drop', (e) => {
            e.preventDefault();
            const tipo = e.dataTransfer.getData('tipo');
            if (tipo) {
                adicionarPergunta(tipo);
            }
        });
    }
    
    // Setup element drag handlers
    setupElementDragHandlers();
}

async function duplicarQuestionario(id) {
    if (!confirm('Deseja duplicar este questionário?')) return;
    
    const token = localStorage.getItem('authToken');
    if (!token) {
        showToast('Faça login para duplicar questionários', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/questionarios/${id}/duplicar`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Erro ao duplicar questionário');
        }
        
        showToast('Questionário duplicado com sucesso!', 'success');
        loadQuestionarios();
        
    } catch (error) {
        console.error('Erro ao duplicar questionário:', error);
        showToast('Erro ao duplicar questionário. Tente novamente.', 'error');
    }
}

async function excluirQuestionario(id) {
    if (!confirm('Tem certeza que deseja excluir este questionário? Esta ação não pode ser desfeita.')) return;
    
    const token = localStorage.getItem('authToken');
    if (!token) {
        showToast('Faça login para excluir questionários', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/questionarios/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Erro ao excluir questionário');
        }
        
        showToast('Questionário excluído com sucesso!', 'success');
        loadQuestionarios();
        
    } catch (error) {
        console.error('Erro ao excluir questionário:', error);
        showToast('Erro ao excluir questionário. Tente novamente.', 'error');
    }
}

async function alterarStatusQuestionario(id, novoStatus) {
    const token = localStorage.getItem('authToken');
    if (!token) {
        showToast('Faça login para alterar status', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/questionarios/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                status: novoStatus
            })
        });
        
        if (!response.ok) {
            throw new Error('Erro ao alterar status');
        }
        
        const statusTexto = {
            'publicado': 'publicado',
            'rascunho': 'marcado como rascunho',
            'arquivado': 'arquivado'
        }[novoStatus] || 'atualizado';
        
        showToast(`Questionário ${statusTexto} com sucesso!`, 'success');
        loadQuestionarios();
        
    } catch (error) {
        console.error('Erro ao alterar status:', error);
        showToast('Erro ao alterar status. Tente novamente.', 'error');
    }
    
    // Abrir página de detalhes
    setTimeout(() => {
        abrirJornadaDetalhes(novaJornada.id);
    }, 300);
}

function abrirJornada(id) {
    console.log('Abrindo jornada:', id);
    abrirJornadaDetalhes(id);
}

function abrirJornadaDetalhes(id) {
    // Buscar jornada no mock data
    const jornadas = window.mockJornadas || mockData.jornadas;
    const jornada = jornadas.find(j => j.id === id);
    
    if (!jornada) {
        showToast('Jornada não encontrada', 'error');
        return;
    }
    
    // Preencher informações da página
    document.getElementById('jornada-detalhes-nome-breadcrumb').textContent = jornada.nome;
    document.getElementById('jornada-detalhes-titulo').textContent = jornada.nome;
    document.getElementById('jornada-badge-grupo').textContent = jornada.grupo.toUpperCase();
    document.getElementById('jornada-badge-contatos').textContent = jornada.contatos || 0;
    
    // Atualizar imagem
    const imgElement = document.getElementById('jornada-detalhes-imagem');
    const containerElement = document.getElementById('jornada-detalhes-foto-container');
    if (jornada.imagem) {
        imgElement.src = jornada.imagem;
        imgElement.style.display = 'block';
        containerElement.style.background = 'none';
    } else {
        imgElement.style.display = 'none';
        containerElement.style.background = 'linear-gradient(135deg, #62b1ca 0%, #4a90a4 100%)';
    }
    
    // Renderizar barra de atividades
    const barraAtividades = document.getElementById('jornada-atividades-barra');
    barraAtividades.innerHTML = jornada.atividades.map((atividade, index) => `
        <div class="atividade-card ${index === 0 ? 'ativo' : ''}">
            <div class="atividade-icon">
                <i class="fas ${atividade.icon}"></i>
            </div>
            <div class="atividade-info">
                <span class="atividade-nome">${atividade.nome}</span>
                <span class="atividade-status">${atividade.status}</span>
            </div>
        </div>
    `).join('');
    
    // Navegar para página de detalhes
    switchAutomacaoView('jornada-detalhes');
}

function voltarParaJornadas() {
    switchAutomacaoView('jornadas');
}

function desativarJornada() {
    showToast('Jornada desativada com sucesso', 'success');
    voltarParaJornadas();
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

// Upload de logo da empresa
function handleLogoUpload(event) {
    const file = event.target.files[0];
    
    // Guard: se nenhum arquivo foi selecionado (usuário cancelou)
    if (!file) {
        return;
    }
    
    // Validar tipo de arquivo
    if (!file.type || !file.type.startsWith('image/')) {
        showToast('Por favor, selecione uma imagem válida', 'error');
        event.target.value = ''; // Limpar input
        return;
    }
    
    // Validar tamanho (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        showToast('Imagem muito grande. Máximo 2MB', 'error');
        event.target.value = ''; // Limpar input
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const logoImg = document.getElementById('company-logo-img');
        const logoText = document.getElementById('logo-text');
        
        if (!logoImg || !logoText) {
            showToast('Erro ao atualizar logo', 'error');
            return;
        }
        
        logoImg.src = e.target.result;
        logoImg.style.display = 'block';
        logoText.style.display = 'none';
        
        // Salvar no localStorage
        try {
            localStorage.setItem('company_logo', e.target.result);
            showToast('Logo atualizada com sucesso!', 'success');
        } catch (error) {
            showToast('Erro ao salvar logo. Imagem muito grande.', 'error');
            console.error('Erro ao salvar logo:', error);
        }
    };
    
    reader.onerror = function() {
        showToast('Erro ao ler arquivo de imagem', 'error');
        event.target.value = ''; // Limpar input
    };
    
    reader.readAsDataURL(file);
}

// Carregar logo salva ao iniciar
function loadSavedLogo() {
    const savedLogo = localStorage.getItem('company_logo');
    if (savedLogo) {
        const logoImg = document.getElementById('company-logo-img');
        const logoText = document.getElementById('logo-text');
        
        if (logoImg && logoText) {
            logoImg.src = savedLogo;
            logoImg.style.display = 'block';
            logoText.style.display = 'none';
        }
    }
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
            { id: 'programas', icon: 'fa-dumbbell', label: 'Fichas', action: 'switchTreinamentoView' },
            { id: 'exercicios', icon: 'fa-running', label: 'Exercícios', action: 'switchTreinamentoView' },
            { id: 'aulas', icon: 'fa-chalkboard-user', label: 'Aulas', action: 'switchTreinamentoView' }
        ]
    },
    automacao: {
        title: 'Automação',
        items: [
            { id: 'jornadas', icon: 'fa-route', label: 'Jornadas', action: 'switchAutomacaoView' },
            { id: 'questionarios', icon: 'fa-clipboard-question', label: 'Questionários', action: 'switchAutomacaoView' },
            { id: 'grupos', icon: 'fa-users', label: 'Grupos', action: 'switchAutomacaoView' },
            { id: 'atividades', icon: 'fa-tasks', label: 'Atividades', action: 'switchAutomacaoView' }
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

// Atualizar conteúdo da sidebar unificada baseado na página (estilo VIVIO)
function updateUnifiedSidebar(page) {
    const sidebar = document.getElementById('unified-sidebar');
    const sidebarContent = document.getElementById('unified-sidebar-content');
    const toggleIcon = document.getElementById('sidebar-toggle-icon-circle');
    
    if (!sidebar || !sidebarContent) return;
    
    // Verificar se a página tem configuração de sidebar
    const config = sidebarConfigs[page];
    
    if (config) {
        // Capturar estado hidden ANTES de remover a classe
        const wasHidden = sidebar.classList.contains('hidden');
        
        // Remover classe hidden (pode ter sido adicionada em páginas anteriores)
        sidebar.classList.remove('hidden');
        
        // Abrir automaticamente a sidebar ao navegar para página com subtabs
        sidebar.classList.remove('collapsed');
        unifiedSidebarCollapsed = false;
        
        // Atualizar ícone para chevron-left (aponta para esquerda quando aberta)
        if (toggleIcon) {
            toggleIcon.className = 'fas fa-chevron-left';
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
                <button class="unified-menu-item ${activeClass}" data-menu-action="${item.action}" data-menu-id="${item.id}">
                    <i class="fas ${item.icon}"></i>
                    <span>${item.label}</span>
                </button>
            `;
        });
        
        sidebarContent.innerHTML = html;
        
        // Adicionar event listeners para auto-fechar sidebar ao clicar em subtab
        const menuItems = sidebarContent.querySelectorAll('.unified-menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', function(event) {
                const action = this.getAttribute('data-menu-action');
                const id = this.getAttribute('data-menu-id');
                
                // Executar a ação original
                if (action && window[action]) {
                    window[action](id, event);
                }
                
                // Auto-fechar a sidebar após clicar
                if (!sidebar.classList.contains('collapsed')) {
                    toggleUnifiedSidebar();
                }
            });
        });
    } else {
        // Ocultar sidebar completamente para páginas sem configuração
        sidebar.classList.add('hidden');
    }
}

// Toggle da sidebar unificada (estilo VIVIO - sidebar no meio)
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
// aulaAtualId declarado na seção de AULAS (linha 3633)

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

// Renderizar Grade VIVIO - Horários de 6h a 22h (hora em hora)
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

// ============================================
// BIBLIOTECA DE EXERCÍCIOS
// ============================================

let exercicioAtualId = null;
let fotoUrlTemp = null;
let videoUrlTemp = null;

// ===== AULAS =====

let aulaAtualId = null;
let aulaFotoUrlTemp = null;
let aulaVideoUrlTemp = null;

// 1. Carregar lista de aulas
async function loadAulas() {
    if (!authToken) return;
    
    try {
        const response = await fetch(`${API_BASE}/aulas`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const aulas = await response.json();
            renderAulas(aulas);
        }
    } catch (error) {
        console.error('Erro ao carregar aulas:', error);
    }
}

// 2. Renderizar grid de aulas
function renderAulas(aulas) {
    const grid = document.getElementById('aulas-grid');
    const countElement = document.getElementById('aulas-count');
    
    if (!grid) return;
    
    if (countElement) {
        countElement.textContent = aulas.length;
    }
    
    if (aulas.length === 0) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><p>Nenhuma aula cadastrada</p></div>';
        return;
    }
    
    grid.innerHTML = aulas.map(aula => `
        <div class="exercicio-card" onclick="abrirEdicaoAula(${aula.id})">
            <div class="exercicio-thumbnail">
                ${aula.foto_url ? 
                    `<img src="${aula.foto_url}" alt="${aula.nome}">` : 
                    `<i class="fas fa-users exercicio-thumbnail-placeholder"></i>`
                }
            </div>
            <div class="exercicio-card-body">
                <div class="exercicio-nome">${aula.nome}</div>
                <div class="exercicio-proprietario">
                    <div>Tipo: ${aula.tipo || 'N/A'}</div>
                    <div>Nível: ${aula.nivel || 'N/A'}</div>
                    <div>Duração: ${aula.duracao || 'N/A'} min</div>
                </div>
            </div>
        </div>
    `).join('');
}

// 3. Abrir página de criação de nova aula
function abrirNovaAula() {
    console.log('abrirNovaAula chamado, authToken:', authToken ? 'presente' : 'ausente');
    
    if (!authToken) {
        showToast('Você precisa fazer login primeiro para criar aulas', 'warning');
        console.error('Tentativa de criar aula sem autenticação');
        return;
    }
    
    aulaAtualId = null;
    aulaFotoUrlTemp = null;
    aulaVideoUrlTemp = null;
    
    // Navegar para página de formulário de aula
    switchTreinamentoView('aula-form');
    
    const pageEdicao = document.getElementById('treinamento-aula-form');
    
    // Limpar todos os campos
    const headerNome = pageEdicao.querySelector('.exercicio-header-info h1');
    const headerSubtitulo = pageEdicao.querySelector('.exercicio-header-subtitulo');
    if (headerNome) headerNome.textContent = 'Nova Aula';
    if (headerSubtitulo) headerSubtitulo.textContent = 'Em criação';
    
    // Limpar campos do formulário
    const campoNome = document.getElementById('aula-nome');
    const campoDescricao = document.getElementById('aula-descricao');
    const campoDuracao = document.getElementById('aula-duracao');
    const campoCapacidade = document.getElementById('aula-capacidade');
    if (campoNome) campoNome.value = '';
    if (campoDescricao) campoDescricao.value = '';
    if (campoDuracao) campoDuracao.value = '';
    if (campoCapacidade) campoCapacidade.value = '';
    
    // Preencher automaticamente o criador com usuário logado
    const campoElaboradoPor = document.getElementById('aula-elaborado-por');
    if (campoElaboradoPor && currentUser) {
        campoElaboradoPor.value = currentUser.nome || currentUser.email;
    }
    
    // Limpar previews
    const previewFoto = document.getElementById('aula-preview-foto');
    const previewVideo = document.getElementById('aula-preview-video');
    
    if (previewFoto) {
        previewFoto.innerHTML = '<i class="fas fa-camera exercicio-foto-placeholder"></i>';
        previewFoto.onclick = () => document.getElementById('upload-foto-aula').click();
    }
    
    if (previewVideo) {
        const video = previewVideo.querySelector('video');
        if (video) video.src = '';
    }
}

// 4. Upload de foto da aula
async function uploadFotoAula(event) {
    if (!authToken) {
        showToast('Você precisa estar autenticado', 'warning');
        return;
    }
    
    const file = event.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch(`${API_BASE}/aulas/upload-foto`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            aulaFotoUrlTemp = data.url;
            
            const previewFoto = document.getElementById('aula-preview-foto');
            if (previewFoto) {
                previewFoto.innerHTML = `<img src="${data.url}" alt="Preview" style="width: 100%; height: 100%; object-fit: cover;">`;
                previewFoto.onclick = () => document.getElementById('upload-foto-aula').click();
            }
            
            showToast('Foto enviada com sucesso!', 'success');
        } else {
            showToast('Erro ao enviar foto', 'error');
        }
    } catch (error) {
        console.error('Erro no upload da foto:', error);
        showToast('Erro ao enviar foto', 'error');
    }
}

// 5. Upload de vídeo da aula
async function uploadVideoAula(event) {
    if (!authToken) {
        showToast('Você precisa estar autenticado', 'warning');
        return;
    }
    
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > 40 * 1024 * 1024) {
        showToast('O vídeo deve ter no máximo 40MB', 'warning');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch(`${API_BASE}/aulas/upload-video`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            aulaVideoUrlTemp = data.url;
            
            const previewVideo = document.getElementById('aula-preview-video');
            if (previewVideo) {
                const video = previewVideo.querySelector('video');
                if (video) {
                    video.src = data.url;
                    video.load();
                }
            }
            
            showToast('Vídeo enviado com sucesso!', 'success');
        } else {
            showToast('Erro ao enviar vídeo', 'error');
        }
    } catch (error) {
        console.error('Erro no upload do vídeo:', error);
        showToast('Erro ao enviar vídeo', 'error');
    }
}

// 6. Salvar aula (criar ou atualizar)
async function salvarAula() {
    console.log('salvarAula chamado, authToken:', authToken ? 'presente' : 'ausente');
    
    if (!authToken) {
        showToast('Você precisa fazer login primeiro para salvar aulas', 'warning');
        console.error('Tentativa de salvar aula sem autenticação');
        return;
    }
    
    // Coletar dados do formulário
    const nome = document.getElementById('aula-nome')?.value || '';
    const tipo = document.getElementById('aula-tipo')?.value || 'Cardio';
    const nivel = document.getElementById('aula-nivel')?.value || 'Todos os níveis';
    const duracao = document.getElementById('aula-duracao')?.value || '';
    const capacidade = document.getElementById('aula-capacidade')?.value || '';
    const descricao = document.getElementById('aula-descricao')?.value || '';
    
    // Validar campos obrigatórios
    if (!nome.trim()) {
        showToast('Por favor, preencha o nome da aula', 'warning');
        return;
    }
    
    try {
        const aulaData = {
            nome: nome.trim(),
            tipo: tipo,
            nivel: nivel,
            duracao: parseInt(duracao) || null,
            capacidade: parseInt(capacidade) || null,
            descricao: descricao.trim(),
            foto_url: aulaFotoUrlTemp || null,
            video_url: aulaVideoUrlTemp || null
        };
        
        let response;
        
        if (aulaAtualId) {
            // Atualizar aula existente
            response = await fetch(`${API_BASE}/aulas/${aulaAtualId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(aulaData)
            });
        } else {
            // Criar nova aula
            response = await fetch(`${API_BASE}/aulas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(aulaData)
            });
        }
        
        if (response.ok) {
            const aula = await response.json();
            console.log('Aula salva com sucesso:', aula);
            showToast(`Aula ${aulaAtualId ? 'atualizada' : 'criada'} com sucesso!`, 'success');
            voltarParaAulas();
        } else {
            const error = await response.json();
            console.error('Erro ao salvar aula:', response.status, error);
            showToast(error.detail || 'Erro ao salvar aula', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar aula:', error);
        showToast('Erro ao salvar aula', 'error');
    }
}

// 7. Voltar para lista de aulas
function voltarParaAulas() {
    // Navegar de volta para lista de aulas
    switchTreinamentoView('aulas');
    
    aulaAtualId = null;
    aulaFotoUrlTemp = null;
    aulaVideoUrlTemp = null;
    
    loadAulas();
}

// 8. Abrir página de edição de aula existente
async function abrirEdicaoAula(id) {
    if (!authToken) {
        showToast('Você precisa estar autenticado', 'warning');
        return;
    }
    
    aulaAtualId = id;
    
    // Navegar para página de formulário de aula
    switchTreinamentoView('aula-form');
    
    const pageEdicao = document.getElementById('treinamento-aula-form');
    
    try {
        const response = await fetch(`${API_BASE}/aulas/${id}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const aula = await response.json();
            
            // Preencher header
            const headerNome = pageEdicao.querySelector('.exercicio-header-info h1');
            const headerSubtitulo = pageEdicao.querySelector('.exercicio-header-subtitulo');
            if (headerNome) headerNome.textContent = aula.nome;
            if (headerSubtitulo) headerSubtitulo.textContent = `Tipo: ${aula.tipo}`;
            
            // Preencher formulário
            const campoNome = document.getElementById('aula-nome');
            const campoTipo = document.getElementById('aula-tipo');
            const campoNivel = document.getElementById('aula-nivel');
            const campoDuracao = document.getElementById('aula-duracao');
            const campoCapacidade = document.getElementById('aula-capacidade');
            const campoDescricao = document.getElementById('aula-descricao');
            
            if (campoNome) campoNome.value = aula.nome || '';
            if (campoTipo) campoTipo.value = aula.tipo || 'Cardio';
            if (campoNivel) campoNivel.value = aula.nivel || 'Todos os níveis';
            if (campoDuracao) campoDuracao.value = aula.duracao || '';
            if (campoCapacidade) campoCapacidade.value = aula.capacidade || '';
            if (campoDescricao) campoDescricao.value = aula.descricao || '';
            
            // Preview de foto
            const previewFoto = document.getElementById('aula-preview-foto');
            if (previewFoto && aula.foto_url) {
                previewFoto.innerHTML = `<img src="${aula.foto_url}" alt="${aula.nome}" style="width: 100%; height: 100%; object-fit: cover;">`;
                previewFoto.onclick = () => document.getElementById('upload-foto-aula').click();
                aulaFotoUrlTemp = aula.foto_url;
            }
            
            // Preview de vídeo
            const previewVideo = document.getElementById('aula-preview-video');
            if (previewVideo && aula.video_url) {
                const video = previewVideo.querySelector('video');
                if (video) {
                    video.src = aula.video_url;
                    video.load();
                }
                aulaVideoUrlTemp = aula.video_url;
            }
        } else {
            showToast('Erro ao carregar aula', 'error');
            voltarParaAulas();
        }
    } catch (error) {
        console.error('Erro ao carregar aula:', error);
        showToast('Erro ao carregar aula', 'error');
        voltarParaAulas();
    }
}

// 2. Carregar lista de exercícios do backend
async function loadExercicios() {
    if (!authToken) {
        showToast('Você precisa estar autenticado', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/exercicios`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const exercicios = await response.json();
            renderizarExercicios(exercicios);
            
            const contador = document.getElementById('exercicios-count');
            if (contador) {
                contador.textContent = exercicios.length;
            }
        } else {
            showToast('Erro ao carregar exercícios', 'error');
        }
    } catch (error) {
        console.error('Erro ao carregar exercícios:', error);
        showToast('Erro ao carregar exercícios', 'error');
    }
}

// 3. Renderizar cards de exercícios no grid
function renderizarExercicios(exercicios) {
    const grid = document.getElementById('exercicios-grid');
    
    if (!grid) return;
    
    if (!exercicios || exercicios.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-running"></i>
                <p>Nenhum exercício cadastrado ainda</p>
                <p class="empty-hint">Clique em "Novo Exercício" para começar</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = exercicios.map(ex => {
        const imagemUrl = ex.foto_url || '';
        const favoritoClass = ex.favorito ? 'active' : '';
        const iconClass = ex.tipo === 'Cardio' ? 'fa-running' : ex.tipo === 'Força' ? 'fa-dumbbell' : 'fa-heartbeat';
        
        return `
            <div class="exercicio-card" onclick="abrirEdicaoExercicio(${ex.id})">
                <div class="exercicio-thumbnail">
                    ${imagemUrl ? `<img src="${imagemUrl}" alt="${ex.nome}" onerror="this.innerHTML='<i class=\\'fas ${iconClass} exercicio-thumbnail-placeholder\\'></i>'">` : `<i class="fas ${iconClass} exercicio-thumbnail-placeholder"></i>`}
                </div>
                <div class="exercicio-card-body">
                    <div>
                        <div class="exercicio-nome">${ex.nome}</div>
                        <div class="exercicio-proprietario">Proprietário: ${ex.elaborado_por || 'Sem proprietário'}</div>
                    </div>
                    <div class="exercicio-card-footer">
                        <button class="btn-favorito ${favoritoClass}" onclick="event.stopPropagation(); toggleFavorito(${ex.id})">
                            <i class="fas fa-star"></i>
                        </button>
                        <button class="btn-ocultar" onclick="event.stopPropagation(); ocultarExercicio(${ex.id})">
                            OCULTAR
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 4. Abrir modal de criação de exercício
function abrirModalNovoExercicio() {
    const modal = document.getElementById('modal-novo-exercicio');
    if (!modal) return;
    
    const form = document.getElementById('form-novo-exercicio');
    if (form) form.reset();
    
    modal.style.display = 'block';
}

// 5. Fechar modal de criação
function fecharModalNovoExercicio() {
    const modal = document.getElementById('modal-novo-exercicio');
    if (modal) modal.style.display = 'none';
}

// 6. Criar exercício e ir para edição
async function continuarNovoExercicio() {
    if (!authToken) {
        showToast('Você precisa estar autenticado', 'warning');
        return;
    }
    
    const nome = document.getElementById('novo-exercicio-nome')?.value;
    const tipo = document.getElementById('novo-exercicio-tipo')?.value;
    const quemPodeUtilizar = document.getElementById('novo-exercicio-quem-pode-utilizar')?.value;
    
    if (!nome || !tipo || !quemPodeUtilizar) {
        showToast('Preencha todos os campos obrigatórios', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/exercicios`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                nome: nome,
                tipo: tipo,
                quem_pode_utilizar: quemPodeUtilizar
            })
        });
        
        if (response.ok) {
            const exercicio = await response.json();
            fecharModalNovoExercicio();
            abrirEdicaoExercicio(exercicio.id);
            showToast('Exercício criado com sucesso!', 'success');
        } else {
            const error = await response.json();
            showToast(error.detail || 'Erro ao criar exercício', 'error');
        }
    } catch (error) {
        console.error('Erro ao criar exercício:', error);
        showToast('Erro ao criar exercício', 'error');
    }
}

// 7. Abrir página de criação de novo exercício (modo vazio)
function abrirNovoExercicio() {
    console.log('abrirNovoExercicio chamado, authToken:', authToken ? 'presente' : 'ausente');
    
    if (!authToken) {
        showToast('Você precisa fazer login primeiro para criar exercícios', 'warning');
        console.error('Tentativa de criar exercício sem autenticação');
        return;
    }
    
    exercicioAtualId = null;
    fotoUrlTemp = null;
    videoUrlTemp = null;
    
    // Navegar para página de formulário de exercício
    switchTreinamentoView('exercicio-form');
    
    const pageEdicao = document.getElementById('treinamento-exercicio-form');
    
    // Limpar todos os campos
    const headerNome = pageEdicao.querySelector('.exercicio-header-info h1');
    const headerSubtitulo = pageEdicao.querySelector('.exercicio-header-subtitulo');
    if (headerNome) headerNome.textContent = 'Novo Exercício';
    if (headerSubtitulo) headerSubtitulo.textContent = 'Em criação';
    
    // Limpar campos do formulário
    const campoNome = document.getElementById('exercicio-nome');
    const campoDescricao = document.getElementById('exercicio-descricao');
    if (campoNome) campoNome.value = '';
    if (campoDescricao) campoDescricao.value = '';
    
    // Preencher automaticamente o criador com usuário logado
    const campoElaboradoPor = document.getElementById('exercicio-elaborado-por');
    if (campoElaboradoPor && currentUser) {
        campoElaboradoPor.value = currentUser.nome || currentUser.email || 'Usuário';
    }
    
    // Resetar selects
    const selectQuemPode = document.getElementById('exercicio-quem-pode-utilizar');
    const selectTipo = document.getElementById('exercicio-tipo');
    if (selectQuemPode) selectQuemPode.selectedIndex = 0;
    if (selectTipo) selectTipo.selectedIndex = 0;
    
    // Limpar preview de imagem
    const previewImagem = document.getElementById('exercicio-preview-imagem');
    if (previewImagem) {
        previewImagem.innerHTML = `
            <div class="exercicio-imagem-placeholder">
                <i class="fas fa-image"></i>
                <div>Clique para fazer upload</div>
            </div>
        `;
        previewImagem.onclick = () => document.getElementById('upload-foto-exercicio').click();
    }
    
    // Limpar preview de vídeo
    const videoContainer = document.getElementById('exercicio-preview-video');
    if (videoContainer) {
        const videoPlayer = videoContainer.querySelector('.exercicio-video-player');
        if (videoPlayer) videoPlayer.src = '';
    }
}

// 8. Abrir página de edição de exercício
async function abrirEdicaoExercicio(exercicioId) {
    if (!authToken) {
        showToast('Você precisa estar autenticado', 'warning');
        return;
    }
    
    exercicioAtualId = exercicioId;
    fotoUrlTemp = null;
    videoUrlTemp = null;
    
    // Navegar para página de formulário de exercício
    switchTreinamentoView('exercicio-form');
    
    const pageEdicao = document.getElementById('treinamento-exercicio-form');
    
    try {
        const response = await fetch(`${API_BASE}/exercicios/${exercicioId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const exercicio = await response.json();
            
            const campos = {
                'edicao-exercicio-nome': exercicio.nome,
                'edicao-exercicio-tipo': exercicio.tipo,
                'edicao-exercicio-quem-pode-utilizar': exercicio.quem_pode_utilizar,
                'edicao-exercicio-aparelho': exercicio.aparelho,
                'edicao-exercicio-qualidade-movimento': exercicio.qualidade_movimento,
                'edicao-exercicio-parte-corpo': exercicio.parte_corpo,
                'edicao-exercicio-movimento': exercicio.movimento,
                'edicao-exercicio-descricao': exercicio.descricao
            };
            
            for (const [id, valor] of Object.entries(campos)) {
                const campo = document.getElementById(id);
                if (campo && valor) campo.value = valor;
            }
            
            if (exercicio.foto_url) {
                const preview = document.getElementById('preview-foto-exercicio');
                if (preview) {
                    preview.src = exercicio.foto_url;
                    preview.style.display = 'block';
                }
                fotoUrlTemp = exercicio.foto_url;
            }
            
            if (exercicio.video_url) {
                const player = document.getElementById('player-video-exercicio');
                if (player) {
                    player.src = exercicio.video_url;
                    player.style.display = 'block';
                }
                videoUrlTemp = exercicio.video_url;
            }
            
            const btnFavorito = document.getElementById('btn-favorito-edicao');
            if (btnFavorito) {
                if (exercicio.favorito) {
                    btnFavorito.textContent = 'Remover dos favoritos';
                    btnFavorito.classList.add('favorito-ativo');
                } else {
                    btnFavorito.textContent = 'Adicionar aos favoritos';
                    btnFavorito.classList.remove('favorito-ativo');
                }
            }
        } else {
            showToast('Erro ao carregar exercício', 'error');
            voltarParaExercicios();
        }
    } catch (error) {
        console.error('Erro ao carregar exercício:', error);
        showToast('Erro ao carregar exercício', 'error');
        voltarParaExercicios();
    }
}

// 8. Salvar exercício (criar novo ou atualizar existente)
async function salvarExercicio() {
    console.log('salvarExercicio chamado, authToken:', authToken ? 'presente' : 'ausente');
    
    if (!authToken) {
        showToast('Você precisa fazer login primeiro para salvar exercícios', 'warning');
        console.error('Tentativa de salvar exercício sem autenticação');
        return;
    }
    
    // Coletar dados do formulário
    const nome = document.getElementById('exercicio-nome')?.value || '';
    const quemPodeUtilizar = document.getElementById('exercicio-quem-pode-utilizar')?.value || 'Todos os instrutores';
    const tipo = document.getElementById('exercicio-tipo')?.value || 'Movimento funcional';
    const elaboradoPor = document.getElementById('exercicio-elaborado-por')?.value || '';
    const descricao = document.getElementById('exercicio-descricao')?.value || '';
    
    // Validar campos obrigatórios
    if (!nome.trim()) {
        showToast('Por favor, preencha o nome do exercício', 'warning');
        return;
    }
    
    try {
        const exercicioData = {
            nome: nome.trim(),
            tipo: tipo,
            quem_pode_utilizar: quemPodeUtilizar,
            descricao: descricao.trim(),
            foto_url: fotoUrlTemp || null,
            video_url: videoUrlTemp || null
        };
        
        let response;
        
        if (exercicioAtualId) {
            // Atualizar exercício existente
            response = await fetch(`${API_BASE}/exercicios/${exercicioAtualId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(exercicioData)
            });
        } else {
            // Criar novo exercício
            response = await fetch(`${API_BASE}/exercicios`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(exercicioData)
            });
        }
        
        if (response.ok) {
            const exercicio = await response.json();
            console.log('Exercício salvo com sucesso:', exercicio);
            showToast(`Exercício ${exercicioAtualId ? 'atualizado' : 'criado'} com sucesso!`, 'success');
            voltarParaExercicios();
        } else {
            const error = await response.json();
            console.error('Erro ao salvar exercício:', response.status, error);
            showToast(error.detail || 'Erro ao salvar exercício', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar exercício:', error);
        showToast('Erro ao salvar exercício', 'error');
    }
}

// 9. Voltar para biblioteca de exercícios
function voltarParaExercicios() {
    // Navegar de volta para lista de exercícios
    switchTreinamentoView('exercicios');
    
    exercicioAtualId = null;
    fotoUrlTemp = null;
    videoUrlTemp = null;
    
    loadExercicios();
}

// 10. Upload de foto do exercício (versão com input event)
async function uploadFotoExercicio(event) {
    if (!authToken) {
        showToast('Você precisa estar autenticado', 'warning');
        return;
    }
    
    const file = event.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch(`${API_BASE}/exercicios/upload-foto`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            fotoUrlTemp = data.foto_url;
            
            // Atualizar preview mantendo o click handler
            const previewContainer = document.getElementById('exercicio-preview-imagem');
            if (previewContainer) {
                previewContainer.innerHTML = `<img src="${fotoUrlTemp}" alt="Preview" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
                previewContainer.onclick = () => document.getElementById('upload-foto-exercicio').click();
            }
            
            showToast('Foto enviada com sucesso!', 'success');
        } else {
            showToast('Erro ao enviar foto', 'error');
        }
    } catch (error) {
        console.error('Erro ao enviar foto:', error);
        showToast('Erro ao enviar foto', 'error');
    }
}

// 9b. Upload de foto do exercício (versão antiga mantida para compatibilidade)
function uploadFotoExercicioOld() {
    if (!authToken) {
        showToast('Você precisa estar autenticado', 'warning');
        return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const response = await fetch(`${API_BASE}/exercicios/upload-foto`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
                body: formData
            });
            
            if (response.ok) {
                const data = await response.json();
                fotoUrlTemp = data.foto_url;
                
                const preview = document.getElementById('preview-foto-exercicio');
                if (preview) {
                    preview.src = fotoUrlTemp;
                    preview.style.display = 'block';
                }
                
                showToast('Foto enviada com sucesso!', 'success');
            } else {
                showToast('Erro ao enviar foto', 'error');
            }
        } catch (error) {
            console.error('Erro ao enviar foto:', error);
            showToast('Erro ao enviar foto', 'error');
        }
    };
    
    input.click();
}

// 10. Upload de vídeo do exercício (versão com input event)
async function uploadVideoExercicio(event) {
    if (!authToken) {
        showToast('Você precisa estar autenticado', 'warning');
        return;
    }
    
    const file = event.target.files[0];
    if (!file) return;
    
    const maxSize = 40 * 1024 * 1024;
    if (file.size > maxSize) {
        showToast('O vídeo deve ter no máximo 40MB', 'warning');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        showToast('Enviando vídeo...', 'info');
        
        const response = await fetch(`${API_BASE}/exercicios/upload-video`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            videoUrlTemp = data.video_url;
            
            // Atualizar player
            const videoContainer = document.getElementById('exercicio-preview-video');
            if (videoContainer) {
                const player = videoContainer.querySelector('.exercicio-video-player');
                if (player) {
                    player.src = videoUrlTemp;
                    player.load();
                }
            }
            
            showToast('Vídeo enviado com sucesso!', 'success');
        } else {
            showToast('Erro ao enviar vídeo', 'error');
        }
    } catch (error) {
        console.error('Erro ao enviar vídeo:', error);
        showToast('Erro ao enviar vídeo', 'error');
    }
}

// 10b. Upload de vídeo do exercício (versão antiga mantida para compatibilidade)
function uploadVideoExercicioOld() {
    if (!authToken) {
        showToast('Você precisa estar autenticado', 'warning');
        return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/mp4,video/webm,video/quicktime';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const maxSize = 40 * 1024 * 1024;
        if (file.size > maxSize) {
            showToast('O vídeo deve ter no máximo 40MB', 'warning');
            return;
        }
        
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            showToast('Enviando vídeo...', 'info');
            
            const response = await fetch(`${API_BASE}/exercicios/upload-video`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
                body: formData
            });
            
            if (response.ok) {
                const data = await response.json();
                videoUrlTemp = data.video_url;
                
                const player = document.getElementById('player-video-exercicio');
                if (player) {
                    player.src = videoUrlTemp;
                    player.style.display = 'block';
                }
                
                showToast('Vídeo enviado com sucesso!', 'success');
            } else {
                showToast('Erro ao enviar vídeo', 'error');
            }
        } catch (error) {
            console.error('Erro ao enviar vídeo:', error);
            showToast('Erro ao enviar vídeo', 'error');
        }
    };
    
    input.click();
}

// 11. salvarExercicio() já foi definido anteriormente (linha 3898), removida duplicata

// 12. Toggle favorito
async function toggleFavorito(exercicioId) {
    if (!authToken) {
        showToast('Você precisa estar autenticado', 'warning');
        return;
    }
    
    try {
        const responseGet = await fetch(`${API_BASE}/exercicios/${exercicioId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!responseGet.ok) {
            showToast('Erro ao buscar exercício', 'error');
            return;
        }
        
        const exercicio = await responseGet.json();
        const novoEstado = !exercicio.favorito;
        
        const responsePut = await fetch(`${API_BASE}/exercicios/${exercicioId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                ...exercicio,
                favorito: novoEstado
            })
        });
        
        if (responsePut.ok) {
            showToast(novoEstado ? 'Adicionado aos favoritos!' : 'Removido dos favoritos!', 'success');
            loadExercicios();
        } else {
            showToast('Erro ao atualizar favorito', 'error');
        }
    } catch (error) {
        console.error('Erro ao atualizar favorito:', error);
        showToast('Erro ao atualizar favorito', 'error');
    }
}

// 13. Ocultar exercício
async function ocultarExercicio(exercicioId) {
    if (!authToken) {
        showToast('Você precisa estar autenticado', 'warning');
        return;
    }
    
    if (!confirm('Deseja realmente ocultar este exercício?')) {
        return;
    }
    
    try {
        const responseGet = await fetch(`${API_BASE}/exercicios/${exercicioId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!responseGet.ok) {
            showToast('Erro ao buscar exercício', 'error');
            return;
        }
        
        const exercicio = await responseGet.json();
        
        const responsePut = await fetch(`${API_BASE}/exercicios/${exercicioId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                ...exercicio,
                oculto: true
            })
        });
        
        if (responsePut.ok) {
            showToast('Exercício ocultado com sucesso!', 'success');
            loadExercicios();
        } else {
            showToast('Erro ao ocultar exercício', 'error');
        }
    } catch (error) {
        console.error('Erro ao ocultar exercício:', error);
        showToast('Erro ao ocultar exercício', 'error');
    }
}

// 14. Buscar e filtrar exercícios
async function buscarExercicios() {
    if (!authToken) {
        showToast('Você precisa estar autenticado', 'warning');
        return;
    }
    
    const busca = document.getElementById('busca-exercicios')?.value || '';
    const tipo = document.getElementById('filtro-tipo-exercicio')?.value || '';
    const ordenar = document.getElementById('filtro-ordenacao')?.value || '';
    
    let url = `${API_BASE}/exercicios?`;
    const params = [];
    
    if (busca) params.push(`busca=${encodeURIComponent(busca)}`);
    if (tipo) params.push(`tipo=${encodeURIComponent(tipo)}`);
    if (ordenar) params.push(`ordenar=${encodeURIComponent(ordenar)}`);
    
    url += params.join('&');
    
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const exercicios = await response.json();
            renderizarExercicios(exercicios);
        } else {
            showToast('Erro ao buscar exercícios', 'error');
        }
    } catch (error) {
        console.error('Erro ao buscar exercícios:', error);
        showToast('Erro ao buscar exercícios', 'error');
    }
}

// 15. Remover dos favoritos na página de edição
async function removerDosFavoritos() {
    if (!authToken || !exercicioAtualId) {
        showToast('Erro ao remover dos favoritos', 'error');
        return;
    }
    
    try {
        const responseGet = await fetch(`${API_BASE}/exercicios/${exercicioAtualId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!responseGet.ok) {
            showToast('Erro ao buscar exercício', 'error');
            return;
        }
        
        const exercicio = await responseGet.json();
        
        const responsePut = await fetch(`${API_BASE}/exercicios/${exercicioAtualId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                ...exercicio,
                favorito: false
            })
        });
        
        if (responsePut.ok) {
            showToast('Removido dos favoritos!', 'success');
            
            const btnFavorito = document.getElementById('btn-favorito-edicao');
            if (btnFavorito) {
                btnFavorito.textContent = 'Adicionar aos favoritos';
                btnFavorito.classList.remove('favorito-ativo');
            }
        } else {
            showToast('Erro ao remover dos favoritos', 'error');
        }
    } catch (error) {
        console.error('Erro ao remover dos favoritos:', error);
        showToast('Erro ao remover dos favoritos', 'error');
    }
}

/* ============================================ */
/* WORKFLOW BUILDER */
/* ============================================ */

// Estado global do workflow
let workflowState = {
    id: null,
    journeyId: null,
    name: '',
    nodes: [],
    edges: [],
    viewport: {
        zoom: 1,
        offsetX: 0,
        offsetY: 0
    }
};

// Variáveis de controle
let selectedNode = null;
let draggedNode = null;
let connectingFrom = null;
let rubberBandLine = null;
let snapTarget = null;
let selectedEdge = null;
let nodeIdCounter = 1;
let edgeIdCounter = 1;
let isPanning = false;
let panStart = { x: 0, y: 0 };

// Contexto da sidebar de configuração
let sidebarContext = {
    mode: null,        // 'card' ou 'edge'
    configData: {},    // Dados de configuração do elemento
    nodeId: null       // ID do node sendo editado
};

// Definições de tipos de nodes
const nodeDefinitions = {
    aguardar: {
        icon: 'fa-clock',
        label: 'Aguardar',
        description: 'Aguarde um período de tempo',
        category: 'regra',
        config: { time: 1, unit: 'days' }
    },
    condicao: {
        icon: 'fa-code-branch',
        label: 'Condição',
        description: 'Verifique uma condição',
        category: 'regra',
        config: { condition: '' }
    },
    sair: {
        icon: 'fa-sign-out-alt',
        label: 'Sair',
        description: 'Sair da fase',
        category: 'regra',
        config: {}
    },
    tarefa: {
        icon: 'fa-tasks',
        label: 'Tarefa',
        description: 'Criar nova tarefa',
        category: 'acao',
        config: { title: '', assignee: '' }
    },
    mensagem: {
        icon: 'fa-comment',
        label: 'Enviar mensagem',
        description: 'Enviar mensagem ao contato',
        category: 'acao',
        config: { message: '' }
    },
    email: {
        icon: 'fa-envelope',
        label: 'E-mail',
        description: 'Enviar e-mail de boas-vindas',
        category: 'acao',
        config: { subject: '', body: '' }
    },
    questionario: {
        icon: 'fa-clipboard-question',
        label: 'Questionário',
        description: 'Enviar questionário',
        category: 'acao',
        config: { questionId: '' }
    },
    'tipo-contato': {
        icon: 'fa-user-tag',
        label: 'Tipo de contato',
        description: 'Alterar tipo de contato',
        category: 'acao',
        config: { newType: '' }
    }
};

// Navegar para workflow builder
function abrirWorkflowBuilder() {
    // Pegar journeyId da jornada atual (ID real da jornada atualmente visualizada)
    const currentJornada = window.mockJornadas?.find(j => 
        j.nome === document.getElementById('jornada-detalhes-titulo')?.textContent
    );
    const journeyId = currentJornada ? currentJornada.id : Date.now();
    
    const journeyName = document.getElementById('jornada-detalhes-titulo')?.textContent || 'Fluxo de Trabalho';
    
    // Atualizar breadcrumb
    const breadcrumbName = document.getElementById('workflow-jornada-nome');
    if (breadcrumbName) {
        breadcrumbName.textContent = journeyName;
    }
    
    // Limpar canvas
    const stage = document.getElementById('canvas-stage');
    if (stage) {
        const nodes = stage.querySelectorAll('.workflow-node');
        nodes.forEach(node => node.remove());
    }
    
    // Limpar SVG (todas as paths exceto markers)
    const svg = document.getElementById('connections-svg');
    if (svg) {
        const paths = svg.querySelectorAll('path');
        paths.forEach(path => path.remove());
    }
    
    // Tentar carregar workflow existente
    const savedWorkflow = localStorage.getItem(`workflow_${journeyId}`);
    
    if (savedWorkflow) {
        try {
            workflowState = JSON.parse(savedWorkflow);
            
            // Restaurar counters
            if (workflowState.nodes.length > 0) {
                const maxNodeId = Math.max(...workflowState.nodes.map(n => parseInt(n.id.split('-')[1]) || 0));
                nodeIdCounter = maxNodeId + 1;
            }
            if (workflowState.edges.length > 0) {
                const maxEdgeId = Math.max(...workflowState.edges.map(e => parseInt(e.id.split('-')[1]) || 0));
                edgeIdCounter = maxEdgeId + 1;
            }
            
            // Renderizar nodes salvos
            workflowState.nodes.forEach(node => renderNode(node));
            
            // Renderizar edges salvos
            workflowState.edges.forEach(edge => renderEdge(edge));
            
            // Aplicar viewport salvo
            applyViewportTransform();
            
        } catch (error) {
            console.error('Erro ao carregar workflow:', error);
            // Se falhar, inicializar vazio
            initEmptyWorkflow(journeyId, journeyName);
        }
    } else {
        // Inicializar workflow vazio
        initEmptyWorkflow(journeyId, journeyName);
    }
    
    // Inicializar drag & drop
    initWorkflowDragDrop();
    
    // Inicializar pan
    initCanvasPan();
    
    // Inicializar zoom via mouse wheel
    initCanvasMouseWheelZoom();
    
    // Mostrar página de workflow
    switchAutomacaoView('workflow-builder');
}

// Inicializar workflow vazio
function initEmptyWorkflow(journeyId, name) {
    // Criar START node
    const startNode = {
        id: 'node-start',
        type: 'start',
        label: 'Ponto de partida',
        position: { x: 300, y: 100 },
        ports: { input: false, output: true },
        config: {},
        isSpecial: true
    };
    
    // Criar END node
    const endNode = {
        id: 'node-end',
        type: 'end',
        label: 'Etapa concluída',
        position: { x: 300, y: 400 },
        ports: { input: true, output: false },
        config: {},
        isSpecial: true
    };
    
    // Criar edge conectando START -> END
    const edge = {
        id: 'edge-0',
        source: { nodeId: 'node-start', port: 'output' },
        target: { nodeId: 'node-end', port: 'input' },
        type: 'bezier'
    };
    
    workflowState = {
        id: null,
        journeyId: journeyId,
        name: name,
        nodes: [startNode, endNode],
        edges: [edge],
        viewport: { zoom: 1, offsetX: 0, offsetY: 0 }
    };
    
    // Renderizar START e END
    renderNode(startNode);
    renderNode(endNode);
    renderEdge(edge);
    
    // Inicializar counter após nodes especiais
    nodeIdCounter = 1;
    edgeIdCounter = 1;
    
    applyViewportTransform();
}

// Voltar do workflow builder
function voltarDeWorkflow() {
    switchAutomacaoView('jornada-detalhes');
}

// Inicializar drag & drop
function initWorkflowDragDrop() {
    const elementCards = document.querySelectorAll('.element-card');
    const canvas = document.getElementById('workflow-canvas');
    
    elementCards.forEach(card => {
        card.addEventListener('dragstart', handleDragStart);
    });
    
    if (canvas) {
        canvas.addEventListener('dragover', handleDragOver);
        canvas.addEventListener('drop', handleDrop);
    }
}

// Handler de drag start
function handleDragStart(e) {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('nodeType', e.currentTarget.dataset.type);
}

// Handler de drag over
function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
}

// Handler de drop
function handleDrop(e) {
    e.preventDefault();
    
    const nodeType = e.dataTransfer.getData('nodeType');
    if (!nodeType || !nodeDefinitions[nodeType]) return;
    
    const canvas = document.getElementById('workflow-canvas');
    const rect = canvas.getBoundingClientRect();
    
    // Calcular posição considerando zoom e offset
    const x = (e.clientX - rect.left - workflowState.viewport.offsetX) / workflowState.viewport.zoom;
    const y = (e.clientY - rect.top - workflowState.viewport.offsetY) / workflowState.viewport.zoom;
    
    createNode(nodeType, x, y);
}

// Criar node
function createNode(type, x, y) {
    const def = nodeDefinitions[type];
    if (!def) return;
    
    const node = {
        id: `node-${nodeIdCounter++}`,
        type: type,
        label: def.label,
        position: { x, y },
        ports: {
            input: true,
            output: true
        },
        config: { ...def.config }
    };
    
    workflowState.nodes.push(node);
    renderNode(node);
}

// Renderizar node no canvas
function renderNode(node) {
    const stage = document.getElementById('canvas-stage');
    const nodeEl = document.createElement('div');
    nodeEl.className = 'workflow-node';
    nodeEl.id = node.id;
    nodeEl.style.left = `${node.position.x}px`;
    nodeEl.style.top = `${node.position.y}px`;
    nodeEl.dataset.nodeId = node.id;
    
    // Nodes especiais (START/END) têm rendering diferente
    if (node.type === 'start') {
        nodeEl.innerHTML = `
            <div class="node-header">
                <div class="node-icon">
                    <i class="fas fa-play"></i>
                </div>
                <div class="node-title">${node.label}</div>
            </div>
            ${node.ports.output ? '<div class="node-port node-port-output" data-port="output"></div>' : ''}
        `;
    } else if (node.type === 'end') {
        nodeEl.innerHTML = `
            <div class="node-header">
                <div class="node-icon">
                    <i class="fas fa-flag-checkered"></i>
                </div>
                <div class="node-title">${node.label}</div>
            </div>
            ${node.ports.input ? '<div class="node-port node-port-input" data-port="input"></div>' : ''}
        `;
    } else {
        // Nodes normais
        const def = nodeDefinitions[node.type];
        nodeEl.innerHTML = `
            <div class="node-mini-toolbar">
                <button class="toolbar-btn" onclick="editNode('${node.id}')" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="toolbar-btn" onclick="duplicateNode('${node.id}')" title="Duplicar">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="toolbar-btn btn-delete" onclick="deleteNodeById('${node.id}')" title="Deletar">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="node-header">
                <div class="node-icon ${def.category === 'acao' ? 'node-icon-acao' : ''}">
                    <i class="fas ${def.icon}"></i>
                </div>
                <div class="node-title">${node.label}</div>
            </div>
            <div class="node-description">${def.description}</div>
            ${node.ports.input ? '<div class="node-port node-port-input" data-port="input"></div>' : ''}
            ${node.ports.output ? '<div class="node-port node-port-output" data-port="output"></div>' : ''}
        `;
    }
    
    // Adicionar eventos de drag apenas se não for node especial
    if (!node.isSpecial) {
        nodeEl.addEventListener('mousedown', startNodeDrag);
    }
    
    // Click para selecionar
    nodeEl.addEventListener('click', (e) => {
        if (!e.target.closest('.node-port') && !e.target.closest('.toolbar-btn')) {
            selectNode(node.id);
        }
    });
    
    // Adicionar eventos às portas
    const ports = nodeEl.querySelectorAll('.node-port');
    ports.forEach(port => {
        port.addEventListener('click', handlePortClick);
    });
    
    stage.appendChild(nodeEl);
}

// Selecionar node
function selectNode(nodeId) {
    // Remover seleção anterior
    document.querySelectorAll('.workflow-node').forEach(n => {
        n.classList.remove('selected');
    });
    
    // Adicionar seleção
    const nodeEl = document.getElementById(nodeId);
    if (nodeEl) {
        nodeEl.classList.add('selected');
        selectedNode = nodeId;
    }
}

// Editar node
function editNode(nodeId) {
    const node = workflowState.nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    // TODO: Implementar modal de edição
    showToast('Modal de edição em desenvolvimento', 'info');
}

// Duplicar node
function duplicateNode(nodeId) {
    const node = workflowState.nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    // Deep clone para evitar referências compartilhadas
    const newNode = {
        id: `node-${nodeIdCounter++}`,
        type: node.type,
        label: node.label,
        position: {
            x: node.position.x + 50,
            y: node.position.y + 50
        },
        ports: {
            input: node.ports.input,
            output: node.ports.output
        },
        config: JSON.parse(JSON.stringify(node.config)) // Deep clone do config
    };
    
    workflowState.nodes.push(newNode);
    renderNode(newNode);
    showToast('Node duplicado!', 'success');
}

// Deletar node por ID
function deleteNodeById(nodeId) {
    // Prevenir deleção de nodes especiais (START/END)
    const node = workflowState.nodes.find(n => n.id === nodeId);
    if (node && node.isSpecial) {
        showToast('Ponto de partida e etapa concluída não podem ser deletados', 'error');
        return;
    }
    
    // Confirmar
    if (!confirm('Deseja deletar este elemento?')) return;
    
    // Encontrar edges conectadas ao node
    const incomingEdge = workflowState.edges.find(e => e.target.nodeId === nodeId);
    const outgoingEdge = workflowState.edges.find(e => e.source.nodeId === nodeId);
    
    // Reconexão magnética: se há edge de entrada E saída, conectar source->target diretamente
    if (incomingEdge && outgoingEdge) {
        const sourceNodeId = incomingEdge.source.nodeId;
        const targetNodeId = outgoingEdge.target.nodeId;
        
        // Remover edges antigas
        deleteEdge(incomingEdge.id);
        deleteEdge(outgoingEdge.id);
        
        // Criar nova edge conectando source -> target diretamente
        createEdge(sourceNodeId, targetNodeId);
        
        showToast('Elemento removido e conexões reconectadas automaticamente', 'success');
    } else {
        // Se não há ambas as edges, apenas remover as existentes
        workflowState.edges = workflowState.edges.filter(edge => {
            if (edge.source.nodeId === nodeId || edge.target.nodeId === nodeId) {
                const pathEl = document.getElementById(edge.id);
                if (pathEl) pathEl.remove();
                
                // Remover botão da edge também
                const btnEl = document.getElementById(`btn-${edge.id}`);
                if (btnEl) btnEl.remove();
                
                return false;
            }
            return true;
        });
        
        showToast('Elemento deletado', 'success');
    }
    
    // Remover node do estado
    const nodeIndex = workflowState.nodes.findIndex(n => n.id === nodeId);
    if (nodeIndex > -1) {
        workflowState.nodes.splice(nodeIndex, 1);
    }
    
    // Remover do DOM
    const nodeEl = document.getElementById(nodeId);
    if (nodeEl) nodeEl.remove();
    
    selectedNode = null;
    
    // Salvar workflow
    salvarWorkflow();
}

// Iniciar drag de node existente
function startNodeDrag(e) {
    if (e.target.closest('.node-port')) return;
    
    e.stopPropagation();
    draggedNode = e.currentTarget;
    const nodeId = draggedNode.dataset.nodeId;
    const node = workflowState.nodes.find(n => n.id === nodeId);
    
    if (!node) return;
    
    const rect = draggedNode.getBoundingClientRect();
    const canvas = document.getElementById('workflow-canvas');
    const canvasRect = canvas.getBoundingClientRect();
    
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    function onMouseMove(e) {
        if (!draggedNode) return;
        
        requestAnimationFrame(() => {
            if (!draggedNode) return;
            
            const x = (e.clientX - canvasRect.left - offsetX - workflowState.viewport.offsetX) / workflowState.viewport.zoom;
            const y = (e.clientY - canvasRect.top - offsetY - workflowState.viewport.offsetY) / workflowState.viewport.zoom;
            
            node.position.x = x;
            node.position.y = y;
            
            draggedNode.style.left = `${x}px`;
            draggedNode.style.top = `${y}px`;
            
            updateConnections();
        });
    }
    
    function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        draggedNode = null;
    }
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

// Click em porta para conectar
function handlePortClick(e) {
    e.stopPropagation();
    
    const port = e.currentTarget;
    const nodeEl = port.closest('.workflow-node');
    const nodeId = nodeEl.dataset.nodeId;
    const portType = port.dataset.port;
    
    if (!connectingFrom) {
        // Iniciar conexão (só pode começar de output)
        if (portType === 'output') {
            connectingFrom = { nodeId, port: portType, element: port };
            port.classList.add('connecting');
            
            // Highlight portas disponíveis
            highlightAvailablePorts(nodeId);
            
            // Iniciar rubber band
            startRubberBand(port);
        }
    } else {
        // Finalizar conexão (só pode terminar em input)
        if (portType === 'input' && nodeId !== connectingFrom.nodeId) {
            // Validar conexão
            if (validateConnection(connectingFrom.nodeId, nodeId)) {
                createEdge(connectingFrom.nodeId, nodeId);
                showToast('Conexão criada!', 'success');
            } else {
                showToast('Conexão inválida!', 'error');
            }
        }
        
        // Limpar estado de conexão
        cleanupConnection();
    }
}

// Highlight de portas disponíveis
function highlightAvailablePorts(excludeNodeId) {
    const inputPorts = document.querySelectorAll('.node-port-input');
    inputPorts.forEach(port => {
        const nodeEl = port.closest('.workflow-node');
        if (nodeEl.dataset.nodeId !== excludeNodeId) {
            // Verificar se a porta já tem conexão
            const hasConnection = workflowState.edges.some(edge => 
                edge.target.nodeId === nodeEl.dataset.nodeId
            );
            
            if (!hasConnection) {
                port.classList.add('port-available');
            }
        }
    });
}

// Iniciar rubber band
function startRubberBand(sourcePort) {
    const svg = document.getElementById('connections-svg');
    rubberBandLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    rubberBandLine.classList.add('rubber-band-line');
    svg.appendChild(rubberBandLine);
    
    // Atualizar rubber band com movimento do mouse
    const canvas = document.getElementById('workflow-canvas');
    const canvasRect = canvas.getBoundingClientRect();
    
    function updateRubberBand(e) {
        if (!rubberBandLine || !connectingFrom) return;
        
        const sourceRect = sourcePort.getBoundingClientRect();
        const x1 = (sourceRect.left + sourceRect.width / 2 - canvasRect.left) / workflowState.viewport.zoom;
        const y1 = (sourceRect.top + sourceRect.height / 2 - canvasRect.top) / workflowState.viewport.zoom;
        const x2 = (e.clientX - canvasRect.left) / workflowState.viewport.zoom;
        const y2 = (e.clientY - canvasRect.top) / workflowState.viewport.zoom;
        
        // Verificar snap to port
        const nearPort = findNearestPort(e.clientX, e.clientY, 30);
        if (nearPort) {
            const portRect = nearPort.getBoundingClientRect();
            const px = (portRect.left + portRect.width / 2 - canvasRect.left) / workflowState.viewport.zoom;
            const py = (portRect.top + portRect.height / 2 - canvasRect.top) / workflowState.viewport.zoom;
            
            const dx = Math.abs(px - x1) * 0.5;
            const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${px - dx} ${py}, ${px} ${py}`;
            rubberBandLine.setAttribute('d', d);
            
            snapTarget = nearPort;
            nearPort.style.transform = 'translateY(-50%) scale(1.5)';
        } else {
            snapTarget = null;
            
            const dx = Math.abs(x2 - x1) * 0.5;
            const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
            rubberBandLine.setAttribute('d', d);
            
            // Resetar scales
            document.querySelectorAll('.port-available').forEach(p => {
                if (p.dataset.port === 'input') {
                    p.style.transform = '';
                }
            });
        }
    }
    
    canvas.addEventListener('mousemove', updateRubberBand);
    
    // Limpar ao clicar fora
    function cleanupOnClick(e) {
        if (!e.target.closest('.node-port')) {
            cleanupConnection();
            canvas.removeEventListener('mousemove', updateRubberBand);
            canvas.removeEventListener('click', cleanupOnClick);
        }
    }
    
    canvas.addEventListener('click', cleanupOnClick);
}

// Encontrar porta mais próxima
function findNearestPort(mouseX, mouseY, threshold) {
    const availablePorts = document.querySelectorAll('.node-port.port-available');
    let nearest = null;
    let minDist = threshold;
    
    availablePorts.forEach(port => {
        const rect = port.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dist = Math.sqrt(Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2));
        
        if (dist < minDist) {
            minDist = dist;
            nearest = port;
        }
    });
    
    return nearest;
}

// Validar conexão
function validateConnection(sourceNodeId, targetNodeId) {
    // Prevenir auto-conexão
    if (sourceNodeId === targetNodeId) {
        return false;
    }
    
    // Prevenir múltiplas entradas na mesma porta
    const hasExistingConnection = workflowState.edges.some(edge => 
        edge.target.nodeId === targetNodeId
    );
    
    if (hasExistingConnection) {
        return false;
    }
    
    // Prevenir ciclos (DFS)
    if (wouldCreateCycle(sourceNodeId, targetNodeId)) {
        return false;
    }
    
    return true;
}

// Detectar ciclos usando DFS
function wouldCreateCycle(sourceNodeId, targetNodeId) {
    const visited = new Set();
    const tempEdges = [...workflowState.edges, {
        source: { nodeId: sourceNodeId },
        target: { nodeId: targetNodeId }
    }];
    
    function dfs(nodeId, path) {
        if (path.has(nodeId)) {
            return true; // Ciclo detectado
        }
        
        if (visited.has(nodeId)) {
            return false;
        }
        
        visited.add(nodeId);
        path.add(nodeId);
        
        const outgoingEdges = tempEdges.filter(edge => edge.source.nodeId === nodeId);
        for (const edge of outgoingEdges) {
            if (dfs(edge.target.nodeId, new Set(path))) {
                return true;
            }
        }
        
        path.delete(nodeId);
        return false;
    }
    
    return dfs(sourceNodeId, new Set());
}

// Limpar estado de conexão
function cleanupConnection() {
    // Remover highlight
    document.querySelectorAll('.port-available').forEach(port => {
        port.classList.remove('port-available');
        port.style.transform = '';
    });
    
    // Remover connecting class
    const connectingPort = document.querySelector('.node-port.connecting');
    if (connectingPort) {
        connectingPort.classList.remove('connecting');
    }
    
    // Remover rubber band
    if (rubberBandLine) {
        rubberBandLine.remove();
        rubberBandLine = null;
    }
    
    connectingFrom = null;
    snapTarget = null;
}

// Criar edge
function createEdge(sourceNodeId, targetNodeId) {
    const edge = {
        id: `edge-${edgeIdCounter++}`,
        source: { nodeId: sourceNodeId, port: 'output' },
        target: { nodeId: targetNodeId, port: 'input' },
        type: 'bezier'
    };
    
    workflowState.edges.push(edge);
    renderEdge(edge);
}

// Renderizar edge
function renderEdge(edge) {
    const sourceNode = document.getElementById(edge.source.nodeId);
    const targetNode = document.getElementById(edge.target.nodeId);
    
    if (!sourceNode || !targetNode) return;
    
    const svg = document.getElementById('connections-svg');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.id = edge.id;
    path.setAttribute('marker-end', 'url(#arrowhead)');
    path.dataset.edgeId = edge.id;
    
    // Eventos de hover
    path.addEventListener('mouseenter', () => {
        path.classList.add('edge-hover');
    });
    
    path.addEventListener('mouseleave', () => {
        path.classList.remove('edge-hover');
    });
    
    // Click para deletar
    path.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Deseja deletar esta conexão?')) {
            deleteEdge(edge.id);
        }
    });
    
    updateEdgePath(edge, path, sourceNode, targetNode);
    
    svg.appendChild(path);
    
    // Criar botão + no centro da edge
    renderEdgeButton(edge);
}

// Renderizar botão + no centro da edge
function renderEdgeButton(edge) {
    const stage = document.getElementById('canvas-stage');
    const existingBtn = document.getElementById(`btn-${edge.id}`);
    
    // Remover botão existente se houver
    if (existingBtn) {
        existingBtn.remove();
    }
    
    // Criar botão
    const btn = document.createElement('div');
    btn.id = `btn-${edge.id}`;
    btn.className = 'edge-add-button';
    btn.dataset.edgeId = edge.id;
    btn.innerHTML = '<i class="fas fa-plus"></i>';
    
    // Evento de clique
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openEdgeInsertMenu(edge.id);
    });
    
    // Posicionar botão
    updateEdgeButtonPosition(edge, btn);
    
    stage.appendChild(btn);
}

// Atualizar posição do botão na edge
function updateEdgeButtonPosition(edge, btn) {
    const sourceNode = document.getElementById(edge.source.nodeId);
    const targetNode = document.getElementById(edge.target.nodeId);
    
    if (!sourceNode || !targetNode) return;
    
    const sourcePort = sourceNode.querySelector('.node-port-output');
    const targetPort = targetNode.querySelector('.node-port-input');
    
    const sourceRect = sourcePort.getBoundingClientRect();
    const targetRect = targetPort.getBoundingClientRect();
    const canvas = document.getElementById('workflow-canvas');
    const canvasRect = canvas.getBoundingClientRect();
    
    // Calcular ponto médio
    const x1 = (sourceRect.left + sourceRect.width / 2 - canvasRect.left) / workflowState.viewport.zoom;
    const y1 = (sourceRect.top + sourceRect.height / 2 - canvasRect.top) / workflowState.viewport.zoom;
    const x2 = (targetRect.left + targetRect.width / 2 - canvasRect.left) / workflowState.viewport.zoom;
    const y2 = (targetRect.top + targetRect.height / 2 - canvasRect.top) / workflowState.viewport.zoom;
    
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    
    // Posicionar botão (centralizado, ajustar para tamanho do botão: 32px)
    btn.style.left = `${midX - 16}px`;
    btn.style.top = `${midY - 16}px`;
}

// Atualizar todos os botões das edges
function updateEdgeButtons() {
    workflowState.edges.forEach(edge => {
        const btn = document.getElementById(`btn-${edge.id}`);
        if (btn) {
            updateEdgeButtonPosition(edge, btn);
        }
    });
}

// Abrir menu para inserir elemento entre edge
function openEdgeInsertMenu(edgeId) {
    const edge = workflowState.edges.find(e => e.id === edgeId);
    if (!edge) return;
    
    // Armazenar edgeId no estado global para uso posterior
    window.currentInsertEdgeId = edgeId;
    
    // Abrir nested sidebar no modo de seleção de elemento
    const nestedSidebar = document.getElementById('nested-sidebar');
    const mainSidebar = document.querySelector('.workflow-sidebar');
    
    if (nestedSidebar && mainSidebar) {
        // Atualizar título
        const titleEl = document.getElementById('nested-element-name');
        if (titleEl) {
            titleEl.textContent = 'Selecionar Elemento';
        }
        
        // Mostrar nested sidebar
        nestedSidebar.style.display = 'flex';
        mainSidebar.style.transform = 'translateX(-100%)';
        
        showToast('Selecione um elemento para inserir', 'info');
    }
}

// Inserir node entre dois nodes conectados
function insertNodeBetween(edgeId, elementType) {
    const edge = workflowState.edges.find(e => e.id === edgeId);
    if (!edge) {
        showToast('Conexão não encontrada', 'error');
        return;
    }
    
    const sourceNode = document.getElementById(edge.source.nodeId);
    const targetNode = document.getElementById(edge.target.nodeId);
    
    if (!sourceNode || !targetNode) {
        showToast('Nodes não encontrados', 'error');
        return;
    }
    
    // Calcular posição do novo node (centro entre source e target)
    const sourceX = parseInt(sourceNode.style.left) || 0;
    const sourceY = parseInt(sourceNode.style.top) || 0;
    const targetX = parseInt(targetNode.style.left) || 0;
    const targetY = parseInt(targetNode.style.top) || 0;
    
    const newX = (sourceX + targetX) / 2;
    const newY = (sourceY + targetY) / 2;
    
    // Criar novo node
    const newNode = createNode(elementType, newX, newY);
    
    // Deletar edge original
    deleteEdge(edgeId);
    
    // Criar novas edges: source -> novo -> target
    createEdge(edge.source.nodeId, newNode.id);
    createEdge(newNode.id, edge.target.nodeId);
    
    // Salvar estado
    salvarWorkflow();
    
    showToast(`Elemento "${ELEMENT_DEFINITIONS[elementType]?.label || elementType}" inserido!`, 'success');
    
    // Limpar estado global
    window.currentInsertEdgeId = null;
}

// Deletar edge
function deleteEdge(edgeId) {
    // Remover do estado
    const edgeIndex = workflowState.edges.findIndex(e => e.id === edgeId);
    if (edgeIndex > -1) {
        workflowState.edges.splice(edgeIndex, 1);
    }
    
    // Remover do DOM
    const pathEl = document.getElementById(edgeId);
    if (pathEl) {
        pathEl.remove();
    }
    
    // Remover botão da edge
    const btnEl = document.getElementById(`btn-${edgeId}`);
    if (btnEl) {
        btnEl.remove();
    }
    
    showToast('Conexão deletada', 'success');
}

// Atualizar path da edge
function updateEdgePath(edge, path, sourceNode, targetNode) {
    const sourcePort = sourceNode.querySelector('.node-port-output');
    const targetPort = targetNode.querySelector('.node-port-input');
    
    const sourceRect = sourcePort.getBoundingClientRect();
    const targetRect = targetPort.getBoundingClientRect();
    const canvas = document.getElementById('workflow-canvas');
    const canvasRect = canvas.getBoundingClientRect();
    
    const x1 = (sourceRect.left + sourceRect.width / 2 - canvasRect.left) / workflowState.viewport.zoom;
    const y1 = (sourceRect.top + sourceRect.height / 2 - canvasRect.top) / workflowState.viewport.zoom;
    const x2 = (targetRect.left + targetRect.width / 2 - canvasRect.left) / workflowState.viewport.zoom;
    const y2 = (targetRect.top + targetRect.height / 2 - canvasRect.top) / workflowState.viewport.zoom;
    
    // Linhas verticais retas (estilo Zapier/Make)
    // Se nodes estão alinhados verticalmente (mesma coluna), usar linha reta
    // Caso contrário, usar linha com segmentos verticais e horizontais
    const d = `M ${x1} ${y1} L ${x2} ${y2}`;
    path.setAttribute('d', d);
}

// Atualizar todas as conexões
function updateConnections() {
    workflowState.edges.forEach(edge => {
        const path = document.getElementById(edge.id);
        const sourceNode = document.getElementById(edge.source.nodeId);
        const targetNode = document.getElementById(edge.target.nodeId);
        
        if (path && sourceNode && targetNode) {
            updateEdgePath(edge, path, sourceNode, targetNode);
        }
    });
    
    // Atualizar posição dos botões
    updateEdgeButtons();
}

// Inicializar pan do canvas
function initCanvasPan() {
    const canvas = document.getElementById('workflow-canvas');
    
    canvas.addEventListener('mousedown', (e) => {
        if (e.target === canvas || e.target.classList.contains('canvas-stage')) {
            isPanning = true;
            panStart = { x: e.clientX - workflowState.viewport.offsetX, y: e.clientY - workflowState.viewport.offsetY };
            canvas.style.cursor = 'grabbing';
        }
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isPanning) {
            workflowState.viewport.offsetX = e.clientX - panStart.x;
            workflowState.viewport.offsetY = e.clientY - panStart.y;
            applyViewportTransform();
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (isPanning) {
            isPanning = false;
            const canvas = document.getElementById('workflow-canvas');
            canvas.style.cursor = 'default';
        }
    });
}

// Inicializar zoom via scroll do mouse
function initCanvasMouseWheelZoom() {
    const canvas = document.getElementById('workflow-canvas');
    
    if (!canvas) return;
    
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        
        const zoomIntensity = 0.1;
        const delta = e.deltaY > 0 ? -zoomIntensity : zoomIntensity;
        const newZoom = Math.max(0.5, Math.min(2, workflowState.viewport.zoom + delta));
        
        // Calcular posição do mouse relativa ao canvas
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Ajustar offset para zoom centrado no mouse
        const scale = newZoom / workflowState.viewport.zoom;
        workflowState.viewport.offsetX = mouseX - (mouseX - workflowState.viewport.offsetX) * scale;
        workflowState.viewport.offsetY = mouseY - (mouseY - workflowState.viewport.offsetY) * scale;
        workflowState.viewport.zoom = newZoom;
        
        applyViewportTransform();
    }, { passive: false });
}

// Aplicar transform de viewport
function applyViewportTransform() {
    const stage = document.getElementById('canvas-stage');
    if (stage) {
        stage.style.transform = `translate(${workflowState.viewport.offsetX}px, ${workflowState.viewport.offsetY}px) scale(${workflowState.viewport.zoom})`;
    }
    updateConnections();
}

// Zoom in
function zoomIn() {
    workflowState.viewport.zoom = Math.min(2, workflowState.viewport.zoom + 0.1);
    applyViewportTransform();
}

// Zoom out
function zoomOut() {
    workflowState.viewport.zoom = Math.max(0.5, workflowState.viewport.zoom - 0.1);
    applyViewportTransform();
}

// Fit to screen
function fitToScreen() {
    if (workflowState.nodes.length === 0) {
        workflowState.viewport = { zoom: 1, offsetX: 0, offsetY: 0 };
        applyViewportTransform();
        return;
    }
    
    // Calcular bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    workflowState.nodes.forEach(node => {
        minX = Math.min(minX, node.position.x);
        minY = Math.min(minY, node.position.y);
        maxX = Math.max(maxX, node.position.x + 200);
        maxY = Math.max(maxY, node.position.y + 100);
    });
    
    const canvas = document.getElementById('workflow-canvas');
    const rect = canvas.getBoundingClientRect();
    
    const width = maxX - minX;
    const height = maxY - minY;
    
    const scaleX = (rect.width - 100) / width;
    const scaleY = (rect.height - 100) / height;
    
    workflowState.viewport.zoom = Math.min(scaleX, scaleY, 1);
    workflowState.viewport.offsetX = (rect.width - width * workflowState.viewport.zoom) / 2 - minX * workflowState.viewport.zoom;
    workflowState.viewport.offsetY = (rect.height - height * workflowState.viewport.zoom) / 2 - minY * workflowState.viewport.zoom;
    
    applyViewportTransform();
}

/* ===== NESTED SIDEBAR E BOTÕES + ===== */

// Estado de inserção por edge
let edgeInsertionMode = false;
let activeEdgeId = null;

// Estado da nested sidebar
let nestedSidebarState = {
    elementType: null,
    values: {},
    validators: {}
};

// Config map declarativo para nested sidebars
const ELEMENT_CONFIGS = {
    'aguardar': {
        title: 'Aguardar',
        sections: [
            {
                label: 'Adicionar um evento a ser aguardado',
                collapsible: true,
                components: [
                    {
                        type: 'search',
                        placeholder: 'Buscar'
                    },
                    {
                        type: 'list',
                        items: [
                            { id: 'aula-reservada', icon: 'calendar-check', label: 'Aula reservada' },
                            { id: 'ausencia', icon: 'user-slash', label: 'Ausência' },
                            { id: 'app-vivio', icon: 'mobile-alt', label: 'App VIVIO' },
                            { id: 'conta-vivio', icon: 'user', label: 'Conta VIVIO' },
                            { id: 'servico-realizado', icon: 'check-circle', label: 'Serviço realizado' },
                            { id: 'sessoes', icon: 'dumbbell', label: 'Sessões' },
                            { id: 'tarefa-fazer', icon: 'tasks', label: 'Tarefa a fazer' },
                            { id: 'tarefa-concluida', icon: 'check-double', label: 'Tarefa concluída' },
                            { id: 'tempo', icon: 'clock', label: 'Tempo' },
                            { id: 'assinatura-ativa', icon: 'star', label: 'Assinatura ativa' },
                            { id: 'assinatura-cancelada', icon: 'star-half-alt', label: 'Assinatura cancelada' },
                            { id: 'meta-atingida', icon: 'trophy', label: 'Meta atingida' },
                            { id: 'treino-completado', icon: 'running', label: 'Treino completado' },
                            { id: 'avaliacao-fisica', icon: 'heartbeat', label: 'Avaliação física' }
                        ]
                    }
                ]
            }
        ]
    },
    'condicao': {
        title: 'Condição',
        sections: [
            {
                label: 'Adicionar uma condição',
                collapsible: true,
                components: [
                    {
                        type: 'search',
                        placeholder: 'Buscar'
                    },
                    {
                        type: 'list',
                        items: [
                            { id: 'app-vivio', icon: 'mobile-alt', label: 'App VIVIO' },
                            { id: 'aula-reservada', icon: 'calendar-check', label: 'Aula reservada' },
                            { id: 'ausencia', icon: 'user-slash', label: 'Ausência' },
                            { id: 'conta-vivio', icon: 'user', label: 'Conta VIVIO' },
                            { id: 'data-afiliacao', icon: 'calendar-alt', label: 'Data da afiliação' },
                            { id: 'grupo', icon: 'users', label: 'Grupo' },
                            { id: 'questionario-preenchido', icon: 'clipboard-check', label: 'Questionário Preenchido' },
                            { id: 'resultado-questionario', icon: 'poll', label: 'Resultado do Questionário' },
                            { id: 'servico-realizado', icon: 'check-circle', label: 'Serviço realizado' },
                            { id: 'tempo', icon: 'clock', label: 'Tempo' },
                            { id: 'tarefa-fazer', icon: 'tasks', label: 'Tarefa a fazer' },
                            { id: 'tarefa-concluida', icon: 'check-double', label: 'Tarefa concluída' },
                            { id: 'sessoes', icon: 'dumbbell', label: 'Sessões' }
                        ]
                    }
                ]
            }
        ]
    },
    'sair': {
        title: 'Sair',
        sections: [
            {
                label: 'RESULTADO DA SAÍDA DA ETAPA',
                collapsible: true,
                components: [
                    {
                        type: 'radio',
                        name: 'exit-outcome',
                        required: true,
                        options: [
                            { value: 'completed', label: 'Etapa concluída', default: true },
                            { value: 'incomplete', label: 'Etapa não concluída' },
                            { value: 'skipped', label: 'Etapa pulada' }
                        ]
                    }
                ]
            }
        ]
    },
    'tarefa': {
        title: 'Tarefa',
        sections: [
            {
                label: 'Configurar tarefa',
                collapsible: true,
                components: [
                    {
                        type: 'text',
                        name: 'task-title',
                        placeholder: 'Título da tarefa',
                        required: true
                    },
                    {
                        type: 'textarea',
                        name: 'task-description',
                        placeholder: 'Descrição da tarefa'
                    }
                ]
            }
        ]
    },
    'mensagem': {
        title: 'Enviar mensagem',
        sections: [
            {
                label: 'Selecionar canais',
                collapsible: true,
                components: [
                    {
                        type: 'checkbox',
                        name: 'message-channels',
                        options: [
                            { value: 'push', label: 'Push Notification', icon: 'bell', default: true },
                            { value: 'email', label: 'E-mail', icon: 'envelope' },
                            { value: 'interno', label: 'Notificação Interna', icon: 'inbox' },
                            { value: 'whatsapp', label: 'WhatsApp (em breve)', icon: 'whatsapp' }
                        ]
                    }
                ]
            },
            {
                label: 'Configurar mensagem',
                collapsible: true,
                components: [
                    {
                        type: 'text',
                        name: 'message-title',
                        placeholder: 'Título da mensagem',
                        required: true
                    },
                    {
                        type: 'textarea',
                        name: 'message-content',
                        placeholder: 'Digite a mensagem',
                        required: true
                    }
                ]
            }
        ]
    },
    'email': {
        title: 'E-mail',
        sections: [
            {
                label: 'Configurar e-mail',
                collapsible: true,
                components: [
                    {
                        type: 'text',
                        name: 'email-subject',
                        placeholder: 'Assunto do e-mail',
                        required: true
                    },
                    {
                        type: 'textarea',
                        name: 'email-body',
                        placeholder: 'Corpo do e-mail',
                        required: true
                    }
                ]
            }
        ]
    },
    'questionario': {
        title: 'Questionário',
        sections: [
            {
                label: 'Selecionar questionário',
                collapsible: true,
                components: [
                    {
                        type: 'search',
                        placeholder: 'Buscar questionário'
                    },
                    {
                        type: 'list',
                        items: [
                            { id: 'satisfacao', icon: 'smile', label: 'Questionário de Satisfação' },
                            { id: 'avaliacao', icon: 'clipboard-check', label: 'Avaliação de Progresso' }
                        ]
                    }
                ]
            }
        ]
    },
    'tipo-contato': {
        title: 'Tipo de contato',
        sections: [
            {
                label: 'Alterar tipo de contato',
                collapsible: true,
                components: [
                    {
                        type: 'radio',
                        name: 'contact-type',
                        required: true,
                        options: [
                            { value: 'lead', label: 'Lead' },
                            { value: 'cliente', label: 'Cliente' },
                            { value: 'prospect', label: 'Prospect' }
                        ]
                    }
                ]
            }
        ]
    },
    'delay': {
        title: 'Aguardar Tempo',
        sections: [
            {
                label: 'Configurar tempo de espera',
                collapsible: true,
                components: [
                    {
                        type: 'number',
                        name: 'delay-amount',
                        placeholder: 'Quantidade',
                        required: true,
                        min: 1
                    },
                    {
                        type: 'radio',
                        name: 'delay-unit',
                        required: true,
                        options: [
                            { value: 'minutes', label: 'Minutos' },
                            { value: 'hours', label: 'Horas', default: true },
                            { value: 'days', label: 'Dias' },
                            { value: 'weeks', label: 'Semanas' }
                        ]
                    }
                ]
            }
        ]
    },
    'atualizar-perfil': {
        title: 'Atualizar Perfil',
        sections: [
            {
                label: 'Selecionar campo a atualizar',
                collapsible: true,
                components: [
                    {
                        type: 'select',
                        name: 'profile-field',
                        placeholder: 'Campo do perfil',
                        required: true,
                        options: [
                            { value: 'estado', label: 'Estado do usuário' },
                            { value: 'risco-churn', label: 'Risco de churn' },
                            { value: 'meta-semana', label: 'Meta da semana' },
                            { value: 'nivel-engajamento', label: 'Nível de engajamento' },
                            { value: 'categoria-saude', label: 'Categoria de saúde' }
                        ]
                    },
                    {
                        type: 'text',
                        name: 'profile-value',
                        placeholder: 'Novo valor',
                        required: true
                    }
                ]
            }
        ]
    },
    'ia-assistente': {
        title: 'IA Assistente',
        sections: [
            {
                label: 'Configurar ação preditiva',
                collapsible: true,
                components: [
                    {
                        type: 'select',
                        name: 'ia-action',
                        placeholder: 'Tipo de análise',
                        required: true,
                        options: [
                            { value: 'prever-abandono', label: 'Prever risco de abandono' },
                            { value: 'sugerir-acao', label: 'Sugerir próxima ação' },
                            { value: 'otimizar-horario', label: 'Otimizar horário de contato' },
                            { value: 'personalizar-meta', label: 'Personalizar meta' }
                        ]
                    },
                    {
                        type: 'info',
                        message: '🤖 Recurso em desenvolvimento. A IA analisará padrões de comportamento para ações automáticas.'
                    }
                ]
            }
        ]
    },
    'gamificacao': {
        title: 'Gamificação',
        sections: [
            {
                label: 'Configurar recompensa',
                collapsible: true,
                components: [
                    {
                        type: 'radio',
                        name: 'gamification-type',
                        required: true,
                        options: [
                            { value: 'points', label: 'Atribuir pontos', default: true },
                            { value: 'badge', label: 'Liberar badge' },
                            { value: 'challenge', label: 'Emitir desafio' }
                        ]
                    },
                    {
                        type: 'number',
                        name: 'points-amount',
                        placeholder: 'Quantidade de pontos',
                        min: 1
                    },
                    {
                        type: 'text',
                        name: 'reward-name',
                        placeholder: 'Nome da recompensa'
                    }
                ]
            }
        ]
    }
};

// REMOVIDO: renderEdgeAddButtons() e ativarModoInsercao() - substituídos por renderEdgeButton() e openEdgeInsertMenu()

// Abrir nested sidebar a partir do card
function abrirNestedSidebarCard(elementType) {
    // Esta função pode ser chamada de duas formas:
    // 1. De elementos da sidebar (sem edge) → modo 'card'
    // 2. De botões + nas edges (com edge) → mantém modo 'edge'
    
    const config = ELEMENT_CONFIGS[elementType];
    if (!config) {
        showToast('Erro: elemento não encontrado', 'error');
        return;
    }
    
    // Determinar modo baseado na presença de edge selecionada
    const hasEdge = window.currentInsertEdgeId || activeEdgeId;
    
    if (!hasEdge) {
        // Modo card: clicou em elemento da sidebar (sem edge)
        sidebarContext.mode = 'card';
        sidebarContext.configData = { elementType: elementType };
    } else {
        // Modo edge: clicou em botão + de uma edge
        sidebarContext.mode = 'edge';
        sidebarContext.configData = { elementType: elementType, edgeId: hasEdge };
    }
    
    // Atualizar título
    const titleEl = document.getElementById('nested-element-name');
    if (titleEl) {
        titleEl.textContent = config.title;
    }
    
    // Renderizar conteúdo específico do elemento
    renderNestedSidebarContent(elementType, config);
    
    // Abrir nested sidebar
    const nestedSidebar = document.getElementById('nested-sidebar');
    if (nestedSidebar) {
        nestedSidebar.style.display = 'flex';
    }
}

// Renderizar conteúdo da nested sidebar
function renderNestedSidebarContent(elementType, config) {
    nestedSidebarState.elementType = elementType;
    nestedSidebarState.values = {};
    
    const body = document.querySelector('.nested-sidebar-body');
    if (!body) return;
    
    body.innerHTML = '';
    
    config.sections.forEach(section => {
        const sectionEl = renderCollapsibleSection(section, elementType);
        body.appendChild(sectionEl);
    });
    
    // Adicionar botão de confirmar
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'btn btn-primary';
    confirmBtn.textContent = 'Confirmar';
    confirmBtn.style.cssText = 'margin: 1rem; width: calc(100% - 2rem);';
    confirmBtn.onclick = () => confirmarNestedSidebar(elementType);
    body.appendChild(confirmBtn);
}

// Renderizar seção colapsável
function renderCollapsibleSection(section, elementType) {
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'nested-collapsible-section active';
    
    const header = document.createElement('button');
    header.className = 'nested-collapsible-header';
    header.onclick = function() { toggleNestedCollapsible(this); };
    header.innerHTML = `
        <i class="fas fa-plus"></i>
        <span>${section.label}</span>
        <i class="fas fa-chevron-down toggle-icon"></i>
    `;
    
    const content = document.createElement('div');
    content.className = 'nested-collapsible-content';
    content.style.display = 'block';
    
    section.components.forEach(component => {
        const compEl = renderComponent(component, elementType);
        if (compEl) content.appendChild(compEl);
    });
    
    sectionDiv.appendChild(header);
    sectionDiv.appendChild(content);
    
    return sectionDiv;
}

// Renderizar componente
function renderComponent(component, elementType) {
    switch (component.type) {
        case 'search':
            return renderSearchBox(component);
        case 'list':
            return renderListComponent(component, elementType);
        case 'radio':
            return renderRadioGroup(component);
        case 'text':
            return renderTextInput(component);
        case 'textarea':
            return renderTextarea(component);
        case 'number':
            return renderNumberInput(component);
        case 'select':
            return renderSelect(component);
        case 'checkbox':
            return renderCheckboxGroup(component);
        case 'info':
            return renderInfoBox(component);
        default:
            return null;
    }
}

// Renderizar search box
function renderSearchBox(component) {
    const div = document.createElement('div');
    div.className = 'nested-search-box';
    div.innerHTML = `
        <i class="fas fa-search"></i>
        <input type="text" placeholder="${component.placeholder}" oninput="filtrarNestedList(this)">
    `;
    return div;
}

// Renderizar lista
function renderListComponent(component, elementType) {
    const div = document.createElement('div');
    div.className = 'nested-trigger-list';
    div.dataset.filterable = 'true';
    
    component.items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'nested-trigger-item';
        itemDiv.dataset.searchText = item.label.toLowerCase();
        itemDiv.innerHTML = `
            <i class="fas fa-${item.icon}"></i>
            ${item.label}
        `;
        itemDiv.onclick = () => selecionarItemNested(elementType, item.id, item.label);
        div.appendChild(itemDiv);
    });
    
    return div;
}

// Renderizar radio group
function renderRadioGroup(component) {
    const div = document.createElement('div');
    div.className = 'nested-radio-group';
    div.style.cssText = 'display: flex; flex-direction: column; gap: 0.5rem; padding: 0.5rem;';
    
    component.options.forEach(option => {
        const label = document.createElement('label');
        label.style.cssText = 'display: flex; align-items: center; gap: 0.5rem; cursor: pointer;';
        
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = component.name;
        input.value = option.value;
        if (option.default) input.checked = true;
        input.onchange = () => {
            nestedSidebarState.values[component.name] = option.value;
        };
        
        label.appendChild(input);
        label.appendChild(document.createTextNode(option.label));
        div.appendChild(label);
    });
    
    return div;
}

// Renderizar text input
function renderTextInput(component) {
    const div = document.createElement('div');
    div.className = 'form-group';
    div.style.padding = '0.5rem';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.name = component.name;
    input.placeholder = component.placeholder || '';
    input.required = component.required || false;
    input.style.cssText = 'width: 100%; padding: 0.5rem; border: 1px solid #e8e8e8; border-radius: 4px;';
    input.oninput = () => {
        nestedSidebarState.values[component.name] = input.value;
    };
    
    div.appendChild(input);
    return div;
}

// Renderizar textarea
function renderTextarea(component) {
    const div = document.createElement('div');
    div.className = 'form-group';
    div.style.padding = '0.5rem';
    
    const textarea = document.createElement('textarea');
    textarea.name = component.name;
    textarea.placeholder = component.placeholder || '';
    textarea.required = component.required || false;
    textarea.rows = 4;
    textarea.style.cssText = 'width: 100%; padding: 0.5rem; border: 1px solid #e8e8e8; border-radius: 4px; resize: vertical;';
    textarea.oninput = () => {
        nestedSidebarState.values[component.name] = textarea.value;
    };
    
    div.appendChild(textarea);
    return div;
}

// Renderizar number input
function renderNumberInput(component) {
    const div = document.createElement('div');
    div.className = 'form-group';
    div.style.padding = '0.5rem';
    
    const input = document.createElement('input');
    input.type = 'number';
    input.name = component.name;
    input.placeholder = component.placeholder || '';
    input.required = component.required || false;
    input.min = component.min || 0;
    input.max = component.max || 9999;
    input.style.cssText = 'width: 100%; padding: 0.5rem; border: 1px solid #e8e8e8; border-radius: 4px;';
    input.oninput = () => {
        nestedSidebarState.values[component.name] = parseInt(input.value) || 0;
    };
    
    div.appendChild(input);
    return div;
}

// Renderizar select dropdown
function renderSelect(component) {
    const div = document.createElement('div');
    div.className = 'form-group';
    div.style.padding = '0.5rem';
    
    const select = document.createElement('select');
    select.name = component.name;
    select.required = component.required || false;
    select.style.cssText = 'width: 100%; padding: 0.5rem; border: 1px solid #e8e8e8; border-radius: 4px; background: white;';
    
    // Placeholder option
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = component.placeholder || 'Selecione...';
    placeholderOption.disabled = true;
    placeholderOption.selected = true;
    select.appendChild(placeholderOption);
    
    // Options
    component.options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        select.appendChild(option);
    });
    
    select.onchange = () => {
        nestedSidebarState.values[component.name] = select.value;
    };
    
    div.appendChild(select);
    return div;
}

// Renderizar checkbox group
function renderCheckboxGroup(component) {
    const div = document.createElement('div');
    div.className = 'nested-checkbox-group';
    div.style.cssText = 'display: flex; flex-direction: column; gap: 0.5rem; padding: 0.5rem;';
    
    if (!nestedSidebarState.values[component.name]) {
        nestedSidebarState.values[component.name] = [];
    }
    
    component.options.forEach(option => {
        const label = document.createElement('label');
        label.style.cssText = 'display: flex; align-items: center; gap: 0.5rem; cursor: pointer;';
        
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.value = option.value;
        if (option.default) input.checked = true;
        input.onchange = () => {
            if (input.checked) {
                if (!nestedSidebarState.values[component.name].includes(option.value)) {
                    nestedSidebarState.values[component.name].push(option.value);
                }
            } else {
                nestedSidebarState.values[component.name] = nestedSidebarState.values[component.name].filter(v => v !== option.value);
            }
        };
        
        const icon = document.createElement('i');
        icon.className = `fas fa-${option.icon || 'check'}`;
        icon.style.marginLeft = '0.25rem';
        
        label.appendChild(input);
        label.appendChild(document.createTextNode(option.label));
        if (option.icon) label.appendChild(icon);
        div.appendChild(label);
    });
    
    return div;
}

// Renderizar info box
function renderInfoBox(component) {
    const div = document.createElement('div');
    div.className = 'info-box';
    div.style.cssText = 'background: #e8f4f8; border-left: 4px solid #62b1ca; padding: 0.75rem; margin: 0.5rem; border-radius: 4px; color: #123058;';
    div.textContent = component.message;
    return div;
}

// Filtrar lista nested
function filtrarNestedList(input) {
    const searchText = input.value.toLowerCase();
    const list = input.closest('.nested-collapsible-content').querySelector('[data-filterable="true"]');
    if (!list) return;
    
    const items = list.querySelectorAll('.nested-trigger-item');
    items.forEach(item => {
        const itemText = item.dataset.searchText || item.textContent.toLowerCase();
        item.style.display = itemText.includes(searchText) ? 'flex' : 'none';
    });
}

// Selecionar item da nested list
function selecionarItemNested(elementType, itemId, itemLabel) {
    nestedSidebarState.values.selectedItem = { id: itemId, label: itemLabel };
    confirmarNestedSidebar(elementType);
}

// Definições de elementos (labels e ícones)
const ELEMENT_DEFINITIONS = {
    'aguardar': { label: 'Aguardar', icon: 'clock', color: '#1f2746' },
    'condicao': { label: 'Condição', icon: 'code-branch', color: '#1f2746' },
    'sair': { label: 'Sair', icon: 'sign-out-alt', color: '#1f2746' },
    'tarefa': { label: 'Tarefa', icon: 'tasks', color: '#123058' },
    'mensagem': { label: 'Mensagem', icon: 'comment', color: '#123058' },
    'email': { label: 'E-mail', icon: 'envelope', color: '#123058' },
    'questionario': { label: 'Questionário', icon: 'clipboard-question', color: '#123058' },
    'tipo-contato': { label: 'Tipo de Contato', icon: 'user-tag', color: '#123058' },
    'delay': { label: 'Aguardar Tempo', icon: 'hourglass-half', color: '#1f2746' },
    'atualizar-perfil': { label: 'Atualizar Perfil', icon: 'user-edit', color: '#123058' },
    'ia-assistente': { label: 'IA Assistente', icon: 'robot', color: '#62b1ca' },
    'gamificacao': { label: 'Gamificação', icon: 'trophy', color: '#123058' }
};

// Confirmar nested sidebar e inserir elemento
function confirmarNestedSidebar(elementType) {
    // Verificar modo de inserção
    if (sidebarContext.mode === 'card') {
        // Modo card: adicionar elemento via sidebar (respeitando espaçamento)
        adicionarElementoViaSidebar(elementType, nestedSidebarState.values);
        return;
    }
    
    // Modo edge: inserção via botão + da conexão
    const edgeId = window.currentInsertEdgeId || activeEdgeId;
    
    if (!edgeId) {
        showToast('Erro: nenhuma conexão selecionada', 'error');
        return;
    }
    
    // Se for inserção via botão +, usar método direto
    if (window.currentInsertEdgeId) {
        insertNodeBetween(window.currentInsertEdgeId, elementType);
    } else {
        // Método antigo via activeEdgeId
        inserirElementoComConfig(elementType, nestedSidebarState.values);
    }
    
    // Fechar sidebar e resetar estado
    fecharNestedSidebar();
}

// Inserir elemento com configuração
function inserirElementoComConfig(elementType, configValues) {
    const edge = workflowState.edges.find(e => e.id === activeEdgeId);
    if (!edge) {
        showToast('Erro: conexão não encontrada', 'error');
        return;
    }
    
    const sourceNode = workflowState.nodes.find(n => n.id === edge.source.nodeId);
    const targetNode = workflowState.nodes.find(n => n.id === edge.target.nodeId);
    
    if (!sourceNode || !targetNode) return;
    
    const def = ELEMENT_DEFINITIONS[elementType] || ELEMENT_DEFINITIONS['aguardar'];
    
    // Calcular posição do novo node (midpoint entre source e target)
    const midX = (sourceNode.position.x + targetNode.position.x) / 2;
    const midY = (sourceNode.position.y + targetNode.position.y) / 2;
    
    // Criar novo node com configuração
    const newNode = {
        id: `node-${nodeIdCounter++}`,
        type: elementType,
        label: def.label,
        position: { x: midX, y: midY },
        ports: { input: true, output: true },
        data: configValues
    };
    
    // Adicionar node ao state
    workflowState.nodes.push(newNode);
    renderNode(newNode);
    
    // Remover edge original
    const edgeIndex = workflowState.edges.findIndex(e => e.id === activeEdgeId);
    if (edgeIndex > -1) {
        workflowState.edges.splice(edgeIndex, 1);
        const pathEl = document.getElementById(activeEdgeId);
        if (pathEl) pathEl.remove();
    }
    
    // Criar duas novas edges: source → newNode e newNode → target
    const edge1 = {
        id: `edge-${edgeIdCounter++}`,
        source: { nodeId: edge.source.nodeId, port: 'output' },
        target: { nodeId: newNode.id, port: 'input' },
        type: 'bezier'
    };
    
    const edge2 = {
        id: `edge-${edgeIdCounter++}`,
        source: { nodeId: newNode.id, port: 'output' },
        target: { nodeId: edge.target.nodeId, port: 'input' },
        type: 'bezier'
    };
    
    workflowState.edges.push(edge1, edge2);
    renderEdge(edge1);
    renderEdge(edge2);
    
    // Salvar workflow no localStorage
    if (workflowState.journeyId) {
        const workflowData = JSON.stringify(workflowState);
        localStorage.setItem(`workflow_${workflowState.journeyId}`, workflowData);
    }
    
    showToast(`Elemento ${def.label} inserido!`, 'success');
}

// Inserir elemento diretamente via edge + (sem abrir sidebar)
function inserirElementoDireto(edgeId) {
    const edge = workflowState.edges.find(e => e.id === edgeId);
    if (!edge) {
        showToast('Erro: conexão não encontrada', 'error');
        return;
    }
    
    const sourceNode = workflowState.nodes.find(n => n.id === edge.source.nodeId);
    const targetNode = workflowState.nodes.find(n => n.id === edge.target.nodeId);
    
    if (!sourceNode || !targetNode) return;
    
    // Usar último tipo inserido ou aguardar como padrão
    const elementType = lastInsertedType || 'aguardar';
    
    // Definições de elementos
    const elementDefinitions = {
        'aguardar': { label: 'Aguardar', icon: 'clock', color: '#1f2746' },
        'condicao': { label: 'Condição', icon: 'code-branch', color: '#1f2746' },
        'sair': { label: 'Sair', icon: 'sign-out-alt', color: '#1f2746' },
        'tarefa': { label: 'Tarefa', icon: 'tasks', color: '#123058' },
        'mensagem': { label: 'Mensagem', icon: 'comment', color: '#123058' },
        'email': { label: 'E-mail', icon: 'envelope', color: '#123058' },
        'questionario': { label: 'Questionário', icon: 'clipboard-question', color: '#123058' },
        'tipo-contato': { label: 'Tipo de Contato', icon: 'user-tag', color: '#123058' }
    };
    
    const def = elementDefinitions[elementType] || elementDefinitions['aguardar'];
    
    // Calcular posição do novo node (midpoint entre source e target)
    const midX = (sourceNode.position.x + targetNode.position.x) / 2;
    const midY = (sourceNode.position.y + targetNode.position.y) / 2;
    
    // Criar novo node
    const newNode = {
        id: `node-${nodeIdCounter++}`,
        type: elementType,
        label: def.label,
        position: { x: midX, y: midY },
        data: {}
    };
    
    // Adicionar node ao state
    workflowState.nodes.push(newNode);
    renderNode(newNode);
    
    // Remover edge original
    const edgeIndex = workflowState.edges.findIndex(e => e.id === edgeId);
    if (edgeIndex > -1) {
        workflowState.edges.splice(edgeIndex, 1);
        const pathEl = document.getElementById(edgeId);
        if (pathEl) pathEl.remove();
    }
    
    // Criar duas novas edges: source → newNode e newNode → target
    const edge1 = {
        id: `edge-${edgeIdCounter++}`,
        source: { nodeId: edge.source.nodeId, port: 'output' },
        target: { nodeId: newNode.id, port: 'input' },
        type: 'bezier'
    };
    
    const edge2 = {
        id: `edge-${edgeIdCounter++}`,
        source: { nodeId: newNode.id, port: 'output' },
        target: { nodeId: edge.target.nodeId, port: 'input' },
        type: 'bezier'
    };
    
    workflowState.edges.push(edge1, edge2);
    renderEdge(edge1);
    renderEdge(edge2);
    
    // Atualizar último tipo inserido
    lastInsertedType = elementType;
    
    // Salvar workflow
    salvarWorkflowState();
    
    showToast(`Elemento ${def.label} inserido!`, 'success');
}

// Fechar nested sidebar
function fecharNestedSidebar() {
    const nestedSidebar = document.getElementById('nested-sidebar');
    if (nestedSidebar) {
        nestedSidebar.style.display = 'none';
    }
    
    // Resetar estado de inserção
    edgeInsertionMode = false;
    activeEdgeId = null;
    window.currentInsertEdgeId = null;  // Limpar também o novo modo
    
    // Esconder todos os botões + dos cards
    document.querySelectorAll('.element-card-add-btn').forEach(btn => {
        btn.style.display = 'none';
    });
}

// Voltar para sidebar de elementos do fluxo de trabalho
function voltarParaElementosSidebar() {
    const nestedSidebar = document.getElementById('nested-sidebar');
    if (nestedSidebar) {
        nestedSidebar.style.display = 'none';
    }
    
    // Resetar estado de inserção
    edgeInsertionMode = false;
    activeEdgeId = null;
    window.currentInsertEdgeId = null;
    
    // Esconder todos os botões + dos cards
    document.querySelectorAll('.element-card-add-btn').forEach(btn => {
        btn.style.display = 'none';
    });
    
    // A sidebar principal de elementos já está visível, apenas fechar a nested
    showToast('Voltou para elementos do fluxo', 'info');
}

// Calcular espaçamento entre nodes START e END
function calculateNodeSpacing() {
    const startNode = workflowState.nodes.find(n => n.id === 'node-start');
    const endNode = workflowState.nodes.find(n => n.id === 'node-end');
    
    if (!startNode || !endNode) {
        // Retornar espaçamento padrão se não encontrar os nodes
        return 300;
    }
    
    return endNode.position.y - startNode.position.y;
}

// Adicionar elemento no canvas via sidebar (respeitando espaçamento)
function adicionarElementoViaSidebar(elementType, triggerConfig) {
    const startNode = workflowState.nodes.find(n => n.id === 'node-start');
    const endNode = workflowState.nodes.find(n => n.id === 'node-end');
    
    if (!startNode || !endNode) {
        showToast('Erro: nodes START/END não encontrados', 'error');
        return;
    }
    
    // Encontrar edge entre START e último node antes do END
    const edgeToEnd = workflowState.edges.find(e => e.target.nodeId === 'node-end');
    
    if (!edgeToEnd) {
        showToast('Erro: conexão não encontrada', 'error');
        return;
    }
    
    // Calcular posição do novo node (entre o último node e END)
    const sourceNodeId = edgeToEnd.source.nodeId;
    const sourceNode = workflowState.nodes.find(n => n.id === sourceNodeId);
    
    if (!sourceNode) {
        showToast('Erro: node source não encontrado', 'error');
        return;
    }
    
    // Calcular posição no meio entre source e END
    const newX = (sourceNode.position.x + endNode.position.x) / 2;
    const newY = (sourceNode.position.y + endNode.position.y) / 2;
    
    // Criar novo node
    const def = nodeDefinitions[elementType] || { label: elementType, icon: 'fa-circle', category: 'acao' };
    const newNode = {
        id: `node-${nodeIdCounter++}`,
        type: elementType,
        label: def.label,
        position: { x: newX, y: newY },
        ports: { input: true, output: true },
        config: triggerConfig || {}
    };
    
    // Adicionar ao estado
    workflowState.nodes.push(newNode);
    renderNode(newNode);
    
    // Deletar edge antiga (source -> END)
    deleteEdge(edgeToEnd.id);
    
    // Criar novas edges: source -> novo -> END
    createEdge(sourceNodeId, newNode.id);
    createEdge(newNode.id, 'node-end');
    
    // Salvar workflow
    salvarWorkflow();
    
    // Fechar sidebars
    fecharTodasSidebars();
    
    showToast(`Elemento "${def.label}" adicionado ao fluxo!`, 'success');
}

// Fechar todas as sidebars
function fecharTodasSidebars() {
    // Fechar nested sidebar
    const nestedSidebar = document.getElementById('nested-sidebar');
    if (nestedSidebar) {
        nestedSidebar.style.display = 'none';
    }
    
    // Resetar estados
    edgeInsertionMode = false;
    activeEdgeId = null;
    window.currentInsertEdgeId = null;
    sidebarContext.mode = null;
    sidebarContext.configData = {};
    
    // Esconder botões + dos cards
    document.querySelectorAll('.element-card-add-btn').forEach(btn => {
        btn.style.display = 'none';
    });
}

// Selecionar trigger e inserir node no meio (não é mais usado - preservado para compatibilidade)
function selecionarTrigger(triggerId) {
    // Esta função foi substituída pelo sistema de nested sidebar
    // Apenas mostra mensagem informativa
    showToast('Use os botões "+" nas conexões para inserir elementos', 'info');
    return;
    
    const edge = null;
    if (!edge) {
        showToast('Erro: conexão não encontrada. Tente novamente.', 'error');
        fecharNestedSidebar();
        return;
    }
    
    const sourceNode = workflowState.nodes.find(n => n.id === edge.source);
    const targetNode = workflowState.nodes.find(n => n.id === edge.target);
    
    if (!sourceNode || !targetNode) return;
    
    // Mapear trigger para tipo de node
    const triggerToNodeType = {
        'aula-reservada': 'aguardar',
        'ausencia': 'aguardar',
        'app-vivio': 'aguardar',
        'conta-vivio': 'aguardar',
        'servico-realizado': 'aguardar',
        'sessoes': 'aguardar',
        'tarefa-fazer': 'tarefa',
        'tarefa-concluida': 'tarefa',
        'tempo': 'aguardar',
        'assinatura-ativa': 'condicao',
        'assinatura-cancelada': 'condicao',
        'meta-atingida': 'condicao',
        'treino-completado': 'aguardar',
        'avaliacao-fisica': 'aguardar'
    };
    
    const nodeType = triggerToNodeType[triggerId] || 'aguardar';
    const def = nodeDefinitions[nodeType];
    
    // Calcular posição no meio
    const midX = (sourceNode.position.x + targetNode.position.x) / 2;
    const midY = (sourceNode.position.y + targetNode.position.y) / 2;
    
    // Criar novo node
    const newNode = {
        id: `node-${nodeIdCounter++}`,
        type: nodeType,
        label: def.label,
        position: { x: midX, y: midY },
        ports: { input: true, output: true },
        config: {}
    };
    
    // Adicionar node ao state
    workflowState.nodes.push(newNode);
    renderNode(newNode);
    
    // Remover edge original
    const edgeIndex = workflowState.edges.findIndex(e => e.id === currentEdgeForInsertion);
    if (edgeIndex > -1) {
        workflowState.edges.splice(edgeIndex, 1);
        const pathEl = document.getElementById(currentEdgeForInsertion);
        if (pathEl) pathEl.remove();
    }
    
    // Criar duas novas edges: source → newNode e newNode → target
    const edge1 = {
        id: `edge-${edgeIdCounter++}`,
        source: { nodeId: edge.source.nodeId, port: 'output' },
        target: { nodeId: newNode.id, port: 'input' },
        type: 'bezier'
    };
    
    const edge2 = {
        id: `edge-${edgeIdCounter++}`,
        source: { nodeId: newNode.id, port: 'output' },
        target: { nodeId: edge.target.nodeId, port: 'input' },
        type: 'bezier'
    };
    
    workflowState.edges.push(edge1, edge2);
    renderEdge(edge1);
    renderEdge(edge2);
    
    // Fechar sidebar
    fecharNestedSidebar();
    
    showToast(`Elemento ${def.label} inserido!`, 'success');
}

// Filtrar triggers na nested sidebar
function filtrarTriggers() {
    const input = document.getElementById('nested-search-input');
    const filter = input.value.toLowerCase();
    const items = document.querySelectorAll('.nested-trigger-item');
    
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(filter)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Toggle collapsible na nested sidebar
function toggleNestedCollapsible(button) {
    const section = button.parentElement;
    const content = section.querySelector('.nested-collapsible-content');
    
    if (section.classList.contains('active')) {
        section.classList.remove('active');
        content.style.display = 'none';
    } else {
        section.classList.add('active');
        content.style.display = 'block';
    }
}

// Deletar selecionado
function deleteSelected() {
    if (!selectedNode) {
        showToast('Selecione um elemento para deletar', 'info');
        return;
    }
    
    // Remover node
    const nodeIndex = workflowState.nodes.findIndex(n => n.id === selectedNode);
    if (nodeIndex > -1) {
        workflowState.nodes.splice(nodeIndex, 1);
    }
    
    // Remover edges conectadas
    workflowState.edges = workflowState.edges.filter(edge => {
        if (edge.source.nodeId === selectedNode || edge.target.nodeId === selectedNode) {
            const pathEl = document.getElementById(edge.id);
            if (pathEl) pathEl.remove();
            return false;
        }
        return true;
    });
    
    // Remover elemento do DOM
    const nodeEl = document.getElementById(selectedNode);
    if (nodeEl) nodeEl.remove();
    
    selectedNode = null;
    showToast('Elemento deletado', 'success');
}

// Salvar workflow
async function salvarWorkflow() {
    try {
        // Por enquanto, salvar no localStorage
        const workflowData = JSON.stringify(workflowState);
        localStorage.setItem(`workflow_${workflowState.journeyId}`, workflowData);
        
        showToast('Fluxo de trabalho salvo com sucesso!', 'success');
        
        // TODO: Implementar chamada à API
        // const response = await fetch(`${API_BASE}/workflows/${workflowState.journeyId}`, {
        //     method: 'PUT',
        //     headers: {
        //         'Content-Type': 'application/json',
        //         'Authorization': `Bearer ${authToken}`
        //     },
        //     body: workflowData
        // });
        
    } catch (error) {
        console.error('Erro ao salvar workflow:', error);
        showToast('Erro ao salvar fluxo de trabalho', 'error');
    }
}

// Funções de salvar e publicar questionários
async function salvarQuestionario() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            showToast('Faça login para salvar', 'error');
            return;
        }
        
        if (!currentQuestionarioId) {
            showToast('Erro: questionário não identificado', 'error');
            return;
        }
        
        const titulo = document.getElementById('questionario-titulo-editor').value.trim();
        const descricao = document.getElementById('questionario-descricao-editor').value.trim();
        const status = document.getElementById('questionario-status-editor').value;
        
        if (!titulo) {
            showToast('Digite um título para o questionário', 'error');
            return;
        }
        
        // Atualizar questionário
        const response = await fetch(`/questionarios/${currentQuestionarioId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                titulo: titulo,
                descricao: descricao || null,
                status: status
            })
        });
        
        if (!response.ok) {
            throw new Error('Erro ao salvar questionário');
        }
        
        // Salvar perguntas
        await salvarPerguntas();
        
        showToast('Questionário salvo com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao salvar questionário:', error);
        showToast('Erro ao salvar questionário. Tente novamente.', 'error');
    }
}

async function salvarPerguntas() {
    const token = localStorage.getItem('authToken');
    
    // Excluir todas as perguntas antigas e criar novas
    for (let i = 0; i < currentPerguntas.length; i++) {
        const pergunta = currentPerguntas[i];
        
        try {
            const response = await fetch(`/questionarios/${currentQuestionarioId}/perguntas`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    titulo: pergunta.texto || pergunta.titulo || 'Nova pergunta',
                    tipo: pergunta.tipo,
                    descricao: pergunta.descricao || null,
                    obrigatoria: pergunta.obrigatoria || false,
                    ordem: i,
                    configuracoes: pergunta.configuracoes || {},
                    opcoes: pergunta.opcoes || []
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Erro ao salvar pergunta:', errorData);
            }
        } catch (error) {
            console.error('Erro ao salvar pergunta:', error);
        }
    }
}

async function publicarQuestionario() {
    const titulo = document.getElementById('questionario-titulo-editor').value.trim();
    
    if (!titulo) {
        showToast('Digite um título antes de publicar', 'error');
        return;
    }
    
    if (currentPerguntas.length === 0) {
        showToast('Adicione pelo menos uma pergunta antes de publicar', 'error');
        return;
    }
    
    if (confirm('Deseja publicar este questionário? Ele ficará disponível para os membros.')) {
        document.getElementById('questionario-status-editor').value = 'publicado';
        await salvarQuestionario();
        showToast('Questionário publicado!', 'success');
    }
}

function previewQuestionario() {
    if (currentPerguntas.length === 0) {
        showToast('Adicione perguntas para visualizar o preview', 'info');
        return;
    }
    
    showToast('Preview em desenvolvimento', 'info');
}

// Menu Principal do Questionário
function toggleMenuPrincipalQuestionario(event) {
    event.stopPropagation();
    const menu = document.getElementById('menu-principal-questionario');
    if (!menu) return;
    
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    
    // Fechar ao clicar fora
    if (menu.style.display === 'block') {
        setTimeout(() => {
            const closeHandler = (e) => {
                if (!e.target.closest('.questionario-menu-principal')) {
                    menu.style.display = 'none';
                    document.removeEventListener('click', closeHandler);
                }
            };
            document.addEventListener('click', closeHandler);
        }, 10);
    }
}

function mostrarPrevia() {
    previewQuestionario();
    document.getElementById('menu-principal-questionario').style.display = 'none';
}

function abrirRelatorio() {
    showToast('Relatório em desenvolvimento', 'info');
    document.getElementById('menu-principal-questionario').style.display = 'none';
}

function compartilharQuestionario() {
    showToast('Compartilhamento em desenvolvimento', 'info');
    document.getElementById('menu-principal-questionario').style.display = 'none';
}

function configurarQuestionario() {
    showToast('Configurações em desenvolvimento', 'info');
    document.getElementById('menu-principal-questionario').style.display = 'none';
}

function ocultarQuestionario() {
    showToast('Ocultar em desenvolvimento', 'info');
    document.getElementById('menu-principal-questionario').style.display = 'none';
}

// Funções de IA
async function sugerirPerguntasIA() {
    const titulo = document.getElementById('questionario-titulo-editor').value.trim();
    const descricao = document.getElementById('questionario-descricao-editor').value.trim();
    
    if (!titulo) {
        showToast('Digite um título para o questionário antes de gerar sugestões', 'error');
        return;
    }
    
    const container = document.getElementById('ia-sugestoes-container');
    container.innerHTML = '<p style="text-align:center; color:#7f8c8d; font-size:0.8rem;">Gerando sugestões com IA...</p>';
    
    try {
        const token = localStorage.getItem('authToken');
        
        // Chamar endpoint de IA
        const response = await fetch('/api/ia/sugerir-perguntas', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                titulo: titulo,
                descricao: descricao,
                contexto: 'questionario_gym_wellness'
            })
        });
        
        if (!response.ok) {
            throw new Error('Erro ao gerar sugestões');
        }
        
        const sugestoes = await response.json();
        
        if (sugestoes && sugestoes.length > 0) {
            container.innerHTML = sugestoes.map((sugestao, index) => `
                <div class="tipo-pergunta-card" style="cursor:pointer;" onclick="adicionarPerguntaSugerida(${index})">
                    <i class="fas fa-sparkles"></i>
                    <div>
                        <strong>${sugestao.texto}</strong>
                        <span>${sugestao.tipo}</span>
                    </div>
                </div>
            `).join('');
            
            // Guardar sugestões temporariamente
            window.currentSugestoes = sugestoes;
            
            showToast('Sugestões geradas!', 'success');
        } else {
            container.innerHTML = '<p style="text-align:center; color:#95a5a6; font-size:0.8rem;">Nenhuma sugestão disponível</p>';
        }
        
    } catch (error) {
        console.error('Erro ao gerar sugestões:', error);
        container.innerHTML = '<p style="text-align:center; color:#e74c3c; font-size:0.8rem;">Erro ao gerar sugestões. Tente novamente.</p>';
        showToast('Erro ao gerar sugestões de IA', 'error');
    }
}

function adicionarPerguntaSugerida(index) {
    if (window.currentSugestoes && window.currentSugestoes[index]) {
        const sugestao = window.currentSugestoes[index];
        
        const novaPergunta = {
            id: `pergunta_${Date.now()}`,
            tipo: sugestao.tipo || 'texto_curto',
            texto: sugestao.texto,
            obrigatoria: sugestao.obrigatoria || false,
            ordem: currentPerguntas.length,
            opcoes: sugestao.opcoes || []
        };
        
        currentPerguntas.push(novaPergunta);
        renderPerguntas();
        
        showToast('Pergunta adicionada!', 'success');
    }
}

async function melhorarComIA() {
    if (currentPerguntas.length === 0) {
        showToast('Adicione perguntas antes de melhorar com IA', 'error');
        return;
    }
    
    showToast('Melhorando questionário com IA...', 'info');
    
    try {
        const token = localStorage.getItem('authToken');
        const titulo = document.getElementById('questionario-titulo-editor').value.trim();
        
        const response = await fetch('/api/ia/melhorar-questionario', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                titulo: titulo,
                perguntas: currentPerguntas
            })
        });
        
        if (!response.ok) {
            throw new Error('Erro ao melhorar questionário');
        }
        
        const resultado = await response.json();
        
        if (resultado.perguntas) {
            currentPerguntas = resultado.perguntas;
            renderPerguntas();
            showToast('Questionário melhorado com IA!', 'success');
        }
        
    } catch (error) {
        console.error('Erro ao melhorar com IA:', error);
        showToast('Funcionalidade de IA em desenvolvimento', 'info');
    }
}


// Atualizar contadores do editor
function atualizarContadoresEditor() {
    const totalPerguntas = currentPerguntas.length;
    
    // Estimar tempo baseado no tipo de pergunta
    // Texto curto/número: 30s, Texto longo: 1min, Escolha: 20s, Outros: 30s
    let tempoEstimado = 0;
    currentPerguntas.forEach(p => {
        switch(p.tipo) {
            case 'texto_longo':
            case 'resposta_textual':
                tempoEstimado += 60; // 1 minuto
                break;
            case 'escolha_unica':
            case 'escolha_multipla':
            case 'classificacao':
                tempoEstimado += 20; // 20 segundos
                break;
            case 'problemas_musculares':
            case 'problemas_osseos':
            case 'problemas_cardio':
                tempoEstimado += 45; // 45 segundos (mais detalhado)
                break;
            default:
                tempoEstimado += 30; // 30 segundos
        }
    });
    
    const minutos = Math.ceil(tempoEstimado / 60);
    
    // Atualizar UI
    const contadorPerguntas = document.getElementById('contador-perguntas');
    const contadorTempo = document.getElementById('contador-tempo');
    
    if (contadorPerguntas) {
        contadorPerguntas.textContent = `${totalPerguntas} ${totalPerguntas === 1 ? 'pergunta' : 'perguntas'}`;
    }
    
    if (contadorTempo) {
        contadorTempo.textContent = `${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`;
    }
}

