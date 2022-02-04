import * as wss from "./wss.js";
import * as constants from "./constants.js";
import * as ui from "./ui.js";
import * as store from "./store.js";


let connectedUserDetails;

const defaultConstraints={
    audio:true,
    video:true
}
export const getLocalPreview=()=>{
    navigator.mediaDevices.getUserMedia(defaultConstraints)
    .then((stream)=>{
        ui.updateLocalVideo(stream);
        store.setLocalStream(stream);
    }).catch((err)=>{
        console.log("error occured when trying to get an access to camera");
        console.log(err);
    })
}

export const sendPreOffer = (callType,calleePersonalCode)=>{
//console.log("pre offer executed ");
//console.log(callType);
//console.log(calleePersonalCode);
connectedUserDetails={
    callType,
    socketId:calleePersonalCode
};
if(callType===constants.callType.CHAT_PERSONAL_CODE|| callType===constants.callType.VIDEO_PERSONAL_CODE){

    const data={
        callType,
        calleePersonalCode
    };
    ui.showCallinglDialog(callingDialogueRejectCallHandler);
    wss.sendPreOffer(data);

}




};

export const handlePreOffer =(data)=>{
   const {callType,callerSocketId}=data;

   connectedUserDetails={
       socketId:callerSocketId,
       callType,
   };
   if(callType===constants.callType.CHAT_PERSONAL_CODE||callType===constants.callType.VIDEO_PERSONAL_CODE){
       ui.showIncomingCallDialog(callType,acceptCallHandler,rejectCallHandler);
   }
};
const acceptCallHandler=()=>{
    console.log("call accepted");
    sendPreOfferAnswer(constants.preOfferAnswer.CALL_ACCEPTED);
    ui.showCallElements(connectedUserDetails.callType);
   }
const rejectCallHandler=()=>{
    console.log("call rejected");
    sendPreOfferAnswer(constants.preOfferAnswer.CALL_REJECTED);
   }

const callingDialogueRejectCallHandler=()=>{
    console.log("rejecting the call");
}

const sendPreOfferAnswer=(preOfferAnswer)=>{
    const data={
        callerSocketId:connectedUserDetails.socketId,
        preOfferAnswer
    }
    ui.removeAllDialogs();
    wss.sendPreOfferAnswer(data);
};

export const handlePreOfferAnswer=(data)=>{
    const {preOfferAnswer}=data;
    console.log('pre offer answer came');
    console.log(data);

    ui.removeAllDialogs();
    if(preOfferAnswer===constants.preOfferAnswer.CALLEE_NOT_FOUND){
        //SHOW DIALOG CALLEE NOT FOUND
        ui.showInfoDialog(preOfferAnswer);
    }
    if(preOfferAnswer===constants.preOfferAnswer.CALL_UNAVAILABLE){
        //SHOW DIALOG CALL_UNAVAILABLE
        ui.showInfoDialog(preOfferAnswer);
    }
    if(preOfferAnswer===constants.preOfferAnswer.CALL_REJECTED){
        //SHOW DIALOG CALL_REJECTED
        ui.showInfoDialog(preOfferAnswer);
    }
    if(preOfferAnswer===constants.preOfferAnswer.CALL_ACCEPTED){
        //SEND WEBRTC OFFER
        ui.showCallElements(connectedUserDetails.callType);
    }

};