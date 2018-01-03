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

    $('div.get-content > div').not('.hidden').toggleClass('hidden');
    $('.' + target).toggleClass('hidden');
  });


  $('#photo-icon').on('click', function() {
    $('div.get-content > div').not('.hidden').toggleClass('hidden');
    $('.photos').toggleClass('hidden');
  });


  $('#video-icon').on('click', function() {
    $('div.get-content > div').not('.hidden').toggleClass('hidden');
    $('.videos').toggleClass('hidden');
  });
});
