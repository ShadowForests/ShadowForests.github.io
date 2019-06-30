var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;
var SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent;

// Setup

var socket = io.connect('http://localhost:3000');

socket.on('connect_error', () => {
  console.log("SOCKET: Restart to reconnect socket if using a personal server.");
  socket.disconnect();
});

var diagnosticPara = document.querySelector('label#outputDiag');
var outputConfidence = document.querySelector('label#outputConfidence');

const testButtonInfo = document.querySelector('p#testButtonInfo');
const testButton = document.querySelector('button#testButton');
//const optionsButton = document.querySelector('button#optionsButton');
//const transcriptButton = document.querySelector('button#transcriptButton');
const optionsButton = $('button#optionsButton');
const transcriptButton = $('input#transcript-checkbox');
const confidenceButton = $('input#confidence-checkbox');
const options = document.querySelector('div#options');
//const transcript = document.querySelector('div#transcript');
const audioInputSelect = document.querySelector('select#audioSource');
const audioOutputSelect = document.querySelector('select#audioOutput');
const selectors = [audioInputSelect, audioOutputSelect];

var buttonState = 0;
const interim_wait = 300;

var recognition = new SpeechRecognition();

// Buttons & Utility

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

//

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
      option.text = deviceInfo.label || `microphone ${audioInputSelect.length + 1}`;
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

function changeAudioDestination() {
  const audioDestination = audioOutputSelect.value;
}

function gotStream(stream) {
  window.stream = stream; // make stream available to console
  // Refresh button list in case labels have become available
  return navigator.mediaDevices.enumerateDevices();
}

function handleError(error) {
  console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
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

audioInputSelect.onchange = start;
audioOutputSelect.onchange = changeAudioDestination;

start();

//

var speech_playing = false;
var speech_buffer = [];
var timeout_times = 0;

async function play_audio(audio) {
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
        return;
      } else {
        play_audio(audio);
        return;
      }
    });
}

function play_tts(speech, split=true) {
  //~console.log("play_tts");
  if (speech == "") {
    return;
  }
  try {
    //~console.log("try play_tts");
    console.log(speech.join(" "));
    var speech = speech;
    if (split) {
      speech = speech.splice().split(" ");
    }
    let lang = 'en-us';
    let audio_url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${lang}&q=${speech.join("-")}`;
    var audio = new Audio(audio_url);
    play_audio(audio);
  } catch (err) {
    //~console.log("error play_tts");
    console.error(err);
    speech_playing = false;
  }
}

var last_interim_speech = [];
var interim_speech_index = 0;

async function play_buffered_tts(speech, split=true) {
  //~console.log("buffered tts");
  speech_buffer.push(speech);
  while (speech_playing) {
    await wait(100);
  }
  play_tts(speech_buffer.shift(), split);
}

async function play_interim_tts(interim_speech) {
  //~console.log("interim tts");
  console.log("ERER");
  console.log(interim_speech);
  interim_speech = interim_speech.split(" ");
  console.log(interim_speech);
  console.log(interim_speech.length);
  console.log(interim_speech_index);
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

  recognition.lang = 'en-US';
  recognition.continuous = true;
  recognition.interimResults = true;
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
      }
      diagnosticPara.textContent = 'Speech received: ' + speechResult;
      outputConfidence.textContent = 'Confidence: ' + confidenceResult;

      socket.emit('speech', speechResult);

      //console.log('Confidence: ' + event.results[event.results.length-1][0].confidence);
    }

    play_interim_tts(interim_transcript);
  }

  recognition.onspeechend = function() {
    recognition.stop();
    //testButton.disabled = false;
    //testButton.textContent = 'Start';
    if (buttonState == 1) {
      recognition = new SpeechRecognition();
      testSpeech();
    }
  }

  recognition.onerror = function(event) {
    //testButton.disabled = false;
    //testButton.textContent = 'Start';
    if (buttonState == 1) {
      diagnosticPara.textContent = 'Error occurred in recognition: ' + event.error;
      testSpeech();
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
      	recognition = new SpeechRecognition();
        testSpeech();
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
