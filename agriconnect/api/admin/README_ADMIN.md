# Guide de création d'un compte Administrateur

## 🔐 Codes Secrets

⚠️ **IMPORTANT** : Tous les codes secrets sont définis dans `config/admin_config.php`
- **Changez ces codes en production pour la sécurité !**

### Codes par défaut :
- **Code d'inscription** : `AGRICONNECT_ADMIN_2024`
- **Code du script** : `CREATE_FIRST_ADMIN_2024`

## Méthode 1 : Via l'inscription normale (recommandé)

1. Aller sur la page d'inscription : `register.html`
2. Remplir tous les champs normalement :
   - Nom, Prénom
   - Email, Téléphone
   - Commune
3. **Sélectionner "⚙️ Administrateur" dans le champ "Je suis..."**
4. **Un champ "Code secret administrateur" apparaîtra automatiquement**
5. **Entrer le code secret** : `AGRICONNECT_ADMIN_2024`
6. Compléter le mot de passe et la confirmation
7. Valider l'inscription

✅ Une fois inscrit, l'admin sera automatiquement connecté et redirigé vers le dashboard admin.

## Méthode 2 : Via le script PHP (pour créer le premier admin)

Si vous n'avez pas encore d'admin, vous pouvez utiliser le script `create_admin.php` :

### Avec curl :
```bash
curl -X POST http://localhost/agriconnect/api/admin/create_admin.php \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Admin",
    "prenom": "Super",
    "email": "admin@agriconnect.ci",
    "telephone": "07 00 00 00 00",
    "mot_de_passe": "MotDePasseSecurise123!",
    "admin_secret": "CREATE_FIRST_ADMIN_2024"
  }'
```

### Avec Postman ou un autre outil API :
- **URL** : `http://localhost/agriconnect/api/admin/create_admin.php`
- **Method** : `POST`
- **Headers** : `Content-Type: application/json`
- **Body** (JSON) :
```json
{
  "nom": "Admin",
  "prenom": "Super",
  "email": "admin@agriconnect.ci",
  "telephone": "07 00 00 00 00",
  "mot_de_passe": "VotreMotDePasseSecurise123!",
  "admin_secret": "CREATE_FIRST_ADMIN_2024"
}
```

## Connexion

Une fois le compte admin créé :
1. Aller sur `login.html`
2. Entrer l'email et le mot de passe de l'admin
3. Cliquer sur "Se connecter"
4. L'admin sera automatiquement redirigé vers `frontend/pages/admin.html`

## Sécurité

- **Limite d'admins** : Maximum 5 administrateurs (configurable dans `config/admin_config.php`)
- **Mot de passe** : Minimum 6 caractères pour l'inscription normale, 8 caractères pour le script
- **Codes secrets** : Changez-les dans `config/admin_config.php` en production !

## Configuration

Pour modifier les codes secrets ou la limite d'admins, éditez le fichier :
```
config/admin_config.php
```


