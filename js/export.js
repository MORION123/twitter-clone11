// Экспорт данных пользователя

async function exportUserData() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const posts = getPosts().filter(p => p.userId === currentUser.id);
    const savedPosts = getSavedPosts(currentUser.id).map(id => getPosts().find(p => p.id === id));
    const messages = getMessages().filter(m => m.fromUserId === currentUser.id || m.toUserId === currentUser.id);
    
    const exportData = {
        user: {
            id: currentUser.id,
            username: currentUser.username,
            email: currentUser.email,
            bio: currentUser.bio,
            createdAt: currentUser.createdAt || Date.now(),
            followers: currentUser.followers,
            following: currentUser.following
        },
        posts: posts.map(p => ({
            content: p.content,
            image: p.image,
            location: p.location,
            timestamp: p.timestamp,
            likes: p.likes.length,
            comments: p.comments.length
        })),
        savedPosts: savedPosts.map(p => ({
            content: p.content,
            author: findUserById(p.userId)?.username,
            timestamp: p.timestamp
        })),
        messages: messages.map(m => ({
            with: findUserById(m.fromUserId === currentUser.id ? m.toUserId : m.fromUserId)?.username,
            text: m.text,
            timestamp: m.timestamp,
            isSent: m.fromUserId === currentUser.id
        })),
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `instagram_clone_export_${currentUser.username}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Данные успешно экспортированы!');
}

// Функция для кнопки экспорта в профиле
function addExportButton() {
    const profileBio = document.querySelector('.profile-bio');
    if (profileBio && !document.getElementById('export-data-btn')) {
        const exportBtn = document.createElement('button');
        exportBtn.id = 'export-data-btn';
        exportBtn.className = 'edit-profile-btn';
        exportBtn.textContent = '📥 Экспорт данных';
        exportBtn.onclick = exportUserData;
        exportBtn.style.marginTop = '8px';
        profileBio.appendChild(exportBtn);
    }
}
