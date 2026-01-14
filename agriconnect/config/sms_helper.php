<?php
/**
 * Helper pour l'envoi de SMS
 * Supporte plusieurs services SMS (Twilio, SMS Gateway local, etc.)
 */

// Configuration SMS - À configurer selon votre service
define('SMS_ENABLED', true); // Mettre à false pour désactiver l'envoi de SMS
define('SMS_PROVIDER', 'test'); // 'twilio', 'africastalking', 'local', 'test' (défaut: 'test' pour tester sans coût)

// Configuration Twilio (si vous utilisez Twilio)
define('TWILIO_ACCOUNT_SID', ''); // À remplir avec vos identifiants Twilio
define('TWILIO_AUTH_TOKEN', '');
define('TWILIO_PHONE_NUMBER', ''); // Numéro Twilio depuis lequel envoyer

// Configuration Africa's Talking (alternative populaire en Afrique)
define('AFRICASTALKING_API_KEY', '');
define('AFRICASTALKING_USERNAME', '');
define('AFRICASTALKING_SENDER_ID', 'AgriConnect');

/**
 * Envoie un SMS de bienvenue à un nouvel utilisateur
 * 
 * @param string $phone_number Numéro de téléphone avec indicatif (ex: +2250712345678)
 * @param string $prenom Prénom de l'utilisateur
 * @param string $role Rôle de l'utilisateur (ACHETEUR, PRODUCTEUR, LIVREUR, ADMIN)
 * @return array ['success' => bool, 'message' => string]
 */
function sendWelcomeSMS($phone_number, $prenom, $role) {
    if (!SMS_ENABLED) {
        return ['success' => false, 'message' => 'SMS désactivé'];
    }
    
    // Générer le message selon le rôle
    $roleMessages = [
        'ACHETEUR' => 'Découvrez nos produits frais locaux et soutenez les producteurs de Bouaké !',
        'PRODUCTEUR' => 'Mettez vos produits en vente et connectez-vous directement avec vos clients !',
        'LIVREUR' => 'Rejoignez notre équipe de livraison et aidez-nous à rapprocher les producteurs et les consommateurs !',
        'ADMIN' => 'Bienvenue dans l\'administration d\'AgriConnect !'
    ];
    
    $roleMessage = $roleMessages[$role] ?? 'Bienvenue dans la communauté AgriConnect !';
    
    // Slogan principal
    $slogan = "🌿 Du producteur au consommateur : une connexion directe. Cultivons ensemble un avenir durable !";
    
    // Message complet
    $message = "Bonjour $prenom ! 👋\n\n";
    $message .= "Bienvenue sur AgriConnect Bouaké ! 🎉\n\n";
    $message .= "$roleMessage\n\n";
    $message .= "$slogan\n\n";
    $message .= "Votre compte a été créé avec succès. Nous sommes ravis de vous compter parmi nous !\n\n";
    $message .= "L'équipe AgriConnect 🌱";
    
    // Nettoyer et formater le numéro de téléphone
    $phone_number = formatPhoneNumber($phone_number);
    
    if (!$phone_number) {
        return ['success' => false, 'message' => 'Numéro de téléphone invalide'];
    }
    
    // Envoyer le SMS selon le fournisseur
    switch (SMS_PROVIDER) {
        case 'twilio':
            return sendSMSViaTwilio($phone_number, $message);
        
        case 'africastalking':
            return sendSMSViaAfricasTalking($phone_number, $message);
        
        case 'local':
            return sendSMSViaLocalGateway($phone_number, $message);
        
        case 'test':
        default:
            // Mode test - juste logger le message
            error_log("📱 [TEST SMS] Envoi vers: $phone_number");
            error_log("📱 [TEST SMS] Message: $message");
            return ['success' => true, 'message' => 'SMS envoyé (mode test)'];
    }
}

/**
 * Formate et nettoie un numéro de téléphone
 * 
 * @param string $phone_number Numéro de téléphone brut
 * @return string|false Numéro formaté avec indicatif ou false si invalide
 */
function formatPhoneNumber($phone_number) {
    // Supprimer tous les espaces, tirets, parenthèses
    $phone = preg_replace('/[\s\-\(\)]/', '', $phone_number);
    
    // Si le numéro commence déjà par +, le garder tel quel
    if (substr($phone, 0, 1) === '+') {
        // Vérifier que c'est un numéro valide (minimum 10 chiffres après le +)
        if (preg_match('/^\+[1-9]\d{9,14}$/', $phone)) {
            return $phone;
        }
    }
    
    // Si le numéro commence par 00, remplacer par +
    if (substr($phone, 0, 2) === '00') {
        $phone = '+' . substr($phone, 2);
        if (preg_match('/^\+[1-9]\d{9,14}$/', $phone)) {
            return $phone;
        }
    }
    
    // Si aucun indicatif n'est présent, retourner false (indicatif requis)
    return false;
}

/**
 * Envoie un SMS via Twilio
 */
function sendSMSViaTwilio($phone_number, $message) {
    if (empty(TWILIO_ACCOUNT_SID) || empty(TWILIO_AUTH_TOKEN) || empty(TWILIO_PHONE_NUMBER)) {
        error_log("⚠️ Configuration Twilio incomplète");
        return ['success' => false, 'message' => 'Configuration Twilio manquante'];
    }
    
    $url = "https://api.twilio.com/2010-04-01/Accounts/" . TWILIO_ACCOUNT_SID . "/Messages.json";
    
    $data = [
        'From' => TWILIO_PHONE_NUMBER,
        'To' => $phone_number,
        'Body' => $message
    ];
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_USERPWD, TWILIO_ACCOUNT_SID . ':' . TWILIO_AUTH_TOKEN);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 201) {
        error_log("✅ SMS envoyé via Twilio vers: $phone_number");
        return ['success' => true, 'message' => 'SMS envoyé avec succès'];
    } else {
        error_log("❌ Erreur Twilio ($httpCode): $response");
        return ['success' => false, 'message' => 'Erreur lors de l\'envoi du SMS'];
    }
}

/**
 * Envoie un SMS via Africa's Talking
 */
function sendSMSViaAfricasTalking($phone_number, $message) {
    if (empty(AFRICASTALKING_API_KEY) || empty(AFRICASTALKING_USERNAME)) {
        error_log("⚠️ Configuration Africa's Talking incomplète");
        return ['success' => false, 'message' => 'Configuration Africa\'s Talking manquante'];
    }
    
    $url = "https://api.africastalking.com/version1/messaging";
    
    $data = [
        'username' => AFRICASTALKING_USERNAME,
        'to' => $phone_number,
        'message' => $message,
        'from' => AFRICASTALKING_SENDER_ID
    ];
    
    $headers = [
        'ApiKey: ' . AFRICASTALKING_API_KEY,
        'Content-Type: application/x-www-form-urlencoded',
        'Accept: application/json'
    ];
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 201 || $httpCode === 200) {
        error_log("✅ SMS envoyé via Africa's Talking vers: $phone_number");
        return ['success' => true, 'message' => 'SMS envoyé avec succès'];
    } else {
        error_log("❌ Erreur Africa's Talking ($httpCode): $response");
        return ['success' => false, 'message' => 'Erreur lors de l\'envoi du SMS'];
    }
}

/**
 * Envoie un SMS via une passerelle locale (à configurer selon votre infrastructure)
 */
function sendSMSViaLocalGateway($phone_number, $message) {
    // À adapter selon votre infrastructure locale
    // Exemple avec un service HTTP local
    $gateway_url = 'http://localhost:8080/sms/send'; // À configurer
    
    $data = [
        'to' => $phone_number,
        'message' => $message
    ];
    
    $ch = curl_init($gateway_url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        error_log("✅ SMS envoyé via passerelle locale vers: $phone_number");
        return ['success' => true, 'message' => 'SMS envoyé avec succès'];
    } else {
        error_log("❌ Erreur passerelle locale ($httpCode): $response");
        return ['success' => false, 'message' => 'Erreur lors de l\'envoi du SMS'];
    }
}

/**
 * Liste des pays avec leurs indicatifs téléphoniques
 * Format: ['code_pays' => 'indicatif']
 */
function getCountriesWithCodes() {
    return [
        'CI' => ['name' => 'Côte d\'Ivoire', 'code' => '+225'],
        'BF' => ['name' => 'Burkina Faso', 'code' => '+226'],
        'ML' => ['name' => 'Mali', 'code' => '+223'],
        'SN' => ['name' => 'Sénégal', 'code' => '+221'],
        'GN' => ['name' => 'Guinée', 'code' => '+224'],
        'GH' => ['name' => 'Ghana', 'code' => '+233'],
        'TG' => ['name' => 'Togo', 'code' => '+228'],
        'BJ' => ['name' => 'Bénin', 'code' => '+229'],
        'NE' => ['name' => 'Niger', 'code' => '+227'],
        'FR' => ['name' => 'France', 'code' => '+33'],
        'US' => ['name' => 'États-Unis', 'code' => '+1'],
        'CM' => ['name' => 'Cameroun', 'code' => '+237'],
        'CD' => ['name' => 'RD Congo', 'code' => '+243'],
        'CG' => ['name' => 'Congo', 'code' => '+242'],
        'GA' => ['name' => 'Gabon', 'code' => '+241']
    ];
}

?>

