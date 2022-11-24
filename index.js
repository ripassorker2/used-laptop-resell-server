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
    const usersCollection = client.db("resaleLaptop").collection("users");

    //     get catagory name

    app.get("/catagory", async (req, res) => {
      const filter = {};
      const result = await catagoriesCollection.find(filter).toArray();
      res.send(result);
    });

    // get catagory products

    app.get("/products/:catagory", async (req, res) => {
      const catagory = req.params.catagory;
      const filter = { catagory: catagory };
      const result = await productsCollection.find(filter).toArray();
      res.send(result);
    });

    // app.put("/user/:email", async (req, res) => {
    //   const email = req.params.email;
    //   const user = req.body;
    //   console.log(user);
    //   const filter = { email: email };
    //   const options = { upsert: true };
    //   const updateDoc = {
    //     $set: user,
    //   };
    //   const result = await usersCollection.updateOne(
    //     filter,
    //     updateDoc,
    //     options
    //   );
    //   console.log(result);

    //   const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
    //     expiresIn: "7d",
    //   });
    //   console.log(token);
    //   res.send({ result, token });
    // });
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
