const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 5000;

// middlewares
app.use(cors());
app.use(express.json());

// Database Connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.gvjclco.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const catagoriesCollection = client
      .db("resale-laptop")
      .collection("catagories");
    const productsCollection = client
      .db("resale-laptop")
      .collection("products");
    const usersCollection = client.db("resale-laptop").collection("users");
    const buyingCollection = client.db("resale-laptop").collection("buyng");

    //--.............create jwt.......................--

    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const filter = { email: email };

      const user = await usersCollection.findOne(filter);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
          expiresIn: "7d",
        });
        return res.send({ token: token });
      }
      res.status(401).send({ token: "" });
    });

    // ...........get catagory name ..................

    app.get("/catagory", async (req, res) => {
      const filter = {};
      const result = await catagoriesCollection.find(filter).toArray();
      res.send(result);
    });

    // ..............get catagory products...................

    app.get("/products/:catagory", async (req, res) => {
      const catagory = req.params.catagory;
      const filter = { catagory: catagory };
      const result = await productsCollection.find(filter).toArray();
      res.send(result);
    });

    // ............create user and save in db.................

    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // ............buying data post ..........................

    app.post("/buying", async (req, res) => {
      const buyingData = req.body;
      const result = await buyingCollection.insertOne(buyingData);
      res.send(result);
    });
  } finally {
  }
}

run().catch((err) => console.error(err));

app.get("/", (req, res) => {
  res.send("Server is running...");
});

app.listen(port, () => {
  console.log(`Server is running...on ${port}`);
});
