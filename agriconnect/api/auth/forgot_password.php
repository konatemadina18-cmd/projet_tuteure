<?php
// Ce fichier permet à un utilisateur de réinitialiser son mot de passe

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

if (!$email) {
    echo json_encode(["status" => "error", "message" => "Email requis."]);
    exit;
}

// Vérifier que l'email a un format valide
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["status" => "error", "message" => "L'adresse email n'est pas valide."]);
    exit;
}

try {
    // Vérifier si l'utilisateur existe
    $stmt = $conn->prepare("SELECT id, prenom, nom, email FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result && $result->num_rows > 0) {
        $user = $result->fetch_assoc();
        
        // Générer un code de réinitialisation (6 chiffres)
        $reset_code = sprintf("%06d", mt_rand(0, 999999));
        
        // Stocker le code dans la session ou dans une table temporaire
        // Pour simplifier, on va utiliser une table password_resets
        // Si elle n'existe pas, on peut aussi utiliser une variable de session
        
        // Créer la table si elle n'existe pas
        $create_table = $conn->query("
            CREATE TABLE IF NOT EXISTS password_resets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                reset_code VARCHAR(6) NOT NULL,
                expires_at DATETIME NOT NULL,
                used TINYINT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_code (user_id, reset_code),
                INDEX idx_expires (expires_at)
            )
        ");
        
        // Supprimer les codes expirés
        $conn->query("DELETE FROM password_resets WHERE expires_at < NOW() OR used = 1");
        
        // Insérer le nouveau code (valide pendant 1 heure)
        $expires_at = date('Y-m-d H:i:s', strtotime('+1 hour'));
        $insert_stmt = $conn->prepare("INSERT INTO password_resets (user_id, reset_code, expires_at) VALUES (?, ?, ?)");
        $insert_stmt->bind_param("sss", $user['id'], $reset_code, $expires_at);
        $insert_stmt->execute();
        
        // En production, envoyer le code par email ou SMS
        // Pour le développement, on retourne le code dans la réponse
        // ATTENTION: En production, ne JAMAIS retourner le code dans la réponse JSON
        
        echo json_encode([
            "status" => "success",
            "message" => "Code de réinitialisation généré. Vérifiez votre email.",
            // En développement seulement - À SUPPRIMER EN PRODUCTION
            "reset_code" => $reset_code,
            "debug_message" => "En production, ce code sera envoyé par email/SMS"
        ]);
        
    } else {
        // Pour la sécurité, ne pas révéler si l'email existe ou non
        echo json_encode([
            "status" => "success",
            "message" => "Si cet email existe, un code de réinitialisation a été envoyé."
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Erreur: " . $e->getMessage()]);
}
?>

