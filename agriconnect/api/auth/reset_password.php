<?php
// Ce fichier permet de réinitialiser le mot de passe avec le code

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Gérer les requêtes OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once("../../config/connexion.php");

$data = json_decode(file_get_contents("php://input"), true);

$email = $data['email'] ?? null;
$reset_code = $data['reset_code'] ?? null;
$new_password = $data['new_password'] ?? null;
$confirm_password = $data['confirm_password'] ?? null;

if (!$email || !$reset_code || !$new_password || !$confirm_password) {
    echo json_encode(["status" => "error", "message" => "Tous les champs sont requis."]);
    exit;
}

// Vérifier que les mots de passe correspondent
if ($new_password !== $confirm_password) {
    echo json_encode(["status" => "error", "message" => "Les mots de passe ne correspondent pas."]);
    exit;
}

// Vérifier que le mot de passe est assez fort
if (strlen($new_password) < 6) {
    echo json_encode(["status" => "error", "message" => "Le mot de passe doit contenir au moins 6 caractères."]);
    exit;
}

try {
    // Vérifier l'utilisateur
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if (!$result || $result->num_rows === 0) {
        echo json_encode(["status" => "error", "message" => "Email non trouvé."]);
        exit;
    }
    
    $user = $result->fetch_assoc();
    $user_id = $user['id'];
    
    // Vérifier le code de réinitialisation
    $check_code = $conn->prepare("
        SELECT id FROM password_resets 
        WHERE user_id = ? AND reset_code = ? AND expires_at > NOW() AND used = 0
        ORDER BY created_at DESC LIMIT 1
    ");
    $check_code->bind_param("ss", $user_id, $reset_code);
    $check_code->execute();
    $code_result = $check_code->get_result();
    
    if (!$code_result || $code_result->num_rows === 0) {
        echo json_encode(["status" => "error", "message" => "Code invalide ou expiré."]);
        exit;
    }
    
    // Hacher le nouveau mot de passe
    $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
    
    // Mettre à jour le mot de passe
    $update_stmt = $conn->prepare("UPDATE users SET mot_de_passe = ? WHERE id = ?");
    $update_stmt->bind_param("ss", $hashed_password, $user_id);
    $update_stmt->execute();
    
    // Marquer le code comme utilisé
    $mark_used = $conn->prepare("UPDATE password_resets SET used = 1 WHERE user_id = ? AND reset_code = ?");
    $mark_used->bind_param("ss", $user_id, $reset_code);
    $mark_used->execute();
    
    echo json_encode([
        "status" => "success",
        "message" => "Mot de passe réinitialisé avec succès !"
    ]);
    
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Erreur: " . $e->getMessage()]);
}
?>

