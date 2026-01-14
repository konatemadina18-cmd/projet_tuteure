<?php
// Ce fichier permet à un producteur d'ajouter un nouveau produit à vendre

// Je dis au navigateur que je vais envoyer du JSON
header("Content-Type: application/json; charset=utf-8");
// Je autorise d'autres sites à appeler cette API (pour le frontend)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Max-Age: 3600");

// Gérer les requêtes OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// J'inclus mes fichiers de configuration
require_once("../../config/db.php");
require_once("../../config/localite.php");
require_once("../../config/notifications_helper.php");

// Je récupère les informations du produit que le producteur a envoyées
$raw_input = file_get_contents("php://input");
error_log("📥 Données brutes reçues: " . substr($raw_input, 0, 500)); // Logger les 500 premiers caractères

$data = json_decode($raw_input, true);

// Vérifier si le JSON a été correctement décodé
if (json_last_error() !== JSON_ERROR_NONE) {
    error_log("❌ Erreur décodage JSON: " . json_last_error_msg());
    echo json_encode([
        "status" => "error", 
        "message" => "Données invalides reçues. Erreur JSON: " . json_last_error_msg()
    ]);
    exit;
}

error_log("📦 Données décodées: " . json_encode($data, JSON_UNESCAPED_UNICODE));

// Je prends chaque information une par une
$nom = $data["nom"] ?? null;                    // Le nom du produit (ex: "Tomates")
$description = $data["description"] ?? "";      // La description du produit
$prix = $data["prix"] ?? null;                  // Le prix en FCFA
$stock = $data["stock"] ?? null;                // La quantité disponible
$unite = $data["unite"] ?? "kg";                // L'unité (kg, litre, pièce...)
$categorie_id = $data["categorie_id"] ?? null;  // L'ID de la catégorie
$producteur_id = $data["producteur_id"] ?? null; // L'ID du producteur
$commune = $data["commune"] ?? "Bouaké-Ville";  // Où se trouve le produit

error_log("🔍 Valeurs extraites - nom: $nom, prix: $prix, stock: $stock, categorie_id: $categorie_id, producteur_id: $producteur_id");

// Je vérifie que tous les champs obligatoires sont remplis
$missing_fields = [];
if (!$nom) $missing_fields[] = "nom";
if (!$prix || $prix === 0) $missing_fields[] = "prix";
if ($stock === null || $stock === '') $missing_fields[] = "stock";
if (!$unite) $missing_fields[] = "unite";
if (!$categorie_id) $missing_fields[] = "categorie_id";
if (!$producteur_id) $missing_fields[] = "producteur_id";

if (!empty($missing_fields)) {
    error_log("❌ Champs manquants: " . implode(", ", $missing_fields));
    echo json_encode([
        "status" => "error", 
        "message" => "Champs obligatoires manquants: " . implode(", ", $missing_fields)
    ]);
    exit;
}

// Je vérifie que le prix est positif
if ($prix <= 0) {
    echo json_encode(["status" => "error", "message" => "Le prix doit être supérieur à 0."]);
    exit; // Je m'arrête si le prix est négatif
}

// Je vérifie que le stock est positif
if ($stock < 0) {
    echo json_encode(["status" => "error", "message" => "Le stock ne peut pas être négatif."]);
    exit; // Je m'arrête si le stock est négatif
}

// Je vérifie que la commune fait partie de Bouaké
if (!in_array($commune, $CONFIG_BOUAKE['communes'])) {
    echo json_encode(["status" => "error", "message" => "Cette commune n'existe pas autour de Bouaké."]);
    exit; // Je m'arrête si la commune est invalide
}

// Je vérifie que le producteur existe vraiment
try {
    // Le producteur_id peut être soit l'ID du profil producteur, soit l'ID utilisateur
    // On essaie d'abord avec l'ID du profil producteur
    $check_prod = $pdo->prepare("SELECT id FROM profile_producteurs WHERE id = ?");
    $check_prod->execute([$producteur_id]);
    
    if ($check_prod->rowCount() === 0) {
        // Si pas trouvé, essayer avec user_id
        $check_prod_user = $pdo->prepare("SELECT id FROM profile_producteurs WHERE user_id = ?");
        $check_prod_user->execute([$producteur_id]);
        
        if ($check_prod_user->rowCount() > 0) {
            // Si trouvé avec user_id, récupérer l'ID du profil
            $prod_data = $check_prod_user->fetch(PDO::FETCH_ASSOC);
            $producteur_id = $prod_data['id'];
            error_log("✅ Producteur trouvé via user_id, ID profil: " . $producteur_id);
        } else {
            error_log("❌ Producteur non trouvé avec id=$producteur_id ni avec user_id=$producteur_id");
            echo json_encode([
                "status" => "error", 
                "message" => "Producteur non trouvé. ID fourni: " . $producteur_id
            ]);
            exit;
        }
    }
    
    // Je vérifie que la catégorie existe
    // D'abord, vérifier si la table categories existe
    try {
        $check_cat = $pdo->prepare("SELECT id, nom FROM categories WHERE id = ?");
        $check_cat->execute([$categorie_id]);
        
        if ($check_cat->rowCount() === 0) {
            // Si la catégorie n'existe pas, essayer de la créer automatiquement
            error_log("⚠️ Catégorie non trouvée: " . $categorie_id . ", tentative de création automatique");
            
            // Mapper les IDs fictifs aux noms de catégories
            $category_names = [
                'cat_legumes' => 'Légumes',
                'cat_fruits' => 'Fruits',
                'cat_cereales' => 'Céréales',
                'cat_tubercules' => 'Tubercules',
                'cat_epices' => 'Épices',
                'cat_autres' => 'Autres'
            ];
            
            $category_name = $category_names[$categorie_id] ?? 'Autres';
            
            // Créer la catégorie si elle n'existe pas
            try {
                $create_cat = $pdo->prepare("INSERT INTO categories (id, nom) VALUES (?, ?)");
                $create_cat->execute([$categorie_id, $category_name]);
                error_log("✅ Catégorie créée automatiquement: " . $categorie_id . " (" . $category_name . ")");
            } catch (PDOException $e) {
                // Si la création échoue, retourner une erreur plus claire
                error_log("❌ Impossible de créer la catégorie: " . $e->getMessage());
                echo json_encode([
                    "status" => "error", 
                    "message" => "Catégorie '" . $categorie_id . "' non trouvée et impossible de la créer automatiquement."
                ]);
                exit;
            }
        }
    } catch (PDOException $e) {
        // Si la table categories n'existe pas, on peut continuer sans catégorie ou créer une catégorie par défaut
        error_log("⚠️ Table categories peut-être absente ou erreur: " . $e->getMessage());
        // Pour l'instant, on continue sans vérifier la catégorie
        // TODO: Créer la table categories si elle n'existe pas
    }
    
    // Récupérer les infos du producteur pour la notification
    $get_producteur = $pdo->prepare("
        SELECT pp.nom_exploitation, u.prenom, u.nom 
        FROM profile_producteurs pp
        JOIN users u ON pp.user_id = u.id
        WHERE pp.id = ?
    ");
    $get_producteur->execute([$producteur_id]);
    $producteur_info = $get_producteur->fetch(PDO::FETCH_ASSOC);
    $producteur_nom = $producteur_info ? ($producteur_info['nom_exploitation'] ?? ($producteur_info['prenom'] . ' ' . $producteur_info['nom'])) : 'Producteur inconnu';
    
    // Récupérer le nom de la catégorie
    $get_categorie = $pdo->prepare("SELECT nom FROM categories WHERE id = ?");
    $get_categorie->execute([$categorie_id]);
    $categorie_nom = $get_categorie->fetchColumn() ?: 'Catégorie inconnue';
    
    // Gérer l'image si fournie
    $image_path = null;
    if (isset($data['image']) && !empty($data['image'])) {
        // L'image est envoyée en base64
        $image_base64 = $data['image'];
        $image_name = $data['image_name'] ?? 'produit.jpg';
        
        // Créer un nom de fichier unique
        $image_extension = pathinfo($image_name, PATHINFO_EXTENSION) ?: 'jpg';
        $safe_nom = preg_replace('/[^a-zA-Z0-9_-]/', '_', $nom);
        $unique_filename = $safe_nom . '_' . time() . '.' . $image_extension;
        
        // Chemin de destination
        $image_dir = '../../frontend/assets/images/produits/';
        
        // Créer le dossier s'il n'existe pas
        if (!file_exists($image_dir)) {
            mkdir($image_dir, 0755, true);
        }
        
        $image_path_full = $image_dir . $unique_filename;
        
        // Convertir base64 en fichier
        if (preg_match('/^data:image\/(\w+);base64,/', $image_base64, $matches)) {
            $image_type = $matches[1]; // jpg, png, etc.
            $image_data = substr($image_base64, strpos($image_base64, ',') + 1);
            $image_data = base64_decode($image_data);
            
            if ($image_data !== false) {
                // Sauvegarder l'image dans le dossier produits
                if (file_put_contents($image_path_full, $image_data) !== false) {
                    $image_path = 'assets/images/produits/' . $unique_filename;
                    error_log("✅ Image sauvegardée: " . $image_path);
                } else {
                    error_log("❌ Erreur sauvegarde image dans: " . $image_path_full);
                }
            }
        }
    }
    
    // Maintenant je peux créer le produit !
    // Je m'assure que le produit est actif (is_active = 1) pour qu'il apparaisse dans le catalogue
    if ($image_path) {
        // Essayer d'insérer avec l'image (si la colonne image existe)
        try {
            $stmt = $pdo->prepare("INSERT INTO produits (id, producteur_id, categorie_id, nom, description, prix, stock, unite, localite, commune, is_active, image) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)");
            $stmt->execute([$producteur_id, $categorie_id, $nom, $description, $prix, $stock, $unite, LOCALITE, $commune, $image_path]);
        } catch (PDOException $e) {
            // Si la colonne image n'existe pas, créer sans image
            // L'image sera quand même sauvegardée sur le serveur pour utilisation future
            error_log("⚠️ Colonne image absente dans produits, création sans image. Message: " . $e->getMessage());
            $stmt = $pdo->prepare("INSERT INTO produits (id, producteur_id, categorie_id, nom, description, prix, stock, unite, localite, commune, is_active) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)");
            $stmt->execute([$producteur_id, $categorie_id, $nom, $description, $prix, $stock, $unite, LOCALITE, $commune]);
        }
    } else {
        $stmt = $pdo->prepare("INSERT INTO produits (id, producteur_id, categorie_id, nom, description, prix, stock, unite, localite, commune, is_active) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)");
        $stmt->execute([$producteur_id, $categorie_id, $nom, $description, $prix, $stock, $unite, LOCALITE, $commune]);
    }
    
    // Récupérer l'ID du produit créé (pour MySQL avec UUID())
    // Note: lastInsertId() ne fonctionne pas avec UUID() dans MySQL
    // On récupère l'ID via une requête
    $produit_uuid = null;
    try {
        $get_produit_id = $pdo->prepare("SELECT id FROM produits WHERE producteur_id = ? AND nom = ? ORDER BY created_at DESC LIMIT 1");
        $get_produit_id->execute([$producteur_id, $nom]);
        $produit_data = $get_produit_id->fetch(PDO::FETCH_ASSOC);
        if ($produit_data) {
            $produit_uuid = $produit_data['id'];
        }
    } catch (PDOException $e) {
        error_log("⚠️ Impossible de récupérer l'ID du produit créé: " . $e->getMessage());
    }
    
    // Notifier tous les administrateurs
    $message_notif = "Nouveau produit ajouté: " . $nom . " par " . $producteur_nom . ". Prix: " . number_format($prix, 0, ',', ' ') . " FCFA/" . $unite . ". Stock: " . $stock . " " . $unite . ". Catégorie: " . $categorie_nom . ". Commune: " . $commune . ".";
    notifyAllAdmins($pdo, 'Nouveau produit ajouté: ' . $nom, $message_notif, 'PRODUIT');
    
    // 🎉 Produit créé avec succès !
    echo json_encode([
        "status" => "success", 
        "message" => "Produit '" . $nom . "' ajouté avec succès !",
        "produit" => [
            "nom" => $nom,
            "prix" => $prix,
            "stock" => $stock,
            "unite" => $unite,
            "commune" => $commune
        ]
    ]);
    
} catch (PDOException $e) {
    // Si quelque chose ne marche pas, j'affiche l'erreur
    error_log("❌ Erreur PDO create_product.php: " . $e->getMessage());
    error_log("❌ Trace: " . $e->getTraceAsString());
    error_log("❌ Données reçues: " . json_encode($data, JSON_UNESCAPED_UNICODE));
    
    // Message d'erreur plus détaillé pour le développement
    $error_message = "Erreur lors de l'ajout du produit.";
    if (strpos($e->getMessage(), 'Unknown column') !== false) {
        $error_message .= " Une colonne est manquante dans la base de données.";
    } elseif (strpos($e->getMessage(), 'Duplicate entry') !== false) {
        $error_message .= " Ce produit existe déjà.";
    } elseif (strpos($e->getMessage(), 'foreign key') !== false) {
        $error_message .= " Référence invalide (producteur ou catégorie introuvable).";
    } else {
        // En mode développement, afficher l'erreur complète
        $error_message .= " " . $e->getMessage();
    }
    
    echo json_encode([
        "status" => "error", 
        "message" => $error_message,
        "debug" => (isset($_GET['debug']) && $_GET['debug'] === '1' ? $e->getMessage() : null)
    ]);
} catch (Exception $e) {
    error_log("❌ Erreur générale create_product.php: " . $e->getMessage());
    echo json_encode([
        "status" => "error", 
        "message" => "Erreur lors de l'ajout du produit: " . $e->getMessage()
    ]);
}
?>