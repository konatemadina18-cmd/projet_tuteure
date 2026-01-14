<?php
// Ce fichier contient toutes les informations spécifiques à Bouaké
// Comme un carnet d'adresses pour la ville de Bouaké

// Je définis des constantes (des valeurs qui ne changeront pas)
define('LOCALITE', 'Bouaké');        // Le nom de notre ville
define('REGION', 'Vallée du Bandama'); // La région où se trouve Bouaké

// Je crée un tableau avec toutes les informations pratiques sur Bouaké
$CONFIG_BOUAKE = [
    // La liste de toutes les communes autour de Bouaké
    'communes' => [
        'Bouaké-Ville',  // Le centre-ville
        'Bounda',         // Une commune proche
        'Brobo',          // Une autre commune
        'Djébonoua',      // Encore une autre
        'Sakassou',       // Un peu plus loin
        'Béoumi',         // Assez éloigné
        'Botro'           // Le plus éloigné
    ],
    
    // Les prix de livraison pour chaque commune
    // Plus c'est loin, plus c'est cher !
    'tarifs_livraison' => [
        'Bouaké-Ville' => 1000,  // 1000 FCFA pour le centre-ville
        'Bounda' => 1500,        // 1500 FCFA pour Bounda
        'Brobo' => 1800,         // 1800 FCFA pour Brobo
        'Djébonoua' => 1700,     // 1700 FCFA pour Djébonoua
        'Sakassou' => 2500,      // 2500 FCFA pour Sakassou (plus loin)
        'Béoumi' => 3000,        // 3000 FCFA pour Béoumi (encore plus loin)
        'Botro' => 2800          // 2800 FCFA pour Botro
    ]
];
?>