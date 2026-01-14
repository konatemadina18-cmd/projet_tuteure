<?php
// Ce fichier permet de récupérer les paramètres de la plateforme

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
require_once("../../config/db.php");

try {
    // Vérifier si la table existe
    $checkTable = $pdo->query("SHOW TABLES LIKE 'settings'");
    
    if ($checkTable->rowCount() === 0) {
        // Retourner les valeurs par défaut
        echo json_encode([
            "status" => "success",
            "settings" => [
                "commission_pourcentage" => "5",
                "frais_livraison_base" => "1000",
                "stock_alerte_minimum" => "10"
            ]
        ]);
        exit;
    }
    
    $stmt = $pdo->query("SELECT id, valeur, description FROM settings");
    $settings = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $settingsArray = [];
    foreach ($settings as $setting) {
        $settingsArray[$setting['id']] = $setting['valeur'];
    }
    
    echo json_encode([
        "status" => "success",
        "settings" => $settingsArray
    ]);
    
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Erreur: " . $e->getMessage()]);
}
?>

