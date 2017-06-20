var profile = $('#profile');
var profileButton = $('#profile-button');
var profileEmail = $('#profile-email');
var profileStreamProfile = $('#profile-stream-profile');
var email = profileEmail.text();
var streamProfile = profileStreamProfile.text();

var passwordRowHTML = '<tr class="edit-item"><td class="col-sm-4"><span id="profile-password-label">密碼</span></td>' +
  '<td class="col-sm-8"><span id="profile-password" class="profile-data"></span></td></tr>';
var genStreamKeyHTML = '<div class="generate-stream-key-block"><label id="generate-stream-key-label" class="edit-item">' +
'<input id="generate-stream-key" form="update-profile-form" name="generateStreamKey" value="yes" type="checkbox"> 產生新串流金鑰' +
'</label></div>';
var submitButtonHTML = '<button id="submit" type="submit" name="submit" value="" form="update-profile-form" class="btn btn-primary">送出</button>' +
' <a href="#" id="cancel">取消</a>';
var editButtonHTML = '<button id="edit" class="btn btn-default">編輯</button>';
var editEmailHTML = '<input id="edit-email-input" class="edit-item" type="email" name="email" value="' + email + '" form="update-profile-form">';
var editPasswordHTML = '<label id="edit-password-old-label" class="" for="password-old">目前的密碼：</label>' +
'<input id="password-old" class="" type="password" name="oldPassword" value="" placeholder="目前的密碼" form="update-profile-form" minlength="6">' +
'<label id="edit-password-new-label" class="" for="password-new">新密碼：</label>' +
'<input id="password-new" class="" type="password" name="newPassword" value="" placeholder="新密碼" form="update-profile-form" minlength="6">' +
'<label id="edit-password-re-label" class="" for="password-re">確認新密碼：</label>'+
'<input id="password-re" class="" type="password" name="rePassword" value="" placeholder="重新輸入新密碼" form="update-profile-form" minlength="6">';
var editStreamProfileHTML = '<textarea id="edit-stream-profile-textarea" name="streamProfile" form="update-profile-form">' + streamProfile + '</textarea>';

var genEditLink = function genEditLink(id) {
  return '<a href="#" id="edit-' + id + '" class="edit-item">修改</a> ';
};

profileButton.on('click', '#edit', function onClick() {
  $( $.parseHTML( passwordRowHTML ) ).insertBefore( $('#profile-stream-profile').parents('tr') );

  $( $.parseHTML( genEditLink('email') ) ).insertBefore( $('#profile-email') );
  $( $.parseHTML( genEditLink('password') ) ).appendTo( $('#profile-password') );
  $( $.parseHTML( '<div id="edit-stream-profile-block">' + genEditLink('stream-profile') + '</div>' ) ).insertBefore( $('#profile-stream-profile') );

  if ( $('#toggle-stream-key').length ) {
    $( $.parseHTML(genStreamKeyHTML) ).insertBefore('#toggle-stream-key');
  }
  if ( $('#edit-stream-key').length ) {
    $( $.parseHTML(genStreamKeyHTML) ).insertAfter( $('#edit-stream-key').addClass('edit-hidden') );
  }

  $(this).replaceWith( $.parseHTML(submitButtonHTML) );
});

profileButton.on('click', '#cancel', function onClick(event) {
  event.preventDefault();
  // event.stopPropagation();
  $('.edit-hidden').removeClass('edit-hidden');
  $('.edit-item').remove();
  profileButton.html(editButtonHTML);
});

profile.on('click', '#edit-email', function onClick(event) {
  event.preventDefault();
  $( $.parseHTML(editEmailHTML) ).insertAfter(profileEmail);
  profileEmail.addClass('edit-hidden');
  $(this).remove();
});

profile.on('click', '#edit-password', function onClick(event) {
  event.preventDefault();
  $( $.parseHTML(editPasswordHTML) ).insertAfter(this);
  $(this).remove();
});

profile.on('click', '#edit-stream-profile', function onClick(event) {
  event.preventDefault();
  $( $.parseHTML(editStreamProfileHTML) ).insertAfter(this);
  profileStreamProfile.addClass('edit-hidden');
  $(this).remove();
});