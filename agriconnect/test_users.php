<?php
header("Content-Type: application/json");
require_once("config/db.php");

try {
    // Vérifier le total d'utilisateurs
    $stmt = $pdo->query('SELECT COUNT(*) as total FROM users');
    $totalUsers = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Vérifier les utilisateurs par rôle
    $stmt = $pdo->query('SELECT role, COUNT(*) as count FROM users GROUP BY role');
    $usersByRole = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Afficher quelques utilisateurs
    $stmt = $pdo->query('SELECT id, nom, prenom, email, role FROM users LIMIT 5');
    $sampleUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        "status" => "success",
        "total_users" => $totalUsers,
        "users_by_role" => $usersByRole,
        "sample_users" => $sampleUsers
    ], JSON_PRETTY_PRINT);
    
} catch(PDOException $e) {
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
?>
