<?php
// Ce fichier permet de récupérer le profil complet d'un utilisateur


header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Gérer les requêtes OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once("../../config/db.php");

// Je récupère l'ID de l'utilisateur
$data = json_decode(file_get_contents("php://input"), true);
$user_id = $data["user_id"] ?? null;

// Je vérifie qu'on m'a bien donné un ID
if (!$user_id) {
    echo json_encode(["status" => "error", "message" => "ID utilisateur requis."]);
    exit;
}

try {
    // Je récupère les informations de base de l'utilisateur
    $stmt = $pdo->prepare("SELECT id, nom, prenom, email, telephone, role, commune, age, date_naissance, created_at FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        echo json_encode(["status" => "error", "message" => "Utilisateur non trouvé."]);
        exit;
    }
    
    $profile_complet = $user;
    
    // Selon le rôle, je récupère des informations supplémentaires
    switch ($user["role"]) {
        case "PRODUCTEUR":
            $stmt_prod = $pdo->prepare("SELECT * FROM profile_producteurs WHERE user_id = ?");
            $stmt_prod->execute([$user_id]);
            $profile_prod = $stmt_prod->fetch(PDO::FETCH_ASSOC);
            
            if ($profile_prod) {
                $profile_complet['profile_producteur'] = $profile_prod;
                
                // Je récupère aussi les statistiques du producteur
                $stats_prod = $pdo->prepare("
                    SELECT COUNT(*) as total_produits, 
                           SUM(stock) as total_stock,
                           AVG(prix) as prix_moyen
                    FROM produits 
                    WHERE producteur_id = ? AND is_active = 1
                ");
                $stats_prod->execute([$profile_prod['id']]);
                $profile_complet['statistiques'] = $stats_prod->fetch(PDO::FETCH_ASSOC);
            }
            break;
            
        case "ACHETEUR":
            // Je récupère les statistiques de l'acheteur
            $stats_acheteur = $pdo->prepare("
                SELECT COUNT(*) as total_commandes,
                       SUM(total) as total_depense,
                       AVG(total) as moyenne_commande
                FROM commandes 
                WHERE acheteur_id = ?
            ");
            $stats_acheteur->execute([$user_id]);
            $profile_complet['statistiques'] = $stats_acheteur->fetch(PDO::FETCH_ASSOC);
            break;
            
        case "LIVREUR":
            // Je pourrais ajouter des infos spécifiques aux livreurs plus tard
            break;
    }
    
    echo json_encode([
        "status" => "success",
        "profile" => $profile_complet
    ]);
    
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Erreur: " . $e->getMessage()]);
}
?>