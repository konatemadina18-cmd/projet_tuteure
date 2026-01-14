<?php
header("Content-Type: application/json");
require_once("config/db.php");

try {
    // Vérifier les tables existantes
    $stmt = $pdo->query("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'agriconnect'");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo json_encode([
        "status" => "success",
        "database" => "agriconnect",
        "tables" => $tables,
        "table_count" => count($tables)
    ], JSON_PRETTY_PRINT);
    
} catch(PDOException $e) {
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
?>
