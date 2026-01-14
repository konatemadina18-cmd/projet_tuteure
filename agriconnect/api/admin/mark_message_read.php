<?php
// Ce fichier permet de marquer un message admin comme lu

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: PUT");
header("Access-Control-Allow-Headers: Content-Type");
require_once("../../config/db.php");

$data = json_decode(file_get_contents("php://input"), true);

$message_id = $data['message_id'] ?? null;

if (!$message_id) {
    echo json_encode(["status" => "error", "message" => "ID du message requis"]);
    exit;
}

try {
    // Vérifier si la table existe
    $checkTable = $pdo->query("SHOW TABLES LIKE 'messages_admin'");
    
    if ($checkTable->rowCount() === 0) {
        echo json_encode([
            "status" => "error",
            "message" => "La table messages_admin n'existe pas."
        ]);
        exit;
    }
    
    // Marquer comme lu
    $stmt = $pdo->prepare("UPDATE messages_admin SET is_lu = 1 WHERE id = ?");
    $stmt->execute([$message_id]);
    
    echo json_encode([
        "status" => "success",
        "message" => "Message marqué comme lu"
    ]);
    
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Erreur: " . $e->getMessage()]);
}
?>

