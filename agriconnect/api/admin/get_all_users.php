<?php
// Ce fichier permet à l'admin de récupérer tous les utilisateurs de la plateforme

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
    // Requête simple - récupérer TOUS les utilisateurs avec leurs informations
    $sql = "SELECT 
                id, 
                nom, 
                prenom, 
                email, 
                telephone, 
                role, 
                commune, 
                created_at
            FROM users 
            ORDER BY created_at DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Compter le total
    $countSql = "SELECT COUNT(*) as total FROM users";
    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute();
    $countResult = $countStmt->fetch(PDO::FETCH_ASSOC);
    $total = $countResult ? (int)$countResult['total'] : 0;
    
    echo json_encode([
        "status" => "success",
        "users" => $users,
        "total" => $total
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

