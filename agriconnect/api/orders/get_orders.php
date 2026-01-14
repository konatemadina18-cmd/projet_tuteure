<?php
// Ce fichier permet de récupérer la liste des commandes

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Gérer les requêtes OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once("../../config/db.php");

// Je récupère les paramètres de filtre
$user_id = $_GET['user_id'] ?? null;     // Pour filtrer par utilisateur
$user_role = $_GET['user_role'] ?? null; // Le rôle de l'utilisateur
$statut = $_GET['statut'] ?? null;       // Pour filtrer par statut

try {
    // Je construis la requête SQL avec numéro de commande séquentiel
    // Version simplifiée pour éviter les erreurs
    $sql = "SELECT c.id, 
                   COALESCE(c.total, 0) as total, 
                   COALESCE(c.statut, 'EN_ATTENTE') as statut, 
                   COALESCE(c.commune_livraison, 'Bouaké-Ville') as commune_livraison, 
                   COALESCE(c.frais_livraison, 0) as frais_livraison, 
                   COALESCE(c.created_at, NOW()) as created_at,
                   u.prenom, u.nom, u.telephone,
                   p.statut as statut_paiement, 
                   p.moyen as moyen_paiement
            FROM commandes c
            JOIN users u ON c.acheteur_id = u.id
            LEFT JOIN paiements p ON c.id = p.commande_id
            WHERE 1=1"; // 1=1 pour pouvoir ajouter des conditions facilement

    $params = [];

    // Si on veut les commandes d'un utilisateur spécifique
    if ($user_id) {
        if ($user_role === 'ACHETEUR') {
            // Un acheteur voit seulement SES commandes
            $sql .= " AND c.acheteur_id = ?";
            $params[] = $user_id;
        }
        // Un admin ou producteur verrait toutes les commandes
    }

    // Filtre par statut
    if ($statut && $statut !== 'all') {
        $sql .= " AND c.statut = ?";
        $params[] = $statut;
    }

    $sql .= " ORDER BY COALESCE(c.created_at, NOW()) DESC";

    $stmt = $pdo->prepare($sql);
    
    if (!empty($params)) {
        $stmt->execute($params);
    } else {
        $stmt->execute();
    }
    
    $commandes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Logger pour débogage
    error_log("get_orders.php - Nombre de commandes trouvées: " . count($commandes));
    error_log("get_orders.php - Paramètres: user_id=" . ($user_id ?? 'null') . ", user_role=" . ($user_role ?? 'null'));
    
    // Calculer le numéro séquentiel pour chaque commande (après le tri)
    $index = 1;
    foreach ($commandes as &$commande) {
        $commande['numero'] = $index++;
        try {
            // Vérifier si la table commande_items existe
            $stmt_items = $pdo->prepare("
                SELECT ci.quantite, ci.prix_unitaire, 
                       p.nom as produit_nom, p.unite,
                       COALESCE(pp.nom_exploitation, CONCAT(u.prenom, ' ', u.nom), 'Producteur') as producteur
                FROM commande_items ci
                JOIN produits p ON ci.produit_id = p.id
                LEFT JOIN profile_producteurs pp ON p.producteur_id = pp.id
                LEFT JOIN users u ON p.producteur_id = u.id
                WHERE ci.commande_id = ?
            ");
            $stmt_items->execute([$commande['id']]);
            $commande['items'] = $stmt_items->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            // Si la table n'existe pas ou erreur, créer un tableau vide
            error_log("Erreur récupération items commande " . $commande['id'] . ": " . $e->getMessage());
            $commande['items'] = [];
        }
        
        // S'assurer que les champs numériques sont bien des nombres
        $commande['total'] = floatval($commande['total'] ?? 0);
        $commande['frais_livraison'] = floatval($commande['frais_livraison'] ?? 0);
        
        // S'assurer que created_at existe
        if (empty($commande['created_at'])) {
            $commande['created_at'] = date('Y-m-d H:i:s');
        }
    }
    
    echo json_encode([
        "status" => "success",
        "commandes" => $commandes,
        "total" => count($commandes)
    ], JSON_UNESCAPED_UNICODE);
    
} catch (PDOException $e) {
    error_log("Erreur PDO get_orders.php: " . $e->getMessage());
    error_log("Trace: " . $e->getTraceAsString());
    error_log("SQL: " . ($sql ?? 'non défini'));
    error_log("Params: " . json_encode($params ?? []));
    
    // En mode développement, retourner plus de détails
    $error_message = "Erreur lors de la récupération des commandes.";
    if (isset($_GET['debug']) && $_GET['debug'] === '1') {
        $error_message .= " " . $e->getMessage();
    }
    
    echo json_encode([
        "status" => "error", 
        "message" => $error_message,
        "error_details" => (isset($_GET['debug']) && $_GET['debug'] === '1' ? $e->getMessage() : null)
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    error_log("Erreur générale get_orders.php: " . $e->getMessage());
    echo json_encode([
        "status" => "error", 
        "message" => "Erreur: " . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>