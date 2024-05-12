require('dotenv').config()
const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors')
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
const port = process.env.PORT || 5000
const app = express()




//Must remove "/" from your production URL
app.use(
  cors({
    origin: [
      "http://localhost:5173"
    ],
    credentials: true,
  })
);
app.use(express.json())
app.use(cookieParser())


const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};




// const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.sdyx3bs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const uri = 'mongodb://localhost:27017'
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyToken = async(req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).send({ message: "Unauthorized" });
  }
  try {
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decode) => {
      if (err) {
        return res.status(401).send({ message: "Unauthorized" });
      }
      req.user = decode
      next();
    })
  } catch (err) {
    res.status(401).send({ message: "Unauthorized" });
  }
}

async function run() {
  try {
    const db = client.db('BookNook');
    const collection = db.collection('category');
    const allbooks = db.collection('allbooks');
    const librarian= db.collection('admin');
    const borrow = db.collection('borrow');

    await allbooks.updateMany(
      { },
      [
        { 
          $set: { 
            quantity: { $toInt: "$quantity" }
          } 
        }
      ]
   )
    
    app.post('/jwt', async (req, res) => {
      const email = req.body
      console.log("logging in", email);
      const token = await jwt.sign(email, process.env.ACCESS_TOKEN, {
        expiresIn: '7d'
      })
      res.cookie('token', token, cookieOptions).send({success: true})
    })

    app.post("/logout", async (req, res) => {
      const user = req.body;
      console.log("logging out", user);
      res
        .clearCookie("token", { ...cookieOptions, maxAge: 0 })
        .send({ success: true });
    });

    app.get('/categories', async (req, res) => {
      const result = await collection.find().toArray();
      
      res.send(result);
    })

    app.post('/add_books', verifyToken, async (req, res) => {
      const tokenEmail = req?.user?.email
      if(tokenEmail !== req?.body?.authorEmail) return res.status(403).send({ message: 'forbidden access' })
      
      const {name, image, quantity, category, author, authorEmail, description, rating} = req.body
      const result = await allbooks.insertOne({name, image, quantity : Number(quantity), category, author, authorEmail, description, rating});
      console.log(Number(quantity));
      res.send(result);
    })

    app.get('/category/:id', async (req, res) => {
      const {id} = req.params
      const result = await allbooks.find({category: id}).toArray()
      res.send(result)
    })

    app.get('/details/:id', async (req, res) => {
      const {id} = req.params
      
      const result = await allbooks.findOne({_id: new ObjectId(id)})
      res.send(result)
    })

    app.get('/popular_book', async (req, res) => {
      const result = await allbooks.find({rating: {$gte: '3'}}).limit(6).toArray()
      // console.log(result)
      res.send(result)
    })

    app.get('/all_books', async (req, res) => {
      const {books} = req.query

      if(books === 'available_books'){
        const result = await allbooks.find({quantity: {$gt: 0}}).toArray()
        return res.send(result)
      }else{
        const result = await allbooks.find().toArray()
        return res.send(result)
      }
    })

    app.post('/check_librarian', verifyToken, async (req, res) => {
      const tokenEmail = req.user.email
      const librarianEmail = req.body.email
      const result = await librarian.findOne({admin: librarianEmail})
      // res.send(result)
      console.log(result)
      if(!result) return res.status(404).send({message: 'invalid'})
        else if(tokenEmail !== librarianEmail) return res.status(403).send({message: 'forbidden access'})
          else if(librarianEmail === result?.admin) return res.status(201).send({message: 'access granted'})
        
    })

    app.put('/borrow_book', verifyToken, async (req, res) => {
      const tokenEmail = req?.user?.email

      const {quantity, author, authorEmail, id, category, description, image, name, rating, borrower, returnDate} = req.body
      const currentDate = new Date().toDateString()
      
      if(tokenEmail !== borrower) return res.status(403).send({message: 'forbidden access'})

        await allbooks.findOneAndUpdate({_id: new ObjectId(id)}, {$inc: {quantity: -1}})

        const result = await borrow.insertOne({author, authorEmail, borrowId: id, category, description, image, name, rating, borrower, returnDate, borrowedDate: currentDate});

        res.send(result)
      
    })

    app.patch('/update_book', verifyToken, async (req, res) => {
      const {id, email} = req?.query
      const tokenEmail = req?.user?.email
      const data = req.body

      if(tokenEmail !== email) return res.status(403).send({message: 'forbidden access'})
      
        const result = await allbooks.findOneAndUpdate({_id: new ObjectId(id)}, {$set: data})
        res.send(result)
    })

    app.delete('/delete_book', verifyToken, async (req, res) => {
      const {id, email} = req?.query
      const tokenEmail = req?.user?.email
      if(tokenEmail!== email) return res.status(403).send({message: 'forbidden access'})
        await allbooks.findOneAndDelete({_id: new ObjectId(id)})
        res.send({message: 'deleted'})
    })
    // Connect the client to the server	(optional starting in v4.7)
    
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, ()=> {
    console.log(`Server is running on port http://localhost:${port}`)
})