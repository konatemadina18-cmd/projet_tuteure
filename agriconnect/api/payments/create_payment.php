<?php
// Ce fichier permet de créer un paiement pour une commande

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once("../../config/db.php");

// Je récupère les informations du paiement
$data = json_decode(file_get_contents("php://input"), true);

$commande_id = $data['commande_id'] ?? null; // L'ID de la commande
$montant = $data['montant'] ?? null;         // Le montant payé
$moyen = $data['moyen'] ?? 'COD';            // Le moyen de paiement

// Je vérifie qu'on m'a bien donné les informations
if (!$commande_id || !$montant) {
    echo json_encode(["status" => "error", "message" => "ID commande et montant requis."]);
    exit;
}

// Je vérifie que le moyen de paiement est valide
$moyens_valides = ['CARD', 'MOBILE_MONEY', 'COD'];
if (!in_array($moyen, $moyens_valides)) {
    echo json_encode(["status" => "error", "message" => "Moyen de paiement invalide."]);
    exit;
}

try {
    // Je vérifie que la commande existe
    $check_commande = $pdo->prepare("SELECT total FROM commandes WHERE id = ?");
    $check_commande->execute([$commande_id]);
    $commande = $check_commande->fetch(PDO::FETCH_ASSOC);
    
    if (!$commande) {
        throw new Exception("Commande non trouvée.");
    }
    
    // Je vérifie que le montant correspond au total de la commande
    if ($montant != $commande['total']) {
        throw new Exception("Le montant payé ne correspond pas au total de la commande.");
    }
    
    // Je crée le paiement
    $stmt = $pdo->prepare("INSERT INTO paiements (id, commande_id, montant, moyen, statut, date_paiement) VALUES (UUID(), ?, ?, ?, 'PAYE', NOW())");
    $stmt->execute([$commande_id, $montant, $moyen]);
    
    // Je mets à jour le statut de la commande
    $update_commande = $pdo->prepare("UPDATE commandes SET statut = 'PAYEE' WHERE id = ?");
    $update_commande->execute([$commande_id]);
    
    echo json_encode([
        "status" => "success", 
        "message" => "Paiement effectué avec succès !",
        "paiement" => [
            "commande_id" => $commande_id,
            "montant" => $montant,
            "moyen" => $moyen,
            "statut" => "PAYE"
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Erreur lors du paiement: " . $e->getMessage()]);
}
?>