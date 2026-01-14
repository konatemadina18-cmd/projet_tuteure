<?php
// Ce fichier récupère les détails d'un produit avec les infos du producteur

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Gérer les requêtes OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once("../../config/db.php");

$product_id = $_GET['id'] ?? null;

if (!$product_id) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "ID produit requis"
    ]);
    exit;
}

try {
    // Récupérer le produit avec les infos du producteur
    $sql = "
        SELECT 
            p.id,
            p.nom,
            p.description,
            p.prix,
            p.stock,
            p.is_active,
            p.created_at,
            p.producteur_id,
            u.id as user_id,
            u.nom as producteur_nom,
            u.prenom as producteur_prenom,
            u.email as producteur_email,
            u.telephone as producteur_telephone,
            u.commune as producteur_commune,
            pp.nom_exploitation,
            pp.description as producteur_description
        FROM produits p
        JOIN profile_producteurs pp ON p.producteur_id = pp.id
        JOIN users u ON pp.user_id = u.id
        WHERE p.id = ?
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$product_id]);
    $product = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$product) {
        http_response_code(404);
        echo json_encode([
            "status" => "error",
            "message" => "Produit non trouvé"
        ]);
        exit;
    }
    
    echo json_encode([
        "status" => "success",
        "product" => $product
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
