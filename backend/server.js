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
// Schema for the original news articles (collection: news)
const newsSchema = new mongoose.Schema({
    author: String,
    title: String,
    description: String, // Original description
    url: {type: String, unique: true}, // unique property prevents from adding duplicates to the database
    source: String,
    image: String,
    category: String,
    language: String,
    country: String,
    published_at: Date,
});
const News = mongoose.model('News', newsSchema); // model for 'news' collection



const newsSummarySchema = new mongoose.Schema({
    original_doc_id: { type: mongoose.Schema.Types.ObjectId, ref: 'News' }, // Link to original news article's _id
    news_title: String, // Store original title for context
    summary: String, // ai-generated summary text
    summarized_field: String,
    // summarized_at: Date
}, {
    collection: 'news_summarize' 
});
const NewsSummary = mongoose.model('NewsSummary', newsSummarySchema); // Model for 'news_summarize' collection



const COUNTRY = "gb";

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

            console.log(`Processing ${sortedArticles.length} articles for category: ${category}`);

            for (const article of sortedArticles) {
                try {
                    const publishedDate = getValidDate(article);

                    const result = await News.updateOne(
                        { url: article.url },
                        {
                            $set: { // Use $set to update fields without overwriting the whole doc if needed elsewhere
                                author: article.author || 'Unknown',
                                title: article.title,
                                description: article.description, // Store original description
                                url: article.url,
                                source: article.source?.name || article.source || 'Unknown',
                                image: article.urlToImage || article.image,
                                category: category,
                                language: 'en',
                                country: COUNTRY,
                                published_at: publishedDate,
                            }
                        },
                        { upsert: true }
                    );
                } catch (error) {
                    if (error.code !== 11000) { 
                       console.error(`Error processing article (${article.title}):`, error.message);
                    }
                }
            }
            console.log(`Finished processing articles for category: ${category}`);
        } else {
            console.log(`No articles found in the API response for category: ${category}.`);
        }
    } catch (error) {
        console.error(`Error fetching news for category ${category}:`, error.message);
        if (error.response) {
            console.error('API Response Status:', error.response.status);
        }
    }
};


// function to handle different date formats 
function getValidDate(article) {
    const dateString = article.published_at;

    if (!dateString) return new Date(); //  current date if no date exists

    const date = new Date(dateString);

    return isNaN(date.getTime()) ? new Date() : date;
}

// Call API Every hour
// fetchAndStoreNews('entertainment');
// setInterval(() => fetchAndStoreNews('sports'), 3600000); 




app.get('/articles', async (req, res) => {
    const category = req.query.category || 'sports'; // Default to 'sports' if no category is provided
    console.log(`Workspaceing articles for category: ${category}`);
    try {
        const articlesWithSummaries = await News.aggregate([
            // Stage 1: Match articles by category
            { $match: { category: category } },
            // Stage 2: Sort by published date (descending)
            { $sort: { published_at: -1 } },
            // Stage 3: Limit the results
            { $limit: 8 },
            // Stage 4: Lookup corresponding summary
            {
                $lookup: {
                    from: 'news_summarize',
                    localField: '_id',
                    foreignField: 'original_doc_id',
                    as: 'summaryData'
                }
            },
            // Stage 5: Add conditional description field
            {
                $addFields: {
                    display_description: {
                        $cond: {
                           if: {
                               $and: [
                                   { $isArray: "$summaryData" },
                                   { $gt: [{ $size: "$summaryData" }, 0] },
                                   { $ne: [{ $arrayElemAt: ["$summaryData.summary", 0] }, null] },
                                   { $ne: [{ $arrayElemAt: ["$summaryData.summary", 0] }, ""] }
                               ]
                           },
                           then: { $arrayElemAt: ["$summaryData.summary", 0] },
                           else: "$description"
                        }
                    }
                }
            },
            {
                $addFields: {
                    is_summarized: {
                        $cond: {
                           if: { 
                               $and: [
                                   { $isArray: "$summaryData" },
                                   { $gt: [{ $size: "$summaryData" }, 0] },
                                   { $ne: [{ $arrayElemAt: ["$summaryData.summary", 0] }, null] },
                                   { $ne: [{ $arrayElemAt: ["$summaryData.summary", 0] }, ""] }
                               ]
                           },
                           then: true, // Set flag to true if summary was used
                           else: false // Set flag to false if original description was used
                        }
                    }
                }
            },
            // Stage 6: Project final fields 
            {
                $project: {
                    _id: 1,
                    author: 1,
                    title: 1,
                    url: 1,
                    source: 1,
                    image: 1,
                    category: 1,
                    language: 1,
                    country: 1,
                    published_at: 1,
                    description: "$display_description", // Map the calculated description
                    is_summarized: 1 // Include the flag to indicate if a summary was used
                }
            }
        ]);

        console.log(`Found ${articlesWithSummaries.length} articles (with potential summaries) for category: ${category}`);
        res.json(articlesWithSummaries);

    } catch (error) {
        console.error(`Error fetching aggregated articles for category ${category}:`, error);
        res.status(500).json({ error: 'Internal server error fetching articles' });
    }
});

// Start Express Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});