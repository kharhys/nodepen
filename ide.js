var htmleditor = CodeMirror.fromTextArea(document.getElementById("html-editor"), {
  theme: 'monokai',
  lineNumbers: true,
  extraKeys: {"Ctrl-Space": "autocomplete"},
  mode: {name: "htmlmixed", globalVars: true}
});
htmleditor.on('change', debounce(_onHtmlChange, 1000, false));

var csseditor = CodeMirror.fromTextArea(document.getElementById("css-editor"), {
  theme: 'monokai',
  lineNumbers: true,
  extraKeys: {"Ctrl-Space": "autocomplete"},
  mode: {name: "css", globalVars: true}
});
csseditor.on('change', debounce(_onCssChange, 1000, false));

var jseditor = CodeMirror.fromTextArea(document.getElementById("javascript-editor"), {
  theme: 'monokai',
  lineNumbers: true,
  extraKeys: {"Ctrl-Space": "autocomplete"},
  mode: {name: "css", globalVars: true}
});
jseditor.on('change', debounce(_onJsChange, 1000, false));

read('main.html', function(content) {  htmleditor.setValue(content) })
read('main.css', function(content) {  csseditor.setValue(content) })
read('main.js', function(content) {  jseditor.setValue(content) })

postcss([lost]).process(csseditor.getValue()).then(function (res) {
  render(htmleditor.getValue(), res.css, jseditor.getValue())
});

function _onHtmlChange(cMirror) {
  save('main.html', htmleditor.getValue())
  render(htmleditor.getValue(), csseditor.getValue(), jseditor.getValue())
}


function _onCssChange(cMirror) {
  postcss([lost]).process(csseditor.getValue()).then(function (res) {
    save('main.css', csseditor.getValue())
    render(htmleditor.getValue(), res.css, jseditor.getValue())
  });
}

function _onJsChange(cMirror) {
  var script = Babel.transform(jseditor.getValue(), { presets: ['latest'] }).code
  save('main.js', jseditor.getValue())
  render(htmleditor.getValue(), csseditor.getValue(), script)
}

setupToolbar()

function setupToolbar () {
  Gator(document).on('click', '#download_icon', function(e) {

      e.preventDefault()
      var $currentTab = $chromeTabsExampleShell.find('.chrome-tab-current')
      var filename = $.trim($currentTab.text()) + '_' + Date.now() + '.zip'

      var zip = new JSZip()
      zip.file("main.js", jseditor.getValue())
      zip.file("main.css", csseditor.getValue())
      zip.file("main.html", htmleditor.getValue())
      zip.generateAsync({type:"blob"})
        .then(function(content) { saveAs(content, filename) })
  })
  Gator(document).on('click', '#preview_icon', function(e) {
    var preview = function() {
      var markup = htmleditor.getValue()
      var script = Babel.transform(jseditor.getValue(), { presets: ['latest'] }).code
      postcss([lost]).process(csseditor.getValue()).then(function (res) {
        var blob_url = bundle(markup, res.css, script)
        var a = document.createElement("a")
        document.body.appendChild(a);
        a.href = blob_url
        a.target = "_blank"
        a.click()
      })

    }
    preview()
  })

}
