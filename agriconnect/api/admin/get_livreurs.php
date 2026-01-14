<?php
// Ce fichier permet à l'admin de récupérer tous les livreurs avec leurs statistiques

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
            0 as nb_livraisons,
            0 as livraisons_terminees,
            0 as livraisons_en_cours,
            NULL as derniere_livraison
        FROM users u
        WHERE u.role = 'LIVREUR'
        ORDER BY u.created_at DESC
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $livreurs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        "status" => "success",
        "livreurs" => $livreurs,
        "total" => count($livreurs)
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

