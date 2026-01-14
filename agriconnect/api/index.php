<?php
// FICHIER : api/index.php
// BUT : Page d'accueil de l'API qui montre toutes les routes disponibles
// COMME : Un plan de l'API pour les développeurs

header("Content-Type: application/json");

// Je montre toutes les routes disponibles de l'API
echo json_encode([
    "status" => "success",
    "message" => "🌿 Bienvenue sur l'API AgriConnect Bouaké !",
    "version" => "1.0.0",
    "auteur" => "Konaté Awa Madina",
    "localite" => "Bouaké, Vallée du Bandama",
    
    "routes" => [
        "AUTHENTIFICATION" => [
            "POST /api/auth/register.php" => "Créer un compte",
            "POST /api/auth/login.php" => "Se connecter", 
            "POST /api/auth/send_otp.php" => "Envoyer code OTP",
            "POST /api/auth/verification_otp.php" => "Vérifier code OTP"
        ],
        
        "PRODUITS" => [
            "GET /api/products/get_products.php" => "Lister les produits",
            "POST /api/products/create_product.php" => "Créer un produit",
            "PUT /api/products/update_product.php" => "Modifier un produit",
            "DELETE /api/products/delete_product.php" => "Supprimer un produit"
        ],
        
        "COMMANDES" => [
            "GET /api/orders/get_orders.php" => "Lister les commandes",
            "POST /api/orders/create_order.php" => "Créer une commande",
            "PUT /api/orders/update_status.php" => "Changer statut commande"
        ],
        
        "PAIEMENTS" => [
            "POST /api/payments/create_payment.php" => "Créer un paiement"
        ],
        
        "UTILISATEUR" => [
            "POST /api/user/profile.php" => "Voir le profil",
            "GET /api/user/get_notifications.php" => "Voir notifications",
            "PUT /api/user/update_profile.php" => "Modifier profil",
            "PUT /api/user/update_password.php" => "Changer mot de passe",
            "PUT /api/user/mark_notification_read.php" => "Marquer notification lue",
            "GET /api/user/get_stats.php" => "Statistiques personnelles"
        ]
    ],
    
    "exemples" => [
        "test_api" => "Visitez /test_api.php pour tester l'API",
        "frontend" => "Visitez /frontend/index.html pour l'application"
    ]
]);
?>