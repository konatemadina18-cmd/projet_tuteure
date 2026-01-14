// FICHIER : scripts/auth.js
// BUT : Gérer la connexion, inscription et déconnexion des utilisateurs
// COMME : Le gardien de sécurité qui vérifie les identités

// État d'authentification global - Comme le registre des personnes autorisées
const AuthState = {
    isLoggedIn: false,
    currentUser: null,
    token: null
};

// Initialisation de l'authentification - Comme allumer le système de sécurité
function initAuth() {
    console.log('🔐 Initialisation du système d\'authentification...');
    
    // Je vérifie si l'utilisateur est déjà connecté - Comme vérifier les badges
    checkExistingAuth();
    
    // Je configure les écouteurs d'événements - Comme brancher les caméras
    setupAuthEventListeners();
}

// Vérifier si l'utilisateur est déjà connecté - Comme vérifier les badges enregistrés
function checkExistingAuth() {
    const savedUser = localStorage.getItem('agriConnect_user');
    const savedToken = localStorage.getItem('agriConnect_token');
    
    if (savedUser && savedToken) {
        try {
            AuthState.currentUser = JSON.parse(savedUser);
            AuthState.token = savedToken;
            AuthState.isLoggedIn = true;
            
            console.log('👤 Utilisateur déjà connecté:', AuthState.currentUser.prenom);
            updateUIForAuthState();
            
        } catch (error) {
            console.error('❌ Erreur lecture données utilisateur:', error);
            logout(); // Je nettoie si les données sont corrompues
        }
    }
}

// Gérer l'inscription - Comme enregistrer un nouveau membre
async function handleRegister(event) {
    if (event) event.preventDefault(); // J'empêche le rechargement de la page
    
    console.log('📝 Tentative d\'inscription...');
    
    // Je récupère les données du formulaire - Comme lire une fiche d'inscription
    const telephone = document.getElementById('telephone')?.value || '';
    
    // Construire le numéro complet avec l'indicatif +225 pour la Côte d'Ivoire
    let telephoneComplet = telephone;
    if (telephone) {
        // Supprimer le 0 initial si présent (pour les numéros locaux)
        const telNettoye = telephone.replace(/^0+/, '').replace(/\s+/g, '');
        // Ajouter automatiquement l'indicatif +225 pour la Côte d'Ivoire
        if (!telNettoye.startsWith('+225')) {
            telephoneComplet = '+225' + telNettoye;
        } else {
            telephoneComplet = telNettoye;
        }
    }
    
    const formData = {
        nom: document.getElementById('nom')?.value,
        prenom: document.getElementById('prenom')?.value,
        email: document.getElementById('email')?.value,
        telephone: telephoneComplet, // Numéro complet avec indicatif +225
        mot_de_passe: document.getElementById('mot_de_passe')?.value,
        confirmation_mdp: document.getElementById('confirmation_mdp')?.value,
        role: document.getElementById('role')?.value,
        commune: document.getElementById('commune')?.value,
        admin_code: document.getElementById('admin_code')?.value || null // Code admin si rôle = ADMIN
    };
    
    // Validation basique - Comme vérifier que la fiche est bien remplie
    if (!validateRegisterForm(formData)) {
        return;
    }
    
    // Je montre un indicateur de chargement - Comme "Veuillez patienter"
    showLoading('Inscription en cours...');
    
    try {
        // J'envoie la demande d'inscription - Comme envoyer la fiche au bureau
        const response = await AgriConnectAPI.register(formData);
        
        if (response.status === 'success') {
            // Inscription réussie !
            console.log('✅ Inscription réussie:', response.user_info);
            
            // Sauvegarder temporairement les infos utilisateur
            if (response.user_info) {
                // Extraire nom et prénom du nom_complet
                const nomComplet = response.user_info.nom_complet || '';
                const partiesNom = nomComplet.split(' ');
                
                // Créer un objet utilisateur complet pour la connexion automatique
                const userData = {
                    id: response.user_info.id,
                    nom: response.user_info.nom || partiesNom.slice(1).join(' ') || '',
                    prenom: response.user_info.prenom || partiesNom[0] || '',
                    email: response.user_info.email,
                    telephone: response.user_info.telephone,
                    role: response.user_info.role,
                    commune: response.user_info.commune
                };
                
                // Enregistrer l'utilisateur et afficher le succès
                handleLoginSuccess(userData, true);
                showSuccess('Inscription réussie', () => {
                    const currentPath = window.location.pathname;
                    if (currentPath.includes('register.html')) {
                        window.location.href = 'index.html';
                    } else {
                        window.location.href = '../index.html';
                    }
                });
            } else {
                // Sinon rediriger vers l'accueil
                showSuccess('Inscription réussie', () => {
                    window.location.href = 'index.html';
                });
            }
            
        } else {
            // Erreur d'inscription
            showError(response.message || 'Erreur lors de l\'inscription');
        }
        
    } catch (error) {
        // Erreur réseau ou serveur - Comme "Ligne téléphonique coupée"
        console.error('❌ Erreur inscription:', error);
        showError(error.message || 'Erreur de connexion au serveur');
        
    } finally {
        // Je cache l'indicateur de chargement - Comme éteindre le "Veuillez patienter"
        hideLoading();
    }
}

// Valider le formulaire d'inscription - Comme vérifier que tout est en ordre
function validateRegisterForm(data) {
    // Vérification des champs obligatoires - Comme "N'oubliez pas de signer"
    const required = ['nom', 'prenom', 'email', 'telephone', 'mot_de_passe', 'confirmation_mdp', 'role', 'commune'];
    for (const field of required) {
        if (!data[field] || data[field].trim() === '') {
            showError(`Le champ ${field} est obligatoire`);
            return false;
        }
    }
    
    // Vérification email - Comme vérifier que l'adresse est valide
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        showError('Adresse email invalide');
        return false;
    }
    
    // Vérification mot de passe - Comme vérifier que le code est assez fort
    if (data.mot_de_passe.length < 6) {
        showError('Le mot de passe doit contenir au moins 6 caractères');
        return false;
    }
    
    // Vérification confirmation mot de passe - Comme "Retapez votre code"
    if (data.mot_de_passe !== data.confirmation_mdp) {
        showError('Les mots de passe ne correspondent pas');
        return false;
    }
    
    return true; // Tout est bon !
}

// Gérer la connexion - Comme vérifier l'identité à l'entrée
async function handleLogin(event) {
    if (event) event.preventDefault();
    
    console.log('🔑 Tentative de connexion...');
    
    // Je récupère les identifiants - Comme lire la carte de membre
    const loginData = {
        email: document.getElementById('email')?.value,
        mot_de_passe: document.getElementById('mot_de_passe')?.value
    };
    
    // Validation basique
    if (!loginData.email || !loginData.mot_de_passe) {
        showError('Email et mot de passe requis');
        return;
    }
    
    showLoading('Connexion en cours...');
    
    try {
        // J'envoie la demande de connexion - Comme scanner la carte
        const response = await AgriConnectAPI.login(loginData);
        
        if (response.status === 'success') {
            // Connexion réussie !
            // L'API retourne response.user avec les infos utilisateur
            const userData = response.user || response.user_info;
            if (userData) {
                handleLoginSuccess(userData, false);
                showSuccess('Connexion réussie', () => {
                    redirectToDashboard(userData.role);
                });
            } else {
                showError('Erreur : données utilisateur manquantes');
            }
            
        } else {
            // Identifiants incorrects
            showError(response.message || 'Email ou mot de passe incorrect');
        }
        
    } catch (error) {
        console.error('❌ Erreur connexion:', error);
        showError(error.message || 'Erreur de connexion au serveur');
        
    } finally {
        hideLoading();
    }
}

// Gérer une connexion réussie - Comme ouvrir les portes
async function handleLoginSuccess(userData, fromRegister = false) {
    console.log('🎉 Connexion réussie:', userData.prenom);
    
    // Je mets à jour l'état - Comme enregistrer l'entrée
    AuthState.currentUser = userData;
    AuthState.isLoggedIn = true;
    AuthState.token = generateToken(); // Je crée un token simple
    
    // Je sauvegarde dans le localStorage - Comme donner un badge permanent
    localStorage.setItem('agriConnect_user', JSON.stringify(userData));
    localStorage.setItem('agriConnect_token', AuthState.token);
    
    // Je mets à jour l'interface
    updateUIForAuthState();
    
    // La redirection est gérée par showSuccess dans handleLogin/handleRegister
    // Cette fonction est appelée via le callback de showSuccess
}

// Rediriger vers le bon dashboard - Comme guider vers le bon service
// NOTE : Fonction utilisée depuis login/register (chemins relatifs)
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

// Déconnexion - Comme sortir du bâtiment
// Afficher le modal de mot de passe oublié
function showForgotPasswordModal() {
    const modal = document.createElement('div');
    modal.className = 'forgot-password-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 12px; max-width: 400px; width: 90%; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
            <h2 style="color: #2d5016; margin-bottom: 20px;">🔒 Mot de passe oublié</h2>
            <p style="color: #7f8c8d; margin-bottom: 20px;">Entrez votre email pour recevoir un code de réinitialisation.</p>
            <form id="forgotPasswordForm">
                <div class="input-group" style="margin-bottom: 15px;">
                    <div class="input-icon">📧</div>
                    <input type="email" id="forgotEmail" class="auth-input" placeholder="Votre email" required>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button type="button" onclick="this.closest('.forgot-password-modal').remove()" 
                            style="flex: 1; padding: 12px; background: #e1e8ed; border: none; border-radius: 8px; cursor: pointer;">
                        Annuler
                    </button>
                    <button type="submit" 
                            style="flex: 1; padding: 12px; background: #4a7c3a; color: white; border: none; border-radius: 8px; cursor: pointer;">
                        Envoyer
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Gérer la soumission
    document.getElementById('forgotPasswordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('forgotEmail').value;
        
        try {
            const response = await AgriConnectAPI.forgotPassword(email);
            
            if (response.status === 'success') {
                // Afficher le modal de code
                showResetCodeModal(email, response.reset_code);
                modal.remove();
            } else {
                alert('Erreur: ' + (response.message || 'Erreur inconnue'));
            }
        } catch (error) {
            alert('Erreur: ' + error.message);
        }
    });
    
    // Fermer en cliquant en dehors
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// Afficher le modal de code de réinitialisation
function showResetCodeModal(email, resetCode) {
    const modal = document.createElement('div');
    modal.className = 'reset-password-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 12px; max-width: 400px; width: 90%; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
            <h2 style="color: #2d5016; margin-bottom: 20px;">🔐 Code de réinitialisation</h2>
            <p style="color: #7f8c8d; margin-bottom: 20px;">
                Un code a été généré. En production, il sera envoyé par email/SMS.<br>
                <strong style="color: #e74c3c;">Code (développement): ${resetCode}</strong>
            </p>
            <form id="resetPasswordForm">
                <input type="hidden" id="resetEmail" value="${email}">
                <div class="input-group" style="margin-bottom: 15px;">
                    <div class="input-icon">🔢</div>
                    <input type="text" id="resetCode" class="auth-input" placeholder="Code à 6 chiffres" maxlength="6" required>
                </div>
                <div class="input-group" style="margin-bottom: 15px;">
                    <div class="input-icon">🔒</div>
                    <input type="password" id="newPassword" class="auth-input" placeholder="Nouveau mot de passe" required>
                </div>
                <div class="input-group" style="margin-bottom: 15px;">
                    <div class="input-icon">🔒</div>
                    <input type="password" id="confirmPassword" class="auth-input" placeholder="Confirmer le mot de passe" required>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button type="button" onclick="this.closest('.reset-password-modal').remove()" 
                            style="flex: 1; padding: 12px; background: #e1e8ed; border: none; border-radius: 8px; cursor: pointer;">
                        Annuler
                    </button>
                    <button type="submit" 
                            style="flex: 1; padding: 12px; background: #4a7c3a; color: white; border: none; border-radius: 8px; cursor: pointer;">
                        Réinitialiser
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Gérer la soumission
    document.getElementById('resetPasswordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('resetEmail').value;
        const code = document.getElementById('resetCode').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        try {
            const response = await AgriConnectAPI.resetPassword({
                email: email,
                reset_code: code,
                new_password: newPassword,
                confirm_password: confirmPassword
            });
            
            if (response.status === 'success') {
                alert('✅ Mot de passe réinitialisé avec succès !');
                modal.remove();
                // Rediriger vers la page de connexion
                window.location.href = 'login.html';
            } else {
                alert('Erreur: ' + (response.message || 'Erreur inconnue'));
            }
        } catch (error) {
            alert('Erreur: ' + error.message);
        }
    });
    
    // Fermer en cliquant en dehors
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

function logout() {
    console.log('🚪 Déconnexion...');
    
    // Je nettoie l'état - Comme rendre le badge
    AuthState.currentUser = null;
    AuthState.isLoggedIn = false;
    AuthState.token = null;
    
    // Je nettoie le localStorage - Comme effacer les traces
    localStorage.removeItem('agriConnect_user');
    localStorage.removeItem('agriConnect_token');
    localStorage.removeItem('agriConnect_panier'); // Panier (clé unifiée)
    localStorage.removeItem('agriConnect_cart'); // Ancienne clé pour compatibilité
    localStorage.removeItem('agriConnect_favoris'); // Favoris
    
    // Je mets à jour l'interface - Comme éteindre le voyant
    updateUIForAuthState();
    
    // Je redirige vers l'accueil - Comme sortir vers la rue
    // Chemin physique: C:\xampp\htdocs\agriconnect\frontend\index.html
    // Construire le chemin de manière fiable depuis n'importe où
    const currentPath = window.location.pathname;
    const normalizedPath = currentPath.replace(/\\/g, '/');
    const origin = window.location.origin;
    
    // Construire le chemin absolu vers frontend/index.html
    // Extraire la partie base (avant /frontend/frontend/ ou /frontend/)
    let pathToIndex = '';
    
    if (normalizedPath.includes('/frontend/frontend/')) {
        // Exemple: /agriconnect/frontend/frontend/pages/livreur.html
        // On veut: /agriconnect/frontend/index.html
        const base = normalizedPath.substring(0, normalizedPath.indexOf('/frontend/frontend/'));
        pathToIndex = base + '/frontend/index.html';
    } else if (normalizedPath.includes('/frontend/')) {
        // Exemple: /agriconnect/frontend/login.html
        // On veut: /agriconnect/frontend/index.html
        const base = normalizedPath.substring(0, normalizedPath.indexOf('/frontend/'));
        pathToIndex = base + '/frontend/index.html';
    } else {
        // Fallback: utiliser chemin relatif
        if (normalizedPath.includes('/pages/')) {
            pathToIndex = '../../index.html';
        } else if (normalizedPath.includes('/frontend/')) {
            pathToIndex = 'index.html';
        } else {
            pathToIndex = 'frontend/index.html';
        }
    }
    
    console.log('📍 Déconnexion - Chemin actuel:', currentPath);
    console.log('📍 Chemin normalisé:', normalizedPath);
    console.log('📍 Redirection vers:', pathToIndex);
    
    // Utiliser le chemin calculé
    window.location.href = pathToIndex;
}

// Mettre à jour l'interface selon l'état de connexion - Comme adapter les affichages
function updateUIForAuthState() {
    const navAuth = document.getElementById('navAuth');
    
    if (!navAuth) return; // Pas sur une page avec navigation
    
    if (AuthState.isLoggedIn && AuthState.currentUser) {
        // Interface connecté - Comme montrer "Bienvenue [Prénom]"
        navAuth.innerHTML = `
            <div class="user-menu">
                <span class="welcome-text">Bonjour, ${AuthState.currentUser.prenom}</span>
                <div class="dropdown">
                    <button class="btn btn-outline" onclick="goToUserDashboardFromNav()">
                        Mon tableau de bord
                    </button>
                    <button class="btn btn-outline" onclick="logout()">
                        Déconnexion
                    </button>
                </div>
            </div>
        `;
    } else {
        // Interface non connecté - Comme montrer "Connectez-vous"
        navAuth.innerHTML = `
            <button onclick="redirectToLogin()" class="btn btn-outline">Connexion</button>
            <button onclick="redirectToRegister()" class="btn btn-primary">Inscription</button>
        `;
    }
}

// ========== FONCTIONS UTILITAIRES ==========

// Générer un token simple - Comme créer un badge temporaire
function generateToken() {
    return 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Redirections
function redirectToLogin() {
    window.location.href = 'login.html';
}

function redirectToRegister() {
    window.location.href = 'register.html';
}

// Messages d'interface élégants
function showLoading(message = 'Chargement...') {
    // Créer l'overlay de chargement
    const overlay = document.createElement('div');
    overlay.id = 'authLoadingOverlay';
    overlay.className = 'auth-loading-overlay';
    overlay.innerHTML = `
        <div class="auth-loading-content">
            <div class="auth-spinner">
                <div class="auth-spinner-circle"></div>
            </div>
            <p class="auth-loading-text">${message}</p>
        </div>
    `;
    document.body.appendChild(overlay);
    
    // Animation d'apparition
    setTimeout(() => {
        overlay.classList.add('show');
    }, 10);
}

function hideLoading() {
    const overlay = document.getElementById('authLoadingOverlay');
    if (overlay) {
        overlay.classList.remove('show');
        setTimeout(() => {
            overlay.remove();
        }, 300);
    }
}

function showError(message) {
    hideLoading();
    
    const overlay = document.createElement('div');
    overlay.id = 'authErrorOverlay';
    overlay.className = 'auth-notification-overlay';
    overlay.innerHTML = `
        <div class="auth-notification-content error">
            <div class="auth-notification-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
            </div>
            <p class="auth-notification-text">${message}</p>
            <button class="auth-notification-close" onclick="this.closest('.auth-notification-overlay').remove()">OK</button>
        </div>
    `;
    document.body.appendChild(overlay);
    
    setTimeout(() => {
        overlay.classList.add('show');
    }, 10);
    
    // Auto-fermeture après 5 secondes
    setTimeout(() => {
        if (overlay.parentNode) {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 300);
        }
    }, 5000);
}

function showSuccess(message = 'Succès !', redirectCallback = null) {
    hideLoading();
    
    const overlay = document.createElement('div');
    overlay.id = 'authSuccessOverlay';
    overlay.className = 'auth-notification-overlay';
    overlay.innerHTML = `
        <div class="auth-notification-content success">
            <div class="auth-success-icon">
                <svg class="auth-check-circle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" class="auth-circle-bg"></circle>
                    <path d="M9 12l2 2 4-4" class="auth-check-path"></path>
                </svg>
            </div>
            <p class="auth-notification-text">${message}</p>
        </div>
    `;
    document.body.appendChild(overlay);
    
    // Animation d'apparition
    setTimeout(() => {
        overlay.classList.add('show');
    }, 10);
    
    // Animation du check mark
    setTimeout(() => {
        const checkPath = overlay.querySelector('.auth-check-path');
        const circleBg = overlay.querySelector('.auth-circle-bg');
        if (checkPath && circleBg) {
            checkPath.style.strokeDasharray = checkPath.getTotalLength();
            checkPath.style.strokeDashoffset = checkPath.getTotalLength();
            checkPath.style.animation = 'auth-checkDraw 0.5s ease forwards 0.3s';
            circleBg.style.animation = 'auth-circleFill 0.5s ease forwards';
        }
    }, 100);
    
    // Redirection après 1 seconde (sans message de redirection)
    if (redirectCallback) {
        setTimeout(() => {
            overlay.classList.remove('show');
            setTimeout(() => {
                overlay.remove();
                redirectCallback();
            }, 300);
        }, 1200);
    } else {
        // Auto-fermeture après 2 secondes
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.classList.remove('show');
                setTimeout(() => overlay.remove(), 300);
            }
        }, 2000);
    }
}

// Configuration des écouteurs d'événements
function setupAuthEventListeners() {
    // Écouteur pour le formulaire de connexion
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Écouteur pour le formulaire d'inscription
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
}

// Démarrer le système d'authentification au chargement
document.addEventListener('DOMContentLoaded', initAuth);