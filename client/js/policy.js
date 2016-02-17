var performPolicyUpdateRequest = function() {
  $.ajax({
    url: "/api/1/policies",
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify({
      name: "default"
    }),
    cache: false,
    success: function(data, status, jqxhr) {
      $('#policyUpdateResponse').text(data);

      // Trigger highlighting of new text added to code block(s).
      $('pre code').each(function(i, block) {
        hljs.highlightBlock(block);
      });

      $('#policyUpdateResponseDiv').css('visibility', 'visible');
    },
    error: function(err) {
      $('#policyUpdateResponse').text(data);
    }
  });
};


$(document).ready(function(){

});