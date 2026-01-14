<?php
// Ce fichier permet à un utilisateur de modifier son profil

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: PUT");
header("Access-Control-Allow-Headers: Content-Type");

require_once("../../config/db.php");
require_once("../../config/localite.php");

// Je récupère les informations de modification
$data = json_decode(file_get_contents("php://input"), true);

$user_id = $data['user_id'] ?? null; // L'ID de l'utilisateur

// Je vérifie qu'on m'a bien donné un ID
if (!$user_id) {
    echo json_encode(["status" => "error", "message" => "ID utilisateur requis."]);
    exit;
}

// Je prépare les champs à modifier
$champs_a_modifier = [];
$valeurs = [];

// Vérification et préparation de chaque champ

// Modification du nom
if (isset($data['nom'])) {
    $champs_a_modifier[] = "nom = ?";
    $valeurs[] = $data['nom'];
}

// Modification du prénom
if (isset($data['prenom'])) {
    $champs_a_modifier[] = "prenom = ?";
    $valeurs[] = $data['prenom'];
}

// Modification de l'email
if (isset($data['email'])) {
    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        echo json_encode(["status" => "error", "message" => "Email invalide."]);
        exit;
    }
    
    // Je vérifie que l'email n'est pas déjà utilisé par un autre utilisateur
    $check_email = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
    $check_email->execute([$data['email'], $user_id]);
    if ($check_email->rowCount() > 0) {
        echo json_encode(["status" => "error", "message" => "Cet email est déjà utilisé."]);
        exit;
    }
    
    $champs_a_modifier[] = "email = ?";
    $valeurs[] = $data['email'];
}

// Modification du téléphone
if (isset($data['telephone'])) {
    // Je vérifie que le téléphone n'est pas déjà utilisé
    $check_tel = $pdo->prepare("SELECT id FROM users WHERE telephone = ? AND id != ?");
    $check_tel->execute([$data['telephone'], $user_id]);
    if ($check_tel->rowCount() > 0) {
        echo json_encode(["status" => "error", "message" => "Ce numéro est déjà utilisé."]);
        exit;
    }
    
    $champs_a_modifier[] = "telephone = ?";
    $valeurs[] = $data['telephone'];
}

// Modification de la commune
if (isset($data['commune'])) {
    if (!in_array($data['commune'], $CONFIG_BOUAKE['communes'])) {
        echo json_encode(["status" => "error", "message" => "Commune invalide."]);
        exit;
    }
    $champs_a_modifier[] = "commune = ?";
    $valeurs[] = $data['commune'];
}

// Si c'est un producteur, je gère aussi son profil producteur
if (isset($data['profile_producteur'])) {
    $profile_data = $data['profile_producteur'];
    
    // Je vérifie si le profil producteur existe déjà
    $check_profile = $pdo->prepare("SELECT id FROM profile_producteurs WHERE user_id = ?");
    $check_profile->execute([$user_id]);
    
    if ($check_profile->rowCount() > 0) {
        // Mise à jour du profil existant
        $profile_champs = [];
        $profile_valeurs = [];
        
        if (isset($profile_data['nom_exploitation'])) {
            $profile_champs[] = "nom_exploitation = ?";
            $profile_valeurs[] = $profile_data['nom_exploitation'];
        }
        
        if (isset($profile_data['description'])) {
            $profile_champs[] = "description = ?";
            $profile_valeurs[] = $profile_data['description'];
        }
        
        if (isset($profile_data['annees_experience'])) {
            $profile_champs[] = "annees_experience = ?";
            $profile_valeurs[] = $profile_data['annees_experience'];
        }
        
        if (isset($profile_data['adresse'])) {
            $profile_champs[] = "adresse = ?";
            $profile_valeurs[] = $profile_data['adresse'];
        }
        
        if (!empty($profile_champs)) {
            $profile_valeurs[] = $user_id; // Pour le WHERE
            $profile_sql = "UPDATE profile_producteurs SET " . implode(", ", $profile_champs) . " WHERE user_id = ?";
            $profile_stmt = $pdo->prepare($profile_sql);
            $profile_stmt->execute($profile_valeurs);
        }
    }
}

// Si aucun champ n'est à modifier pour l'utilisateur principal
if (empty($champs_a_modifier)) {
    echo json_encode(["status" => "success", "message" => "Aucune modification apportée."]);
    exit;
}

// J'ajoute l'ID à la fin pour le WHERE
$valeurs[] = $user_id;

try {
    // Je mets à jour l'utilisateur
    $sql = "UPDATE users SET " . implode(", ", $champs_a_modifier) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($valeurs);
    
    echo json_encode([
        "status" => "success", 
        "message" => "Profil mis à jour avec succès !",
        "modifications" => $champs_a_modifier
    ]);
    
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Erreur: " . $e->getMessage()]);
}
?>