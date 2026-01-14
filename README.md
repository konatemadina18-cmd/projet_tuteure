# Agriconnect2

Agriconnect2 est une plateforme web dédiée à la mise en relation des producteurs, acheteurs et livreurs de produits agricoles. Elle facilite la gestion des commandes, la communication entre les acteurs, et le suivi des livraisons.

## Fonctionnalités principales

- **Gestion des utilisateurs** : Producteurs, acheteurs, livreurs et administrateurs avec des rôles distincts.
- **Catalogue de produits** : Ajout, modification, suppression et consultation des produits agricoles.
- **Commandes** : Création, suivi et mise à jour du statut des commandes.
- **Paiements** : Gestion des paiements liés aux commandes.
- **Messagerie** : Système de messages et notifications entre les utilisateurs.
- **Administration** : Tableau de bord pour la gestion des utilisateurs, statistiques, et configuration du système.

## Structure du projet

- `agriconnect/api/` : Endpoints PHP pour l'API (authentification, gestion des produits, commandes, utilisateurs, etc.)
- `agriconnect/config/` : Fichiers de configuration (base de données, SMS, notifications...)
- `agriconnect/frontend/` : Interface utilisateur (HTML, CSS, JS)
    - `pages/` : Pages dédiées à chaque rôle
    - `scripts/` : Scripts JS pour l'interactivité
    - `styles/` : Feuilles de style CSS
    - `assets/` : Images et ressources

## Installation

1. **Cloner le projet**
   ```bash
   git clone https://github.com/konatemadina18-cmd/projet_tuteure.git
   ```
2. **Configurer la base de données**
   - Importer les fichiers SQL nécessaires dans votre serveur MySQL.
   - Modifier les paramètres de connexion dans `agriconnect/config/connexion.php` selon votre environnement.
3. **Configurer l'environnement**
   - Placer le dossier dans le répertoire de votre serveur web (ex: XAMPP `htdocs`).
   - Vérifier les dépendances PHP (PDO, extensions MySQL, etc.).
4. **Lancer le projet**
   - Accéder à l'interface via `http://localhost/agriconnect2/agriconnect/frontend/index.html`.

## Technologies utilisées

- **Frontend** : HTML, CSS, JavaScript
- **Backend** : PHP (API REST)
- **Base de données** : MySQL

## Conseils pour la reprise du projet

- Lire les fichiers `README_ADMIN.md` et `TROUBLESHOOTING.md` pour des informations spécifiques à l'administration et à la résolution de problèmes.
- Les endpoints API sont organisés par rôle et fonctionnalité dans le dossier `api/`.
- Les scripts JS du frontend sont modulaires et correspondent aux pages principales.
- Les fichiers de configuration sont centralisés dans `config/`.
- Pour ajouter des fonctionnalités, suivre la structure existante et documenter les nouveaux endpoints ou pages.

## Auteur

- Madina Konaté
- GitHub : https://github.com/konatemadina18-cmd

## Licence

Ce projet est open-source, n'hésitez pas à le modifier ou l'améliorer !

---

Pour toute question ou amélioration, contactez l'auteur ou ouvrez une issue sur le dépôt GitHub.