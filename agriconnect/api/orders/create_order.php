<?php
// Ce fichier permet à un acheteur de créer une nouvelle commande

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
require_once("../../config/localite.php");
require_once("../../config/notifications_helper.php");

// Je récupère les informations de la commande
$data = json_decode(file_get_contents("php://input"), true);

$acheteur_id = $data['acheteur_id'] ?? null;           // L'ID de l'acheteur
$commune_livraison = $data['commune_livraison'] ?? null; // Où livrer la commande
$items = $data['items'] ?? [];                         // Les produits commandés
$frais_livraison = $data['frais_livraison'] ?? 0;      // Les frais de livraison

// Je vérifie que tous les champs obligatoires sont remplis
if (!$acheteur_id || !$commune_livraison || empty($items)) {
    echo json_encode(["status" => "error", "message" => "Informations de commande incomplètes."]);
    exit;
}

// Je vérifie que la commune de livraison est valide
if (!in_array($commune_livraison, $CONFIG_BOUAKE['communes'])) {
    echo json_encode(["status" => "error", "message" => "Commune de livraison invalide."]);
    exit;
}

// Je vérifie que l'acheteur existe
try {
    $pdo->beginTransaction(); // Je commence une transaction pour être sûr que tout se passe bien

    // Je vérifie que l'acheteur existe
    $check_acheteur = $pdo->prepare("SELECT id FROM users WHERE id = ? AND role = 'ACHETEUR'");
    $check_acheteur->execute([$acheteur_id]);
    
    if ($check_acheteur->rowCount() === 0) {
        throw new Exception("Acheteur non trouvé.");
    }

    // Je calcule le total de la commande
    $total_produits = 0;
    
    // Je vérifie chaque produit du panier
    foreach ($items as $item) {
        $produit_id = $item['produit_id'] ?? null;
        $quantite = $item['quantite'] ?? 0;
        
        if (!$produit_id || $quantite <= 0) {
            throw new Exception("Produit ou quantité invalide.");
        }
        
        // Je vérifie que le produit existe et a assez de stock
        $check_produit = $pdo->prepare("SELECT prix, stock FROM produits WHERE id = ? AND is_active = 1");
        $check_produit->execute([$produit_id]);
        $produit = $check_produit->fetch(PDO::FETCH_ASSOC);
        
        if (!$produit) {
            throw new Exception("Produit non trouvé: " . $produit_id);
        }
        
        if ($produit['stock'] < $quantite) {
            throw new Exception("Stock insuffisant pour: " . $produit_id);
        }
        
        // J'ajoute au total
        $total_produits += $produit['prix'] * $quantite;
    }
    
    // Je calcule le total final (produits + livraison)
    $total_final = $total_produits + $frais_livraison;
    
    // Je crée la commande avec un UUID au format MySQL standard
    // Format: 550e8400-e29b-41d4-a716-446655440000
    $uuid = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
    $commande_id = $uuid;
    
    // Récupérer les infos de l'acheteur pour les notifications
    $get_acheteur = $pdo->prepare("SELECT prenom, nom, telephone FROM users WHERE id = ?");
    $get_acheteur->execute([$acheteur_id]);
    $acheteur_info = $get_acheteur->fetch(PDO::FETCH_ASSOC);
    $acheteur_nom = ($acheteur_info ? $acheteur_info['prenom'] . ' ' . $acheteur_info['nom'] : 'Un acheteur');
    
    $stmt_commande = $pdo->prepare("INSERT INTO commandes (id, acheteur_id, total, commune_livraison, frais_livraison, statut) VALUES (?, ?, ?, ?, ?, 'EN_ATTENTE')");
    $stmt_commande->execute([$commande_id, $acheteur_id, $total_final, $commune_livraison, $frais_livraison]);
    
    // Je génère le numéro de commande séquentiel après l'insertion
    // Le numéro sera calculé dynamiquement dans get_orders.php basé sur la position chronologique
    $count_stmt = $pdo->query("SELECT COUNT(*) FROM commandes");
    $numero_commande = $count_stmt->fetchColumn();
    
    // Liste des producteurs à notifier (pour éviter les doublons)
    $producteurs_notifies = [];
    $produits_liste = [];
    
    // J'ajoute chaque produit à la commande
    foreach ($items as $item) {
        $produit_id = $item['produit_id'];
        $quantite = $item['quantite'];
        
        // Je récupère le prix et le nom du produit
        $get_produit = $pdo->prepare("SELECT prix, nom FROM produits WHERE id = ?");
        $get_produit->execute([$produit_id]);
        $produit_data = $get_produit->fetch(PDO::FETCH_ASSOC);
        $prix_unitaire = $produit_data['prix'];
        
        // Ajouter le produit à la liste pour les notifications
        $produits_liste[] = $produit_data['nom'] . ' (' . $quantite . ')';
        
        // J'ajoute l'item à la commande
        $item_uuid = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
        $stmt_item = $pdo->prepare("INSERT INTO commande_items (id, commande_id, produit_id, quantite, prix_unitaire) VALUES (?, ?, ?, ?, ?)");
        $stmt_item->execute([$item_uuid, $commande_id, $produit_id, $quantite, $prix_unitaire]);
        
        // Je diminue le stock du produit
        $update_stock = $pdo->prepare("UPDATE produits SET stock = stock - ? WHERE id = ?");
        $update_stock->execute([$quantite, $produit_id]);
        
        // Récupérer le producteur pour notification
        $producteur_user_id = getProducteurIdFromProduit($pdo, $produit_id);
        if ($producteur_user_id && !in_array($producteur_user_id, $producteurs_notifies)) {
            $producteurs_notifies[] = $producteur_user_id;
        }
    }
    
    // Je crée un paiement en attente (pour le COD)
    $paiement_uuid = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
    $stmt_paiement = $pdo->prepare("INSERT INTO paiements (id, commande_id, montant, moyen, statut) VALUES (?, ?, ?, 'COD', 'EN_ATTENTE')");
    $stmt_paiement->execute([$paiement_uuid, $commande_id, $total_final]);
    
    // Je crée une notification pour l'acheteur
    $message_notif_acheteur = "Votre commande #" . $numero_commande . " d'un montant de " . number_format($total_final, 0, ',', ' ') . " FCFA a été créée avec succès. Elle sera livrée à " . $commune_livraison . ".";
    createNotification($pdo, $acheteur_id, 'Commande créée #' . $numero_commande, $message_notif_acheteur, 'COMMANDE');
    
    // Je notifie chaque producteur concerné
    foreach ($producteurs_notifies as $producteur_id) {
        $message_notif_prod = "Nouvelle commande #" . $numero_commande . " reçue pour vos produits. Détails de la commande disponibles dans votre tableau de bord.";
        createNotification($pdo, $producteur_id, 'Nouvelle commande #' . $numero_commande, $message_notif_prod, 'COMMANDE');
    }
    
    // Je notifie tous les administrateurs
    $message_notif_admin = "Nouvelle commande #" . $numero_commande . " créée par " . $acheteur_nom . " (" . $acheteur_info['telephone'] . "). Montant total: " . number_format($total_final, 0, ',', ' ') . " FCFA. Produits: " . implode(', ', $produits_liste) . ". Livraison à " . $commune_livraison . ".";
    notifyAllAdmins($pdo, 'Nouvelle commande #' . $numero_commande, $message_notif_admin, 'COMMANDE');
    
    $pdo->commit(); // 🎉 Tout s'est bien passé, je valide la transaction
    
    echo json_encode([
        "status" => "success", 
        "message" => "Commande créée avec succès !",
        "commande" => [
            "id" => $commande_id,
            "numero" => $numero_commande,
            "total" => $total_final,
            "frais_livraison" => $frais_livraison,
            "commune_livraison" => $commune_livraison,
            "nombre_produits" => count($items)
        ]
    ]);
    
} catch (Exception $e) {
    $pdo->rollBack(); // ❌ Quelque chose n'a pas marché, j'annule tout
    echo json_encode(["status" => "error", "message" => "Erreur lors de la création de la commande: " . $e->getMessage()]);
}
?>