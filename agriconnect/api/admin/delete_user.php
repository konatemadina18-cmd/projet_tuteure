<?php
// Ce fichier permet à l'admin de supprimer un utilisateur

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: DELETE, POST");
require_once("../../config/db.php");

$data = json_decode(file_get_contents("php://input"), true);
$user_id = $data['user_id'] ?? $_POST['user_id'] ?? null;

if (!$user_id) {
    echo json_encode(["status" => "error", "message" => "ID utilisateur requis"]);
    exit;
}

try {
    $pdo->beginTransaction();
    
    // Vérifier que l'utilisateur existe
    $checkStmt = $pdo->prepare("SELECT id, role FROM users WHERE id = ?");
    $checkStmt->execute([$user_id]);
    $user = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        throw new Exception("Utilisateur non trouvé");
    }
    
    // Ne pas permettre la suppression d'un admin
    if ($user['role'] === 'ADMIN') {
        throw new Exception("Impossible de supprimer un administrateur");
    }
    
    // Si c'est un producteur, supprimer aussi son profil
    if ($user['role'] === 'PRODUCTEUR') {
        $profileStmt = $pdo->prepare("SELECT id FROM profile_producteurs WHERE user_id = ?");
        $profileStmt->execute([$user_id]);
        $profile = $profileStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($profile) {
            // Désactiver les produits du producteur
            $pdo->prepare("UPDATE produits SET is_active = 0 WHERE producteur_id = ?")->execute([$profile['id']]);
            
            // Supprimer le profil
            $pdo->prepare("DELETE FROM profile_producteurs WHERE id = ?")->execute([$profile['id']]);
        }
    }
    
    // Supprimer les notifications
    $pdo->prepare("DELETE FROM notifications WHERE user_id = ?")->execute([$user_id]);
    
    // Supprimer l'utilisateur
    $deleteStmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
    $deleteStmt->execute([$user_id]);
    
    $pdo->commit();
    
    echo json_encode([
        "status" => "success",
        "message" => "Utilisateur supprimé avec succès"
    ]);
    
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(["status" => "error", "message" => "Erreur: " . $e->getMessage()]);
}
?>

