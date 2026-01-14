// FICHIER : scripts/catalogue.js
// BUT : Gérer l'affichage et la gestion des produits du catalogue
// NOTE : Utilise des produits mockés avec fallback vers l'API si disponible

/**
 * Classe pour gérer le catalogue des produits
 * Gère le chargement, l'affichage, les filtres, les favoris et le panier
 */
class CatalogueManager {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.favorites = JSON.parse(localStorage.getItem('agriConnect_favoris')) || [];
        this.cart = JSON.parse(localStorage.getItem('agriConnect_panier')) || [];
        
        // Chemin de base pour les images des produits
        // NOTE : Les images sont dans frontend/assets/images/produits/
        // Utiliser un chemin relatif depuis catalogue.html qui est dans frontend/
        this.baseImagePath = 'assets/images/produits/';
        
        // Mapping des noms de produits vers les noms de fichiers réels
        this.imageMapping = {
            'Tomates locales': 'tomates.jpg',
            'Oignons violets': 'oignons.jpg',
            'Riz local': 'riz_local.jpg',
            'Igname': 'ignames.jpg',
            'Piments frais': 'piment_frais.jpg',
            'Bananes plantain': 'banane_plantain.jpg',
            'Manioc': 'manioc.jpg',
            'Maïs': 'mais.jpg',
            'Mil': 'mil.jpg',
            'Haricot vert': 'haricot_vert.jpg',
            'Patate douce': 'patate_douce.jpg',
            'Gombo': 'gombo.jpg',
            'Aubergine violette': 'aubergine_violette.jpg',
            'Chou': 'chou.jpg',
            'Graine de palme': 'graine.jpg',
            'Carotte': 'carotte.jpg'
        };
        
        console.log('🛒 CatalogueManager créé');
    }
    
    /**
     * Charge les produits depuis l'API ou utilise les produits mockés
     * Essaie d'abord l'API, puis utilise les produits mockés en fallback
     */
    async loadProducts() {
        try {
            console.log('🔍 Recherche de productsGrid...');
            const productsGrid = document.getElementById('productsGrid');
            
            if (!productsGrid) {
                console.error('❌ productsGrid NON TROUVÉ! Vérifiez l\'ID dans votre HTML');
                return;
            }
            
            productsGrid.innerHTML = '<div class="loading-message">Chargement des produits...</div>';
            
            // Essayer de charger depuis l'API d'abord
            try {
                const searchTerm = document.getElementById('searchInput')?.value || '';
                const commune = document.getElementById('filterCommune')?.value || '';
                const categorie = document.getElementById('filterCategorie')?.value || '';
                
                const filters = {};
                if (searchTerm) filters.search = searchTerm;
                if (commune) filters.commune = commune;
                if (categorie) filters.categorie = categorie;
                
                // Vérifier si l'API est disponible
                if (typeof AgriConnectAPI !== 'undefined') {
                    const response = await AgriConnectAPI.getProducts(filters);
                    
                    if (response.status === 'success' && response.produits && response.produits.length > 0) {
                        // Convertir les produits de l'API au format attendu
                        this.products = response.produits.map(p => {
                            // PRIORITÉ 1: Utiliser l'image de l'API si elle existe et n'est pas vide
                            let imagePath = null;
                            
                            if (p.image && p.image.trim() !== '' && p.image !== 'null') {
                                console.log('📸 Image de l\'API pour', p.nom, ':', p.image);
                                // Si l'image commence par assets/, c'est un chemin local
                                if (p.image.startsWith('assets/')) {
                                    imagePath = p.image;
                                }
                                // Si l'image commence par ./assets/ ou /assets/, corriger le chemin
                                else if (p.image.startsWith('./assets/') || p.image.startsWith('/assets/')) {
                                    imagePath = p.image.replace(/^\.?\//, '');
                                }
                                // Si c'est une URL complète (http://, https://, data:), l'utiliser telle quelle
                                else if (p.image.startsWith('http://') || p.image.startsWith('https://') || p.image.startsWith('data:')) {
                                    imagePath = p.image;
                                }
                                // Sinon, considérer que c'est un nom de fichier et construire le chemin
                                else {
                                    imagePath = this.baseImagePath + p.image;
                                }
                            }
                            
                            // PRIORITÉ 2: Si pas d'image de l'API, essayer le mapping local par nom
                            if (!imagePath && this.imageMapping && this.imageMapping[p.nom]) {
                                imagePath = this.baseImagePath + this.imageMapping[p.nom];
                            }
                            
                            // PRIORITÉ 3: Fallback vers getDefaultImage
                            if (!imagePath) {
                                imagePath = this.getDefaultImage(p.nom);
                            }
                            
                            return {
                                id: p.id,
                                nom: p.nom,
                                categorie: p.categorie || 'Légumes',
                                prix_kg: p.prix || 0,
                                commune: p.commune || 'Bouaké-Ville',
                                producteur: p.producteur || 'Producteur local',
                                producteur_id: p.producteur_id || p.user_id || null, // ID du producteur si disponible
                                stock_kg: p.stock || 0,
                                image: imagePath,
                                description: p.description || 'Produit local de qualité',
                                unite: p.unite || 'kg'
                            };
                        });
                        
                        console.log('✅ Produits chargés depuis l\'API:', this.products.length);
                        console.log('📸 Produits avec images de l\'API:', this.products.filter(p => p.image && !p.image.includes('placeholder') && !p.image.includes('unsplash')).length);
                        this.filteredProducts = [...this.products];
                        this.displayProducts();
                        this.updateCartCounter();
                        return;
                    }
                }
            } catch (apiError) {
                console.warn('⚠️ Erreur API, utilisation des produits mockés:', apiError);
            }
            
            // Fallback : utiliser les produits mockés
            this.loadMockProducts();
            
        } catch (error) {
            console.error('❌ Erreur chargement produits:', error);
            this.loadMockProducts();
        }
    }
    
    /**
     * Charge les produits mockés avec les images locales
     */
    loadMockProducts() {
        console.log('🛠️ Chemin des images:', this.baseImagePath);
        
        this.products = [
            {
                id: 1,
                nom: 'Tomates locales',
                categorie: 'Légumes',
                prix_kg: 800,
                commune: 'Bouaké-Ville',
                producteur: 'Ferme Bio Bouaké',
                stock_kg: 50,
                image: this.baseImagePath + this.imageMapping['Tomates locales'],
                description: 'Tomates rouges et juteuses cultivées localement',
                unite: 'kg'
            },
            {
                id: 1,
                nom: 'Tomates locales',
                categorie: 'Légumes',
                prix_kg: 800,
                commune: 'Bouaké-Ville',
                producteur: 'Ferme Bio Bouaké',
                stock_kg: 50,
                image: this.baseImagePath + this.imageMapping['Tomates locales'],
                description: 'Tomates rouges et juteuses cultivées localement',
                unite: 'kg'
            },
            {
                id: 2,
                nom: 'Oignons violets',
                categorie: 'Légumes',
                prix_kg: 1200,
                commune: 'Bounda',
                producteur: 'Exploitation Bounda',
                stock_kg: 30,
                image: this.baseImagePath + this.imageMapping['Oignons violets'],
                description: 'Oignons violets parfumés',
                unite: 'kg'
            },
            {
                id: 3,
                nom: 'Riz local',
                categorie: 'Céréales',
                prix_kg: 600,
                commune: 'Brobo',
                producteur: 'Rizière Brobo',
                stock_kg: 100,
                image: this.baseImagePath + this.imageMapping['Riz local'],
                description: 'Riz de qualité supérieure',
                unite: 'kg'
            },
            {
                id: 4,
                nom: 'Igname',
                categorie: 'Tubercules',
                prix_kg: 500,
                commune: 'Djébonoua',
                producteur: 'Champs Djébonoua',
                stock_kg: 80,
                image: this.baseImagePath + this.imageMapping['Igname'],
                description: 'Igname fraîchement récoltée',
                unite: 'kg'
            },
            {
                id: 5,
                nom: 'Piments frais',
                categorie: 'Légumes',
                prix_kg: 1500,
                commune: 'Bouaké-Ville',
                producteur: 'Jardin Pimenté',
                stock_kg: 20,
                image: this.baseImagePath + this.imageMapping['Piments frais'],
                description: 'Piments forts et parfumés',
                unite: 'kg'
            },
            {
                id: 6,
                nom: 'Bananes plantain',
                categorie: 'Fruits',
                prix_kg: 400,
                commune: 'Bounda',
                producteur: 'Plantation Bounda',
                stock_kg: 60,
                image: this.baseImagePath + this.imageMapping['Bananes plantain'],
                description: 'Bananes plantain mûres à point',
                unite: 'kg'
            },
            {
                id: 7,
                nom: 'Manioc',
                categorie: 'Tubercules',
                prix_kg: 300,
                commune: 'Bouaké-Ville',
                producteur: 'Ferme Yao & Fils',
                stock_kg: 20,
                image: this.baseImagePath + this.imageMapping['Manioc'],
                description: 'Manioc bien frais, parfait pour attiéké ou placali.',
                unite: 'kg'
            },
            {
                id: 8,
                nom: 'Maïs',
                categorie: 'Céréales',
                prix_kg: 250,
                commune: 'Bounda',
                producteur: 'Coopérative du Soleil',
                stock_kg: 35,
                image: this.baseImagePath + this.imageMapping['Maïs'],
                description: 'Maïs jaune séché, idéal pour tô et couscous.',
                unite: 'kg'
            },
            {
                id: 9,
                nom: 'Mil',
                categorie: 'Céréales',
                prix_kg: 350,
                commune: 'Brobo',
                producteur: 'Ferme du Nord',
                stock_kg: 18,
                image: this.baseImagePath + this.imageMapping['Mil'],
                description: 'Mil bien propre et tamisé, qualité premium.',
                unite: 'kg'
            },
            {
                id: 10,
                nom: 'Haricot vert',
                categorie: 'Légumes',
                prix_kg: 700,
                commune: 'Bouaké-Ville',
                producteur: 'Green Farm',
                stock_kg: 12,
                image: this.baseImagePath + this.imageMapping['Haricot vert'],
                description: 'Haricot vert croquant et très frais.',
                unite: 'kg'
            },
            {
                id: 11,
                nom: 'Patate douce',
                categorie: 'Tubercules',
                prix_kg: 300,
                commune: 'Djébonoua',
                producteur: 'Verger Amani',
                stock_kg: 25,
                image: this.baseImagePath + this.imageMapping['Patate douce'],
                description: 'Patates douces sucrées, parfaites à frire ou bouillir.',
                unite: 'kg'
            },
            {
                id: 12,
                nom: 'Gombo',
                categorie: 'Légumes',
                prix_kg: 500,
                commune: 'Bounda',
                producteur: 'Champ des Maraîchers',
                stock_kg: 15,
                image: this.baseImagePath + this.imageMapping['Gombo'],
                description: 'Gombo frais, bien sélectionné pour sauces glissantes.',
                unite: 'kg'
            },
            {
                id: 13,
                nom: 'Aubergine violette',
                categorie: 'Légumes',
                prix_kg: 300,
                commune: 'Brobo',
                producteur: 'Agri-Fresh',
                stock_kg: 22,
                image: this.baseImagePath + this.imageMapping['Aubergine violette'],
                description: 'Aubergines violettes fermes et savoureuses.',
                unite: 'kg'
            },
            {
                id: 14,
                nom: 'Chou',
                categorie: 'Légumes',
                prix_kg: 250,
                commune: 'Djébonoua',
                producteur: 'Maraîchers du Centre',
                stock_kg: 19,
                image: this.baseImagePath + this.imageMapping['Chou'],
                description: 'Chou rond croquant, parfait pour salade et soupe.',
                unite: 'kg'
            },
            {
                id: 15,
                nom: 'Graine de palme',
                categorie: 'Oléagineux',
                prix_kg: 400,
                commune: 'Bouaké-Ville',
                producteur: 'Plantation Akissi',
                stock_kg: 30,
                image: this.baseImagePath + this.imageMapping['Graine de palme'],
                description: 'Graine de palme rouge pour sauce graine riche.',
                unite: 'kg'
            },
            {
                id: 16,
                nom: 'Carotte',
                categorie: 'Légumes',
                prix_kg: 500,
                commune: 'Bounda',
                producteur: 'Les Jardins de Bouaké',
                stock_kg: 14,
                image: this.baseImagePath + this.imageMapping['Carotte'],
                description: 'Carottes croquantes, bien orangées et juteuses.',
                unite: 'kg'
            }
        ];
        
        console.log('📊 Produits mockés chargés:', this.products.length);
        this.filteredProducts = [...this.products];
        this.displayProducts();
        this.updateCartCounter();
    }
    
    /**
     * Obtient l'image par défaut pour un produit (fallback si l'image locale n'existe pas)
     */
    getDefaultImage(productName) {
        // Essayer de trouver l'image dans le mapping
        if (this.imageMapping && this.imageMapping[productName]) {
            return this.baseImagePath + this.imageMapping[productName];
        }
        // Sinon utiliser une image placeholder
        return `https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop`;
    }
    
    /**
     * Affiche les produits dans la grille
     */
    displayProducts() {
        console.log('🎨 Affichage des produits...');
        const productsGrid = document.getElementById('productsGrid');
        
        if (!productsGrid) {
            console.error('❌ productsGrid NON TROUVÉ dans displayProducts!');
            return;
        }
        
        console.log('📊 Nombre de produits à afficher:', this.filteredProducts.length);
        
        if (this.filteredProducts.length === 0) {
            productsGrid.innerHTML = '<div class="no-products">Aucun produit trouvé</div>';
            console.log('ℹ️ Aucun produit à afficher');
            return;
        }
        
        // Créer le HTML pour chaque produit
        const productsHTML = this.filteredProducts.map(product => {
            const isFavorite = this.favorites.some(fav => fav.id === product.id || fav.id === String(product.id));
            const productId = product.id;
            
            return `
                <div class="product-card" data-product-id="${productId}">
                    <div class="product-header" style="position: relative;">
                        <div class="product-image-wrapper">
                            <img src="${product.image}" 
                                 alt="${product.nom}"
                                 class="product-image"
                                 loading="lazy"
                                 onerror="console.error('❌ Image non chargée:', '${product.image}'); this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7im70gSW1hZ2Ugbm9uIGRpc3BvbmlibGU8L3RleHQ+PC9zdmc+';">
                            <div class="product-emoji" style="display: none; width: 100%; height: 200px; align-items: center; justify-content: center; font-size: 80px; background: linear-gradient(135deg, #f0f0f0, #e0e0e0);">
                                ${this.getProductEmoji(product.nom)}
                            </div>
                        </div>
                        <button class="favorite-btn ${isFavorite ? 'favori' : ''}" 
                                data-favorite="${productId}"
                                style="position: absolute; top: 10px; right: 10px; background: white; border: none; border-radius: 50%; width: 40px; height: 40px; font-size: 20px; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.2); z-index: 10; display: flex; align-items: center; justify-content: center;">
                            ${isFavorite ? '❤️' : '🤍'}
                        </button>
                    </div>
                    
                    <div class="product-info">
                        <h3 class="product-name">${product.nom}</h3>
                        <p class="product-description">${product.description}</p>
                        
                        <div class="product-details">
                            <span class="product-price">${product.prix_kg} FCFA/${product.unite || 'kg'}</span>
                            <span class="product-stock">Stock: ${product.stock_kg} ${product.unite || 'kg'}</span>
                        </div>
                        
                        <div class="product-meta">
                            <span class="product-producer">👨‍🌾 ${product.producteur}</span>
                            <span class="product-location">📍 ${product.commune}</span>
                        </div>
                    </div>
                    
                    <div class="product-actions">
                        <div class="quantity-selector">
                            <button class="qty-btn" data-decrease="${productId}">-</button>
                            <span class="qty-value" id="qty-${productId}">1</span>
                            <button class="qty-btn" data-increase="${productId}">+</button>
                            <span class="qty-unit">${product.unite || 'kg'}</span>
                        </div>
                        
                        <button class="btn btn-primary add-to-cart" 
                                data-add-cart="${productId}">
                            🛒 Ajouter
                        </button>
                    </div>
                    
                    <div class="product-footer" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e1e8ed;">
                        <button class="btn btn-outline" 
                                style="width: 100%; padding: 10px; font-size: 0.9rem; border: 2px solid #4a7c3a; color: #4a7c3a; background: transparent; border-radius: 8px; cursor: pointer; transition: all 0.3s;"
                                onmouseover="this.style.background='#4a7c3a'; this.style.color='white';"
                                onmouseout="this.style.background='transparent'; this.style.color='#4a7c3a';"
                                onclick="catalogueManager.discuterAvecProducteur('${product.producteur_id || ''}', '${product.producteur}', '${product.nom}')">
                            💬 Discuter avec le producteur
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        console.log('📝 HTML généré, insertion dans le DOM...');
        productsGrid.innerHTML = productsHTML;
        
        // Attacher les événements après l'insertion du HTML
        this.attachProductEvents();
        
        console.log('✅ Produits affichés avec succès!');
    }
    
    /**
     * Obtient l'emoji correspondant au produit (pour fallback d'image)
     */
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
    
    /**
     * Filtre les produits selon les critères de recherche
     */
    filterProducts() {
        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
        const communeFilter = document.getElementById('filterCommune')?.value || '';
        const categorieFilter = document.getElementById('filterCategorie')?.value || '';
        
        this.filteredProducts = this.products.filter(product => {
            const matchesSearch = product.nom.toLowerCase().includes(searchTerm) ||
                                product.description.toLowerCase().includes(searchTerm) ||
                                product.producteur.toLowerCase().includes(searchTerm);
            const matchesCommune = !communeFilter || product.commune === communeFilter;
            const matchesCategorie = !categorieFilter || product.categorie === categorieFilter;
            
            return matchesSearch && matchesCommune && matchesCategorie;
        });
        
        this.displayProducts();
    }
    
    /**
     * Ajoute ou retire un produit des favoris
     */
    toggleFavorite(productId, event) {
        if (event) {
            event.stopPropagation(); // Empêcher le clic sur la carte produit
        }
        
        const product = this.products.find(p => p.id === productId);
        if (!product) return;
        
        // Vérifier si le produit est déjà en favoris
        const favoriteIndex = this.favorites.findIndex(fav => 
            fav.id === productId || fav.id === String(productId)
        );
        
        if (favoriteIndex > -1) {
            // Retirer des favoris
            this.favorites.splice(favoriteIndex, 1);
            console.log('❌ Produit retiré des favoris:', productId);
        } else {
            // Ajouter aux favoris
            this.favorites.push({
                id: productId,
                nom: product.nom,
                prix: product.prix_kg,
                unite: product.unite || 'kg',
                image: product.image
            });
            console.log('❤️ Produit ajouté aux favoris:', productId);
        }
        
        localStorage.setItem('agriConnect_favoris', JSON.stringify(this.favorites));
        this.displayProducts(); // Recharger l'affichage pour mettre à jour les icônes
        
        // Notification visuelle
        const btn = event?.target.closest('.favorite-btn');
        if (btn) {
            btn.textContent = favoriteIndex > -1 ? '🤍' : '❤️';
        }
    }
    
    /**
     * Augmente la quantité sélectionnée pour un produit
     */
    increaseQuantity(productId) {
        const qtyElement = document.getElementById(`qty-${productId}`);
        if (qtyElement) {
            let currentQty = parseInt(qtyElement.textContent) || 1;
            const product = this.products.find(p => p.id === productId);
            if (product && currentQty < product.stock_kg) {
                qtyElement.textContent = currentQty + 1;
            } else if (product) {
                alert(`Stock disponible: ${product.stock_kg} ${product.unite || 'kg'}`);
            }
        }
    }
    
    /**
     * Diminue la quantité sélectionnée pour un produit
     */
    decreaseQuantity(productId) {
        const qtyElement = document.getElementById(`qty-${productId}`);
        if (qtyElement) {
            let currentQty = parseInt(qtyElement.textContent) || 1;
            if (currentQty > 1) {
                qtyElement.textContent = currentQty - 1;
            }
        }
    }
    
    /**
     * Obtient la quantité sélectionnée pour un produit
     */
    getQuantity(productId) {
        const qtyElement = document.getElementById(`qty-${productId}`);
        return qtyElement ? parseInt(qtyElement.textContent) || 1 : 1;
    }
    
    /**
     * Ajoute un produit au panier
     * Vérifie la connexion et gère les quantités
     */
    addToCart(productId) {
        // Vérifier si l'utilisateur est connecté
        const userData = localStorage.getItem('agriConnect_user');
        if (!userData) {
            alert('Veuillez vous connecter pour ajouter des produits au panier');
            if (typeof redirectToLogin === 'function') {
                redirectToLogin();
            } else {
                window.location.href = 'login.html';
            }
            return;
        }
        
        const product = this.products.find(p => p.id === productId);
        if (!product) {
            console.error('❌ Produit non trouvé:', productId);
            return;
        }
        
        const quantity = this.getQuantity(productId);
        
        // Vérifier le stock disponible
        if (quantity > product.stock_kg) {
            alert(`Stock insuffisant. Disponible: ${product.stock_kg} ${product.unite || 'kg'}`);
            return;
        }
        
        // Charger le panier depuis localStorage
        this.cart = JSON.parse(localStorage.getItem('agriConnect_panier')) || [];
        
        const cartItem = {
            id: product.id,
            nom: product.nom,
            prix_kg: product.prix_kg,
            quantity: quantity,
            unite: product.unite || 'kg',
            image: product.image,
            producteur: product.producteur,
            commune: product.commune
        };
        
        // Vérifier si le produit est déjà dans le panier
        const existingIndex = this.cart.findIndex(item => item.id === productId);
        
        if (existingIndex > -1) {
            // Augmenter la quantité si le produit existe déjà
            const newQuantity = this.cart[existingIndex].quantity + quantity;
            if (newQuantity <= product.stock_kg) {
                this.cart[existingIndex].quantity = newQuantity;
            } else {
                alert(`Stock insuffisant. Disponible: ${product.stock_kg} ${product.unite || 'kg'}`);
                return;
            }
        } else {
            // Ajouter un nouvel article
            this.cart.push(cartItem);
        }
        
        // Sauvegarder le panier
        localStorage.setItem('agriConnect_panier', JSON.stringify(this.cart));
        
        // Animation de confirmation
        this.showAddToCartAnimation(productId);
        
        // Mettre à jour le compteur
        this.updateCartCounter();
        
        console.log('🛒 Produit ajouté au panier:', cartItem);
    }
    
    /**
     * Affiche une animation de confirmation lors de l'ajout au panier
     */
    showAddToCartAnimation(productId) {
        const button = document.querySelector(`button[data-add-cart="${productId}"]`);
        if (button) {
            const originalText = button.innerHTML;
            button.innerHTML = '✅ Ajouté!';
            button.disabled = true;
            button.style.background = '#27ae60';
            
            setTimeout(() => {
                button.innerHTML = originalText;
                button.disabled = false;
                button.style.background = '';
            }, 1500);
        }
    }
    
    /**
     * Met à jour le compteur du panier flottant
     */
    updateCartCounter() {
        // Recharger le panier depuis localStorage
        this.cart = JSON.parse(localStorage.getItem('agriConnect_panier')) || [];
        
        const floatingCartCounter = document.getElementById('floatingCartCounter');
        if (floatingCartCounter) {
            const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
            floatingCartCounter.textContent = totalItems;
            floatingCartCounter.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    }
    
    /**
     * Ouvre une conversation avec le producteur
     */
    discuterAvecProducteur(producteurId, producteurNom, produitNom) {
        // Vérifier si l'utilisateur est connecté
        const userData = localStorage.getItem('agriConnect_user');
        if (!userData) {
            alert('Veuillez vous connecter pour discuter avec le producteur');
            window.location.href = 'login.html';
            return;
        }
        
        const user = JSON.parse(userData);
        if (user.role !== 'ACHETEUR') {
            alert('Cette fonctionnalité est réservée aux acheteurs');
            return;
        }
        
        // Améliorer la validation: accepter les IDs numériques ou UUID valides
        // Rejeter les IDs mockés comme 'prod-prof-001'
        const isValidId = producteurId && 
                         producteurId !== 'null' && 
                         producteurId !== 'undefined' &&
                         producteurId !== '' &&
                         !producteurId.includes('prod-prof');
        
        if (!isValidId) {
            alert('⚠️ Ce producteur n\'a pas encore complété son profil ou ne peut pas être contacté. Veuillez essayer avec un autre produit.');
            return;
        }
        
        // Stocker les informations du producteur dans localStorage pour la messagerie
        const conversationData = {
            producteur_id: producteurId,
            producteur_nom: producteurNom || 'Producteur',
            produit_nom: produitNom,
            timestamp: Date.now()
        };
        localStorage.setItem('agriConnect_new_conversation', JSON.stringify(conversationData));
        
        // Rediriger vers le dashboard acheteur avec la section messages
        window.location.href = 'frontend/pages/acheteur.html#messages';
    }

    /**
     * Attache les événements aux boutons des produits après leur création
     */
    attachProductEvents() {
        // Attacher les événements pour tous les produits affichés
        this.filteredProducts.forEach(product => {
            const productId = product.id;
            
            // Bouton ajouter au panier
            const addBtn = document.querySelector(`button[data-add-cart="${productId}"]`);
            if (addBtn) {
                addBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.addToCart(productId);
                });
            }
            
            // Bouton augmenter quantité
            const increaseBtn = document.querySelector(`button[data-increase="${productId}"]`);
            if (increaseBtn) {
                increaseBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.increaseQuantity(productId);
                });
            }
            
            // Bouton diminuer quantité
            const decreaseBtn = document.querySelector(`button[data-decrease="${productId}"]`);
            if (decreaseBtn) {
                decreaseBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.decreaseQuantity(productId);
                });
            }
            
            // Bouton favori
            const favoriteBtn = document.querySelector(`button[data-favorite="${productId}"]`);
            if (favoriteBtn) {
                favoriteBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.toggleFavorite(productId, e);
                });
            }
        });
    }
    
    /**
     * Configure les écouteurs d'événements pour la recherche et les filtres
     */
    setupSearch() {
        const searchInput = document.getElementById('searchInput');
        const communeFilter = document.getElementById('filterCommune');
        const categorieFilter = document.getElementById('filterCategorie');
        
        if (searchInput) {
            searchInput.addEventListener('input', debounce(() => this.filterProducts(), 300));
        }
        if (communeFilter) {
            communeFilter.addEventListener('change', () => this.filterProducts());
        }
        if (categorieFilter) {
            categorieFilter.addEventListener('change', () => this.filterProducts());
        }
    }
}

/**
 * Fonction debounce pour optimiser les recherches
 * Évite de faire trop de requêtes pendant la saisie
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Créer une instance globale du gestionnaire de catalogue
let catalogueManager;

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM chargé - Initialisation du catalogue');
    
    // Créer l'instance du gestionnaire
    catalogueManager = new CatalogueManager();
    
    // Charger les produits
    catalogueManager.loadProducts();
    
    // Configurer les filtres et la recherche
    catalogueManager.setupSearch();
    
    // Mettre à jour l'interface utilisateur si nécessaire
    if (typeof updateAuthUI === 'function') {
        updateAuthUI();
    }
    
    // Mettre à jour le compteur du panier au chargement
    catalogueManager.updateCartCounter();
    
    // Initialiser le menu hamburger
    setupMobileMenu();
});

// Fonction pour gérer le menu hamburger mobile
function setupMobileMenu() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (!navToggle || !navMenu) {
        console.warn('⚠️ Éléments menu hamburger non trouvés');
        return;
    }
    
    // Retirer les anciens event listeners si existants
    const newNavToggle = navToggle.cloneNode(true);
    navToggle.parentNode.replaceChild(newNavToggle, navToggle);
    const newNavMenu = navMenu;
    
    // Ajouter les event listeners
    newNavToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        newNavMenu.classList.toggle('active');
        newNavToggle.classList.toggle('active');
        // Empêcher le scroll du body quand le menu est ouvert
        if (newNavMenu.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    });
    
    // Fermer le menu en cliquant en dehors
    const closeMenuOnOutsideClick = (e) => {
        if (!newNavMenu.contains(e.target) && !newNavToggle.contains(e.target)) {
            newNavMenu.classList.remove('active');
            newNavToggle.classList.remove('active');
            document.body.style.overflow = '';
        }
    };
    
    document.addEventListener('click', closeMenuOnOutsideClick);
    
    // Fermer le menu quand on clique sur un lien
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            newNavMenu.classList.remove('active');
            newNavToggle.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
    
    console.log('✅ Menu hamburger initialisé sur catalogue');
}
