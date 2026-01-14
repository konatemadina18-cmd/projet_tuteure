<?php
// Ce fichier permet à un producteur de supprimer un produit

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: DELETE");
header("Access-Control-Allow-Headers: Content-Type");

require_once("../../config/db.php");

// Je récupère l'ID du produit à supprimer
$data = json_decode(file_get_contents("php://input"), true);
$produit_id = $data["id"] ?? null;

// Je vérifie qu'on m'a bien donné l'ID du produit
if (!$produit_id) {
    echo json_encode(["status" => "error", "message" => "ID du produit requis."]);
    exit;
}

try {
    // Au lieu de vraiment supprimer le produit, je le désactive
    // C'est plus sûr comme ça, on ne perd pas l'historique
    $stmt = $pdo->prepare("UPDATE produits SET is_active = 0 WHERE id = ?");
    $stmt->execute([$produit_id]);
    
    // Je vérifie si le produit a bien été désactivé
    if ($stmt->rowCount() > 0) {
        echo json_encode([
            "status" => "success", 
            "message" => "Produit retiré de la vente avec succès !"
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Produit non trouvé."]);
    }
    
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Erreur lors de la suppression: " . $e->getMessage()]);
}
?>