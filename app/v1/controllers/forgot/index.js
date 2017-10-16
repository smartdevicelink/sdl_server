function post (req, res, next) {
	validatePost(req, res);
	if (res.errorMsg) {
		return res.status(400).send({ error: res.errorMsg });
	}

	//TODO: STUB
	res.sendStatus(200);
}

function validatePost (req, res) {
	if (!req.body.email) {
		return res.errorMsg = "Email required";
	}	
}

module.exports = {
	post: post
};