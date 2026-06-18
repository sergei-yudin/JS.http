const API_URL = 'http://localhost:7070';

const ticketsContainer = document.querySelector('[data-id="tickets"]');
const addTicketButton = document.querySelector('.add-ticket-btn');

function formatDate(timestamp) {
  const date = new Date(timestamp);

  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function createTicketMarkup(ticket) {
  const statusClass = ticket.status ? 'ticket-status ticket-status_done' : 'ticket-status';
  const statusText = ticket.status ? '✓' : '';

  return `
    <div class="ticket" data-id="${ticket.id}">
      <button class="${statusClass}" type="button" data-action="status">
        ${statusText}
      </button>

      <div class="ticket-content" data-action="details">
        <div class="ticket-main">
          <div class="ticket-title">${ticket.name}</div>
          <div class="ticket-date">${formatDate(ticket.created)}</div>
        </div>
        <div class="ticket-description hidden"></div>
      </div>

      <div class="ticket-actions">
        <button class="edit-btn" type="button" data-action="edit">✎</button>
        <button class="delete-btn" type="button" data-action="delete">×</button>
      </div>
    </div>
  `;
}

function renderTickets(tickets) {
  if (tickets.length === 0) {
    ticketsContainer.innerHTML = '<div class="empty-message">Тикетов пока нет</div>';
    return;
  }

  ticketsContainer.innerHTML = tickets.map((ticket) => createTicketMarkup(ticket)).join('');
}

function request(method, callback, id = null) {
  const xhr = new XMLHttpRequest();
  const url = id ? `${API_URL}/?method=${method}&id=${id}` : `${API_URL}/?method=${method}`;

  xhr.open('GET', url);

  xhr.addEventListener('load', () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const data = JSON.parse(xhr.responseText);
        callback(data);
      } catch (error) {
        console.error(error);
      }
    }
  });

  xhr.send();
}
function postRequest(method, data, callback) {
  const xhr = new XMLHttpRequest();

  xhr.open('POST', `${API_URL}/?method=${method}`);
  xhr.setRequestHeader('Content-Type', 'application/json');

  xhr.addEventListener('load', () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      callback();
    }
  });

  xhr.send(JSON.stringify(data));
}

function loadTickets() {
  request('allTickets', renderTickets);
}

loadTickets();

function showTicketDescription(ticketElement, ticket) {
  const descriptionElement = ticketElement.querySelector('.ticket-description');

  descriptionElement.textContent = ticket.description;
  descriptionElement.classList.remove('hidden');
  ticketElement.classList.add('ticket_opened');
}

function hideTicketDescription(ticketElement) {
  const descriptionElement = ticketElement.querySelector('.ticket-description');

  descriptionElement.textContent = '';
  descriptionElement.classList.add('hidden');
  ticketElement.classList.remove('ticket_opened');
}
function showTicketModal(title, submitText, defaultName = '', defaultDescription = '', onSubmit) {
  const modal = document.createElement('div');

  modal.classList.add('modal');

  modal.innerHTML = `
    <form class="modal-content">
      <h2 class="modal-title">${title}</h2>

      <label class="modal-label">
        Краткое описание
        <input class="modal-input" name="name" value="${defaultName}" required>
      </label>

      <label class="modal-label">
        Подробное описание
        <textarea class="modal-textarea" name="description" required>${defaultDescription}</textarea>
      </label>

      <div class="modal-actions">
        <button class="modal-button" type="submit">${submitText}</button>
        <button class="modal-button" type="button" data-action="cancel">Отмена</button>
      </div>
    </form>
  `;

  document.body.append(modal);

  const form = modal.querySelector('.modal-content');
  const cancelButton = modal.querySelector('[data-action="cancel"]');

  cancelButton.addEventListener('click', () => {
    modal.remove();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const name = form.elements.name.value.trim();
    const description = form.elements.description.value.trim();

    if (!name || !description) {
      return;
    }

    onSubmit(name, description);
    modal.remove();
  });
}

function showConfirmModal(onConfirm) {
  const modal = document.createElement('div');

  modal.classList.add('modal');

  modal.innerHTML = `
    <div class="modal-content">
      <h2 class="modal-title">Удалить тикет</h2>

      <p class="modal-text">
        Вы уверены, что хотите удалить тикет? Это действие необратимо.
      </p>

      <div class="modal-actions">
        <button class="modal-button" type="button" data-action="confirm">ОК</button>
        <button class="modal-button" type="button" data-action="cancel">Отмена</button>
      </div>
    </div>
  `;

  document.body.append(modal);

  const confirmButton = modal.querySelector('[data-action="confirm"]');
  const cancelButton = modal.querySelector('[data-action="cancel"]');

  confirmButton.addEventListener('click', () => {
    onConfirm();
    modal.remove();
  });

  cancelButton.addEventListener('click', () => {
    modal.remove();
  });
}

ticketsContainer.addEventListener('click', (event) => {
  const ticketElement = event.target.closest('.ticket');

  if (!ticketElement) {
    return;
  }

  const detailsElement = event.target.closest('[data-action="details"]');

  if (!detailsElement) {
    return;
  }

  const descriptionElement = ticketElement.querySelector('.ticket-description');

  if (!descriptionElement.classList.contains('hidden')) {
    hideTicketDescription(ticketElement);
    return;
  }

  const ticketId = ticketElement.dataset.id;

  request('ticketById', (ticket) => {
    showTicketDescription(ticketElement, ticket);
  }, ticketId);
});

addTicketButton.addEventListener('click', () => {
  showTicketModal('Добавить тикет', 'ОК', '', '', (name, description) => {
    postRequest('createTicket', {
      name,
      description,
      status: false,
    }, loadTickets);
  });
});

function deleteRequest(id, callback) {
  const xhr = new XMLHttpRequest();

  xhr.open('GET', `${API_URL}/?method=deleteById&id=${id}`);

  xhr.addEventListener('load', () => {
    if (xhr.status === 204) {
      callback();
    }
  });

  xhr.send();
}

function updateRequest(id, data, callback) {
  const xhr = new XMLHttpRequest();

  xhr.open('POST', `${API_URL}/?method=updateById&id=${id}`);
  xhr.setRequestHeader('Content-Type', 'application/json');

  xhr.addEventListener('load', () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      callback();
    }
  });

  xhr.send(JSON.stringify(data));
}

ticketsContainer.addEventListener('click', (event) => {
  const deleteButton = event.target.closest('[data-action="delete"]');

  if (!deleteButton) {
    return;
  }

  const ticketElement = deleteButton.closest('.ticket');
  const ticketId = ticketElement.dataset.id;

  showConfirmModal(() => {
    deleteRequest(ticketId, loadTickets);
  });
});
ticketsContainer.addEventListener('click', (event) => {
  const statusButton = event.target.closest('[data-action="status"]');

  if (!statusButton) {
    return;
  }

  const ticketElement = statusButton.closest('.ticket');
  const ticketId = ticketElement.dataset.id;
  const isDone = statusButton.classList.contains('ticket-status_done');

  updateRequest(ticketId, {
    status: !isDone,
  }, loadTickets);
});

ticketsContainer.addEventListener('click', (event) => {
  const editButton = event.target.closest('[data-action="edit"]');

  if (!editButton) {
    return;
  }

  const ticketElement = editButton.closest('.ticket');
  const ticketId = ticketElement.dataset.id;

  request('ticketById', (ticket) => {
    showTicketModal('Изменить тикет', 'ОК', ticket.name, ticket.description, (name, description) => {
      updateRequest(ticketId, {
        name,
        description,
        status: ticket.status,
      }, loadTickets);
    });
  }, ticketId);
});
