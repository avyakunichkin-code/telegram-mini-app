// Вкладки
function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`tab-${tabName}`).classList.add('active');
            
            // Загружаем данные при переключении
            if (tabName === 'messages' && window.loadMessages) {
                window.loadMessages();
            }
            if (tabName === 'profile' && window.loadProfile) {
                window.loadProfile();
            }
        });
    });
}