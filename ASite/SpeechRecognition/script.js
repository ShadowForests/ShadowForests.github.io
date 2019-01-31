var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;
var SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent;
var socket = io.connect('http://localhost:3000');

var diagnosticPara = document.querySelector('.output');

var testBtn = document.querySelector('button');
var buttonState = 0;

var recognition = new SpeechRecognition();

function speechButton() {
  if (buttonState < 1) {
    buttonState = 1;
    testBtn.textContent = 'Stop';
    testSpeech();
  } else {
    buttonState = -1;
    testBtn.disabled = true;
    testBtn.textContent = 'Stopping...';
    recognition.onend();
  }
}

function testSpeech() {
  //testBtn.disabled = true;
  //testBtn.textContent = 'In progress';

  // To ensure case consistency while checking with the returned output text
  // diagnosticPara.textContent = '...diagnostic messages';

  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.start();

  recognition.onresult = function(event) {
    // The SpeechRecognitionEvent results property returns a SpeechRecognitionResultList object
    // The SpeechRecognitionResultList object contains SpeechRecognitionResult objects.
    // It has a getter so it can be accessed like an array
    // The first [0] returns the SpeechRecognitionResult at position 0.
    // Each SpeechRecognitionResult object contains SpeechRecognitionAlternative objects that contain individual results.
    // These also have getters so they can be accessed like arrays.
    // The second [0] returns the SpeechRecognitionAlternative at position 0.
    // We then return the transcript property of the SpeechRecognitionAlternative object 
    if (buttonState == 1) {
      var speechResult = event.results[0][0].transcript;
      diagnosticPara.textContent = 'Speech received: ' + speechResult + '. | Confidence: ' + event.results[0][0].confidence;

      socket.emit('speech', speechResult);

      console.log('Confidence: ' + event.results[0][0].confidence);
    }
  }

  recognition.onspeechend = function() {
    recognition.stop();
    //testBtn.disabled = false;
    //testBtn.textContent = 'Start';
    if (buttonState == 1) {
      testSpeech();
    }
  }

  recognition.onerror = function(event) {
    //testBtn.disabled = false;
    //testBtn.textContent = 'Start';
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
        testBtn.textContent = 'Start';
        testBtn.disabled = false;
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

testBtn.addEventListener('click', speechButton);
