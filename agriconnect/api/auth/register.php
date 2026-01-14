<?php
// Ce fichier permet à un nouvel utilisateur de créer son compte
// Comme quand on remplit une fiche d'inscription complète

// Je dis au navigateur que je vais envoyer du JSON
header("Content-Type: application/json");
// Je autorise d'autres sites à appeler cette API (pour le frontend)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Gérer les requêtes OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// J'inclus mes fichiers de configuration
require_once("../../config/connexion.php");

// Je récupère les informations que l'utilisateur a envoyées
// Comme si je lisais un formulaire qu'il a rempli
$data = json_decode(file_get_contents("php://input"), true);

// Je prends chaque information une par une
$nom = $data['nom'] ?? null;                    // Son nom de famille
$prenom = $data['prenom'] ?? null;              // Son prénom
$email = $data['email'] ?? null;                // Son adresse email
$telephone = $data['telephone'] ?? null;        // Son numéro de téléphone
$mot_de_passe = $data['mot_de_passe'] ?? null;  // Son mot de passe
$confirmation_mdp = $data['confirmation_mdp'] ?? null; // La confirmation du mot de passe
$role = $data['role'] ?? 'ACHETEUR';            // Son rôle (acheteur, producteur, etc.)
$commune = $data['commune'] ?? 'Bouaké-Ville';  // Où il habite
$admin_code = $data['admin_code'] ?? null;      // Code secret pour créer un compte admin

// Formater le numéro de téléphone pour la Côte d'Ivoire (+225)
if ($telephone) {
    // Nettoyer le numéro (supprimer espaces, tirets, etc.)
    $telephone = preg_replace('/[\s\-\(\)]/', '', $telephone);
    
    // Si le numéro ne commence pas par +225, l'ajouter
    if (!preg_match('/^\+225/', $telephone)) {
        // Supprimer le 0 initial si présent (format local)
        $telephone = preg_replace('/^0+/', '', $telephone);
        // Ajouter l'indicatif de la Côte d'Ivoire
        $telephone = '+225' . $telephone;
    }
}

// Maintenant je vérifie TOUTES les informations une par une
// Comme un professeur qui vérifie une copie

// Je vérifie d'abord les champs obligatoires
if (!$nom || !$prenom || !$email || !$telephone || !$mot_de_passe || !$confirmation_mdp) {
    echo json_encode(["status" => "error", "message" => "Tous les champs obligatoires doivent être remplis."]);
    exit; // Je m'arrête si quelque chose manque
}

// Je vérifie que le mot de passe et la confirmation sont identiques
// Comme quand on tape deux fois son code secret
if ($mot_de_passe !== $confirmation_mdp) {
    echo json_encode(["status" => "error", "message" => "Les mots de passe ne correspondent pas."]);
    exit; // Je m'arrête si les mots de passe sont différents
}

// Je vérifie que le mot de passe est assez fort (au moins 6 caractères)
if (strlen($mot_de_passe) < 6) {
    echo json_encode(["status" => "error", "message" => "Le mot de passe doit contenir au moins 6 caractères."]);
    exit; // Je m'arrête si le mot de passe est trop court
}

// Je vérifie que l'email a un format valide
// Comme quand on vérifie qu'une adresse est bien écrite
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["status" => "error", "message" => "L'adresse email n'est pas valide."]);
    exit; // Je m'arrête si l'email est mal écrit
}

// Je vérifie si l'email existe déjà dans la base
// Pour éviter que deux personnes aient le même email
// NOTE : Vérifie dans la table 'users'
$check_email = $conn->prepare("SELECT id FROM users WHERE email = ?");
if ($check_email) {
    $check_email->bind_param("s", $email);
    $check_email->execute();
    $result_email = $check_email->get_result();
    
    // Si je trouve déjà cet email dans la base
    if ($result_email && $result_email->num_rows > 0) {
        echo json_encode(["status" => "error", "message" => "Cet email est déjà utilisé."]);
        $check_email->close();
        $conn->close();
        exit; // Je m'arrête, l'email est déjà pris
    }
    $check_email->close();
} else {
    // Si la requête échoue, logger l'erreur mais continuer
    error_log("Erreur préparation requête email: " . $conn->error);
}

// Je vérifie si le numéro de téléphone existe déjà dans la base
// Pour éviter que deux personnes aient le même numéro
// NOTE : Vérifie dans la table 'users'
$check_telephone = $conn->prepare("SELECT id FROM users WHERE telephone = ?");
if ($check_telephone) {
    $check_telephone->bind_param("s", $telephone);
    $check_telephone->execute();
    $result_telephone = $check_telephone->get_result();
    
    // Si je trouve déjà ce numéro dans la base
    if ($result_telephone && $result_telephone->num_rows > 0) {
        echo json_encode(["status" => "error", "message" => "Ce numéro de téléphone est déjà utilisé."]);
        $check_telephone->close();
        $conn->close();
        exit; // Je m'arrête, le numéro est déjà pris
    }
    $check_telephone->close();
} else {
    // Si la requête échoue, logger l'erreur mais continuer
    error_log("Erreur préparation requête téléphone: " . $conn->error);
}

// Vérification spéciale pour le rôle ADMIN
// Un code secret est requis pour créer un compte administrateur
if ($role === 'ADMIN') {
    // Charger la configuration admin
    require_once("../../config/admin_config.php");
    
    if (!$admin_code || $admin_code !== ADMIN_SECRET_CODE) {
        echo json_encode(["status" => "error", "message" => "Code administrateur invalide. Vous n'êtes pas autorisé à créer un compte admin."]);
        $conn->close();
        exit;
    }
    
    // Vérifier qu'il n'y a pas déjà trop d'admins (si limite définie)
    if (MAX_ADMINS > 0) {
        $check_admin = $conn->prepare("SELECT COUNT(*) as nb_admins FROM users WHERE role = 'ADMIN'");
        if ($check_admin) {
            $check_admin->execute();
            $result_admin = $check_admin->get_result();
            $nb_admins = $result_admin->fetch_assoc()['nb_admins'] ?? 0;
            
            if ($nb_admins >= MAX_ADMINS) {
                echo json_encode(["status" => "error", "message" => "Nombre maximum d'administrateurs atteint (" . MAX_ADMINS . ")."]);
                $check_admin->close();
                $conn->close();
                exit;
            }
            $check_admin->close();
        }
    }
}

// Si tout est bon jusqu'ici, je peux créer le compte !
// Je commence par hacher le mot de passe pour la sécurité
// Comme si je mettais le mot de passe dans un coffre-fort
$mot_de_passe_hache = password_hash($mot_de_passe, PASSWORD_DEFAULT);

// Maintenant je crée le nouvel utilisateur dans la base
// Je génère un UUID pour l'ID
$user_id = bin2hex(random_bytes(16)); // Génère un ID unique de 32 caractères

// Je prépare ma requête SQL avec tous les champs nécessaires
$stmt = $conn->prepare("INSERT INTO users (id, nom, prenom, email, telephone, mot_de_passe, role, commune) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
$stmt->bind_param("ssssssss", $user_id, $nom, $prenom, $email, $telephone, $mot_de_passe_hache, $role, $commune);

// J'essaie de sauvegarder dans la base
if ($stmt->execute()) {
    // Si l'insertion a marché, je crée le profil producteur si nécessaire
    if ($role === 'PRODUCTEUR') {
        $profile_id = bin2hex(random_bytes(16)); // ID unique pour le profil
        $nom_exploitation = "Exploitation de " . $prenom . " " . $nom;
        
        // Je crée le profil du producteur avec un nom d'exploitation par défaut
        // NOTE : Vérifie si la table profile_producteurs existe
        $profile_stmt = $conn->prepare("INSERT INTO profile_producteurs (id, user_id, nom_exploitation) VALUES (?, ?, ?)");
        if ($profile_stmt) {
            $profile_stmt->bind_param("sss", $profile_id, $user_id, $nom_exploitation);
            $profile_stmt->execute();
            
            // Vérifier si l'insertion a réussi
            if ($profile_stmt->error) {
                error_log("Erreur création profil producteur: " . $profile_stmt->error);
            }
            
            $profile_stmt->close();
        } else {
            // Si la table n'existe pas, logger mais continuer
            error_log("Table profile_producteurs non trouvée, création profil ignorée");
        }
    }
    
    // Je notifie tous les administrateurs de la nouvelle inscription
    // Utiliser PDO pour la cohérence avec le système de notifications
    try {
        require_once("../../config/db.php");
        require_once("../../config/notifications_helper.php");
        
        // Définir le type et le titre selon le rôle
        switch ($role) {
            case 'PRODUCTEUR':
                $type_notif = 'PRODUCTEUR';
                $titre = 'Nouveau producteur inscrit';
                break;
            case 'LIVREUR':
                $type_notif = 'LIVREUR';
                $titre = 'Nouveau livreur inscrit';
                break;
            case 'ACHETEUR':
                $type_notif = 'UTILISATEUR';
                $titre = 'Nouvel acheteur inscrit';
                break;
            case 'ADMIN':
                $type_notif = 'SYSTEME';
                $titre = 'Nouvel administrateur inscrit';
                break;
            default:
                $type_notif = 'UTILISATEUR';
                $titre = 'Nouvel utilisateur inscrit';
        }
        
        $message = "Nouveau " . strtolower($role) . " inscrit: " . $prenom . " " . $nom . " (" . $email . ", " . $telephone . "). Commune: " . $commune . ". Date d'inscription: " . date('d/m/Y à H:i');
        
        notifyAllAdmins($pdo, $titre, $message, $type_notif);
    } catch (Exception $e) {
        error_log("Erreur lors de la création de la notification admin: " . $e->getMessage());
        // On continue même si la notification échoue
    }
    
    // Envoyer un SMS de bienvenue à l'utilisateur
    try {
        require_once("../../config/sms_helper.php");
        
        $smsResult = sendWelcomeSMS($telephone, $prenom, $role);
        
        if ($smsResult['success']) {
            error_log("✅ SMS de bienvenue envoyé à: $telephone");
        } else {
            error_log("⚠️ Échec envoi SMS: " . $smsResult['message']);
            // On continue même si l'envoi SMS échoue
        }
    } catch (Exception $e) {
        error_log("❌ Erreur lors de l'envoi du SMS: " . $e->getMessage());
        // On continue même si l'envoi SMS échoue
    }
    
    // Tout s'est bien passé ! Je renvoie un message de succès
    echo json_encode([
        "status" => "success", 
        "message" => "Compte créé avec succès ! Bienvenue " . $prenom . " !",
        "user_info" => [
            "id" => $user_id,
            "nom" => $nom,
            "prenom" => $prenom,
            "nom_complet" => $prenom . " " . $nom,
            "email" => $email,
            "telephone" => $telephone,
            "role" => $role,
            "commune" => $commune
        ]
    ]);
} else {
    // Si ça n'a pas marché, j'affiche l'erreur
    echo json_encode(["status" => "error", "message" => "Erreur lors de la création du compte: " . $stmt->error]);
}

$conn->close();
?>
