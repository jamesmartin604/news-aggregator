require('dotenv').config();
const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = 'mongodb://localhost:27017/newsDB'; // MongoDB Connection

app.use(cors());

// Connect to MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Define Mongoose Schema
const newsSchema = new mongoose.Schema({
    title: String,
    description: String,
    content: String,
    url: String,
    image_url: String,
    publishedAt: Date,
    source: String
});

const News = mongoose.model('News', newsSchema);

// Fetch News from API and Store in MongoDB
const fetchAndStoreNews = async () => {
    try {
        const response = await axios.get(`https://newsdata.io/api/1/news`, {
            params: {
                apikey: process.env.NEWS_API_KEY,  // Make sure the API key is correct
                country: 'us',  // Use any country you need
                category: 'technology' // Or any other category
            }
        });

        console.log("API Response:", response.data); // Log the response to check the content

        const articles = response.data.results;

        if (articles && articles.length > 0) {
            console.log(`Fetched ${articles.length} articles`);
            // Insert articles into MongoDB
            const result = await News.insertMany(articles.map(article => ({
                title: article.title,
                description: article.description,
                content: article.content,
                url: article.link,
                image_url: article.image_url,
                publishedAt: new Date(article.pubDate),
                source: article.source_id
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
        const articles = await News.find();
        res.json(articles);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start Express Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
