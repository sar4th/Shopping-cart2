const { MongoClient } = require("mongodb");

const state = {
  db: null,
};

const url = "mongodb+srv://sarathraj:sarath123@cluster0.lgyxhsj.mongodb.net/";
const dbName = "shopping";
const client = new MongoClient(url);

const connect = async (cb) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    state.db = db;
    console.log("Connected to MongoDB");
    cb(); // Call the callback function to indicate success
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    cb(err); // Pass the error to the callback
  }
};

const get = () => state.db;

module.exports = {
  connect,
  get,
};
