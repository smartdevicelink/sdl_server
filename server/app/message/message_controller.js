// ~> Controller
// ~A Chris Rokita
// ~C Scott Smereka

/*
  message_controller
    passes the data to message_model to be handled
    the response from message_model is returned and sent back to the user
    the response is also sent to trackInfo method where it will be paired with the request 
      and be stored in the Message database

      TODO: If the value at _id cannot be cast to objectID the query will not turn out correct
      ex. NOT (invalid id) will not return anything, even though no object would have that id 
      make sure type casting errors are notified and dealt with correctly!
*/


module.exports = function(app, db, config){


  /* ************************************************** *
   * ******************** Local Variables
   * ************************************************** */

  var fox    = require("foxjs"),  // Fox library instance.
      sender = fox.send;          // Fox sender for handling requests and responses.

  // Message database model
  var Message = db.model('Message');


  /* ************************************************** *
   * ******************** Routes and Permissions
   * ************************************************** */

  // Query all the messages using natural language.
  app.post('/messages/query/natural.:format', query);

  //sends the body of a post request for parameters in searching the database
  function query(req, res, next){

    var query = req.body.arrayData;//the data containing what to search and how to search it
    var limitNum = req.body.limit;//how many results to return
    var sortValue = req.body.sort;//what value to sort it by?
    var reverseSort = req.body.reverseSort;//ascending or descending search

    var stage = 0;//the current state of reading the arrayData, i.e. searching for operator or operand
    var previousSize = 0;//the size of the query array before going through the while loop
    var currentSize;//size of the query

    if(query != null){
      currentSize = query.length;
    }
    else{
      currentSize = 0;
    }

    //if the query array isn't truncated after going through the loop that means the logic has been condensed
    //as much as possible (ideally down to a size of one query object)
    while(previousSize != currentSize){
      previousSize = currentSize;

      for(var value = 0; value < query.length; value++){
        
        if(query[value] == '('){//found open parenthesis
          stage = 0;
        }
        else if(query[value] == ')'){//found closed parenthesis
          if(query[value - 2] == '('){
            query.splice(value - 2, 1);
            query.splice(value - 1, 1);
          }
        }
        else if(typeof(query[value]) == 'object'){//found query parameter

          if(stage == 0){//found first operand
            stage = 1;
          }
          if(stage == 2){
            stage = 0;//completed statement
            var first = undefined;
            var offset = 1;//used for offsetting the fact that the NOT operator only needs one field

            if(query[value - 1].toLowerCase() != 'not'){
              //if this is not a unary operation
              first = query.splice(value - 2, 1);
              offset = 0;
            }

            var operator = query.splice(value - 2 + offset, 1);
            var second = query.splice(value - 2 + offset, 1);

            //console.log(first[0]);
            //console.log(operator[0]);
            //console.log(second[0]);

            var queryBit = constructQuery(first, operator, second);

            //place the concatenated operation back into the array
            query.splice((value - 2 + offset), 0, queryBit);

            //check if new array is surrounded by parenthesis. If so, remove them
            if(query[value - 3] == '(' && query[value - 1] == ')'){
              query.splice(value - 3, 1);
              query.splice(value - 2, 1);
            }
          }
          
        }
        else{//found operator or tilde
          if(stage == 1){
            stage = 2;
          }
          else if(query[value].toLowerCase() == 'not' && stage == 0){
            stage = 2;//unary operator
          }
          else if(query[value] == '~'){
            if(typeof(query[value+1]) == 'object'){
              query[value+1] = containsQuery(query[value+1]);
              //REMOVE THE SQUIGGLY
              query.splice(value, 1);
            }
            
          }
        } 

      }

      currentSize = query.length;//set the new length of the array
      stage = 0;//reset the stage number
    }


    var queryObj;
    if(query != null)
    {
      queryObj = Message.find(query[0]);
    }
    else{//empty query; return all
      queryObj = Message.find();
    }   

    if(limitNum != -1){
      queryObj.limit(limitNum);
    }
    if(sortValue != ""){
      var sortObj = {};
      var sortValueBoolean = (reverseSort === 'true');
      if(sortValueBoolean){
        sortObj[sortValue] = -1;
      }
      else{
        sortObj[sortValue] = 1;
      }

      queryObj.sort(sortObj);
    }
    //queryObj.select();

    queryObj.exec(function(err, msgObj){
      sender.setResponse(msgObj, req, res, next);     
    });
  }

  //called if a tilde operator was found and the query is not for exact matches
  function containsQuery(queryObj){

    var returnObj = {};
    for(var value in queryObj){
      var pattern = new RegExp(queryObj[value],"g");
      //console.log(pattern);
      returnObj[value] = {$regex: pattern};
    }

    return returnObj;
  }

  //takes two operands and an operator and combines them into one query
  function constructQuery(first, operator, second){

    switch(operator[0].toLowerCase()){
      case 'and':
        return {$and:[first[0],second[0]]};
        break;
      case 'or':
        return {$or:[first[0],second[0]]};
        break;
      case 'not':
        return {$nor:[second[0], second[0]]};
        break;
      case 'nor':
        return {$nor:[first[0],second[0]]};
        break;
      case 'xor':
        var firstNORfirst = {$nor:[first[0], first[0]]};
        var firstNORsecond = {$nor:[first[0], second[0]]};
        var secondNORsecond = {$nor:[second[0], second[0]]};
        var fnfNORsns = {$nor: [firstNORfirst, secondNORsecond]};
        var xor = {$nor: [fnfNORsns, firstNORsecond]};
        return xor;
        break;
      default:
        console.log("Not a valid operator");
        break;
    }
  }

}