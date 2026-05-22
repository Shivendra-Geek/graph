const { ApolloServer } = require('@apollo/server');
const express = require('express');
require('dotenv').config();
const { expressMiddleware } = require('@as-integrations/express5');
const cors = require('cors');
const typeDefs = require('./schema/typeDefs');
const resolvers = require('./resolvers/index');
const connectDB = require('./config/db');

async function startServer() {
    const app = express();
    const PORT = process.env.PORT || 4000;

    //Connect to MongoDB
    await connectDB();

    const server = new ApolloServer({
        typeDefs,
        resolvers,
    });

    await server.start();
    
    app.use(
        '/graphql', 
        cors(),
        express.json(),
        expressMiddleware(server),
    );

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}


startServer();