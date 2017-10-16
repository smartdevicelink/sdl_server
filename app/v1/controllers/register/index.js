function post (req, res, next) {
	validatePost(req, res);
	if (res.errorMsg) {
		return res.status(400).send({ error: res.errorMsg });
	}

	//TODO: STUB
	const response = {
		token: "12345678"
	}
	res.status(200).send(response);
}

function validatePost (req, res) {
	if (!req.body.email || !req.body.password || !req.body.new_password_1 || !req.body.new_password_2) {
		return res.errorMsg = "Invalid credentials";
	}	
}

module.exports = {
	post: post
};