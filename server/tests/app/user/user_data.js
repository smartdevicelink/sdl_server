module.exports = [
	{
		activated:true, 
		firstName:'Bob',
		lastName:'LastName', 
		email:'bob@localhost.com', 
		securityQuestion:'Why is this here?',
		password:'bobsPassword',
		failedLoginAttempts:7
	},
	{
		activated:false, 
		firstName:'Jerry',
		lastName:'TheThird', 
		email:'jerry@localhost.com', 
		securityQuestion:'Why am I here?',
		password:'jerrysQuiteLongPassword',
		failedLoginAttempts:2
	},
	{
		activated:false, 
		firstName:'Someone',
		lastName:'Else', 
		email:'someone42@localhost.com', 
		securityQuestion:'What is the answer?',
		password:'qwertyuiop',
		failedLoginAttempts:4
	}
];