// FICHIER : scripts/livreur.js
// BUT : Gérer le dashboard livreur

console.log('📦 Chargement du script livreur...');

class DashboardLivreur {
    constructor() {
        console.log('🚀 Constructeur DashboardLivreur appelé');
        this.livraisons = [];
        this.stats = {
            livraisonsDuJour: 0,
            livraisonsTerminees: 0,
            gainsMois: 0,
            noteMoyenne: 0
        };
    }
    
    init() {
        console.log('🎯 Initialisation dashboard livreur...');
        
        // Vérifier l'authentification
        if (!this.checkAuth()) {
            console.log('❌ Authentification échouée');
            return;
        }
        
        console.log('✅ Authentification réussie');
        
        // Charger les données
        this.loadData();
        
        // Afficher les données
        this.renderStats();
        this.renderLivraisonsEnCours();
        this.renderHistorique();
        
        // Charger le profil
        this.loadProfile();
        
        // Charger les messages
        this.loadMessages();
        
        console.log('✅ Dashboard livreur initialisé !');
    }
    
    /**
     * Charge les messages du livreur
     */
    loadMessages() {
        if (typeof loadConversations === 'function') {
            loadConversations();
        } else {
            console.warn('loadConversations n\'est pas disponible. Vérifiez que messaging.js est chargé.');
        }
    }
    
    /**
     * Charge et affiche le profil du livreur
     */
    loadProfile() {
        const profilContent = document.getElementById('profilContent');
        if (!profilContent) return;
        
        try {
            const userData = JSON.parse(localStorage.getItem('agriConnect_user'));
            if (!userData) return;
            
            profilContent.innerHTML = `
                <div class="profil-info" style="background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%); padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); border: 1px solid #e1e8ed;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="width: 100px; height: 100px; background: linear-gradient(135deg, #2d5016 0%, #4a7c3a 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; font-size: 40px; color: white; box-shadow: 0 4px 15px rgba(45, 80, 22, 0.3);">
                            🚚
                        </div>
                        <h2 style="color: #2d5016; margin-bottom: 5px; font-size: 1.8rem;">${userData.prenom} ${userData.nom}</h2>
                        <p style="color: #7f8c8d; margin: 0; font-size: 0.95rem;">Livreur</p>
                    </div>
                    
                    <div style="display: grid; gap: 25px; margin-bottom: 30px;">
                        <div class="info-item" style="background: white; padding: 20px; border-radius: 12px; border-left: 4px solid #4a7c3a; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                            <label style="font-weight: 700; color: #2d5016; display: flex; align-items: center; gap: 10px; margin-bottom: 8px; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">
                                <span>📧</span> Email
                            </label>
                            <p style="margin: 0; color: #2c3e50; font-size: 1.1rem; font-weight: 500;">${userData.email || 'Non spécifié'}</p>
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
                        <button class="btn btn-primary" onclick="editProfileLivreur()" style="flex: 1; min-width: 150px; padding: 12px 20px; font-weight: 600; border-radius: 10px; box-shadow: 0 4px 12px rgba(74, 124, 58, 0.3);">
                            ✏️ Modifier mon profil
                        </button>
                        <button class="btn btn-outline" onclick="changePasswordLivreur()" style="flex: 1; min-width: 150px; padding: 12px 20px; font-weight: 600; border-radius: 10px; border: 2px solid #4a7c3a; color: #4a7c3a;">
                            🔒 Changer mon mot de passe
                        </button>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Erreur chargement profil livreur:', error);
        }
    }
    
    checkAuth() {
        console.log('🔐 Vérification authentification...');
        const userData = localStorage.getItem('agriConnect_user');
        
        if (!userData) {
            console.log('❌ Aucun utilisateur connecté');
            window.location.href = '../../login.html';
            return false;
        }
        
        try {
            const user = JSON.parse(userData);
            console.log('👤 Utilisateur trouvé:', user);
            
            if (user.role !== 'LIVREUR') {
                console.log('❌ Mauvais rôle:', user.role);
                window.location.href = '../../index.html';
                return false;
            }
            
            console.log('✅ Livreur authentifié:', user.prenom);
            return true;
            
        } catch (error) {
            console.error('❌ Erreur parsing user data:', error);
            window.location.href = '../../login.html';
            return false;
        }
    }
    
    loadData() {
        console.log('📥 Chargement des données...');
        
        try {
            // Données simulées
            this.stats = {
                livraisonsDuJour: 5,
                livraisonsTerminees: 12,
                gainsMois: 45000,
                noteMoyenne: 4.8
            };
            
            this.livraisons = [
                {
                    id: 1,
                    client: 'Marie Koné',
                    adresse: 'Kokotenkro, Rue des Jardins',
                    produits: ['Tomates (2kg)', 'Oignons (1kg)', 'Piments (500g)'],
                    montant: 3500,
                    status: 'en-attente',
                    dateLivraison: 'Aujourd\'hui, 14:00',
                    contact: '07 12 34 56 78',
                    note: 'Sonner 3 fois'
                },
                {
                    id: 2,
                    client: 'Jean Traoré',
                    adresse: 'Air France 1, Immeuble Saphir, 3ème étage',
                    produits: ['Bananes plantain (3kg)', 'Manioc (5kg)'],
                    montant: 5200,
                    status: 'en-cours',
                    dateLivraison: 'Aujourd\'hui, 16:30',
                    contact: '05 67 89 10 11',
                    note: 'Appeler avant arrivée'
                }
            ];
            
            console.log('✅ Données chargées:', this.livraisons.length, 'livraisons');
            
        } catch (error) {
            console.error('❌ Erreur chargement données:', error);
        }
    }
    
    renderStats() {
        console.log('📊 Rendu des statistiques...');
        const statsGrid = document.getElementById('statsGrid');
        
        if (!statsGrid) {
            console.error('❌ Élément statsGrid non trouvé');
            return;
        }
        
        statsGrid.innerHTML = `
            <div class="stat-card-livreur primary">
                <div class="stat-icon-livreur">📦</div>
                <div class="stat-content-livreur">
                    <h3>Livraisons du jour</h3>
                    <div class="stat-value-livreur">${this.stats.livraisonsDuJour}</div>
                    <div class="stat-trend-livreur positive">+2 vs hier</div>
                </div>
            </div>
            <div class="stat-card-livreur success">
                <div class="stat-icon-livreur">✅</div>
                <div class="stat-content-livreur">
                    <h3>Livraisons terminées</h3>
                    <div class="stat-value-livreur">${this.stats.livraisonsTerminees}</div>
                    <div class="stat-trend-livreur positive">+5 cette semaine</div>
                </div>
            </div>
            <div class="stat-card-livreur warning">
                <div class="stat-icon-livreur">💰</div>
                <div class="stat-content-livreur">
                    <h3>Gains du mois</h3>
                    <div class="stat-value-livreur">${parseFloat(this.stats.gainsMois || 0).toLocaleString('fr-FR')} FCFA</div>
                    <div class="stat-trend-livreur positive">+12%</div>
                </div>
            </div>
            <div class="stat-card-livreur info">
                <div class="stat-icon-livreur">⭐</div>
                <div class="stat-content-livreur">
                    <h3>Note moyenne</h3>
                    <div class="stat-value-livreur">${this.stats.noteMoyenne}/5</div>
                    <div class="stat-trend-livreur positive">Excellent</div>
                </div>
            </div>
        `;
        
        console.log('✅ Statistiques affichées');
    }
    
    renderLivraisonsEnCours() {
        console.log('📦 Rendu des livraisons...');
        const livraisonsList = document.getElementById('livraisonsList');
        const badgeLivraisons = document.getElementById('badgeLivraisons');
        
        if (!livraisonsList) {
            console.error('❌ Élément livraisonsList non trouvé');
            return;
        }
        
        const livraisonsEnCours = this.livraisons.filter(l => l.status !== 'termine');
        
        // Mettre à jour le badge
        if (badgeLivraisons) {
            badgeLivraisons.textContent = livraisonsEnCours.length;
        }
        
        if (livraisonsEnCours.length === 0) {
            livraisonsList.innerHTML = `
                <div class="empty-state-livreur">
                    <div class="icon">📦</div>
                    <h3>Aucune livraison en cours</h3>
                    <p>Vous n'avez pas de livraisons à effectuer pour le moment.</p>
                    <button class="btn btn-primary" onclick="dashboardLivreur.rafraichir()">
                        🔄 Rafraîchir
                    </button>
                </div>
            `;
            console.log('ℹ️ Aucune livraison en cours');
            return;
        }
        
        livraisonsList.innerHTML = livraisonsEnCours.map(livraison => `
            <div class="livraison-card-livreur ${livraison.status}">
                <div class="livraison-header-livreur">
                    <div class="livraison-info-livreur">
                        <h3>Livraison #${livraison.id}</h3>
                        <p>👤 ${livraison.client}</p>
                    </div>
                    <span class="livraison-status-livreur status-${livraison.status}">
                        ${this.getStatusText(livraison.status)}
                    </span>
                </div>
                
                <div class="livraison-details-livreur">
                    <div class="detail-item-livreur">
                        <span class="detail-label-livreur">📍</span>
                        <span class="detail-value-livreur">${livraison.adresse}</span>
                    </div>
                    <div class="detail-item-livreur">
                        <span class="detail-label-livreur">📞</span>
                        <span class="detail-value-livreur">${livraison.contact}</span>
                    </div>
                    <div class="detail-item-livreur">
                        <span class="detail-label-livreur">🕒</span>
                        <span class="detail-value-livreur">${livraison.dateLivraison}</span>
                    </div>
                    <div class="detail-item-livreur">
                        <span class="detail-label-livreur">💰</span>
                        <span class="detail-value-livreur">${parseFloat(livraison.montant || 0).toLocaleString('fr-FR')} FCFA</span>
                    </div>
                </div>
                
                <div class="produits-list-livreur">
                    <strong>📦 Produits:</strong> ${livraison.produits.join(', ')}
                    ${livraison.note ? `<br><strong>📝 Note:</strong> ${livraison.note}` : ''}
                </div>
                
                <div class="livraison-actions-livreur">
                    ${livraison.status === 'en-attente' ? `
                        <button class="btn btn-primary" onclick="dashboardLivreur.demarrerLivraison(${livraison.id})">
                            🚀 Démarrer
                        </button>
                    ` : ''}
                    ${livraison.status === 'en-cours' ? `
                        <button class="btn btn-success" onclick="dashboardLivreur.terminerLivraison(${livraison.id})">
                            ✅ Terminer
                        </button>
                    ` : ''}
                    <button class="btn btn-outline" onclick="dashboardLivreur.voirDetails(${livraison.id})">
                        👁️ Détails
                    </button>
                    <button class="btn btn-secondary" onclick="dashboardLivreur.contacterClient('${livraison.contact}')">
                        📞 Appeler
                    </button>
                </div>
            </div>
        `).join('');
        
        console.log('✅ Livraisons affichées:', livraisonsEnCours.length);
    }
    
    renderHistorique() {
        console.log('📋 Rendu historique...');
        const historiqueList = document.getElementById('historiqueList');
        
        if (!historiqueList) {
            console.error('❌ Élément historiqueList non trouvé');
            return;
        }
        
        historiqueList.innerHTML = `
            <div class="empty-state-livreur">
                <div class="icon">📋</div>
                <h3>Historique des livraisons</h3>
                <p>Consultez l'historique complet de toutes vos livraisons passées.</p>
                <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
                    <button class="btn btn-primary" onclick="dashboardLivreur.voirHistorique()">
                        📊 Voir l'historique
                    </button>
                    <button class="btn btn-outline" onclick="dashboardLivreur.exporterDonnees()">
                        📄 Exporter
                    </button>
                </div>
            </div>
        `;
        
        console.log('✅ Historique affiché');
    }
    
    getStatusText(status) {
        const statusMap = {
            'en-attente': '⏳ En attente',
            'en-cours': '🚚 En cours',
            'termine': '✅ Terminé'
        };
        return statusMap[status] || status;
    }
    
    demarrerLivraison(livraisonId) {
        console.log('🚀 Démarrage livraison:', livraisonId);
        alert(`🚀 Livraison #${livraisonId} démarrée !`);
        
        // Simulation mise à jour
        const livraison = this.livraisons.find(l => l.id === livraisonId);
        if (livraison) {
            livraison.status = 'en-cours';
            this.renderLivraisonsEnCours();
        }
    }
    
    terminerLivraison(livraisonId) {
        console.log('✅ Fin livraison:', livraisonId);
        alert(`✅ Livraison #${livraisonId} terminée !`);
        
        const livraison = this.livraisons.find(l => l.id === livraisonId);
        if (livraison) {
            livraison.status = 'termine';
            this.renderLivraisonsEnCours();
        }
    }
    
    voirDetails(livraisonId) {
        console.log('🔍 Détails livraison:', livraisonId);
        const livraison = this.livraisons.find(l => l.id === livraisonId);
        if (livraison) {
            alert(`Détails livraison #${livraison.id}\nClient: ${livraison.client}\nAdresse: ${livraison.adresse}`);
        }
    }
    
    contacterClient(telephone) {
        console.log('📞 Appel client:', telephone);
        alert(`📞 Appel vers ${telephone}`);
    }
    
    voirHistorique() {
        console.log('📊 Voir historique');
        alert('Ouverture historique...');
    }
    
    exporterDonnees() {
        console.log('📄 Exporter données');
        alert('Export en cours...');
    }
    
    rafraichir() {
        console.log('🔄 Rafraîchissement...');
        this.loadData();
        this.renderStats();
        this.renderLivraisonsEnCours();
        alert('✅ Données rafraîchies !');
    }
}

// Initialisation globale
console.log('🌍 Initialisation globale...');

// Attendre que le DOM soit chargé
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('📄 DOM chargé - démarrage dashboard...');
        window.dashboardLivreur = new DashboardLivreur();
        window.dashboardLivreur.init();
    });
} else {
    console.log('📄 DOM déjà chargé - démarrage immédiat...');
    window.dashboardLivreur = new DashboardLivreur();
    window.dashboardLivreur.init();
}

// Gestion des erreurs
window.addEventListener('error', function(e) {
    console.error('💥 Erreur globale:', e.error);
});

/**
 * Ouvre le formulaire de modification de profil pour le livreur
 */
function editProfileLivreur() {
    const userData = JSON.parse(localStorage.getItem('agriConnect_user'));
    if (!userData) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'editProfileModal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px;';
    modal.onclick = function(e) {
        if (e.target === modal) closeEditProfileModalLivreur();
    };
    
    modal.innerHTML = `
        <div class="modal-content" onclick="event.stopPropagation();" style="background: white; border-radius: 16px; padding: 30px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 2px solid #e1e8ed; padding-bottom: 15px;">
                <h2 style="color: #2d5016; margin: 0; font-size: 1.8rem;">✏️ Modifier mon profil</h2>
                <button onclick="closeEditProfileModalLivreur()" style="background: none; border: none; font-size: 28px; cursor: pointer; color: #7f8c8d; padding: 0; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: all 0.3s;" 
                        onmouseover="this.style.background='#f0f0f0'; this.style.color='#e74c3c';" 
                        onmouseout="this.style.background='none'; this.style.color='#7f8c8d';">×</button>
            </div>
            
            <form id="editProfileForm" onsubmit="saveProfileLivreur(event); return false;">
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
                    <button type="button" onclick="closeEditProfileModalLivreur()" class="btn btn-outline" style="flex: 1; padding: 12px; font-size: 16px;">
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
function closeEditProfileModalLivreur() {
    const modal = document.getElementById('editProfileModal');
    if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
    }
}

/**
 * Sauvegarde les modifications du profil livreur
 */
async function saveProfileLivreur(event) {
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
            if (window.dashboardLivreur) {
                window.dashboardLivreur.loadProfile();
            }
            
            // Fermer le modal
            closeEditProfileModalLivreur();
            
            // Afficher un message de succès
            showSuccessMessageLivreur('✅ Profil mis à jour avec succès !');
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
function showSuccessMessageLivreur(message) {
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
 * Ouvre le formulaire de changement de mot de passe pour le livreur
 */
function changePasswordLivreur() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'changePasswordModal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px;';
    modal.onclick = function(e) {
        if (e.target === modal) closeChangePasswordModalLivreur();
    };
    
    modal.innerHTML = `
        <div class="modal-content" onclick="event.stopPropagation();" style="background: white; border-radius: 16px; padding: 30px; max-width: 500px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 2px solid #e1e8ed; padding-bottom: 15px;">
                <h2 style="color: #2d5016; margin: 0; font-size: 1.8rem;">🔒 Changer mon mot de passe</h2>
                <button onclick="closeChangePasswordModalLivreur()" style="background: none; border: none; font-size: 28px; cursor: pointer; color: #7f8c8d; padding: 0; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: all 0.3s;" 
                        onmouseover="this.style.background='#f0f0f0'; this.style.color='#e74c3c';" 
                        onmouseout="this.style.background='none'; this.style.color='#7f8c8d';">×</button>
            </div>
            
            <form id="changePasswordForm" onsubmit="savePasswordLivreur(event); return false;">
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
                    <button type="button" onclick="closeChangePasswordModalLivreur()" class="btn btn-outline" style="flex: 1; padding: 12px; font-size: 16px;">
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
function closeChangePasswordModalLivreur() {
    const modal = document.getElementById('changePasswordModal');
    if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
    }
}

/**
 * Sauvegarde le nouveau mot de passe pour le livreur
 */
async function savePasswordLivreur(event) {
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
            closeChangePasswordModalLivreur();
            showSuccessMessageLivreur('✅ Mot de passe modifié avec succès !');
            
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