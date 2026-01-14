<?php
// FICHIER : config/connexion.php
// BUT : Connexion à la base de données MySQL
// NOTE : Ce fichier ne fait QUE la connexion, pas d'inscription ni de traitement

$servername = "localhost";  
$username = "root";   
$password = "";      
$dbname = "agriconnect"; 

// Créer la connexion MySQLi
$conn = new mysqli($servername, $username, $password, $dbname);

// Vérifier la connexion
if ($conn->connect_error) {
    die(json_encode(["status" => "error", "message" => "La connexion a échoué: " . $conn->connect_error]));
}

// Définir le charset en UTF-8 pour supporter les caractères spéciaux
$conn->set_charset("utf8mb4");
?>