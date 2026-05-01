# MarketEx :- Backend Overview

## Overview

**MarketEx** is a full-stack **trading and portfolio management platform** built using the **MERN stack, Redis, and WebSockets**, enabling real-time and scalable financial interactions.

### Features

- Manage user profile and securely handle funds (deposit/withdraw)
- Execute **buy/sell orders** with real-time updates
- Analyze stocks using live data insights
- Maintain a personalized **watchlist**
- Search stocks with **low-latency, real-time communication**
- Track **order history**
- Monitor and manage **portfolio holdings**

### Performance & Scalability

MarketEx is designed for high performance and responsiveness:

- **WebSockets** enable real-time updates and seamless trading experience
- **Redis caching** improves data retrieval speed and reduces latency
- Optimized backend ensures scalable and efficient request handling

> **Note:** Market data is intraday (not real-time). A scheduled cron job fetches and persists data at a fixed time each day.

---

## Installation

```bash
npm init -y
npm install axios
npm install bcrypt
npm install bcryptjs
npm install body-parser
npm install compression
npm install cookie-parser
npm install cors
npm install dotenv
npm install express
npm install express-rate-limit
npm install finnhub
npm install helmet
npm install jsonwebtoken
npm install mongoose
npm install morgan
npm install node-cron
npm install passport
npm install passport-local
npm install passport-local-mongoose
npm install redis
npm install validator
npm install ws
```

## Structure

```text
project-root/
├── node_modules/
├── .env
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
├── src/
│   ├── config/
│   │   ├── db.js
│   │   └── redis.js
│   ├── constants/
│   │   └── orderConstants.js
│   ├── controllers/
│   │   ├── AuthController.js
│   │   ├── fundsController.js
│   │   ├── orderController.js
│   │   ├── PortfolioController.js
│   │   └── watchlistController.js
│   ├── middlewares/
│   │   └── AuthMiddleWare.js
│   ├── modules/
│   │   ├── FundsModel.js
│   │   ├── HoldingsModel.js
│   │   ├── OrdersHistoryModel.js
│   │   ├── UserModel.js
│   │   └── WatchlistModel.js
│   ├── routes/
│   │   ├── AuthRoute.js
│   │   ├── FundRoute.js
│   │   ├── Home.js
│   │   ├── OrderRoute.js
│   │   ├── PortfolioRoute.js
│   │   └── WatchlistRoute.js
│   ├── schems/
│   │   ├── HoldingsSchema.js
│   │   ├── OrdersHistorySchema.js
│   │   └── WatchlistSchema.js
│   ├── services/
│   │   └── orderServices.js
│   └── utils/
│       └── SecretToken.js
├── app.js
├── server.js
└── wsServer.js
```

---

## `server.js`

### Configuration

```javascript
require("dotenv").config();
process.env.VARIABLE_NAME;
```

> **This is used to load environment variables from a `.env` file into the Node.js app.**

### Database Connection

```javascript
connectDB();
```

> **A database connection call is sent to Mongoose, with the required `url` from the `.env` file.**

### App Initialization

```javascript
const app = express();
```

> **`app` is the instance of Express, which initializes the server, returns the Express application, and is also used to define routes, middlewares, etc.**

### Database Connection and Start Server

1. Database connection is called first. If there is an issue in connection, the error is logged and the server is not started.
2. It is an asynchronous process.
3. After database connection, stocks are fetched before the server starts and even if there is an issue in fetching stocks, the server is started and the database uses previous data.

---

## `app.js`

### Use CORS

A custom CORS is used to allow requests from specific sites and handle requests coming from unknown or restricted sites.

- **Methods:** Are defined to make sure only these methods are allowed to interact with the backend.
- **Credentials:** Are set to `true` to allow cookies to be sent from the frontend and received at the backend to make sure it is a valid user, middlewares are defined to handle these requests.

### Rate Limiting

- **`globalLimiter`:** Function is used to rate limit. If a server receives too many requests from a single IP address it blocks the request for 15 minutes. Prevents brute force attacks.
- **`authLimiter`:** If a user tries to login/signup or verify and reaches max attempts, the user will be blocked for 15 minutes.
- **`sensitiveLimiter`:** This is a slightly relaxed version of rate limiting. It is used for routes which are not that sensitive but still need to be rate limited, so that the server does not crash with too many requests.

### Error Handling

1. If the route does not exist, send a `404` error.
2. If there is any error in the backend, send an error message and stack trace (only in development level). In production level, send only the error message.

---

## Authentication and Authorization

### `SecretToken.js`

This is a utility file used to generate secret tokens for users after login. Exports two functions:

1. `generateAccessToken`: Returns JWT sign with id, role, JWT secret, issuer, and expiry.
2. `generateRefreshToken`: Returns JWT sign with id, JWT refresh secret, issuer, and expiry.

### JSON Web Token

**Structure:** Three base64Url encoded strings separated by dots. Mainly used in _Authorization_ and _Authentication_ after login.

1. Header
2. Payload
3. Signature

### `AuthMiddleWare`

**Technology Used:** Export of JWT from utility, Redis, and MongoDB.

1. Use of JWT to get a signed token which includes header, payload, and signature.
2. Redis is used to increase the speed of the login system without hitting MongoDB every time. If the user is present in Redis, return user data by `redisClient.get` and if not in Redis, fetch from MongoDB and store in Redis by `redisClient.setEx`. After a particular set of time, user data will be deleted from Redis.
3. If user data is not available, then hit MongoDB and store it in Redis.

### Auth

#### `AuthController`

All the logic of _signUp, login, verify, refresh, and logout_ is defined.

1. A helper is defined to cache the session in Redis, where it stores `id`, `username`, `email`, and `role` of the user.
2. User is stored in Redis for 24 hours.

#### Routes and Controllers

**1. signUp:**

- Access and store data from the body.
- Check if all the required fields are present and if empty or null, then return with error and status.
- Restrict duplicate user.
- If the user does not exist, create the user and cache the user in Redis.
- Generate an access token that will be valid for the next 30 minutes.
- Generate a refresh token that will be valid for 7 days and cache the user in Redis for 7 days.
- Set cookie.

**2. login:**

- Get data from the body and verify if it is null or empty.
- Find user and select password.
- If the user does not exist, return with error ("User does not exist").
- Using MongoDB method, check password by passing two values: password entered by the user and password stored in the DB.
- If correct, cache the session in Redis and store the cookie, else return invalid email or password.

**3. verify:**

- Request cookie stored on the frontend. If there is no cookie or token, return to login again.
- Decode token.
- First, try to get data from Redis to save time in hitting request to MongoDB.
- If data from MongoDB, store it in Redis for future use.
- Return `userData`.

**4. refresh:**

- Check for cookie. If present proceed, else return a message to login again.
- Decode the token and check for the same token in Redis.
- Create new Access token and Refresh token.

**5. logout:**

- Request cookie.
- If cookie present, decode it using the token and secret. Decoding is done by inbuilt function of JWT (JSON Web Token).
- Kill the session in Redis and also clear the cookie.

### `UserModel`

- Special use of `bcrypt` and `validator`.
- `validator`: To validate email and contact number.
- `pre('save')`: If password is modified then hash it again (when updating password).
- A method `correctPassword` is defined to check if the password is correct, using `bcrypt.compare` to compare the entered password and stored password.

---

## Funds

Server handles four requests from fundRoute: getfunds, fundsHistory, addFund, and withdrawFund

1.  `getFunds`: initially when request comes to the backend, _check redis_ if funds is present in redis fetch data from their if not then hit database, retrieve data and store it in redis for 60 minutes.

- fetch data from wallet, if wallet is not present create a wallet and initialize balance to 0.

2. `fundsHistory`: return last 20 transactions, similar working like getFunds.
3. `addFunds`:

- **startSession**: to maintain _ACID_ properties
- Check for errors, if found return and abort transaction in catch block

4. `withdrawFunds`:

- _Session_: to maintain atomicity
- _Redis Lock_: if two requests comes at the same time one request gets locked and another waits untill the request is completed, this help maintain integrity. The lock expires in 60 seconds so that after a transaction other requests can be fulfilled.

5. `updateBalance`: this will operate when there is buy/sell of stocks.

---

## Orders

Server handle 3 requests placeOrder, getUserHistory, and getOrders

1. `placeOrder`:

- Check for error cases to send valid response to the user.
- if everthing is valid pass the data to **process order**.
- Any error occured during order processing error will be thrown.

2. `processOrder`: is called by **placeOrder**

- _startSession_ session is passed through props to all the other services which are included in this transaction.
- Log history and marked status as **PENDING**, if transaction completed mark it as **COMPLETED** else mark it as **FAILED**

---

## Portfolio
1. `getPortfolio`: 
- fetchStocks from NSE.
- calculations like daily gain, total gain, etc.
- returns all the reuired data to the user.

---

## watchlist
- it just returns watchlist data stored and handles request like add or remove stock from watchlist.
- if stock is already stored return and no need to store duplicate data.

## update username | password
1. `changeUsername`:
- Check for password and username, match password if success proceed with next step.
- username should be the same as previous.
- Everything is verified update user.
2. `changepassword`:
- check password if valid proceed and update password.
- check if newPassword is similar to the older.

**Redis**: after updation store the user detail in redis and update token.
