<?php
// Ce fichier permet d'envoyer un message à un producteur

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Gérer les requêtes OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once("../../config/db.php");

$data = json_decode(file_get_contents("php://input"), true);

$sender_id = $data['sender_id'] ?? null;           // ID de l'admin
$sender_name = $data['sender_name'] ?? 'Admin';    // Nom de l'admin
$recipient_id = $data['recipient_id'] ?? null;     // ID du producteur
$sujet = $data['sujet'] ?? 'Message du système';
$message = $data['message'] ?? null;
$product_id = $data['product_id'] ?? null;         // ID du produit (optionnel)

// Validation
if (!$message || !$recipient_id) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Message et destinataire requis"
    ]);
    exit;
}

try {
    // Vérifier que le destinataire existe et est un producteur
    $checkSql = "SELECT id, role FROM users WHERE id = ? AND role = 'PRODUCTEUR'";
    $checkStmt = $pdo->prepare($checkSql);
    $checkStmt->execute([$recipient_id]);
    $recipient = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$recipient) {
        http_response_code(404);
        echo json_encode([
            "status" => "error",
            "message" => "Producteur non trouvé"
        ]);
        exit;
    }
    
    // Créer le message
    // Générer un UUID
    $message_id = sprintf(
        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
    
    $sql = "INSERT INTO messages (id, sender_id, sender_name, recipient_id, sujet, message, product_id, created_at, is_read) 
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 0)";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $message_id,
        $sender_id ?? null,
        $sender_name,
        $recipient_id,
        $sujet,
        $message,
        $product_id
    ]);
    
    echo json_encode([
        "status" => "success",
        "message" => "Message envoyé au producteur avec succès!"
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
