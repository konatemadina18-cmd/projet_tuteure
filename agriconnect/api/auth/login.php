<?php
// Ce fichier permet à un utilisateur de se connecter à son compte


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

// Je récupère les informations de connexion que l'utilisateur a envoyées
// Comme si je lisait un formulaire de connexion
$data = json_decode(file_get_contents("php://input"), true);

// Je prends l'email et le mot de passe
$email = $data['email'] ?? null;           // Son adresse email
$mot_de_passe = $data['mot_de_passe'] ?? null; // Son mot de passe

// Je vérifie qu'on m'a bien donné email et mot de passe
if (!$email || !$mot_de_passe) {
    echo json_encode(["status" => "error", "message" => "Email et mot de passe requis."]);
    exit; // Je m'arrête si quelque chose manque
}

// Je vérifie que l'email a un format valide
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["status" => "error", "message" => "L'adresse email n'est pas valide."]);
    exit; // Je m'arrête si l'email est mal écrit
}

// Maintenant je cherche l'utilisateur dans la base de données par son email
// Comme si je cherchais un dossier dans un classeur
$stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
$stmt->bind_param("s", $email); // Je lie l'email à la requête
$stmt->execute(); // J'exécute la recherche
$result = $stmt->get_result(); // Je récupère le résultat

// Si je trouve un utilisateur avec cet email
if ($result->num_rows > 0) {
    $user = $result->fetch_assoc(); // Je récupère toutes ses informations
    
    // Maintenant je vérifie si le mot de passe est correct
    // password_verify() compare le mot de passe tapé avec le mot de passe haché dans la base
    // C'est comme comparer une empreinte digitale
    if (password_verify($mot_de_passe, $user['mot_de_passe'])) {
        //  MOT DE PASSE CORRECT ! Connexion réussie !
        
        // Je prépare les informations à renvoyer au frontend
        // Mais j'enlève le mot de passe pour la sécurité !
        $user_info = [
            "id" => $user['id'],
            "nom" => $user['nom'],
            "prenom" => $user['prenom'],
            "nom_complet" => $user['prenom'] . " " . $user['nom'],
            "email" => $user['email'],
            "telephone" => $user['telephone'],
            "role" => $user['role'],
            "commune" => $user['commune'],
            "age" => $user['age'] ?? null,
            "date_naissance" => $user['date_naissance'] ?? null
        ];
        
        // Si c'est un producteur, je récupère aussi les infos de son exploitation
        if ($user['role'] === 'PRODUCTEUR') {
            $profile_stmt = $conn->prepare("SELECT * FROM profile_producteurs WHERE user_id = ?");
            $profile_stmt->bind_param("s", $user['id']);
            $profile_stmt->execute();
            $profile_result = $profile_stmt->get_result();
            
            if ($profile_result->num_rows > 0) {
                $profile = $profile_result->fetch_assoc();
                $user_info['profile_producteur'] = [
                    "nom_exploitation" => $profile['nom_exploitation'],
                    "description" => $profile['description'],
                    "annees_experience" => $profile['annees_experience'],
                    "adresse" => $profile['adresse']
                ];
            }
        }
        
        // Tout est bon ! Je renvoie un message de succès avec les infos utilisateur
        echo json_encode([
            "status" => "success",
            "message" => "Connexion réussie ! Bienvenue " . $user['prenom'] . " ! 👋",
            "user" => $user_info
        ]);
        
    } else {
        //  Mot de passe incorrect
        echo json_encode(["status" => "error", "message" => "Mot de passe incorrect."]);
    }
} else {
    //  Aucun utilisateur trouvé avec cet email
    echo json_encode(["status" => "error", "message" => "Aucun compte trouvé avec cet email."]);
}

// Je ferme la connexion à la base
$conn->close();
?>
