## Version

- Version : 1.0.0
- Date : 24/07/2025
- Équipe : Lucas & Théo

Fonctionnalitées :

## Filtrage multi-critères avancé

Permettre à l’utilisateur de filtrer les films par :

- genre
- année minimum
- note minimum
- langue

**Objectif détaillé :**

L’utilisateur doit pouvoir combiner plusieurs critères simultanément afin d’affiner les résultats affichés. Les filtres doivent être dynamiques et réagir immédiatement aux changements sans recharger la page. Cette fonctionnalité implique une gestion propre de l’état global et une logique de filtrage cohérente. L’étudiant devra gérer les cas où aucun film ne correspond aux critères sélectionnés.

---

## 2️⃣ Système de scoring personnalisé

Créer une fonction qui attribue un score à chaque film selon :

- pondération note moyenne
- popularité
- récence
- nombre de votes

Afficher les films triés selon ce score.

**Objectif détaillé :**

L’étudiant doit concevoir une logique de calcul permettant de transformer plusieurs données brutes en un score unique. Ce score doit être cohérent et justifiable. Il faudra réfléchir à la normalisation des données (ex : popularité et note n’ont pas la même échelle). Cette fonctionnalité introduit une vraie réflexion algorithmique et une séparation claire entre logique métier et affichage.

---

## 3️⃣ Pondération configurable par l’utilisateur

Ajouter des sliders permettant à l’utilisateur de :

- donner plus d’importance à la popularité
- ou à la note
- ou à la récence

Le classement s’actualise dynamiquement.

**Objectif détaillé :**

Cette fonctionnalité rend le moteur de recommandation interactif. L’utilisateur devient acteur du calcul du score. Les pondérations doivent impacter immédiatement le classement des films. L’étudiant devra connecter interface utilisateur et logique métier de manière propre et réactive. C’est un bon test de gestion d’événements et de recalcul dynamique.

---

## 4️⃣ Système de favoris persistants

Permettre à l’utilisateur de :

- ajouter un film en favori
- stocker en localStorage
- consulter une page “Mes recommandations”

**Objectif détaillé :**

L’application doit conserver les films favoris même après rechargement de la page. Il faudra gérer l’ajout, la suppression et éviter les doublons. L’étudiant devra structurer correctement les données stockées et assurer la synchronisation entre le stockage local et l’interface. Cela introduit la notion de persistance côté client.

---

## 5️⃣ Explication du score (Transparence IA)

Afficher sous chaque film :

> “Recommandé car :
> 
> 
> ✔ Note élevée
> 
> ✔ Film récent
> 
> ✔ Correspond à vos genres favoris”
> 

**Objectif détaillé :**

Le moteur ne doit pas seulement calculer un score, mais aussi l’expliquer. L’étudiant devra analyser les critères dominants ayant influencé la recommandation et générer une justification compréhensible. Cela implique une logique conditionnelle claire. Cette feature introduit la notion d’explicabilité algorithmique, essentielle dans les systèmes de recommandation.

---

## 6️⃣ Comparateur de films

Permettre de sélectionner 2 films

Afficher un tableau comparatif :

- Note
- Popularité
- Date
- Nombre de votes

**Objectif détaillé :**

L’utilisateur doit pouvoir comparer deux films côte à côte pour mieux comprendre leurs différences. Cette fonctionnalité nécessite la gestion d’une sélection multiple et un affichage structuré des données. L’étudiant devra organiser les informations de manière lisible et éviter les erreurs si un film est désélectionné. C’est un bon exercice de gestion d’état et d’UI conditionnelle.