<?php
// Ce fichier récupère les messages d'une conversation entre deux utilisateurs

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Gérer les requêtes OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once("../../config/db.php");

$user1_id = $_GET['user1_id'] ?? null;
$user2_id = $_GET['user2_id'] ?? null;

if (!$user1_id || !$user2_id) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "IDs utilisateurs requis"
    ]);
    exit;
}

try {
    // Récupérer les messages entre les deux utilisateurs
    $sql = "
        SELECT 
            id,
            sender_id,
            sender_name,
            recipient_id,
            sujet,
            message,
            product_id,
            is_read,
            created_at
        FROM messages
        WHERE (sender_id = ? AND recipient_id = ?) 
           OR (sender_id = ? AND recipient_id = ?)
        ORDER BY created_at ASC
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$user1_id, $user2_id, $user2_id, $user1_id]);
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Marquer les messages reçus par $user1_id comme lus
    $updateSql = "UPDATE messages SET is_read = 1 
                  WHERE recipient_id = ? AND sender_id = ? AND is_read = 0";
    $updateStmt = $pdo->prepare($updateSql);
    $updateStmt->execute([$user1_id, $user2_id]);
    
    echo json_encode([
        "status" => "success",
        "messages" => $messages,
        "total" => count($messages)
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
