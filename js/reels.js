// Логика Reels

let currentReelIndex = 0;
let reelsList = [];

function loadReels() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    // Получаем все Reels из localStorage
    const reels = JSON.parse(localStorage.getItem('instagram_reels')) || [];
    reelsList = reels.sort((a, b) => b.timestamp - a.timestamp);
    
    const container = document.getElementById('reels-list');
    if (!container) return;
    
    if (reelsList.length === 0) {
        container.innerHTML = `
            <div class="empty-feed" style="height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <p>🎬</p>
                <p><strong>Нет Reels</strong></p>
                <p style="font-size: 14px;">Нажмите на кнопку + чтобы создать первый Reels</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = reelsList.map((reel, index) => renderReel(reel, index)).join('');
    
    // Автоматическое воспроизведение при скролле
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target.querySelector('video');
            if (entry.isIntersecting) {
                if (video) video.play();
            } else {
                if (video) video.pause();
            }
        });
    }, { threshold: 0.5 });
    
    document.querySelectorAll('.reel-item').forEach(item => observer.observe(item));
}

function renderReel(reel, index) {
    const user = findUserById(reel.userId);
    if (!user) return '';
    const currentUser = getCurrentUser();
    const isLiked = reel.likes?.includes(currentUser?.id);
    
    return `
        <div class="reel-item" data-reel-id="${reel.id}">
            <video src="${reel.video}" class="reel-video" loop muted playsinline></video>
            <div class="reel-overlay">
                <div class="reel-user" onclick="goToProfile('${user.username}')">
                    <strong>${escapeHtml(user.username)}</strong>
                </div>
                <div class="reel-caption">${parseMentions(escapeHtml(reel.caption || ''))}</div>
            </div>
            <div class="reel-actions">
                <button class="reel-action-btn" onclick="toggleReelLike('${reel.id}')">
                    ${isLiked ? '❤️' : '🤍'}<span>${reel.likes?.length || 0}</span>
                </button>
                <button class="reel-action-btn" onclick="openReelComments('${reel.id}')">
                    💬<span>${reel.comments?.length || 0}</span>
                </button>
                <button class="reel-action-btn" onclick="shareReel('${reel.id}')">
                    📤
                </button>
            </div>
            ${reel.music ? `<div class="reel-music">🎵 ${escapeHtml(reel.music)}</div>` : ''}
        </div>
    `;
}

function createReel() {
    const videoInput = document.getElementById('reel-video-input');
    const caption = document.getElementById('reel-caption').value;
    const music = document.getElementById('reel-music').value;
    const currentUser = getCurrentUser();
    
    if (!videoInput.files[0]) {
        alert('Выберите видео');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const reels = JSON.parse(localStorage.getItem('instagram_reels')) || [];
        const newReel = {
            id: Date.now().toString(),
            userId: currentUser.id,
            video: e.target.result,
            caption: caption,
            music: music,
            timestamp: Date.now(),
            likes: [],
            comments: []
        };
        reels.push(newReel);
        localStorage.setItem('instagram_reels', JSON.stringify(reels));
        
        closeCreateReelModal();
        loadReels();
        
        // Уведомление подписчикам
        currentUser.followers.forEach(followerId => {
            addNotification(followerId, {
                type: 'reel',
                fromUser: currentUser.username,
                reelId: newReel.id,
                message: `${currentUser.username} опубликовал новый Reels`
            });
        });
    };
    reader.readAsDataURL(videoInput.files[0]);
}

function toggleReelLike(reelId) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const reels = JSON.parse(localStorage.getItem('instagram_reels')) || [];
    const reel = reels.find(r => r.id === reelId);
    if (!reel) return;
    
    const wasLiked = reel.likes.includes(currentUser.id);
    if (wasLiked) {
        reel.likes = reel.likes.filter(id => id !== currentUser.id);
    } else {
        reel.likes.push(currentUser.id);
        if (reel.userId !== currentUser.id) {
            addNotification(reel.userId, {
                type: 'reel_like',
                fromUser: currentUser.username,
                reelId: reelId,
                message: `${currentUser.username} лайкнул ваш Reels`
            });
        }
    }
    
    localStorage.setItem('instagram_reels', JSON.stringify(reels));
    loadReels();
}

function openReelComments(reelId) {
    const reels = JSON.parse(localStorage.getItem('instagram_reels')) || [];
    const reel = reels.find(r => r.id === reelId);
    if (!reel) return;
    
    const commentText = prompt('Ваш комментарий:');
    if (!commentText) return;
    
    const currentUser = getCurrentUser();
    if (!reel.comments) reel.comments = [];
    reel.comments.push({
        userId: currentUser.id,
        text: commentText,
        timestamp: Date.now()
    });
    
    localStorage.setItem('instagram_reels', JSON.stringify(reels));
    loadReels();
    
    if (reel.userId !== currentUser.id) {
        addNotification(reel.userId, {
            type: 'reel_comment',
            fromUser: currentUser.username,
            reelId: reelId,
            message: `${currentUser.username} оставил комментарий к вашему Reels`
        });
    }
}

function shareReel(reelId) {
    navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?reel=${reelId}`);
    alert('Ссылка на Reels скопирована!');
}

function openCreateReelModal() {
    document.getElementById('create-reel-modal').style.display = 'flex';
}

function closeCreateReelModal() {
    document.getElementById('create-reel-modal').style.display = 'none';
    document.getElementById('reel-caption').value = '';
    document.getElementById('reel-music').value = '';
    document.getElementById('reel-preview').innerHTML = '';
    document.getElementById('reel-video-input').value = '';
}

document.addEventListener('DOMContentLoaded', () => {
    const user = getCurrentUser();
    if (user && window.location.pathname.includes('reels.html')) {
        loadReels();
        
        const videoInput = document.getElementById('reel-video-input');
        if (videoInput) {
            videoInput.addEventListener('change', function() {
                const preview = document.getElementById('reel-preview');
                if (this.files && this.files[0]) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        preview.innerHTML = `<video src="${e.target.result}" style="max-width: 100%; border-radius: 8px; margin-top: 12px;" controls></video>`;
                    };
                    reader.readAsDataURL(this.files[0]);
                }
            });
        }
    }
});
