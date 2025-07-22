// app.js
document.addEventListener('DOMContentLoaded', () => {
  // Navegación
  const sections = document.querySelectorAll('.section');
  const navLinks = document.querySelectorAll('.sidebar a');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');
  function showSection(id) {
    sections.forEach(sec => sec.id === id
      ? sec.classList.remove('hidden')
      : sec.classList.add('hidden')
    );
  }
  navLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      showSection(link.dataset.section);
    });
  });
  sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('active'));

  // Configuración
  const thresholdInput = document.getElementById('low-stock-threshold');
  const currencyInput  = document.getElementById('currency-symbol');
  const saveSettingsBtn = document.getElementById('save-settings-btn');
  let settings = {
    lowStockThreshold: parseInt(thresholdInput.value,10) || 0,
    currencySymbol: currencyInput.value || '$'
  };
  const stored = JSON.parse(localStorage.getItem('settings'));
  if (stored) {
    settings = stored;
    thresholdInput.value = settings.lowStockThreshold;
    currencyInput.value = settings.currencySymbol;
  }
  saveSettingsBtn.addEventListener('click', () => {
    settings.lowStockThreshold = parseInt(thresholdInput.value,10) || 0;
    settings.currencySymbol = currencyInput.value || '$';
    localStorage.setItem('settings', JSON.stringify(settings));
    alert('Configuración guardada');
    renderInventory(document.getElementById('inventory-search').value);
  });

  // Datos
  let inventory = [], entries = [], exits = [], suppliers = [], clients = [];

  /*** INVENTARIO ***/
  const invModal       = document.getElementById('modal-inventory');
  const invNewBtn      = document.getElementById('new-inventory-btn');
  const invCloseBtn    = document.getElementById('close-inventory-modal');
  const invSaveBtn     = document.getElementById('save-inventory-btn');
  const invFields      = {
    sku: document.getElementById('inv-sku'),
    desc:document.getElementById('inv-desc'),
    cat: document.getElementById('inv-cat'),
    ubic:document.getElementById('inv-ubic'),
    stock:document.getElementById('inv-stock'),
    minStock:document.getElementById('inv-min-stock')
  };
  let invIndex = null;
  function resetInvModal() {
    invIndex = null;
    document.getElementById('inventory-modal-title').textContent = 'Registrar Producto';
    invSaveBtn.textContent = 'Guardar';
    Object.values(invFields).forEach(f => f.value = '');
  }
  invNewBtn.onclick   = () => { resetInvModal(); invModal.classList.add('active'); };
  invCloseBtn.onclick = () => invModal.classList.remove('active');
  invSaveBtn.onclick  = () => {
    const item = {
      sku: invFields.sku.value.trim(),
      desc:invFields.desc.value.trim(),
      cat: invFields.cat.value.trim(),
      ubic:invFields.ubic.value.trim(),
      stock:parseInt(invFields.stock.value,10)||0,
      minStock:parseInt(invFields.minStock.value,10)||0
    };
    invIndex===null ? inventory.push(item) : inventory[invIndex] = item;
    renderInventory(document.getElementById('inventory-search').value);
    invModal.classList.remove('active');
  };
  function renderInventory(filter='') {
    const tbody = document.querySelector('#inventory-table tbody');
    tbody.innerHTML = '';
    inventory
      .filter(i => i.sku.toLowerCase().includes(filter.toLowerCase())
                || i.desc.toLowerCase().includes(filter.toLowerCase()))
      .forEach((i,idx) => {
        const tr = document.createElement('tr');
        if (i.stock <= settings.lowStockThreshold) tr.classList.add('low-stock');
        tr.innerHTML = `
          <td>${i.sku}</td><td>${i.desc}</td><td>${i.cat}</td><td>${i.ubic}</td>
          <td>${i.stock}</td><td>${i.minStock}</td>
          <td>
            <button class="btn btn-secondary edit-inv-btn"   data-index="${idx}">Editar</button>
            <button class="btn btn-secondary delete-inv-btn" data-index="${idx}">Eliminar</button>
          </td>`;
        tbody.appendChild(tr);
      });
    attachInvListeners();
    // KPIs
    document.getElementById('total-sku').textContent         = inventory.length;
    document.getElementById('valor-inventario').textContent  = settings.currencySymbol +
      inventory.reduce((sum,i) => sum + i.stock*10, 0);
    document.getElementById('pedidos-pendientes').textContent = 0;
    document.getElementById('entradas-dia').textContent       = inventory.length;
  }
  function attachInvListeners() {
    document.querySelectorAll('.edit-inv-btn').forEach(btn => {
      btn.onclick = e => {
        invIndex = +e.target.dataset.index;
        const i = inventory[invIndex];
        invFields.sku.value = i.sku;
        invFields.desc.value = i.desc;
        invFields.cat.value = i.cat;
        invFields.ubic.value= i.ubic;
        invFields.stock.value   = i.stock;
        invFields.minStock.value= i.minStock;
        document.getElementById('inventory-modal-title').textContent = 'Editar Producto';
        invSaveBtn.textContent = 'Actualizar';
        invModal.classList.add('active');
      };
    });
    document.querySelectorAll('.delete-inv-btn').forEach(btn => {
      btn.onclick = e => {
        inventory.splice(+e.target.dataset.index,1);
        renderInventory(document.getElementById('inventory-search').value);
      };
    });
  }
  document.getElementById('inventory-search').oninput = e => renderInventory(e.target.value);
  renderInventory();

  /*** ÓRDENES DE ENTRADA ***/
  const entryModal    = document.getElementById('modal-entry');
  const entryNewBtn   = document.getElementById('new-entry-btn');
  const entryCloseBtn = document.getElementById('close-entry-modal');
  const entrySaveBtn  = document.getElementById('save-entry-btn');
  const entryFields   = {
    id: document.getElementById('entry-id'),
    date: document.getElementById('entry-date'),
    supplier: document.getElementById('entry-supplier')
  };
  let entryIndex = null;
  function resetEntryModal() {
    entryIndex = null;
    document.getElementById('entry-modal-title').textContent = 'Nueva Orden de Entrada';
    entrySaveBtn.textContent = 'Guardar';
    Object.values(entryFields).forEach(f => f.value = '');
  }
  entryNewBtn.onclick   = () => { resetEntryModal(); entryModal.classList.add('active'); };
  entryCloseBtn.onclick = () => entryModal.classList.remove('active');
  entrySaveBtn.onclick  = () => {
    const o = {
      id: entryFields.id.value.trim(),
      date: entryFields.date.value,
      supplier: entryFields.supplier.value.trim()
    };
    entryIndex===null ? entries.push(o) : entries[entryIndex] = o;
    renderEntries(document.getElementById('entries-search').value);
    entryModal.classList.remove('active');
  };
  function renderEntries(filter='') {
    const tbody = document.querySelector('#entries-table tbody');
    tbody.innerHTML = '';
    entries
      .filter(o => o.id.toLowerCase().includes(filter.toLowerCase())
                || o.supplier.toLowerCase().includes(filter.toLowerCase()))
      .forEach((o,idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${o.id}</td><td>${o.date}</td><td>${o.supplier}</td>
          <td>
            <button class="btn btn-secondary edit-entry-btn"   data-index="${idx}">Editar</button>
            <button class="btn btn-secondary delete-entry-btn" data-index="${idx}">Eliminar</button>
          </td>`;
        tbody.appendChild(tr);
      });
    attachEntryListeners();
  }
  function attachEntryListeners() {
    document.querySelectorAll('.edit-entry-btn').forEach(btn => {
      btn.onclick = e => {
        entryIndex = +e.target.dataset.index;
        const o = entries[entryIndex];
        entryFields.id.value = o.id;
        entryFields.date.value = o.date;
        entryFields.supplier.value = o.supplier;
        document.getElementById('entry-modal-title').textContent = 'Editar Orden de Entrada';
        entrySaveBtn.textContent = 'Actualizar';
        entryModal.classList.add('active');
      };
    });
    document.querySelectorAll('.delete-entry-btn').forEach(btn => {
      btn.onclick = e => {
        entries.splice(+e.target.dataset.index,1);
        renderEntries(document.getElementById('entries-search').value);
      };
    });
  }
  document.getElementById('entries-search').oninput = e => renderEntries(e.target.value);
  renderEntries();

  /*** ÓRDENES DE SALIDA ***/
  const exitModal    = document.getElementById('modal-exit');
  const exitNewBtn   = document.getElementById('new-exit-btn');
  const exitCloseBtn = document.getElementById('close-exit-modal');
  const exitSaveBtn  = document.getElementById('save-exit-btn');
  const exitFields   = {
    id: document.getElementById('exit-id'),
    date: document.getElementById('exit-date'),
    client: document.getElementById('exit-client')
  };
  let exitIndex = null;
  function resetExitModal() {
    exitIndex = null;
    document.getElementById('exit-modal-title').textContent = 'Nueva Orden de Salida';
    exitSaveBtn.textContent = 'Guardar';
    Object.values(exitFields).forEach(f => f.value = '');
  }
  exitNewBtn.onclick   = () => { resetExitModal(); exitModal.classList.add('active'); };
  exitCloseBtn.onclick = () => exitModal.classList.remove('active');
  exitSaveBtn.onclick  = () => {
    const o = {
      id: exitFields.id.value.trim(),
      date: exitFields.date.value,
      client: exitFields.client.value.trim()
    };
    exitIndex===null ? exits.push(o) : exits[exitIndex] = o;
    renderExits(document.getElementById('exits-search').value);
    exitModal.classList.remove('active');
  };
  function renderExits(filter='') {
    const tbody = document.querySelector('#exits-table tbody');
    tbody.innerHTML = '';
    exits
      .filter(o => o.id.toLowerCase().includes(filter.toLowerCase())
                || o.client.toLowerCase().includes(filter.toLowerCase()))
      .forEach((o,idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${o.id}</td><td>${o.date}</td><td>${o.client}</td>
          <td>
            <button class="btn btn-secondary edit-exit-btn"   data-index="${idx}">Editar</button>
            <button class="btn btn-secondary delete-exit-btn" data-index="${idx}">Eliminar</button>
          </td>`;
        tbody.appendChild(tr);
      });
    attachExitListeners();
  }
  function attachExitListeners() {
    document.querySelectorAll('.edit-exit-btn').forEach(btn => {
      btn.onclick = e => {
        exitIndex = +e.target.dataset.index;
        const o = exits[exitIndex];
        exitFields.id.value = o.id;
        exitFields.date.value = o.date;
        exitFields.client.value = o.client;
        document.getElementById('exit-modal-title').textContent = 'Editar Orden de Salida';
        exitSaveBtn.textContent = 'Actualizar';
        exitModal.classList.add('active');
      };
    });
    document.querySelectorAll('.delete-exit-btn').forEach(btn => {
      btn.onclick = e => {
        exits.splice(+e.target.dataset.index,1);
        renderExits(document.getElementById('exits-search').value);
      };
    });
  }
  document.getElementById('exits-search').oninput = e => renderExits(e.target.value);
  renderExits();

  /*** PROVEEDORES ***/
  const supplierModal    = document.getElementById('modal-supplier');
  const supplierNewBtn   = document.getElementById('new-supplier-btn');
  const supplierCloseBtn = document.getElementById('close-supplier-modal');
  const supplierSaveBtn  = document.getElementById('save-supplier-btn');
  const supplierFields   = {
    name:    document.getElementById('supplier-name'),
    contact: document.getElementById('supplier-contact')
  };
  let supplierIndex = null;
  function resetSupplierModal() {
    supplierIndex = null;
    document.getElementById('supplier-modal-title').textContent = 'Nuevo Proveedor';
    supplierSaveBtn.textContent = 'Guardar';
    Object.values(supplierFields).forEach(f => f.value = '');
  }
  supplierNewBtn.onclick   = () => { resetSupplierModal(); supplierModal.classList.add('active'); };
  supplierCloseBtn.onclick = () => supplierModal.classList.remove('active');
  supplierSaveBtn.onclick  = () => {
    const o = {
      name:    supplierFields.name.value.trim(),
      contact: supplierFields.contact.value.trim()
    };
    supplierIndex===null ? suppliers.push(o) : suppliers[supplierIndex] = o;
    renderSuppliers(document.getElementById('suppliers-search').value);
    supplierModal.classList.remove('active');
  };
  function renderSuppliers(filter='') {
    const tbody = document.querySelector('#suppliers-table tbody');
    tbody.innerHTML = '';
    suppliers
      .filter(o => o.name.toLowerCase().includes(filter.toLowerCase())
                || o.contact.toLowerCase().includes(filter.toLowerCase()))
      .forEach((o,idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${idx+1}</td><td>${o.name}</td><td>${o.contact}</td>
          <td>
            <button class="btn btn-secondary edit-supplier-btn"   data-index="${idx}">Editar</button>
            <button class="btn btn-secondary delete-supplier-btn" data-index="${idx}">Eliminar</button>
          </td>`;
        tbody.appendChild(tr);
      });
    attachSupplierListeners();
  }
  function attachSupplierListeners() {
    document.querySelectorAll('.edit-supplier-btn').forEach(btn => {
      btn.onclick = e => {
        supplierIndex = +e.target.dataset.index;
        const o = suppliers[supplierIndex];
        supplierFields.name.value    = o.name;
        supplierFields.contact.value = o.contact;
        document.getElementById('supplier-modal-title').textContent = 'Editar Proveedor';
        supplierSaveBtn.textContent = 'Actualizar';
        supplierModal.classList.add('active');
      };
    });
    document.querySelectorAll('.delete-supplier-btn').forEach(btn => {
      btn.onclick = e => {
        suppliers.splice(+e.target.dataset.index,1);
        renderSuppliers(document.getElementById('suppliers-search').value);
      };
    });
  }
  document.getElementById('suppliers-search').oninput = e => renderSuppliers(e.target.value);
  renderSuppliers();

  /*** CLIENTES ***/
  const clientModal    = document.getElementById('modal-client');
  const clientNewBtn   = document.getElementById('new-client-btn');
  const clientCloseBtn = document.getElementById('close-client-modal');
  const clientSaveBtn  = document.getElementById('save-client-btn');
  const clientFields   = {
    name:    document.getElementById('client-name'),
    contact: document.getElementById('client-contact')
  };
  let clientIndex = null;
  function resetClientModal() {
    clientIndex = null;
    document.getElementById('client-modal-title').textContent = 'Nuevo Cliente';
    clientSaveBtn.textContent = 'Guardar';
    Object.values(clientFields).forEach(f => f.value = '');
  }
  clientNewBtn.onclick   = () => { resetClientModal(); clientModal.classList.add('active'); };
  clientCloseBtn.onclick = () => clientModal.classList.remove('active');
  clientSaveBtn.onclick  = () => {
    const o = {
      name:    clientFields.name.value.trim(),
      contact: clientFields.contact.value.trim()
    };
    clientIndex===null ? clients.push(o) : clients[clientIndex] = o;
    renderClients(document.getElementById('clients-search').value);
    clientModal.classList.remove('active');
  };
  function renderClients(filter='') {
    const tbody = document.querySelector('#clients-table tbody');
    tbody.innerHTML = '';
    clients
      .filter(o => o.name.toLowerCase().includes(filter.toLowerCase())
                || o.contact.toLowerCase().includes(filter.toLowerCase()))
      .forEach((o,idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${idx+1}</td><td>${o.name}</td><td>${o.contact}</td>
          <td>
            <button class="btn btn-secondary edit-client-btn"   data-index="${idx}">Editar</button>
            <button class="btn btn-secondary delete-client-btn" data-index="${idx}">Eliminar</button>
          </td>`;
        tbody.appendChild(tr);
      });
    attachClientListeners();
  }
  function attachClientListeners() {
    document.querySelectorAll('.edit-client-btn').forEach(btn => {
      btn.onclick = e => {
        clientIndex = +e.target.dataset.index;
        const o = clients[clientIndex];
        clientFields.name.value    = o.name;
        clientFields.contact.value = o.contact;
        document.getElementById('client-modal-title').textContent = 'Editar Cliente';
        clientSaveBtn.textContent = 'Actualizar';
        clientModal.classList.add('active');
      };
    });
    document.querySelectorAll('.delete-client-btn').forEach(btn => {
      btn.onclick = e => {
        clients.splice(+e.target.dataset.index,1);
        renderClients(document.getElementById('clients-search').value);
      };
    });
  }
  document.getElementById('clients-search').oninput = e => renderClients(e.target.value);
  renderClients();

  /*** REPORTES ***/
  function downloadCSV(data, headers, filename) {
    const rows = [headers.join(','), ...data.map(obj => headers.map(h => JSON.stringify(obj[h]||'')).join(','))];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }
  document.getElementById('export-inventory').onclick = () =>
    downloadCSV(inventory, ['sku','desc','cat','ubic','stock','minStock'], 'inventario.csv');
  document.getElementById('export-entries').onclick = () =>
    downloadCSV(entries, ['id','date','supplier'], 'ordenes_entrada.csv');
  document.getElementById('export-exits').onclick = () =>
    downloadCSV(exits, ['id','date','client'], 'ordenes_salida.csv');

  // Mostrar sección inicial
  showSection('dashboard');
});
