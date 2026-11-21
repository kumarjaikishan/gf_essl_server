const mongoose = require('mongoose');

mongoose.set('strictQuery', false);

mongoose.connect(process.env.db).then(() => {
  console.log("connection to Mongodb successful");
}).catch((e) => {
  console.log("MongoDB connection error:", e);
});
