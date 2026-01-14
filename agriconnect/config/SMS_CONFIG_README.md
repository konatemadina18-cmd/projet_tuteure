# Configuration SMS - AgriConnect

Ce document explique comment configurer l'envoi de SMS pour les notifications de bienvenue.

## 📱 Fonctionnalité

Lorsqu'un nouvel utilisateur s'inscrit sur AgriConnect, un SMS de bienvenue automatique est envoyé avec :
- Un message personnalisé selon le rôle (Acheteur, Producteur, Livreur, Admin)
- Le slogan d'AgriConnect : "🌿 Du producteur au consommateur : une connexion directe. Cultivons ensemble un avenir durable !"

**Note** : Actuellement, le projet est destiné à la Côte d'Ivoire uniquement. L'indicatif +225 est automatiquement ajouté aux numéros de téléphone.

## ⚙️ Configuration

### Étape 1 : Choisir un fournisseur SMS

Le système supporte plusieurs fournisseurs SMS :
- **Twilio** (Recommandé pour usage international)
- **Africa's Talking** (Recommandé pour l'Afrique de l'Ouest)
- **Passerelle locale** (Si vous avez votre propre infrastructure)
- **Mode Test** (Pour tester sans envoyer de vrais SMS)

### Étape 2 : Configurer le fichier `config/sms_helper.php`

Ouvrez le fichier `config/sms_helper.php` et modifiez les constantes en haut du fichier :

```php
// Activer/désactiver l'envoi de SMS
define('SMS_ENABLED', true);

// Choisir le fournisseur : 'twilio', 'africastalking', 'local', ou 'test'
define('SMS_PROVIDER', 'test'); // Commencez par 'test' pour tester
```

### Étape 3 : Configurer selon le fournisseur choisi

#### Option A : Twilio (Recommandé pour production)

1. Créez un compte sur [Twilio](https://www.twilio.com)
2. Récupérez vos identifiants :
   - Account SID
   - Auth Token
   - Numéro de téléphone Twilio
3. Modifiez dans `sms_helper.php` :

```php
define('TWILIO_ACCOUNT_SID', 'VOTRE_ACCOUNT_SID');
define('TWILIO_AUTH_TOKEN', 'VOTRE_AUTH_TOKEN');
define('TWILIO_PHONE_NUMBER', '+225XXXXXXXX'); // Votre numéro Twilio
define('SMS_PROVIDER', 'twilio');
```

#### Option B : Africa's Talking (Recommandé pour Côte d'Ivoire)

1. Créez un compte sur [Africa's Talking](https://africastalking.com)
2. Récupérez vos identifiants :
   - API Key
   - Username
3. Modifiez dans `sms_helper.php` :

```php
define('AFRICASTALKING_API_KEY', 'VOTRE_API_KEY');
define('AFRICASTALKING_USERNAME', 'VOTRE_USERNAME');
define('SMS_PROVIDER', 'africastalking');
```

#### Option C : Mode Test (Pour développement)

En mode test, les SMS ne sont pas réellement envoyés mais les messages sont loggés dans les logs PHP :

```php
define('SMS_PROVIDER', 'test');
```

Les messages apparaîtront dans le fichier de log PHP (généralement dans `error_log`).

## 🧪 Tester l'envoi de SMS

1. Configurez `SMS_PROVIDER` à `'test'`
2. Créez un nouveau compte utilisateur via l'inscription
3. Vérifiez les logs PHP pour voir le message SMS qui aurait été envoyé
4. Si tout fonctionne, passez à un vrai fournisseur (Twilio ou Africa's Talking)

## 📝 Format du message SMS

Le message envoyé suit ce format :

```
Bonjour [Prénom] ! 👋

Bienvenue sur AgriConnect Bouaké ! 🎉

[Message personnalisé selon le rôle]

🌿 Du producteur au consommateur : une connexion directe. Cultivons ensemble un avenir durable !

Votre compte a été créé avec succès. Nous sommes ravis de vous compter parmi nous !

L'équipe AgriConnect 🌱
```

## 🔒 Sécurité

⚠️ **IMPORTANT** : Ne commitez jamais vos clés API dans le dépôt Git. Utilisez plutôt des variables d'environnement ou un fichier de configuration non versionné.

## 📞 Support

En cas de problème :
1. Vérifiez que `SMS_ENABLED` est à `true`
2. Vérifiez les logs PHP pour voir les erreurs
3. Testez d'abord en mode `test` pour valider la logique
4. Vérifiez que vos identifiants API sont corrects

## 💰 Coûts

- **Twilio** : Payant, environ 0.05€ par SMS en Côte d'Ivoire
- **Africa's Talking** : Payant, prix compétitifs pour l'Afrique
- **Mode Test** : Gratuit (pas d'envoi réel)

