// FICHIER : scripts/dashboard-acheteur.js
// BUT : Gérer toutes les fonctionnalités du dashboard acheteur
// COMME : Le cerveau du dashboard acheteur qui contrôle tout

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 Initialisation dashboard acheteur...');
    
    // Vérifier l'authentification
    initAuthGuard();
    
    // Charger les informations utilisateur
    loadUserInfo();
    
    // Charger le panier
    loadCart();
    
    // Gérer la redirection vers la section commandes si hash présent
    if (window.location.hash === '#commandes') {
        // Attendre un peu que tout soit chargé avant d'afficher
        setTimeout(() => {
            showSection('commandes');
            // loadOrders() sera appelé automatiquement par showSection()
        }, 300);
    } else {
        // Charger les commandes en arrière-plan même si pas sur la section
        loadOrders();
    }
    
    // Charger les notifications
    loadNotifications();
    
    // Charger les favoris
    loadFavorites();
    
    // Charger les messages
    loadMessages();
    
    // Charger le profil
    loadProfile();
    
    // Configuration de la navigation entre sections
    setupNavigation();
    
    console.log('✅ Dashboard acheteur initialisé');
});

/**
 * Charge et affiche les informations de l'utilisateur connecté
 */
function loadUserInfo() {
    const userData = JSON.parse(localStorage.getItem('agriConnect_user'));
    
    if (userData) {
        // Afficher le nom complet dans la barre de navigation
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = `${userData.prenom} ${userData.nom}`;
        }
        
        console.log('👤 Utilisateur chargé:', userData.prenom, userData.nom);
    }
}

/**
 * Charge et affiche le panier dans la section dashboard
 * NOTE : Utilise la même clé localStorage que panier.js pour la cohérence
 */
function loadCart() {
    const panierContent = document.getElementById('panierDashboardContent');
    if (!panierContent) return;
    
    // Récupérer le panier depuis localStorage 
    // NOTE : Utilise la clé 'agriConnect_panier' (même que panier.js pour cohérence)
    const panier = JSON.parse(localStorage.getItem('agriConnect_panier')) || [];
    
    if (panier.length === 0) {
        panierContent.innerHTML = `
            <p style="text-align: center; color: #7f8c8d; padding: 40px;">
                Votre panier est vide. <a href="../../catalogue.html" style="color: #4a7c3a;">Parcourir le catalogue</a>
            </p>
        `;
        return;
    }
    
    // Calculer le total
    const total = panier.reduce((sum, item) => sum + (item.prix_kg * item.quantity), 0);
    
    // Afficher les articles du panier
    panierContent.innerHTML = `
        <div class="panier-items">
            ${panier.map(item => `
                <div class="panier-item" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #e1e8ed; margin-bottom: 10px;">
                    <div style="flex: 1;">
                        <h4 style="margin: 0; color: #2d5016;">${item.nom}</h4>
                        <p style="margin: 5px 0; color: #7f8c8d; font-size: 0.9rem;">${item.prix_kg} FCFA/kg × ${item.quantity} kg</p>
                        <p style="margin: 0; color: #5d6d7e; font-size: 0.85rem;">👨‍🌾 ${item.producteur || 'Producteur'}</p>
                    </div>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <span style="font-weight: bold; color: #4a7c3a; font-size: 1.1rem;">
                            ${(parseFloat(item.prix_kg || 0) * parseFloat(item.quantity || 0)).toLocaleString('fr-FR')} FCFA
                        </span>
                        <button class="btn btn-sm btn-danger" onclick="removeFromCart('${item.id}')">
                            🗑️
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="panier-total" style="margin-top: 20px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <span style="font-size: 1.2rem; font-weight: bold;">Total:</span>
                <span style="font-size: 1.5rem; font-weight: bold; color: #4a7c3a;">
                    ${parseFloat(total || 0).toLocaleString('fr-FR')} FCFA
                </span>
            </div>
            <button class="btn btn-primary btn-large" onclick="window.location.href='../../panier.html'" style="width: 100%;">
                Passer commande →
            </button>
        </div>
    `;
    
    // Mettre à jour le badge du panier dans la navbar
    updateCartBadge(panier.length);
}

/**
 * Met à jour le badge du panier dans la navbar
 */
function updateCartBadge(count) {
    const cartBadge = document.getElementById('cartBadge');
    if (cartBadge) {
        const totalItems = count; // count est déjà le nombre d'articles
        if (totalItems > 0) {
            cartBadge.textContent = totalItems;
            cartBadge.style.display = 'flex';
        } else {
            cartBadge.style.display = 'none';
        }
    }
}

/**
 * Met à jour le badge des commandes dans la sidebar
 */
function updateOrdersBadge(count) {
    const ordersBadge = document.getElementById('ordersBadge');
    if (ordersBadge) {
        if (count > 0) {
            ordersBadge.textContent = count;
            ordersBadge.style.display = 'inline-flex';
        } else {
            ordersBadge.style.display = 'none';
        }
    }
}

/**
 * Met à jour les statistiques des commandes
 */
function updateOrdersStats(commandes) {
    // Calculer les statistiques
    const totalCommandes = commandes.length;
    const commandesEnLivraison = commandes.filter(c => c.statut === 'EN_LIVRAISON' || c.statut === 'EN_PREPARATION').length;
    const depenseTotale = commandes.reduce((sum, c) => sum + parseFloat(c.total || 0), 0);
    
    // Mettre à jour les stats dans la section accueil si elles existent
    const statCommandes = document.querySelector('.stat-card.primary .stat-value');
    if (statCommandes) {
        statCommandes.textContent = totalCommandes;
    }
    
    const statLivraison = document.querySelector('.stat-card.warning .stat-value');
    if (statLivraison) {
        statLivraison.textContent = commandesEnLivraison;
    }
    
    const statDepense = document.querySelector('.stat-card.success .stat-value');
    if (statDepense) {
        statDepense.textContent = parseFloat(depenseTotale || 0).toLocaleString('fr-FR') + ' FCFA';
    }
}

/**
 * Retire un article du panier
 */
function removeFromCart(productId) {
    let panier = JSON.parse(localStorage.getItem('agriConnect_panier')) || [];
    panier = panier.filter(item => item.id !== productId);
    localStorage.setItem('agriConnect_panier', JSON.stringify(panier));
    loadCart();
}

/**
 * Charge les commandes de l'utilisateur
 */
async function loadOrders() {
    const commandesContent = document.getElementById('commandesContent');
    if (!commandesContent) {
        console.error('❌ Élément commandesContent introuvable');
        return;
    }
    
    commandesContent.innerHTML = '<div class="loading-message">Chargement de vos commandes...</div>';
    
    try {
        const userData = JSON.parse(localStorage.getItem('agriConnect_user'));
        if (!userData || !userData.id) {
            console.error('❌ Utilisateur non connecté ou ID manquant');
            commandesContent.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 40px;">Veuillez vous connecter.</p>';
            return;
        }
        
        console.log('📦 Chargement des commandes pour:', userData.id);
        
        // Appel API pour récupérer les commandes de l'acheteur
        const response = await AgriConnectAPI.getOrders(userData.id, 'ACHETEUR');
        
        console.log('📦 Réponse API commandes complète:', JSON.stringify(response, null, 2));
        
        if (!response) {
            throw new Error('Aucune réponse de l\'API');
        }
        
        if (response.status === 'error') {
            throw new Error(response.message || 'Erreur lors du chargement des commandes');
        }
        
        if (response.status === 'success' && response.commandes && Array.isArray(response.commandes) && response.commandes.length > 0) {
            // Mettre à jour le badge des commandes
            updateOrdersBadge(response.commandes.length);
            
            let ordersHTML = '<div class="orders-list">';
            
            response.commandes.forEach(commande => {
                let dateCommande = 'Date inconnue';
                try {
                    if (commande.created_at) {
                        dateCommande = new Date(commande.created_at).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        });
                    }
                } catch (e) {
                    console.error('Erreur formatage date:', e);
                    dateCommande = 'Date inconnue';
                }
                
                let itemsHTML = '';
                if (commande.items && commande.items.length > 0) {
                    itemsHTML = '<ul style="list-style: none; padding: 10px 0; margin: 10px 0; border-top: 1px solid #e1e8ed;">';
                    commande.items.forEach(item => {
                        const prixItem = (parseFloat(item.prix_unitaire || 0) * parseFloat(item.quantite || 0));
                    itemsHTML += `<li style="padding: 5px 0;">${item.quantite || 0} ${item.unite || 'kg'} x ${item.produit_nom || 'Produit'} - ${prixItem.toLocaleString('fr-FR')} FCFA</li>`;
                    });
                    itemsHTML += '</ul>';
                }
                
                const statutColors = {
                    'EN_ATTENTE': '#f39c12',
                    'CONFIRMEE': '#3498db',
                    'EN_PREPARATION': '#9b59b6',
                    'EN_LIVRAISON': '#3498db',
                    'LIVREE': '#27ae60',
                    'ANNULEE': '#e74c3c'
                };
                
                ordersHTML += `
                    <div class="order-card" style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                            <div>
                                <h3 style="color: #2d5016; margin-bottom: 5px;">Commande #${commande.numero || commande.id.substring(0, 8)}</h3>
                                <p style="color: #7f8c8d; font-size: 0.9rem;">${dateCommande}</p>
                            </div>
                            <span style="background: ${statutColors[commande.statut] || '#7f8c8d'}; color: white; padding: 5px 15px; border-radius: 20px; font-size: 0.85rem; font-weight: bold;">
                                ${commande.statut || 'EN_ATTENTE'}
                            </span>
                        </div>
                        ${itemsHTML}
                        <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #e1e8ed;">
                            <div style="display: flex; justify-content: space-between; font-weight: bold; color: #2d5016;">
                                <span>Total:</span>
                                <span>${parseFloat(commande.total || 0).toLocaleString('fr-FR')} FCFA</span>
                            </div>
                            ${commande.frais_livraison > 0 ? `<div style="display: flex; justify-content: space-between; color: #7f8c8d; font-size: 0.9rem; margin-top: 5px;"><span>Frais de livraison:</span><span>${parseFloat(commande.frais_livraison).toLocaleString('fr-FR')} FCFA</span></div>` : ''}
                            <div style="margin-top: 10px; color: #7f8c8d; font-size: 0.85rem;">
                                📍 Livraison: ${commande.commune_livraison || 'Bouaké-Ville'}
                            </div>
                        </div>
                    </div>
                `;
            });
            
            ordersHTML += '</div>';
            commandesContent.innerHTML = ordersHTML;
            
            // Mettre à jour les statistiques
            updateOrdersStats(response.commandes);
        } else if (response.status === 'success' && (!response.commandes || response.commandes.length === 0)) {
            // Pas de commandes mais succès
            updateOrdersBadge(0);
            
            commandesContent.innerHTML = `
                <div style="text-align: center; padding: 60px 20px;">
                    <div style="font-size: 64px; margin-bottom: 20px;">📦</div>
                    <h3 style="color: #2d5016; margin-bottom: 10px;">Aucune commande pour le moment</h3>
                    <p style="color: #7f8c8d; margin-bottom: 30px;">Commencez vos achats dès maintenant !</p>
                    <a href="../../catalogue.html" class="btn btn-primary" style="display: inline-block;">
                        🔍 Parcourir le catalogue
                    </a>
                </div>
            `;
        } else {
            // Réponse inattendue
            console.error('❌ Format de réponse inattendu:', response);
            updateOrdersBadge(0);
            commandesContent.innerHTML = `
                <div style="text-align: center; color: #e74c3c; padding: 40px;">
                    <p>Format de réponse inattendu de l'API.</p>
                    <button onclick="loadOrders()" class="btn btn-primary" style="margin-top: 15px;">
                        🔄 Réessayer
                    </button>
                </div>
            `;
        }
    } catch (error) {
        console.error('❌ Erreur chargement commandes:', error);
        console.error('❌ Détails de l\'erreur:', error.message, error.stack);
        
        let errorMessage = 'Erreur lors du chargement de vos commandes.';
        if (error.message) {
            errorMessage += ' ' + error.message;
        }
        
        commandesContent.innerHTML = `
            <div style="text-align: center; color: #e74c3c; padding: 40px; background: #fee; border-radius: 8px; margin: 20px 0;">
                <p style="font-weight: bold; margin-bottom: 10px;">❌ ${errorMessage}</p>
                <p style="font-size: 0.9rem; color: #7f8c8d;">Veuillez réessayer plus tard ou contacter le support.</p>
                <button onclick="loadOrders()" style="margin-top: 15px; padding: 10px 20px; background: #4a7c3a; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    🔄 Réessayer
                </button>
            </div>
        `;
    }
}

/**
 * Charge les notifications de l'utilisateur
 */
async function loadNotifications() {
    const notificationsContent = document.getElementById('notificationsContent');
    if (!notificationsContent) return;
    
    notificationsContent.innerHTML = '<div class="loading-message">Chargement de vos notifications...</div>';
    
    try {
        const userData = JSON.parse(localStorage.getItem('agriConnect_user'));
        if (!userData) {
            notificationsContent.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 40px;">Veuillez vous connecter.</p>';
            return;
        }
        
        const response = await AgriConnectAPI.getNotifications(userData.id);
        
        if (response.status === 'success' && response.notifications) {
            // Mettre à jour le badge
            const notificationsBadge = document.getElementById('notificationsBadge');
            if (notificationsBadge && response.statistiques) {
                const nonLues = response.statistiques.non_lues || 0;
                if (nonLues > 0) {
                    notificationsBadge.textContent = nonLues;
                    notificationsBadge.style.display = 'inline-flex';
                } else {
                    notificationsBadge.style.display = 'none';
                }
            }
            
            if (response.notifications.length === 0) {
                notificationsContent.innerHTML = `
                    <p style="text-align: center; color: #7f8c8d; padding: 40px;">
                        Aucune notification pour le moment.
                    </p>
                `;
                return;
            }
            
            // Afficher les notifications
            notificationsContent.innerHTML = response.notifications.map(notif => {
                const dateNotif = new Date(notif.created_at).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                const typeIcon = {
                    'COMMANDE': '📦',
                    'PAIEMENT': '💰',
                    'LIVRAISON': '🚚',
                    'SYSTEME': '⚙️',
                    'PRODUIT': '🍅'
                };
                
                return `
                    <div class="notification-item" style="background: ${notif.is_lu ? 'white' : '#f0f9ff'}; border-left: 4px solid ${notif.is_lu ? '#e1e8ed' : '#3498db'}; padding: 20px; margin-bottom: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div style="flex: 1;">
                                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                                    <span style="font-size: 1.5rem;">${typeIcon[notif.type] || '🔔'}</span>
                                    <h3 style="margin: 0; color: #2d5016; font-size: 1.1rem;">${notif.titre}</h3>
                                    ${!notif.is_lu ? '<span style="background: #3498db; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.75rem; font-weight: bold;">Nouveau</span>' : ''}
                                </div>
                                <p style="margin: 0; color: #5d6d7e; line-height: 1.6;">${notif.message}</p>
                                <p style="margin: 10px 0 0 0; color: #7f8c8d; font-size: 0.85rem;">${dateNotif}</p>
                            </div>
                            ${!notif.is_lu ? `
                                <button class="btn btn-sm btn-primary" onclick="markNotificationRead('${notif.id}')" style="margin-left: 15px;">
                                    Marquer comme lu
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            notificationsContent.innerHTML = `
                <p style="text-align: center; color: #7f8c8d; padding: 40px;">
                    Aucune notification pour le moment.
                </p>
            `;
        }
    } catch (error) {
        console.error('Erreur chargement notifications:', error);
        notificationsContent.innerHTML = `
            <p style="text-align: center; color: #e74c3c; padding: 40px;">
                Erreur lors du chargement de vos notifications.
            </p>
        `;
    }
}

/**
 * Marque une notification comme lue
 */
async function markNotificationRead(notificationId) {
    try {
        const userData = JSON.parse(localStorage.getItem('agriConnect_user'));
        if (!userData) return;
        
        await AgriConnectAPI.markNotificationRead(notificationId, userData.id);
        
        // Recharger les notifications
        loadNotifications();
    } catch (error) {
        console.error('Erreur marquage notification:', error);
        alert('Erreur lors du marquage de la notification');
    }
}

/**
 * Charge les favoris de l'utilisateur
 */
function loadFavorites() {
    const favorisContent = document.getElementById('favorisContent');
    if (!favorisContent) return;
    
    const favoris = JSON.parse(localStorage.getItem('agriConnect_favoris')) || [];
    
    if (favoris.length === 0) {
        favorisContent.innerHTML = `
            <p style="text-align: center; color: #7f8c8d; padding: 40px;">
                Aucun produit en favoris pour le moment.
            </p>
        `;
        return;
    }
    
    // Afficher les favoris
    favorisContent.innerHTML = favoris.map(fav => `
        <div class="favori-item" style="padding: 15px; border: 1px solid #e1e8ed; border-radius: 8px; margin-bottom: 10px;">
            <h4>${fav.nom}</h4>
            <p>${fav.prix} FCFA/${fav.unite || 'unité'}</p>
        </div>
    `).join('');
}

/**
 * Charge les messages de l'utilisateur
 */
async function loadMessages() {
    // La fonction loadConversations() du fichier messaging.js sera appelée
    if (typeof loadConversations === 'function') {
        await loadConversations();
    } else {
        console.warn('loadConversations n\'est pas disponible. Vérifiez que messaging.js est chargé.');
        const conversationsList = document.getElementById('conversationsList');
        if (conversationsList) {
            conversationsList.innerHTML = `
                <div style="text-align: center; color: #7f8c8d; padding: 40px;">
                    <p>Chargement des conversations...</p>
                </div>
            `;
        }
    }
}

/**
 * Envoie un message (utilise la fonction sendMessage() de messaging.js)
 */
function envoyerMessage() {
    if (typeof sendMessage === 'function') {
        sendMessage();
    } else {
        alert('Système de messagerie non disponible');
    }
}

/**
 * Charge les informations du profil
 */
async function loadProfile() {
    const profilContent = document.getElementById('profilContent');
    if (!profilContent) return;
    
    try {
        const userData = JSON.parse(localStorage.getItem('agriConnect_user'));
        if (!userData) return;
        
        // Charger le profil complet depuis l'API
        let profileData = null;
        try {
            const profileResponse = await AgriConnectAPI.getProfile(userData.id);
            if (profileResponse && profileResponse.status === 'success') {
                profileData = profileResponse.profile;
                // Mettre à jour les données utilisateur si nécessaire
                if (profileData) {
                    Object.assign(userData, profileData);
                    localStorage.setItem('agriConnect_user', JSON.stringify(userData));
                }
            }
        } catch (error) {
            console.error('Erreur chargement profil API:', error);
        }
        
        profilContent.innerHTML = `
            <div class="profil-info" style="background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%); padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); border: 1px solid #e1e8ed;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <div style="width: 100px; height: 100px; background: linear-gradient(135deg, #2d5016 0%, #4a7c3a 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; font-size: 40px; color: white; box-shadow: 0 4px 15px rgba(45, 80, 22, 0.3);">
                        👤
                    </div>
                    <h2 style="color: #2d5016; margin-bottom: 5px; font-size: 1.8rem;">${userData.prenom} ${userData.nom}</h2>
                    <p style="color: #7f8c8d; margin: 0; font-size: 0.95rem;">${userData.role}</p>
                </div>
                
                <div style="display: grid; gap: 25px; margin-bottom: 30px;">
                    <div class="info-item" style="background: white; padding: 20px; border-radius: 12px; border-left: 4px solid #4a7c3a; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        <label style="font-weight: 700; color: #2d5016; display: flex; align-items: center; gap: 10px; margin-bottom: 8px; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">
                            <span>📧</span> Email
                        </label>
                        <p style="margin: 0; color: #2c3e50; font-size: 1.1rem; font-weight: 500;">${userData.email}</p>
                    </div>
                    
                    <div class="info-item" style="background: white; padding: 20px; border-radius: 12px; border-left: 4px solid #4a7c3a; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        <label style="font-weight: 700; color: #2d5016; display: flex; align-items: center; gap: 10px; margin-bottom: 8px; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">
                            <span>📱</span> Téléphone
                        </label>
                        <p style="margin: 0; color: #2c3e50; font-size: 1.1rem; font-weight: 500;">${userData.telephone || 'Non spécifié'}</p>
                    </div>
                    
                    <div class="info-item" style="background: white; padding: 20px; border-radius: 12px; border-left: 4px solid #4a7c3a; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        <label style="font-weight: 700; color: #2d5016; display: flex; align-items: center; gap: 10px; margin-bottom: 8px; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">
                            <span>📍</span> Commune
                        </label>
                        <p style="margin: 0; color: #2c3e50; font-size: 1.1rem; font-weight: 500;">${userData.commune || 'Non spécifiée'}</p>
                    </div>
                </div>
                
                <div style="margin-top: 30px; display: flex; gap: 15px; flex-wrap: wrap;">
                    <button class="btn btn-primary" onclick="editProfile()" style="flex: 1; min-width: 150px; padding: 12px 20px; font-weight: 600; border-radius: 10px; box-shadow: 0 4px 12px rgba(74, 124, 58, 0.3);">
                        ✏️ Modifier mon profil
                    </button>
                    <button class="btn btn-outline" onclick="changePassword()" style="flex: 1; min-width: 150px; padding: 12px 20px; font-weight: 600; border-radius: 10px; border: 2px solid #4a7c3a; color: #4a7c3a;">
                        🔒 Changer mon mot de passe
                    </button>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Erreur chargement profil:', error);
    }
}

/**
 * Ouvre le formulaire de modification de profil
 */
function editProfile() {
    const userData = JSON.parse(localStorage.getItem('agriConnect_user'));
    if (!userData) return;
    
    // Créer le modal de modification
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'editProfileModal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px;';
    modal.onclick = function(e) {
        if (e.target === modal) closeEditProfileModal();
    };
    
    modal.innerHTML = `
        <div class="modal-content" onclick="event.stopPropagation();" style="background: white; border-radius: 16px; padding: 30px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 2px solid #e1e8ed; padding-bottom: 15px;">
                <h2 style="color: #2d5016; margin: 0; font-size: 1.8rem;">✏️ Modifier mon profil</h2>
                <button onclick="closeEditProfileModal()" style="background: none; border: none; font-size: 28px; cursor: pointer; color: #7f8c8d; padding: 0; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: all 0.3s;" 
                        onmouseover="this.style.background='#f0f0f0'; this.style.color='#e74c3c';" 
                        onmouseout="this.style.background='none'; this.style.color='#7f8c8d';">×</button>
            </div>
            
            <form id="editProfileForm" onsubmit="saveProfile(event); return false;">
                <div style="display: grid; gap: 20px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <label style="display: block; font-weight: 600; color: #2d5016; margin-bottom: 8px;">Prénom *</label>
                            <input type="text" id="editPrenom" value="${userData.prenom || ''}" required
                                   style="width: 100%; padding: 12px; border: 2px solid #e1e8ed; border-radius: 8px; font-size: 16px; transition: border-color 0.3s;"
                                   onfocus="this.style.borderColor='#4a7c3a';"
                                   onblur="this.style.borderColor='#e1e8ed';">
                        </div>
                        <div>
                            <label style="display: block; font-weight: 600; color: #2d5016; margin-bottom: 8px;">Nom *</label>
                            <input type="text" id="editNom" value="${userData.nom || ''}" required
                                   style="width: 100%; padding: 12px; border: 2px solid #e1e8ed; border-radius: 8px; font-size: 16px; transition: border-color 0.3s;"
                                   onfocus="this.style.borderColor='#4a7c3a';"
                                   onblur="this.style.borderColor='#e1e8ed';">
                        </div>
                    </div>
                    
                    <div>
                        <label style="display: block; font-weight: 600; color: #2d5016; margin-bottom: 8px;">Email *</label>
                        <input type="email" id="editEmail" value="${userData.email || ''}" required
                               style="width: 100%; padding: 12px; border: 2px solid #e1e8ed; border-radius: 8px; font-size: 16px; transition: border-color 0.3s;"
                               onfocus="this.style.borderColor='#4a7c3a';"
                               onblur="this.style.borderColor='#e1e8ed';">
                    </div>
                    
                    <div>
                        <label style="display: block; font-weight: 600; color: #2d5016; margin-bottom: 8px;">Téléphone</label>
                        <input type="tel" id="editTelephone" value="${userData.telephone || ''}"
                               placeholder="07 12 34 56 78"
                               style="width: 100%; padding: 12px; border: 2px solid #e1e8ed; border-radius: 8px; font-size: 16px; transition: border-color 0.3s;"
                               onfocus="this.style.borderColor='#4a7c3a';"
                               onblur="this.style.borderColor='#e1e8ed';">
                    </div>
                    
                    <div>
                        <label style="display: block; font-weight: 600; color: #2d5016; margin-bottom: 8px;">Commune</label>
                        <select id="editCommune" style="width: 100%; padding: 12px; border: 2px solid #e1e8ed; border-radius: 8px; font-size: 16px; transition: border-color 0.3s;"
                                onfocus="this.style.borderColor='#4a7c3a';"
                                onblur="this.style.borderColor='#e1e8ed';">
                            <option value="">Sélectionnez une commune</option>
                            <option value="Bouaké-Ville" ${userData.commune === 'Bouaké-Ville' ? 'selected' : ''}>Bouaké-Ville</option>
                            <option value="Bounda" ${userData.commune === 'Bounda' ? 'selected' : ''}>Bounda</option>
                            <option value="Brobo" ${userData.commune === 'Brobo' ? 'selected' : ''}>Brobo</option>
                            <option value="Djébonoua" ${userData.commune === 'Djébonoua' ? 'selected' : ''}>Djébonoua</option>
                            <option value="Sakassou" ${userData.commune === 'Sakassou' ? 'selected' : ''}>Sakassou</option>
                            <option value="Béoumi" ${userData.commune === 'Béoumi' ? 'selected' : ''}>Béoumi</option>
                            <option value="Botro" ${userData.commune === 'Botro' ? 'selected' : ''}>Botro</option>
                        </select>
                    </div>
                </div>
                
                <div style="display: flex; gap: 15px; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e1e8ed;">
                    <button type="submit" class="btn btn-primary" style="flex: 1; padding: 12px; font-size: 16px; font-weight: 600;">
                        💾 Enregistrer les modifications
                    </button>
                    <button type="button" onclick="closeEditProfileModal()" class="btn btn-outline" style="flex: 1; padding: 12px; font-size: 16px;">
                        Annuler
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.style.opacity = '1', 10);
}

/**
 * Ferme le modal de modification de profil
 */
function closeEditProfileModal() {
    const modal = document.getElementById('editProfileModal');
    if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
    }
}

/**
 * Sauvegarde les modifications du profil
 */
async function saveProfile(event) {
    event.preventDefault();
    
    const userData = JSON.parse(localStorage.getItem('agriConnect_user'));
    if (!userData) {
        alert('❌ Erreur: Utilisateur non connecté');
        return;
    }
    
    const updates = {
        nom: document.getElementById('editNom').value.trim(),
        prenom: document.getElementById('editPrenom').value.trim(),
        email: document.getElementById('editEmail').value.trim(),
        telephone: document.getElementById('editTelephone').value.trim(),
        commune: document.getElementById('editCommune').value
    };
    
    // Validation
    if (!updates.nom || !updates.prenom || !updates.email) {
        alert('❌ Veuillez remplir tous les champs obligatoires');
        return;
    }
    
    try {
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Enregistrement...';
        
        const response = await AgriConnectAPI.updateProfile(userData.id, updates);
        
        if (response && response.status === 'success') {
            // Mettre à jour les données dans localStorage
            Object.assign(userData, updates);
            localStorage.setItem('agriConnect_user', JSON.stringify(userData));
            
            // Recharger le profil
            loadProfile();
            
            // Fermer le modal
            closeEditProfileModal();
            
            // Afficher un message de succès
            showSuccessMessage('✅ Profil mis à jour avec succès !');
            
            // Mettre à jour le nom dans la barre de navigation
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = `${updates.prenom} ${updates.nom}`;
            }
        } else {
            alert('❌ Erreur: ' + (response?.message || 'Erreur inconnue'));
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    } catch (error) {
        console.error('Erreur sauvegarde profil:', error);
        alert('❌ Erreur lors de la sauvegarde. Veuillez réessayer.');
        const submitBtn = event.target.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = '💾 Enregistrer les modifications';
    }
}

/**
 * Affiche un message de succès
 */
function showSuccessMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #27ae60; color: white; padding: 15px 25px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); z-index: 10001; font-weight: 600;';
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.opacity = '0';
        messageDiv.style.transition = 'opacity 0.3s';
        setTimeout(() => messageDiv.remove(), 300);
    }, 3000);
}

/**
 * Ouvre le formulaire de changement de mot de passe
 */
function changePassword() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'changePasswordModal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px;';
    modal.onclick = function(e) {
        if (e.target === modal) closeChangePasswordModal();
    };
    
    modal.innerHTML = `
        <div class="modal-content" onclick="event.stopPropagation();" style="background: white; border-radius: 16px; padding: 30px; max-width: 500px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 2px solid #e1e8ed; padding-bottom: 15px;">
                <h2 style="color: #2d5016; margin: 0; font-size: 1.8rem;">🔒 Changer mon mot de passe</h2>
                <button onclick="closeChangePasswordModal()" style="background: none; border: none; font-size: 28px; cursor: pointer; color: #7f8c8d; padding: 0; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: all 0.3s;" 
                        onmouseover="this.style.background='#f0f0f0'; this.style.color='#e74c3c';" 
                        onmouseout="this.style.background='none'; this.style.color='#7f8c8d';">×</button>
            </div>
            
            <form id="changePasswordForm" onsubmit="savePassword(event); return false;">
                <div style="display: grid; gap: 20px;">
                    <div>
                        <label style="display: block; font-weight: 600; color: #2d5016; margin-bottom: 8px;">Mot de passe actuel *</label>
                        <input type="password" id="currentPassword" required
                               placeholder="Entrez votre mot de passe actuel"
                               style="width: 100%; padding: 12px; border: 2px solid #e1e8ed; border-radius: 8px; font-size: 16px; transition: border-color 0.3s;"
                               onfocus="this.style.borderColor='#4a7c3a';"
                               onblur="this.style.borderColor='#e1e8ed';">
                    </div>
                    
                    <div>
                        <label style="display: block; font-weight: 600; color: #2d5016; margin-bottom: 8px;">Nouveau mot de passe *</label>
                        <input type="password" id="newPassword" required minlength="6"
                               placeholder="Minimum 6 caractères"
                               style="width: 100%; padding: 12px; border: 2px solid #e1e8ed; border-radius: 8px; font-size: 16px; transition: border-color 0.3s;"
                               onfocus="this.style.borderColor='#4a7c3a';"
                               onblur="this.style.borderColor='#e1e8ed';">
                    </div>
                    
                    <div>
                        <label style="display: block; font-weight: 600; color: #2d5016; margin-bottom: 8px;">Confirmer le nouveau mot de passe *</label>
                        <input type="password" id="confirmPassword" required minlength="6"
                               placeholder="Répétez le nouveau mot de passe"
                               style="width: 100%; padding: 12px; border: 2px solid #e1e8ed; border-radius: 8px; font-size: 16px; transition: border-color 0.3s;"
                               onfocus="this.style.borderColor='#4a7c3a';"
                               onblur="this.style.borderColor='#e1e8ed';">
                    </div>
                </div>
                
                <div style="display: flex; gap: 15px; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e1e8ed;">
                    <button type="submit" class="btn btn-primary" style="flex: 1; padding: 12px; font-size: 16px; font-weight: 600;">
                        🔒 Changer le mot de passe
                    </button>
                    <button type="button" onclick="closeChangePasswordModal()" class="btn btn-outline" style="flex: 1; padding: 12px; font-size: 16px;">
                        Annuler
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.style.opacity = '1', 10);
}

/**
 * Ferme le modal de changement de mot de passe
 */
function closeChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
    }
}

/**
 * Sauvegarde le nouveau mot de passe
 */
async function savePassword(event) {
    event.preventDefault();
    
    const userData = JSON.parse(localStorage.getItem('agriConnect_user'));
    if (!userData) {
        alert('❌ Erreur: Utilisateur non connecté');
        return;
    }
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        alert('❌ Veuillez remplir tous les champs');
        return;
    }
    
    if (newPassword.length < 6) {
        alert('❌ Le nouveau mot de passe doit contenir au moins 6 caractères');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        alert('❌ Les mots de passe ne correspondent pas');
        return;
    }
    
    try {
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Modification...';
        
        const response = await AgriConnectAPI.updatePassword(userData.id, {
            current_password: currentPassword,
            new_password: newPassword
        });
        
        if (response && response.status === 'success') {
            closeChangePasswordModal();
            showSuccessMessage('✅ Mot de passe modifié avec succès !');
            
            // Réinitialiser le formulaire
            document.getElementById('changePasswordForm').reset();
        } else {
            alert('❌ Erreur: ' + (response?.message || 'Erreur inconnue'));
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    } catch (error) {
        console.error('Erreur changement mot de passe:', error);
        alert('❌ Erreur lors de la modification. Veuillez réessayer.');
        const submitBtn = event.target.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = '🔒 Changer le mot de passe';
    }
}

/**
 * Configure la navigation entre les sections du dashboard
 */
function setupNavigation() {
    // Gestion des clics sur les items de navigation
    document.querySelectorAll('.nav-item[data-section]').forEach(item => {
        item.addEventListener('click', function(e) {
            // Si c'est un lien vers une page externe, ne pas empêcher le comportement par défaut
            if (this.href && !this.href.includes('#')) {
                return;
            }
            
            e.preventDefault();
            const section = this.getAttribute('data-section');
            showSection(section);
            
            // Mettre à jour l'état actif
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // Mettre à jour l'URL avec le hash
            window.location.hash = section;
        });
    });
    
    // Gérer le hash au chargement de la page
    if (window.location.hash) {
        const section = window.location.hash.substring(1);
        console.log('📍 Hash détecté:', section);
        
        // Attendre que le DOM soit complètement chargé
        setTimeout(() => {
            showSection(section);
            
            // Mettre à jour l'item actif
            document.querySelectorAll('.nav-item').forEach(nav => {
                nav.classList.remove('active');
                if (nav.getAttribute('data-section') === section) {
                    nav.classList.add('active');
                }
            });
        }, 100);
    }
}

/**
 * Affiche une section spécifique du dashboard
 * @param {string} sectionId - ID de la section à afficher
 */
function showSection(sectionId) {
    // Cacher toutes les sections
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Afficher la section demandée
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Recharger les données si nécessaire
    if (sectionId === 'panier') {
        loadCart();
    } else if (sectionId === 'favoris') {
        loadFavorites();
    } else if (sectionId === 'commandes') {
        loadOrders();
    } else if (sectionId === 'messages') {
        loadMessages();
    } else if (sectionId === 'notifications') {
        loadNotifications();
    } else if (sectionId === 'mon-profil') {
        loadProfile();
    }
}

// Fonction globale pour la déconnexion (utilisée par le bouton)
function logout() {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
        // Nettoyer le localStorage (toutes les données utilisateur)
        localStorage.removeItem('agriConnect_user');
        localStorage.removeItem('agriConnect_token');
        localStorage.removeItem('agriConnect_panier'); // Panier
        localStorage.removeItem('agriConnect_favoris'); // Favoris
        localStorage.removeItem('agriConnect_cart'); // Ancienne clé si elle existe
        
        // Rediriger vers l'accueil
        window.location.href = '../../index.html';
    }
}


