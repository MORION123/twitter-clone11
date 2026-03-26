// Экспорт данных пользователя

function exportUserData() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert('Пользователь не авторизован');
        return;
    }
    
    const posts = getPosts().filter(p => p.userId === currentUser.id);
    const savedPosts = getSavedPosts(currentUser.id).map(id => getPosts().find(p => p.id === id));
    const messages = getMessages().filter(m => m.fromUserId === currentUser.id || m.toUserId === currentUser.id);
    const reels = JSON.parse(localStorage.getItem('instagram_reels')) || [];
    const userReels = reels.filter(r => r.userId === currentUser.id);
    
    const exportData = {
        exportDate: new Date().toISOString(),
        user: {
            id: currentUser.id,
            username: currentUser.username,
            email: currentUser.email,
            bio: currentUser.bio,
            createdAt: currentUser.createdAt || new Date().toISOString(),
            followers: currentUser.followers?.length || 0,
            following: currentUser.following?.length || 0
        },
        posts: posts.map(p => ({
            content: p.content,
            image: p.image ? '[ФОТО]' : null,
            video: p.video ? '[ВИДЕО]' : null,
            location: p.location,
            timestamp: new Date(p.timestamp).toISOString(),
            likes: p.likes?.length || 0,
            comments: p.comments?.length || 0
        })),
        savedPosts: savedPosts.filter(p => p).map(p => ({
            content: p.content,
            author: findUserById(p.userId)?.username,
            timestamp: new Date(p.timestamp).toISOString()
        })),
        reels: userReels.map(r => ({
            caption: r.caption,
            music: r.music,
            timestamp: new Date(r.timestamp).toISOString(),
            likes: r.likes?.length || 0,
            comments: r.comments?.length || 0
        })),
        messages: messages.map(m => ({
            with: findUserById(m.fromUserId === currentUser.id ? m.toUserId : m.fromUserId)?.username,
            text: m.text,
            timestamp: new Date(m.timestamp).toISOString(),
            isSent: m.fromUserId === currentUser.id
        }))
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `instagram_clone_export_${currentUser.username}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('✅ Данные успешно экспортированы! Файл сохранён на ваше устройство.');
}
