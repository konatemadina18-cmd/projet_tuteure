<?php
// Ce fichier permet aux utilisateurs de créer un message, plainte ou suggestion

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
require_once("../../config/db.php");

$data = json_decode(file_get_contents("php://input"), true);

$user_id = $data['user_id'] ?? null;
$type = $data['type'] ?? null;
$sujet = $data['sujet'] ?? null;
$message = $data['message'] ?? null;

// Validation
if (!$user_id || !$type || !$message) {
    echo json_encode(["status" => "error", "message" => "Données incomplètes"]);
    exit;
}

// Types valides
$typesValides = ['PLAINTE', 'SUGGESTION', 'BUG', 'AMELIORATION'];
if (!in_array($type, $typesValides)) {
    echo json_encode(["status" => "error", "message" => "Type invalide"]);
    exit;
}

try {
    // Vérifier si la table existe
    $checkTable = $pdo->query("SHOW TABLES LIKE 'messages_admin'");
    
    if ($checkTable->rowCount() === 0) {
        echo json_encode([
            "status" => "error",
            "message" => "La table messages_admin n'existe pas. Veuillez contacter l'administrateur."
        ]);
        exit;
    }
    
    // Vérifier que l'utilisateur existe
    $checkUser = $pdo->prepare("SELECT id FROM users WHERE id = ?");
    $checkUser->execute([$user_id]);
    
    if ($checkUser->rowCount() === 0) {
        echo json_encode(["status" => "error", "message" => "Utilisateur non trouvé"]);
        exit;
    }
    
    // Générer un UUID
    $message_id = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
    
    // Insérer le message
    $stmt = $pdo->prepare("
        INSERT INTO messages_admin (id, user_id, type, sujet, message, is_lu) 
        VALUES (?, ?, ?, ?, ?, 0)
    ");
    
    $stmt->execute([$message_id, $user_id, $type, $sujet, $message]);
    
    echo json_encode([
        "status" => "success",
        "message" => "Votre message a été envoyé avec succès",
        "message_id" => $message_id
    ]);
    
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Erreur: " . $e->getMessage()]);
}
?>

