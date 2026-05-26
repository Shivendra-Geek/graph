const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@as-integrations/express5');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const typeDefs    = require('./schema/typeDefs');
const resolvers   = require('./resolvers/index');
const connectDB   = require('./config/db');

async function startServer() {
  const app  = express();
  const PORT = process.env.PORT || 4000;

  await connectDB();

  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();

  app.use(
    '/graphql',
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ')
          ? authHeader.slice(7)
          : null;
        return { token };
      },
    })
  );

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/graphql`);
  });
}

startServer();
