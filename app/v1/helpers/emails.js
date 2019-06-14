const fs = require("fs");
const mustache = require("mustache");

module.exports = {
    "template": {
        "appPendingReview": fs.readFileSync("./app/v1/static/emails/app_pending_review.html", "utf8")
    },
    "populate": mustache.render
};