<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
require_once("../../config/db.php");

echo "API Test - Users\n";

try {
    // Test 1: Récupérer tous les utilisateurs
    echo "\n=== Test 1: GET ALL USERS ===\n";
    $stmt = $pdo->query("SELECT id, nom, prenom, email, telephone, role, commune, created_at FROM users LIMIT 5");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["status" => "success", "users" => $users], JSON_PRETTY_PRINT);
    
} catch(PDOException $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Erreur: " . $e->getMessage()
    ]);
}
?>
