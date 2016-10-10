$(function () {
  var $htmlTextArea = $('#html-box textarea').text(
    '<main>' + $('#viewport').html() + '</main>'
  );

  CodeMirror.fromTextArea($htmlTextArea[0], {
    mode: "text/html",
    theme: 'twilight',
    lineNumbers: true,
    lineWrapping: true
  });
})
