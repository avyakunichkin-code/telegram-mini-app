// Сообщения
async function loadMessages() {
    const messagesDiv = document.getElementById('messagesList');
    showLoading(messagesDiv);
    
    const messages = await API.getMessages();
    
    if (messages && Array.isArray(messages)) {
        if (messages.length === 0) {
            messagesDiv.innerHTML = '📭 Нет сообщений';
        } else {
            messagesDiv.innerHTML = '';
            messages.forEach(msg => {
                const msgElement = document.createElement('div');
                msgElement.className = 'message-item';
                msgElement.innerHTML = `
                    <div class="message-text">${escapeHtml(msg.text)}</div>
                    <div class="message-time">📅 ${formatDate(msg.timestamp)}</div>
                `;
                messagesDiv.appendChild(msgElement);
            });
        }
        messagesDiv.classList.add('status-success');
    } else {
        messagesDiv.innerHTML = '❌ Не удалось загрузить сообщения';
        messagesDiv.classList.add('status-error');
    }
}

async function sendMessage() {
    const text = document.getElementById('messageInput').value.trim();
    if (!text) {
        showNotification('Введите сообщение', 'info');
        return;
    }
    
    const result = await API.sendMessage(text);
    
    if (result) {
        document.getElementById('messageInput').value = '';
        showNotification('Сообщение отправлено!', 'success');
        loadMessages();
    } else {
        showNotification('Ошибка отправки', 'error');
    }
}

function setupMessagesHandlers() {
    document.getElementById('sendMessageBtn').onclick = sendMessage;
    document.getElementById('loadMessagesBtn').onclick = loadMessages;
}

// Экспортируем для использования в других модулях
window.loadMessages = loadMessages;