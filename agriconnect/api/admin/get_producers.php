<?php
// Ce fichier permet à l'admin de récupérer tous les producteurs avec leurs statistiques

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Gérer les requêtes OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once("../../config/db.php");

try {
    $sql = "
        SELECT 
            u.id,
            u.nom,
            u.prenom,
            u.email,
            u.telephone,
            u.commune,
            u.created_at,
            COALESCE(pp.id, '') as profile_id,
            COALESCE(pp.nom_exploitation, 'Non renseigné') as nom_exploitation,
            COALESCE(pp.description, '') as description,
            COALESCE(COUNT(DISTINCT p.id), 0) as nb_produits,
            COALESCE(COUNT(DISTINCT CASE WHEN p.is_active = 1 THEN p.id END), 0) as produits_actifs,
            COALESCE(SUM(CASE WHEN p.is_active = 1 THEN p.stock ELSE 0 END), 0) as stock_total,
            COALESCE(AVG(CASE WHEN p.is_active = 1 THEN p.prix ELSE NULL END), 0) as prix_moyen,
            COALESCE(COUNT(DISTINCT ci.commande_id), 0) as nb_commandes,
            COALESCE(SUM(CASE WHEN ci.commande_id IS NOT NULL THEN ci.quantite * ci.prix_unitaire ELSE 0 END), 0) as chiffre_affaires
        FROM users u
        LEFT JOIN profile_producteurs pp ON u.id = pp.user_id
        LEFT JOIN produits p ON pp.id = p.producteur_id
        LEFT JOIN commande_items ci ON p.id = ci.produit_id
        WHERE u.role = 'PRODUCTEUR'
        GROUP BY u.id, pp.id, pp.nom_exploitation, pp.description
        ORDER BY u.created_at DESC
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $producers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        "status" => "success",
        "producers" => $producers,
        "total" => count($producers)
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error", 
        "message" => "Erreur de base de données: " . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Erreur: " . $e->getMessage()
    ]);
}
?>

