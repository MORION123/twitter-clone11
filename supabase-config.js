// Конфигурация Supabase
const SUPABASE_URL = "https://omfamjekjfaogfxrxcyt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ZPhEktOIHCUo01K68o2cDA_pbzEBsj4";

// Инициализация
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============ АВТОРИЗАЦИЯ ============

async function registerWithSupabase(email, password, username) {
    try {
        // Регистрация в Auth
        const { data: authData, error: authError } = await supabaseClient.auth.signUp({
            email: email,
            password: password
        });
        
        if (authError) return { success: false, error: authError.message };
        if (!authData.user) return { success: false, error: "Ошибка регистрации" };
        
        // Создаем запись в таблице users
        const { error: userError } = await supabaseClient
            .from('users')
            .insert({
                id: authData.user.id,
                username: username,
                email: email,
                bio: ''
            });
        
        if (userError) return { success: false, error: userError.message };
        
        return { success: true, user: authData.user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function loginWithSupabase(email, password) {
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) return { success: false, error: error.message };
        
        // Сохраняем в localStorage
        localStorage.setItem('supabase_user_id', data.user.id);
        localStorage.setItem('supabase_user_email', data.user.email);
        localStorage.setItem('instagram_current_user', data.user.id);
        
        return { success: true, user: data.user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function logoutFromSupabase() {
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) return { success: false, error: error.message };
        
        localStorage.removeItem('supabase_user_id');
        localStorage.removeItem('supabase_user_email');
        localStorage.removeItem('instagram_current_user');
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function getCurrentSupabaseUser() {
    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        if (error || !user) return null;
        
        // Получаем профиль из таблицы users
        const { data: userData } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
        
        return { ...user, profile: userData };
    } catch (error) {
        return null;
    }
}

function getCurrentUser() {
    const userId = localStorage.getItem('supabase_user_id');
    if (!userId) return null;
    return { id: userId };
}

// ============ ПОСТЫ ============

async function getFeed() {
    try {
        const { data, error } = await supabaseClient
            .from('posts')
            .select(`
                *,
                user:users(id, username, avatar)
            `)
            .order('created_at', { ascending: false })
            .limit(20);
        
        if (error) return { success: false, error: error.message };
        
        const posts = data.map(post => ({
            id: post.id,
            userId: post.user_id,
            content: post.content,
            image: post.image,
            video: post.video,
            location: post.location,
            timestamp: new Date(post.created_at).getTime(),
            user: post.user,
            likes: 0,
            comments: 0
        }));
        
        return { success: true, posts: posts };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function createPost(content, imageUrl, videoUrl, location) {
    try {
        const user = getCurrentUser();
        if (!user) return { success: false, error: "Не авторизован" };
        
        const { data, error } = await supabaseClient
            .from('posts')
            .insert({
                user_id: user.id,
                content: content,
                image: imageUrl || null,
                video: videoUrl || null,
                location: location || null
            })
            .select();
        
        if (error) return { success: false, error: error.message };
        return { success: true, post: data[0] };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function toggleLike(postId) {
    try {
        const user = getCurrentUser();
        if (!user) return { success: false, liked: false };
        
        // Проверяем, есть ли лайк
        const { data: existingLike } = await supabaseClient
            .from('likes')
            .select()
            .eq('user_id', user.id)
            .eq('post_id', postId)
            .maybeSingle();
        
        if (existingLike) {
            // Удаляем лайк
            const { error } = await supabaseClient
                .from('likes')
                .delete()
                .eq('user_id', user.id)
                .eq('post_id', postId);
            
            if (error) return { success: false, liked: false };
            return { success: true, liked: false };
        } else {
            // Добавляем лайк
            const { error } = await supabaseClient
                .from('likes')
                .insert({ user_id: user.id, post_id: postId });
            
            if (error) return { success: false, liked: false };
            return { success: true, liked: true };
        }
    } catch (error) {
        return { success: false, liked: false };
    }
}

async function addComment(postId, content) {
    try {
        const user = getCurrentUser();
        if (!user) return { success: false, error: "Не авторизован" };
        
        const { data, error } = await supabaseClient
            .from('comments')
            .insert({
                user_id: user.id,
                post_id: postId,
                content: content
            })
            .select();
        
        if (error) return { success: false, error: error.message };
        return { success: true, comment: data[0] };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function getComments(postId) {
    try {
        const { data, error } = await supabaseClient
            .from('comments')
            .select(`
                *,
                user:users(id, username, avatar)
            `)
            .eq('post_id', postId)
            .order('created_at', { ascending: true });
        
        if (error) return { success: false, error: error.message };
        return { success: true, comments: data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============ ПОДПИСКИ ============

async function followUser(userId) {
    try {
        const user = getCurrentUser();
        if (!user) return { success: false };
        
        const { error } = await supabaseClient
            .from('follows')
            .insert({ follower_id: user.id, following_id: userId });
        
        if (error) return { success: false };
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

async function unfollowUser(userId) {
    try {
        const user = getCurrentUser();
        if (!user) return { success: false };
        
        const { error } = await supabaseClient
            .from('follows')
            .delete()
            .eq('follower_id', user.id)
            .eq('following_id', userId);
        
        if (error) return { success: false };
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

// ============ ХРАНЕНИЕ ФАЙЛОВ ============

async function uploadFile(file, folder, userId) {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${folder}/${userId}/${fileName}`;
        
        const { data, error } = await supabaseClient.storage
            .from('media')
            .upload(filePath, file);
        
        if (error) return { success: false, error: error.message };
        
        const { data: urlData } = supabaseClient.storage
            .from('media')
            .getPublicUrl(filePath);
        
        return { success: true, url: urlData.publicUrl };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function uploadPostImage(file, userId) {
    return uploadFile(file, 'posts', userId);
}

async function uploadAvatar(file, userId) {
    return uploadFile(file, 'avatars', userId);
}

// ============ ПОЛЬЗОВАТЕЛИ ============

async function searchUsers(query) {
    try {
        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .ilike('username', `%${query}%`)
            .limit(20);
        
        if (error) return { success: false, error: error.message };
        return { success: true, users: data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function getUserProfile(username) {
    try {
        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('username', username)
            .single();
        
        if (error) return { success: false, error: error.message };
        return { success: true, user: data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function updateUserProfile(userId, updates) {
    try {
        const { error } = await supabaseClient
            .from('users')
            .update(updates)
            .eq('id', userId);
        
        if (error) return { success: false, error: error.message };
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============ СООБЩЕНИЯ ============

async function sendMessage(toUserId, text) {
    try {
        const user = getCurrentUser();
        if (!user) return { success: false, error: "Не авторизован" };
        
        const { data, error } = await supabaseClient
            .from('messages')
            .insert({
                from_user_id: user.id,
                to_user_id: toUserId,
                content: text
            })
            .select();
        
        if (error) return { success: false, error: error.message };
        return { success: true, message: data[0] };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function getMessagesWith(userId) {
    try {
        const user = getCurrentUser();
        if (!user) return { success: false, error: "Не авторизован" };
        
        const { data, error } = await supabaseClient
            .from('messages')
            .select('*')
            .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
            .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
            .order('created_at', { ascending: true });
        
        if (error) return { success: false, error: error.message };
        return { success: true, messages: data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============ УВЕДОМЛЕНИЯ ============

async function addNotification(userId, fromUserId, type, postId, message) {
    try {
        const { error } = await supabaseClient
            .from('notifications')
            .insert({
                user_id: userId,
                from_user_id: fromUserId,
                type: type,
                post_id: postId,
                message: message
            });
        
        return { success: !error };
    } catch (error) {
        return { success: false };
    }
}

async function getNotifications() {
    try {
        const user = getCurrentUser();
        if (!user) return { success: false, error: "Не авторизован" };
        
        const { data, error } = await supabaseClient
            .from('notifications')
            .select(`
                *,
                from_user:users!notifications_from_user_id_fkey(id, username, avatar)
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (error) return { success: false, error: error.message };
        return { success: true, notifications: data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============ REELS ============

async function getReels() {
    try {
        const { data, error } = await supabaseClient
            .from('reels')
            .select(`
                *,
                user:users(id, username, avatar)
            `)
            .order('created_at', { ascending: false })
            .limit(20);
        
        if (error) return { success: false, error: error.message };
        return { success: true, reels: data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function createReel(videoUrl, caption, music) {
    try {
        const user = getCurrentUser();
        if (!user) return { success: false, error: "Не авторизован" };
        
        const { data, error } = await supabaseClient
            .from('reels')
            .insert({
                user_id: user.id,
                video: videoUrl,
                caption: caption,
                music: music || null
            })
            .select();
        
        if (error) return { success: false, error: error.message };
        return { success: true, reel: data[0] };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============ СОХРАНЕННЫЕ ПОСТЫ ============

async function savePost(postId) {
    try {
        const user = getCurrentUser();
        if (!user) return { success: false };
        
        const { error } = await supabaseClient
            .from('saved_posts')
            .insert({ user_id: user.id, post_id: postId });
        
        if (error) return { success: false };
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

async function unsavePost(postId) {
    try {
        const user = getCurrentUser();
        if (!user) return { success: false };
        
        const { error } = await supabaseClient
            .from('saved_posts')
            .delete()
            .eq('user_id', user.id)
            .eq('post_id', postId);
        
        if (error) return { success: false };
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

// ============ ЭКСПОРТ ДАННЫХ ============

async function exportUserData() {
    try {
        const user = getCurrentUser();
        if (!user) return { success: false, error: "Не авторизован" };
        
        // Получаем все данные пользователя
        const [profile, posts, followers, following, messages, saved] = await Promise.all([
            supabaseClient.from('users').select('*').eq('id', user.id).single(),
            supabaseClient.from('posts').select('*').eq('user_id', user.id),
            supabaseClient.from('follows').select('following_id').eq('follower_id', user.id),
            supabaseClient.from('follows').select('follower_id').eq('following_id', user.id),
            supabaseClient.from('messages').select('*').or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`),
            supabaseClient.from('saved_posts').select('post_id').eq('user_id', user.id)
        ]);
        
        const exportData = {
            user: profile.data,
            posts: posts.data,
            following: following.data,
            followers: followers.data,
            messages: messages.data,
            savedPosts: saved.data,
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `instagram_export_${user.id}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============ СЛЕЖЕНИЕ ЗА СОСТОЯНИЕМ ============

// Следим за изменениями авторизации
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
        console.log('✅ Вошел:', session.user.email);
        localStorage.setItem('supabase_user_id', session.user.id);
        localStorage.setItem('supabase_user_email', session.user.email);
        localStorage.setItem('instagram_current_user', session.user.id);
    } else if (event === 'SIGNED_OUT') {
        console.log('👋 Вышел');
        localStorage.removeItem('supabase_user_id');
        localStorage.removeItem('supabase_user_email');
        localStorage.removeItem('instagram_current_user');
    }
});

// Экспортируем для глобального использования
window.supabase = {
    registerWithSupabase,
    loginWithSupabase,
    logoutFromSupabase,
    getCurrentSupabaseUser,
    getCurrentUser,
    getFeed,
    createPost,
    toggleLike,
    addComment,
    getComments,
    followUser,
    unfollowUser,
    uploadFile,
    uploadPostImage,
    uploadAvatar,
    searchUsers,
    getUserProfile,
    updateUserProfile,
    sendMessage,
    getMessagesWith,
    addNotification,
    getNotifications,
    getReels,
    createReel,
    savePost,
    unsavePost,
    exportUserData
};

console.log('✅ Supabase подключен!');
