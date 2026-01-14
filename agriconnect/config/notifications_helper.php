<?php
// Helper pour créer des notifications facilement
// Fonctionne avec la base de données PDO

require_once(__DIR__ . '/db.php');

/**
 * Génère un UUID au format MySQL standard
 */
function generateUUID() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

/**
 * Crée une notification pour un utilisateur
 * @param PDO $pdo - La connexion PDO
 * @param string $user_id - L'ID de l'utilisateur
 * @param string $titre - Le titre de la notification
 * @param string $message - Le message de la notification
 * @param string $type - Le type de notification (COMMANDE, PRODUIT, SYSTEME, etc.)
 * @return string|false - L'ID de la notification créée ou false en cas d'erreur
 */
function createNotification($pdo, $user_id, $titre, $message, $type = 'SYSTEME') {
    try {
        $notif_id = generateUUID();
        $stmt = $pdo->prepare("INSERT INTO notifications (id, user_id, titre, message, type, is_lu) VALUES (?, ?, ?, ?, ?, 0)");
        $stmt->execute([$notif_id, $user_id, $titre, $message, $type]);
        return $notif_id;
    } catch (PDOException $e) {
        error_log("Erreur création notification: " . $e->getMessage());
        return false;
    }
}

/**
 * Récupère tous les IDs des administrateurs
 * @param PDO $pdo - La connexion PDO
 * @return array - Tableau des IDs des admins
 */
function getAdminIds($pdo) {
    try {
        $stmt = $pdo->prepare("SELECT id FROM users WHERE role = 'ADMIN'");
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    } catch (PDOException $e) {
        error_log("Erreur récupération admins: " . $e->getMessage());
        return [];
    }
}

/**
 * Crée une notification pour tous les administrateurs
 * @param PDO $pdo - La connexion PDO
 * @param string $titre - Le titre de la notification
 * @param string $message - Le message de la notification
 * @param string $type - Le type de notification
 * @return int - Nombre de notifications créées
 */
function notifyAllAdmins($pdo, $titre, $message, $type = 'SYSTEME') {
    $admin_ids = getAdminIds($pdo);
    $count = 0;
    foreach ($admin_ids as $admin_id) {
        if (createNotification($pdo, $admin_id, $titre, $message, $type)) {
            $count++;
        }
    }
    return $count;
}

/**
 * Récupère l'ID du producteur à partir de l'ID du produit
 * @param PDO $pdo - La connexion PDO
 * @param string $produit_id - L'ID du produit
 * @return string|false - L'ID du producteur ou false si non trouvé
 */
function getProducteurIdFromProduit($pdo, $produit_id) {
    try {
        // D'abord, récupérer le producteur_id depuis le produit
        $stmt = $pdo->prepare("SELECT producteur_id FROM produits WHERE id = ?");
        $stmt->execute([$produit_id]);
        $profile_producteur_id = $stmt->fetchColumn();
        
        if (!$profile_producteur_id) {
            return false;
        }
        
        // Ensuite, récupérer l'user_id depuis profile_producteurs
        $stmt2 = $pdo->prepare("SELECT user_id FROM profile_producteurs WHERE id = ?");
        $stmt2->execute([$profile_producteur_id]);
        $user_id = $stmt2->fetchColumn();
        
        return $user_id ? $user_id : false;
    } catch (PDOException $e) {
        error_log("Erreur récupération producteur: " . $e->getMessage());
        return false;
    }
}

/**
 * Récupère les IDs des livreurs disponibles
 * @param PDO $pdo - La connexion PDO
 * @param string $commune - La commune de livraison (optionnel, pour trouver le plus proche)
 * @return array - Tableau des IDs des livreurs avec leurs communes
 */
function getLivreurs($pdo, $commune = null) {
    try {
        $sql = "SELECT id, commune FROM users WHERE role = 'LIVREUR'";
        $params = [];
        
        if ($commune) {
            // Prioriser les livreurs de la même commune
            $sql .= " ORDER BY CASE WHEN commune = ? THEN 0 ELSE 1 END, commune";
            $params[] = $commune;
        } else {
            $sql .= " ORDER BY commune";
        }
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Erreur récupération livreurs: " . $e->getMessage());
        return [];
    }
}

/**
 * Trouve le livreur le plus proche d'une commune de livraison
 * @param PDO $pdo - La connexion PDO
 * @param string $commune_livraison - La commune où livrer
 * @return string|false - L'ID du livreur le plus proche ou false si aucun
 */
function findClosestLivreur($pdo, $commune_livraison) {
    $livreurs = getLivreurs($pdo, $commune_livraison);
    
    if (empty($livreurs)) {
        return false;
    }
    
    // Le premier livreur est le plus proche (même commune ou premier disponible)
    return $livreurs[0]['id'] ?? false;
}

/**
 * Notifie tous les livreurs disponibles d'une nouvelle commande à livrer
 * @param PDO $pdo - La connexion PDO
 * @param string $commande_id - L'ID de la commande
 * @param string $commune_livraison - La commune de livraison
 * @param float $montant - Le montant de la commande
 * @return int - Nombre de livreurs notifiés
 */
function notifyLivreurs($pdo, $commande_id, $commune_livraison, $montant) {
    $livreurs = getLivreurs($pdo, $commune_livraison);
    $count = 0;
    
    foreach ($livreurs as $livreur) {
        $titre = "Nouvelle livraison disponible";
        $message = "Nouvelle commande à livrer à " . $commune_livraison . ". Montant: " . number_format($montant, 0, ',', ' ') . " FCFA. Commande #" . substr($commande_id, 0, 8) . ".";
        
        if (createNotification($pdo, $livreur['id'], $titre, $message, 'LIVRAISON')) {
            $count++;
        }
    }
    
    return $count;
}

?>

