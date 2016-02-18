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

  // Clear any existing error or success classes.
  $('#policyUpdateResponseCode').removeClass('error-response');
  $('#policyUpdateResponseCode').removeClass('success-response');

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
      $('#policyUpdateResponseCode').addClass('success-response');
      $('#policyUpdateResponseDiv').css('visibility', 'visible');
    },
    error: function(err) {
      // Display the policy update error response.
      if(err && err.responseText) {
        $('#policyUpdateResponse').text(err.responseText);
      } else {
        $('#policyUpdateResponse').text("An unknown error occurred, please see the console log for more information.");
      }
      $('#policyUpdateResponse').each(function(i, block) {
        hljs.highlightBlock(block);
      });
      $('#policyUpdateResponseCode').addClass('error-response');
      $('#policyUpdateResponseDiv').css('visibility', 'visible');
    }
  });
};