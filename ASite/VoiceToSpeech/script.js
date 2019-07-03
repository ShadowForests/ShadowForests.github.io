var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;
var SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent;

// Setup

var socket = io.connect('http://localhost:3000');

socket.on('connect_error', () => {
  console.log("SOCKET: Restart to reconnect socket if using a personal server.");
  socket.disconnect();
});

const diagnosticPara = document.querySelector('label#outputDiag');
const outputConfidence = document.querySelector('label#outputConfidence');
const testButtonInfo = document.querySelector('p#testButtonInfo');
const testButton = document.querySelector('button#testButton');
const outputVoiceText = document.querySelector('p#outputVoiceText');
//const optionsButton = document.querySelector('button#optionsButton');
//const transcriptButton = document.querySelector('button#transcriptButton');
const optionsButton = $('button#optionsButton');
const transcriptButton = $('input#transcript-checkbox');
const confidenceButton = $('input#confidence-checkbox');
const lowlatencyButton = $('input#lowlatency-checkbox');
const translateButton = $('input#translate-checkbox');
const options = document.querySelector('div#options');
const transcript = document.querySelector('div#transcript');
const audioInputSelect = document.querySelector('select#audioSource');
const audioOutputSelect = document.querySelector('select#audioOutput');
const selectors = [audioInputSelect, audioOutputSelect];
const langInputSelect = document.querySelector('select#searchSelectInput');
const langOutputSelect = document.querySelector('select#searchSelectOutput');
const langSelectors = [audioInputSelect, audioOutputSelect];

var buttonState = 0;
const interim_wait = 300;
const audio_input_selection_disabled = true;
var lowlatency = lowlatencyButton.prop("checked");
var translate = translateButton.prop("checked");

var recognition = new SpeechRecognition();

// If you modify this array, also update default language / dialect below
var input_langs = [
  ["af-ZA", "Afrikaans (South Africa)", "Afrikaans (Suid-Afrika)"],
  ["am-ET", "Amharic (Ethiopia)", "አማርኛ (ኢትዮጵያ)"],
  ["hy-AM", "Armenian (Armenia)", "Հայ (Հայաստան)"],
  ["az-AZ", "Azerbaijani (Azerbaijan)", "Azərbaycan (Azərbaycan)"],
  ["id-ID", "Indonesian (Indonesia)", "Bahasa Indonesia (Indonesia)"],
  ["ms-MY", "Malay (Malaysia)", "Bahasa Melayu (Malaysia)"],
  ["bn-BD", "Bengali (Bangladesh)", "বাংলা (বাংলাদেশ)"],
  ["bn-IN", "Bengali (India)", "বাংলা (ভারত)"],
  ["ca-ES", "Catalan (Spain)", "Català (Espanya)"],
  ["cs-CZ", "Czech (Czech Republic)", "Čeština (Česká republika)"],
  ["da-DK", "Danish (Denmark)", "Dansk (Danmark)"],
  ["de-DE", "German (Germany)", "Deutsch (Deutschland)"],
  ["en-AU", "English (Australia)", "English (Australia)"],
  ["en-CA", "English (Canada)", "English (Canada)"],
  ["en-GH", "English (Ghana)", "English (Ghana)"],
  ["en-GB", "English (United Kingdom)", "English (Great Britain)"],
  ["en-IN", "English (India)", "English (India)"],
  ["en-IE", "English (Ireland)", "English (Ireland)"],
  ["en-KE", "English (Kenya)", "English (Kenya)"],
  ["en-NZ", "English (New Zealand)", "English (New Zealand)"],
  ["en-NG", "English (Nigeria)", "English (Nigeria)"],
  ["en-PH", "English (Philippines)", "English (Philippines)"],
  ["en-SG", "English (Singapore)", "English (Singapore)"],
  ["en-ZA", "English (South Africa)", "English (South Africa)"],
  ["en-TZ", "English (Tanzania)", "English (Tanzania)"],
  ["en-US", "English (United States)", "English (United States)"],
  ["es-AR", "Spanish (Argentina)", "Español (Argentina)"],
  ["es-BO", "Spanish (Bolivia)", "Español (Bolivia)"],
  ["es-CL", "Spanish (Chile)", "Español (Chile)"],
  ["es-CO", "Spanish (Colombia)", "Español (Colombia)"],
  ["es-CR", "Spanish (Costa Rica)", "Español (Costa Rica)"],
  ["es-EC", "Spanish (Ecuador)", "Español (Ecuador)"],
  ["es-SV", "Spanish (El Salvador)", "Español (El Salvador)"],
  ["es-ES", "Spanish (Spain)", "Español (España)"],
  ["es-US", "Spanish (United States)", "Español (Estados Unidos)"],
  ["es-GT", "Spanish (Guatemala)", "Español (Guatemala)"],
  ["es-HN", "Spanish (Honduras)", "Español (Honduras)"],
  ["es-MX", "Spanish (Mexico)", "Español (México)"],
  ["es-NI", "Spanish (Nicaragua)", "Español (Nicaragua)"],
  ["es-PA", "Spanish (Panama)", "Español (Panamá)"],
  ["es-PY", "Spanish (Paraguay)", "Español (Paraguay)"],
  ["es-PE", "Spanish (Peru)", "Español (Perú)"],
  ["es-PR", "Spanish (Puerto Rico)", "Español (Puerto Rico)"],
  ["es-DO", "Spanish (Dominican Republic)", "Español (República Dominicana)"],
  ["es-UY", "Spanish (Uruguay)", "Español (Uruguay)"],
  ["es-VE", "Spanish (Venezuela)", "Español (Venezuela)"],
  ["eu-ES", "Basque (Spain)", "Euskara (Espainia)"],
  ["fil-PH", "Filipino (Philippines)", "Filipino (Pilipinas)"],
  ["fr-CA", "French (Canada)", "Français (Canada)"],
  ["fr-FR", "French (France)", "Français (France)"],
  ["gl-ES", "Galician (Spain)", "Galego (España)"],
  ["ka-GE", "Georgian (Georgia)", "ქართული (საქართველო)"],
  ["gu-IN", "Gujarati (India)", "ગુજરાતી (ભારત)"],
  ["hr-HR", "Croatian (Croatia)", "Hrvatski (Hrvatska)"],
  ["zu-ZA", "Zulu (South Africa)", "IsiZulu (Ningizimu Afrika)"],
  ["is-IS", "Icelandic (Iceland)", "Íslenska (Ísland)"],
  ["it-IT", "Italian (Italy)", "Italiano (Italia)"],
  ["jv-ID", "Javanese (Indonesia)", "Jawa (Indonesia)"],
  ["kn-IN", "Kannada (India)", "ಕನ್ನಡ (ಭಾರತ)"],
  ["km-KH", "Khmer (Cambodia)", "ភាសាខ្មែរ (កម្ពុជា)"],
  ["lo-LA", "Lao (Laos)", "ລາວ (ລາວ)"],
  ["lv-LV", "Latvian (Latvia)", "Latviešu (latviešu)"],
  ["lt-LT", "Lithuanian (Lithuania)", "Lietuvių (Lietuva)"],
  ["hu-HU", "Hungarian (Hungary)", "Magyar (Magyarország)"],
  ["ml-IN", "Malayalam (India)", "മലയാളം (ഇന്ത്യ)"],
  ["mr-IN", "Marathi (India)", "मराठी (भारत)"],
  ["nl-NL", "Dutch (Netherlands)", "Nederlands (Nederland)"],
  ["ne-NP", "Nepali (Nepal)", "नेपाली (नेपाल)"],
  ["nb-NO", "Norwegian Bokmål (Norway)", "Norsk bokmål (Norge)"],
  ["pl-PL", "Polish (Poland)", "Polski (Polska)"],
  ["pt-BR", "Portuguese (Brazil)", "Português (Brasil)"],
  ["pt-PT", "Portuguese (Portugal)", "Português (Portugal)"],
  ["ro-RO", "Romanian (Romania)", "Română (România)"],
  ["si-LK", "Sinhala (Sri Lanka)", "සිංහල (ශ්රී ලංකාව)"],
  ["sk-SK", "Slovak (Slovakia)", "Slovenčina (Slovensko)"],
  ["sl-SI", "Slovenian (Slovenia)", "Slovenščina (Slovenija)"],
  ["su-ID", "Sundanese (Indonesia)", "Urang (Indonesia)"],
  ["sw-TZ", "Swahili (Tanzania)", "Swahili (Tanzania)"],
  ["sw-KE", "Swahili (Kenya)", "Swahili (Kenya)"],
  ["fi-FI", "Finnish (Finland)", "Suomi (Suomi)"],
  ["sv-SE", "Swedish (Sweden)", "Svenska (Sverige)"],
  ["ta-IN", "Tamil (India)", "தமிழ் (இந்தியா)"],
  ["ta-SG", "Tamil (Singapore)", "தமிழ் (சிங்கப்பூர்)"],
  ["ta-LK", "Tamil (Sri Lanka)", "தமிழ் (இலங்கை)"],
  ["ta-MY", "Tamil (Malaysia)", "தமிழ் (மலேசியா)"],
  ["te-IN", "Telugu (India)", "తెలుగు (భారతదేశం)"],
  ["vi-VN", "Vietnamese (Vietnam)", "Tiếng Việt (Việt Nam)"],
  ["tr-TR", "Turkish (Turkey)", "Türkçe (Türkiye)"],
  ["ur-PK", "Urdu (Pakistan)", "اردو (پاکستان)"],
  ["ur-IN", "Urdu (India)", "اردو (بھارت)"],
  ["el-GR", "Greek (Greece)", "Ελληνικά (Ελλάδα)"],
  ["bg-BG", "Bulgarian (Bulgaria)", "Български (България)"],
  ["ru-RU", "Russian (Russia)", "Русский (Россия)"],
  ["sr-RS", "Serbian (Serbia)", "Српски (Србија)"],
  ["uk-UA", "Ukrainian (Ukraine)", "Українська (Україна)"],
  ["he-IL", "Hebrew (Israel)", "עברית (ישראל)"],
  ["ar-IL", "Arabic (Israel)", "العربية (إسرائيل)"],
  ["ar-JO", "Arabic (Jordan)", "العربية (الأردن)"],
  ["ar-AE", "Arabic (United Arab Emirates)", "العربية (الإمارات)"],
  ["ar-BH", "Arabic (Bahrain)", "العربية (البحرين)"],
  ["ar-DZ", "Arabic (Algeria)", "العربية (الجزائر)"],
  ["ar-SA", "Arabic (Saudi Arabia)", "العربية (السعودية)"],
  ["ar-IQ", "Arabic (Iraq)", "العربية (العراق)"],
  ["ar-KW", "Arabic (Kuwait)", "العربية (الكويت)"],
  ["ar-MA", "Arabic (Morocco)", "العربية (المغرب)"],
  ["ar-TN", "Arabic (Tunisia)", "العربية (تونس)"],
  ["ar-OM", "Arabic (Oman)", "العربية (عُمان)"],
  ["ar-PS", "Arabic (State of Palestine)", "العربية (فلسطين)"],
  ["ar-QA", "Arabic (Qatar)", "العربية (قطر)"],
  ["ar-LB", "Arabic (Lebanon)", "العربية (لبنان)"],
  ["ar-EG", "Arabic (Egypt)", "العربية (مصر)"],
  ["fa-IR", "Persian (Iran)", "فارسی (ایران)"],
  ["hi-IN", "Hindi (India)", "हिन्दी (भारत)"],
  ["th-TH", "Thai (Thailand)", "ไทย (ประเทศไทย)"],
  ["ko-KR", "Korean (South Korea)", "한국어 (대한민국)"],
  ["zh-TW", "Chinese, Mandarin (Traditional, Taiwan)", "國語 (台灣)"],
  ["yue-Hant-HK", "Chinese, Cantonese (Traditional, Hong Kong)", "廣東話 (香港)"],
  ["ja-JP", "Japanese (Japan)", "日本語（日本）"],
  ["zh-HK", "Chinese, Mandarin (Simplified, Hong Kong)", "普通話 (香港)"],
  ["zh", "Chinese, Mandarin (Simplified, China)", "普通话 (中国大陆)"],
]

var output_langs = [
  ["af-ZA", "Afrikaans (South Africa)", "Afrikaans (Suid-Afrika)"],
  ["am-ET", "Amharic (Ethiopia)", "አማርኛ (ኢትዮጵያ)"],
  ["hy-AM", "Armenian (Armenia)", "Հայ (Հայաստան)"],
  ["az-AZ", "Azerbaijani (Azerbaijan)", "Azərbaycan (Azərbaycan)"],
  ["id-ID", "Indonesian (Indonesia)", "Bahasa Indonesia (Indonesia)"],
  ["ms-MY", "Malay (Malaysia)", "Bahasa Melayu (Malaysia)"],
  ["bn-BD", "Bengali (Bangladesh)", "বাংলা (বাংলাদেশ)"],
  ["bn-IN", "Bengali (India)", "বাংলা (ভারত)"],
  ["ca-ES", "Catalan (Spain)", "Català (Espanya)"],
  ["cs-CZ", "Czech (Czech Republic)", "Čeština (Česká republika)"],
  ["da-DK", "Danish (Denmark)", "Dansk (Danmark)"],
  ["de-DE", "German (Germany)", "Deutsch (Deutschland)"],
  ["en-AU", "English (Australia)", "English (Australia)"],
  ["en-GB", "English (United Kingdom)", "English (Great Britain)"],
  ["en-IN", "English (India)", "English (India)"],
  ["en-NZ", "English (New Zealand)", "English (New Zealand)"],
  ["en-US", "English (United States)", "English (United States)"],
  ["es-ES", "Spanish (Spain)", "Español (España)"],
  ["es-US", "Spanish (United States)", "Español (Estados Unidos)"],
  ["fil-PH", "Filipino (Philippines)", "Filipino (Pilipinas)"],
  ["fr-CA", "French (Canada)", "Français (Canada)"],
  ["fr-FR", "French (France)", "Français (France)"],
  ["gl-ES", "Galician (Spain)", "Galego (España)"],
  ["ka-GE", "Georgian (Georgia)", "ქართული (საქართველო)"],
  ["gu-IN", "Gujarati (India)", "ગુજરાતી (ભારત)"],
  ["hr-HR", "Croatian (Croatia)", "Hrvatski (Hrvatska)"],
  ["zu-ZA", "Zulu (South Africa)", "IsiZulu (Ningizimu Afrika)"],
  ["is-IS", "Icelandic (Iceland)", "Íslenska (Ísland)"],
  ["it-IT", "Italian (Italy)", "Italiano (Italia)"],
  ["jv-ID", "Javanese (Indonesia)", "Jawa (Indonesia)"],
  ["kn-IN", "Kannada (India)", "ಕನ್ನಡ (ಭಾರತ)"],
  ["km-KH", "Khmer (Cambodia)", "ភាសាខ្មែរ (កម្ពុជា)"],
  ["lo-LA", "Lao (Laos)", "ລາວ (ລາວ)"],
  ["lv-LV", "Latvian (Latvia)", "Latviešu (latviešu)"],
  ["lt-LT", "Lithuanian (Lithuania)", "Lietuvių (Lietuva)"],
  ["hu-HU", "Hungarian (Hungary)", "Magyar (Magyarország)"],
  ["ml-IN", "Malayalam (India)", "മലയാളം (ഇന്ത്യ)"],
  ["mr-IN", "Marathi (India)", "मराठी (भारत)"],
  ["nl-NL", "Dutch (Netherlands)", "Nederlands (Nederland)"],
  ["ne-NP", "Nepali (Nepal)", "नेपाली (नेपाल)"],
  ["nb-NO", "Norwegian Bokmål (Norway)", "Norsk bokmål (Norge)"],
  ["pl-PL", "Polish (Poland)", "Polski (Polska)"],
  ["pt-BR", "Portuguese (Brazil)", "Português (Brasil)"],
  ["pt-PT", "Portuguese (Portugal)", "Português (Portugal)"],
  ["ro-RO", "Romanian (Romania)", "Română (România)"],
  ["si-LK", "Sinhala (Sri Lanka)", "සිංහල (ශ්රී ලංකාව)"],
  ["sk-SK", "Slovak (Slovakia)", "Slovenčina (Slovensko)"],
  ["sl-SI", "Slovenian (Slovenia)", "Slovenščina (Slovenija)"],
  ["su-ID", "Sundanese (Indonesia)", "Urang (Indonesia)"],
  ["sw-TZ", "Swahili (Tanzania)", "Swahili (Tanzania)"],
  ["fi-FI", "Finnish (Finland)", "Suomi (Suomi)"],
  ["sv-SE", "Swedish (Sweden)", "Svenska (Sverige)"],
  ["ta-IN", "Tamil (India)", "தமிழ் (இந்தியா)"],
  ["te-IN", "Telugu (India)", "తెలుగు (భారతదేశం)"],
  ["vi-VN", "Vietnamese (Vietnam)", "Tiếng Việt (Việt Nam)"],
  ["tr-TR", "Turkish (Turkey)", "Türkçe (Türkiye)"],
  ["el-GR", "Greek (Greece)", "Ελληνικά (Ελλάδα)"],
  ["bg-BG", "Bulgarian (Bulgaria)", "Български (България)"],
  ["ru-RU", "Russian (Russia)", "Русский (Россия)"],
  ["sr-RS", "Serbian (Serbia)", "Српски (Србија)"],
  ["uk-UA", "Ukrainian (Ukraine)", "Українська (Україна)"],
  ["ar-SA", "Arabic (Saudi Arabia)", "العربية (السعودية)"],
  ["fa-IR", "Persian (Iran)", "فارسی (ایران)"],
  ["hi-IN", "Hindi (India)", "हिन्दी (भारत)"],
  ["th-TH", "Thai (Thailand)", "ไทย (ประเทศไทย)"],
  ["ko-KR", "Korean (South Korea)", "한국어 (대한민국)"],
  ["zh-TW", "Chinese, Mandarin (Traditional, Taiwan)", "國語 (台灣)"],
  ["ja-JP", "Japanese (Japan)", "日本語（日本）"],
  ["zh-HK", "Chinese, Mandarin (Simplified, Hong Kong)", "普通話 (香港)"],
  ["zh", "Chinese, Mandarin (Simplified, China)", "普通话 (中国大陆)"],
]

// Sort alphabetical by English name
input_langs.sort(function(a, b){
    var keyA = a[1],
        keyB = b[1];
    // Compare the 2 values
    if (keyA < keyB) return -1;
    if (keyA > keyB) return 1;
    return 0;
});

output_langs.sort(function(a, b){
    var keyA = a[1],
        keyB = b[1];
    // Compare the 2 values
    if (keyA < keyB) return -1;
    if (keyA > keyB) return 1;
    return 0;
});

// Fill languages

function gotLanguages(input_langs, output_langs) {
  for (let i = 0; i !== input_langs.length; ++i) {
    const option = document.createElement('option');
    option.value = input_langs[i][0];
    option.text = input_langs[i][1];
    langInputSelect.appendChild(option);
  }
  for (let i = 0; i !== output_langs.length; ++i) {
    const option = document.createElement('option');
    option.value = output_langs[i][0];
    option.text = output_langs[i][1];
    langOutputSelect.appendChild(option);
  }
}

gotLanguages(input_langs, output_langs);

// Set default lang selections
langInputSelect.selectedIndex = 45;
langOutputSelect.selectedIndex = 20;

function getInputLang() {
  return langInputSelect.options[langInputSelect.selectedIndex].value;
}

function getOutputLang() {
  return langOutputSelect.options[langOutputSelect.selectedIndex].value;
}

// Set default language / dialect
/*
for (var i = 0; i < langs.length; i++) {
  select_language.options[i] = new Option(langs[i][0], i);
}
select_language.selectedIndex = 10;
updateCountry();
select_dialect.selectedIndex = 11;
*/

// Buttons & Utility

$('#searchSelectInput')
  .dropdown()
;

$('#searchSelectOutput')
  .dropdown()
;

$('#audioSource')
  .dropdown()
;

$('#audioOutput')
  .dropdown()
;

$('.ui.slider')
  .slider({
    min: 0,
    max: 200,
    start: 100,
    step: 0,
    onMove: function (data) {
      volume = data.toFixed();
      try {
        $('.volume-slider')
          .popup('change content', `${volume}%`)
          .popup('reposition');
      } catch (err) {}
    },
  })
;

var volume_slider_active = false;

function volume_slider_mousedown() {
  volume_slider_active = true;
  $('.volume-slider')
    .popup('show')
    .popup('change content', `${volume}%`)
    .popup('reposition');
};

$(document).on('mouseup', function() {
  volume_slider_active = false;
});

$('.volume-slider').mouseenter(function() {
  $('.volume-slider')
    .popup('show')
    .popup('change content', `${volume}%`)
    .popup('reposition');
});

$('.volume-slider').mouseleave(function() {
  if (!volume_slider_active) {
    $('.volume-slider').popup('hide');
  }
});

optionsButton.click(function() {
  $('.ui.modal.options-modal')
    .modal({
      autofocus: false
    })
    .modal('show')
  ;

  $('.volume-slider')
    .popup({
      position: 'top center',
      content: `${volume}%`,
      on: 'manual',
    })
  ;
});

transcriptButton.click(function() {
  if (transcriptButton.prop("checked")) {
    transcript.style.display = "block";
  } else {
    transcript.style.display = "none";
  }
});

confidenceButton.click(function() {
  if (confidenceButton.prop("checked")) {
    outputConfidence.style.display = "block";
  } else {
    outputConfidence.style.display = "none";
  }
});

lowlatencyButton.click(function() {
  lowlatency = lowlatencyButton.prop("checked");
  if (lowlatency && translateButton.prop("checked")) {
    translateButton.click();
  }
  if (buttonState == 1) {
    restartSpeech();
  }
});

translateButton.click(function() {
  translate = translateButton.prop("checked");
  if (translateButton.prop("checked")) {
    if (lowlatencyButton.prop("checked")) {
      lowlatencyButton.click();
    }
    outputVoiceText.textContent = "Output Language";
  } else {
    outputVoiceText.textContent = "Output Voice";
  }
});

/*
function toggleOptions() {
  $('.ui.modal.options-modal')
    .modal('show')
  ;
}
*/

/*
function toggleTranscript() {
  if (transcript.style.display !== "block") {
    transcript.style.display = "block";
    transcriptButton.textContent = "Hide Transcript";
  } else {
    transcript.style.display = "none";
    transcriptButton.textContent = "Show Transcript";
  }
}
*/

function speechButton() {
  socket.connect();
  if (buttonState < 1) {
    buttonState = 1;
    testButtonInfo.textContent = 'Press stop to end speech recognition';
    testButton.textContent = 'Stop';
    testSpeech();
  } else {
    buttonState = -1;
    testButton.disabled = true;
    testButton.textContent = 'Stopping...';
    recognition.onend();
  }
}

function wait(timeout) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, timeout);
  });
}

// Translation

function get_translation(sourceLang, targetLang, sourceText) {
  var xhr = new XMLHttpRequest();

  return new Promise((resolve, reject) => {
    xhr.onreadystatechange = (e) => {
      if (xhr.readyState !== 4) {
        return;
      }

      if (xhr.status === 200) {
        //console.log('SUCCESS', xhr.responseText);
        try {
          resolve(JSON.parse(xhr.responseText)[0][0][0]);
        } catch (err) {
          resolve("user_error")
        }
      } else {
        console.warn('request_error');
      }
    };

    var url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" 
              + sourceLang + "&tl=" + targetLang + "&dt=t&q=" + encodeURI(sourceText);

    xhr.open('GET', url);
    xhr.send();
  });
}

/*
var sourceLang = "en-us";
var targetLang = "ja";
var sourceText = "translation test";
async function test() {
  var test = await get_translation(sourceLang, targetLang, sourceText);
  console.log(test);
}
test();
*/

// Fill devices

function gotDevices(deviceInfos) {
  // Handles being called several times to update labels. Preserve values.
  const values = selectors.map(select => select.value);
  selectors.forEach(select => {
    while (select.firstChild) {
      select.removeChild(select.firstChild);
    }
  });
  for (let i = 0; i !== deviceInfos.length; ++i) {
    const deviceInfo = deviceInfos[i];
    const option = document.createElement('option');
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === 'audioinput') {
      if (audio_input_selection_disabled) {
        option.text = "Set via browser";
      } else {
        option.text = deviceInfo.label || `microphone ${audioInputSelect.length + 1}`;
      }
      audioInputSelect.appendChild(option);
    } else if (deviceInfo.kind === 'audiooutput') {
      option.text = deviceInfo.label || `speaker ${audioOutputSelect.length + 1}`;
      audioOutputSelect.appendChild(option);
    } else {
      console.log('Some other kind of source/device: ', deviceInfo);
    }
  }
  selectors.forEach((select, selectorIndex) => {
    if (Array.prototype.slice.call(select.childNodes).some(n => n.value === values[selectorIndex])) {
      select.value = values[selectorIndex];
    }
  });
}

navigator.mediaDevices.enumerateDevices().then(gotDevices).catch(handleError);

var audioDestination;
function changeAudioDestination() {
  audioDestination = audioOutputSelect.value;
}

function gotStream(stream) {
  window.stream = stream; // make stream available to console
  // Refresh button list in case labels have become available
  return navigator.mediaDevices.enumerateDevices();
}

function handleError(error) {
  console.log('navigator.mediaDevices.getUserMedia error: ', error.message, error.name);
}

function start() {
  if (window.stream) {
    window.stream.getTracks().forEach(track => {
      track.stop();
    });
  }
  const audioSource = audioInputSelect.value;
  const constraints = {
    audio: {deviceId: audioSource ? {exact: audioSource} : undefined}
  };
  navigator.mediaDevices.getUserMedia(constraints).then(gotStream).then(gotDevices).catch(handleError);
}

//audioInputSelect.onchange = start;
/*
audioInputSelect.onchange = function() {
  if (buttonState == 1) {
    testSpeech();
  }
}
*/

function restartSpeech() {
  recognition = new SpeechRecognition();
  testSpeech();
}

audioOutputSelect.onchange = changeAudioDestination;
langInputSelect.onchange = restartSpeech;

//

var speech_playing = false;
var speech_buffer = [];
var timeout_times = 0;

async function play_audio(audio_url) {
  var audio = new Audio(audio_url);
  audio.setSinkId(audioDestination).catch((err) => {});
  speech_playing = true;
  audio.onended = function() {
    speech_playing = false;
  };
  audio.play()
    .then((res) => {
      //~console.log("response");
      timeout_times = 0;
      return;
    })
    .catch((err) => {
      speech_playing = false;
      //~console.log("error play_tts");
      console.error(err);
      timeout_times += 1;
      if (timeout_times > 5) {
        timeout_times = 0;
        return;
      } else {
        console.log(`Trying again ${timeout_times}`);
        play_audio(audio_url);
        return;
      }
    });
}

async function play_tts(speech) {
  //~console.log("play_tts");
  if (speech.length == 0) {
    return;
  }
  try {
    //~console.log("try play_tts");
    let inputLang = getInputLang();
    let outputLang = getOutputLang();
    /* Using native speech synthesis
    speechSynthesis.speak(new SpeechSynthesisUtterance(speech.join(" ")));
    return;
    */
    if (translate) {
      speech = await get_translation(inputLang, outputLang, speech.join(" "));
      speech = speech.split(" ");
    }
    console.log(speech.join(" "));
    speech = speech.join("-");
    if (speech === "") {
      return;
    }
    let audio_url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${outputLang}&q=${speech}`;
    play_audio(audio_url);
  } catch (err) {
    //~console.log("error play_tts");
    console.error(err);
    speech_playing = false;
  }
}

var last_interim_speech = [];
var interim_speech_index = 0;

async function play_buffered_tts(speech, split=true) {
  if (split) {
    speech = speech.split(" ");
  }
  //~console.log("buffered tts");
  speech_buffer.push(speech);
  while (speech_playing) {
    await wait(100);
  }
  play_tts(speech_buffer.shift());
}

async function play_interim_tts(interim_speech) {
  //~console.log("interim tts");
  interim_speech = interim_speech.split(" ");
  if (interim_speech[0] !== "") {
    interim_speech.unshift("");
  }
  console.log(interim_speech);
  if (interim_speech.length < interim_speech_index) {
    interim_speech_index = 0;
  }
  var curr_interim_speech_index = interim_speech_index;
  last_interim_speech = interim_speech;
  await wait(interim_wait);
  //~console.log("RUNNUNG");
  if (last_interim_speech == interim_speech) {
    let interim_speech_length = interim_speech.length;
    play_buffered_tts(interim_speech.splice(curr_interim_speech_index), split=false);
    interim_speech_index = interim_speech_length;
  }
}

var two_line = /\n\n/g;
var one_line = /\n/g;
function linebreak(s) {
  return s.replace(two_line, '<p></p>').replace(one_line, '<br>');
}

var first_char = /\S/;
function capitalize(s) {
  return s.replace(first_char, function(m) { return m.toUpperCase(); });
}

function testSpeech() {
  //testButton.disabled = true;
  //testButton.textContent = 'In progress';

  // To ensure case consistency while checking with the returned output text
  // diagnosticPara.textContent = '...diagnostic messages';

  recognition.lang = getInputLang();
  if (lowlatency) {
    recognition.continuous = true;
    recognition.interimResults = true;
  } else {
    recognition.continuous = false;
    recognition.interimResults = false;    
  }
  recognition.maxAlternatives = 1;

  try {
    recognition.start();
  } catch (err) {}

  // Reset interim_speech_index on starts
  interim_speech_index = 0;

  recognition.onresult = function(event) {
    console.log('SpeechRecognition.onresult');
    // The SpeechRecognitionEvent results property returns a SpeechRecognitionResultList object
    // The SpeechRecognitionResultList object contains SpeechRecognitionResult objects.
    // It has a getter so it can be accessed like an array
    // The first [0] returns the SpeechRecognitionResult at position 0.
    // Each SpeechRecognitionResult object contains SpeechRecognitionAlternative objects that contain individual results.
    // These also have getters so they can be accessed like arrays.
    // The second [0] returns the SpeechRecognitionAlternative at position 0.
    // We then return the transcript property of the SpeechRecognitionAlternative object 

    /*if (typeof(event.results) == 'undefined') {
      recognition.onend = null;
      recognition.stop();
      upgrade();
      return;
    }*/

    if (lowlatency) {
      var interim_transcript = '';

      // Initially interim_speech_index is set to 0 on start
      // interim_transcript is reset to length 1 during silence, which resets interim_speech_index to 1
      // Any words will increase the index to 2 and above
      // This ensures words will not be missed when being read
      for (var i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          //~final_transcript += event.results[i][0].transcript;
        } else {
          interim_transcript += event.results[i][0].transcript;
        }
      }

      //~final_transcript = capitalize(final_transcript);
      //~final_span.innerHTML = linebreak(final_transcript);
      //~interim_span.innerHTML = linebreak(interim_transcript);
      /*if (final_transcript || interim_transcript) {
        showButtons('inline-block');
      }*/
      //~console.log(interim_transcript);

      if (buttonState == 1) {
        //var speechResult = event.results[0][0].transcript;
        let speechResult = interim_transcript;
        let confidenceResult = event.results[event.results.length-1][0].confidence;
        if (speechResult === "") {
          speechResult = "—";
          confidenceResult = "—";
          play_interim_tts("");
        } else {
          socket.emit('speech', speechResult);
          play_interim_tts(speechResult);
          // UPDATE LATER ###############
          // ADD TIMESTAMP, REMOVE DUPLICATE ARG
          transcript.textContent += speechResult;
        }
        diagnosticPara.textContent = 'Speech received: ' + speechResult;
        outputConfidence.textContent = 'Confidence: ' + confidenceResult;
      }
    } else {
      if (buttonState == 1) {
        let speechResult = event.results[0][0].transcript;
        let confidenceResult = event.results[0][0].confidence;
        if (speechResult === "") {
          speechResult = "—";
          confidenceResult = "—";
        } else {
          socket.emit('speech', speechResult);
          play_buffered_tts(speechResult, split=true);
          // UPDATE LATER ###############
          // ADD TIMESTAMP, REMOVE DUPLICATE ARG
          transcript.textContent += `${speechResult}. `;
        }
        diagnosticPara.textContent = 'Speech received: ' + speechResult;
        outputConfidence.textContent = 'Confidence: ' + confidenceResult;
      }
    }
  }

  recognition.onspeechend = function() {
    recognition.stop();
    //testButton.disabled = false;
    //testButton.textContent = 'Start';
    if (buttonState == 1) {
      restartSpeech();
    }
  }

  recognition.onerror = function(event) {
    //testButton.disabled = false;
    //testButton.textContent = 'Start';
    if (buttonState == 1) {
      diagnosticPara.textContent = 'Error occurred in recognition: ' + event.error;
      restartSpeech();
    }
  }
  
  recognition.onaudiostart = function(event) {
    //Fired when the user agent has started to capture audio.
    console.log('SpeechRecognition.onaudiostart');
  }
  
  recognition.onaudioend = function(event) {
    //Fired when the user agent has finished capturing audio.
    console.log('SpeechRecognition.onaudioend');
    if (buttonState == 1) {
      restartSpeech();
    }
  }
  
  recognition.onend = function(event) {
    //Fired when the speech recognition service has disconnected.
    console.log('SpeechRecognition.onend');

    if (buttonState == -1) {
      console.log('SpeechRecognition.onstopped');
      socket.emit('status', 'onstopped');
      buttonState = 0;
      testButtonInfo.textContent = 'Press start to begin speech recognition';
      testButton.textContent = 'Start';
      testButton.disabled = false;
      recognition.stop();
    }
  }
  
  recognition.onnomatch = function(event) {
    //Fired when the speech recognition service returns a final result with no significant recognition. This may involve some degree of recognition, which doesn't meet or exceed the confidence threshold.
    console.log('SpeechRecognition.onnomatch');
  }
  
  recognition.onsoundstart = function(event) {
    //Fired when any sound — recognisable speech or not — has been detected.
    if (buttonState == 1) {
      console.log('SpeechRecognition.onsoundstart');
    }
  }
  
  recognition.onsoundend = function(event) {
    //Fired when any sound — recognisable speech or not — has stopped being detected.
    if (buttonState == 1) {
      console.log('SpeechRecognition.onsoundend');
      socket.emit('status', 'onsoundend');
    }
  }
  
  recognition.onspeechstart = function (event) {
    //Fired when sound that is recognised by the speech recognition service as speech has been detected.
    if (buttonState == 1) {
      console.log('SpeechRecognition.onspeechstart');
      socket.emit('status', 'onspeechstart');
    }
  }
  recognition.onstart = function(event) {
    //Fired when the speech recognition service has begun listening to incoming audio with intent to recognize grammars associated with the current SpeechRecognition.
    console.log('SpeechRecognition.onstart');
  }
}

testButton.addEventListener('click', speechButton);
//optionsButton.addEventListener('click', toggleOptions);
//transcriptButton.addEventListener('click', toggleTranscript);
