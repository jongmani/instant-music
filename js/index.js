$(function() {
  $('.paypal-form').submit(function (e) {
    var donateVal = $('.donation input:checked').val();
    $('input.donate-amount').val(donateVal);
  });
})


