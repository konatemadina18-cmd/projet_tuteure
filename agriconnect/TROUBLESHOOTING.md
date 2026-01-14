# 🔧 Guide de Dépannage - Ajout de Produit

## ❌ Erreur: "failed to fetch" ou "Impossible de contacter le serveur"

### Vérifications à faire dans l'ordre :

#### 1. ✅ Vérifier que XAMPP est démarré
- Ouvrez le **Panneau de contrôle XAMPP**
- Vérifiez que **Apache** est démarré (bouton "Start" ou statut "Running")
- Vérifiez que **MySQL** est démarré si nécessaire

#### 2. ✅ Vérifier l'URL d'accès
- **❌ MAUVAIS:** Ouvrir via `file:///C:/xampp/htdocs/agriconnect/...`
- **✅ BON:** Ouvrir via `http://localhost/agriconnect/frontend/frontend/pages/producteur.html`

#### 3. ✅ Tester l'API directement
Ouvrez dans votre navigateur:
```
http://localhost/agriconnect/api/index.php
```

Vous devriez voir un JSON avec les routes disponibles. Si vous voyez une erreur 404, vérifiez:
- Le chemin est correct
- Apache est bien démarré
- Le fichier existe bien

#### 4. ✅ Tester avec le fichier de test
Ouvrez dans votre navigateur:
```
http://localhost/agriconnect/test_api_simple.html
```

Ce fichier va tester la connexion et vous donner des informations détaillées.

#### 5. ✅ Vérifier la console du navigateur
1. Appuyez sur **F12** pour ouvrir les outils de développement
2. Allez dans l'onglet **Console**
3. Essayez d'ajouter un produit
4. Regardez les messages qui apparaissent:
   - `🌐 URL API de base détectée:` - Doit être `http://localhost/agriconnect/api`
   - `📞 Appel API:` - L'URL complète appelée
   - Messages d'erreur détaillés

#### 6. ✅ Vérifier les erreurs PHP
Regardez les logs PHP dans:
- `C:\xampp\apache\logs\error.log`
- Ou dans le panneau XAMPP

#### 7. ✅ Solution alternative: Utiliser le port 8080
Si le port 80 est occupé, vous pouvez:
1. Changer le port Apache dans XAMPP vers 8080
2. Ouvrir: `http://localhost:8080/agriconnect/...`
3. Modifier `frontend/scripts/api.js` pour utiliser le port 8080

## 🔍 Messages d'erreur courants

### "ERR_CONNECTION_REFUSED"
- Apache n'est pas démarré
- Le port est incorrect

### "404 Not Found"
- L'URL de l'API est incorrecte
- Le fichier PHP n'existe pas au bon endroit

### "CORS policy"
- Les headers CORS sont manquants (normalement déjà configurés)

## 📞 Informations à fournir en cas de problème persistant

1. Message d'erreur exact dans la console
2. URL actuelle de la page (barre d'adresse)
3. Résultat de `http://localhost/agriconnect/api/index.php`
4. Statut d'Apache dans XAMPP (Running/Stopped)

