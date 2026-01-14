<?php
// Ce fichier permet à un utilisateur de changer son mot de passe


header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: PUT");
header("Access-Control-Allow-Headers: Content-Type");

require_once("../../config/db.php");

// Je récupère les informations
$data = json_decode(file_get_contents("php://input"), true);

$user_id = $data['user_id'] ?? null;
$ancien_mot_de_passe = $data['ancien_mot_de_passe'] ?? null;
$nouveau_mot_de_passe = $data['nouveau_mot_de_passe'] ?? null;
$confirmation_mot_de_passe = $data['confirmation_mot_de_passe'] ?? null;

// Je vérifie tous les champs
if (!$user_id || !$ancien_mot_de_passe || !$nouveau_mot_de_passe || !$confirmation_mot_de_passe) {
    echo json_encode(["status" => "error", "message" => "Tous les champs sont requis."]);
    exit;
}

// Je vérifie que les nouveaux mots de passe correspondent
if ($nouveau_mot_de_passe !== $confirmation_mot_de_passe) {
    echo json_encode(["status" => "error", "message" => "Les nouveaux mots de passe ne correspondent pas."]);
    exit;
}

// Je vérifie que le nouveau mot de passe est assez fort
if (strlen($nouveau_mot_de_passe) < 6) {
    echo json_encode(["status" => "error", "message" => "Le mot de passe doit contenir au moins 6 caractères."]);
    exit;
}

try {
    // Je récupère le mot de passe actuel
    $stmt = $pdo->prepare("SELECT mot_de_passe FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        echo json_encode(["status" => "error", "message" => "Utilisateur non trouvé."]);
        exit;
    }
    
    // Je vérifie que l'ancien mot de passe est correct
    if (!password_verify($ancien_mot_de_passe, $user['mot_de_passe'])) {
        echo json_encode(["status" => "error", "message" => "Ancien mot de passe incorrect."]);
        exit;
    }
    
    // Je hache le nouveau mot de passe
    $nouveau_mot_de_passe_hache = password_hash($nouveau_mot_de_passe, PASSWORD_DEFAULT);
    
    // Je mets à jour le mot de passe
    $update_stmt = $pdo->prepare("UPDATE users SET mot_de_passe = ? WHERE id = ?");
    $update_stmt->execute([$nouveau_mot_de_passe_hache, $user_id]);
    
    echo json_encode([
        "status" => "success", 
        "message" => "Mot de passe changé avec succès !"
    ]);
    
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Erreur: " . $e->getMessage()]);
}
?>