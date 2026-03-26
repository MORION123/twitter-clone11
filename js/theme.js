// Переключение темы

function initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
    setTheme(savedTheme);
}

function setTheme(theme) {
    const themeLink = document.getElementById('theme-style');
    if (theme === 'light') {
        themeLink.href = 'css/light-theme.css';
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
    } else {
        themeLink.href = 'css/dark-theme.css';
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
    }
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    
    // Обновляем иконку кнопки
    const themeBtns = document.querySelectorAll('.theme-switch, .theme-btn');
    themeBtns.forEach(btn => {
        btn.textContent = theme === 'light' ? '🌙' : '☀️';
    });
}

function toggleTheme() {
    const currentTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
});
