**FinCore Nexus: how to run frontend + backend**

The repo has two branches. Use **two separate clones**, because switching branches swaps the files.
- Frontend: `feature/frontend-asutosh`
- Backend: `backend`

**Install first:** JDK 21 (Temurin), Docker Desktop, IntelliJ IDEA, Node.js 18+, Git.

**1. Get the code**
```
git clone https://github.com/visva532/Enterprise-Digital-Banking-Platform.git edbp-backend
cd edbp-backend
git checkout backend

cd ..
git clone https://github.com/visva532/Enterprise-Digital-Banking-Platform.git edbp-frontend
cd edbp-frontend
git checkout feature/frontend-asutosh
```
If you already cloned: run `git fetch origin`, then `git checkout backend`.

**2. Start the backend**
```
cd edbp-backend/backend
docker compose up -d
```
This starts MySQL (host port 3307), Redis and Mailpit (fake inbox).
Then in IntelliJ: File > Open > select the `backend` folder, set Project SDK to JDK 21, reload Maven, and run:
- `AuthServiceApplication` (port 8086)
- `CustomerServiceApplication` (port 8081)

Check http://localhost:8086/actuator/health and http://localhost:8081/actuator/health. Both should show UP.

**3. Start the frontend**
```
cd edbp-frontend/frontend
npm install
npm run dev
```
Open http://localhost:5173.

**4. Test sign up**
Create an account in the app. OTP emails are NOT sent to Gmail in dev. Open http://localhost:8025 (Mailpit) to read the OTP.

**Common problems**
- MySQL port error: the compose file already uses 3307. If 3307 is also taken, change it in `docker-compose.yml` and both `application.yml` files.
- `javac 26` or Lombok error: IntelliJ is using the wrong JDK. Use JDK 21 (File > Project Structure).
- "Cannot reach the server" in the app: the backend is not running.
- CORS error: your frontend port is not 5173 or 3000. Tell Visva to add it.

**Git rules**
- Pull before you push: `git pull origin <branch>`.
- Don't push directly to someone else's branch. Open a pull request.
- **2. Start the backend**
```
cd edbp-backend
docker compose up -d
```
This starts MySQL (host port 3307), Redis and Mailpit (fake inbox).
Then in IntelliJ: File > Open > select the `edbp-backend` folder, set Project SDK to JDK 21, reload Maven, choose the run configuration **Backend (all services)** and click Run.
It starts auth-service (8086), customer-service (8081) and account-service (8082) together.

Check the health URLs: http://localhost:8086/actuator/health, :8081 and :8082 should all show UP.