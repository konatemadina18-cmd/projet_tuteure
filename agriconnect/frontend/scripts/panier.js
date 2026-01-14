// FICHIER : scripts/panier.js
// BUT : Gérer le panier, la livraison et la commande
// NOTE : Cette page nécessite une connexion pour fonctionner

class PanierManager {
    constructor() {
        // Récupérer le panier depuis localStorage (clé: agriConnect_panier)
        this.panier = JSON.parse(localStorage.getItem('agriConnect_panier')) || [];
        this.communeSelectionnee = '';
        this.dateSelectionnee = null;
        this.creneauSelectionne = '';
        this.fraisLivraison = 0;
        this.semaineActuelle = 0; // 0 = cette semaine, 1 = semaine prochaine, etc.
        this.isProcessingOrder = false; // Flag pour empêcher les doubles enregistrements

        console.log('🛒 PanierManager initialisé');
    }

    // Initialiser la page panier
    init() {
        this.afficherPanier();
        this.setupCommuneSelection();
        this.genererCalendrier();
        this.genererCreneaux();
        this.setupValidation();
        this.calculerTotaux();

        console.log('✅ Panier initialisé avec', this.panier.length, 'articles');
    }

    // Afficher les articles du panier (sans images)
    afficherPanier() {
        const articlesList = document.getElementById('articlesList');
        const emptyPanier = document.getElementById('emptyPanier');
        const articlesCount = document.getElementById('articlesCount');

        if (!articlesList) return;

        if (this.panier.length === 0) {
            articlesList.innerHTML = '';
            if (emptyPanier) {
                articlesList.appendChild(emptyPanier);
                emptyPanier.style.display = 'block';
            }
            articlesCount.textContent = '0 articles';
            return;
        }

        // Cacher le message "panier vide"
        if (emptyPanier) emptyPanier.style.display = 'none';

        // Construire la liste — uniquement : nom, kilos, prix/kg, sous-total ligne
        articlesList.innerHTML = this.panier.map(article => {
            const qty = article.quantity || 0;
            const prixKg = parseFloat(article.prix_kg) || 0;
            const sousTotalLigne = prixKg * qty;

            return `
            <div class="article-item simple" data-article-id="${article.id}">
                <div class="article-details-simple">
                    <div class="article-nom">${article.nom}</div>
                    <div class="article-info">
                        <span class="article-quantite">${qty} kg</span>
                        <span class="article-prix">${prixKg.toLocaleString('fr-FR')} FCFA/kg</span>
                        <span class="article-soustotal">${sousTotalLigne.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                </div>
                <div class="article-actions">
                    <button class="qty-btn" onclick="panierManager.modifierQuantite(${article.id}, -1)">-</button>
                    <button class="qty-btn" onclick="panierManager.modifierQuantite(${article.id}, 1)">+</button>
                    <button class="btn-supprimer" onclick="panierManager.supprimerArticle(${article.id})">🗑️ Supprimer</button>
                </div>
            </div>
            `;
        }).join('');

        // Mettre à jour le compteur — on affiche le nombre d'articles distincts et aussi total de kilos
        const totalKilos = this.panier.reduce((sum, a) => sum + (a.quantity || 0), 0);
        const distinctCount = this.panier.length;
        articlesCount.textContent = `${distinctCount} produit(s) • ${totalKilos} kg`;
    }

    // Modifier la quantité d'un article
    modifierQuantite(articleId, changement) {
        // Convertir l'ID en string pour la comparaison
        const articleIdStr = String(articleId);
        const article = this.panier.find(a => String(a.id) === articleIdStr);
        
        if (!article) {
            console.error('Article non trouvé:', articleId);
            return;
        }

        const nouvelleQuantite = (article.quantity || 0) + changement;

        if (nouvelleQuantite < 1) {
            this.supprimerArticle(articleId);
        } else {
            article.quantity = nouvelleQuantite;
            this.sauvegarderPanier();
            this.afficherPanier();
            this.calculerTotaux();
        }
    }

    // Supprimer un article du panier
    supprimerArticle(articleId) {
        // Convertir l'ID en string pour la comparaison
        const articleIdStr = String(articleId);
        if (confirm('Êtes-vous sûr de vouloir supprimer cet article du panier ?')) {
            this.panier = this.panier.filter(a => String(a.id) !== articleIdStr);
            this.sauvegarderPanier();
            this.afficherPanier();
            this.calculerTotaux();
        }
    }

    // Sauvegarder le panier dans le localStorage
    sauvegarderPanier() {
        localStorage.setItem('agriConnect_panier', JSON.stringify(this.panier));
    }

    // Configuration de la sélection de commune
    setupCommuneSelection() {
        const selectCommune = document.getElementById('selectCommune');

        if (!selectCommune) return;

        selectCommune.addEventListener('change', (e) => {
            this.communeSelectionnee = e.target.value;
            this.calculerFraisLivraison();
            this.calculerTotaux();
        });
    }

    // Calculer les frais de livraison selon la commune (laisse tes montants comme demandés)
    calculerFraisLivraison() {
        const fraisParCommune = {
            'Bouaké-Ville': 500,
            'Bounda': 1000,
            'Brobo': 1500,
            'Djébonoua': 1200,
            'Sakassou': 2000,
            'Béoumi': 1800,
            'Botro': 1600
        };

        this.fraisLivraison = fraisParCommune[this.communeSelectionnee] || 0;

        const fraisElement = document.getElementById('fraisLivraison');
        if (fraisElement) fraisElement.textContent = `Frais de livraison: ${this.fraisLivraison} FCFA`;

        const fraisTotalElement = document.getElementById('fraisLivraisonTotal');
        if (fraisTotalElement) fraisTotalElement.textContent = `${this.fraisLivraison} FCFA`;
    }

    // Générer le calendrier des 7 prochains jours
    genererCalendrier() {
        const calendar = document.getElementById('calendar');
        if (!calendar) return;

        const aujourdhui = new Date();
        const debutSemaine = new Date(aujourdhui);

        // Ajuster au début de la semaine (lundi)
        const jour = aujourdhui.getDay();
        const diff = aujourdhui.getDate() - jour + (jour === 0 ? -6 : 1);
        debutSemaine.setDate(diff);

        // Appliquer le décalage de semaine
        debutSemaine.setDate(debutSemaine.getDate() + (this.semaineActuelle * 7));

        // Mettre à jour le titre
        const calendarTitle = document.getElementById('calendarTitle');
        const options = { month: 'long', year: 'numeric' };
        if (calendarTitle) calendarTitle.textContent = debutSemaine.toLocaleDateString('fr-FR', options);

        // En-tête du calendrier (jours de la semaine)
        calendar.innerHTML = `
            <div class="calendar-day">Lun</div>
            <div class="calendar-day">Mar</div>
            <div class="calendar-day">Mer</div>
            <div class="calendar-day">Jeu</div>
            <div class="calendar-day">Ven</div>
            <div class="calendar-day">Sam</div>
            <div class="calendar-day">Dim</div>
        `;

        // Générer les 7 jours de la semaine
        for (let i = 0; i < 7; i++) {
            const date = new Date(debutSemaine);
            date.setDate(debutSemaine.getDate() + i);

            const dateElement = document.createElement('div');
            dateElement.className = 'calendar-date';
            dateElement.textContent = date.getDate();
            dateElement.dataset.date = date.toISOString().split('T')[0];

            // Comparaison sur la date sans l'heure
            const today = new Date();
            today.setHours(0,0,0,0);
            const dateCopy = new Date(date);
            dateCopy.setHours(0,0,0,0);

            if (dateCopy.getTime() === today.getTime()) {
                dateElement.classList.add('today');
            }

            if (dateCopy < today) {
                dateElement.classList.add('disabled');
            } else {
                dateElement.addEventListener('click', () => {
                    this.selectionnerDate(date, dateElement);
                });
            }

            calendar.appendChild(dateElement);
        }

        // Restaurer la sélection de date si elle existe
        if (this.dateSelectionnee) {
            this.restaurerSelectionDate(this.dateSelectionnee);
        }

        // Configuration navigation calendrier
        this.setupNavigationCalendrier();
    }
    
    // Restaurer la sélection de date après régénération du calendrier
    restaurerSelectionDate(date) {
        if (!date) return;
        
        const dateStr = date.toISOString().split('T')[0];
        const dateElement = document.querySelector(`.calendar-date[data-date="${dateStr}"]`);
        
        if (dateElement && !dateElement.classList.contains('disabled')) {
            dateElement.classList.add('selected');
            this.dateSelectionnee = new Date(date.getTime());
            console.log('✅ Date restaurée après régénération:', this.dateSelectionnee.toLocaleDateString('fr-FR'));
        }
    }

    // Configuration navigation calendrier
    setupNavigationCalendrier() {
        const prevWeek = document.getElementById('prevWeek');
        const nextWeek = document.getElementById('nextWeek');

        if (prevWeek) {
            prevWeek.addEventListener('click', () => {
                if (this.semaineActuelle > 0) {
                    // Sauvegarder la date sélectionnée avant de régénérer
                    const dateSaved = this.dateSelectionnee;
                    this.semaineActuelle--;
                    this.genererCalendrier();
                    // Restaurer la sélection après régénération
                    if (dateSaved) {
                        setTimeout(() => this.restaurerSelectionDate(dateSaved), 100);
                    }
                }
            });
        }

        if (nextWeek) {
            nextWeek.addEventListener('click', () => {
                // Sauvegarder la date sélectionnée avant de régénérer
                const dateSaved = this.dateSelectionnee;
                this.semaineActuelle++;
                this.genererCalendrier();
                // Restaurer la sélection après régénération
                if (dateSaved) {
                    setTimeout(() => this.restaurerSelectionDate(dateSaved), 100);
                }
            });
        }
    }
    
    // Restaurer la sélection de date après régénération du calendrier
    restaurerSelectionDate(date) {
        if (!date) return;
        
        const dateStr = date.toISOString().split('T')[0];
        const dateElement = document.querySelector(`.calendar-date[data-date="${dateStr}"]`);
        
        if (dateElement && !dateElement.classList.contains('disabled')) {
            dateElement.classList.add('selected');
            this.dateSelectionnee = new Date(date.getTime());
            console.log('✅ Date restaurée après régénération:', this.dateSelectionnee.toLocaleDateString('fr-FR'));
        }
    }

    // Sélectionner une date
    selectionnerDate(date, element) {
        // Retirer la sélection précédente
        document.querySelectorAll('.calendar-date').forEach(el => {
            el.classList.remove('selected');
        });

        // Ajouter la nouvelle sélection
        element.classList.add('selected');
        // Créer une nouvelle date pour éviter les problèmes de référence
        this.dateSelectionnee = new Date(date.getTime());
        
        // Sauvegarder aussi dans le dataset pour récupération ultérieure
        if (element) {
            element.dataset.date = date.toISOString().split('T')[0];
        }

        console.log('📅 Date sélectionnée:', this.dateSelectionnee.toLocaleDateString('fr-FR'));
        console.log('📅 Date stockée (timestamp):', this.dateSelectionnee.getTime());
        
        // Générer les créneaux quand une date est sélectionnée
        if (this.dateSelectionnee) {
            this.genererCreneaux();
        }
    }

    // Générer les créneaux horaires
    genererCreneaux() {
        const creneauxGrid = document.getElementById('creneauxGrid');
        if (!creneauxGrid) return;

        const creneaux = [
            { heure: '09:00 - 12:00', disponible: true },
            { heure: '12:00 - 14:00', disponible: true },
            { heure: '14:00 - 16:00', disponible: true },
            { heure: '16:00 - 18:00', disponible: true },
            { heure: '18:00 - 20:00', disponible: false }
        ];

        creneauxGrid.innerHTML = creneaux.map(creneau => `
            <button class="creneau-btn ${creneau.disponible ? '' : 'disabled'}" 
                    ${creneau.disponible ? '' : 'disabled'}
                    data-creneau="${creneau.heure}">
                🕒 ${creneau.heure}
                ${!creneau.disponible ? '<br><small>Non disponible</small>' : ''}
            </button>
        `).join('');

        // Gérer la sélection des créneaux
        creneauxGrid.querySelectorAll('.creneau-btn:not(.disabled)').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.creneau-btn').forEach(b => {
                    b.classList.remove('selected');
                });
                e.target.classList.add('selected');
                this.creneauSelectionne = e.target.dataset.creneau;
                console.log('🕒 Créneau sélectionné:', this.creneauSelectionne);
            });
        });
    }

    // Calculer les totaux
    calculerTotaux() {
        const sousTotal = this.panier.reduce((total, article) => {
            return total + ((parseFloat(article.prix_kg) || 0) * (article.quantity || 0));
        }, 0);

        const totalCommande = sousTotal + this.fraisLivraison;

        // Mettre à jour l'affichage
        const sousTotalEl = document.getElementById('sousTotal');
        const totalCommandeEl = document.getElementById('totalCommande');

        if (sousTotalEl) sousTotalEl.textContent = `${parseFloat(sousTotal || 0).toLocaleString('fr-FR')} FCFA`;
        if (totalCommandeEl) totalCommandeEl.textContent = `${parseFloat(totalCommande || 0).toLocaleString('fr-FR')} FCFA`;

        return { sousTotal, totalCommande };
    }

    // Configuration de la validation de commande
    setupValidation() {
        const btnCommander = document.getElementById('btnCommander');
        if (!btnCommander) return;

        btnCommander.addEventListener('click', () => {
            this.validerCommande();
        });
    }

    // Valider la commande - Version simple avec alert/confirm
    async validerCommande() {
        // Empêcher les doubles clics
        if (this.isProcessingOrder) {
            console.log('⏳ Commande déjà en cours de traitement...');
            return;
        }
        
        // Vérifications
        if (this.panier.length === 0) {
            alert('Votre panier est vide');
            return;
        }

        if (!this.communeSelectionnee) {
            alert('Veuillez sélectionner votre commune');
            return;
        }

        // Récupérer la date depuis le DOM
        const selectedDateElement = document.querySelector('.calendar-date.selected');
        if (selectedDateElement && selectedDateElement.dataset.date) {
            const dateStr = selectedDateElement.dataset.date;
            this.dateSelectionnee = new Date(dateStr + 'T00:00:00');
        } else if (!this.dateSelectionnee) {
            alert('Veuillez sélectionner une date de livraison');
            return;
        }

        // Récupérer le créneau depuis le DOM
        const selectedCreneauElement = document.querySelector('.creneau-btn.selected');
        if (selectedCreneauElement && selectedCreneauElement.dataset.creneau) {
            this.creneauSelectionne = selectedCreneauElement.dataset.creneau;
        } else if (!this.creneauSelectionne) {
            alert('Veuillez sélectionner un créneau horaire');
            return;
        }

        // Calculer le total
        const { totalCommande } = this.calculerTotaux();

        // Afficher le récapitulatif avec confirm (boîte native)
        const recap = `RÉCAPITULATIF DE COMMANDE:

📦 Articles: ${this.panier.length} produit(s)
📍 Livraison: ${this.communeSelectionnee}
📅 Date: ${this.dateSelectionnee.toLocaleDateString('fr-FR')}
🕒 Créneau: ${this.creneauSelectionne}
💰 Total: ${parseFloat(totalCommande || 0).toLocaleString('fr-FR')} FCFA

Confirmez-vous cette commande ?`;

        if (!confirm(recap)) {
            return;
        }

        // Marquer comme en cours de traitement
        this.isProcessingOrder = true;
        
        // Désactiver le bouton pour éviter les doubles clics
        const btnCommander = document.getElementById('btnCommander');
        if (btnCommander) {
            btnCommander.disabled = true;
            btnCommander.textContent = '⏳ Traitement en cours...';
        }

        try {
                // Récupérer les données utilisateur
                const userData = JSON.parse(localStorage.getItem('agriConnect_user'));
                if (!userData) {
                    this.isProcessingOrder = false;
                    if (btnCommander) {
                        btnCommander.disabled = false;
                        btnCommander.textContent = 'Commander';
                    }
                    alert('Vous devez être connecté pour passer commande');
                    window.location.href = 'login.html';
                    return;
                }

                // Préparer les items pour l'API
                const items = this.panier.map(item => ({
                    produit_id: item.id,
                    quantite: item.quantity
                }));

                const fraisLivraison = this.fraisLivraison || 0;

                // Créer la commande via l'API
                const orderData = {
                    acheteur_id: userData.id,
                    commune_livraison: this.communeSelectionnee,
                    items: items,
                    frais_livraison: fraisLivraison
                };

                const response = await AgriConnectAPI.createOrder(orderData);

                if (response && response.status === 'success') {
                // Vider le panier
                    this.panier = [];
                    this.sauvegarderPanier();

                const numeroCommande = response.commande && response.commande.numero 
                    ? response.commande.numero 
                    : 'N°' + (response.commande && response.commande.id ? response.commande.id.substring(0, 8) : '');
                
                alert('✅ Commande #' + numeroCommande + ' enregistrée avec succès !');

                // Redirection simple
                const currentPath = window.location.pathname;
                let redirectPath = 'frontend/pages/acheteur.html#commandes';
                
                if (currentPath.includes('/panier.html') && !currentPath.includes('/frontend/pages/')) {
                    redirectPath = 'frontend/pages/acheteur.html#commandes';
                } else if (currentPath.includes('/frontend/pages/panier.html')) {
                    redirectPath = 'acheteur.html#commandes';
                }
                
                window.location.href = redirectPath;

                } else {
                    this.isProcessingOrder = false;
                    if (btnCommander) {
                        btnCommander.disabled = false;
                        btnCommander.textContent = 'Commander';
                    }
                    alert('❌ Erreur: ' + (response && response.message ? response.message : 'Erreur inconnue'));
                }
        } catch (error) {
            console.error('Erreur création commande:', error);
            this.isProcessingOrder = false;
            if (btnCommander) {
                btnCommander.disabled = false;
                btnCommander.textContent = 'Commander';
            }
            alert('❌ Erreur lors de la création de la commande. Veuillez réessayer.');
        }
    }

    // Afficher le récapitulatif de commande élégant (alias)
    afficherModalRecap(totalCommande) {
        return this.afficherRecapCommande(totalCommande);
    }

    // Afficher le récapitulatif de commande élégant
    afficherRecapCommande(totalCommande) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'recap-overlay';
            overlay.innerHTML = `
                <div class="recap-modal">
                    <div class="recap-header">
                        <div class="recap-icon-wrapper">
                            <div class="recap-icon">📦</div>
                        </div>
                        <h2>Récapitulatif de commande</h2>
                        <button class="recap-close" onclick="this.closest('.recap-overlay').remove(); document.dispatchEvent(new CustomEvent('recapCancelled'))" aria-label="Fermer">✕</button>
                    </div>
                    <div class="recap-body">
                        <div class="recap-item">
                            <div class="recap-item-icon">📦</div>
                            <div class="recap-item-content">
                                <span class="recap-label">Articles</span>
                                <span class="recap-value">${this.panier.length} produit(s)</span>
                            </div>
                        </div>
                        <div class="recap-item">
                            <div class="recap-item-icon">📍</div>
                            <div class="recap-item-content">
                                <span class="recap-label">Livraison</span>
                                <span class="recap-value">${this.communeSelectionnee}</span>
                            </div>
                        </div>
                        <div class="recap-item">
                            <div class="recap-item-icon">📅</div>
                            <div class="recap-item-content">
                                <span class="recap-label">Date</span>
                                <span class="recap-value">${this.dateSelectionnee ? this.dateSelectionnee.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Non sélectionnée'}</span>
                            </div>
                        </div>
                        <div class="recap-item">
                            <div class="recap-item-icon">🕒</div>
                            <div class="recap-item-content">
                                <span class="recap-label">Créneau horaire</span>
                                <span class="recap-value">${this.creneauSelectionne || 'Non sélectionné'}</span>
                            </div>
                        </div>
                        <div class="recap-item">
                            <div class="recap-item-icon">💵</div>
                            <div class="recap-item-content">
                                <span class="recap-label">Mode de paiement</span>
                                <span class="recap-value">En espèces à la livraison</span>
                            </div>
                        </div>
                        <div class="recap-divider"></div>
                        <div class="recap-total">
                            <span class="recap-label-total">💰 Total à payer</span>
                            <span class="recap-value-total">${parseFloat(totalCommande || 0).toLocaleString('fr-FR')} FCFA</span>
                        </div>
                    </div>
                    <div class="recap-actions">
                        <button class="btn-recap-cancel" onclick="this.closest('.recap-overlay').remove(); document.dispatchEvent(new CustomEvent('recapCancelled'))">Annuler</button>
                        <button class="btn-recap-confirm" onclick="this.closest('.recap-overlay').remove(); document.dispatchEvent(new CustomEvent('recapConfirmed'))">Confirmer la commande</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            
            // Animation d'apparition
            setTimeout(() => overlay.classList.add('show'), 10);
            
            // Gérer les événements
            overlay.addEventListener('recapConfirmed', () => {
                overlay.classList.remove('show');
                setTimeout(() => {
                    if (overlay.parentNode) overlay.remove();
                    resolve(true);
                }, 300);
            });
            
            overlay.addEventListener('recapCancelled', () => {
                overlay.classList.remove('show');
                setTimeout(() => {
                    if (overlay.parentNode) overlay.remove();
                    resolve(false);
                }, 300);
            });
            
            // Fermer en cliquant sur l'overlay
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.classList.remove('show');
                    setTimeout(() => {
                        if (overlay.parentNode) overlay.remove();
                        resolve(false);
                    }, 300);
                }
            });
        });
    }

    // Fonctions d'affichage élégantes
    showSuccess(message, redirectCallback = null) {
        console.log('🎉 showSuccess appelé avec message:', message);
        
        // Retirer tous les overlays existants
        document.querySelectorAll('.panier-notification-overlay').forEach(el => el.remove());
        
        const overlay = document.createElement('div');
        overlay.className = 'panier-notification-overlay';
        overlay.innerHTML = `
            <div class="panier-notification-content success">
                <div class="panier-success-icon">
                    <svg class="panier-check-circle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10" class="panier-circle-bg"></circle>
                        <path d="M9 12l2 2 4-4" class="panier-check-path"></path>
                    </svg>
                </div>
                <p class="panier-notification-text">${message}</p>
            </div>
        `;
        document.body.appendChild(overlay);
        
        console.log('✅ Overlay créé et ajouté au DOM');
        
        setTimeout(() => {
            overlay.classList.add('show');
            console.log('✅ Classe "show" ajoutée');
        }, 10);
        
        setTimeout(() => {
            const checkPath = overlay.querySelector('.panier-check-path');
            const circleBg = overlay.querySelector('.panier-circle-bg');
            if (checkPath && circleBg) {
                checkPath.style.strokeDasharray = checkPath.getTotalLength();
                checkPath.style.strokeDashoffset = checkPath.getTotalLength();
                checkPath.style.animation = 'panier-checkDraw 0.5s ease forwards 0.3s';
                circleBg.style.animation = 'panier-circleFill 0.5s ease forwards';
                console.log('✅ Animations démarrées');
            }
        }, 100);
        
        if (redirectCallback) {
            console.log('⏳ Redirection programmée dans 1500ms');
            setTimeout(() => {
                console.log('🔄 Début de la redirection...');
                overlay.classList.remove('show');
                setTimeout(() => {
                    if (overlay.parentNode) {
                        overlay.remove();
                    }
                    console.log('📍 Appel du callback de redirection');
                    redirectCallback();
                }, 300);
            }, 1500);
        } else {
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.classList.remove('show');
                    setTimeout(() => overlay.remove(), 300);
                }
            }, 2000);
        }
    }

    showLoading(message = 'Chargement...') {
        // Retirer tous les loaders existants
        document.querySelectorAll('.panier-loading-overlay').forEach(el => el.remove());
        
        const overlay = document.createElement('div');
        overlay.className = 'panier-loading-overlay';
        overlay.innerHTML = `
            <div class="panier-loading-content">
                <div class="panier-spinner"></div>
                <p class="panier-loading-text">${message}</p>
            </div>
        `;
        document.body.appendChild(overlay);
        
        setTimeout(() => overlay.classList.add('show'), 10);
    }

    hideLoading() {
        document.querySelectorAll('.panier-loading-overlay').forEach(el => {
            el.classList.remove('show');
            setTimeout(() => el.remove(), 300);
        });
    }

    showError(message) {
        // Cacher le loader s'il existe
        this.hideLoading();
        
        // Retirer tous les overlays existants
        document.querySelectorAll('.panier-notification-overlay').forEach(el => el.remove());
        
        const overlay = document.createElement('div');
        overlay.className = 'panier-notification-overlay';
        overlay.innerHTML = `
            <div class="panier-notification-content error">
                <div class="panier-error-icon">⚠️</div>
                <p class="panier-notification-text">${message}</p>
                <button class="panier-notification-close" onclick="this.closest('.panier-notification-overlay').remove()">OK</button>
            </div>
        `;
        document.body.appendChild(overlay);
        
        setTimeout(() => overlay.classList.add('show'), 10);
        
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.classList.remove('show');
                setTimeout(() => overlay.remove(), 300);
            }
        }, 8000); // Augmenté à 8 secondes pour laisser le temps de lire
    }

    // Obtenir l'emoji d'un produit (inutilisé ici mais conservé)
    getProductEmoji(productName) {
        const emojiMap = {
            'Tomates': '🍅',
            'Oignons': '🧅',
            'Riz': '🌾',
            'Igname': '🍠',
            'Piments': '🌶️',
            'Bananes': '🍌',
            'Manioc': '🥔',
            'Maïs': '🌽',
            'Mil': '🌾',
            'Haricot': '🫘',
            'Patate douce': '🍠',
            'Gombo': '🥬',
            'Aubergine': '🍆',
            'Chou': '🥬',
            'Graine': '🫒',
            'Carotte': '🥕'
        };

        for (const [key, emoji] of Object.entries(emojiMap)) {
            if (productName.toLowerCase().includes(key.toLowerCase())) return emoji;
        }
        return '🌱';
    }
}

// Initialisation du gestionnaire de panier (global pour que les onclick dans le HTML fonctionnent)
const panierManager = new PanierManager();

// Au chargement de la page : on initialise
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Page panier chargée');

    // Vérifier la connexion (si ta fonction requireAuth existe)
    if (typeof requireAuth === 'function' && !requireAuth()) {
        return;
    }

    panierManager.init();

    // Mettre à jour l'interface utilisateur si fonctions disponibles
    if (typeof updateUIForAuthState === 'function') {
        updateUIForAuthState();
    } else if (typeof updateAuthUI === 'function') {
        updateAuthUI();
    }
});
