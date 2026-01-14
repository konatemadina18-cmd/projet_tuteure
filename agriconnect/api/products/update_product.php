<?php
// Ce fichier permet à un producteur de modifier un produit existant

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: PUT");
header("Access-Control-Allow-Headers: Content-Type");

require_once("../../config/db.php");
require_once("../../config/localite.php");

// Je récupère les informations de modification
$data = json_decode(file_get_contents("php://input"), true);

$produit_id = $data["id"] ?? null; // L'ID du produit à modifier

// Je vérifie qu'on m'a bien donné l'ID du produit
if (!$produit_id) {
    echo json_encode(["status" => "error", "message" => "ID du produit requis."]);
    exit;
}

// Je prépare un tableau pour stocker les champs à modifier
$champs_a_modifier = [];
$valeurs = [];

// Je vérifie chaque champ un par un, et si il est fourni, je l'ajoute à la modification

// Modification du nom
if (isset($data['nom'])) {
    $champs_a_modifier[] = "nom = ?";
    $valeurs[] = $data['nom'];
}

// Modification de la description
if (isset($data['description'])) {
    $champs_a_modifier[] = "description = ?";
    $valeurs[] = $data['description'];
}

// Modification du prix
if (isset($data['prix'])) {
    if ($data['prix'] <= 0) {
        echo json_encode(["status" => "error", "message" => "Le prix doit être supérieur à 0."]);
        exit;
    }
    $champs_a_modifier[] = "prix = ?";
    $valeurs[] = $data['prix'];
}

// Modification du stock
if (isset($data['stock'])) {
    if ($data['stock'] < 0) {
        echo json_encode(["status" => "error", "message" => "Le stock ne peut pas être négatif."]);
        exit;
    }
    $champs_a_modifier[] = "stock = ?";
    $valeurs[] = $data['stock'];
}

// Modification de l'unité
if (isset($data['unite'])) {
    $champs_a_modifier[] = "unite = ?";
    $valeurs[] = $data['unite'];
}

// Modification de la catégorie
if (isset($data['categorie_id'])) {
    $champs_a_modifier[] = "categorie_id = ?";
    $valeurs[] = $data['categorie_id'];
}

// Modification de la commune
if (isset($data['commune'])) {
    if (!in_array($data['commune'], $CONFIG_BOUAKE['communes'])) {
        echo json_encode(["status" => "error", "message" => "Commune invalide."]);
        exit;
    }
    $champs_a_modifier[] = "commune = ?";
    $valeurs[] = $data['commune'];
}

// Si aucun champ n'est à modifier, je m'arrête
if (empty($champs_a_modifier)) {
    echo json_encode(["status" => "error", "message" => "Aucune modification à apporter."]);
    exit;
}

// J'ajoute l'ID du produit à la fin des valeurs
$valeurs[] = $produit_id;

try {
    // Je construis la requête SQL dynamiquement
    $sql = "UPDATE produits SET " . implode(", ", $champs_a_modifier) . " WHERE id = ?";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($valeurs);
    
    // Je vérifie si le produit a bien été modifié
    if ($stmt->rowCount() > 0) {
        echo json_encode([
            "status" => "success", 
            "message" => "Produit modifié avec succès !",
            "modifications" => count($champs_a_modifier) . " champ(s) mis à jour"
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Produit non trouvé ou aucune modification apportée."]);
    }
    
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Erreur lors de la modification: " . $e->getMessage()]);
}
?>