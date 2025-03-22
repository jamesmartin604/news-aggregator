require('dotenv').config();
const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = 'mongodb://localhost:27017/newsDB'; // MongoDB Connection

app.use(cors());

//fetches api key and endpoint from env file
const API_KEY = process.env.API_KEY;
const API_ENDPOINT = process.env.API_ENDPOINT;

// Connect to MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Define Mongoose Schema
const newsSchema = new mongoose.Schema({
    author: String,
    title: String,
    description: String,
    url: {type: String, unique: true}, // unique property prevents from adding duplicates to the database
    source: String,
    image: String,
    category: String,
    language: String,
    country: String,
    published_at: Date,
    
});

const News = mongoose.model('News', newsSchema);

//customise filters
const COUNTRY = "gb";
const CATEGORY = "technology";

// Fetch News from API and Store in MongoDB
const fetchAndStoreNews = async () => {
    try {
        const response = await axios.get(`${API_ENDPOINT}?access_key=${API_KEY}&languages=en&countries=${COUNTRY}&categories=${CATEGORY}&limit=20`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        let data = response.data;

        //filter out news with missing images or descs
        const filteredArticles = data.data.filter(article => article.image && article.description);

        //sort articles by most recent
        const sortedArticles = filteredArticles.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

        console.log("API Response:", sortedArticles); // Log the response to check the content

        const articles = response.data.data;

        if (sortedArticles && sortedArticles.length > 0) {
            console.log(`Fetched ${sortedArticles.length} articles`);
            // Insert articles into MongoDB
            const result = await News.insertMany(sortedArticles.map(article => ({
        

                author: article.author,
                title: article.title,
                description: article.description,
                url: article.url,
                source: article.source,
                image: article.image,
                category: article.category,
                language: article.language,
                country: article.country,
                published_at: new Date(article.published_at),
            })));

            console.log('News articles stored in MongoDB:', result);  // Log result
        } else {
            console.log('No articles found to store.');
        }
    } catch (error) {
        console.error('Error fetching news:', error.message);
    }
};


// Call API Every Minute
fetchAndStoreNews();
setInterval(fetchAndStoreNews, 60000);

// Get all the articles
app.get('/articles', async (req, res) => {
    try {
        const articles = await News.find().limit(8);
        res.json(articles);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start Express Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
