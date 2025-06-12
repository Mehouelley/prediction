# API de Prédiction de Catastrophes Naturelles

[![CI](https://github.com/Mehouelley/prediction/actions/workflows/nodejs.yml/badge.svg)](https://github.com/Mehouelley/prediction/actions)
[![Docker Image](https://github.com/Mehouelley/prediction/pkgs/container/prediction/badge.svg)](https://github.com/Mehouelley/prediction/pkgs/container/prediction)

API Node.js/Express sécurisée pour prédire le risque de catastrophes naturelles sur des zones géographiques.

## Fonctionnalités
- Authentification JWT (roles `user` et `admin`)
- CRUD sur les zones, relevés météo et abonnements
- Endpoints protégés `/train` (admin) et `/predict`
- ML via TensorFlow.js: entraînement et prédiction
- Stockage MySQL (local) et SQLite en mémoire (tests CI)
- Tests unitaires et d’intégration (Jest, Supertest)
- CI/CD GitHub Actions + Docker Build & Push
- Documentation interactive Swagger UI
- Déploiement via Docker Compose

## Badges
| Service | Statut |
|---------|--------|
| CI (GitHub Actions) | ![CI](https://github.com/Mehouelley/prediction/actions/workflows/nodejs.yml/badge.svg) |
| Docker Registry | ![Docker](https://github.com/Mehouelley/prediction/pkgs/container/prediction/badge.svg) |

## Installation locale
1. Cloner le dépôt :
   ```bash
   git clone https://github.com/Mehouelley/prediction.git
   cd prediction
   ```
2. Copier l’exemple d’environnement :
   ```bash
   cp .env.example .env
   ```
3. Modifier `.env` avec vos **MySQL** et clés API :
   ```ini
   PORT=3000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=password
   DB_NAME=prediction_db
   OPENWEATHER_API_KEY=xxx
   CORS_ORIGIN=http://localhost:3000
   EMAIL_HOST=smtp.example.com
   EMAIL_PORT=587
   EMAIL_USER=user
   EMAIL_PASS=pass
   TWILIO_ACCOUNT_SID=ACxxxx
   TWILIO_AUTH_TOKEN=xxxx
   TWILIO_FROM_NUMBER=+33123456789
   NOTIFICATION_THRESHOLD=0.7
   ```
4. Installer les dépendances :
   ```bash
   npm install
   ```
5. Lancer MySQL local ou via Docker Compose :
   ```bash
   docker-compose up -d mysql
   ```
6. Exécuter les migrations :
   ```bash
   npm run migrate
   ```
7. Démarrer l’API :
   ```bash
   npm start
   ```

## Docker Compose
Un service MySQL + API :
```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: prediction_db
    ports:
      - '3306:3306'
  api:
    build: .
    ports:
      - '3000:3000'
    environment:
      - DB_HOST=mysql
      - DB_USER=root
      - DB_PASSWORD=password
      - DB_NAME=prediction_db
    depends_on:
      - mysql
``` 

```bash
# Lancer tout en local
docker-compose up --build
```

## Swagger UI
Une fois l’API lancée, ouvrez :
```
http://localhost:3000/api-docs
```

## Tests
```bash
npm test
```

## CI/CD
- Pipeline exécutant :
  - Install, migrations, tests (SQLite en mémoire), lint
  - Build & Push de l’image Docker sur GitHub Container Registry

## Contribution
PR, issues, suggestions sont bienvenues !
