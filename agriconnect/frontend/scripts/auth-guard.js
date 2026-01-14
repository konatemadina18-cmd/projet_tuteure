// FICHIER : scripts/auth-guard.js
// BUT : Protéger les pages qui nécessitent une connexion
// COMME : Un garde de sécurité qui vérifie les badges à l'entrée

/**
 * Vérifie si l'utilisateur est connecté
 * @returns {boolean} true si connecté, false sinon
 */
function isAuthenticated() {
    const userData = localStorage.getItem('agriConnect_user');
    const token = localStorage.getItem('agriConnect_token');
    return !!(userData && token);
}

/**
 * Redirige vers la page de connexion si l'utilisateur n'est pas connecté
 * @param {string} redirectAfter - Page vers laquelle rediriger après connexion (optionnel)
 * @returns {boolean} true si connecté, false sinon
 */
function requireAuth(redirectAfter = null) {
    if (!isAuthenticated()) {
        // Si pas connecté, rediriger vers login
        if (redirectAfter) {
            sessionStorage.setItem('redirectAfterLogin', redirectAfter);
        }
        
        // Déterminer le chemin vers login selon l'emplacement actuel
        const currentPath = window.location.pathname;
        if (currentPath.includes('/pages/')) {
            window.location.href = '../../login.html';
        } else {
            window.location.href = '../login.html';
        }
        return false;
    }
    return true;
}

/**
 * Redirige vers l'accueil si l'utilisateur est déjà connecté (pour pages login/register)
 */
function requireGuest() {
    if (isAuthenticated()) {
        const userData = JSON.parse(localStorage.getItem('agriConnect_user'));
        redirectToDashboard(userData.role);
        return false;
    }
    return true;
}

/**
 * Vérifie le rôle de l'utilisateur et redirige si nécessaire
 * @param {string} requiredRole - Rôle requis (ACHETEUR, PRODUCTEUR, etc.)
 * @returns {boolean} true si le rôle correspond
 */
function requireRole(requiredRole) {
    if (!isAuthenticated()) {
        requireAuth();
        return false;
    }
    
    const userData = JSON.parse(localStorage.getItem('agriConnect_user'));
    if (userData.role !== requiredRole) {
        // Rediriger vers le bon dashboard selon le rôle
        redirectToDashboard(userData.role);
        return false;
    }
    
    return true;
}

/**
 * Redirige vers le dashboard approprié selon le rôle
 * @param {string} role - Rôle de l'utilisateur
 */
function redirectToDashboard(role) {
    // Déterminer le chemin selon l'emplacement actuel
    const currentPath = window.location.pathname;
    let basePath = '';
    
    // Si on est dans login.html ou register.html (dans frontend/)
    if (currentPath.includes('login.html') || currentPath.includes('register.html')) {
        basePath = 'frontend/pages/';
    } 
    // Si on est dans une page dashboard (dans frontend/pages/)
    else if (currentPath.includes('/pages/')) {
        basePath = ''; // On est déjà dans pages/
    }
    // Sinon (depuis index.html ou autre page dans frontend/)
    else {
        basePath = 'frontend/pages/';
    }
    
    let dashboardPage = basePath + 'acheteur.html'; // Par défaut
    
    switch(role) {
        case 'PRODUCTEUR':
            dashboardPage = basePath + 'producteur.html';
            break;
        case 'ACHETEUR':
            dashboardPage = basePath + 'acheteur.html';
            break;
        case 'ADMIN':
            dashboardPage = basePath + 'admin.html';
            break;
        case 'LIVREUR':
            dashboardPage = basePath + 'livreur.html';
            break;
    }
    
    console.log('📍 Redirection vers dashboard:', dashboardPage);
    window.location.href = dashboardPage;
}

/**
 * Initialise la protection des pages au chargement
 * À appeler dans les pages protégées avec document.addEventListener('DOMContentLoaded', initAuthGuard)
 * NOTE : Vérifie l'authentification et redirige si nécessaire
 */
function initAuthGuard() {
    // Récupérer le chemin actuel de la page
    const currentPath = window.location.pathname;
    
    // Pour les pages dashboard (dans /pages/), vérifier l'authentification
    if (currentPath.includes('/pages/')) {
        // Page dashboard - DOIT être connecté
        if (!requireAuth()) {
            return;
        }
        
        // Vérifier le rôle et rediriger si nécessaire
        const userData = JSON.parse(localStorage.getItem('agriConnect_user'));
        
        if (!userData) {
            window.location.href = '../../login.html';
            return;
        }
        
        // Vérifier que l'utilisateur a accès au bon dashboard
        if (currentPath.includes('acheteur.html') && userData.role !== 'ACHETEUR') {
            redirectToDashboard(userData.role);
            return;
        }
        
        if (currentPath.includes('producteur.html') && userData.role !== 'PRODUCTEUR') {
            redirectToDashboard(userData.role);
            return;
        }
    } 
    // Pour les pages login/register, rediriger si déjà connecté
    else if (currentPath.includes('login.html') || currentPath.includes('register.html')) {
        requireGuest();
    } 
    // Pour le panier, nécessite une connexion
    else if (currentPath.includes('panier.html')) {
        if (!requireAuth()) {
            return;
        }
    }
    // Pour le catalogue, accessible sans connexion mais certaines actions nécessitent une connexion
    // (pas de vérification ici, gérée dans catalogue.js)
}

