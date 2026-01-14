<?php
// Ce fichier permet à l'admin de récupérer toutes les notifications de la plateforme

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
require_once("../../config/db.php");

// Paramètres de filtre
$type = $_GET['type'] ?? null;
$is_lu = $_GET['is_lu'] ?? null;
$limit = $_GET['limit'] ?? 50;
$offset = $_GET['offset'] ?? 0;

try {
    $sql = "
        SELECT 
            n.id,
            n.user_id,
            n.titre,
            n.message,
            n.type,
            n.is_lu,
            n.created_at,
            u.prenom,
            u.nom,
            u.role
        FROM notifications n
        LEFT JOIN users u ON n.user_id = u.id
        WHERE 1=1
    ";
    
    $params = [];
    
    // Filtre par type
    if ($type && $type !== 'all') {
        $sql .= " AND n.type = ?";
        $params[] = $type;
    }
    
    // Filtre par statut lu/non lu
    if ($is_lu !== null && $is_lu !== '') {
        $sql .= " AND n.is_lu = ?";
        $params[] = (int)$is_lu;
    }
    
    $sql .= " ORDER BY n.created_at DESC LIMIT ? OFFSET ?";
    $params[] = (int)$limit;
    $params[] = (int)$offset;
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Compter le total
    $countSql = "SELECT COUNT(*) FROM notifications WHERE 1=1";
    $countParams = [];
    
    if ($type && $type !== 'all') {
        $countSql .= " AND type = ?";
        $countParams[] = $type;
    }
    
    if ($is_lu !== null && $is_lu !== '') {
        $countSql .= " AND is_lu = ?";
        $countParams[] = (int)$is_lu;
    }
    
    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($countParams);
    $total = $countStmt->fetchColumn();
    
    // Compter les non lues
    $nonLuStmt = $pdo->query("SELECT COUNT(*) FROM notifications WHERE is_lu = 0");
    $non_lues = $nonLuStmt->fetchColumn();
    
    echo json_encode([
        "status" => "success",
        "notifications" => $notifications,
        "total" => (int)$total,
        "non_lues" => (int)$non_lues,
        "limit" => (int)$limit,
        "offset" => (int)$offset
    ]);
    
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Erreur: " . $e->getMessage()]);
}
?>

