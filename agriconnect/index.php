<?php
// FICHIER : index.php (à la racine de agriconnect)
// BUT : Page d'accueil qui redirige vers le frontend
// COMME : La porte d'entrée de l'application

// Je redirige directement vers la page d'accueil du frontend
header("Location: frontend/index.html");
exit; // Je m'arrête pour que la redirection fonctionne

// Si la redirection ne marche pas, j'affiche un message
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AgriConnect - Redirection</title>
</head>
<body>
    <h1>🌿 AgriConnect </h1>
    <p>Redirection vers l'application...</p>
    <p>Si vous n'êtes pas redirigé, <a href="frontend/index.html">cliquez ici</a>.</p>
    
    <script>
        // Redirection JavaScript au cas où
        window.location.href = "frontend/index.html";
    </script>
</body>
</html>