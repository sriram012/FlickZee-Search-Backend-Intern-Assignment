var async = require('async');

var soundex = require('soundex-code');
var levenshtein = require('fast-levenshtein');
var stopword = require('stopword');

const mysqlConn = require("../../../mysql_connection")

const conn = mysqlConn.connection;

module.exports = async (req, res) => {
    // { 'movie_name': 'Iron Man' }     -->    input format
    let input = JSON.parse(JSON.stringify(req.body));
    try {
        console.log(input.movie_name);

        if (input.movie_name) {
            let query = await conn.query(
                "SELECT * FROM movies WHERE LOWER(TRIM(title)) = LOWER(TRIM(?)) ORDER BY imdbRating*imdbVotes DESC",
                [input.movie_name], async (error, results) => {
                    if (error) {
                        console.log(error);
                        return res.status(404).json({"message": error});
                    }

                    const movies = results;
                    console.log(results);
                    if (movies.length < 10) {
                        let query_ = await conn.query(
                            "SELECT * FROM movies WHERE LOWER(TRIM(title)) = LOWER(TRIM(?)) AND LOWER(TRIM(title)) != LOWER(TRIM(?)) AND LENGTH(title) <= ? ORDER BY LENGTH(title) ASC",
                            [input.movie_name + '%', input.movie_name, input.movie_name.length+3], async (error, results_) => {
                            if (error) {
                                console.log(error);
                                return res.status(404).json({"message": error});
                            }
                            
                            const movies_ = await [ ...movies, ...results_ ];
                            console.log(results_);
                            if (movies_.length < 10) {
                                let query__ = await conn.query(
                                    "SELECT * FROM movies WHERE BINARY title LIKE ? AND LENGTH(title) <= ? ORDER BY imdbRating*imdbVotes DESC",
                                    ['%_' + input.movie_name, input.movie_name.length+3], async (error, results__) => {
                                    if (error) {
                                        console.log(error);
                                        return res.status(404).json({"message": error});
                                    }
            
                                    const movies__ = await [ ...movies_, ...results__ ];
                                    if (movies__.length < 10) {
                                        let movies_query = await conn.query(
                                            "SELECT * FROM movies WHERE title LIKE ? AND LENGTH(title) <= ? ORDER BY imdbRating*imdbVotes DESC",
                                            [input.movie_name.charAt(0) + '%', input.movie_name.length+4], async (error, movies_results) => {
                                            if (error) {
                                                console.log(error);
                                                return res.status(404).json({"message": error});
                                            }
                            
                                            let similar_movies = [];
                    
                                            let index = 0;
                                            for (index = 0; index < movies_results.length; index++) {
                                                // Removing stopwords from the movie name
                                                const list_of_input_words = input.movie_name.split(' ');
                                                const i_without_stopwords = await stopword.removeStopwords(list_of_input_words);
                                                const list_of_compare_words = movies_results[index].title.split(' ');
                                                const c_without_stopwords = await stopword.removeStopwords(list_of_compare_words);
                                
                                                let i_movie_name_without_stopwords = '';
                                                for (let index2 = 0; index2 < i_without_stopwords.length; index2++)
                                                    i_movie_name_without_stopwords += i_without_stopwords[index2];
                                                
                                                let c_movie_name_without_stopwords = '';
                                                for (let index2 = 0; index2 < c_without_stopwords.length; index2++)
                                                    c_movie_name_without_stopwords += c_without_stopwords[index2];
                                
                                                // Converting to phonetic codes
                                                const input_phonetic_code = await soundex(i_movie_name_without_stopwords.toLowerCase());
                                                const compare_phonetic_code = await soundex(c_movie_name_without_stopwords.toLowerCase());
                                
                                                // Calculating levenshtein distance
                                                const l_distance = await levenshtein.get(input_phonetic_code, compare_phonetic_code, { useCollator: true});
                                
                                                if (l_distance < 1 
                                                    || movies_results[index].title.toLowerCase().includes(input.movie_name.toLowerCase())
                                                    || input.movie_name.toLowerCase().includes(movies_results[index].title.toLowerCase())
                                                    || compare_phonetic_code.includes(input_phonetic_code)
                                                    || input_phonetic_code.includes(compare_phonetic_code)
                                                    || c_movie_name_without_stopwords.toLowerCase().includes(i_movie_name_without_stopwords.toLowerCase())
                                                    || i_movie_name_without_stopwords.toLowerCase().includes(c_movie_name_without_stopwords.toLowerCase())
                                                    && !movies.includes(movies_results[index]))
                                                    similar_movies = await [ ...similar_movies, movies_results[index] ];
                                                // return res.status(200).json({"movies": movies, "watch_ons": watch_ons});
                                            }
                            
                                            if (index == movies_results.length) {
                                                const movies___ = await [ ...movies__, ...similar_movies ];
                                                console.log(movies___);
                                                const max_index = movies___.length >= 10 ? 10 : movies___.length;
                                                let watch_ons = [];
                                                for (let i = 0; i < max_index; i++) {
                                                    let watchon_query = await conn.query("SELECT * FROM monetization WHERE id_movie = ?", [movies__[i].id], async (error, watchon_results) => {
                                                        if (error) {
                                                            console.log(error);
                                                            return res.status(404).json({"message": error});
                                                        }
                                                        watch_ons = [ ...watch_ons, watchon_results ];
                                                        
                                                        if (watch_ons.length == max_index) {
                                                            let final_results = [];
                                                            for (let index2 = 0; index2 < max_index; index2++)
                                                                final_results = [ ...final_results, [ movies[index2], watch_ons[index2] ] ];

                                                            return res.status(200).json({ "results": final_results });
                                                        }
                                                    });
                                                }
                                            }
                                        });
                                    } else {
                                        const final_results = await getWatchOns(10, movies);
                                        return res.status(200).json({ "results": final_results });
                                    }
                                });
                            } else {
                                const final_results = await getWatchOns(10, movies);
                                return res.status(200).json({ "results": final_results });
                            }
                            
                        });
                    } else {
                        const final_results = await getWatchOns(10, movies);
                        return res.status(200).json({ "results": final_results });
                    }
                });

        } else return res.status(404).json({"message": "Error finding!!"});

    } catch (error) {
        console.log(error);
        return res.status(404).json({"message": "Api calls not working!!"});
    }
}

const getWatchOns = async (max_index, movies) => {
    let watch_ons = [];
    for (let index = 0; index < max_index; index++) {
        let watchon_query = await conn.query("SELECT * FROM monetization WHERE id_movie = ?", [movies[index].id], async (error, watchon_results) => {
            if (error) {
                console.log(error);
                return res.status(404).json({"message": error});
            }
            watch_ons = [ ...watch_ons, watchon_results[0] ];
            
            if (watch_ons.length == max_index) {
                let final_results = [];
                for (let index2 = 0; index2 < max_index; index2++)
                    final_results = [ ...final_results, [ movies[index2], watch_ons[index2] ] ];

                // return res.status(200).json({ "results": final_results });
                return final_results;
            }
        });
    }
}
