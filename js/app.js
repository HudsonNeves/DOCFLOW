/* DOCFLOW - interações do protótipo */
(() => {
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  const STORAGE_KEY = "docflow-state-v1";

  const initialDocuments = [
    { name: "Contrato de prestação de serviços.pdf", vendor: "Alfa Tecnologia", category: "Contratos", date: "06/11/2026", status: "Organizado" },
    { name: "Nota fiscal #2038.pdf", vendor: "Comercial Beta", category: "Notas fiscais", date: "06/11/2026", status: "Pendente" },
    { name: "Política de privacidade.docx", vendor: "Administrativo", category: "Documentos internos", date: "05/11/2026", status: "Organizado" },
    { name: "Recibo de pagamento.pdf", vendor: "João Martins", category: "Recibos", date: "04/11/2026", status: "Em análise" },
    { name: "Contrato de locação.pdf", vendor: "Imóveis Central", category: "Contratos", date: "03/11/2026", status: "Organizado" },
    { name: "Nota fiscal #2037.pdf", vendor: "Fornecedor Delta", category: "Notas fiscais", date: "02/11/2026", status: "Organizado" }
  ];

  const initialApprovals = [
    { name: "Nota fiscal #2038.pdf", vendor: "Comercial Beta", date: "06/11/2026" },
    { name: "Recibo de pagamento.pdf", vendor: "João Martins", date: "04/11/2026" },
    { name: "Cadastro de fornecedor.pdf", vendor: "Fornecedor Gama", date: "03/11/2026" }
  ];

  const deadlines = [
    { name: "Contrato de locação", vendor: "Imóveis Central", date: "12/11/2026", days: "5 dias" },
    { name: "Contrato de serviços", vendor: "Alfa Tecnologia", date: "20/11/2026", days: "13 dias" },
    { name: "Certidão negativa", vendor: "Fiscal", date: "29/11/2026", days: "22 dias" },
    { name: "Licença de operação", vendor: "Administrativo", date: "07/12/2026", days: "30 dias" }
  ];

  const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);

  const categoryIcon = category => ({
    "Contratos": "📄", "Notas fiscais": "🧾", "Recibos": "🗂️", "Documentos internos": "📁"
  })[category] || "📁";

  const statusHTML = status => {
    const css = status === "Organizado" ? "organizado" : status === "Pendente" ? "pendente" : "analise";
    return `<span class="status ${css}">${escapeHTML(status)}</span>`;
  };

  let toastTimer;
  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  let documents = initialDocuments;
  let approvals = initialApprovals;
  let settings = {
    companyName: "Minha Empresa Ltda.",
    adminName: "Ana Costa",
    notificationsEnabled: true
  };

  function loadState() {
    let serialized;
    try {
      serialized = localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      console.error("Não foi possível ler os dados locais do DOCFLOW.", error);
      showToast("Não foi possível acessar o armazenamento deste navegador.");
      return;
    }
    if (!serialized) return;

    try {
      const state = JSON.parse(serialized);
      const validDocuments = Array.isArray(state.documents) && state.documents.every(doc =>
        doc && ["name", "vendor", "category", "date", "status"].every(key => typeof doc[key] === "string")
      );
      const validApprovals = Array.isArray(state.approvals) && state.approvals.every(item =>
        item && ["name", "vendor", "date"].every(key => typeof item[key] === "string")
      );
      const validSettings = state.settings &&
        typeof state.settings.companyName === "string" &&
        typeof state.settings.adminName === "string" &&
        typeof state.settings.notificationsEnabled === "boolean";

      if (!validDocuments || !validApprovals || !validSettings) {
        throw new Error("Formato dos dados locais inválido.");
      }

      documents = state.documents;
      approvals = state.approvals;
      settings = state.settings;
    } catch (error) {
      console.error("Os dados locais do DOCFLOW estão inválidos.", error);
      showToast("Não foi possível carregar os dados salvos; os dados de demonstração serão exibidos.");
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ documents, approvals, settings }));
      return true;
    } catch (error) {
      console.error("Não foi possível salvar os dados locais do DOCFLOW.", error);
      showToast("Não foi possível salvar neste navegador. Verifique o espaço disponível.");
      return false;
    }
  }

  loadState();

  function navigate(view) {
    $$(".view").forEach(section => section.classList.toggle("active", section.id === `view-${view}`));
    $$(".nav-link[data-view]").forEach(button => button.classList.toggle("active", button.dataset.view === view));
    const labels = {
      dashboard: "Visão geral", documents: "Documentos", categories: "Categorias",
      approvals: "Aprovações", deadlines: "Prazos e agenda", assistant: "Assistente IA",
      reports: "Relatórios", settings: "Configurações"
    };
    $("#breadcrumbCurrent").textContent = labels[view] || "Workspace";
    $("#sidebar").classList.remove("open");
    if (view === "documents") renderDocuments();
  }

  function renderDocumentRow(doc, index, compact = false) {
    return `<div class="document-row">
      <span class="file-icon">${categoryIcon(doc.category)}</span>
      <div class="file-info"><strong>${escapeHTML(doc.name)}</strong><small>${escapeHTML(doc.vendor)}</small></div>
      <span class="file-category">${escapeHTML(doc.category)}</span>
      <span class="file-date">${escapeHTML(doc.date)}</span>
      ${statusHTML(doc.status)}
      ${compact ? "" : `<button class="row-menu" data-document-index="${index}" aria-label="Detalhes do documento">⋯</button>`}
    </div>`;
  }

  function renderRecent() {
    $("#recentList").innerHTML = documents.slice(0, 4).map(doc =>
      renderDocumentRow(doc, documents.indexOf(doc), true)).join("");
  }

  function renderDocuments() {
    const query = ($("#documentSearch").value + " " + $("#globalSearch").value).trim().toLowerCase();
    const category = $("#categoryFilter").value;
    const status = $("#statusFilter").value;
    const filtered = documents.filter(doc =>
      `${doc.name} ${doc.vendor}`.toLowerCase().includes(query) &&
      (!category || doc.category === category) &&
      (!status || doc.status === status)
    );
    $("#documentCount").textContent = `(${filtered.length})`;
    $("#documentList").innerHTML = filtered.length
      ? filtered.map(doc => renderDocumentRow(doc, documents.indexOf(doc))).join("")
      : `<div class="empty-state">Nenhum documento encontrado. Tente alterar os filtros.</div>`;
  }

  function renderCategories() {
    const categories = ["Contratos", "Notas fiscais", "Documentos internos", "Recibos"];
    $("#categoryCards").innerHTML = categories.map(category => {
      const count = documents.filter(doc => doc.category === category).length;
      return `<button class="panel category-card" data-category="${escapeHTML(category)}">
        <span class="category-icon">${categoryIcon(category)}</span>
        <strong>${escapeHTML(category)}</strong>
        <p>${count} documentos cadastrados</p>
        <small>Ver documentos →</small>
      </button>`;
    }).join("");
  }

  function renderApprovals() {
    $("#approvalCount").textContent = approvals.length;
    $("#approvalList").innerHTML = approvals.length ? approvals.map((item, index) => `
      <div class="approval-row">
        <div><strong>${escapeHTML(item.name)}</strong><small>${escapeHTML(item.vendor)} · ${escapeHTML(item.date)}</small></div>
        <div class="approval-actions">
          <button class="button soft" data-reject="${index}">Reprovar</button>
          <button class="button primary" data-approve="${index}">Aprovar</button>
        </div>
      </div>`).join("") : `<div class="empty-state">Tudo em dia! Nenhuma aprovação pendente.</div>`;
  }

  function renderDeadlines() {
    $("#deadlineList").innerHTML = deadlines.map(item => `
      <div class="deadline-row">
        <div class="deadline-left">
          <div class="date-box"><small>NOV/DEZ</small><strong>${item.date.slice(0, 2)}</strong></div>
          <div><strong>${escapeHTML(item.name)}</strong><small>${escapeHTML(item.vendor)}</small></div>
        </div>
        <div class="deadline-right"><b>${escapeHTML(item.days)}</b><small>${escapeHTML(item.date)}</small></div>
      </div>`).join("");
  }

  function renderSettings() {
      $("#companyName").value = settings.companyName;
      $("#adminName").value = settings.adminName;
      $("#notificationsEnabled").checked = settings.notificationsEnabled;
      $("#administratorGreeting").textContent = settings.adminName.split(/\s+/)[0] || "Ana";
      $("#profileName").textContent = settings.adminName;
  }

  function openModal() {
    $("#uploadModal").classList.add("open");
    $("#uploadModal").setAttribute("aria-hidden", "false");
    $("#newName").focus();
  }
  function closeModal() {
    $("#uploadModal").classList.remove("open");
    $("#uploadModal").setAttribute("aria-hidden", "true");
  }

  // Navegação
  $$(".nav-link[data-view]").forEach(button => button.addEventListener("click", () => navigate(button.dataset.view)));
  $$("[data-go]").forEach(button => button.addEventListener("click", () => navigate(button.dataset.go)));
  $("#mobileMenu").addEventListener("click", () => $("#sidebar").classList.toggle("open"));

  // Upload/cadastro demonstrativo
  $$("[data-open-upload]").forEach(button => button.addEventListener("click", openModal));
  $("#closeModal").addEventListener("click", closeModal);
  $("#cancelModal").addEventListener("click", closeModal);
  $("#uploadModal").addEventListener("click", event => {
    if (event.target === $("#uploadModal")) closeModal();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeModal();
  });

  $("#uploadForm").addEventListener("submit", event => {
    event.preventDefault();
    const file = $("#newFile").files[0];
    const typedName = $("#newName").value.trim();
    const name = typedName || (file ? file.name : "");
    documents.unshift({
      name, vendor: $("#newVendor").value.trim(), category: $("#newCategory").value,
      date: new Date().toLocaleDateString("pt-BR"), status: "Organizado"
    });
    $("#uploadForm").reset();
    closeModal();
    renderAll();
    navigate("documents");
    if (saveState()) {
      showToast(file
        ? "Documento cadastrado. Somente os dados e o nome do arquivo foram salvos neste navegador."
        : "Documento cadastrado neste navegador.");
    }
  });

  // Pesquisa e filtros
  ["documentSearch", "categoryFilter", "statusFilter"].forEach(id => {
    $(`#${id}`).addEventListener("input", renderDocuments);
  });
  $("#globalSearch").addEventListener("input", () => {
    navigate("documents");
    $("#documentSearch").value = "";
    renderDocuments();
  });

  // Categorias
  $("#categoryCards").addEventListener("click", event => {
    const card = event.target.closest("[data-category]");
    if (!card) return;
    navigate("documents");
    $("#categoryFilter").value = card.dataset.category;
    renderDocuments();
  });

  // Detalhes e aprovações
  $("#documentList").addEventListener("click", event => {
    const button = event.target.closest("[data-document-index]");
    if (!button) return;
    const doc = documents[Number(button.dataset.documentIndex)];
    showToast(`${doc.name} · ${doc.status}`);
  });

  $("#approvalList").addEventListener("click", event => {
    const approveButton = event.target.closest("[data-approve]");
    const rejectButton = event.target.closest("[data-reject]");
    if (approveButton) {
      const [item] = approvals.splice(Number(approveButton.dataset.approve), 1);
      const doc = documents.find(document => document.name === item.name);
      if (doc) doc.status = "Organizado";
      renderAll();
      if (saveState()) showToast("Documento aprovado e atualizado neste navegador.");
    }
    if (rejectButton) {
      approvals.splice(Number(rejectButton.dataset.reject), 1);
      renderAll();
      if (saveState()) showToast("Solicitação reprovada neste navegador.");
    }
  });

  // Assistente demonstrativo
  function sendChat(message) {
    const query = message.trim();
    if (!query) return;
    const messages = $("#chatMessages");
    const user = document.createElement("div");
    user.className = "chat-bubble user";
    user.textContent = query;
    messages.appendChild(user);

    let response;
    if (/contrato|venc/i.test(query)) {
      response = "Na demonstração, há 2 contratos cadastrados. Consulte a área “Prazos e agenda” para visualizar os vencimentos.";
    } else if (/pend|aprova/i.test(query)) {
      response = `Existem ${approvals.length} documentos aguardando aprovação no protótipo.`;
    } else if (/nota fiscal/i.test(query)) {
      response = `${documents.filter(doc => doc.category === "Notas fiscais").length} notas fiscais estão cadastradas na demonstração.`;
    } else {
      response = `O acervo possui ${documents.length} documentos nesta demonstração. Experimente perguntar sobre contratos, notas fiscais ou pendências.`;
    }
    const bot = document.createElement("div");
    bot.className = "chat-bubble bot";
    bot.textContent = response;
    messages.append(user, bot);
    $("#chatInput").value = "";
  }

  $("#chatForm").addEventListener("submit", event => {
    event.preventDefault();
    sendChat($("#chatInput").value);
  });
  $$(".suggestions button").forEach(button => button.addEventListener("click", () => sendChat(button.textContent)));

  $("#notifications").addEventListener("click", () => showToast("Você tem 3 alertas para revisar."));
  $("#settingsForm").addEventListener("submit", event => {
    event.preventDefault();
    settings = {
      companyName: $("#companyName").value.trim(),
      adminName: $("#adminName").value.trim(),
      notificationsEnabled: $("#notificationsEnabled").checked
    };
    renderSettings();
    if (saveState()) showToast("Preferências salvas neste navegador.");
  });

  function renderAll() {
    renderRecent();
    renderDocuments();
    renderCategories();
    renderApprovals();
    renderDeadlines();
    renderSettings();
    $("#dashboardDate").textContent = new Intl.DateTimeFormat("pt-BR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    }).format(new Date());
    $("#totalDocuments").textContent = documents.length.toLocaleString("pt-BR");
    $("#categoryTotal").textContent = documents.length.toLocaleString("pt-BR");
    $("#pendingMetric").textContent = approvals.length.toLocaleString("pt-BR");
  }

  renderAll();
})();
