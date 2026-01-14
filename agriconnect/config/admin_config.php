<?php
// FICHIER : config/admin_config.php
// BUT : Configuration pour les administrateurs
// NOTE : Changez ces codes secrets en production !

// Code secret requis pour créer un compte admin via l'inscription normale
// Ce code doit être entré dans le formulaire d'inscription quand on sélectionne "ADMIN"
define('ADMIN_SECRET_CODE', 'AGRICONNECT_ADMIN_2024');

// Code secret pour le script create_admin.php (pour créer le premier admin)
// Ce code est utilisé uniquement dans le script PHP, pas dans le formulaire
define('ADMIN_SCRIPT_SECRET', 'CREATE_FIRST_ADMIN_2024');

// Nombre maximum d'administrateurs autorisés (0 = illimité)
define('MAX_ADMINS', 5);

// ⚠️ IMPORTANT : Changez ces codes en production pour la sécurité !
?>

