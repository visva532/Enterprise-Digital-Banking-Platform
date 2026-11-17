# FinCore Nexus: Backend

A digital banking platform built as small, independent services. Customers sign up, complete KYC, open an account, send money to each other, and apply for loans. Staff (Teller, Manager, Admin) review customers, accounts, KYC and loans.

> This README is for the **`backend`** branch. The React app lives on the **`feature/frontend-asutosh`** branch and has its own README. Use **two separate clones** (see Quick start), because switching branches swaps the files.

---

## 1. Architecture

```
React app (http://localhost:5173)
        |
        |  HTTPS + JWT (Authorization: Bearer ...)
        v
+----------------+  +------------------+  +-----------------+
| auth-service   |  | customer-service |  | account-service |
| 8086           |  | 8081             |  | 8082            |
| sign up/in,    |  | profile, KYC     |  | accounts,       |
| OTP, staff     |  | status           |  | statements,     |
| management     |  |                  |  | transfers       |
+----------------+  +------------------+  +-----------------+
+----------------+  +------------------+  +-----------------+
| loan-service   |  | payment-service  |  | kyc-service     |
| 8083           |  | 8084             |  | 8085            |
| loan requests  |  | send money,      |  | KYC applications|
| and decisions  |  | payees, fraud    |  | Re-KYC, review  |
+----------------+  +------------------+  +-----------------+
        |  each service has its OWN database (MySQL)  |
        v                                             v
   auth_db  customer_db  account_db  loan_db  payment_db  kyc_db

Service-to-service calls (protected by the X-Internal-Key header):
  payment-service --> account-service   name check, balance move (one atomic transfer)
  kyc-service     --> customer-service  pushes the KYC status every 15 seconds
  loan-service    --> kyc-service       asks "is this customer KYC verified?"

Helpers (Docker):  MySQL (3307)   Mailpit fake inbox (SMTP 1025, UI 8025)   Redis (6379, reserved)
```

Key ideas:

- **Database per service.** A service never reads another service's tables. It uses an API.
- **Login happens once.** `auth-service` issues a JWT. Every other service only *verifies* the token (same secret), so it never calls auth-service. If auth-service is down, people who are already signed in keep working until their token expires.
- **Money moves in one transaction.** payment-service validates and records the payment, then account-service debits the sender and credits the receiver in a single database transaction. Both happen or neither does.
- **Emails are sent after the database commit**, in the background. A mail problem never breaks a payment or a KYC decision.

---

## 2. Services at a glance

| Service | Port | Database | What it owns |
|---|---|---|---|
| `auth-service` | 8086 | `auth_db` | Sign up, sign in, email OTP, forgot/reset password, JWT, creating employee accounts, first Admin |
| `customer-service` | 8081 | `customer_db` | Customer profile (name, phone, address) and the KYC status shown to staff |
| `account-service` | 8082 | `account_db` | Account opening, accounts, balances, statements, freeze/block, admin dashboard, transfers, transaction emails |
| `loan-service` | 8083 | `loan_db` | Loan applications, Manager approve/reject (needs verified KYC) |
| `payment-service` | 8084 | `payment_db` | Send money (UPI/IMPS/NEFT simulated), payees, fraud rules, duplicate protection, retry of stuck payments |
| `kyc-service` | 8085 | `kyc_db` | KYC applications, email OTP, risk check, staff review, Re-KYC, expiry job, document storage, audit trail |

Folders `api-gateway` and `common-lib` exist but are **not built yet** (see Roadmap).

---

## 3. Tech stack

| Area | Technology |
|---|---|
| Language / runtime | Java 21 (JDK 21 required) |
| Framework | Spring Boot 4.1.1 (Spring Framework 7, Spring Security, Spring Data JPA, Hibernate 7) |
| Database | MySQL 8 in Docker, `ddl-auto: update` (tables are created automatically) |
| Auth | JWT (HS256, jjwt 0.12.6), BCrypt password hashing |
| Email | Spring Mail: Mailpit (fake inbox) by default, real Gmail with the `gmail` profile |
| Build | Maven multi-module (`pom.xml` at the root is the parent) |
| Frontend | React + Vite (separate branch) |
| Containers | Docker Compose for MySQL, Mailpit, Redis |

---

## 4. Repository layout

```
.
├── pom.xml                  parent POM (Spring Boot 4.1.1, Java 21, module list)
├── docker-compose.yml       MySQL, Redis, Mailpit
├── README.md
├── auth-service/
├── customer-service/
├── account-service/
├── loan-service/
├── payment-service/
├── kyc-service/
├── api-gateway/             (empty, planned)
└── common-lib/              (empty, planned)
```

Every service uses the same layers:

```
src/main/java/com/fincore/<service>/
├── <Service>Application.java
├── config/        security rules, CORS, startup data
├── controller/    HTTP endpoints only
├── service/       business logic and transactions
├── repository/    database access (Spring Data JPA)
├── entity/        database tables
├── dto/           request and response objects (entities are never returned)
├── enums/
├── exception/     ApiException + GlobalExceptionHandler (one JSON error format)
├── security/      JWT parsing, internal-key filter
└── (client/, job/, util/, event/ where needed)
src/main/resources/
├── application.yml          settings (ports, database, secrets with dev defaults)
└── application-gmail.yml    real-email settings (only loaded with the gmail profile)
```

Rules we follow: controllers only handle HTTP; business rules live in services; money is always `BigDecimal`; Aadhaar and PAN are never stored in readable form.

---

## 5. Roles and permissions

Four roles. The "Sign in as" option on the login page is checked **by the server** against the account's real role. Every API also checks the role, so hiding a button is never the only protection.

| Capability | Customer | Teller | Manager | Admin |
|---|:--:|:--:|:--:|:--:|
| Sign up, own profile, KYC, open account, send money, payees, apply for loans | yes | | | |
| Search and view customers, accounts, transaction history | | yes | yes | yes |
| View KYC applications (masked, read only) | | yes | yes | yes |
| Open KYC documents, approve or reject KYC, request Re-KYC | | | yes | yes |
| Freeze / unfreeze an account (reason required, audited) | | | yes | yes |
| Approve or reject loans | | | yes | |
| Block, unblock, deactivate accounts | | | | yes |
| Money dashboard, create employees, change roles, enable/disable employees | | | | yes |

Customers register themselves. **Staff accounts are created only by an Admin.** The very first Admin is created automatically when auth-service starts (see Quick start).

---

## 6. Quick start

### 6.1 Install

- **JDK 21** (Temurin). Check with `java -version`. **JDK 26 breaks the build** (Lombok).
- **Docker Desktop** (running)
- **IntelliJ IDEA** (Community or Ultimate)
- **Node.js 18+** and **Git**
- Optional: Postman

### 6.2 Get the code (two clones)

```
git clone https://github.com/visva532/Enterprise-Digital-Banking-Platform.git edbp-backend
cd edbp-backend
git checkout backend

cd ..
git clone https://github.com/visva532/Enterprise-Digital-Banking-Platform.git edbp-frontend
cd edbp-frontend
git checkout feature/frontend-asutosh
```

### 6.3 Start the infrastructure

```
cd edbp-backend
docker compose up -d
docker ps
```

You should see three containers: MySQL (host port **3307**), Mailpit, Redis.

MySQL uses host port 3307, not 3306, so it does not clash with a MySQL installed on your PC.
The databases (`auth_db`, `customer_db`, ...) are created automatically when each service starts.

### 6.4 Start the backend (IntelliJ)

1. **File > Open**, select the `edbp-backend` folder (the one with `pom.xml`).
2. **File > Project Structure > Project**: set the SDK to **JDK 21**.
3. Open the **Maven** panel and click **Reload All Maven Projects**. Wait for it to finish. You should see the six services, each listed **once**.
4. Run each application once (green arrow next to `main`) so IntelliJ creates its run configuration. Stop them again.
5. **Run > Edit Configurations > "+" > Compound**. Name it `Backend (all services)` and add all six:
   `AuthServiceApplication`, `CustomerServiceApplication`, `AccountServiceApplication`, `LoanServiceApplication`, `PaymentServiceApplication`, `KycServiceApplication`.
   Tick **Store as project file** so teammates get it too.
6. Select that configuration and press **Run**. All six services start together.

Check that every service is up:

| Service | Health URL |
|---|---|
| auth-service | http://localhost:8086/actuator/health |
| customer-service | http://localhost:8081/actuator/health |
| account-service | http://localhost:8082/actuator/health |
| loan-service | http://localhost:8083/actuator/health |
| payment-service | http://localhost:8084/actuator/health |
| kyc-service | http://localhost:8085/actuator/health |

Each should show `{"status":"UP"}`.

### 6.5 Start the frontend

```
cd edbp-frontend/frontend
npm install
npm run dev
```

Open http://localhost:5173. Optional: create `frontend/.env` if your ports differ:

```
VITE_AUTH_API=http://localhost:8086
VITE_CUSTOMER_API=http://localhost:8081
VITE_ACCOUNT_API=http://localhost:8082
VITE_LOAN_API=http://localhost:8083
VITE_PAYMENT_API=http://localhost:8084
VITE_KYC_API=http://localhost:8085
```

Restart `npm run dev` after changing `.env`.

### 6.6 First sign-in (Admin)

When auth-service starts on an **empty database** it creates one Admin automatically:

| Setting | Value |
|---|---|
| Sign in as | **Admin** |
| Email | `tharunvishva427+admin@gmail.com` |
| Password | `ChooseAStrong@Pass1` |

**These are demo credentials, for local copies only.** Everyone who can read this repository can see them. Never reuse this password anywhere else, and never use it on a real or deployed system.

- To use your own admin instead, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` **before the first start** (see Configuration).
- If the database already has an Admin, these values are ignored and the existing Admin stays.
- `ADMIN_EMAIL` must not already belong to a customer.
- If you turn on real Gmail (section 7), set `ADMIN_EMAIL` to your own address first, so the Admin's OTP emails reach you and not the original owner.

Sign in with the **Admin** option, open **Employees**, and create a Manager and a Teller.

### 6.7 Where do emails go?

By default **no real email is sent**. Every OTP and notification lands in **Mailpit**: http://localhost:8025.
To send real emails, see "Real emails (Gmail)" below.

### 6.8 Without IntelliJ (optional)

With Maven installed (`mvn -v`), start each service in its own terminal from the repo root:

```
mvn -pl auth-service spring-boot:run
mvn -pl customer-service spring-boot:run
mvn -pl account-service spring-boot:run
mvn -pl loan-service spring-boot:run
mvn -pl payment-service spring-boot:run
mvn -pl kyc-service spring-boot:run
```

---

## 7. Configuration

Everything has a development default in `application.yml`. Override with environment variables:

| Variable | Used by | Purpose | Dev default |
|---|---|---|---|
| `JWT_SECRET` | all services | Signs and verifies tokens. **Must be identical everywhere.** | built-in dev value |
| `JWT_EXPIRATION_MINUTES` | auth-service | Session length | `60` |
| `INTERNAL_API_KEY` | account, customer, payment, kyc, loan | Service-to-service key. **Must be identical everywhere.** | built-in dev value |
| `PII_SECRET` | account, kyc | Key for hashing Aadhaar and PAN | built-in dev value |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | auth-service | First Admin account (empty database only) | `tharunvishva427+admin@gmail.com` / `ChooseAStrong@Pass1` |
| `SPRING_PROFILES_ACTIVE` | auth, account, kyc | Set to `gmail` for real emails | not set |
| `MAIL_USERNAME`, `MAIL_PASSWORD` | auth, account, kyc | Gmail address and **app password** | not set |
| `KYC_STORAGE_DIR` | kyc-service | Where uploaded KYC documents are saved | `./kyc-uploads` |
| `KYC_WATCHLIST` | kyc-service | Demo screening names (comma separated) | `SANCTIONED PERSON,BLOCKED PERSON` |
| `ACCOUNT_SERVICE_URL`, `CUSTOMER_SERVICE_URL`, `KYC_SERVICE_URL` | payment / kyc / loan | Where the other services live | `localhost` ports above |

Setting a Windows variable (then fully restart IntelliJ so it picks them up):

```
setx ADMIN_EMAIL "you+admin@gmail.com"
setx ADMIN_PASSWORD "AnotherStrong@Pass9"
```

Other systems: `export ADMIN_EMAIL=...`

Limits you can read from the code: OTP valid 5 minutes, 5 wrong attempts, 60 second resend wait; KYC valid 730 days with a reminder 30 days before.

### Real emails (Gmail)

1. In your Google account turn on **2-Step Verification**, then create an **App password** at https://myaccount.google.com/apppasswords (16 characters, no spaces).
2. Set these variables and restart IntelliJ:

```
setx SPRING_PROFILES_ACTIVE "gmail"
setx MAIL_USERNAME "yourdedicated@gmail.com"
setx MAIL_PASSWORD "abcdefghijklmnop"
```

3. Restart the services. The console of auth, account and kyc shows `The following 1 profile is active: "gmail"`.
   Never commit the app password. To go back to Mailpit, remove `SPRING_PROFILES_ACTIVE` and restart.

---

## 8. How the main flows work

**Sign up and sign in**
1. Customer signs up with email and password. auth-service stores a BCrypt hash and emails a 6-digit OTP (stored hashed, expires, attempt limited).
2. Customer enters the OTP. The email is verified and a JWT is returned.
3. The JWT carries the user id, email and role. The frontend sends it on every call. Forgot password uses the same OTP mechanism and sends a "password changed" email.

**KYC (kyc-service)**
1. Customer submits details plus an ID proof and a selfie (JPEG, PNG or PDF, 2 MB max, checked by file content).
2. An OTP is emailed. After the OTP, automated checks run (format, age 18+, duplicate Aadhaar or PAN, simulated face match, politically-exposed declaration, name watchlist) and give a risk score.
3. **Low risk:** approved automatically. **Medium or high risk:** goes to Under review, where a Manager or Admin opens the documents and approves or rejects with remarks.
4. Every step is written to an append-only audit log, including each time a document is opened.
5. **Re-KYC:** KYC is valid for 2 years. A daily job (2:00 AM IST) expires old KYC and sends a reminder 30 days ahead. A Manager can also request Re-KYC. A verified customer can update their details at any time. The old KYC stays valid until the new one is approved.
6. kyc-service pushes the status to customer-service, so staff see it on the customer screens.

**Opening a bank account (account-service)**
Customer enters Aadhaar, Aadhaar-linked mobile, PAN and address and confirms an email OTP. A 12-digit account number is generated. Aadhaar and PAN are stored only as masked digits plus a keyed hash.

**Sending money (payment-service and account-service)**
1. The customer picks a saved payee or types an account number, and verifies it (the receiver's name is shown).
2. payment-service checks limits and fraud rules, saves the payment as `PENDING`, and asks account-service to transfer.
3. account-service locks both accounts, checks the balance and status, debits and credits in **one transaction**, writes a transaction row for each side, and after the commit emails **both** the sender and the receiver.
4. The payment becomes `COMPLETED` or `FAILED`. If account-service does not answer, the payment stays `PENDING` and a job retries every 30 seconds. A payment reference makes every retry safe, so money can never move twice.

Rules: UPI up to 1,00,000, IMPS up to 5,00,000, NEFT up to 10,00,000 per payment; 2,00,000 per day; at most 5 payments per minute; a frozen, blocked or closed account cannot send or receive.

**Loans (loan-service)**
A customer with **verified KYC** applies. A Manager approves or rejects (rejection needs a reason). Approval does not yet create a repayment schedule.

**Staff operations**
Admin: money dashboard, employees and roles, block/unblock/deactivate accounts, demo deposit. Manager: KYC review, loan decisions, freeze/unfreeze. Teller: search and read-only views. Freeze, block and KYC decisions always need a reason and are audited.

---

## 9. API reference

All endpoints expect `Authorization: Bearer <token>` unless marked public. Errors share one JSON shape: `{ "timestamp", "status", "message", "errors" }`.

### auth-service (8086)
| Method | Path | Who | Purpose |
|---|---|---|---|
| POST | `/api/auth/signup` | public | Create account, email OTP |
| POST | `/api/auth/verify-otp` | public | Verify email, returns token |
| POST | `/api/auth/resend-otp` | public | New signup OTP |
| POST | `/api/auth/signin` | public | Sign in (`email`, `password`, `loginAs`) |
| POST | `/api/auth/forgot-password` | public | Send reset OTP |
| POST | `/api/auth/reset-password` | public | Set a new password with the OTP |
| GET / POST | `/api/admin/employees` | Admin | List / create employees |
| PUT | `/api/admin/users/{id}/role` | Admin | Change an employee's role |
| PUT | `/api/admin/users/{id}/enabled` | Admin | Enable or disable an employee |

### customer-service (8081)
| Method | Path | Who | Purpose |
|---|---|---|---|
| GET / PUT | `/api/customers/me` | Customer | View / update own profile |
| GET | `/api/customers/by-user/{userId}` | Staff | One customer |
| GET | `/api/staff/customers?q=` | Staff | Search customers |

### account-service (8082)
| Method | Path | Who | Purpose |
|---|---|---|---|
| GET | `/api/accounts/me` | Customer | My accounts |
| POST | `/api/accounts/open` | Customer | Start account opening (sends OTP) |
| POST | `/api/accounts/open/verify` | Customer | Confirm OTP, creates the account |
| POST | `/api/accounts/open/resend` | Customer | Resend OTP |
| GET | `/api/accounts/{id}/transactions` | Customer | My statement |
| GET | `/api/staff/accounts?q=&status=` | Staff | Search accounts |
| GET | `/api/staff/accounts/{id}` and `/transactions` | Staff | Account detail and history |
| PUT | `/api/manager/accounts/{id}/freeze` and `/unfreeze` | Manager, Admin | Freeze or unfreeze (reason) |
| GET | `/api/manager/accounts/{id}/audit` | Manager, Admin | Status change history |
| PUT | `/api/admin/accounts/{id}/block`, `/unblock`, `/deactivate` | Admin | Block, unblock, close |
| GET | `/api/admin/dashboard` | Admin | Money totals and 7-day flow |
| POST | `/api/admin/demo/deposit` | Admin | Demo money for testing |
| any | `/internal/**` | other services | Account lookup and transfer |

### loan-service (8083)
| Method | Path | Who | Purpose |
|---|---|---|---|
| POST | `/api/loans` | Customer | Apply (needs verified KYC) |
| GET | `/api/loans/me` | Customer | My applications |
| GET | `/api/manager/loans?status=` | Manager | List applications |
| PUT | `/api/manager/loans/{id}/approve` and `/reject` | Manager | Decide |

### payment-service (8084)
| Method | Path | Who | Purpose |
|---|---|---|---|
| POST | `/api/payments` | Customer | Send money (`idempotencyKey` required) |
| GET | `/api/payments` and `/{id}` | Customer | My payments |
| GET | `/api/payments/verify-account/{accountNumber}` | Customer | Receiver name check |
| GET / POST | `/api/beneficiaries` | Customer | List / add payees |
| DELETE | `/api/beneficiaries/{id}` | Customer | Remove a payee |

### kyc-service (8085)
| Method | Path | Who | Purpose |
|---|---|---|---|
| GET | `/api/kyc/me` | Customer | KYC status and what to do next |
| GET | `/api/kyc/applications` | Customer | My applications |
| POST | `/api/kyc/applications` | Customer | Submit (multipart: `data` JSON, `idProof`, `selfie`) |
| POST | `/api/kyc/applications/{id}/verify-otp` and `/resend-otp` | Customer | OTP step |
| GET | `/api/staff/kyc/applications?q=&status=` | Staff | List (masked, read only) |
| PUT | `/api/manager/kyc/applications/{id}/approve` and `/reject` | Manager, Admin | Decide |
| GET | `/api/manager/kyc/applications/{id}/audit` | Manager, Admin | Audit trail |
| GET | `/api/manager/kyc/applications/{id}/documents/{ID_PROOF or SELFIE}` | Manager, Admin | View a document |
| PUT | `/api/manager/kyc/profiles/{userId}/re-kyc` | Manager, Admin | Ask for Re-KYC |

---

## 10. Security design

- **Passwords:** BCrypt. **OTPs:** stored hashed, short expiry, attempt limit, resend cooldown.
- **Tokens:** HS256 JWT, 60 minutes by default. The frontend signs the user out when the token expires.
- **Roles** are enforced on every endpoint (Spring Security), never only in the UI.
- **Internal endpoints** (`/internal/**`) need the `X-Internal-Key` header. Customers get 401.
- **Personal data:** Aadhaar and PAN keep only masked digits plus an HMAC hash (used to stop the same ID being used twice). KYC documents are stored on disk, are viewable only by Manager and Admin, and each view is audited. The folder `kyc-uploads/` is git-ignored.
- **Duplicate-payment protection:** idempotency keys, a unique payment reference, and row locks on balances.
- **Emails never leak accounts:** forgot-password gives the same answer for known and unknown emails.
- **The demo Admin password is public.** It is written in this README and in `auth-service/application.yml`. Change it (set `ADMIN_EMAIL` and `ADMIN_PASSWORD`) for anything that is not a local demo.
- Before any real deployment set your own `JWT_SECRET`, `INTERNAL_API_KEY` and `PII_SECRET`, use HTTPS, and move uploads to encrypted object storage.

---

## 11. What happens when something is down

| If this is down | Effect |
|---|---|
| MySQL | Services cannot start or answer |
| auth-service | Nobody can sign up, sign in or reset a password. People already signed in keep working until their token expires |
| customer-service | Profile pages and staff customer search fail. KYC status updates queue up and are retried |
| account-service | Account screens and staff account tools fail. Sending money is refused with a clear message. Payments already in flight stay `PENDING` and are retried |
| payment-service | Only Send money and Payees are unavailable |
| kyc-service | KYC pages fail. Loan applications are refused with "KYC service is not reachable" |
| loan-service | Only the loan pages fail |
| Email (Mailpit or Gmail) | Emails are logged as failed but money moves and KYC decisions still complete. OTPs can be resent |

---

## 12. Demo walkthrough (try the whole system)

1. Start Docker, the backend and the frontend. Open Mailpit (http://localhost:8025).
2. Sign in as **Admin** with the demo credentials from section 6.6. Create a **Manager** and a **Teller** (use emails you can read, for example `you+manager@gmail.com`).
3. Sign up **two customers**, `you+a@gmail.com` and `you+b@gmail.com` (Gmail delivers both to one inbox). Confirm each signup OTP.
4. For each customer open **KYC** and submit. Use test values: Aadhaar `234567890123`, PAN `ABCDE1234F`, mobile `9876543210`, pincode `600001`, and any small JPEG/PNG for both files. Confirm the OTP. A normal application is approved at once.
   To see the review path, tick "politically exposed" or use the name "Sanctioned Person". Then sign in as the **Manager** > KYC review > open documents > approve.
5. For each customer **open a bank account** (Aadhaar, mobile, PAN, address, OTP). Note both 12-digit account numbers.
6. As **Admin**, open Money dashboard > Demo deposit, and put 10,000 into customer A's account.
7. As **customer A**: Payments > Send money > enter B's account number > Verify (B's name appears) > amount > Confirm.
8. Check the inbox: A gets a "debited" email and B gets a "credited" email. Both History tabs show the transaction.
9. As **Teller**: search the customers and see both accounts and the transaction history, read only.
10. As **Manager**: freeze A's account, then try another payment (it is refused). Apply for a loan as a customer and approve or reject it as Manager.

---

## 13. Troubleshooting

| Problem | Fix |
|---|---|
| `Communications link failure` / `Connection refused` on startup | Docker or MySQL is not running. `docker compose up -d`, check `docker ps`, wait 15 seconds |
| Port 3306 already in use | A local MySQL uses it. Our MySQL uses 3307, which is already configured |
| `javac 26` or `ExceptionInInitializerError` (Lombok) | IntelliJ is using the wrong JDK. Set JDK 21 in File > Project Structure (and Maven > Runner) |
| `Cannot resolve symbol 'SpringApplication'` | Maven did not load. Open the Maven panel > Reload All Maven Projects. Make sure no module is listed twice in the root `pom.xml` |
| `Could not find or load main class` | The run configuration uses the wrong module. In Edit Configurations set the module (`-cp`) to the service, or recreate it from the green arrow |
| "Invalid email or password" for the Admin | The database was reset (`down -v`) or the Admin password was changed. Use the demo credentials from section 6.6, or delete the Admin row (commands below) and restart auth-service |
| "The server did not accept your sign-in token" | Services use different `JWT_SECRET` values, or a service runs an old build. Use the same secret everywhere and rebuild |
| No OTP email | Open Mailpit (http://localhost:8025). For real email see "Real emails (Gmail)" |
| CORS error in the browser | The backend allows any `http://localhost:*` origin. Restart the backend after pulling changes |
| New enum value gives a database error | MySQL stores enums as native `ENUM` columns. Run an `ALTER TABLE ... MODIFY COLUMN` for that column (or reset the dev database) |
| Admin was not created at startup | `ADMIN_EMAIL` already belongs to a customer, or an Admin already exists. Use another address (for example `you+admin@gmail.com`) |

Useful commands (find your container name with `docker ps`):

```
docker exec -it <mysql-container> mysql -uroot -proot -e "SELECT email, role, enabled FROM auth_db.users;"
docker exec -it <mysql-container> mysql -uroot -proot -e "DELETE FROM auth_db.users WHERE role='ADMIN';"
docker compose down -v        # DELETES ALL DEV DATA, then: docker compose up -d
```

---

## 14. Git workflow

- Branches: `backend` (this code) and `feature/frontend-asutosh` (React app). Do not push straight to a branch you do not own: open a **pull request**.
- Pull before you push: `git pull origin <branch>`.
- Never commit secrets, `.env`, app passwords, or the `kyc-uploads/` folder.
- Keep one module per commit when you can. Commit messages: `feat(kyc): ...`, `fix(payment): ...`, `docs: ...`.

---

## 15. Known limitations and roadmap

- All money is **dummy**. UPI, IMPS and NEFT are labels with different limits. There is no real bank network.
- **Face match is simulated.** OCR and liveness checks are not built. `VerificationService` in kyc-service is the single place to plug in a real provider.
- Approving a loan does not yet create an EMI schedule, disbursement or repayments.
- No refresh tokens: after the token expires the user signs in again. A token stays valid until it expires, even after a role change.
- The receiver name check can be used to probe account numbers. A real system would rate-limit it.
- The demo Admin credentials are public in this repository. They are for local demos only.
- Not built yet: `api-gateway`, `common-lib` (shared code is currently copied between services), Kafka events, Redis caching (the Redis container is reserved), Flyway migrations (we use `ddl-auto: update`), Kubernetes/Helm, SMS or in-app notifications, and automated tests.