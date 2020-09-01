const express = require('express');
const PORT = 5000;
const app = express();
const axios = require('axios');
const redis = require('redis');

// Connect to redis
const client = redis.createClient(6379);

client.on('error', (error) => {
	console.log(error);
});

app.get('/recipe/:fooditem', async (req, res) => {
	try {
		const fooditem = req.params.fooditem;

		// Check redis store for the data
		client.get(fooditem, async (err, recipe) => {
			if (recipe) {
				return res.status(200).send({
					error: false,
					message: `Recipe for ${fooditem} from the cache`,
					data: JSON.parse(recipe),
				});
			} else {
				const recipe = await axios.get(
					`http://www.recipepuppy.com/api/?q=${fooditem}`
				);

				// Save record in redis
				client.setex(fooditem, 1440, JSON.stringify(recipe.data.results));

				return res.status(200).send({
					error: false,
					message: `Recipe for ${fooditem} from the server`,
					data: recipe.data.results,
				});
			}
		});
	} catch (error) {
		console.log(error);
	}
});

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});

module.exports = app;
