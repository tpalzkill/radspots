console.log('Am I even loading???')
var albumBucketName = 'radspotsmedia';
var bucketRegion = 'us-east-2';
var IdentityPoolId = 'us-east-2:acdf72a6-12d0-43a2-8347-6e1d9612562e';


var url;


AWS.config.update({
 region: bucketRegion,
 credentials: new AWS.CognitoIdentityCredentials({
   IdentityPoolId: IdentityPoolId
 })
});

var s3 = new AWS.S3({
 apiVersion: '2006-03-01',
 params: {Bucket: albumBucketName}
});

function listAlbums() {
 s3.listObjects({Delimiter: '/'}, function(err, data) {
   if (err) {
     return alert('There was an error listing your albums: ' + err.message);
   } else {
     var albums = data.CommonPrefixes.map(function(commonPrefix) {
       var prefix = commonPrefix.Prefix;
       var albumName = decodeURIComponent(prefix.replace('/', ''));
       return getHtml([
         '<li>',
           '<span onclick="deleteAlbum(\'' + albumName + '\')">X</span>',
           '<span onclick="viewAlbum(\'' + albumName + '\')">',
             albumName,
           '</span>',
         '</li>'
       ]);
     });
     var message = albums.length ?
       getHtml([
         '<p>Click on an album name to view it.</p>',
         '<p>Click on the X to delete the album.</p>'
       ]) :
       '<p>You do not have any albums. Please Create album.';
     var htmlTemplate = [
       '<h2>Albums</h2>',
       message,
       '<ul>',
         getHtml(albums),
       '</ul>',
       '<button onclick="createAlbum(prompt(\'Enter Album Name:\'))">',
         'Create New Album',
       '</button>'
     ]
     document.getElementById('app').innerHTML = getHtml(htmlTemplate);
   }
 });
}

function createAlbum(albumName) {
 albumName = albumName.trim();
 if (!albumName) {
   return alert('Album names must contain at least one non-space character.');
 }
 if (albumName.indexOf('/') !== -1) {
   return alert('Album names cannot contain slashes.');
 }
 var albumKey = encodeURIComponent(albumName) + '/';
 s3.headObject({Key: albumKey}, function(err, data) {
   if (!err) {
     return alert('Album already exists.');
   }
   if (err.code !== 'NotFound') {
     return alert('There was an error creating your album: ' + err.message);
   }
   s3.putObject({Key: albumKey}, function(err, data) {
     if (err) {
       return alert('There was an error creating your album: ' + err.message);
     }
     alert('Successfully created album.');
     viewAlbum(albumName);
   });
 });
}

function viewAlbum(albumName) {
 var albumPhotosKey = encodeURIComponent(albumName) + '//';
 s3.listObjects({Prefix: albumPhotosKey}, function(err, data) {
   if (err) {
     return alert('There was an error viewing your album: ' + err.message);
   }
   // `this` references the AWS.Response instance that represents the response
   var href = this.request.httpRequest.endpoint.href;
   var bucketUrl = href + albumBucketName + '/';

   var photos = data.Contents.map(function(photo) {
     var photoKey = photo.Key;
     var photoUrl = bucketUrl + encodeURIComponent(photoKey);
     return getHtml([
       '<span>',
         '<figure class="image is-128x128">',
           '<img src="' + photoUrl + '"/>',
           '</figure>',
         '</div>',
         '<div>',
           '<button class="button" onclick="deletePhoto(\'' + albumName + "','" + photoKey + '\')">',
             'X',
           '</button>',
           '<span>',
             photoKey.replace(albumPhotosKey, ''),
           '</span>',
         '</div>',
       '<span>',
     ]);
   });
   var message = photos.length ?
     '<p>Click on the X to delete the photo</p>' :
     '<p>You do not have any photos in this album. Please add photos.</p>';
   var htmlTemplate = [
       '<h2>',
         'Album: ' + albumName,
       '</h2>',
       message,
       '<div>',
         getHtml(photos),
       '</div>',
       // '<input id="photoupload" type="file" accept="image/*">',
       '<div class="field">',
            '<div class="file">',
              '<label class="file-label">',
        '<input class="file-input" id="photoupload" accept="image/*" type="file" name="resume">',
        '<span id="filename" class="file-cta">',
          '<span class="file-icon">',
            '<i class="fa fa-upload"></i>',
          '</span>',
          '<span class="file-label">',
            'Choose a Profile Photo..',
          '</span>',
        '</span>',
       '</label>',
            '</div>',
          '</div>',
       '<button class="button" id="addphoto" onclick="addPhoto(\'' + albumName +'\')">',
         'Add Photo',
       '</button>',
       '<button class="button" onclick="listAlbums()">',
         'Back To Albums',
       '</button>',
     ]
   document.getElementById('app').innerHTML = getHtml(htmlTemplate);
 });
}

function addProfPhoto(albumName) {
 var files = document.getElementById('photoupload').files;
 if (!files.length) {
   return alert('Please choose a file to upload first.');
 }

 var file = files[0];
 var fileName = file.name;
 var albumPhotosKey = encodeURIComponent(albumName) + '//';

 var photoKey = albumPhotosKey + fileName;
 s3.upload({
   Key: photoKey,
   Body: file,
   ACL: 'public-read'
 }, function(err, data) {
   if (err) {
     return alert('There was an error uploading your photo: ', fileName);
   }

     console.log(data.Location);
     var html =      '<img src="' + data.Location + '">'

     $.post('/users/profile', {url: data.Location}, function(){
            $('#profilePhoto').html(html)
         alert('Photo successfully uploaded!')
        viewAlbum(albumName);

     })


   })
 }
function addPhoto(albumName) {
 var files = document.getElementById('spotphotoupload').files;
 if (!files.length) {
   return alert('Please choose a file to upload first.');
 }

 var file = files[0];
 var fileName = file.name;
 var albumPhotosKey = encodeURIComponent(albumName) + '//';

 var photoKey = albumPhotosKey + fileName;
 s3.upload({
   Key: photoKey,
   Body: file,
   ACL: 'public-read'
 }, function(err, data) {
   if (err) {
     return alert('There was an error uploading your photo: ', fileName);
   }
    let spot = $('#hidden-spot-id').text()
    let user = $('#hidden-user-id').text()
    var photo = data.location
    let userName = $('#hidden-user-name').text()

     $.post('/users/location', {photo: data.Location, spot_id: spot, user_id: user})
     .done(function(results) {
       console.log(data)
       var html =         '<div class="tile is-ancestor">' +
         '<div class="tile is-parent">' +
           '<div class="tile box is-child bgwhite">' +

             '<figure class="image is-4by3">' +


                   '<img src="' + data.Location + '">' +

             '</figure>' +

             '<div class="tile is-child">' +
               '<div class="columns">' +
                 '<div class="column is-8">' +

                   '<p class="top-space">' +
                   '<h3 class="title is-5">' +

               userName +  'added a photo' +
             '</h3>' + '</p>'  +
                 '<div class="subtitle is-6 grey">' +

                 '</div>'  +

              ' </div>'  +
               '<div class="column">' +

               '<div class="tile is-child is-right">' +

                 '<div class="tile is-ancestor">'  +
                   '<div class="tile is-parent">'  +
                     '<div class="tile is-child  bgwhite">' +
                      ' <p class="top-space">'  +

                      ' <form class="" action="/users/location" method="post">' +
                         '<div class="field">'  +

                           '<input type="hidden" name="like" value="1">'  +
                           '<button class="button is-primary is-outlined is-focus" type="submit">' + '&nbsp;&nbsp; Like&nbsp;' + '</button>'  +
                         '</div>' +
                       '</form>'  +
                    ' </p>'  +
                     '</div>'  +

                     '<div class="tile is-child  bgwhite">'  +
                      ' <p class="top-space">'  +
                       '<form class="" action="/users/location" method="post">'  +
                         '<div class="field">'  +

                          ' <input type="hidden" name="follow" value="1">'  +
                           '<button class="button is-primary is-outlined is-focus" type="submit">' + 'Follow' + '</button>'  +
                         '</div>' +
                       '</form>'  +
                     '</p>' +
                     '</div>'  +

                     '</div>'  +
                   '</div>'  +
                 '</div>'+
               '</div>' +
               '</div>' +
             '</div>' +




           '</div>' +
         '</div>' +
       '</div>'
       $('#fakeUploadPhoto').append(html)
        $('#getPhotoForm').toggleClass('hidden')
         alert('Photo uploaded successfully!')
        viewAlbum(albumName);

     })


   })

 //});
}


function addVideo(albumName) {
 var files = document.getElementById('spotvideoupload').files;
 if (!files.length) {
   return alert('Please choose a file to upload first.');
 }

 var file = files[0];
 var fileName = file.name;
 var albumPhotosKey = encodeURIComponent(albumName) + '//';

 var photoKey = albumPhotosKey + fileName;
 s3.upload({
   Key: photoKey,
   Body: file,
   ACL: 'public-read'
 }, function(err, data) {
   if (err) {
     return alert('There was an error uploading your photo: ', fileName);
   }
    let spot = $('#hidden-spot-id').text()
    let user = $('#hidden-user-id').text()
    let userName = $('#hidden-user-name').text()
    var video = data.location

     $.post('/users/location', {video: data.Location, spot_id: spot, user_id: user})
     .done(function(results) {
       console.log(data)
       var html =
                     '<div class="tile is-ancestor">' +
                       '<div class="tile is-parent">' +
                         '<div class="tile box is-child bgwhite">' +



                             '<video width="100%" controls>' +
                     '<source src="' + data.Location + '" type="video/mp4">' +
                     '</video>' +



                           '<div class="tile is-child">' +
                             '<div class="columns">' +
                               '<div class="column is-8">' +
                                 '<p class="top-space">' +
                                 '<h3 class="title is-5">' +

                             userName +  'added a video' +
                           '</h3>' + '</p>' +
                               '<p class="subtitle is-6 grey">' +
                                 // <%= video.updated_at %>
                              ' </p>' +

                             '</div>' +
                             '<div class="column">' +

                             '<div class="tile is-child is-right">' +

                              ' <div class="tile is-ancestor">' +
                                 '<div class="tile is-parent">' +
                                   '<div class="tile is-child  bgwhite">' +

                                     '<p class="top-space">' +
                                     '<form class="" action="/users/location" method="post">' +
                                       '<div class="field">' +

                                         '<input type="hidden" name="like" value="1">' +
                                         '<button class="button is-primary is-outlined is-focus" type="submit">' + '&nbsp;&nbsp; Like&nbsp;' + '</button>' +
                                       '</div>' +
                                     '</form>' +
                                   '</p>' +
                                   '</div>' +

                                   '<div class="tile is-child  bgwhite">' +
                                     '<p class="top-space">' +
                                     '<form class="" action="/users/location" method="post">' +
                                       '<div class="field">' +

                                         '<input type="hidden" name="follow" value="1">' +
                                         '<button class="button is-primary is-outlined is-focus" type="submit">' + 'Follow' + '</button>' +
                                       '</div>' +
                                    ' </p>' +
                                     '</form>' +

                                   '</div>' +

                                   '</div>' +
                                 '</div>' +
                               '</div>'
                             '</div>' +
                             '</div>' +
                           '</div>' +




                         '</div>' +
                       '</div>' +
                     '</div>' +
             '</div>'

       $('#fakeUploadVideo').append(html)
        $('#getVideoForm').toggleClass('hidden')
         alert('Video uploaded successfully!')
        viewAlbum(albumName);

     })


   })

 //});
}







function deletePhoto(albumName, photoKey) {
 s3.deleteObject({Key: photoKey}, function(err, data) {
   if (err) {
     return alert('There was an error deleting your photo: ', err.message);
   }
   alert('Successfully deleted photo.');
   viewAlbum(albumName);
 });
}

function deleteAlbum(albumName) {
 var albumKey = encodeURIComponent(albumName) + '/';
 s3.listObjects({Prefix: albumKey}, function(err, data) {
   if (err) {
     return alert('There was an error deleting your album: ', err.message);
   }
   var objects = data.Contents.map(function(object) {
     return {Key: object.Key};
   });
   s3.deleteObjects({
     Delete: {Objects: objects, Quiet: true}
   }, function(err, data) {
     if (err) {
       return alert('There was an error deleting your album: ', err.message);
     }
     alert('Successfully deleted album.');
     listAlbums();
   });
 });
}
