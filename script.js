document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const notebooksContainer = document.getElementById('notebooks-container');
  const profileFilter = document.getElementById('profile-filter');
  const compareBtn = document.getElementById('compare-btn');
  const comparisonModal = document.getElementById('comparison-modal');
  const closeModal = document.querySelector('.close');
  const comparisonResults = document.getElementById('comparison-results');
  
  // State
  let notebooksData = [];
  let selectedNotebooks = [];
  const maxCompareItems = 3;

  // Initialize the application
  init();

  function init() {
    loadNotebooksData();
    setupEventListeners();
  }

  function loadNotebooksData() {
    fetch('./data/notebooks.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        notebooksData = data;
        displayNotebooks(data);
        updateCompareButton();
      })
      .catch(error => {
        console.error('Error loading notebooks data:', error);
        notebooksContainer.innerHTML = '<p class="error">Erro ao carregar os dados dos notebooks. Por favor, tente novamente mais tarde.</p>';
      });
  }

  function setupEventListeners() {
    // Profile filter change
    profileFilter.addEventListener('change', () => {
      const selectedProfile = profileFilter.value;
      filterNotebooksByProfile(selectedProfile);
    });

    // Compare button click
    compareBtn.addEventListener('click', showComparison);

    // Modal close
    closeModal.addEventListener('click', () => {
      comparisonModal.style.display = 'none';
    });

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
      if (event.target === comparisonModal) {
        comparisonModal.style.display = 'none';
      }
    });
  }

  function displayNotebooks(notebooks) {
    notebooksContainer.innerHTML = '';
    
    // Add results count
    const resultsCount = document.createElement('div');
    resultsCount.className = 'results-count';
    resultsCount.textContent = `${notebooks.length} notebooks encontrados`;
    notebooksContainer.appendChild(resultsCount);
    
    notebooks.forEach(notebook => {
      const card = createNotebookCard(notebook);
      notebooksContainer.appendChild(card);
    });
  }

  function createNotebookCard(notebook) {
    const card = document.createElement('div');
    card.className = 'card';
    
    // Create checkbox for comparison selection
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'compare-checkbox';
    checkbox.dataset.id = notebook.id;
    
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        if (selectedNotebooks.length >= maxCompareItems) {
          e.target.checked = false;
          alert(`Você pode comparar no máximo ${maxCompareItems} notebooks.`);
          return;
        }
        selectedNotebooks.push(notebook);
      } else {
        selectedNotebooks = selectedNotebooks.filter(nb => nb.id !== notebook.id);
      }
      
      updateCardSelection(card, e.target.checked);
      updateCompareButton();
    });

    // Create card content
    card.innerHTML = `
      <img src="${notebook.imagem}" alt="${notebook.nome}">
      <div class="card-content">
        <h2>${notebook.nome}</h2>
        <div class="specs">
          <div><span>Processador:</span> <span>${notebook.cpu}</span></div>
          <div><span>Memória RAM:</span> <span>${notebook.ram}</span></div>
          <div><span>Armazenamento:</span> <span>${notebook.ssd}</span></div>
          <div><span>Tela:</span> <span>${notebook.tela}</span></div>
          <div><span>GPU:</span> <span>${notebook.gpu}</span></div>
          <div><span>Sistema Operacional:</span> <span>${notebook.so || 'Windows 11'}</span></div>
        </div>
        <div class="profiles">
          <p><strong>Perfis recomendados:</strong></p>
          ${notebook.uso_indicado.map(profile => `<span class="profile-tag">${profile}</span>`).join('')}
        </div>
      </div>
    `;

    card.prepend(checkbox);
    return card;
  }

  function updateCardSelection(card, isSelected) {
    if (isSelected) {
      card.classList.add('selected');
    } else {
      card.classList.remove('selected');
    }
  }

  function updateCompareButton() {
    const count = selectedNotebooks.length;
    compareBtn.textContent = `Comparar Selecionados (${count})`;
    compareBtn.disabled = count < 2;
  }

  function filterNotebooksByProfile(profile) {
    if (profile === 'all') {
      displayNotebooks(notebooksData);
      return;
    }

    // Reset selection when filtering
    selectedNotebooks = [];
    updateCompareButton();

    const filtered = notebooksData.filter(notebook => {
      return notebook.uso_indicado.some(perfil => 
        perfil.toLowerCase().includes(profile.toLowerCase())
      );
    });
    
    displayNotebooks(filtered);
  }

  function showComparison() {
    if (selectedNotebooks.length < 2) return;
    
    comparisonResults.innerHTML = generateComparisonHTML();
    comparisonModal.style.display = 'block';
  }

  function generateComparisonHTML() {
    // Get all unique specification keys
    const allSpecs = new Set();
    selectedNotebooks.forEach(notebook => {
      Object.keys(notebook).forEach(key => {
        if (key !== 'imagem' && key !== 'id' && key !== 'uso_indicado') {
          allSpecs.add(key);
        }
      });
    });

    // Create table headers
    let html = `
      <table class="comparison-table">
        <thead>
          <tr>
            <th>Especificação</th>
            ${selectedNotebooks.map(nb => `<th>${nb.nome}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
    `;

    // Add rows for each specification
    Array.from(allSpecs).forEach(spec => {
      if (spec === 'nome') return;
      
      html += `
        <tr>
          <td>${formatSpecName(spec)}</td>
          ${selectedNotebooks.map(nb => `<td>${nb[spec] || '-'}</td>`).join('')}
        </tr>
      `;
    });

    // Add profiles row
    html += `
      <tr>
        <td>Perfis Recomendados</td>
        ${selectedNotebooks.map(nb => `
          <td>${nb.uso_indicado.map(profile => `<span class="profile-tag">${profile}</span>`).join(' ')}</td>
        `).join('')}
      </tr>
    `;

    html += `
        </tbody>
      </table>
    `;

    return html;
  }

  function formatSpecName(spec) {
    const names = {
      'cpu': 'Processador',
      'ram': 'Memória RAM',
      'ssd': 'Armazenamento',
      'tela': 'Tela',
      'gpu': 'Placa de Vídeo',
      'so': 'Sistema Operacional',
      'positivos': 'Pontos Positivos',
      'negativos': 'Pontos Negativos',
      'descricao': 'Descrição'
    };
    
    return names[spec] || spec;
  }

});


