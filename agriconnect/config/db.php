<?php
// fait la même chose que connexion.php mais avec une méthode différente (PDO)
// PDO c'est une autre façon de parler à la base de données

$host = 'localhost';
$dbname = 'agriconnect';
$username = 'root';
$password = '';
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    
    // Je dis à PDO de  montrer toutes les erreurs pour m'aider à debugger
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
} catch(PDOException $e) {
    // Si ça ne marche pas, j'attrape l'erreur et je l'affiche
    die(json_encode(["status" => "error", "message" => "La connexion PDO a échoué: " . $e->getMessage()]));
}
?>