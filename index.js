const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const stripe = require("stripe")(process.env.STRIPE_KEY);

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
    const paymentCollection = client.db("resale-laptop").collection("payment");

    //.............verify JWT........................

    function verifyJWT(req, res, next) {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).send({ message: "Unauthorization access !!" });
      }
      const token = authHeader.split(" ")[1];
      // console.log(token);
      jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
          return res.status(402).send({
            success: false,
            message: "Forbidden access",
          });
        }
        req.decoded = decoded;
        next();
      });
    }

    //.............verify Admin........................

    const verifyAdmin = async (req, res, next) => {
      const decodedEmail = req.decoded.email;

      const query = {
        email: decodedEmail,
      };

      const user = await usersCollection.findOne(query);
      if (user?.role !== "Admin") {
        return res.status(403).send({
          message: "You are not  admin ,so  cannot visit this route !!",
        });
      }
      next();
    };

    //.............verify Seller........................

    const verifySeller = async (req, res, next) => {
      const decodedEmail = req.decoded.email;
      const query = {
        email: decodedEmail,
      };

      const user = await usersCollection.findOne(query);
      if (user?.role !== "Seller") {
        return res.status(403).send({
          message: "You are not  seller , so  cannot visit this route !!",
        });
      }
      next();
    };
    // //.............verify Buyer........................

    const verifyBuyer = async (req, res, next) => {
      const decodedEmail = req.decoded.email;
      const query = {
        email: decodedEmail,
      };

      const user = await usersCollection.findOne(query);
      if (user?.role !== "Buyer") {
        return res.status(403).send({
          message: "You are not  Buyer , so  cannot visit this route !!",
        });
      }
      next();
    };

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

    // ...................cheekk user role .................

    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await usersCollection.findOne(query);
      res.send(result);
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
      const query = {
        $and: [{ catagory: catagory }, { status: "available" }],
      };
      const result = await productsCollection.find(query).toArray();
      res.send(result);
    });

    //.............get product by emial .............

    app.get("/product/:email", verifyJWT, verifySeller, async (req, res) => {
      const email = req.params.email;
      const filter = { sellerEmail: email };
      const result = await productsCollection.find(filter).toArray();
      res.send(result);
    });

    // .................. post product ................

    app.post("/products", async (req, res) => {
      const product = req.body;
      const result = await productsCollection.insertOne(product);
      res.send(result);
    });

    // .................. delete product ................

    app.delete("/products/:id", verifyJWT, verifySeller, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await productsCollection.deleteOne(filter);
      res.send(result);
    });

    //.............post reported product ...................

    app.put("/report/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          report: "Reported",
        },
      };
      const result = await productsCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    //.............get reported product ...................

    app.get("/reportProduct", verifyJWT, verifyAdmin, async (req, res) => {
      const filter = { report: "Reported" };
      const result = await productsCollection.find(filter).toArray();
      res.send(result);
    });
    // .............get advertise  product ...................

    app.get("/advertise", async (req, res) => {
      const filter = { advertise: true };
      const result = await productsCollection.find(filter).toArray();
      res.send(result);
    });

    // ...............set advertise..........

    app.put(
      "/advertiseProducts/:id",
      verifyJWT,
      verifySeller,
      async (req, res) => {
        const id = req.params.id;
        const filter = { _id: ObjectId(id) };
        const options = { upsert: true };
        const updateDoc = {
          $set: {
            advertise: true,
          },
        };
        const result = await productsCollection.updateOne(
          filter,
          updateDoc,
          options
        );
        res.send(result);
      }
    );

    // .................. get all buyer ................

    app.get("/allBuyers", verifyJWT, verifyAdmin, async (req, res) => {
      const filter = { role: "Buyer" };
      const result = await usersCollection.find(filter).toArray();
      res.send(result);
    });
    // .................. get all seller ................

    app.get("/allSellers", verifyJWT, verifyAdmin, async (req, res) => {
      const filter = { role: "Seller" };
      const result = await usersCollection.find(filter).toArray();
      res.send(result);
    });

    // ..............user verify ,,,,,,,,,,,,,,,,,,

    app.put("/verify/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          verify: "Verified",
        },
      };

      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });
    // .................. delete all buyer or seller ................

    app.delete(
      "/buyerOrSeller/:id",
      verifyJWT,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const filter = { _id: ObjectId(id) };
        const result = await usersCollection.deleteOne(filter);
        res.send(result);
      }
    );
    // ............create user and save in db.................

    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // ............buying data get for particular buyer ..........................

    app.get("/buying/:email", verifyJWT, verifyBuyer, async (req, res) => {
      const email = req.params.email;
      const filter = { buyeremail: email };
      const result = await buyingCollection.find(filter).toArray();
      res.send(result);
    });
    // ............buying data get for particular buyer ..........................

    app.get("/buyingPayment/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await buyingCollection.findOne(filter);
      res.send(result);
    });

    // ............buying data post ..........................

    app.post("/buying", async (req, res) => {
      const buyingData = req.body;
      const result = await buyingCollection.insertOne(buyingData);
      res.send(result);
    });

    //...................  create  payment metthod.......................

    app.post("/create-payment-intent", async (req, res) => {
      const price = req.body.price;
      const amount = price * 100;

      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    //............ payments ...............

    app.post("/payments", verifyJWT, verifyBuyer, async (req, res) => {
      const payment = req.body;
      const result = await paymentCollection.insertOne(payment);

      // ...............change buying status .................

      const id = payment.buyingId;
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          paid: "paid",
          transactionId: payment.transactionId,
        },
      };
      const updatedResult = await buyingCollection.updateOne(
        filter,
        updatedDoc
      );

      // ...............change product status .................
      const productId = req.body.productId;
      const query = { _id: ObjectId(productId) };
      const updatedProduct = {
        $set: {
          status: "sold",
          advertise: false,
        },
      };
      const updatedProductResult = await productsCollection.updateOne(
        query,
        updatedProduct
      );
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
