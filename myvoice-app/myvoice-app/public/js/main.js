import * as store from "./store.js";
import * as wss from "./wss.js";
import * as webRTCHandler from "./webRTCHandler.js";
import * as constants from "./constants.js";
import * as ui from "./ui.js";
import * as recordingUtils from "./recordingUtils.js";
import * as strangerUtils from "./strangerUtils.js";
import * as ai from "../AiModel/script.js";

//inatialization of socket io connection
const socket = io("/");
wss.registerSocketEvents(socket);
webRTCHandler.getLocalPreview();


//register event for personal code copy button
const  personalCodeCopyButton=document.getElementById("personal_code_copy_button");
personalCodeCopyButton.addEventListener('click',()=>{
    const personalCode = store.getState().socketId;
    navigator.clipboard && navigator.clipboard.writeText(personalCode);
});

//register event listner for connection buttons
const personalCodeChatButton=document.getElementById("personal_code_chat_button");
const personalCodeVideoButton=document.getElementById("personal_code_video_button");

personalCodeChatButton.addEventListener('click',()=>{
    const calleePersonalCode=document.getElementById("personal_code_input").value;
    const callType=constants.callType.CHAT_PERSONAL_CODE;
    webRTCHandler.sendPreOffer(callType,calleePersonalCode);

});

personalCodeVideoButton.addEventListener('click',()=>{
    const calleePersonalCode=document.getElementById("personal_code_input").value;
    const callType=constants.callType.VIDEO_PERSONAL_CODE;
    webRTCHandler.sendPreOffer(callType,calleePersonalCode);
    
});

const strangerChatButton=document.getElementById("stranger_chat_button");
strangerChatButton.addEventListener('click',()=>{
  // logic
    strangerUtils.getStrangerSocketIdAndConnect(constants.callType.CHAT_STRANGER);
});

const strangerVideoButton=document.getElementById("stranger_video_button");
strangerVideoButton.addEventListener('click',()=>{
  // logic
  strangerUtils.getStrangerSocketIdAndConnect(constants.callType.VIDEO_STRANGER);

});

// register events to allow connections from strangers
const checkbox=document.getElementById("allow_strangers_checkbox");
checkbox.addEventListener("click",()=>{
  const checkboxState=store.getState().allowConnectionsFromStrangers;
  ui.updateStrangerCheckbox(!checkboxState);
  store.setAllowConnectionsFromStrangers(!checkboxState);
  strangerUtils.changeStrangerConnectionStatus(!checkboxState);
})

// event listeners for video call buttons

const micButton = document.getElementById("mic_button");
micButton.addEventListener("click", () => {
  const localStream = store.getState().localStream;
  const micEnabled = localStream.getAudioTracks()[0].enabled;
  localStream.getAudioTracks()[0].enabled = !micEnabled;
  ui.updateMicButton(micEnabled);
});

const cameraButton = document.getElementById("camera_button");
cameraButton.addEventListener("click", () => {
  const localStream = store.getState().localStream;
  const cameraEnabled = localStream.getVideoTracks()[0].enabled;
  localStream.getVideoTracks()[0].enabled = !cameraEnabled;
  ui.updateCameraButton(cameraEnabled);
});

const switchForScreenSharingButton=document.getElementById('screen_sharing_button');
switchForScreenSharingButton.addEventListener("click", () => {
    const screenSharingActive = store.getState().screenSharingActive;
    webRTCHandler.switchBetweenCameraAndScreenSharing(screenSharingActive);
  });
//ai model
///////////////////////////////////////
 // More API functions here:
    // https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/image

    // the link to your model provided by Teachable Machine export panel
    const URL = "../AiModel/my_model/";

    let model, webcam, labelContainer, maxPredictions;

    // Load the image model and setup the webcam
   export async function init() {
        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";

        // load the model and metadata
        // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
        // or files from your local hard drive
        // Note: the pose library adds "tmImage" object to your window (window.tmImage)
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        // Convenience function to setup a webcam
        const flip = true; // whether to flip the webcam
        webcam = new tmImage.Webcam(0, 0, flip); // width, height, flip
        await webcam.setup(); // request access to the webcam
        //await webcam.play();
        window.requestAnimationFrame(loop);

        // append elements to the DOM
        document.getElementById("webcam-container").appendChild(webcam.canvas);
        labelContainer = document.getElementById("label-container");
        //for (let i = 0; i < maxPredictions; i++) { // and class labels
            labelContainer.appendChild(document.createElement("div"));
        //}
    }

    async function loop() {
       // webcam.update(); // update the webcam frame
        await predict();
        window.requestAnimationFrame(loop);
    }
    let remote_video=document.getElementById("remote_video");
    // run the webcam image through the image model
    async function predict() {
        // predict can take in an image, video or canvas html element
        const prediction = await model.predict(remote_video);
        let mx=0,index=0;
        for (let i = 0; i < maxPredictions; i++) {
        if(prediction[i].probability>mx){
          mx=prediction[i].probability;
          index=i;
        }
      }
           const classPrediction =
                prediction[index].className + ": " + prediction[index].probability.toFixed(2);
            labelContainer.childNodes[0].innerHTML = classPrediction;
        
    }

//////////////////////////////////////

//ai model
const enableWebcamButton = document.getElementById('ai_model');
enableWebcamButton.addEventListener('click', ()=>{
  const modelState = store.getState().aiModel;
  if(modelState== false)
  {
    const labelContainer=document.getElementById('label-container');
    labelContainer.style.display='flex';
    store.setAiModel(true);
    init();
    
  }
  else
  {
    const labelContainer=document.getElementById('label-container');
    labelContainer.style.display='none';
    store.setAiModel(false);
  }

});

  
// messenger
const newMessageInput=document.getElementById('new_message_input');
newMessageInput.addEventListener('keydown',(event)=>{
    console.log('change occured');
    const key=event.key;

    if(key === 'Enter'){
        webRTCHandler.sendMessageUsingDataChannel(event.target.value);
        ui.appendMessage(event.target.value,true);
        newMessageInput.value='';
    }
});

const sendMessageButton=document.getElementById('send_message_button');
sendMessageButton.addEventListener('click',()=>{
    const message = newMessageInput.value;
    webRTCHandler.sendMessageUsingDataChannel(message);
    ui.appendMessage(message,true);
    newMessageInput.value='';
})



//recording
const startRecordingButton = document.getElementById("start_recording_button");
startRecordingButton.addEventListener("click", () => {
  recordingUtils.startRecording();
  ui.showRecordingPanel();
});

const stopRecordingButton = document.getElementById("stop_recording_button");
stopRecordingButton.addEventListener("click", () => {
  recordingUtils.stopRecording();
  ui.resetRecordingButtons();
});


const pauseRecordingButton = document.getElementById("pause_recording_button");
pauseRecordingButton.addEventListener("click", () => {
  recordingUtils.pauseRecording();
  ui.switchRecordingButtons(true);
});

const resumeRecordingButton = document.getElementById("resume_recording_button");
resumeRecordingButton.addEventListener("click", () => {
  recordingUtils.resumeRecording();
  ui.switchRecordingButtons();
});


// hang up

const hangUpButton=document.getElementById('hang_up_button');
hangUpButton.addEventListener('click',()=>{
  const labelContainer=document.getElementById('label-container');
    labelContainer.style.display='none';
    store.setAiModel(false);
    webRTCHandler.handleHangUp();
});

const hangUpChatButton=document.getElementById('finish_chat_call_button');
hangUpChatButton.addEventListener('click',()=>{
    webRTCHandler.handleHangUp();
});