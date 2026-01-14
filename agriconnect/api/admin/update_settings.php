<?php
// Ce fichier permet à l'admin de mettre à jour les paramètres de la plateforme

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: PUT, POST");
require_once("../../config/db.php");

// Vérifier si la table settings existe, sinon la créer
try {
    // Vérifier l'existence de la table
    $checkTable = $pdo->query("SHOW TABLES LIKE 'settings'");
    
    if ($checkTable->rowCount() === 0) {
        // Créer la table settings
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS settings (
                id VARCHAR(50) PRIMARY KEY,
                valeur TEXT,
                description TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        ");
        
        // Insérer les paramètres par défaut
        $defaultSettings = [
            ['commission_pourcentage', '5', 'Pourcentage de commission sur les ventes'],
            ['frais_livraison_base', '1000', 'Frais de livraison de base en FCFA'],
            ['stock_alerte_minimum', '10', 'Stock minimum avant alerte']
        ];
        
        $insertStmt = $pdo->prepare("INSERT INTO settings (id, valeur, description) VALUES (?, ?, ?)");
        foreach ($defaultSettings as $setting) {
            $insertStmt->execute($setting);
        }
    }
    
    // Récupérer les données
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!$data || !isset($data['settings'])) {
        echo json_encode(["status" => "error", "message" => "Données manquantes"]);
        exit;
    }
    
    $pdo->beginTransaction();
    
    foreach ($data['settings'] as $key => $value) {
        // Vérifier si le paramètre existe
        $checkStmt = $pdo->prepare("SELECT id FROM settings WHERE id = ?");
        $checkStmt->execute([$key]);
        
        if ($checkStmt->rowCount() > 0) {
            // Mettre à jour
            $updateStmt = $pdo->prepare("UPDATE settings SET valeur = ? WHERE id = ?");
            $updateStmt->execute([$value, $key]);
        } else {
            // Créer
            $insertStmt = $pdo->prepare("INSERT INTO settings (id, valeur) VALUES (?, ?)");
            $insertStmt->execute([$key, $value]);
        }
    }
    
    $pdo->commit();
    
    // Récupérer tous les paramètres mis à jour
    $getStmt = $pdo->query("SELECT id, valeur, description FROM settings");
    $settings = $getStmt->fetchAll(PDO::FETCH_ASSOC);
    
    $settingsArray = [];
    foreach ($settings as $setting) {
        $settingsArray[$setting['id']] = $setting['valeur'];
    }
    
    echo json_encode([
        "status" => "success",
        "message" => "Paramètres mis à jour avec succès",
        "settings" => $settingsArray
    ]);
    
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(["status" => "error", "message" => "Erreur: " . $e->getMessage()]);
}
?>

