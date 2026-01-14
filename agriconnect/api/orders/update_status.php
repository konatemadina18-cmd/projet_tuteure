<?php
// Ce fichier permet de changer le statut d'une commande
// Gère le workflow complet : Producteur confirme → Notifie livreurs → Livreur accepte → Livraison

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: PUT");
header("Access-Control-Allow-Headers: Content-Type");

require_once("../../config/db.php");
require_once("../../config/notifications_helper.php");

// Je récupère les informations de modification
$data = json_decode(file_get_contents("php://input"), true);

$commande_id = $data['commande_id'] ?? null; // L'ID de la commande
$nouveau_statut = $data['statut'] ?? null;   // Le nouveau statut
$user_id = $data['user_id'] ?? null;         // L'ID de l'utilisateur qui fait l'action
$livreur_id = $data['livreur_id'] ?? null;   // L'ID du livreur (si c'est lui qui accepte)

// Je vérifie qu'on m'a bien donné les informations
if (!$commande_id || !$nouveau_statut) {
    echo json_encode(["status" => "error", "message" => "ID commande et nouveau statut requis."]);
    exit;
}

// Je vérifie que le statut est valide
$statuts_valides = ['EN_ATTENTE', 'CONFIRMEE', 'EN_PREPARATION', 'EN_LIVRAISON', 'LIVREE', 'ANNULEE'];
if (!in_array($nouveau_statut, $statuts_valides)) {
    echo json_encode(["status" => "error", "message" => "Statut invalide. Statuts valides: " . implode(', ', $statuts_valides)]);
    exit;
}

try {
    // Récupérer les infos de la commande
    $get_commande = $pdo->prepare("SELECT c.*, u.prenom as acheteur_prenom, u.nom as acheteur_nom FROM commandes c JOIN users u ON c.acheteur_id = u.id WHERE c.id = ?");
    $get_commande->execute([$commande_id]);
    $commande = $get_commande->fetch(PDO::FETCH_ASSOC);
    
    if (!$commande) {
        echo json_encode(["status" => "error", "message" => "Commande non trouvée."]);
        exit;
    }
    
    // Je mets à jour le statut de la commande
    $stmt = $pdo->prepare("UPDATE commandes SET statut = ? WHERE id = ?");
    $stmt->execute([$nouveau_statut, $commande_id]);
    
    if ($stmt->rowCount() > 0) {
        // Gérer les notifications selon le nouveau statut
        $commune_livraison = $commande['commune_livraison'];
        $montant = $commande['total'];
        $acheteur_nom = $commande['acheteur_prenom'] . ' ' . $commande['acheteur_nom'];
        
        switch ($nouveau_statut) {
            case 'CONFIRMEE':
                // Producteur a confirmé → Notifier les livreurs
                $livreurs_notifies = notifyLivreurs($pdo, $commande_id, $commune_livraison, $montant);
                
                // Notifier l'acheteur
                createNotification($pdo, $commande['acheteur_id'], 
                    'Commande confirmée', 
                    "Votre commande #" . substr($commande_id, 0, 8) . " a été confirmée par le producteur. Livraison prévue à " . $commune_livraison . ".", 
                    'COMMANDE');
                
                // Notifier les admins
                notifyAllAdmins($pdo, 
                    'Commande confirmée #' . substr($commande_id, 0, 8), 
                    "La commande de " . $acheteur_nom . " a été confirmée. " . $livreurs_notifies . " livreur(s) notifié(s).", 
                    'COMMANDE');
                break;
                
            case 'EN_PREPARATION':
                // Producteur prépare la commande
                createNotification($pdo, $commande['acheteur_id'], 
                    'Commande en préparation', 
                    "Votre commande #" . substr($commande_id, 0, 8) . " est en cours de préparation.", 
                    'COMMANDE');
                break;
                
            case 'EN_LIVRAISON':
                // Livreur a accepté la commande
                if ($livreur_id) {
                    // Enregistrer quel livreur a pris la commande
                    // Optionnel: créer une table commande_livreur pour suivre qui livre quoi
                    
                    // Notifier l'acheteur
                    createNotification($pdo, $commande['acheteur_id'], 
                        'Commande en livraison', 
                        "Votre commande #" . substr($commande_id, 0, 8) . " est en cours de livraison vers " . $commune_livraison . ".", 
                        'COMMANDE');
                    
                    // Notifier les admins
                    notifyAllAdmins($pdo, 
                        'Commande en livraison #' . substr($commande_id, 0, 8), 
                        "La commande de " . $acheteur_nom . " est maintenant en livraison.", 
                        'COMMANDE');
                }
                break;
                
            case 'LIVREE':
                // Commande livrée → Marquer le paiement comme payé
                $update_paiement = $pdo->prepare("UPDATE paiements SET statut = 'PAYE', date_paiement = NOW() WHERE commande_id = ? AND moyen = 'COD'");
                $update_paiement->execute([$commande_id]);
                
                // Notifier l'acheteur
                createNotification($pdo, $commande['acheteur_id'], 
                    'Commande livrée', 
                    "Votre commande #" . substr($commande_id, 0, 8) . " a été livrée avec succès ! Merci pour votre achat.", 
                    'COMMANDE');
                
                // Notifier les admins
                notifyAllAdmins($pdo, 
                    'Commande livrée #' . substr($commande_id, 0, 8), 
                    "La commande de " . $acheteur_nom . " a été livrée.", 
                    'COMMANDE');
                break;
                
            case 'ANNULEE':
                // Commande annulée
                createNotification($pdo, $commande['acheteur_id'], 
                    'Commande annulée', 
                    "Votre commande #" . substr($commande_id, 0, 8) . " a été annulée.", 
                    'COMMANDE');
                
                notifyAllAdmins($pdo, 
                    'Commande annulée #' . substr($commande_id, 0, 8), 
                    "La commande de " . $acheteur_nom . " a été annulée.", 
                    'COMMANDE');
                break;
        }
        
        echo json_encode([
            "status" => "success", 
            "message" => "Statut de la commande mis à jour: " . $nouveau_statut
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Commande non trouvée ou aucune modification."]);
    }
    
} catch (PDOException $e) {
    error_log("Erreur update_status: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur: " . $e->getMessage()]);
} catch (Exception $e) {
    error_log("Erreur générale update_status: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur: " . $e->getMessage()]);
}
?>