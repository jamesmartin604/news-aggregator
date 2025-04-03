require('dotenv').config();
const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors());

//fetches api key and endpoint from env file
const API_KEY = process.env.API_KEY;
const API_ENDPOINT = process.env.API_ENDPOINT;
const MONGO_URL = process.env.MONGO_URL; //put the mongo db connection string into env file
                                         //this connection string can be found in the azure portal

// Connect to MongoDB
mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
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

//removed hardcoded category
const COUNTRY = "gb";


// Fetch News from API and Store in MongoDB
const fetchAndStoreNews = async (category) => {
    try {
        const response = await axios.get(`${API_ENDPOINT}?access_key=${API_KEY}&languages=en&countries=${COUNTRY}&categories=${category}&limit=20`);
        
        console.log("Full API Response:", response.data);

        //handles different type of responses
        let articles = [];
        if (Array.isArray(response.data)) {
            articles = response.data;
        } else if (response.data.data) {
            articles = response.data.data;
        } else if (response.data.articles) {
            articles = response.data.articles;
        } else if (response.data.results) {
            articles = response.data.results;
        }

        if (articles && articles.length > 0) {
            const filteredArticles = articles.filter(article => 
                article.url && (article.urlToImage || article.image) && article.description
            );

            const sortedArticles = filteredArticles.sort((a, b) => {
                const dateA = getValidDate(a);
                const dateB = getValidDate(b);
                return dateB - dateA;
            });

            console.log(`Processing ${sortedArticles.length} articles`);

            for (const article of sortedArticles) {
                try {
                    const publishedDate = getValidDate(article);
                    
                    const result = await News.updateOne(
                        { url: article.url },
                        {
                            author: article.author || 'Unknown',
                            title: article.title,
                            description: article.description,
                            url: article.url,
                            source: article.source?.name || article.source || 'Unknown',
                            image: article.urlToImage || article.image,
                            category: category,
                            language: 'en',
                            country: COUNTRY,
                            published_at: publishedDate,
                        },
                        { upsert: true }
                    );
                    console.log(`Processed article: ${article.title}`);
                } catch (error) {
                    console.error('Error processing article:', error.message);
                }
            }
        } else {
            console.log('No articles found in the API response.');
        }
    } catch (error) {
        console.error('Error fetching news:', error.message);
        if (error.response) {
            console.error('API Response Status:', error.response.status);
            console.error('API Response Data:', error.response.data);
        }
    }
};

// function to handle different date formats
function getValidDate(article) {
    const dateString = article.publishedAt || article.pubDate || article.date;
    
    if (!dateString) return new Date(); //  current date if no date exists
    
    const date = new Date(dateString);

    return isNaN(date.getTime()) ? new Date() : date;
}

// Call API Every hour
//fetchAndStoreNews('sports'); //commented this out as it was calling too often
//setInterval(() => fetchAndStoreNews('sports'), 30000);

// Get all the articles
app.get('/articles', async (req, res) => {
    const category = req.query.category || 'sports'; // Default to 'sports' if no category is provided
    try {
        const articles = await News.find({ category }).limit(8);
        res.json(articles);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start Express Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});