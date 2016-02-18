/* ************************************************** *
 * ******************** Policy Client Methods
 * ************************************************** */

/**
 * Perform a policy update request to the SDL server.
 */
var performPolicyUpdateRequest = function() {
  var policyUpdateRequestBody = $('#policyUpdateRequestBody'),
      requestUrl = "/api/1/policies",
      requestBody = {
        name: "default"
      };

  // Add text and display the policy update request information.
  $('#policyUpdateResponseUrl').val(requestUrl);
  $('#policyUpdateRequestDiv').css('visibility', 'visible');
  policyUpdateRequestBody.text("\"Body\": "+JSON.stringify(requestBody, undefined, 4));
  policyUpdateRequestBody.each(function(i, block) {
    hljs.highlightBlock(block);
  });

  $.ajax({
    url: requestUrl,
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify(requestBody),
    cache: false,
    success: function(data, status, jqxhr) {
      // Display the policy update response
      var policyUpdateResponse = $('#policyUpdateResponse');
      policyUpdateResponse.text(data);
      policyUpdateResponse.each(function(i, block) {
        hljs.highlightBlock(block);
      });
      $('#policyUpdateResponseDiv').css('visibility', 'visible');
    },
    error: function(err) {
      // Display the policy update error response.
      $('#policyUpdateResponse').text(err.responseText);
      $('#policyUpdateResponseDiv').css('visibility', 'visible');
    }
  });
};