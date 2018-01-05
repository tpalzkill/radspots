// console.log('hello???');
//   $(document).ready(function() {
// console.log('helllooooooooooooooooooooo')
// $('#more_info').on('click', function () {
// document.getElementById('spot_name').value = document.getElementById('spot').value
//
//
// })
//
//     //assign client to contract select menu
// $('#more_info').on('click', function() {
// $('#spot_name').val($('#spot').val());

//});


//  });

/*  ====================================================================
      show/hide tabbed content on location page on click
====================================================================  */
$(document).ready(function() {

  $('#nav-tabs').on('click', function() {
    var target = $(event.target)[0].id;
    console.log(target, 'TARGET WTF')
    $('div.get-content > div').not('.hidden').toggleClass('hidden');
    $('.' + target).toggleClass('hidden');
  });

  $('#likes').on('click', function() {
    var target = $(event.target)[0].id;

    let value = $('#profile-likes').val();
    console.log(value, 'THIS IS THE VALUE')

  });


});
