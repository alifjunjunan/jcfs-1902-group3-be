const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');
const bearerToken = require("express-bearer-token")
dotenv.config();

const PORT = process.env.PORT;
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(bearerToken()); 

// DB Check Connection
const {db} = require('./supports/database')

db.getConnection((err, connection) => {
    if(err) {
        console.log('error mysql :', err.message)
    }

    console.log(`connection to mysal server : ${connection.threadId}`)
})

// Routes API Setup
const {productRoute} = require('./routers')

app.use('/products', productRoute)

app.listen(PORT, () => console.log("Your API RUNNING :", PORT));