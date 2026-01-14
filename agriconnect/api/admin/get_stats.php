<?php
// Ce fichier permet à l'admin de récupérer les statistiques globales de la plateforme

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
require_once("../../config/db.php");

try {
    // Statistiques des utilisateurs
    $stmt_users = $pdo->query("
        SELECT 
            COUNT(*) as total_users,
            COUNT(CASE WHEN role = 'ACHETEUR' THEN 1 END) as total_acheteurs,
            COUNT(CASE WHEN role = 'PRODUCTEUR' THEN 1 END) as total_producteurs,
            COUNT(CASE WHEN role = 'LIVREUR' THEN 1 END) as total_livreurs,
            COUNT(CASE WHEN role = 'ADMIN' THEN 1 END) as total_admins,
            COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as nouveaux_aujourdhui,
            COUNT(CASE WHEN DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as nouveaux_semaine,
            COUNT(CASE WHEN DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as nouveaux_mois
        FROM users
    ");
    $users_stats = $stmt_users->fetch(PDO::FETCH_ASSOC);
    
    // Statistiques des commandes
    $stmt_orders = $pdo->query("
        SELECT 
            COUNT(*) as total_commandes,
            COALESCE(SUM(total), 0) as chiffre_affaires_total,
            COALESCE(AVG(total), 0) as moyenne_commande,
            COUNT(CASE WHEN statut = 'EN_ATTENTE' THEN 1 END) as en_attente,
            COUNT(CASE WHEN statut = 'CONFIRMEE' THEN 1 END) as confirmees,
            COUNT(CASE WHEN statut = 'EN_PREPARATION' THEN 1 END) as en_preparation,
            COUNT(CASE WHEN statut = 'EN_LIVRAISON' THEN 1 END) as en_livraison,
            COUNT(CASE WHEN statut = 'LIVREE' THEN 1 END) as livrees,
            COUNT(CASE WHEN statut = 'ANNULEE' THEN 1 END) as annulees,
            COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as commandes_aujourdhui,
            COUNT(CASE WHEN DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as commandes_semaine,
            COUNT(CASE WHEN DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as commandes_mois,
            SUM(CASE WHEN DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN total ELSE 0 END) as ca_mois
        FROM commandes
    ");
    $orders_stats = $stmt_orders->fetch(PDO::FETCH_ASSOC);
    
    // Statistiques des produits
    $stmt_products = $pdo->query("
        SELECT 
            COUNT(*) as total_produits,
            COUNT(CASE WHEN is_active = 1 THEN 1 END) as produits_actifs,
            COUNT(CASE WHEN is_active = 0 THEN 1 END) as produits_inactifs,
            COUNT(CASE WHEN stock = 0 THEN 1 END) as produits_rupture,
            COUNT(CASE WHEN stock > 0 AND stock < 10 THEN 1 END) as stock_faible,
            COALESCE(SUM(stock), 0) as stock_total,
            COALESCE(AVG(prix), 0) as prix_moyen
        FROM produits
    ");
    $products_stats = $stmt_products->fetch(PDO::FETCH_ASSOC);
    
    // Statistiques des notifications
    $stmt_notifications = $pdo->query("
        SELECT 
            COUNT(*) as total_notifications,
            COUNT(CASE WHEN is_lu = 0 THEN 1 END) as notifications_non_lues,
            COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as notifications_aujourdhui
        FROM notifications
    ");
    $notifications_stats = $stmt_notifications->fetch(PDO::FETCH_ASSOC);
    
    // Statistiques des producteurs actifs (avec produits)
    $stmt_active_producers = $pdo->query("
        SELECT COUNT(DISTINCT p.producteur_id) as producteurs_avec_produits
        FROM produits p
        WHERE p.is_active = 1
    ");
    $active_producers = $stmt_active_producers->fetchColumn();
    
    // Statistiques des acheteurs actifs (avec commandes)
    $stmt_active_buyers = $pdo->query("
        SELECT COUNT(DISTINCT acheteur_id) as acheteurs_avec_commandes
        FROM commandes
    ");
    $active_buyers = $stmt_active_buyers->fetchColumn();
    
    echo json_encode([
        "status" => "success",
        "stats" => [
            "users" => $users_stats,
            "orders" => $orders_stats,
            "products" => $products_stats,
            "notifications" => $notifications_stats,
            "active_producers" => (int)$active_producers,
            "active_buyers" => (int)$active_buyers
        ]
    ]);
    
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Erreur: " . $e->getMessage()]);
}
?>

