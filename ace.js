var theme='ace/theme/tomorrow_night_eighties';
var editors = document.querySelectorAll(".editor");

var retrieved = {}

Array.prototype.forEach.call(editors, function (el) {
  var mode = `ace/mode/${el.dataset.mode}`

  var editor = ace.edit(el)
  editor.getSession().setMode(mode)
  editor.setTheme(theme)
  retrieved[el.dataset.mode] = editor.getValue()

  editor.getSession().on('change', function(e) {
    // retrieved[el.dataset.mode] = editor.getValue()
    // updatePreview(retrieved)
    if (el.dataset.mode === 'javascript') compileES(editor.getValue())
  })
})

updatePreview(retrieved)

function updatePreview (content) {
  var preview = `
    <!doctype html>
    <head>
      <style type="text/css">
        ${content.css}
      </style>
    </head>
    <body>
      ${content.html}
      <script tye="text/javascript">
        ${content.javascript}
      </script>
    </body>
  `
  console.clear()
  var blob = new Blob([preview], {type: "text/html"});
  var blob_url = URL.createObjectURL(blob);
  var blob_iframe = document.querySelector('#preview-panel');
  blob_iframe.src = blob_url;
}

function compileES (code) {
  var transpiler = Transpiler()
  var compiled = transpiler.compile(code)
  console.log(compiled)
}
