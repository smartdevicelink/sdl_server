function post (req, res, next) {
	validatePost(req, res);
	if (res.parcel.message) {
		return res.parcel.deliver();
	}

	//TODO: STUB
	const response = {
		token: "12345678"
	}
	res.parcel
		.setStatus(200)
		.setData(response)
		.deliver();
}

function validatePost (req, res) {
	if (!req.body.email || !req.body.password || !req.body.new_password_1 || !req.body.new_password_2) {
		res.parcel
			.setStatus(400)
			.setMessage("Invalid credentials");
	}
	return;
}

module.exports = {
	post: post
};