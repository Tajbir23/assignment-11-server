require('dotenv').config()
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
const port = process.env.PORT || 5000
const app = express()



const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
  ],
  credentials: true,
  optionSuccessStatus: 200,
}

app.use(cors(corsOptions))
app.use(express.json())
app.use(cookieParser())



const { MongoClient, ServerApiVersion } = require('mongodb');
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

async function run() {
  try {

    app.post('/jwt', async (req, res) => {
      const email = req.body
      const token = jwt.sign(email, process.env.ACCESS_TOKEN, {
        expiresIn: '365d'
      })
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