const imports = require('../imports');

module.exports = async (req, res) => {
    let input = JSON.parse(JSON.stringify(req.body));
    try {
        console.log(input.movie_name);

        if (input.movie_name) {
            
        }
    } catch (error) {
        console.log(error);
        return res.status(404).json({"message": "Api calls not working!!"});
    }
}