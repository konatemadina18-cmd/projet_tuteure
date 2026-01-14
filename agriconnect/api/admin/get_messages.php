<?php
// Ce fichier permet à l'admin de récupérer les messages, plaintes et suggestions
// NOTE : Cette table doit être créée dans la base de données si elle n'existe pas

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
require_once("../../config/db.php");

// Vérifier si la table messages existe, sinon retourner un message
try {
    // Vérifier l'existence de la table
    $checkTable = $pdo->query("SHOW TABLES LIKE 'messages_admin'");
    
    if ($checkTable->rowCount() === 0) {
        // Table n'existe pas, retourner un message informatif
        echo json_encode([
            "status" => "info",
            "message" => "La table messages_admin n'existe pas encore. Créez-la pour utiliser cette fonctionnalité.",
            "messages" => [],
            "total" => 0
        ]);
        exit;
    }
    
    // Paramètres de filtre
    $type = $_GET['type'] ?? null; // 'PLAINTE', 'SUGGESTION', 'BUG', etc.
    $is_lu = $_GET['is_lu'] ?? null;
    $limit = $_GET['limit'] ?? 50;
    $offset = $_GET['offset'] ?? 0;
    
    $sql = "
        SELECT 
            m.id,
            m.user_id,
            m.type,
            m.sujet,
            m.message,
            m.is_lu,
            m.created_at,
            u.prenom,
            u.nom,
            u.email,
            u.role
        FROM messages_admin m
        LEFT JOIN users u ON m.user_id = u.id
        WHERE 1=1
    ";
    
    $params = [];
    
    if ($type && $type !== 'all') {
        $sql .= " AND m.type = ?";
        $params[] = $type;
    }
    
    if ($is_lu !== null && $is_lu !== '') {
        $sql .= " AND m.is_lu = ?";
        $params[] = (int)$is_lu;
    }
    
    $sql .= " ORDER BY m.created_at DESC LIMIT ? OFFSET ?";
    $params[] = (int)$limit;
    $params[] = (int)$offset;
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Compter le total
    $countSql = "SELECT COUNT(*) FROM messages_admin WHERE 1=1";
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
    
    // Compter les non lus
    $nonLuStmt = $pdo->query("SELECT COUNT(*) FROM messages_admin WHERE is_lu = 0");
    $non_lus = $nonLuStmt->fetchColumn();
    
    echo json_encode([
        "status" => "success",
        "messages" => $messages,
        "total" => (int)$total,
        "non_lus" => (int)$non_lus,
        "limit" => (int)$limit,
        "offset" => (int)$offset
    ]);
    
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Erreur: " . $e->getMessage()]);
}
?>

