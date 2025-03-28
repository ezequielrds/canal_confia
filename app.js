// Mock data
const companies = [
    { cnpj: "00.063.375", name: "CASA LIMPA INDUSTRIA E COMERCIO DE PRODUTOS DE LIMPEZA LTDA - ME", classification: "D", 
      accessibleBy: ["AUDITOR", "JOSE_CONTADOR", "JOAO_SOCIO"] },
    { cnpj: "00.092.446", name: "ABS LOG TRANSPORTES E ORGANIZACAO LOGISTICA LTDA", classification: "A", 
      accessibleBy: ["AUDITOR", "JOSE_CONTADOR", "MARIA_SOCIA"] },
    { cnpj: "00.116.275", name: "CAPIXABA COMERCIO DE MATERIAIS DE CONSTRUCAO LTDA", classification: "D", 
      accessibleBy: ["AUDITOR", "MARIA_SOCIA"] }
  ];

  // User roles and display names
  const userRoles = {
    "AUDITOR": "AUDITOR",
    "JOSE_CONTADOR": "José (Contador)",
    "JOAO_SOCIO": "João (sócio)",
    "MARIA_SOCIA": "Maria (sócia)"
  };
  
  let communications = []; // Array to hold all communication threads
  let evaluations = {}; // Avaliações por CNPJ: { cnpj: { auditorRating, auditorFeedback, companyRating, companyFeedbackText, auditorHasRated, companyHasRated } }
  let communicationIdCounter = 0; // Simple ID generator

  // Current state
  let currentRole = "AUDITOR";
  let currentCompany = null; // { cnpj, name, role }
  let currentCommunicationId = null; // ID da comunicação aberta no chat
  let isInboxViewActive = false;

  // --- Helper Functions ---
  function generateCommId() {
  communicationIdCounter++;
  return `#${communicationIdCounter}`;
  }

  function getCommunicationById(id) {
    return communications.find(c => c.id === id);
  }

  // Encontra a comunicação MAIS RECENTE (qualquer status) para um dado CNPJ
  function findLatestCommunication(cnpj) {
    const companyComms = communications.filter(c => c.cnpj === cnpj)
      .sort((a, b) => b.messages[0].timestamp - a.messages[0].timestamp);
    return companyComms.length > 0 ? companyComms[0] : null;
  }

  // Encontra a comunicação MAIS RECENTE com status diferente de 'Encerrada'
  function findLatestActiveCommunication(cnpj) {
    const companyComms = communications
      .filter(c => c.cnpj === cnpj && c.status !== 'Encerrada')
      .sort((a, b) => b.messages[0].timestamp - a.messages[0].timestamp);
    return companyComms.length > 0 ? companyComms[0] : null;
  }

  // Cria uma nova comunicação ou retorna a última ativa
  function getOrCreateCommunication(cnpj, forceNew = false) {
    if (!forceNew) {
      const activeComm = findLatestActiveCommunication(cnpj);
      if (activeComm) {
        return activeComm;
      }
    }
    const company = companies.find(c => c.cnpj === cnpj);
    const newComm = {
      id: generateCommId(),
      cnpj,
      subject: "Confia Paraná",
      status: "Em análise",
      messages: [{
        sender: "Sistema",
        text: "Comunicação iniciada.",
        status: "Em análise",
        timestamp: new Date()
      }],
      responsible: "AUDITOR",
      auditorHasRated: false,
      companyHasRated: false
    };
    communications.push(newComm);
    if (!evaluations[cnpj]) {
      evaluations[cnpj] = { auditorRating: null, auditorFeedback: {}, companyRating: null, companyFeedbackText: '', auditorHasRated: false, companyHasRated: false };
    }
    evaluations[cnpj].auditorHasRated = false;
    evaluations[cnpj].companyHasRated = false;
    return newComm;
  }

  function getSelectedRadioValue(name) {
    const radios = document.getElementsByName(name);
    for (let i = 0; i < radios.length; i++) {
      if (radios[i].checked) return radios[i].value;
    }
    return null;
  }

  // Fix for needsAttention function to handle access to closed communications
  function needsAttention(comm) {
    if (!comm || !comm.messages || comm.messages.length === 0) return false;
    const company = companies.find(c => c.cnpj === comm.cnpj);
    if (!company) return false;
    
    // For inbox counter and highlighting, only count unread messages
    if (isInboxViewActive === false) {
      // For notification badge counting
      const lastMessage = comm.messages[comm.messages.length - 1];
      if (comm.status === "Encerrada") return false;
      
      // For auditor, message needs attention if last sender is not auditor or system
      if (currentRole === "AUDITOR") {
        return lastMessage.sender !== "AUDITOR" && lastMessage.sender !== "Sistema";
      }
      
      // For company users, message needs attention if not from current role or system
      if (company.accessibleBy.includes(currentRole)) {
        return lastMessage.sender !== currentRole && lastMessage.sender !== "Sistema";
      }
    }
    
    // Always allow access to accessible companies' communications
    return company.accessibleBy.includes(currentRole);
  }

  // --- Core UI Functions ---
  function switchRole(role) {
    currentRole = role;
    document.getElementById("currentRole").textContent = userRoles[role];
    document.getElementById("chatBox").style.display = "none";
    document.getElementById("communicationsPanel").style.display = "none";
    document.getElementById("consultaEmpresasContainer").style.display = "block";
    isInboxViewActive = false;
    document.getElementById("inboxBtn").classList.remove('active');
    currentCompany = null;
    currentCommunicationId = null;
    document.getElementById("panelButtonContainer").style.display = (role === 'AUDITOR') ? 'flex' : 'none';
    populateCompanyList();
    updateInboxStatus();
  }

  function populateCompanyList() {
    const companyList = document.getElementById("companyList");
    const statusFilter = document.getElementById("statusFilter").value;
    const cnpjFilter = document.getElementById("cnpjFilter").value.toLowerCase();
    companyList.innerHTML = "";

    let displayCompanies = companies.filter(company => {
      // Only show companies accessible by the current role
      return company.accessibleBy.includes(currentRole);
    }).filter(company => {
      const latestComm = findLatestCommunication(company.cnpj);
      const currentStatus = latestComm ? latestComm.status : "Sem comunicação";
      const matchesStatus = statusFilter ? currentStatus === statusFilter : true;
      const matchesCNPJ = cnpjFilter ? company.cnpj.toLowerCase().includes(cnpjFilter) : true;
      return matchesStatus && matchesCNPJ;
    });

    displayCompanies.forEach(company => {
      const latestComm = findLatestCommunication(company.cnpj);
      const companyEval = evaluations[company.cnpj] || {};
      const row = document.createElement("tr");
      let actionButtonHTML = '-';

      if (currentRole === "AUDITOR") {
        if (!latestComm || latestComm.status === 'Encerrada') {
          actionButtonHTML = `<button class="btn btn-primary btn-sm" onclick="startChat('${company.cnpj}', '${company.name}', 'AUDITOR', null, true)">Iniciar Comunicação</button>`;
        } else {
          actionButtonHTML = `<button class="btn btn-primary btn-sm" onclick="startChat('${company.cnpj}', '${company.name}', 'AUDITOR', '${latestComm.id}')">Abrir Comunicação (${latestComm.id})</button>`;
        }
      } else { // Usuário Empresa
        if (latestComm) {
          if (latestComm.status !== 'Encerrada') {
            actionButtonHTML = `<button class="btn btn-info btn-sm" onclick="startChat('${company.cnpj}', '${company.name}', '${currentRole}', '${latestComm.id}')">Abrir Comunicação (${latestComm.id})</button>`;
          } else if (!companyEval.companyHasRated) {
            actionButtonHTML = `<button class="btn btn-warning btn-sm" onclick="openEvaluation('${company.cnpj}', '${company.name}', '${currentRole}', '${latestComm.id}')">Avaliar (${latestComm.id})</button>`;
          } else {
            actionButtonHTML = `<span class="text-muted">Avaliado</span>`;
          }
        } else {
          // Se não houver comunicação e a empresa for de classificação "A", permite iniciar comunicação
          if (company.classification === "A") {
            actionButtonHTML = `<button class="btn btn-primary btn-sm" onclick="startChat('${company.cnpj}', '${company.name}', '${currentRole}', null, true)">Iniciar Comunicação</button>`;
          } else {
            actionButtonHTML = '-';
          }
        }
      }

      row.innerHTML = `
        <td>${company.cnpj}</td>
        <td>${company.name}</td>
        <td>${company.classification}</td>
        <td>${actionButtonHTML}</td>
      `;
      companyList.appendChild(row);
    });
  }

  function updateInboxStatus() {
    let inboxCount = 0;
    communications.forEach(comm => {
      if (needsAttention(comm)) { inboxCount++; }
    });
    const inboxIcon = document.getElementById("inboxIcon");
    const inboxCountSpan = document.getElementById("inboxCount");
    if (inboxCount > 0) {
      inboxIcon.classList.add("active");
      inboxCountSpan.style.display = "inline";
      inboxCountSpan.textContent = inboxCount;
    } else {
      inboxIcon.classList.remove("active");
      inboxCountSpan.style.display = "none";
    }
  }

  function toggleInboxView() {
    isInboxViewActive = true;
    document.getElementById("inboxBtn").classList.add('active');
    document.getElementById("consultaEmpresasContainer").style.display = "none";
    document.getElementById("chatBox").style.display = "none";
    document.getElementById("communicationsPanel").style.display = "block";
    populateCommunicationsPanel();
  }

  function returnToCompanyList() {
    document.getElementById("chatBox").style.display = "none";
    document.getElementById("communicationsPanel").style.display = "none";
    document.getElementById("consultaEmpresasContainer").style.display = "block";
    isInboxViewActive = false;
    document.getElementById("inboxBtn").classList.remove('active');
    document.getElementById("panelButtonContainer").style.display = (currentRole === 'AUDITOR') ? 'flex' : 'none';
  }

  function applyFilters() {
    isInboxViewActive = false;
    document.getElementById("inboxBtn").classList.remove('active');
    populateCompanyList();
  }

  // --- Communications Panel ---
  function toggleCommunicationsPanel() {
    if (currentRole !== 'AUDITOR') return;
    const panel = document.getElementById("communicationsPanel");
    const consultaContainer = document.getElementById("consultaEmpresasContainer");
    const inboxContainer = document.getElementById("inboxContainer");
    const panelButton = document.getElementById("communicationsPanelBtn");
    if (panel.style.display === "none") {
      populateCommunicationsPanel();
      panel.style.display = "block";
      if (consultaContainer) consultaContainer.style.display = "none";
      if (inboxContainer) inboxContainer.style.display = "block";
      document.getElementById("chatBox").style.display = "none";
      // Altera o texto e a cor do botão para azul (btn-primary)
      panelButton.textContent = "Voltar para relação de empresas";
      panelButton.className = "btn btn-primary";
    } else {
      panel.style.display = "none";
      if (consultaContainer) consultaContainer.style.display = "block";
      if (inboxContainer) inboxContainer.style.display = "block";
      // Restaura o texto original e a classe original (btn-secondary)
      panelButton.textContent = "Painel de Comunicações";
      panelButton.className = "btn btn-secondary";
    }
  }

  function populateCommunicationsPanel() {
    const panelList = document.getElementById("communicationsPanelList");
    panelList.innerHTML = "";
    const cnpjFilterPanel = document.getElementById("panelCnpjFilter").value.toLowerCase();
    const nameFilterPanel = document.getElementById("panelNameFilter").value.toLowerCase();
    
    // Filter communications based on current role and access
    const filteredComms = communications.filter(comm => {
      const company = companies.find(c => c.cnpj === comm.cnpj);
      if (!company) return false;
      
      // Check if user has access to this company
      if (!company.accessibleBy.includes(currentRole)) return false;
      
      // Apply filters
      const matchesCnpj = cnpjFilterPanel ? comm.cnpj.toLowerCase().includes(cnpjFilterPanel) : true;
      const matchesName = nameFilterPanel ? company.name.toLowerCase().includes(nameFilterPanel) : true;
      
      // If inbox view is active, use needsAttention for unread messages
      if (isInboxViewActive && currentRole === "AUDITOR") {
        // For auditor, check if it needs attention
        const lastMessage = comm.messages[comm.messages.length - 1];
        return matchesCnpj && matchesName && 
               (lastMessage.sender !== "AUDITOR" && lastMessage.sender !== "Sistema" && comm.status !== "Encerrada");
      } else if (isInboxViewActive) {
        // For non-auditors, show all accessible communications
        return matchesCnpj && matchesName;
      }
      
      return matchesCnpj && matchesName;
    }).sort((a, b) => b.messages[0].timestamp - a.messages[0].timestamp);

    if (filteredComms.length === 0) {
      panelList.innerHTML = '<tr><td colspan="6">Nenhuma comunicação encontrada com os filtros aplicados.</td></tr>';
      return;
    }

    filteredComms.forEach(comm => {
      const company = companies.find(c => c.cnpj === comm.cnpj);
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${comm.id}</td>
        <td>${comm.cnpj}</td>
        <td>${company.name}</td>
        <td>${comm.subject}</td>
        <td>${comm.status}</td>
        <td>
          <button class="btn btn-info btn-sm" onclick="openChatFromPanel('${comm.id}')">
            Abrir (${comm.id})
          </button>
        </td>
      `;
      panelList.appendChild(row);
    });
  }

  function openChatFromPanel(communicationIdToOpen) {
    const comm = getCommunicationById(communicationIdToOpen);
    if (comm) {
      const company = companies.find(c => c.cnpj === comm.cnpj);
      startChat(comm.cnpj, company.name, currentRole, communicationIdToOpen);
    } else {
      alert("Erro: Comunicação não encontrada.");
    }
  }

  // --- Chat Box Functions ---
  function startChat(cnpj, name, role, communicationIdToOpen = null, forceNew = false) {
    let comm;
    if (communicationIdToOpen) {
      comm = getCommunicationById(communicationIdToOpen);
      if (!comm) {
        alert("Erro: Comunicação não encontrada.");
        return;
      }
    } else {
      comm = getOrCreateCommunication(cnpj, forceNew);
    }
    currentCompany = { cnpj, name, role };
    currentCommunicationId = comm.id;

    // Hide company list and show chat box
    document.getElementById("consultaEmpresasContainer").style.display = "none";
    document.getElementById("communicationsPanel").style.display = "none";
    document.getElementById("chatBox").style.display = "block";

    document.getElementById("companyName").textContent = name;
    document.getElementById("companyCNPJ").textContent = cnpj;
    document.getElementById("chatCommId").textContent = comm.id;
    document.getElementById("subject").value = comm.subject;

    // ...existing code for setting up the chat...
    const messageInput = document.getElementById("messageInput");
    const sendMessageBtn = document.getElementById("sendMessageBtn");
    const closeChatBtn = document.getElementById("closeChatBtn");
    const surveyAuditor = document.getElementById("surveyAuditor");
    const surveyCompany = document.getElementById("surveyCompany");
    const companyEvaluationDisplay = document.getElementById("companyEvaluationDisplay");

    messageInput.disabled = false;
    sendMessageBtn.disabled = false;
    closeChatBtn.style.display = "none";
    surveyAuditor.style.display = "none";
    surveyCompany.style.display = "none";
    companyEvaluationDisplay.style.display = "none";

    const companyEval = evaluations[cnpj] || {};

    if (comm.status === "Encerrada") {
      messageInput.disabled = true;
      sendMessageBtn.disabled = true;
      closeChatBtn.style.display = "none";

      if (currentRole !== 'AUDITOR' && !companyEval.companyHasRated) {
        surveyCompany.style.display = "block";
        document.getElementsByName('companyRating').forEach(radio => radio.checked = false);
        document.getElementById('companyFeedbackText').value = '';
      }
      if (currentRole === 'AUDITOR') {
        if (companyEval.companyHasRated) {
          document.getElementById("companyRatingText").textContent = `Nota da Empresa: ${companyEval.companyRating || 'N/A'}/5`;
          document.getElementById("companyFeedbackDisplayText").textContent = companyEval.companyFeedbackText || '(Nenhum comentário adicional)';
          companyEvaluationDisplay.style.display = "block";
        } else {
          document.getElementById("companyRatingText").textContent = `Empresa ainda não avaliou esta comunicação.`;
          document.getElementById("companyFeedbackDisplayText").textContent = '';
          companyEvaluationDisplay.style.display = "block";
        }
      }
    } else {
      messageInput.disabled = false;
      sendMessageBtn.disabled = false;
      if (currentRole === "AUDITOR") {
        closeChatBtn.style.display = "inline-block";
      }
    }

    updateChatMessages(comm.messages);
    updateInboxStatus();
  }

  function sendMessage() {
    if (!currentCommunicationId) return;
    const comm = getCommunicationById(currentCommunicationId);
    if (!comm || comm.status === "Encerrada") return;
    const messageInput = document.getElementById("messageInput");
    const attachment = document.getElementById("attachment").files[0];
    const subject = document.getElementById("subject").value;
    const messageText = messageInput.value.trim();
    if (!messageText) return;
    
    // Get the display name for the current role
    const senderDisplayName = userRoles[currentRole];
    
    // Check if this is the first non-system message in the communication
    const isFirstUserMessage = comm.messages.length === 1 && comm.messages[0].sender === "Sistema";
    
    comm.messages.push({
      sender: currentRole,
      senderName: senderDisplayName,
      text: `Assunto: ${subject}\nMensagem: ${messageText}${attachment ? "\nAnexo: " + attachment.name : ""}`,
      status: comm.status,
      timestamp: new Date()
    });
    comm.subject = subject;
    messageInput.value = "";
    document.getElementById("attachment").value = "";
    
    // Show the email popup when sending the first message
    if (isFirstUserMessage) {
      showEmailSentPopup();
    }
    
    updateChatMessages(comm.messages);
    updateInboxStatus();
  }

  function updateChatMessages(messages) {
    const chatMessages = document.getElementById("chatMessages");
    chatMessages.innerHTML = "";
    if (!messages) return;
    messages.forEach(msg => {
      const messageDiv = document.createElement("div");
      messageDiv.className = "message";
      
      // Use the sender's display name if available, otherwise use the role
      const displayName = msg.senderName || userRoles[msg.sender] || msg.sender;
      
      messageDiv.innerHTML = `<div class="sender">${displayName}</div><div>${msg.text.replace(/\n/g, '<br>')}</div><div class="status">Status: ${msg.status} | ${msg.timestamp.toLocaleString()}</div>`;
      chatMessages.appendChild(messageDiv);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function distributeTask(cnpj) {
    if (currentRole !== "AUDITOR") { alert("Apenas o Auditor pode distribuir tarefas."); return; }
    console.log(`Auditor ${currentRole} distribuiu/divulgou tarefa para ${cnpj}.`);
    alert(`Tarefa/Divulgação iniciada para ${cnpj}.`);
  }

  function closeChat() {
    if (currentRole !== 'AUDITOR' || !currentCommunicationId) return;
    const comm = getCommunicationById(currentCommunicationId);
    if (!comm || comm.status === "Encerrada") return;
    comm.messages.push({ sender: "Sistema", text: `Comunicação ${comm.id} encerrada pelo Auditor (${currentRole}).`, status: "Encerrada", timestamp: new Date() });
    comm.status = "Encerrada";
    updateChatMessages(comm.messages);
    updateInboxStatus();
    populateCompanyList();
    const companyEval = evaluations[comm.cnpj] || {};
    if (!companyEval.auditorHasRated) {
      document.getElementById("surveyAuditor").style.display = "block";
      document.getElementsByName('auditorRating').forEach(radio => radio.checked = false);
      document.getElementById('communicationWithAuditor').value = '';
      document.getElementById('programAdvantagesAuditor').value = '';
      document.getElementById('pendingResolutionAuditor').value = '';
    }
    document.getElementById("messageInput").disabled = true;
    document.getElementById("sendMessageBtn").disabled = true;
    document.getElementById("closeChatBtn").style.display = "none";
  }

  function submitSurvey() {
    if (!currentCompany || !currentCompany.cnpj) return;
    const cnpj = currentCompany.cnpj;
    if (!evaluations[cnpj]) {
      evaluations[cnpj] = { auditorRating: null, auditorFeedback: {}, companyRating: null, companyFeedbackText: '', auditorHasRated: false, companyHasRated: false };
    }
    if (currentRole === "AUDITOR") {
      const communicationWith = document.getElementById("communicationWithAuditor").value;
      const programAdvantages = document.getElementById("programAdvantagesAuditor").value;
      const pendingResolution = document.getElementById("pendingResolutionAuditor").value;
      const rating = getSelectedRadioValue("auditorRating");
      if (communicationWith && programAdvantages && pendingResolution && rating) {
        evaluations[cnpj].auditorRating = rating;
        evaluations[cnpj].auditorFeedback = { communicationWith, programAdvantages, pendingResolution };
        evaluations[cnpj].auditorHasRated = true;
        console.log(`Resultado do Contato (Auditor) para ${cnpj} (Comm: ${currentCommunicationId}) enviado: Nota ${rating}/5.`);
        document.getElementById("surveyAuditor").style.display = "none";
      } else {
        alert("Por favor, preencha todos os campos do resultado do contato, incluindo a nota.");
      }
    } else {
      const rating = getSelectedRadioValue("companyRating");
      const feedbackText = document.getElementById("companyFeedbackText").value.trim();
      if (rating) {
        evaluations[cnpj].companyRating = rating;
        evaluations[cnpj].companyFeedbackText = feedbackText;
        evaluations[cnpj].companyHasRated = true;
        console.log(`Avaliação da Empresa (${currentRole} - ${cnpj}, Comm: ${currentCommunicationId}) enviada: Nota ${rating}/5.`);
        document.getElementById("surveyCompany").style.display = "none";
        document.getElementById("chatBox").style.display = "none";
        populateCompanyList();
      } else {
        alert("Por favor, selecione uma nota de 1 a 5.");
      }
    }
  }

  // --- Popup de Notificação ---
  function showEmailSentPopup() {
    const popup = document.createElement('div');
    popup.id = 'emailSentPopup';
    popup.style.position = 'fixed';
    popup.style.top = '20px';
    popup.style.right = '20px';
    popup.style.backgroundColor = '#ffc107';
    popup.style.color = '#000';
    popup.style.padding = '15px';
    popup.style.borderRadius = '5px';
    popup.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
    popup.style.zIndex = '1000';
    popup.innerHTML = 'Foi enviado um e-mail sobre o início do contato <button style="background: none; border: none; font-weight: bold; cursor: pointer;" onclick="dismissPopup()">X</button>';
    document.body.appendChild(popup);
    setTimeout(function() {
      if(document.body.contains(popup)) {
        document.body.removeChild(popup);
      }
    }, 5000);
  }

  function dismissPopup() {
    const popup = document.getElementById('emailSentPopup');
    if(popup) {
      document.body.removeChild(popup);
    }
  }

  // --- Initial Setup ---
  switchRole('AUDITOR');

  function openEvaluation(cnpj, name, role, communicationIdToOpen) {
    if (!communicationIdToOpen) return;
    
    // Get the communication details
    const comm = getCommunicationById(communicationIdToOpen);
    if (!comm) {
      alert("Erro: Comunicação não encontrada.");
      return;
    }
    
    // Set current state
    currentCompany = { cnpj, name, role };
    currentCommunicationId = communicationIdToOpen;
    
    // Hide company list and show chat box
    document.getElementById("consultaEmpresasContainer").style.display = "none";
    document.getElementById("communicationsPanel").style.display = "none";
    document.getElementById("chatBox").style.display = "block";
    
    // Update chat header
    document.getElementById("companyName").textContent = name;
    document.getElementById("companyCNPJ").textContent = cnpj;
    document.getElementById("chatCommId").textContent = comm.id;
    document.getElementById("subject").value = comm.subject;
    
    // Disable messaging since communication is closed
    document.getElementById("messageInput").disabled = true;
    document.getElementById("sendMessageBtn").disabled = true;
    document.getElementById("closeChatBtn").style.display = "none";
    
    // Show evaluation form
    document.getElementById("surveyCompany").style.display = "block";
    document.getElementsByName('companyRating').forEach(radio => radio.checked = false);
    document.getElementById('companyFeedbackText').value = '';
    
    // Update messages
    updateChatMessages(comm.messages);
  }