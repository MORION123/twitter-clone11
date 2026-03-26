let currentStories = [];
let currentStoryIndex = 0;
let storyInterval = null;

function loadStoriesForFeed() {
    const stories = getActiveStories();
    const currentUser = getCurrentUser();
    const users = getUsers();
    const storiesByUser = {};
    stories.forEach(story => { if (!storiesByUser[story.userId]) storiesByUser[story.userId] = []; storiesByUser[story.userId].push(story); });
    const container = document.getElementById('stories-list');
    if (!container) return;
    let html = `<div class="story-circle" onclick="openCreateStoryModal()"><div class="story-ring" style="background: #dbdbdb;"><div class="story-ring-inner" style="background: #262626; display: flex; align-items: center; justify-content: center;"><span style="font-size: 30px;">+</span></div></div><div class="story-username">Ваша история</div></div>`;
    Object.keys(storiesByUser).forEach(userId => { if (userId !== currentUser.id) { const user = findUserById(userId); if (user) html += `<div class="story-circle" onclick="openStoryViewer('${userId}')"><div class="story-ring"><div class="story-ring-inner" style="background-image: url('${user.avatarData || ''}'); background-size: cover; background-position: center;">${!user.avatarData ? (user.avatar || user.username[0].toUpperCase()) : ''}</div></div><div class="story-username">${escapeHtml(user.username)}</div></div>`; } });
    container.innerHTML = html;
}

function openStoryViewer(userId) {
    const stories = getActiveStories();
    currentStories = stories.filter(s => s.userId === userId).sort((a, b) => a.timestamp - b.timestamp);
    currentStoryIndex = 0;
    if (currentStories.length === 0) return;
    window.location.href = `stories.html?userId=${userId}`;
    localStorage.setItem('stories_data', JSON.stringify({ stories: currentStories, userId }));
}

function initStoryViewer() {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    if (!userId) return;
    const stored = localStorage.getItem('stories_data');
    if (stored) { const data = JSON.parse(stored); currentStories = data.stories; const user = findUserById(userId); document.getElementById('story-username').textContent = user?.username || ''; if (user?.avatarData) { document.getElementById('story-avatar').style.backgroundImage = `url('${user.avatarData}')`; document.getElementById('story-avatar').style.backgroundSize = 'cover'; document.getElementById('story-avatar').textContent = ''; } else { document.getElementById('story-avatar').style.backgroundImage = ''; document.getElementById('story-avatar').textContent = user?.username[0] || ''; } showStory(0); startStoryTimer(); }
}

function showStory(index) {
    if (index >= currentStories.length || index < 0) { closeStories(); return; }
    currentStoryIndex = index;
    const story = currentStories[index];
    const contentDiv = document.getElementById('story-content');
    const timeElement = document.getElementById('story-time');
    if (story.imageData) contentDiv.innerHTML = `<img src="${story.imageData}" alt="Story">`;
    else contentDiv.innerHTML = `<div style="text-align: center; padding: 20px;">${escapeHtml(story.text || '')}</div>`;
    timeElement.textContent = formatInstagramTime(story.timestamp);
    updateProgressBars();
}

function updateProgressBars() {
    const progressContainer = document.getElementById('story-progress');
    if (!progressContainer) return;
    progressContainer.innerHTML = '';
    currentStories.forEach((story, idx) => { const bar = document.createElement('div'); bar.className = 'story-progress-bar'; const fill = document.createElement('div'); fill.className = 'story-progress-fill'; if (idx === currentStoryIndex) { fill.style.width = '0%'; setTimeout(() => fill.style.width = '100%', 50); } else if (idx < currentStoryIndex) fill.style.width = '100%'; else fill.style.width = '0%'; bar.appendChild(fill); progressContainer.appendChild(bar); });
    if (storyInterval) clearInterval(storyInterval);
    startStoryTimer();
}

function startStoryTimer() { storyInterval = setInterval(() => nextStory(), 5000); }
function nextStory() { if (storyInterval) clearInterval(storyInterval); if (currentStoryIndex + 1 < currentStories.length) { currentStoryIndex++; showStory(currentStoryIndex); } else closeStories(); }
function prevStory() { if (storyInterval) clearInterval(storyInterval); if (currentStoryIndex > 0) { currentStoryIndex--; showStory(currentStoryIndex); } else closeStories(); }
function closeStories() { if (storyInterval) clearInterval(storyInterval); localStorage.removeItem('stories_data'); window.location.href = 'feed.html'; }

function openCreateStoryModal() {
    const modalHtml = `<div id="story-modal" class="modal" style="display: flex;"><div class="modal-content" style="max-width: 400px;"><h3>Создать историю</h3><div style="margin: 16px 0;"><button class="btn-image" onclick="document.getElementById('story-image-input').click()" style="width: 100%; padding: 12px;">📷 Добавить фото</button><input type="file" id="story-image-input" accept="image/*" style="display: none"><textarea id="story-text" placeholder="Текст истории..." rows="3" style="width: 100%; margin-top: 12px; padding: 8px;"></textarea><div id="story-preview" style="margin-top: 12px;"></div></div><div class="modal-buttons"><button onclick="createStory()" style="background: #0095f6; color: white; border: none; padding: 8px 16px; border-radius: 8px;">Опубликовать</button><button onclick="closeStoryModal()" style="background: none; border: 1px solid; padding: 8px 16px; border-radius: 8px;">Отмена</button></div></div></div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const imageInput = document.getElementById('story-image-input');
    if (imageInput) imageInput.addEventListener('change', function() { const preview = document.getElementById('story-preview'); if (this.files && this.files[0]) { const reader = new FileReader(); reader.onload = function(e) { preview.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; border-radius: 8px;">`; }; reader.readAsDataURL(this.files[0]); } });
}

function createStory() {
    const imageInput = document.getElementById('story-image-input');
    const text = document.getElementById('story-text').value;
    const currentUser = getCurrentUser();
    if (!imageInput.files[0] && !text.trim()) { alert('Добавьте фото или текст'); return; }
    if (imageInput.files[0]) { const reader = new FileReader(); reader.onload = function(e) { addStory(currentUser.id, e.target.result, text); closeStoryModal(); loadStoriesForFeed(); }; reader.readAsDataURL(imageInput.files[0]); }
    else { addStory(currentUser.id, null, text); closeStoryModal(); loadStoriesForFeed(); }
}

function closeStoryModal() { const modal = document.getElementById('story-modal'); if (modal) modal.remove(); }

document.addEventListener('DOMContentLoaded', () => { if (window.location.pathname.includes('feed.html')) { const user = getCurrentUser(); if (user) loadStoriesForFeed(); } if (window.location.pathname.includes('stories.html')) initStoryViewer(); });
