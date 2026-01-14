<?php
// FICHIER : api/products/get_products_simple.php
// BUT : Récupérer tous les produits disponibles (version simple sans JOIN)
// NOTE : Version simplifiée qui fonctionne avec la table produits basique

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Gérer les requêtes OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once("../../config/connexion.php");

// Je récupère les filtres que l'utilisateur a choisis
$commune = $_GET['commune'] ?? null;
$categorie = $_GET['categorie'] ?? null;
$search = $_GET['search'] ?? null;

// Vérifier d'abord si la colonne image existe
$has_image_column = false;
try {
    $check_img = $conn->query("SHOW COLUMNS FROM produits LIKE 'image'");
    if ($check_img && $check_img->num_rows > 0) {
        $has_image_column = true;
    }
} catch (Exception $e) {
    // Colonne image n'existe pas, continuer sans
    $has_image_column = false;
}

// Construire la requête SQL avec ou sans la colonne image
$sql = "SELECT p.id, p.nom, p.description, p.prix, p.stock, p.unite, p.commune, p.producteur_id, 
               CONCAT(COALESCE(u.prenom, ''), ' ', COALESCE(u.nom, '')) AS producteur_nom
        FROM produits p
        LEFT JOIN profile_producteurs pp ON p.producteur_id = pp.id
        LEFT JOIN users u ON pp.user_id = u.id
        WHERE (p.is_active IS NULL OR p.is_active = 1) AND p.stock > 0";
        
if ($has_image_column) {
    $sql = "SELECT p.id, p.nom, p.description, p.prix, p.stock, p.unite, p.commune, p.producteur_id,
                   CONCAT(COALESCE(u.prenom, ''), ' ', COALESCE(u.nom, '')) AS producteur_nom, p.image
            FROM produits p
            LEFT JOIN profile_producteurs pp ON p.producteur_id = pp.id
            LEFT JOIN users u ON pp.user_id = u.id
            WHERE (p.is_active IS NULL OR p.is_active = 1) AND p.stock > 0";
}
        
$params = [];
$types = "";

// Ajouter les filtres
if ($commune && $commune !== 'all' && $commune !== '') {
    $sql .= " AND commune = ?";
    $params[] = $commune;
    $types .= "s";
}

if ($search && $search !== '') {
    $sql .= " AND (nom LIKE ? OR description LIKE ?)";
    $searchTerm = "%$search%";
    $params[] = $searchTerm;
    $params[] = $searchTerm;
    $types .= "ss";
}

$sql .= " ORDER BY nom ASC";

try {
    $stmt = $conn->prepare($sql);
    
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    $produits = [];
    
    while ($row = $result->fetch_assoc()) {
        $produit = [
            "id" => $row['id'],
            "nom" => $row['nom'],
            "description" => $row['description'] ?? 'Produit local de qualité',
            "prix" => floatval($row['prix'] ?? 0),
            "stock" => intval($row['stock'] ?? 0),
            "unite" => $row['unite'] ?? 'kg',
            "commune" => $row['commune'] ?? 'Bouaké-Ville',
            "producteur_id" => $row['producteur_id'] ?? null,
            "producteur" => $row['producteur_nom'] ?? 'Producteur local',
            "categorie" => $categorie ?? "Légumes"
        ];
        
        // Ajouter l'image si elle existe et n'est pas vide
        if ($has_image_column && isset($row['image']) && !empty(trim($row['image']))) {
            $produit["image"] = trim($row['image']);
        }
        
        $produits[] = $produit;
    }
    
    // Retourner les produits
    echo json_encode([
        "status" => "success",
        "produits" => $produits,
        "total" => count($produits)
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    error_log("❌ Erreur get_products_simple.php: " . $e->getMessage());
    
    // Si erreur liée à la colonne image, réessayer sans
    if (strpos($e->getMessage(), "Unknown column 'image'") !== false || strpos($e->getMessage(), "Unknown column") !== false) {
        try {
            // Réessayer sans la colonne image
            $sql_no_image = "SELECT p.id, p.nom, p.description, p.prix, p.stock, p.unite, p.commune, p.producteur_id,
                                    CONCAT(COALESCE(u.prenom, ''), ' ', COALESCE(u.nom, '')) AS producteur_nom
                            FROM produits p
                            LEFT JOIN profile_producteurs pp ON p.producteur_id = pp.id
                            LEFT JOIN users u ON pp.user_id = u.id
                            WHERE (p.is_active IS NULL OR p.is_active = 1) AND p.stock > 0";
            
            // Réappliquer les filtres
            if ($commune && $commune !== 'all' && $commune !== '') {
                $sql_no_image .= " AND commune = ?";
            }
            if ($search && $search !== '') {
                $sql_no_image .= " AND (nom LIKE ? OR description LIKE ?)";
            }
            $sql_no_image .= " ORDER BY nom ASC";
            
            $stmt2 = $conn->prepare($sql_no_image);
            if (!empty($params)) {
                $stmt2->bind_param($types, ...$params);
            }
            $stmt2->execute();
            $result2 = $stmt2->get_result();
            $produits = [];
            
            while ($row = $result2->fetch_assoc()) {
                $produits[] = [
                    "id" => $row['id'],
                    "nom" => $row['nom'],
                    "description" => $row['description'] ?? 'Produit local de qualité',
                    "prix" => floatval($row['prix'] ?? 0),
                    "stock" => intval($row['stock'] ?? 0),
                    "unite" => $row['unite'] ?? 'kg',
                    "commune" => $row['commune'] ?? 'Bouaké-Ville',
                    "producteur_id" => $row['producteur_id'] ?? null,
                    "producteur" => $row['producteur_nom'] ?? 'Producteur local',
                    "categorie" => $categorie ?? "Légumes"
                ];
                if ($has_image_column && isset($row['image'])) {
                    $produits[count($produits) - 1]['image'] = $row['image'];
                }
            }
            
            echo json_encode([
                "status" => "success",
                "produits" => $produits,
                "total" => count($produits)
            ], JSON_UNESCAPED_UNICODE);
            
            if (isset($conn) && $conn) {
                $conn->close();
            }
            exit;
        } catch (Exception $e2) {
            error_log("❌ Erreur secondaire get_products_simple.php: " . $e2->getMessage());
        }
    }
    
    // En cas d'erreur, retourner un tableau vide
    echo json_encode([
        "status" => "success",
        "produits" => [],
        "message" => "Aucun produit disponible",
        "error" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

if (isset($conn) && $conn) {
    $conn->close();
}
?>
