# MarketEx :- Backend Overview

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
    ├── config/
        ├── db.js
        ├── redis.js
    ├── constants/
        ├── orderConstants.js
    ├── controllers/
        ├── AuthController.js
        ├── fundsController.js
        ├── orderController.js
        ├── PortfolioController.js
        ├── watchlistController.js
    ├── middlewares/
        ├── AuthMiddleWare.js
    ├── modules/
        ├── FundsModel.js
        ├── HoldingsModel.js
        ├── OrdersHistoryModel.js
        ├── UserModel.js
        ├── WatchlistModel.js
    ├── routes/
        ├── AuthRoute.js
        ├── FundRoute.js
        ├── Home.js
        ├── OrderRoute.js
        ├── PortfolioRoute.js
        ├── WatchlistRoute.js
    ├── schems/
        ├── HoldingsSchema.js
        ├── OrdersHistorySchema.js
        ├── WatchlistSchema.js
    ├── services/
        ├── orderServices.js
    ├── utils
        ├── SecretToken.js
├── app.js
├── server.js
├── wsServer.js
```

## server.js

### configuration

````javascript
require("dotenv").config();
process.env.VARIABLE_NAME 
**this is used to load environment variables from a `.env` file into node.js app.**
```

### database connection
````javascript
connectDB()
**a database connection call is sent to the mongoose, with the required `url` from .env file.**
````

###
````javascript
const app = require('./app'); 
const { fetchStock } = require('./src/controllers/PortfolioController');
**`app` is the instance of express, which initializes server, returns express application and also app is used to define routes,middleware,.etc.**
````

### database connection and start server
1. database connection is called first, if there is issue in connection the error is logged and server is not started.
2. it is an asynchronous process.
3. after database connection, stocks are fetched before server start and even if there is issue in fetching stocks, server is started and database uses previous data.

## app.js

### use cors
 a custom cors is used to allow requests form specific sites and handle requests coming from unknown or restricted sites.
 **Methods** are defined to make sure only this methods are allowed to interact with backend.
 **Credenctials** are set to true to allow cookies to be sent from frontend and receive at backend to make sure it is a valid a user, middlewares are defiend to handle these requests.

 ### rate limiting
**globalLimiter** function is used to rate limit, if a server receives too many request from a single ip address it blocks the request for 15 minutes. Prevents from brute force attacks.
**authLimiter** if a user to tries to login/signup or verify and reaches max attempt, user will be blocked for 15 minutes.
**sensitiveLimiter** this is little relaxed version of rate limiting, it is used for routes which are not that sensitive but still need to be rate limited, so that server is not crashed with too many requests.

### error handling
1. if route does not exist send 404 error
2. if there is any error in the backend send error message and stack trace (only in development level), in production level send only error message.

## Authentication and Authorization

### SecretToken.js
this is a utility file used to generate secret tokens for users after login. Exports two functions
1. generateAccessToken:- return jwt sign with id,role,JWT secret,issuer and expiry.
2. generateRefreshToken:- return jwt sign with id,JWT refresh secret,issuer and expiry.

### JSON Web Token
**Structure** three base64Url encoded strings seperated by dots. Mainly used in *Authorozation* and *Authentication* after login.
1. Header
2. Payload
3. Signature 

### AuthMiddleWare
**Technology Used**:- export of JWT from utility, Redis, and MongoDb.
1. Use of JWT to get signed token which includes header, payload and signature.'
2. Redis used to increase speed of login system without hitting mongoDB every time, if the user is present in redis return user data by `redisClient.get` and if not in redis, fetch from MongoDB and store in redis by `redisClient.setEx` after a particular set of time user data will be deleted from redis.
3. If user data is not availabe then hit MongoDb and store it in redis. 

### Auth
**AuthController**
All the logic of *signUp, login, verify, refresh and logout* is defined.
1. A helper is defined to cache session in redis, where it stores id, usernamem email and role of the user.
2. User is stored in redis for 24hrs

**Routes and Controllers** 

1. signUp:
- access and store data from the body.
- check if all the required fields are present and if empty or null than return with error and status.
- restrict duplicate user.
- if user does not exist create user and cache the user in redis.
- generate access token that will be valid for the next 30min
- generate refresh token that will be valid for 7days and cache the user in redis for 7 days
- set cookie

2. login:
- get data from body and verify, if it is null or empty.
- find user and select password
- if user does not exist return with error ("User does not exist").
- using mongo db method check password, by passing two values password entered by the user and password stored in db.
- if correct cache the session in redis and store the cookie, else return invalid email or password.

3. verify:
- request cookie stored on frontend, if no cookie or token return login again.
- decode token
- first try to get data from redis to save time in hittin request to MongoDB.
- if data from mongoDB, store it in redis for future use.
- return userData

4. refresh:
- check for cookie, if present proceed else return a message to login again.
- decode the token and check for the same token in redis
- create new Access token and Refresh token

5. logout:
- req cookie
- if cookie present, decode it using the token and secret. Decoding is don eby inbuild fucntion of JWT(JSON Web Token).
- kill the session in redis and also clear cookie