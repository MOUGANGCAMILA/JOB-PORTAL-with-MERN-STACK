const express = require("express");
const app = express();
const mongoose = require("mongoose");
const morgan = require("morgan");
const bodyParser = require("body-parser");
require("dotenv").config();
const cors = require('cors');
const cookieParser = require("cookie-parser");
const errorHandler = require("./middleware/error");


// import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const jobTypeRoute = require("./routes/jobsTypeRoutes");
const jobRoute = require("./routes/jobsRoutes");


//database connection
mongoose.connect(process.env.ATLAS_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(() => console.log("DB connected"))
.catch((err) => console.log(err));





// Middlewares

app.use((morgan("dev")));
app.use(bodyParser.json({ limit: "5mb" }));
app.use(bodyParser.urlencoded({
    limit: "5mb",
    extended: true
}));
app.use(cookieParser());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));


// Health check
app.get('/api/health', (req, res) => res.json({ ok: true }));

// ROUTES MIDDLEWARE
//app.get('/', (req, res) => {
  //  res.send("Hello from Node Js");
// })

app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", jobTypeRoute); 
app.use("/api", jobRoute);

//error middleware
app.use(errorHandler);


// port

const port = process.env.PORT || 4900;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});