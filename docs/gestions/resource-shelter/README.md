# Gestion Resource & Shelter

## 1. Objectif
Cette gestion couvre la coordination des ressources de secours et des shelters, avec:
- un parcours Front Office pour les operations terrain,
- un parcours Back Office pour la gestion administrative.

## 2. Portee Fonctionnelle

### Front Office
- Ajouter, modifier, supprimer des resources.
- Lister les resources disponibles et leur statut.
- Allouer une resource a une mission (simulation via taskId).
- Ajouter des shelters.
- Simuler check-in / check-out pour l'occupation des shelters.
- Consulter:
  - shelters proches,
  - details d'un shelter,
  - routes d'evacuation.

### Back Office
- CRUD complet Resources.
- CRUD complet Shelters.
- Recherche multi-colonnes sur tableaux.
- Pagination configurable.

## 3. Stack Technique
- Frontend: Angular standalone components.
- Backend: Spring Boot REST (port 8090).
- Base URL frontend -> backend:
  - http://localhost:8090

## 4. Routes Frontend

### Front Office
- /resource
- /shelter
- /nearby-shelters
- /shelter-details/:id
- /evacuation-routes

### Back Office
- /backoffice/resources
- /backoffice/shelters

## 5. Fichiers Frontend Principaux
- Service API:
  - src/app/core/services/resource-shelter/resource-shelter.service.ts
- Modeles:
  - src/app/shared/models/resource-shelter/resource-shelter.model.ts
- Pages:
  - src/app/pages/resource-form/*
  - src/app/pages/shelter-form/*
  - src/app/pages/backoffice-resources/*
  - src/app/pages/backoffice-shelters/*
  - src/app/pages/nearby-shelters/*
  - src/app/pages/shelter-details/*
  - src/app/pages/evacuation-routes/*
- Layout Front Office:
  - src/app/layouts/front-office-layout/*

## 6. Endpoints Backend Utilises
Base path:
- /resource-shelter

Resources:
- GET /resource-shelter/resources
- POST /resource-shelter/resources
- PUT /resource-shelter/resources/{id}
- DELETE /resource-shelter/resources/{id}

Shelters:
- GET /resource-shelter/shelters
- POST /resource-shelter/shelters
- PUT /resource-shelter/shelters/{id}
- DELETE /resource-shelter/shelters/{id}

Users techniques (resolution fallback):
- GET /resource-shelter/users
- POST /resource-shelter/users

## 7. Particularite d'Integration
Pour eviter les erreurs de type "User not found", la couche frontend:
1. tente d'utiliser un utilisateur existant,
2. cree un utilisateur fallback si aucun n'existe,
3. reutilise cet id pour les creations/updates resource et shelter.

## 8. Scenarios Metier (Resume)

### Scenario A: Agent terrain (Resources)
1. Ouvre /resource.
2. Cree une resource (nom, type, quantite, localisation).
3. Verifie la resource dans la liste.
4. Lance une allocation vers mission (taskId).

### Scenario B: Agent terrain (Shelters)
1. Ouvre /shelter.
2. Ajoute un shelter (adresse, capacite, type).
3. Simule check-in/check-out pour suivre l'occupation.

### Scenario C: Admin Back Office
1. Ouvre /backoffice/resources et /backoffice/shelters.
2. Recherche une ligne avec la barre de recherche.
3. Modifie / supprime des entites.
4. Controle les pages via pagination.

## 9. Checklist de Validation
- [ ] Backend demarre sur 8090.
- [ ] Frontend demarre sans erreur.
- [ ] Creation resource OK.
- [ ] Creation shelter OK.
- [ ] Edition/suppression en back office OK.
- [ ] Recherche/pagination OK.
- [ ] Navigation front office OK.

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

## 11. Points de Vigilance
- Les IDs saisis manuellement (ownerId, managerId, taskId) doivent etre valides.
- Les URL de localisation doivent respecter le pattern http(s)://.
- En production, remplacer la logique fallback user par l'authentification/identite reelle.

## 12. Evolutions Recommandees
- Liaison avec module identity/auth.
- Geolocalisation reelle pour nearby shelters.
- Historique d'allocation et audit trail.
- Filtres avances (type, statut, capacite, distance).
