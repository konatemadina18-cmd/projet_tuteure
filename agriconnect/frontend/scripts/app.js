// FICHIER : scripts/app.js
// BUT : Gérer toute l'application frontend

// État global de l'application
const AppState = {
    currentUser: null,
    isLoggedIn: false,
    currentPage: 'home',
    cart: [],
    notifications: []
};

// Variables pour le carrousel
let currentSlide = 0;
let carouselInterval;

// Produits vivriers avec vraies images
const produitsVivriers = [
    {
        id: 2,
        nom: 'Oignons violets',
        prix: 1200,
        description: 'Oignons violets parfumés et frais',
        commune: 'Bounda',
        producteur: 'Exploitation Bounda',
        image: 'assets/images/produits/oignons.jpg'
    },
    {
        id: 3,
        nom: 'Riz local',
        prix: 600,
        description: 'Riz de qualité supérieure bien nettoyé',
        commune: 'Brobo',
        producteur: 'Rizière Brobo',
        image: 'assets/images/produits/riz_local.jpg'
    },
    {
        id: 4,
        nom: 'Igname',
        prix: 500,
        description: 'Igname fraîchement récoltée de saison',
        commune: 'Djébonoua',
        producteur: 'Champs Djébonoua',
        image: 'assets/images/produits/ignames.jpg'
    },
    {
        id: 5,
        nom: 'Manioc',
        prix: 300,
        description: 'Manioc frais pour attiéké et placali',
        commune: 'Bouaké-Ville',
        producteur: 'Ferme Yao & Fils',
        image: 'assets/images/produits/manioc.jpg'
    },
    {
        id: 6,
        nom: 'Bananes plantain',
        prix: 400,
        description: 'Bananes plantain mûres à point',
        commune: 'Bounda',
        producteur: 'Plantation Bounda',
        image: 'assets/images/produits/banane_plantain.jpg'
    }
];

// Fonction pour initialiser l'application
function initApp() {
    console.log('🚀 Initialisation AgriConnect Bouaké...');
    
    checkAuthStatus();
    loadHomepageData();
    setupEventListeners();
    initCarousel();
    
    console.log('✅ Application AgriConnect prête !');
}

// Vérifier si l'utilisateur est connecté
function checkAuthStatus() {
    const userData = localStorage.getItem('agriConnect_user');
    
    if (userData) {
        try {
            AppState.currentUser = JSON.parse(userData);
            AppState.isLoggedIn = true;
            updateNavigation();
            console.log('👤 Utilisateur connecté:', AppState.currentUser.prenom);
        } catch (error) {
            console.error('❌ Erreur lecture données utilisateur:', error);
            logout();
        }
    }
}

// Mettre à jour la navigation
function updateNavigation() {
    const navAuth = document.getElementById('navAuth');
    
    if (!navAuth) return;
    
    if (AppState.isLoggedIn) {
        navAuth.innerHTML = `
            <div class="user-menu">
                <span>Bonjour, ${AppState.currentUser.prenom} ${AppState.currentUser.nom}</span>
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
        
        const dashboardBtn = document.getElementById('dashboardBtn');
        const registerBtn = document.getElementById('registerBtn');
        if (dashboardBtn) dashboardBtn.style.display = 'inline-block';
        if (registerBtn) registerBtn.style.display = 'none';
    } else {
        navAuth.innerHTML = `
            <button onclick="redirectToLogin()" class="btn btn-outline">Connexion</button>
            <button onclick="redirectToRegister()" class="btn btn-primary">Inscription</button>
        `;
        
        const dashboardBtn = document.getElementById('dashboardBtn');
        const registerBtn = document.getElementById('registerBtn');
        if (dashboardBtn) dashboardBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'inline-block';
    }
}

// Fonction pour aller au dashboard
function goToDashboard() {
    redirectToDashboard();
}

// Afficher la section dashboard selon le rôle
function loadDashboardSection() {
    const dashboardSection = document.getElementById('dashboard-section');
    const dashboardContent = document.getElementById('dashboardContent');
    
    if (!dashboardSection || !dashboardContent) return;
    
    const userData = localStorage.getItem('agriConnect_user');
    
    if (userData) {
        try {
            const user = JSON.parse(userData);
            dashboardSection.style.display = 'block';
            
            let dashboardHTML = '';
            let dashboardUrl = '';
            
            switch(user.role) {
                case 'ACHETEUR':
                    dashboardHTML = `
                        <div class="dashboard-preview">
                            <div class="preview-icon">🛒</div>
                            <h3>Espace Acheteur</h3>
                            <p>Bienvenue ${user.prenom} ! Gérez vos commandes, favoris et panier.</p>
                            <ul style="text-align: left; margin-top: 15px;">
                                <li>🛒 Gérer votre panier</li>
                                <li>❤️ Consulter vos favoris</li>
                                <li>📦 Suivre vos commandes</li>
                                <li>💬 Messagerie avec les producteurs</li>
                            </ul>
                        </div>
                    `;
                    dashboardUrl = 'frontend/pages/acheteur.html';
                    break;
                    
                case 'PRODUCTEUR':
                    dashboardHTML = `
                        <div class="dashboard-preview">
                            <div class="preview-icon">👨‍🌾</div>
                            <h3>Espace Producteur</h3>
                            <p>Bienvenue ${user.prenom} ! Gérez vos produits, commandes et finances.</p>
                            <ul style="text-align: left; margin-top: 15px;">
                                <li>🍅 Gérer vos produits</li>
                                <li>📦 Traiter les commandes</li>
                                <li>🚚 Suivre les livraisons</li>
                                <li>💰 Consulter vos revenus</li>
                            </ul>
                        </div>
                    `;
                    dashboardUrl = 'frontend/pages/producteur.html';
                    break;
                    
                case 'LIVREUR':
                    dashboardHTML = `
                        <div class="dashboard-preview">
                            <div class="preview-icon">🚚</div>
                            <h3>Espace Livreur</h3>
                            <p>Bienvenue ${user.prenom} ! Gérez vos livraisons et itinéraires.</p>
                            <ul style="text-align: left; margin-top: 15px;">
                                <li>📋 Voir les livraisons assignées</li>
                                <li>🗺️ Planifier vos itinéraires</li>
                                <li>✅ Marquer les livraisons comme terminées</li>
                                <li>💬 Communication avec clients</li>
                                <li>💰 Suivre vos gains</li>
                            </ul>
                        </div>
                    `;
                    dashboardUrl = 'frontend/pages/livreur.html';
                    break;
                    
                case 'ADMIN':
                    dashboardHTML = `
                        <div class="dashboard-preview">
                            <div class="preview-icon">⚙️</div>
                            <h3>Espace Administrateur</h3>
                            <p>Bienvenue ${user.prenom} ! Gérez la plateforme AgriConnect.</p>
                            <ul style="text-align: left; margin-top: 15px;">
                                <li>👥 Gérer les utilisateurs</li>
                                <li>📊 Voir les statistiques</li>
                                <li>⚙️ Paramètres de la plateforme</li>
                                <li>📝 Modérer le contenu</li>
                            </ul>
                        </div>
                    `;
                    dashboardUrl = 'frontend/pages/admin.html';
                    break;
                    
                default:
                    dashboardHTML = `
                        <div class="dashboard-preview">
                            <div class="preview-icon">📊</div>
                            <h3>Tableau de Bord</h3>
                            <p>Bienvenue ${user.prenom} ! Accédez à votre espace personnel.</p>
                        </div>
                    `;
                    dashboardUrl = '#';
            }
            
            dashboardContent.innerHTML = dashboardHTML;
            
            const goToDashboardBtn = document.getElementById('goToDashboardBtn');
            if (goToDashboardBtn) {
                goToDashboardBtn.onclick = function() {
                    window.location.href = dashboardUrl;
                };
            }
            
        } catch (error) {
            console.error('❌ Erreur chargement section dashboard:', error);
            dashboardSection.style.display = 'none';
        }
    } else {
        dashboardSection.style.display = 'none';
    }
}

// Rediriger vers le dashboard (depuis n'importe quelle page)
function goToUserDashboardFromNav() {
    const userData = localStorage.getItem('agriConnect_user');
    if (!userData) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const user = JSON.parse(userData);
        let dashboardUrl = 'frontend/pages/acheteur.html';
        
        switch(user.role) {
            case 'PRODUCTEUR':
                dashboardUrl = 'frontend/pages/producteur.html';
                break;
            case 'ACHETEUR':
                dashboardUrl = 'frontend/pages/acheteur.html';
                break;
            case 'LIVREUR':
                dashboardUrl = 'frontend/pages/livreur.html';
                break;
            case 'ADMIN':
                dashboardUrl = 'frontend/pages/admin.html';
                break;
        }
        
        console.log('📍 Redirection vers:', dashboardUrl);
        window.location.href = dashboardUrl;
        
    } catch (error) {
        console.error('❌ Erreur redirection dashboard:', error);
        alert('Erreur de redirection vers le tableau de bord');
    }
}

// Rediriger vers le dashboard (depuis index.html)
function goToUserDashboard() {
    goToUserDashboardFromNav();
}

// Charger les données de la page d'accueil
async function loadHomepageData() {
    try {
        console.log('📦 Chargement des données accueil...');
        
        loadDashboardSection();
        
        const userData = localStorage.getItem('agriConnect_user');
        const heroStats = document.getElementById('heroStats');
        
        if (userData && heroStats) {
            heroStats.style.display = 'flex';
            
            try {
                const productsResponse = await AgriConnectAPI.getProducts();
                if (productsResponse.status === 'success' && productsResponse.produits) {
                    updateStats('totalProducts', productsResponse.produits.length);
                }
            } catch (error) {
                console.error('❌ Erreur chargement produits:', error);
            }
        } else {
            if (heroStats) {
                heroStats.style.display = 'none';
            }
        }
        
        const featuredProducts = document.getElementById('featuredProducts');
        if (featuredProducts) {
            featuredProducts.style.display = 'none';
        }
        
    } catch (error) {
        console.error('❌ Erreur chargement données accueil:', error);
    }
}

// Afficher les produits en vedette
function displayFeaturedProducts(products) {
    const productsGrid = document.getElementById('featuredProducts');
    
    if (!productsGrid || products.length === 0) return;
    
    const productsHTML = products.map(product => `
        <div class="product-card">
            <img src="assets/images/product-placeholder.jpg" alt="${product.nom}" class="product-image">
            <h3>${product.nom}</h3>
            <p class="product-price">${product.prix} FCFA/${product.unite}</p>
            <p class="product-description">${product.description || 'Produit local de qualité'}</p>
            <p class="product-location">📍 ${product.commune}</p>
            <p class="product-producer">👨‍🌾 ${product.producteur}</p>
            <button class="btn btn-primary btn-block" onclick="addToCart('${product.id}')">
                🛒 Ajouter au panier
            </button>
        </div>
    `).join('');
    
    productsGrid.innerHTML = productsHTML;
}

// Mettre à jour les statistiques
function updateStats(statId, value) {
    const statElement = document.getElementById(statId);
    if (statElement) {
        animateCount(statElement, 0, value, 2000);
    }
}

// Animation de comptage
function animateCount(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        element.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Redirections
function redirectToLogin() {
    window.location.href = 'login.html';
}

function redirectToRegister() {
    window.location.href = 'register.html';
}

function redirectToCatalogue() {
    window.location.href = 'catalogue.html';
}

function redirectToDashboard() {
    const role = AppState.currentUser?.role;
    let dashboardPage = 'frontend/pages/acheteur.html';
    
    switch(role) {
        case 'PRODUCTEUR':
            dashboardPage = 'frontend/pages/producteur.html';
            break;
        case 'ACHETEUR':
            dashboardPage = 'frontend/pages/acheteur.html';
            break;
        case 'ADMIN':
            dashboardPage = 'frontend/pages/admin.html';
            break;
        case 'LIVREUR':
            dashboardPage = 'frontend/pages/livreur.html';
            break;
    }
    
    console.log('📍 Redirection dashboard:', dashboardPage);
    window.location.href = dashboardPage;
}

// Déconnexion - Utilise la fonction de auth.js si disponible, sinon utilise cette version
function logout() {
    // Si auth.js est chargé, sa fonction logout() sera utilisée car elle écrase celle-ci
    // Sinon, utiliser cette version de fallback
    const currentPath = window.location.pathname.replace(/\\/g, '/');
    let pathToIndex = '';
    
    // Utiliser la même logique que auth.js pour construire le chemin
    if (currentPath.includes('/frontend/frontend/')) {
        const base = currentPath.substring(0, currentPath.indexOf('/frontend/frontend/'));
        pathToIndex = base + '/frontend/index.html';
    } else if (currentPath.includes('/frontend/')) {
        const base = currentPath.substring(0, currentPath.indexOf('/frontend/'));
        pathToIndex = base + '/frontend/index.html';
    } else {
        // Fallback: chemin relatif
        if (currentPath.includes('/pages/')) {
            pathToIndex = '../../index.html';
        } else if (currentPath.includes('/frontend/')) {
            pathToIndex = 'index.html';
        } else {
            pathToIndex = 'frontend/index.html';
        }
    }
    
    // Nettoyer le localStorage
    localStorage.removeItem('agriConnect_user');
    localStorage.removeItem('agriConnect_token');
    localStorage.removeItem('agriConnect_panier');
    localStorage.removeItem('agriConnect_cart');
    localStorage.removeItem('agriConnect_favoris');
    
    AppState.currentUser = null;
    AppState.isLoggedIn = false;
    AppState.cart = [];
    
    console.log('📍 Déconnexion (app.js fallback) - Chemin actuel:', currentPath);
    console.log('📍 Redirection vers:', pathToIndex);
    
    window.location.href = pathToIndex;
}

// Configuration des événements
function setupEventListeners() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
            // Empêcher le scroll du body quand le menu est ouvert
            if (navMenu.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });
        
        // Fermer le menu en cliquant en dehors
        document.addEventListener('click', (e) => {
            if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
    
    // Fermer le menu quand on clique sur un lien
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu) {
                navMenu.classList.remove('active');
                if (navToggle) navToggle.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });
}

// Fonction pour ajouter au panier
function addToCart(productId, nom, prix, unite, producteur) {
    const userData = localStorage.getItem('agriConnect_user');
    if (!userData) {
        alert('Veuillez vous connecter pour ajouter des articles au panier');
        redirectToLogin();
        return;
    }
    
    let panier = JSON.parse(localStorage.getItem('agriConnect_panier')) || [];
    
    const existingProduct = panier.find(item => item.id === productId);
    
    if (existingProduct) {
        existingProduct.quantity += 1;
    } else {
        panier.push({
            id: productId,
            nom: nom || 'Produit',
            prix_kg: prix || 0,
            unite: unite || 'kg',
            quantity: 1,
            producteur: producteur || 'Producteur'
        });
    }
    
    localStorage.setItem('agriConnect_panier', JSON.stringify(panier));
    alert(`✅ ${nom || 'Produit'} ajouté au panier !`);
    
    console.log('🛒 Panier mis à jour:', panier);
}

// ============================================================================
// FONCTIONS POUR LE CARROUSEL - IMAGES SEULEMENT
// ============================================================================

// Initialiser le carrousel
function initCarousel() {
    const carouselTrack = document.getElementById('carouselTrack');
    const carouselIndicators = document.getElementById('carouselIndicators');
    
    if (!carouselTrack) {
        console.log('❌ carouselTrack non trouvé');
        return;
    }
    
    console.log('🔄 Initialisation du carrousel...');
    
    carouselTrack.innerHTML = produitsVivriers.map((produit, index) => `
        <div class="carousel-slide" data-slide="${index}">
            <div class="carousel-product">
                <div class="carousel-product-image">
                    <img src="${produit.image}" 
                         alt="${produit.nom}"
                         onerror="this.src='https://via.placeholder.com/300x300/2d5016/ffffff?text=Image'">
                </div>
            </div>
        </div>
    `).join('');
    
    if (carouselIndicators) {
        carouselIndicators.innerHTML = produitsVivriers.map((_, index) => `
            <button class="carousel-indicator ${index === 0 ? 'active' : ''}" 
                    onclick="goToSlide(${index})"></button>
        `).join('');
    }
    
    startAutoSlide();
    
    const carousel = document.querySelector('.carousel-container');
    if (carousel) {
        carousel.addEventListener('mouseenter', () => {
            clearInterval(carouselInterval);
        });
        
        carousel.addEventListener('mouseleave', () => {
            startAutoSlide();
        });
    }
    
    console.log('✅ Carrousel initialisé avec', produitsVivriers.length, 'images');
}

// Aller à un slide spécifique
function goToSlide(slideIndex) {
    const carouselTrack = document.getElementById('carouselTrack');
    const indicators = document.querySelectorAll('.carousel-indicator');
    const slides = document.querySelectorAll('.carousel-slide');
    
    if (!carouselTrack || slides.length === 0) return;
    
    currentSlide = slideIndex;
    
    const slideWidth = slides[0].offsetWidth + 24;
    const translateX = -currentSlide * slideWidth;
    
    carouselTrack.style.transform = `translateX(${translateX}px)`;
    
    indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentSlide);
    });
    
    resetAutoSlide();
}

// Slide suivant
function nextSlide() {
    const nextIndex = (currentSlide + 1) % produitsVivriers.length;
    goToSlide(nextIndex);
}

// Slide précédent
function prevSlide() {
    const prevIndex = (currentSlide - 1 + produitsVivriers.length) % produitsVivriers.length;
    goToSlide(prevIndex);
}

// Défilement automatique
function startAutoSlide() {
    carouselInterval = setInterval(nextSlide, 4000);
}

// Redémarrer le défilement automatique
function resetAutoSlide() {
    clearInterval(carouselInterval);
    startAutoSlide();
}

// Démarrer l'application
document.addEventListener('DOMContentLoaded', initApp);