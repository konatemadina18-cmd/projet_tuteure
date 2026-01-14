// FICHIER : scripts/dashboard-producteur.js
// BUT : Gérer toutes les fonctionnalités du dashboard producteur
// COMME : Le cerveau du dashboard producteur qui contrôle tout

// Test de connexion API au chargement
async function testApiConnection() {
    try {
        const testUrl = window.location.protocol + '//' + window.location.host + '/agriconnect/api/index.php';
        console.log('🔍 Test de connexion API au chargement:', testUrl);
        const response = await fetch(testUrl);
        if (response.ok) {
            console.log('✅ API accessible !');
            return true;
        } else {
            console.warn('⚠️ API répond avec erreur:', response.status);
            return false;
        }
    } catch (error) {
        console.error('❌ API non accessible:', error.message);
        console.error('💡 Vérifiez que:\n' +
                     '  1. Apache est démarré dans XAMPP\n' +
                     '  2. Vous accédez via http://localhost/...\n' +
                     '  3. Le serveur fonctionne correctement');
        return false;
    }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    // Tester la connexion API au démarrage
    testApiConnection();
    console.log('👨‍🌾 Initialisation dashboard producteur...');
    
    // Vérifier l'authentification
    initAuthGuard();
    
    // Charger les informations utilisateur
    loadUserInfo();
    
    // Charger les produits
    loadProducts();
    
    // Charger les commandes
    loadOrders();
    
    // Charger les finances
    loadFinances();
    
    // Charger les messages
    loadMessages();
    
    // Charger le profil
    loadProfile();
    
    // Configuration de la navigation entre sections
    setupNavigation();
    
    console.log('✅ Dashboard producteur initialisé');
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
        
        console.log('👤 Producteur chargé:', userData.prenom, userData.nom);
    }
}

/**
 * Charge et affiche les produits du producteur
 */
async function loadProducts() {
    try {
        const userData = JSON.parse(localStorage.getItem('agriConnect_user'));
        if (!userData) return;
        
        // TODO: Appel API pour récupérer les produits du producteur
        // const response = await AgriConnectAPI.getMyProducts(userData.id);
        
        // Pour l'instant, afficher un message
        const productsSection = document.getElementById('mes-produits');
        if (productsSection) {
            const productsList = productsSection.querySelector('.products-list');
            if (productsList) {
                productsList.innerHTML = `
                    <p style="text-align: center; color: #7f8c8d; padding: 40px;">
                        Aucun produit pour le moment. 
                        <button class="btn btn-primary" onclick="showAddProductModal()">
                            Ajouter un produit
                        </button>
                    </p>
                `;
            }
        }
    } catch (error) {
        console.error('Erreur chargement produits:', error);
    }
}

/**
 * Affiche le modal d'ajout de produit
 */
async function showAddProductModal() {
    const modal = document.getElementById('addProductModal');
    
    if (!modal) {
        console.error('❌ Modal introuvable');
        return;
    }
    
    // Afficher le modal avec flexbox pour centrer
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    
    // Empêcher le scroll du body
    document.body.style.overflow = 'hidden';
    
    // Charger les catégories
    await loadCategories();
    
    // Réinitialiser le formulaire
    const form = document.getElementById('addProductForm');
    if (form) {
        form.reset();
        
        // Réinitialiser l'aperçu de l'image
        removeImagePreview();
        
        // Préremplir la commune avec celle de l'utilisateur
        const userData = JSON.parse(localStorage.getItem('agriConnect_user'));
        if (userData && userData.commune) {
            const communeSelect = document.getElementById('productCommune');
            if (communeSelect) {
                communeSelect.value = userData.commune;
            }
        }
    }
    
    // Gestion de la touche Échap pour fermer le modal
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeAddProductModal();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
    
    // Fermer le modal en cliquant sur le fond (mais pas sur le contenu)
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeAddProductModal();
        }
    });
}

/**
 * Ferme le modal d'ajout de produit
 */
function closeAddProductModal() {
    const modal = document.getElementById('addProductModal');
    
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Réactiver le scroll du body
    document.body.style.overflow = '';
}

/**
 * Charge les catégories disponibles
 */
async function loadCategories() {
    const categorieSelect = document.getElementById('productCategorie');
    if (!categorieSelect) return;
    
    try {
        // Catégories par défaut si l'API n'est pas disponible
        const categoriesDefaut = [
            { id: 'cat_legumes', nom: 'Légumes' },
            { id: 'cat_fruits', nom: 'Fruits' },
            { id: 'cat_cereales', nom: 'Céréales' },
            { id: 'cat_tubercules', nom: 'Tubercules' },
            { id: 'cat_autres', nom: 'Autres' }
        ];
        
        categorieSelect.innerHTML = '<option value="">Sélectionnez une catégorie</option>';
        
        // Pour l'instant, utiliser les catégories par défaut
        // TODO: Charger depuis l'API si disponible
        categoriesDefaut.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.nom;
            categorieSelect.appendChild(option);
        });
        
    } catch (error) {
        console.error('Erreur chargement catégories:', error);
    }
}

/**
 * Gère la sélection d'une image
 */
function handleImageSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Vérifier que c'est une image
    if (!file.type.startsWith('image/')) {
        alert('❌ Veuillez sélectionner un fichier image (jpg, png, etc.)');
        event.target.value = '';
        return;
    }
    
    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('❌ L\'image est trop volumineuse. Veuillez choisir une image de moins de 5MB.');
        event.target.value = '';
        return;
    }
    
    // Afficher l'aperçu
    const reader = new FileReader();
    reader.onload = function(e) {
        const previewDiv = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');
        const fileNameP = document.getElementById('imageFileName');
        
        previewImg.src = e.target.result;
        previewDiv.style.display = 'block';
        fileNameP.textContent = file.name;
    };
    reader.readAsDataURL(file);
}

/**
 * Supprime l'aperçu de l'image
 */
function removeImagePreview() {
    const previewDiv = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    const fileNameP = document.getElementById('imageFileName');
    const imageInput = document.getElementById('productImage');
    
    if (previewDiv) previewDiv.style.display = 'none';
    if (previewImg) previewImg.src = '';
    if (fileNameP) fileNameP.textContent = '';
    if (imageInput) imageInput.value = '';
}

/**
 * Convertit un fichier image en base64
 */
function imageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Gère l'ajout d'un produit
 */
async function handleAddProduct(event) {
    event.preventDefault();
    
    const userData = JSON.parse(localStorage.getItem('agriConnect_user'));
    if (!userData || userData.role !== 'PRODUCTEUR') {
        alert('❌ Vous devez être connecté en tant que producteur pour ajouter un produit.');
        return;
    }
    
    // Récupérer les valeurs du formulaire
    const formData = {
        nom: document.getElementById('productName').value.trim(),
        description: document.getElementById('productDescription').value.trim(),
        prix: parseFloat(document.getElementById('productPrice').value),
        stock: parseInt(document.getElementById('productStock').value),
        unite: document.getElementById('productUnite').value,
        commune: document.getElementById('productCommune').value,
        categorie_id: document.getElementById('productCategorie').value
    };
    
    // Gérer l'image si sélectionnée
    const imageInput = document.getElementById('productImage');
    if (imageInput && imageInput.files && imageInput.files.length > 0) {
        try {
            const imageBase64 = await imageToBase64(imageInput.files[0]);
            formData.image = imageBase64; // Envoyer l'image en base64
            formData.image_name = imageInput.files[0].name; // Nom du fichier original
        } catch (error) {
            console.error('Erreur conversion image:', error);
            alert('❌ Erreur lors de la lecture de l\'image. Veuillez réessayer.');
            return;
        }
    }
    
    // Validation détaillée
    const missingFields = [];
    if (!formData.nom || formData.nom.trim() === '') missingFields.push('Nom du produit');
    if (!formData.prix || isNaN(formData.prix)) missingFields.push('Prix');
    if (formData.stock === null || formData.stock === undefined || isNaN(formData.stock)) missingFields.push('Stock');
    if (!formData.unite) missingFields.push('Unité');
    if (!formData.commune) missingFields.push('Commune');
    if (!formData.categorie_id) missingFields.push('Catégorie');
    
    if (missingFields.length > 0) {
        alert('❌ Veuillez remplir tous les champs obligatoires:\n\n' + missingFields.join('\n'));
        return;
    }
    
    if (formData.prix <= 0 || isNaN(formData.prix)) {
        alert('❌ Le prix doit être supérieur à 0.');
        return;
    }
    
    if (formData.stock < 0 || isNaN(formData.stock)) {
        alert('❌ Le stock ne peut pas être négatif.');
        return;
    }
    
    // Vérifier que les valeurs sont valides
    if (isNaN(formData.prix)) {
        alert('❌ Le prix doit être un nombre valide.');
        return;
    }
    
    if (isNaN(formData.stock)) {
        alert('❌ Le stock doit être un nombre valide.');
        return;
    }
    
    // Récupérer le producteur_id depuis le profil
    try {
        let producteur_id = null;
        
        // Essayer de récupérer depuis le profil utilisateur
        if (userData.profile_producteur && userData.profile_producteur.id) {
            producteur_id = userData.profile_producteur.id;
            console.log('✅ Producteur ID depuis localStorage:', producteur_id);
        } else {
            // Sinon, récupérer depuis l'API
            console.log('📞 Récupération du profil depuis l\'API pour user_id:', userData.id);
            const profileResponse = await AgriConnectAPI.getProfile(userData.id);
            console.log('📥 Réponse profil:', profileResponse);
            
            if (profileResponse && profileResponse.status === 'success' && profileResponse.profile) {
                if (profileResponse.profile.profile_producteur && profileResponse.profile.profile_producteur.id) {
                    producteur_id = profileResponse.profile.profile_producteur.id;
                    console.log('✅ Producteur ID depuis API:', producteur_id);
                    
                    // Sauvegarder dans localStorage pour la prochaine fois
                    if (!userData.profile_producteur) {
                        userData.profile_producteur = profileResponse.profile.profile_producteur;
                        localStorage.setItem('agriConnect_user', JSON.stringify(userData));
                    }
                } else {
                    console.error('❌ Pas de profile_producteur dans la réponse');
                    console.error('Structure profile:', profileResponse.profile);
                }
            } else {
                console.error('❌ Erreur récupération profil:', profileResponse);
            }
        }
        
        if (!producteur_id) {
            console.error('❌ Producteur ID non trouvé. userData:', userData);
            alert('❌ Impossible de récupérer votre profil producteur. Veuillez contacter le support.\n\nVotre rôle: ' + (userData.role || 'non défini'));
            return;
        }
        
        // Ajouter le producteur_id aux données
        formData.producteur_id = producteur_id;
        
        // Log des données envoyées pour déboguer
        console.log('📦 Données à envoyer:', formData);
        console.log('📦 Producteur ID:', producteur_id);
        
        // Désactiver le bouton de soumission
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.textContent : 'Ajouter le produit';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = '⏳ Ajout en cours...';
        }
        
        // Test de connexion d'abord (optionnel mais utile pour diagnostic)
        const apiBase = window.location.protocol + '//' + window.location.host + '/agriconnect/api';
        console.log('🔍 Test de connexion à l\'API:', apiBase);
        
        // Envoyer à l'API
        console.log('📤 Envoi à l\'API create_product...');
        console.log('📤 URL complète:', `${window.location.protocol}//${window.location.host}/agriconnect/api/products/create_product.php`);
        
        const response = await AgriConnectAPI.createProduct(formData);
        console.log('📥 Réponse reçue:', response);
        
        if (response && response.status === 'success') {
            alert('✅ Produit ajouté avec succès ! Il apparaîtra maintenant dans le catalogue.');
            closeAddProductModal();
            
            // Recharger la liste des produits
            loadProducts();
        } else {
            const errorMsg = response && response.message ? response.message : 'Erreur inconnue';
            console.error('❌ Erreur API:', errorMsg);
            alert('❌ Erreur lors de l\'ajout du produit:\n\n' + errorMsg);
        }
        
        // Réactiver le bouton
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
        
    } catch (error) {
        console.error('❌ Erreur ajout produit:', error);
        console.error('❌ Détails erreur:', {
            message: error.message,
            stack: error.stack,
            formData: formData
        });
        
        // Afficher un message d'erreur plus détaillé
        let errorMessage = '❌ Erreur lors de l\'ajout du produit.';
        if (error.message) {
            errorMessage += '\n\nDétails: ' + error.message;
        }
        alert(errorMessage);
        
        // Réactiver le bouton
        const submitBtn = event.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '✅ Ajouter le produit';
        }
    }
}

/**
 * Charge les commandes du producteur
 */
async function loadOrders() {
    const commandesContent = document.getElementById('commandesContent');
    if (!commandesContent) return;
    
    try {
        const userData = JSON.parse(localStorage.getItem('agriConnect_user'));
        if (!userData) return;
        
        // TODO: Appel API pour récupérer les commandes
        // const response = await AgriConnectAPI.getOrders(userData.id, 'PRODUCTEUR');
        
        commandesContent.innerHTML = `
            <p style="text-align: center; color: #7f8c8d; padding: 40px;">
                Aucune commande pour le moment.
            </p>
        `;
    } catch (error) {
        console.error('Erreur chargement commandes:', error);
    }
}

/**
 * Charge les finances du producteur
 */
async function loadFinances() {
    const financesContent = document.getElementById('financesContent');
    if (!financesContent) return;
    
    try {
        const userData = JSON.parse(localStorage.getItem('agriConnect_user'));
        if (!userData) return;
        
        // TODO: Appel API pour récupérer les finances
        // const response = await AgriConnectAPI.getFinances(userData.id);
        
        // Pour l'instant, afficher des valeurs par défaut
        const revenusMois = document.getElementById('revenusMois');
        const revenusTotal = document.getElementById('revenusTotal');
        
        if (revenusMois) revenusMois.textContent = '0 FCFA';
        if (revenusTotal) revenusTotal.textContent = '0 FCFA';
        
    } catch (error) {
        console.error('Erreur chargement finances:', error);
    }
}

/**
 * Charge les messages du producteur
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
    try {
        const userData = JSON.parse(localStorage.getItem('agriConnect_user'));
        if (!userData) return;
        
        const profilContent = document.getElementById('profilContent');
        if (!profilContent) return;
        
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
        
        const profileProducteur = profileData?.profile_producteur || {};
        
        profilContent.innerHTML = `
            <div class="profil-info" style="background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%); padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); border: 1px solid #e1e8ed;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <div style="width: 100px; height: 100px; background: linear-gradient(135deg, #2d5016 0%, #4a7c3a 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; font-size: 40px; color: white; box-shadow: 0 4px 15px rgba(45, 80, 22, 0.3);">
                        👨‍🌾
                    </div>
                    <h2 style="color: #2d5016; margin-bottom: 5px; font-size: 1.8rem;">${userData.prenom} ${userData.nom}</h2>
                    <p style="color: #7f8c8d; margin: 0; font-size: 0.95rem;">Producteur</p>
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
                    
                    ${profileProducteur.nom_exploitation ? `
                    <div class="info-item" style="background: white; padding: 20px; border-radius: 12px; border-left: 4px solid #4a7c3a; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        <label style="font-weight: 700; color: #2d5016; display: flex; align-items: center; gap: 10px; margin-bottom: 8px; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">
                            <span>🏢</span> Nom de l'exploitation
                        </label>
                        <p style="margin: 0; color: #2c3e50; font-size: 1.1rem; font-weight: 500;">${profileProducteur.nom_exploitation}</p>
                    </div>
                    ` : ''}
                    
                    ${profileProducteur.description ? `
                    <div class="info-item" style="background: white; padding: 20px; border-radius: 12px; border-left: 4px solid #4a7c3a; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        <label style="font-weight: 700; color: #2d5016; display: flex; align-items: center; gap: 10px; margin-bottom: 8px; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">
                            <span>📝</span> Description
                        </label>
                        <p style="margin: 0; color: #2c3e50; font-size: 1rem; font-weight: 500; line-height: 1.6;">${profileProducteur.description}</p>
                    </div>
                    ` : ''}
                    
                    ${profileProducteur.annees_experience ? `
                    <div class="info-item" style="background: white; padding: 20px; border-radius: 12px; border-left: 4px solid #4a7c3a; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        <label style="font-weight: 700; color: #2d5016; display: flex; align-items: center; gap: 10px; margin-bottom: 8px; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">
                            <span>⏱️</span> Années d'expérience
                        </label>
                        <p style="margin: 0; color: #2c3e50; font-size: 1.1rem; font-weight: 500;">${profileProducteur.annees_experience} ans</p>
                    </div>
                    ` : ''}
                    
                    ${profileProducteur.adresse ? `
                    <div class="info-item" style="background: white; padding: 20px; border-radius: 12px; border-left: 4px solid #4a7c3a; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        <label style="font-weight: 700; color: #2d5016; display: flex; align-items: center; gap: 10px; margin-bottom: 8px; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">
                            <span>🏠</span> Adresse
                        </label>
                        <p style="margin: 0; color: #2c3e50; font-size: 1.1rem; font-weight: 500;">${profileProducteur.adresse}</p>
                    </div>
                    ` : ''}
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
async function editProfile() {
    const userData = JSON.parse(localStorage.getItem('agriConnect_user'));
    if (!userData) return;
    
    // Charger le profil complet pour avoir les infos producteur
    let profileData = null;
    try {
        const profileResponse = await AgriConnectAPI.getProfile(userData.id);
        if (profileResponse && profileResponse.status === 'success') {
            profileData = profileResponse.profile;
        }
    } catch (error) {
        console.error('Erreur chargement profil:', error);
    }
    
    const profileProducteur = profileData?.profile_producteur || {};
    
    // Créer le modal de modification
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'editProfileModal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px;';
    modal.onclick = function(e) {
        if (e.target === modal) closeEditProfileModal();
    };
    
    modal.innerHTML = `
        <div class="modal-content" onclick="event.stopPropagation();" style="background: white; border-radius: 16px; padding: 30px; max-width: 700px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 2px solid #e1e8ed; padding-bottom: 15px;">
                <h2 style="color: #2d5016; margin: 0; font-size: 1.8rem;">✏️ Modifier mon profil</h2>
                <button onclick="closeEditProfileModal()" style="background: none; border: none; font-size: 28px; cursor: pointer; color: #7f8c8d; padding: 0; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: all 0.3s;" 
                        onmouseover="this.style.background='#f0f0f0'; this.style.color='#e74c3c';" 
                        onmouseout="this.style.background='none'; this.style.color='#7f8c8d';">×</button>
            </div>
            
            <form id="editProfileForm" onsubmit="saveProfile(event); return false;">
                <h3 style="color: #2d5016; margin-bottom: 20px; font-size: 1.3rem; border-bottom: 2px solid #e1e8ed; padding-bottom: 10px;">Informations personnelles</h3>
                <div style="display: grid; gap: 20px; margin-bottom: 30px;">
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
                
                <h3 style="color: #2d5016; margin-bottom: 20px; font-size: 1.3rem; border-bottom: 2px solid #e1e8ed; padding-bottom: 10px; margin-top: 30px;">Informations producteur</h3>
                <div style="display: grid; gap: 20px; margin-bottom: 30px;">
                    <div>
                        <label style="display: block; font-weight: 600; color: #2d5016; margin-bottom: 8px;">Nom de l'exploitation</label>
                        <input type="text" id="editNomExploitation" value="${profileProducteur.nom_exploitation || ''}"
                               placeholder="Ex: Ferme Bio Bounda"
                               style="width: 100%; padding: 12px; border: 2px solid #e1e8ed; border-radius: 8px; font-size: 16px; transition: border-color 0.3s;"
                               onfocus="this.style.borderColor='#4a7c3a';"
                               onblur="this.style.borderColor='#e1e8ed';">
                    </div>
                    
                    <div>
                        <label style="display: block; font-weight: 600; color: #2d5016; margin-bottom: 8px;">Description</label>
                        <textarea id="editDescription" rows="4"
                                  placeholder="Décrivez votre exploitation..."
                                  style="width: 100%; padding: 12px; border: 2px solid #e1e8ed; border-radius: 8px; font-size: 16px; resize: vertical; transition: border-color 0.3s; font-family: inherit;"
                                  onfocus="this.style.borderColor='#4a7c3a';"
                                  onblur="this.style.borderColor='#e1e8ed';">${profileProducteur.description || ''}</textarea>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <label style="display: block; font-weight: 600; color: #2d5016; margin-bottom: 8px;">Années d'expérience</label>
                            <input type="number" id="editAnneesExperience" value="${profileProducteur.annees_experience || ''}" min="0"
                                   placeholder="Ex: 5"
                                   style="width: 100%; padding: 12px; border: 2px solid #e1e8ed; border-radius: 8px; font-size: 16px; transition: border-color 0.3s;"
                                   onfocus="this.style.borderColor='#4a7c3a';"
                                   onblur="this.style.borderColor='#e1e8ed';">
                        </div>
                        <div>
                            <label style="display: block; font-weight: 600; color: #2d5016; margin-bottom: 8px;">Adresse</label>
                            <input type="text" id="editAdresse" value="${profileProducteur.adresse || ''}"
                                   placeholder="Adresse complète"
                                   style="width: 100%; padding: 12px; border: 2px solid #e1e8ed; border-radius: 8px; font-size: 16px; transition: border-color 0.3s;"
                                   onfocus="this.style.borderColor='#4a7c3a';"
                                   onblur="this.style.borderColor='#e1e8ed';">
                        </div>
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
    
    // Ajouter les infos producteur si disponibles
    const nomExploitation = document.getElementById('editNomExploitation')?.value.trim();
    const description = document.getElementById('editDescription')?.value.trim();
    const anneesExperience = document.getElementById('editAnneesExperience')?.value;
    const adresse = document.getElementById('editAdresse')?.value.trim();
    
    if (nomExploitation || description || anneesExperience || adresse) {
        updates.profile_producteur = {};
        if (nomExploitation) updates.profile_producteur.nom_exploitation = nomExploitation;
        if (description) updates.profile_producteur.description = description;
        if (anneesExperience) updates.profile_producteur.annees_experience = parseInt(anneesExperience);
        if (adresse) updates.profile_producteur.adresse = adresse;
    }
    
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
    if (sectionId === 'mes-produits') {
        loadProducts();
    } else if (sectionId === 'commandes') {
        loadOrders();
    } else if (sectionId === 'livraisons') {
        loadLivraisons();
    } else if (sectionId === 'finances') {
        loadFinances();
    } else if (sectionId === 'messages') {
        loadMessages();
    } else if (sectionId === 'mon-profil') {
        loadProfile();
    }
}

/**
 * Charge les livraisons du producteur
 */
async function loadLivraisons() {
    const livraisonsContent = document.getElementById('livraisonsContent');
    if (!livraisonsContent) return;
    
    try {
        const userData = JSON.parse(localStorage.getItem('agriConnect_user'));
        if (!userData) return;
        
        // TODO: Appel API pour récupérer les livraisons
        // const response = await AgriConnectAPI.getLivraisons(userData.id);
        
        livraisonsContent.innerHTML = `
            <p style="text-align: center; color: #7f8c8d; padding: 40px;">
                Aucune livraison en cours.
            </p>
        `;
    } catch (error) {
        console.error('Erreur chargement livraisons:', error);
    }
}

// Fonction globale pour la déconnexion (utilisée par le bouton)
function logout() {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
        // Nettoyer le localStorage
        localStorage.removeItem('agriConnect_user');
        localStorage.removeItem('agriConnect_token');
        localStorage.removeItem('agriConnect_panier');
        localStorage.removeItem('agriConnect_favoris');
        
        // Rediriger vers l'accueil
        window.location.href = '../../index.html';
    }
}

