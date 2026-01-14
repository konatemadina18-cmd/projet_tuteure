<?php
// Ce fichier permet de marquer une notification comme lue
// Comme quand on coche un message qu'on a lu

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: PUT");
header("Access-Control-Allow-Headers: Content-Type");

require_once("../../config/db.php");

// Je récupère les informations
$data = json_decode(file_get_contents("php://input"), true);

$notification_id = $data['notification_id'] ?? null;
$user_id = $data['user_id'] ?? null;

// Je vérifie qu'on m'a bien donné les IDs
if (!$notification_id || !$user_id) {
    echo json_encode(["status" => "error", "message" => "ID notification et utilisateur requis."]);
    exit;
}

try {
    // Je marque la notification comme lue
    $stmt = $pdo->prepare("UPDATE notifications SET is_lu = 1 WHERE id = ? AND user_id = ?");
    $stmt->execute([$notification_id, $user_id]);
    
    if ($stmt->rowCount() > 0) {
        echo json_encode([
            "status" => "success", 
            "message" => "Notification marquée comme lue."
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Notification non trouvée."]);
    }
    
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Erreur: " . $e->getMessage()]);
}
?>