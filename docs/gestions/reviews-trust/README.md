# Gestion Reviews & Trust

## 1. Objectif
Cette gestion permet:
- la collecte d'avis citoyens,
- le calcul de confiance (trust score),
- la moderation des contenus signales.

Elle couvre les besoins Front Office (notation, commentaire, signalement) et Back Office (moderation admin).

## 2. Portee Fonctionnelle

### Front Office
- Consulter les avis.
- Filtrer par cible (organisation/volunteer) et id cible.
- Voir une synthese (moyenne, nombre d'avis).
- Ajouter un avis (note + commentaire).
- Signaler un abus sur un avis.
- Marquer un avis "useful".

### Back Office
- Lister les reviews signalees (status FLAGGED).
- Appliquer des actions de moderation:
  - approve,
  - delete,
  - suspend.
- Enregistrer une trace de moderation (ModerationAction).
- Recherche + pagination sur les signalements.

## 3. Stack Technique
- Frontend: Angular standalone components.
- Backend: Spring Boot REST (port 8090).
- Base URL frontend -> backend:
  - http://localhost:8090

## 4. Routes Frontend

### Front Office
- /reviews
- /add-review
- /reports

### Back Office
- /admin/reports

## 5. Fichiers Frontend Principaux
- Service API:
  - src/app/core/services/reviews-trust/reviews-trust.service.ts
- Modeles:
  - src/app/shared/models/reviews/reviews-trust.model.ts
- Pages:
  - src/app/pages/reviews/*
  - src/app/pages/add-review/*
  - src/app/pages/reports/*
  - src/app/pages/admin-reports/*
- Routing global:
  - src/app/app.routes.ts

## 6. Endpoints Backend Utilises

### Reviews
- POST /reviews
- GET /reviews
- GET /reviews/{id}
- PUT /reviews/{id}
- DELETE /reviews/{id}
- GET /reviews/by-target/{targetId}?targetType=...
- GET /reviews/by-author/{authorId}
- GET /reviews/by-status?status=...
- POST /reviews/{id}/helpful
- PATCH /reviews/{id}/moderate?status=...
- PATCH /reviews/{id}/verify-participant

### Trust Score
- GET /reviews/trust-scores
- GET /reviews/trust-scores/{id}
- GET /reviews/trust-scores/by-entity?entityId=...&entityType=...
- GET /reviews/trust-scores/by-type?entityType=...
- POST /reviews/trust-scores
- PUT /reviews/trust-scores/{id}
- DELETE /reviews/trust-scores/{id}
- POST /reviews/trust-scores/recalculate?entityId=...&entityType=...

### Moderation
- POST /reviews/moderation
- GET /reviews/moderation
- GET /reviews/moderation/{id}
- PUT /reviews/moderation/{id}
- DELETE /reviews/moderation/{id}
- GET /reviews/moderation/by-target/{targetId}?targetType=...
- GET /reviews/moderation/by-admin/{adminId}

## 7. Mapping Metier Front <-> Backend

### Ajouter un avis
1. Formulaire /add-review.
2. POST /reviews.
3. Recalcul trust score via POST /reviews/trust-scores/recalculate.

### Signaler un abus
1. Formulaire /reports.
2. PATCH /reviews/{id}/moderate?status=FLAGGED.
3. POST /reviews/moderation avec action WARN + raison.

### Moderation admin
Depuis /admin/reports:
- Approve:
  - status review -> PUBLISHED
  - action moderation -> WARN
- Delete:
  - status review -> REMOVED
  - action moderation -> REMOVE
- Suspend:
  - status review -> HIDDEN
  - action moderation -> BAN

## 8. Scenarios Metier (Resume)

### Scenario 1: Citoyen laisse un avis
1. Va sur /add-review.
2. Saisit note + commentaire.
3. Soumet.
4. Verifie son avis sur /reviews.

### Scenario 2: Citoyen signale un abus
1. Va sur /reports.
2. Choisit une review.
3. Saisit la raison.
4. Soumet le signalement.

### Scenario 3: Admin modere
1. Va sur /admin/reports.
2. Filtre/recherche les signalements.
3. Applique Approve/Delete/Suspend.
4. Verifie la disparition de la review de la liste FLAGGED.

## 9. Checklist de Validation
- [ ] GET /reviews retourne des donnees.
- [ ] POST /reviews fonctionne.
- [ ] Recalcul trust score fonctionne.
- [ ] Signalement met status FLAGGED.
- [ ] Action moderation est bien creee.
- [ ] /admin/reports liste les reviews FLAGGED.
- [ ] Approve/Delete/Suspend fonctionne sans erreur.

## 10. Lancement Local

### Backend
Dans disaster-aid-backend:
- .\mvnw.cmd spring-boot:run

### Frontend
Dans disaster-aid-frontend:
- npm install
- npm run start

Build de verification:
- npm run build

## 11. Contraintes Connues
- Les IDs sont actuellement saisis manuellement (authorId, targetId, adminId).
- La moderation n'est pas encore reliee a un module auth/roles.
- Le statut et la trace moderation sont geres cote API; la coherence depend de la disponibilite backend.

## 12. Evolutions Recommandees
- Brancher identity/auth pour auto-remplir authorId/adminId.
- Ajouter pieces jointes dans signalement (preuve visuelle).
- Ajouter SLA de moderation (temps de traitement).
- Ajouter historique complet des decisions admin par utilisateur.
