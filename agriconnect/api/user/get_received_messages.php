<?php
// Ce fichier récupère tous les messages reçus par un utilisateur

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Gérer les requêtes OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once("../../config/db.php");

$recipient_id = $_GET['recipient_id'] ?? null;
$is_read = $_GET['is_read'] ?? null;

if (!$recipient_id) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "ID destinataire requis"
    ]);
    exit;
}

try {
    // Récupérer les messages reçus
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
        WHERE recipient_id = ?
    ";
    
    $params = [$recipient_id];
    
    // Filtre par statut de lecture
    if ($is_read !== null) {
        $sql .= " AND is_read = ?";
        $params[] = (int)$is_read;
    }
    
    $sql .= " ORDER BY created_at DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Compter les messages non lus
    $countSql = "SELECT COUNT(*) as count FROM messages WHERE recipient_id = ? AND is_read = 0";
    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute([$recipient_id]);
    $countResult = $countStmt->fetch(PDO::FETCH_ASSOC);
    $unread_count = $countResult['count'] ?? 0;
    
    echo json_encode([
        "status" => "success",
        "messages" => $messages,
        "total" => count($messages),
        "unread_count" => $unread_count
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
