<?php
// Ce fichier permet d'envoyer un message entre n'importe quel utilisateurs

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

$sender_id = $data['sender_id'] ?? null;
$sender_name = $data['sender_name'] ?? 'Utilisateur';
$recipient_id = $data['recipient_id'] ?? null;
$sujet = $data['sujet'] ?? 'Message';
$message = $data['message'] ?? null;
$product_id = $data['product_id'] ?? null;

// Validation
if (!$message || !$recipient_id || !$sender_id) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Message, expéditeur et destinataire requis"
    ]);
    exit;
}

try {
    // Vérifier que le destinataire existe
    // D'abord chercher dans users (cas normal)
    $checkSql = "SELECT id FROM users WHERE id = ?";
    $checkStmt = $pdo->prepare($checkSql);
    $checkStmt->execute([$recipient_id]);
    $recipient = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    // Si pas trouvé dans users, chercher dans profile_producteurs (producteur)
    if (!$recipient) {
        $checkSql = "SELECT user_id FROM profile_producteurs WHERE id = ?";
        $checkStmt = $pdo->prepare($checkSql);
        $checkStmt->execute([$recipient_id]);
        $producteur = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$producteur) {
            http_response_code(404);
            echo json_encode([
                "status" => "error",
                "message" => "Destinataire non trouvé"
            ]);
            exit;
        }
        
        // Utiliser le user_id du producteur comme vrai destinataire
        $recipient_id = $producteur['user_id'];
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
    
    $sql = "INSERT INTO messages (id, sender_id, sender_name, recipient_id, sujet, message, product_id, is_read, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 0, NOW())";
    
    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute([$message_id, $sender_id, $sender_name, $recipient_id, $sujet, $message, $product_id]);
    
    if ($result) {
        http_response_code(201);
        echo json_encode([
            "status" => "success",
            "message" => "Message envoyé avec succès",
            "message_id" => $message_id
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            "status" => "error",
            "message" => "Erreur lors de l'enregistrement du message"
        ]);
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Erreur serveur: " . $e->getMessage()
    ]);
}
?>
