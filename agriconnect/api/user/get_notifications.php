<?php
// Ce fichier permet de récupérer les notifications d'un utilisateur

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once("../../config/db.php");

// Je récupère l'ID de l'utilisateur
$user_id = $_GET['user_id'] ?? null;

// Je vérifie qu'on m'a bien donné un ID
if (!$user_id) {
    echo json_encode(["status" => "error", "message" => "ID utilisateur requis."]);
    exit;
}

try {
    // Je récupère les notifications non lues d'abord, puis les autres
    $stmt = $pdo->prepare("
        SELECT id, titre, message, type, is_lu, created_at 
        FROM notifications 
        WHERE user_id = ? 
        ORDER BY is_lu ASC, created_at DESC
        LIMIT 20
    ");
    $stmt->execute([$user_id]);
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Je compte les notifications non lues
    $count_non_lu = $pdo->prepare("SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_lu = 0");
    $count_non_lu->execute([$user_id]);
    $nombre_non_lu = $count_non_lu->fetchColumn();
    
    echo json_encode([
        "status" => "success",
        "notifications" => $notifications,
        "statistiques" => [
            "total" => count($notifications),
            "non_lues" => $nombre_non_lu
        ]
    ]);
    
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Erreur: " . $e->getMessage()]);
}
?>