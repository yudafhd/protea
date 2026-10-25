// Paste into the Apps Script project opened from the wedding Google Form editor.
// Run setupWizardWishes once in the editor BEFORE deploying as a web app.

function setupWizardWishes() {
  var form = FormApp.getActiveForm();
  if (!form) throw new Error('Open Apps Script from the Google Form editor.');
  var titles = form.getItems().map(function (item) { return item.getTitle(); });
  if (titles.indexOf('Nama Lengkap') < 0 || titles.indexOf('Ucapan & Doa') < 0) {
    throw new Error('Expected questions: Nama Lengkap and Ucapan & Doa.');
  }
  PropertiesService.getScriptProperties().setProperty('WIZARD_FORM_ID', form.getId());
}

function doGet() {
  var formId = PropertiesService.getScriptProperties().getProperty('WIZARD_FORM_ID');
  if (!formId) throw new Error('Run setupWizardWishes in the editor first.');
  var wishes = [];
  var responses = FormApp.openById(formId).getResponses();
  // Newest first; only names and messages are exposed to invitation visitors.
  for (var i = responses.length - 1; i >= 0 && wishes.length < 100; i--) {
    var name = '';
    var message = '';
    responses[i].getItemResponses().forEach(function (answer) {
      var title = answer.getItem().getTitle();
      var value = answer.getResponse();
      if (typeof value !== 'string') return;
      if (title === 'Nama Lengkap') name = value.trim().slice(0, 120);
      if (title === 'Ucapan & Doa') message = value.trim().slice(0, 1200);
    });
    if (name && message) wishes.push({ name: name, message: message });
  }
  return ContentService.createTextOutput(JSON.stringify({ wishes: wishes }))
    .setMimeType(ContentService.MimeType.JSON);
}
