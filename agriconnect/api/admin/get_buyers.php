<?php
// Ce fichier permet à l'admin de récupérer tous les acheteurs avec leurs statistiques

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
            COALESCE(COUNT(DISTINCT c.id), 0) as nb_commandes,
            COALESCE(SUM(c.total), 0) as total_depense,
            COALESCE(AVG(c.total), 0) as moyenne_commande,
            COALESCE(COUNT(CASE WHEN c.statut = 'LIVREE' THEN 1 END), 0) as commandes_livrees,
            COALESCE(COUNT(CASE WHEN c.statut IN ('EN_ATTENTE', 'CONFIRMEE', 'EN_PREPARATION', 'EN_LIVRAISON') THEN 1 END), 0) as commandes_en_cours,
            MAX(c.created_at) as derniere_commande
        FROM users u
        LEFT JOIN commandes c ON u.id = c.acheteur_id
        WHERE u.role = 'ACHETEUR'
        GROUP BY u.id, u.nom, u.prenom, u.email, u.telephone, u.commune, u.created_at
        ORDER BY u.created_at DESC
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $buyers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        "status" => "success",
        "buyers" => $buyers,
        "total" => count($buyers)
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

