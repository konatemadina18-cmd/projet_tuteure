// FICHIER : scripts/admin.js
// BUT : Gérer toutes les fonctionnalités du dashboard administrateur

// État global admin
const AdminState = {
    stats: {},
    users: [],
    producers: [],
    buyers: [],
    livreurs: [],
    orders: [],
    products: [],
    notifications: []
};

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Initialisation dashboard admin...');
    
    // Vérifier l'authentification et le rôle
    initAuthGuard();
    
    // Charger les informations admin
    loadAdminInfo();
    
    // Charger le dashboard principal
    loadDashboard();
    
    // Configuration de la navigation
    setupNavigation();
    
    // Fermer la modale si on clique en dehors
    const productModal = document.getElementById('productModal');
    if (productModal) {
        productModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeProductModal();
            }
        });
    }
    
    console.log('✅ Dashboard admin initialisé');
});

/**
 * Vérifie que l'utilisateur est admin
 */
function initAuthGuard() {
    const userData = localStorage.getItem('agriConnect_user');
    if (!userData) {
        window.location.href = '../../login.html';
        return;
    }
    
    try {
        const user = JSON.parse(userData);
        if (user.role !== 'ADMIN') {
            alert('Accès réservé aux administrateurs');
            redirectToDashboard(user.role);
            return;
        }
        
        // Afficher le nom de l'admin
        const adminName = document.getElementById('adminName');
        if (adminName) {
            adminName.textContent = user.prenom + ' ' + user.nom;
        }
    } catch (error) {
        console.error('Erreur vérification admin:', error);
        window.location.href = '../../login.html';
    }
}

/**
 * Charge les informations de l'admin
 */
function loadAdminInfo() {
    const userData = JSON.parse(localStorage.getItem('agriConnect_user'));
    if (userData) {
        const adminName = document.getElementById('adminName');
        if (adminName) {
            adminName.textContent = `${userData.prenom} ${userData.nom}`;
        }
    }
}

/**
 * Charge le dashboard principal avec toutes les statistiques
 */
async function loadDashboard() {
    try {
        // Charger toutes les statistiques en parallèle
        await Promise.all([
            loadGlobalStats(),
            loadRecentActivity(),
            loadAlerts()
        ]);
    } catch (error) {
        console.error('Erreur chargement dashboard:', error);
    }
}

/**
 * Charge les statistiques globales
 */
async function loadGlobalStats() {
    try {
        const response = await AgriConnectAPI.getAdminStats();
        
        if (response.status === 'success' && response.stats) {
            const stats = response.stats;
            
            // Statistiques utilisateurs
            const usersStats = stats.users || {};
            document.getElementById('totalUsers').textContent = usersStats.total_users || 0;
            document.getElementById('totalProducers').textContent = usersStats.total_producteurs || 0;
            document.getElementById('totalBuyers').textContent = usersStats.total_acheteurs || 0;
            
            // Tendances utilisateurs
            document.getElementById('usersTrend').textContent = `+${usersStats.nouveaux_mois || 0} ce mois`;
            document.getElementById('producersTrend').textContent = `${stats.active_producers || 0} actifs`;
            document.getElementById('buyersTrend').textContent = `${stats.active_buyers || 0} actifs`;
            
            // Statistiques commandes
            const ordersStats = stats.orders || {};
            document.getElementById('totalOrders').textContent = ordersStats.total_commandes || 0;
            const chiffreAffaires = parseFloat(ordersStats.chiffre_affaires_total || 0);
            document.getElementById('totalRevenue').textContent = isNaN(chiffreAffaires) ? '0 FCFA' : chiffreAffaires.toLocaleString('fr-FR') + ' FCFA';
            
            // Tendances commandes
            document.getElementById('ordersTrend').textContent = `+${ordersStats.commandes_mois || 0} ce mois`;
            const caMois = parseFloat(ordersStats.ca_mois || 0);
            const caTotal = parseFloat(ordersStats.chiffre_affaires_total || 0);
            const pourcentage = caTotal > 0 ? Math.round((caMois / caTotal) * 100) : 0;
            document.getElementById('revenueTrend').textContent = `${pourcentage}% ce mois`;
            
            // Statistiques notifications
            const notifStats = stats.notifications || {};
            document.getElementById('totalNotifications').textContent = notifStats.total_notifications || 0;
            document.getElementById('notificationsTrend').textContent = `${notifStats.notifications_non_lues || 0} non lues`;
            
            AdminState.stats = stats;
        } else {
            throw new Error('Erreur lors du chargement des statistiques');
        }
    } catch (error) {
        console.error('Erreur chargement stats:', error);
        // Valeurs par défaut en cas d'erreur
        document.getElementById('totalUsers').textContent = '0';
        document.getElementById('totalProducers').textContent = '0';
        document.getElementById('totalBuyers').textContent = '0';
        document.getElementById('totalOrders').textContent = '0';
        document.getElementById('totalRevenue').textContent = '0 FCFA';
        document.getElementById('totalNotifications').textContent = '0';
    }
}

/**
 * Charge l'activité récente
 */
async function loadRecentActivity() {
    const recentActivity = document.getElementById('recentActivity');
    if (!recentActivity) return;
    
    // Simuler l'activité récente
    const activities = [
        { action: 'Nouvelle commande', user: 'Marie Koné', time: 'Il y a 5 min', type: 'order' },
        { action: 'Nouveau producteur', user: 'Jean Traoré', time: 'Il y a 15 min', type: 'user' },
        { action: 'Produit ajouté', user: 'Ferme Bio', time: 'Il y a 30 min', type: 'product' },
        { action: 'Commande livrée', user: 'Sophie Kouassi', time: 'Il y a 1h', type: 'order' },
        { action: 'Nouvel acheteur', user: 'Paul Yao', time: 'Il y a 2h', type: 'user' }
    ];
    
    recentActivity.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <strong>${activity.action}</strong> par ${activity.user}
            <div class="activity-time">${activity.time}</div>
        </div>
    `).join('');
}

/**
 * Charge les alertes importantes
 */
async function loadAlerts() {
    const alertsList = document.getElementById('alertsList');
    if (!alertsList) return;
    
    // Simuler les alertes
    const alerts = [
        { message: '3 notifications non lues nécessitent votre attention', type: 'warning' },
        { message: '2 produits en rupture de stock', type: 'danger' },
        { message: 'Nouvelle demande de support', type: 'info' }
    ];
    
    if (alerts.length === 0) {
        alertsList.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 20px;">Aucune alerte</p>';
        return;
    }
    
    alertsList.innerHTML = alerts.map(alert => `
        <div class="alert-item ${alert.type}">
            ${alert.message}
        </div>
    `).join('');
}

/**
 * Charge les utilisateurs
 */
async function loadUsers() {
    const usersContent = document.getElementById('utilisateursContent');
    if (!usersContent) return;
    
    usersContent.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 40px;">Chargement des utilisateurs...</p>';
    
    try {
        const response = await AgriConnectAPI.getAllUsers();
        
        if (response.status === 'success' && response.users) {
            const totalCount = response.total || response.users.length;
            
            let tableRows = response.users.map(user => `
                <tr>
                    <td>${user.prenom} ${user.nom}</td>
                    <td>${user.email}</td>
                    <td>${user.telephone || 'N/A'}</td>
                    <td>${user.commune || 'N/A'}</td>
                    <td><span class="badge badge-info">${user.role}</span></td>
                    <td>${new Date(user.created_at).toLocaleDateString('fr-FR')}</td>
                </tr>
            `).join('');
            
            usersContent.innerHTML = `
                <div style="margin-bottom: 20px;">
                    <span style="color: #7f8c8d; font-size: 16px;"><strong>Total: ${totalCount} utilisateurs</strong></span>
                </div>
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Nom Complet</th>
                            <th>Email</th>
                            <th>Téléphone</th>
                            <th>Commune</th>
                            <th>Rôle</th>
                            <th>Date inscription</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            `;
            
            AdminState.users = response.users;
        } else {
            throw new Error('Aucun utilisateur trouvé ou réponse invalide');
        }
    } catch (error) {
        console.error('Erreur chargement utilisateurs:', error);
        usersContent.innerHTML = '<p style="text-align: center; color: #e74c3c; padding: 40px;">Erreur lors du chargement: ' + error.message + '</p>';
    }
}

// Fonction debounce pour la recherche
let searchTimeout;
function debounceSearch(func, wait) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(func, wait);
}

/**
 * Charge les producteurs
 */
async function loadProducers() {
    const producersContent = document.getElementById('producteursContent');
    if (!producersContent) return;
    
    producersContent.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 40px;">Chargement des producteurs...</p>';
    
    try {
        const response = await AgriConnectAPI.getAllProducers();
        
        if (response.status === 'success' && response.producers) {
            producersContent.innerHTML = `
                <div style="margin-bottom: 20px;">
                    <span style="color: #7f8c8d;">Total: ${response.total} producteurs</span>
                </div>
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Nom</th>
                            <th>Email</th>
                            <th>Exploitation</th>
                            <th>Commune</th>
                            <th>Produits</th>
                            <th>Stock total</th>
                            <th>Commandes</th>
                            <th>CA</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${response.producers.map(prod => `
                            <tr>
                                <td>${prod.prenom} ${prod.nom}</td>
                                <td>${prod.email}</td>
                                <td>${prod.nom_exploitation || 'N/A'}</td>
                                <td>${prod.commune || 'N/A'}</td>
                                <td>${prod.nb_produits || 0} (${prod.produits_actifs || 0} actifs)</td>
                                <td>${prod.stock_total || 0} kg</td>
                                <td>${prod.nb_commandes || 0}</td>
                                <td>${(parseFloat(prod.chiffre_affaires || 0)).toLocaleString('fr-FR')} FCFA</td>
                                <td>
                                    <button class="btn-admin btn-admin-primary" onclick="viewProducer('${prod.id}')">Voir</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            
            AdminState.producers = response.producers;
        } else {
            throw new Error('Erreur lors du chargement des producteurs');
        }
    } catch (error) {
        console.error('Erreur chargement producteurs:', error);
        producersContent.innerHTML = '<p style="text-align: center; color: #e74c3c; padding: 40px;">Erreur: ' + error.message + '</p>';
    }
}

/**
 * Charge les livreurs
 */
async function loadLivreurs() {
    const livreursContent = document.getElementById('livreursContent');
    if (!livreursContent) return;
    
    livreursContent.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 40px;">Chargement des livreurs...</p>';
    
    try {
        const response = await AgriConnectAPI.getAllLivreurs();
        
        if (response.status === 'success' && response.livreurs) {
            livreursContent.innerHTML = `
                <div style="margin-bottom: 20px;">
                    <span style="color: #7f8c8d;">Total: ${response.total} livreurs</span>
                </div>
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Nom</th>
                            <th>Email</th>
                            <th>Téléphone</th>
                            <th>Commune</th>
                            <th>Livraisons</th>
                            <th>Terminées</th>
                            <th>En cours</th>
                            <th>Dernière livraison</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${response.livreurs.map(livreur => `
                            <tr>
                                <td>${livreur.prenom} ${livreur.nom}</td>
                                <td>${livreur.email}</td>
                                <td>${livreur.telephone || 'N/A'}</td>
                                <td>${livreur.commune || 'N/A'}</td>
                                <td>${livreur.nb_livraisons || 0}</td>
                                <td>${livreur.livraisons_terminees || 0}</td>
                                <td>${livreur.livraisons_en_cours || 0}</td>
                                <td>${livreur.derniere_livraison ? new Date(livreur.derniere_livraison).toLocaleDateString('fr-FR') : 'Jamais'}</td>
                                <td>
                                    <button class="btn-admin btn-admin-primary" onclick="viewLivreur('${livreur.id}')">Voir</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            
            AdminState.livreurs = response.livreurs;
        } else {
            throw new Error('Erreur lors du chargement des livreurs');
        }
    } catch (error) {
        console.error('Erreur chargement livreurs:', error);
        livreursContent.innerHTML = '<p style="text-align: center; color: #e74c3c; padding: 40px;">Erreur: ' + error.message + '</p>';
    }
}

/**
 * Charge les acheteurs
 */
async function loadBuyers() {
    const buyersContent = document.getElementById('acheteursContent');
    if (!buyersContent) return;
    
    buyersContent.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 40px;">Chargement des acheteurs...</p>';
    
    try {
        const response = await AgriConnectAPI.getAllBuyers();
        
        if (response.status === 'success' && response.buyers) {
            buyersContent.innerHTML = `
                <div style="margin-bottom: 20px;">
                    <span style="color: #7f8c8d;">Total: ${response.total} acheteurs</span>
                </div>
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Nom</th>
                            <th>Email</th>
                            <th>Téléphone</th>
                            <th>Commune</th>
                            <th>Commandes</th>
                            <th>Total dépensé</th>
                            <th>Moyenne</th>
                            <th>Dernière commande</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${response.buyers.map(buyer => `
                            <tr>
                                <td>${buyer.prenom} ${buyer.nom}</td>
                                <td>${buyer.email}</td>
                                <td>${buyer.telephone || 'N/A'}</td>
                                <td>${buyer.commune || 'N/A'}</td>
                                <td>${buyer.nb_commandes || 0}</td>
                                <td>${(parseFloat(buyer.total_depense || 0)).toLocaleString('fr-FR')} FCFA</td>
                                <td>${Math.round(parseFloat(buyer.moyenne_commande || 0)).toLocaleString('fr-FR')} FCFA</td>
                                <td>${buyer.derniere_commande ? new Date(buyer.derniere_commande).toLocaleDateString('fr-FR') : 'Jamais'}</td>
                                <td>
                                    <button class="btn-admin btn-admin-primary" onclick="viewBuyer('${buyer.id}')">Voir</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            
            AdminState.buyers = response.buyers;
        } else {
            throw new Error('Erreur lors du chargement des acheteurs');
        }
    } catch (error) {
        console.error('Erreur chargement acheteurs:', error);
        buyersContent.innerHTML = '<p style="text-align: center; color: #e74c3c; padding: 40px;">Erreur: ' + error.message + '</p>';
    }
}

/**
 * Charge les commandes
 */
async function loadOrders() {
    const ordersContent = document.getElementById('commandesContent');
    if (!ordersContent) return;
    
    ordersContent.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 40px;">Chargement des commandes...</p>';
    
    try {
        // Utiliser l'API existante
        const response = await AgriConnectAPI.getOrders();
        
        if (response.status === 'success' && response.commandes) {
            ordersContent.innerHTML = `
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Acheteur</th>
                            <th>Total</th>
                            <th>Statut</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${response.commandes.map(cmd => `
                            <tr>
                                <td>#${cmd.id.substring(0, 8)}</td>
                                <td>${cmd.prenom} ${cmd.nom}</td>
                                <td>${cmd.total} FCFA</td>
                                <td><span class="badge badge-${getStatusBadgeClass(cmd.statut)}">${cmd.statut}</span></td>
                                <td>${new Date(cmd.created_at).toLocaleDateString('fr-FR')}</td>
                                <td>
                                    <button class="btn-admin btn-admin-primary" onclick="viewOrder('${cmd.id}')">Voir</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    } catch (error) {
        console.error('Erreur chargement commandes:', error);
    }
}

/**
 * Charge les notifications
 */
async function loadNotifications() {
    const notificationsContent = document.getElementById('notificationsContent');
    if (!notificationsContent) return;
    
    notificationsContent.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 40px;">Chargement des notifications...</p>';
    
    try {
        const response = await AgriConnectAPI.getAllNotifications({ limit: 100 });
        
        if (response.status === 'success' && response.notifications) {
            // Mettre à jour le badge
            const notificationsBadge = document.getElementById('notificationsBadge');
            if (notificationsBadge && response.non_lues > 0) {
                notificationsBadge.textContent = response.non_lues;
                notificationsBadge.style.display = 'inline-flex';
            } else if (notificationsBadge) {
                notificationsBadge.style.display = 'none';
            }
            
            // Définir les icônes et couleurs selon le type
            const typeConfig = {
                'COMMANDE': { icon: '📦', color: '#3498db', bg: '#e3f2fd' },
                'PAIEMENT': { icon: '💰', color: '#27ae60', bg: '#e8f5e9' },
                'LIVRAISON': { icon: '🚚', color: '#f39c12', bg: '#fff3e0' },
                'PRODUIT': { icon: '🍅', color: '#e74c3c', bg: '#ffebee' },
                'PRODUCTEUR': { icon: '👨‍🌾', color: '#2ecc71', bg: '#e8f5e9' },
                'LIVREUR': { icon: '🚚', color: '#9b59b6', bg: '#f3e5f5' },
                'UTILISATEUR': { icon: '👤', color: '#3498db', bg: '#e3f2fd' },
                'SYSTEME': { icon: '⚙️', color: '#7f8c8d', bg: '#f5f5f5' }
            };
            
            notificationsContent.innerHTML = `
                <div class="admin-filters">
                    <select class="admin-filter" id="filterNotifType" onchange="loadNotifications()">
                        <option value="">Tous les types</option>
                        <option value="COMMANDE">Commandes</option>
                        <option value="PAIEMENT">Paiements</option>
                        <option value="LIVRAISON">Livraisons</option>
                        <option value="PRODUIT">Produits</option>
                        <option value="PRODUCTEUR">Producteurs</option>
                        <option value="LIVREUR">Livreurs</option>
                        <option value="UTILISATEUR">Utilisateurs</option>
                        <option value="SYSTEME">Système</option>
                    </select>
                    <span style="color: #7f8c8d; margin-left: 15px;">Total: ${response.total} notifications (${response.non_lues} non lues)</span>
                </div>
                <div style="margin-top: 20px;">
                    ${response.notifications.map(notif => {
                        const config = typeConfig[notif.type] || typeConfig['SYSTEME'];
                        return `
                        <div class="notification-item" style="background: ${notif.is_lu ? 'white' : config.bg}; border-left: 4px solid ${notif.is_lu ? '#e1e8ed' : config.color}; padding: 15px; margin-bottom: 10px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <div style="display: flex; justify-content: space-between; align-items: start;">
                                <div style="flex: 1;">
                                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                                        <span style="font-size: 1.5rem;">${config.icon}</span>
                                        <strong style="color: #2d5016; font-size: 1.1rem;">${notif.titre}</strong>
                                        ${!notif.is_lu ? '<span style="background: #e74c3c; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.75rem; font-weight: bold;">Nouveau</span>' : ''}
                                    </div>
                                    <p style="margin: 5px 0; color: #5d6d7e; line-height: 1.6;">${notif.message}</p>
                                    <div style="font-size: 0.85rem; color: #7f8c8d; margin-top: 8px;">
                                        ${notif.prenom && notif.nom ? `${notif.prenom} ${notif.nom} (${notif.role || 'N/A'})` : 'Système'} - ${new Date(notif.created_at).toLocaleString('fr-FR')}
                                    </div>
                                </div>
                                <div style="display: flex; flex-direction: column; gap: 5px; margin-left: 15px;">
                                    <span class="badge badge-${notif.is_lu ? 'success' : 'warning'}">${notif.is_lu ? 'Lu' : 'Non lu'}</span>
                                    <span class="badge badge-info" style="background: ${config.color}; color: white;">${notif.type}</span>
                                </div>
                            </div>
                        </div>
                    `;
                    }).join('')}
                </div>
            `;
            
            AdminState.notifications = response.notifications;
        } else {
            throw new Error('Erreur lors du chargement des notifications');
        }
    } catch (error) {
        console.error('Erreur chargement notifications:', error);
        notificationsContent.innerHTML = '<p style="text-align: center; color: #e74c3c; padding: 40px;">Erreur: ' + error.message + '</p>';
    }
}

/**
 * Charge les messages/plaintes
 */
async function loadMessages() {
    const messagesContent = document.getElementById('messagesContent');
    if (!messagesContent) return;
    
    messagesContent.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 40px;">Chargement des messages...</p>';
    
    try {
        const userData = JSON.parse(localStorage.getItem('agriConnect_user'));
        if (!userData) {
            messagesContent.innerHTML = '<p style="text-align: center; color: #e74c3c; padding: 40px;">Erreur: Utilisateur non trouvé</p>';
            return;
        }
        
        // Récupérer tous les messages reçus par l'admin
        const response = await AgriConnectAPI.getReceivedMessages(userData.id);
        
        if (response.status !== 'success') {
            messagesContent.innerHTML = '<p style="text-align: center; color: #e74c3c; padding: 40px;">Erreur lors du chargement des messages</p>';
            return;
        }
        
        const messages = response.messages || [];
        
        if (messages.length === 0) {
            messagesContent.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;">💬</div>
                    <p style="color: #7f8c8d; font-size: 1.1rem;">Aucun message reçu</p>
                </div>
            `;
            return;
        }
        
        // Charger tous les utilisateurs une seule fois
        const usersResponse = await AgriConnectAPI.getAllUsers();
        const allUsers = usersResponse.users || [];
        
        // Grouper les messages par rôle de l'expéditeur
        const messagesByRole = {
            'PRODUCTEUR': [],
            'ACHETEUR': [],
            'LIVREUR': []
        };
        
        // Grouper les messages
        for (let msg of messages) {
            // Trouver le rôle de l'expéditeur
            const sender = allUsers.find(u => u.id == msg.sender_id);
            
            if (sender && messagesByRole[sender.role]) {
                messagesByRole[sender.role].push({...msg, sender_role: sender.role});
            }
        }
        
        // Construire l'HTML
        let html = `
            <div class="section-header" style="margin-bottom: 20px;">
                <h2>Messages reçus des utilisateurs</h2>
            </div>
        `;
        
        // Producteurs
        if (messagesByRole['PRODUCTEUR'].length > 0) {
            html += `
                <div style="margin-bottom: 30px;">
                    <h3 style="color: #2d5016; padding-bottom: 10px; border-bottom: 2px solid #4a7c3a; margin-bottom: 15px;">
                        🌾 Messages des Producteurs (${messagesByRole['PRODUCTEUR'].length})
                    </h3>
                    <div>
                        ${messagesByRole['PRODUCTEUR'].map((msg, idx) => `
                            <div style="background: white; padding: 15px; margin-bottom: 10px; border-left: 4px solid #4a7c3a; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                                    <strong style="color: #2d5016; font-size: 1rem;">${msg.sender_name}</strong>
                                    <span style="font-size: 0.85rem; color: #7f8c8d;">${new Date(msg.created_at).toLocaleString('fr-FR')}</span>
                                </div>
                                <p style="margin: 10px 0; color: #2c3e50; line-height: 1.6;">${msg.message}</p>
                                ${msg.product_id ? '<p style="font-size: 0.85rem; color: #7f8c8d;">📦 Au sujet d\'un produit</p>' : ''}
                                <button class="btn-reply" data-sender-id="${msg.sender_id}" data-sender-name="${msg.sender_name}" data-sender-role="PRODUCTEUR" style="margin-top: 10px; background: #4a7c3a; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-size: 0.9rem;">
                                    ↩️ Répondre
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        // Acheteurs
        if (messagesByRole['ACHETEUR'].length > 0) {
            html += `
                <div style="margin-bottom: 30px;">
                    <h3 style="color: #2980b9; padding-bottom: 10px; border-bottom: 2px solid #3498db; margin-bottom: 15px;">
                        🛒 Messages des Acheteurs (${messagesByRole['ACHETEUR'].length})
                    </h3>
                    <div>
                        ${messagesByRole['ACHETEUR'].map((msg, idx) => `
                            <div style="background: white; padding: 15px; margin-bottom: 10px; border-left: 4px solid #3498db; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                                    <strong style="color: #2980b9; font-size: 1rem;">${msg.sender_name}</strong>
                                    <span style="font-size: 0.85rem; color: #7f8c8d;">${new Date(msg.created_at).toLocaleString('fr-FR')}</span>
                                </div>
                                <p style="margin: 10px 0; color: #2c3e50; line-height: 1.6;">${msg.message}</p>
                                ${msg.product_id ? '<p style="font-size: 0.85rem; color: #7f8c8d;">📦 Au sujet d\'un produit</p>' : ''}
                                <button class="btn-reply" data-sender-id="${msg.sender_id}" data-sender-name="${msg.sender_name}" data-sender-role="ACHETEUR" style="margin-top: 10px; background: #3498db; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-size: 0.9rem;">
                                    ↩️ Répondre
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        // Livreurs
        if (messagesByRole['LIVREUR'].length > 0) {
            html += `
                <div style="margin-bottom: 30px;">
                    <h3 style="color: #e74c3c; padding-bottom: 10px; border-bottom: 2px solid #e74c3c; margin-bottom: 15px;">
                        🚚 Messages des Livreurs (${messagesByRole['LIVREUR'].length})
                    </h3>
                    <div>
                        ${messagesByRole['LIVREUR'].map((msg, idx) => `
                            <div style="background: white; padding: 15px; margin-bottom: 10px; border-left: 4px solid #e74c3c; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                                    <strong style="color: #e74c3c; font-size: 1rem;">${msg.sender_name}</strong>
                                    <span style="font-size: 0.85rem; color: #7f8c8d;">${new Date(msg.created_at).toLocaleString('fr-FR')}</span>
                                </div>
                                <p style="margin: 10px 0; color: #2c3e50; line-height: 1.6;">${msg.message}</p>
                                ${msg.product_id ? '<p style="font-size: 0.85rem; color: #7f8c8d;">📦 Au sujet d\'un produit</p>' : ''}
                                <button class="btn-reply" data-sender-id="${msg.sender_id}" data-sender-name="${msg.sender_name}" data-sender-role="LIVREUR" style="margin-top: 10px; background: #e74c3c; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-size: 0.9rem;">
                                    ↩️ Répondre
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        messagesContent.innerHTML = html;
        
        // Attacher les event listeners aux boutons "Répondre"
        document.querySelectorAll('.btn-reply').forEach(btn => {
            btn.addEventListener('click', function(e) {
                const senderId = this.getAttribute('data-sender-id');
                const senderName = this.getAttribute('data-sender-name');
                const senderRole = this.getAttribute('data-sender-role');
                openReplyModal(senderId, senderName, senderRole);
            });
        });
        
    } catch (error) {
        console.error('Erreur chargement messages:', error);
        messagesContent.innerHTML = `<p style="text-align: center; color: #e74c3c; padding: 40px;">Erreur: ${error.message}</p>`;
    }
}

/**
 * Charge les statistiques détaillées
 */
async function loadStatistics() {
    const statsContent = document.getElementById('statistiquesContent');
    if (!statsContent) return;
    
    statsContent.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 40px;">Chargement des statistiques...</p>';
    
    try {
        // Charger tous les utilisateurs, produits, commandes
        const usersResponse = await AgriConnectAPI.getAllUsers();
        const productsResponse = await AgriConnectAPI.getProducts();
        const ordersResponse = await AgriConnectAPI.getOrders();
        
        const allUsers = usersResponse.users || [];
        const allProducts = productsResponse.produits || [];
        const allOrders = ordersResponse.orders || [];
        
        // Calculer les stats
        const producteurs = allUsers.filter(u => u.role === 'PRODUCTEUR').length;
        const acheteurs = allUsers.filter(u => u.role === 'ACHETEUR').length;
        const livreurs = allUsers.filter(u => u.role === 'LIVREUR').length;
        const totalUtilisateurs = allUsers.length;
        
        const produitsActifs = allProducts.filter(p => p.is_active == 1).length;
        const produitsTotal = allProducts.length;
        
        const commandes = allOrders.length;
        const commandesTotal = allOrders.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0);
        
        // Calculer le panier moyen
        const panierMoyen = commandes > 0 ? (commandesTotal / commandes).toFixed(0) : 0;
        
        statsContent.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px;">
                <!-- Utilisateurs -->
                <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h4 style="color: #2d5016; margin-top: 0;">👥 Utilisateurs Total</h4>
                    <div style="font-size: 2.5rem; font-weight: bold; color: #4a7c3a; margin: 15px 0;">${totalUtilisateurs}</div>
                    <div style="font-size: 0.9rem; color: #7f8c8d;">
                        🌾 Producteurs: ${producteurs}<br>
                        🛒 Acheteurs: ${acheteurs}<br>
                        🚚 Livreurs: ${livreurs}
                    </div>
                </div>
                
                <!-- Produits -->
                <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h4 style="color: #2d5016; margin-top: 0;">🍅 Produits</h4>
                    <div style="font-size: 2.5rem; font-weight: bold; color: #e67e22; margin: 15px 0;">${produitsActifs}</div>
                    <div style="font-size: 0.9rem; color: #7f8c8d;">
                        Actifs: ${produitsActifs}/${produitsTotal}
                    </div>
                </div>
                
                <!-- Commandes -->
                <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h4 style="color: #2d5016; margin-top: 0;">📦 Commandes</h4>
                    <div style="font-size: 2.5rem; font-weight: bold; color: #2980b9; margin: 15px 0;">${commandes}</div>
                    <div style="font-size: 0.9rem; color: #7f8c8d;">
                        Total: ${commandesTotal.toLocaleString('fr-FR')} FCFA
                    </div>
                </div>
                
                <!-- Panier Moyen -->
                <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h4 style="color: #2d5016; margin-top: 0;">💰 Panier Moyen</h4>
                    <div style="font-size: 2.5rem; font-weight: bold; color: #27ae60; margin: 15px 0;">${panierMoyen}</div>
                    <div style="font-size: 0.9rem; color: #7f8c8d;">
                        FCFA par commande
                    </div>
                </div>
            </div>
            
            <!-- Détails par activité -->
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 30px;">
                <h3 style="color: #2d5016; margin-top: 0;">📊 Analyse Détaillée</h3>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                    <div>
                        <h4 style="color: #4a7c3a; margin-top: 0;">Producteurs par commune</h4>
                        <div style="font-size: 0.9rem; color: #7f8c8d;">
                            ${allUsers.filter(u => u.role === 'PRODUCTEUR').length > 0 ? 
                                '<p>✓ ' + producteurs + ' producteurs enregistrés</p>' : 
                                '<p>Aucun producteur enregistré</p>'}
                        </div>
                    </div>
                    
                    <div>
                        <h4 style="color: #2980b9; margin-top: 0;">Taux d'activité</h4>
                        <div style="font-size: 0.9rem; color: #7f8c8d;">
                            ${produitsTotal > 0 ? 
                                '<p>✓ ' + ((produitsActifs/produitsTotal)*100).toFixed(1) + '% des produits actifs</p>' :
                                '<p>Aucun produit en vente</p>'}
                        </div>
                    </div>
                    
                    <div>
                        <h4 style="color: #27ae60; margin-top: 0;">Performance</h4>
                        <div style="font-size: 0.9rem; color: #7f8c8d;">
                            ${commandes > 0 ? 
                                '<p>✓ Plateforme active avec ' + commandes + ' commandes</p>' :
                                '<p>En attente de premières commandes</p>'}
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #4a7c3a;">
                <h4 style="color: #2d5016; margin-top: 0;">ℹ️ Résumé</h4>
                <p style="color: #5d6d7e; line-height: 1.6;">
                    Votre plateforme AgriConnect compte actuellement ${totalUtilisateurs} utilisateurs 
                    (${producteurs} producteurs, ${acheteurs} acheteurs, ${livreurs} livreurs).
                    ${produitsTotal} produits sont en catalogue dont ${produitsActifs} actifs.
                    Un total de ${commandes} commandes ont été passées pour une valeur de 
                    ${commandesTotal.toLocaleString('fr-FR')} FCFA.
                </p>
            </div>
        `;
        
    } catch (error) {
        console.error('Erreur chargement statistiques:', error);
        statsContent.innerHTML = `<p style="text-align: center; color: #e74c3c; padding: 40px;">Erreur: ${error.message}</p>`;
    }
}

/**
 * Charge les paramètres
 */
async function loadSettings() {
    const settingsContent = document.getElementById('parametresContent');
    if (!settingsContent) return;
    
    settingsContent.innerHTML = `
        <div class="admin-card">
            <h3>⚙️ Paramètres de la plateforme</h3>
            <div style="margin-top: 20px;">
                <label style="display: block; margin-bottom: 10px; font-weight: 600; color: #2d5016;">Pourcentage de commission</label>
                <input type="number" id="commissionPourcentage" class="admin-filter" value="5" min="0" max="100" style="width: 200px;">
                <span style="margin-left: 10px;">%</span>
                <p style="color: #7f8c8d; font-size: 0.9rem; margin-top: 5px;">Pourcentage prélevé sur chaque vente</p>
            </div>
            
            <div style="margin-top: 30px;">
                <label style="display: block; margin-bottom: 10px; font-weight: 600; color: #2d5016;">Frais de livraison de base</label>
                <input type="number" id="fraisLivraisonBase" class="admin-filter" value="1000" min="0" style="width: 200px;">
                <span style="margin-left: 10px;">FCFA</span>
                <p style="color: #7f8c8d; font-size: 0.9rem; margin-top: 5px;">Frais de livraison minimum</p>
            </div>
            
            <div style="margin-top: 30px;">
                <label style="display: block; margin-bottom: 10px; font-weight: 600; color: #2d5016;">Stock minimum avant alerte</label>
                <input type="number" id="stockAlerteMinimum" class="admin-filter" value="10" min="0" style="width: 200px;">
                <span style="margin-left: 10px;">kg</span>
                <p style="color: #7f8c8d; font-size: 0.9rem; margin-top: 5px;">Seuil d'alerte pour les stocks faibles</p>
            </div>
            
            <div style="margin-top: 30px;">
                <button style="background: #4a7c3a; color: white; padding: 10px 25px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 1rem;" onclick="saveSettings()">
                    Enregistrer les paramètres
                </button>
            </div>
        </div>
    `;
}

/**
 * Sauvegarde les paramètres
 */
async function saveSettings() {
    try {
        const commission = document.getElementById('commissionPourcentage').value;
        const frais = document.getElementById('fraisLivraisonBase').value;
        const stock = document.getElementById('stockAlerteMinimum').value;
        
        // Sauvegarder en localStorage en attendant une API
        localStorage.setItem('agriConnect_settings', JSON.stringify({
            commission_pourcentage: commission,
            frais_livraison_base: frais,
            stock_alerte_minimum: stock,
            updated_at: new Date().toISOString()
        }));
        
        alert(`✅ Paramètres sauvegardés:\n- Commission: ${commission}%\n- Frais: ${frais} FCFA\n- Stock alerte: ${stock} kg`);
    } catch (error) {
        console.error('Erreur sauvegarde paramètres:', error);
        alert('❌ Erreur lors de l\'enregistrement');
    }
}

/**
 * Configuration de la navigation
 */
function setupNavigation() {
    document.querySelectorAll('.nav-item[data-section]').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            showSection(section);
            
            // Mettre à jour l'état actif
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

/**
 * Affiche une section spécifique
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
    
    // Charger les données selon la section
    switch(sectionId) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'utilisateurs':
            loadUsers();
            break;
        case 'producteurs':
            loadProducers();
            break;
        case 'acheteurs':
            loadBuyers();
            break;
        case 'livreurs':
            loadLivreurs();
            break;
        case 'commandes':
            loadOrders();
            break;
        case 'produits':
            loadProducts();
            break;
        case 'notifications':
            loadNotifications();
            break;
        case 'messages':
            loadMessages();
            break;
        case 'statistiques':
            loadStatistics();
            break;
        case 'parametres':
            loadSettings();
            break;
    }
}

/**
 * Charge les produits
 */
async function loadProducts() {
    const productsContent = document.getElementById('produitsContent');
    if (!productsContent) return;
    
    productsContent.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 40px;">Chargement des produits...</p>';
    
    try {
        const response = await AgriConnectAPI.getProducts();
        
        if (response.status === 'success' && response.produits) {
            productsContent.innerHTML = `
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Nom</th>
                            <th>Producteur</th>
                            <th>Prix</th>
                            <th>Stock</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${response.produits.map(prod => `
                            <tr>
                                <td>${prod.nom}</td>
                                <td>${prod.producteur || 'N/A'}</td>
                                <td>${prod.prix} FCFA</td>
                                <td>${prod.stock || 0} kg</td>
                                <td><span class="badge badge-${prod.is_active ? 'success' : 'danger'}">${prod.is_active ? 'Actif' : 'Inactif'}</span></td>
                                <td>
                                    <button class="btn-admin btn-admin-primary" onclick="viewProduct('${prod.id}')">Voir</button>
                                    <button class="btn-admin btn-admin-danger" onclick="deleteProduct('${prod.id}')">Supprimer</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    } catch (error) {
        console.error('Erreur chargement produits:', error);
    }
}

/**
 * Fonctions utilitaires
 */
function getStatusBadgeClass(status) {
    const statusMap = {
        'EN_ATTENTE': 'warning',
        'CONFIRMEE': 'info',
        'EN_PREPARATION': 'info',
        'EN_LIVRAISON': 'info',
        'LIVREE': 'success',
        'ANNULEE': 'danger'
    };
    return statusMap[status] || 'info';
}

function viewUser(userId) {
    const user = AdminState.users.find(u => u.id === userId);
    if (user) {
        alert(`Utilisateur: ${user.prenom} ${user.nom}\nEmail: ${user.email}\nRôle: ${user.role}\nCommune: ${user.commune || 'N/A'}\nCommandes: ${user.nb_commandes || 0}`);
    } else {
        alert(`Voir utilisateur ${userId}`);
    }
}

function confirmDeleteUser(userId, userName) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${userName}" ?\n\nCette action est irréversible.`)) {
        deleteUser(userId);
    }
}

async function deleteUser(userId) {
    try {
        const response = await AgriConnectAPI.deleteUser(userId);
        
        if (response.status === 'success') {
            alert('✅ Utilisateur supprimé avec succès !');
            loadUsers(); // Recharger la liste
        } else {
            throw new Error(response.message || 'Erreur lors de la suppression');
        }
    } catch (error) {
        console.error('Erreur suppression utilisateur:', error);
        alert('❌ Erreur lors de la suppression: ' + error.message);
    }
}

function viewProducer(producerId) {
    const producer = AdminState.producers.find(p => p.id === producerId);
    if (producer) {
        alert(`Producteur: ${producer.prenom} ${producer.nom}\nExploitation: ${producer.nom_exploitation || 'N/A'}\nProduits: ${producer.nb_produits || 0}\nCommandes: ${producer.nb_commandes || 0}\nCA: ${(parseFloat(producer.chiffre_affaires || 0)).toLocaleString('fr-FR')} FCFA`);
    }
}

function viewBuyer(buyerId) {
    const buyer = AdminState.buyers.find(b => b.id === buyerId);
    if (buyer) {
        alert(`Acheteur: ${buyer.prenom} ${buyer.nom}\nEmail: ${buyer.email}\nCommandes: ${buyer.nb_commandes || 0}\nTotal dépensé: ${(parseFloat(buyer.total_depense || 0)).toLocaleString('fr-FR')} FCFA`);
    }
}

function viewLivreur(livreurId) {
    const livreur = AdminState.livreurs?.find(l => l.id === livreurId);
    if (livreur) {
        alert(`Livreur: ${livreur.prenom} ${livreur.nom}\nEmail: ${livreur.email}\nTéléphone: ${livreur.telephone || 'N/A'}\nCommune: ${livreur.commune || 'N/A'}\nLivraisons totales: ${livreur.nb_livraisons || 0}\nTerminées: ${livreur.livraisons_terminees || 0}\nEn cours: ${livreur.livraisons_en_cours || 0}`);
    }
}

function viewOrder(orderId) {
    alert(`Voir commande ${orderId}`);
}

function viewProduct(productId) {
    const modal = document.getElementById('productModal');
    const content = document.getElementById('productContent');
    
    if (!modal) return;
    
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    content.innerHTML = '<p style="text-align: center; color: #7f8c8d;">Chargement du produit...</p>';
    
    AgriConnectAPI.getProductDetail(productId)
        .then(response => {
            if (response.status === 'success' && response.product) {
                const prod = response.product;
                
                content.innerHTML = `
                    <div style="display: grid; gap: 20px;">
                        <!-- Produit -->
                        <div>
                            <h3 style="color: #2c3e50; margin-bottom: 10px;">📦 ${prod.nom}</h3>
                            
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                                <p><strong>Description:</strong></p>
                                <p style="color: #555; line-height: 1.6;">${prod.description || 'Pas de description'}</p>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                                <div style="background: #e8f5e9; padding: 12px; border-radius: 6px;">
                                    <p style="color: #666; font-size: 12px; margin: 0;">Prix unitaire</p>
                                    <p style="color: #2e7d32; font-size: 18px; font-weight: bold; margin: 5px 0 0 0;">${prod.prix} FCFA</p>
                                </div>
                                <div style="background: #e3f2fd; padding: 12px; border-radius: 6px;">
                                    <p style="color: #666; font-size: 12px; margin: 0;">Stock disponible</p>
                                    <p style="color: #1565c0; font-size: 18px; font-weight: bold; margin: 5px 0 0 0;">${prod.stock} kg</p>
                                </div>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                                <div>
                                    <p style="color: #666; font-size: 12px; margin: 0;">Création</p>
                                    <p style="color: #2c3e50; margin: 5px 0 0 0; font-weight: 500;">${new Date(prod.created_at).toLocaleDateString('fr-FR')}</p>
                                </div>
                                <div>
                                    <p style="color: #666; font-size: 12px; margin: 0;">Statut</p>
                                    <p style="color: ${prod.is_active ? '#2e7d32' : '#c62828'}; margin: 5px 0 0 0; font-weight: 500;">${prod.is_active ? '✅ Actif' : '❌ Inactif'}</p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Producteur -->
                        <div style="border-top: 2px solid #e0e0e0; padding-top: 20px;">
                            <h3 style="color: #2c3e50; margin-bottom: 15px;">👨‍🌾 Producteur</h3>
                            
                            <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                                <p style="margin: 0 0 10px 0;"><strong>Nom:</strong> ${prod.producteur_prenom} ${prod.producteur_nom}</p>
                                <p style="margin: 0 0 10px 0;"><strong>Exploitation:</strong> ${prod.nom_exploitation || 'N/A'}</p>
                                <p style="margin: 0 0 10px 0;"><strong>Commune:</strong> ${prod.producteur_commune || 'N/A'}</p>
                                <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${prod.producteur_email}</p>
                                <p style="margin: 0;"><strong>Téléphone:</strong> ${prod.producteur_telephone || 'N/A'}</p>
                            </div>
                            
                            <div style="margin-bottom: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                <button onclick="contactProducer('${prod.producteur_email}', '${prod.producteur_telephone || ''}')" style="background: #4a7c3a; color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-weight: bold;">
                                    ✉️ Email
                                </button>
                                <button onclick="openCatalogueProduct('${prod.id}')" style="background: #1976d2; color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-weight: bold;">
                                    📖 Catalogue
                                </button>
                            </div>
                            
                            <!-- Formulaire de message -->
                            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
                                <h4 style="color: #2c3e50; margin-top: 0; margin-bottom: 12px;">💬 Envoyer un message</h4>
                                <textarea id="messageText" placeholder="Écrivez votre message..." style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-family: Arial; font-size: 14px; resize: vertical; min-height: 80px; box-sizing: border-box;"></textarea>
                                <button onclick="sendMessageToProducer('${prod.user_id}', '${prod.producteur_prenom} ${prod.producteur_nom}', '${prod.id}')" style="width: 100%; background: #ff9800; color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-weight: bold; margin-top: 10px;">
                                    📨 Envoyer le message
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                content.innerHTML = '<p style="color: #e74c3c; text-align: center;">Erreur: ' + (response.message || 'Produit non trouvé') + '</p>';
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            content.innerHTML = '<p style="color: #e74c3c; text-align: center;">Erreur lors du chargement: ' + error.message + '</p>';
        });
}

function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function contactProducer(email, phone) {
    if (!email) {
        alert('Email non disponible');
        return;
    }
    
    let message = `Contacter le producteur:\n\n`;
    message += `📧 Email: ${email}\n`;
    if (phone) {
        message += `📱 Téléphone: ${phone}\n`;
    }
    message += `\nVoulez-vous envoyer un email?`;
    
    if (confirm(message)) {
        window.location.href = `mailto:${email}`;
    }
}

function openCatalogueProduct(productId) {
    // Ouvrir le catalogue et chercher le produit
    window.open(`../../catalogue.html?product=${productId}`, '_blank');
}

function sendMessageToProducer(producerId, producerName, productId) {
    const messageText = document.getElementById('messageText');
    if (!messageText) {
        alert('Erreur: formulaire de message non trouvé');
        return;
    }
    
    const message = messageText.value.trim();
    if (!message) {
        alert('Veuillez écrire un message');
        return;
    }
    
    // Récupérer les données de l'admin depuis le localStorage
    let adminData = {};
    try {
        const userData = JSON.parse(localStorage.getItem('agriConnect_user'));
        if (userData) {
            adminData = {
                id: userData.id,
                name: `${userData.prenom} ${userData.nom}`
            };
        }
    } catch (e) {
        console.log('Impossible de récupérer les données admin');
    }
    
    const messageData = {
        sender_id: adminData.id || null,
        sender_name: adminData.name || 'Administrateur',
        recipient_id: producerId,
        sujet: `Message concernant le produit`,
        message: message,
        product_id: productId
    };
    
    // Désactiver le bouton pendant l'envoi
    const sendButton = event.target;
    sendButton.disabled = true;
    sendButton.style.opacity = '0.6';
    const originalText = sendButton.textContent;
    sendButton.textContent = '⏳ Envoi en cours...';
    
    AgriConnectAPI.sendMessageToProducer(messageData)
        .then(response => {
            if (response.status === 'success') {
                alert('✅ ' + response.message);
                messageText.value = '';
                sendButton.textContent = originalText;
                sendButton.disabled = false;
                sendButton.style.opacity = '1';
            } else {
                throw new Error(response.message || 'Erreur lors de l\'envoi');
            }
        })
        .catch(error => {
            console.error('Erreur envoi message:', error);
            alert('❌ Erreur lors de l\'envoi: ' + error.message);
            sendButton.textContent = originalText;
            sendButton.disabled = false;
            sendButton.style.opacity = '1';
        });
}

function deleteProduct(productId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
        alert(`Suppression produit ${productId}`);
    }
}

async function markMessageRead(messageId) {
    try {
        const response = await AgriConnectAPI.markMessageRead(messageId);
        
        if (response.status === 'success') {
            loadMessages(); // Recharger la liste
        } else {
            throw new Error(response.message || 'Erreur lors du marquage');
        }
    } catch (error) {
        console.error('Erreur marquage message:', error);
        alert('❌ Erreur: ' + error.message);
    }
}

function redirectToDashboard(role) {
    const dashboardMap = {
        'ACHETEUR': 'acheteur.html',
        'PRODUCTEUR': 'producteur.html',
        'LIVREUR': 'livreur.html'
    };
    
    const dashboard = dashboardMap[role] || 'acheteur.html';
    window.location.href = dashboard;
}

/**
 * Ouvre une modal pour répondre à un message
 */
function openReplyModal(senderId, senderName, senderRole) {
    const modal = document.createElement('div');
    modal.id = `replyModal_${senderId}`;
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
    
    const container = document.createElement('div');
    container.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 30px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    `;
    
    container.innerHTML = `
        <h2 style="color: #2d5016; margin-top: 0;">Répondre à ${senderName}</h2>
        <p style="color: #7f8c8d; margin-bottom: 20px;">Rôle: <strong>${senderRole}</strong></p>
        <textarea id="replyText_${senderId}" placeholder="Écrivez votre réponse..." style="width: 100%; height: 150px; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-family: Arial; font-size: 14px; box-sizing: border-box; resize: vertical;"></textarea>
        <div style="display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end;">
            <button id="cancelBtn_${senderId}" style="background: #e0e0e0; color: #333; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold;">
                Annuler
            </button>
            <button id="sendBtn_${senderId}" style="background: #4a7c3a; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold;">
                ✓ Envoyer
            </button>
        </div>
    `;
    
    modal.appendChild(container);
    document.body.appendChild(modal);
    
    // Attacher les événements
    document.getElementById(`cancelBtn_${senderId}`).addEventListener('click', function() {
        closeReplyModal(senderId);
    });
    
    document.getElementById(`sendBtn_${senderId}`).addEventListener('click', function() {
        handleSendReply(senderId, senderName);
    });
    
    // Fermer si click sur le fond
    modal.addEventListener('click', function(e) {
        if (e.target === modal) closeReplyModal(senderId);
    });
}

function closeReplyModal(senderId) {
    const modal = document.getElementById(`replyModal_${senderId}`);
    if (modal) modal.remove();
}

async function handleSendReply(senderId, senderName) {
    const textareaId = `replyText_${senderId}`;
    const textarea = document.getElementById(textareaId);
    const replyText = textarea?.value.trim();
    
    if (!replyText) {
        alert('Veuillez écrire une réponse');
        return;
    }
    
    try {
        const userData = JSON.parse(localStorage.getItem('agriConnect_user'));
        if (!userData) {
            alert('Erreur: utilisateur non connecté');
            return;
        }
        
        const messageData = {
            sender_id: userData.id,
            sender_name: `${userData.prenom} ${userData.nom}`,
            recipient_id: senderId,
            sujet: 'Réponse du système',
            message: replyText,
            product_id: null
        };
        
        console.log('Envoi message:', messageData);
        const response = await AgriConnectAPI.sendMessage(messageData);
        console.log('Réponse API:', response);
        
        if (response && response.status === 'success') {
            alert('✓ Message envoyé avec succès!');
            closeReplyModal(senderId);
            loadMessages();
        } else {
            alert('Erreur: ' + (response?.message || 'Erreur inconnue'));
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur: ' + error.message);
    }
}


function logout() {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
        localStorage.removeItem('agriConnect_user');
        localStorage.removeItem('agriConnect_token');
        window.location.href = '../../index.html';
    }
}

