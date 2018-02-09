function post (req, res, next) {
	validatePost(req, res);
	if (res.parcel.message) {
		res.parcel.deliver();
		return;
	}

	//TODO: STUB
	res.parcel
		.setStatus(200)
		.deliver();
}

function validatePost (req, res) {
	if (!req.body.email) {
		res.parcel
			.setStatus(400)
			.setMessage("Email required");
	}
	return;
}

module.exports = {
	post: post
};